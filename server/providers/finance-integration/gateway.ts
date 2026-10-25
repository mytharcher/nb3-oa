import { createHash } from 'node:crypto';
import { z } from 'zod';

const cents = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const FinanceDocument = z
  .object({
    schemaVersion: z.literal(1),
    source: z
      .object({
        instanceId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/u),
        kind: z.enum(['reimbursement', 'payment']),
        id: z.string().min(1).max(128),
        number: z.string().min(1).max(128),
      })
      .strict(),
    currency: z.literal('CNY'),
    applicantId: z.string().min(1).max(128),
    departmentId: z.string().max(128).nullable(),
    vendorId: z.string().max(128).nullable().optional(),
    purchaseOrderId: z.string().max(128).nullable().optional(),
    contractId: z.string().max(128).nullable().optional(),
    amountCents: cents,
    offsetCents: cents,
    paidCents: cents,
    forced: z.boolean(),
    lines: z
      .array(
        z
          .object({
            category: z.string().min(1).max(128),
            date: z.iso.date(),
            amountCents: cents,
            invoiceNumber: z.string().max(128),
          })
          .strict(),
      )
      .max(500),
  })
  .strict()
  .superRefine((document, context) => {
    if (document.amountCents - document.offsetCents !== document.paidCents)
      context.addIssue({
        code: 'custom',
        path: ['paidCents'],
        message: 'Paid amount must equal total minus loan offset.',
      });
    if (
      document.source.kind === 'payment' &&
      (document.offsetCents !== 0 || document.lines.length !== 0)
    )
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message: 'Payment facts cannot contain reimbursement lines or offsets.',
      });
    if (
      document.source.kind === 'reimbursement' &&
      document.lines.reduce(
        (sum, line) => sum + BigInt(line.amountCents),
        0n,
      ) !== BigInt(document.amountCents)
    )
      context.addIssue({
        code: 'custom',
        path: ['lines'],
        message: 'Expense lines must reconcile to the total.',
      });
  });
export type FinanceDocument = z.infer<typeof FinanceDocument>;
export interface FinanceEnvelope extends FinanceDocument {
  idempotencyKey: string;
  payloadHash: string;
}
export function financeEnvelope(input: FinanceDocument): FinanceEnvelope {
  // The schema defines property order and excludes private fields from the wire contract.
  const document = FinanceDocument.parse(input);
  const { instanceId, kind, id } = document.source;
  return {
    ...document,
    idempotencyKey:
      'oa-finance-' +
      createHash('sha256')
        .update(JSON.stringify([instanceId, kind, id]))
        .digest('hex'),
    payloadHash: createHash('sha256')
      .update(JSON.stringify(document))
      .digest('hex'),
  };
}

export interface FinanceGatewayConfig {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}
const Receipt = z
  .object({
    idempotencyKey: z.string(),
    payloadHash: z.string(),
    state: z.enum(['accepted', 'posted', 'rejected']),
    externalId: z.string().min(1).max(128).optional(),
    voucherNumber: z.string().min(1).max(128).optional(),
    reasonCode: z
      .enum([
        'invalid_mapping',
        'invalid_document',
        'duplicate_source',
        'accounting_period_closed',
        'other',
      ])
      .optional(),
  })
  .strict()
  .refine(
    (receipt) =>
      receipt.state !== 'posted' ||
      !!(receipt.externalId && receipt.voucherNumber),
  );
export type FinanceGatewayResult =
  | z.infer<typeof Receipt>
  | { state: 'unknown'; code: 'transport' | 'unconfirmed' | 'invalid_receipt' }
  | { state: 'not_found' };

/** Fixed gateway protocol. The configured endpoint is deployment-owned, never supplied by a request. */
export class FinanceGateway {
  private readonly base: URL;
  private readonly timeout: number;
  constructor(
    private readonly config: FinanceGatewayConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.base = new URL(config.baseUrl);
    if (
      this.base.protocol !== 'https:' ||
      this.base.username ||
      this.base.password ||
      this.base.search ||
      this.base.hash ||
      !config.token.trim()
    )
      throw new Error(
        'Finance gateway requires HTTPS without URL credentials/query/fragment and a bearer secret.',
      );
    if (!this.base.pathname.endsWith('/')) this.base.pathname += '/';
    this.timeout = config.timeoutMs ?? 10000;
    if (
      !Number.isInteger(this.timeout) ||
      this.timeout < 1000 ||
      this.timeout > 30000
    )
      throw new Error(
        'Finance gateway timeout must be between 1000 and 30000 ms.',
      );
  }
  submit(envelope: FinanceEnvelope): Promise<FinanceGatewayResult> {
    const canonical = financeEnvelope(envelopeDocument(envelope));
    if (
      canonical.idempotencyKey !== envelope.idempotencyKey ||
      canonical.payloadHash !== envelope.payloadHash
    )
      throw new Error(
        'Finance payload changed after its durable identity was assigned.',
      );
    return this.request('POST', 'v1/finance/entries', envelope);
  }
  lookup(
    envelope: Pick<FinanceEnvelope, 'idempotencyKey' | 'payloadHash'>,
  ): Promise<FinanceGatewayResult> {
    return this.request(
      'GET',
      `v1/finance/entries/by-key/${encodeURIComponent(envelope.idempotencyKey)}`,
      envelope,
    );
  }
  private async request(
    method: 'GET' | 'POST',
    route: string,
    envelope: Pick<FinanceEnvelope, 'idempotencyKey' | 'payloadHash'>,
  ): Promise<FinanceGatewayResult> {
    try {
      const response = await this.fetcher(new URL(route, this.base), {
        method,
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeout),
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
          'idempotency-key': envelope.idempotencyKey,
        },
        ...(method === 'POST' ? { body: JSON.stringify(envelope) } : {}),
      });
      if (method === 'GET' && response.status === 404)
        return { state: 'not_found' };
      // A failed HTTP request does not prove whether the remote system committed a voucher.
      if (!response.ok) return { state: 'unknown', code: 'unconfirmed' };
      const body = await boundedJson(response);
      const receipt = Receipt.safeParse(body);
      if (
        !receipt.success ||
        receipt.data.idempotencyKey !== envelope.idempotencyKey ||
        receipt.data.payloadHash !== envelope.payloadHash
      )
        return { state: 'unknown', code: 'invalid_receipt' };
      return receipt.data;
    } catch {
      // Do not propagate upstream URLs, tokens, body text or network diagnostics to UI/audit.
      return { state: 'unknown', code: 'transport' };
    }
  }
}
function envelopeDocument(envelope: FinanceEnvelope): FinanceDocument {
  const { idempotencyKey: _key, payloadHash: _hash, ...document } = envelope;
  return document;
}
async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('Missing receipt');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = (await reader.read()) as {
        done: boolean;
        value?: unknown;
      };
      if (done) break;
      if (!(value instanceof Uint8Array))
        throw new Error('Invalid receipt stream');
      size += value.length;
      if (size > 65536) {
        await reader.cancel();
        throw new Error('Oversized receipt');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

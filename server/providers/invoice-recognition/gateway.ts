import { createHash } from 'node:crypto';
import { z } from 'zod';
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const amount = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const InvoiceFacts = z
  .object({
    number: z.string().trim().min(1).max(128),
    date: z.iso.date(),
    amountCents: amount,
  })
  .strict();
export type InvoiceFacts = z.infer<typeof InvoiceFacts>;
const Identity = z
  .object({
    instanceId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
    actorId: z.string().min(1).max(255),
    recordId: z.string().min(1).max(128),
    lineId: z.string().min(1).max(128),
    fileId: z.string().min(1).max(128),
    fileHash: hash,
  })
  .strict();
export type InvoiceIdentity = z.infer<typeof Identity>;
export type InvoiceEnvelope = {
  schemaVersion: 1;
  operation: 'recognize' | 'verify';
  operationKey: string;
  contentHash: string;
  identity: InvoiceIdentity;
  facts?: InvoiceFacts;
};
export function invoiceEnvelope(
  identity: InvoiceIdentity,
  operation: 'recognize' | 'verify',
  facts?: InvoiceFacts,
): InvoiceEnvelope {
  const normalized = Identity.parse(identity);
  const values = operation === 'verify' ? InvoiceFacts.parse(facts) : undefined;
  const contentHash = createHash('sha256')
    .update(JSON.stringify({ operation, identity: normalized, facts: values }))
    .digest('hex');
  return {
    schemaVersion: 1,
    operation,
    operationKey: `oa-invoice-${contentHash}`,
    contentHash,
    identity: normalized,
    ...(values ? { facts: values } : {}),
  };
}
const Recognized = z
  .object({
    operationKey: z.string(),
    contentHash: hash,
    state: z.enum(['recognized', 'multiple', 'unreadable', 'rejected']),
    facts: InvoiceFacts.optional(),
  })
  .strict()
  .refine((value) =>
    value.state === 'recognized' ? !!value.facts : value.facts === undefined,
  );
const Verified = z
  .object({
    operationKey: z.string(),
    contentHash: hash,
    state: z.enum(['valid', 'mismatch', 'not_found', 'rejected']),
    reference: z.string().min(1).max(128),
    checkedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type InvoiceResult =
  | z.infer<typeof Recognized>
  | z.infer<typeof Verified>
  | {
      state: 'unknown';
      code: 'transport' | 'invalid_receipt' | 'unconfirmed' | 'not_found';
    };
export interface InvoiceGatewayConfig {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}
export class InvoiceGateway {
  private readonly base: URL;
  private readonly timeout: number;
  constructor(
    private readonly config: InvoiceGatewayConfig,
    private readonly fetcher: typeof fetch = fetch,
    private readonly clock: () => Date = () => new Date(),
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
        'Invoice gateway requires a deployment-owned HTTPS URL and bearer secret.',
      );
    if (!this.base.pathname.endsWith('/')) this.base.pathname += '/';
    this.timeout = config.timeoutMs ?? 10000;
    if (
      !Number.isInteger(this.timeout) ||
      this.timeout < 1000 ||
      this.timeout > 30000
    )
      throw new Error('Invalid invoice gateway timeout.');
  }
  submit(
    envelope: InvoiceEnvelope,
    file?: { mimeType: string; bytes: Uint8Array },
  ): Promise<InvoiceResult> {
    const canonical = invoiceEnvelope(
      envelope.identity,
      envelope.operation,
      envelope.facts,
    );
    if (
      canonical.operationKey !== envelope.operationKey ||
      canonical.contentHash !== envelope.contentHash
    )
      throw new Error('Invoice operation changed after identity assignment.');
    let document:
      { mimeType: string; sha256: string; base64: string } | undefined;
    if (envelope.operation === 'recognize') {
      if (!file || !validFile(file))
        throw new Error(
          'Recognition requires a matching PDF, JPEG or PNG of at most 5 MiB.',
        );
      const sha256 = createHash('sha256').update(file.bytes).digest('hex');
      if (sha256 !== envelope.identity.fileHash)
        throw new Error('Invoice attachment content changed.');
      document = {
        mimeType: file.mimeType,
        sha256,
        base64: Buffer.from(file.bytes).toString('base64'),
      };
    }
    // Do not forward unexpected caller-owned keys, filenames or URLs.
    return this.request(
      'POST',
      `v1/invoices/${envelope.operation}`,
      canonical,
      document,
    );
  }
  lookup(envelope: InvoiceEnvelope): Promise<InvoiceResult> {
    return this.request(
      'GET',
      `v1/invoices/operations/by-key/${encodeURIComponent(envelope.operationKey)}`,
      envelope,
    );
  }
  private async request(
    method: 'GET' | 'POST',
    route: string,
    envelope: InvoiceEnvelope,
    document?: object,
  ): Promise<InvoiceResult> {
    try {
      const response = await this.fetcher(new URL(route, this.base), {
        method,
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeout),
        headers: {
          authorization: `Bearer ${this.config.token}`,
          'content-type': 'application/json',
          'idempotency-key': envelope.operationKey,
        },
        ...(method === 'POST'
          ? {
              body: JSON.stringify({
                ...envelope,
                ...(document ? { document } : {}),
              }),
            }
          : {}),
      });
      if (method === 'GET' && response.status === 404)
        return { state: 'unknown', code: 'not_found' };
      if (!response.ok) return { state: 'unknown', code: 'unconfirmed' };
      const body = await boundedJson(response);
      const receipt = (
        envelope.operation === 'recognize' ? Recognized : Verified
      ).safeParse(body);
      if (
        !receipt.success ||
        receipt.data.operationKey !== envelope.operationKey ||
        receipt.data.contentHash !== envelope.contentHash ||
        ('checkedAt' in receipt.data &&
          new Date(receipt.data.checkedAt).getTime() >
            this.clock().getTime() + 300000)
      )
        return { state: 'unknown', code: 'invalid_receipt' };
      return receipt.data;
    } catch {
      return { state: 'unknown', code: 'transport' };
    }
  }
}
function validFile(file: { mimeType: string; bytes: Uint8Array }): boolean {
  const b = file.bytes;
  if (!b.length || b.length > 5 * 1024 * 1024) return false;
  if (file.mimeType === 'application/pdf')
    return Buffer.from(b.subarray(0, 5)).toString('ascii') === '%PDF-';
  if (file.mimeType === 'image/jpeg')
    return b[0] === 255 && b[1] === 216 && b[2] === 255;
  return (
    file.mimeType === 'image/png' &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => b[index] === value,
    )
  );
}
async function boundedJson(response: Response): Promise<unknown> {
  if (!response.body) throw new Error('Missing receipt');
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = (await reader.read()) as {
        done: boolean;
        value?: unknown;
      };
      if (done) break;
      if (!(value instanceof Uint8Array)) throw new Error('Invalid stream');
      size += value.length;
      if (size > 65536) {
        await reader.cancel();
        throw new Error('Receipt too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

import { createHash } from 'node:crypto';
import { z } from 'zod';
export const MAX_SIGNATURE_FILE = 20 * 1024 * 1024;
export const digest = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const Document = z
  .object({
    schemaVersion: z.literal(1),
    source: z
      .object({
        instanceId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/u),
        kind: z.enum(['contract', 'seal']),
        id: z.string().min(1).max(64),
        version: z.string().min(1).max(128),
        number: z.string().max(128).nullable(),
      })
      .strict(),
    document: z
      .object({
        filename: z.string().min(1).max(255),
        mimeType: z.literal('application/pdf'),
        sha256: Hash,
        base64: z
          .string()
          .min(1)
          .max(Math.ceil(MAX_SIGNATURE_FILE / 3) * 4),
      })
      .strict(),
  })
  .strict();
export type SignatureDocument = z.infer<typeof Document>;
export interface SignatureEnvelope extends SignatureDocument {
  idempotencyKey: string;
  payloadHash: string;
}
export function signatureEnvelope(input: SignatureDocument): SignatureEnvelope {
  const document = Document.parse(input),
    bytes = Buffer.from(document.document.base64, 'base64');
  if (!validPdf(bytes) || digest(bytes) !== document.document.sha256)
    throw new Error('Invalid signature document');
  return {
    ...document,
    idempotencyKey:
      'oa-signature-' +
      digest(
        JSON.stringify([
          document.source.instanceId,
          document.source.kind,
          document.source.id,
          document.source.version,
        ]),
      ),
    payloadHash: digest(JSON.stringify(document)),
  };
}
export function validPdf(bytes: Buffer) {
  return (
    bytes.length > 5 &&
    bytes.length <= MAX_SIGNATURE_FILE &&
    bytes.subarray(0, 5).toString() === '%PDF-'
  );
}
const Receipt = z
  .object({
    idempotencyKey: z.string(),
    payloadHash: Hash,
    state: z.enum(['accepted', 'signing', 'signed', 'rejected', 'cancelled']),
    externalId: z.string().min(1).max(128),
    signingPath: z.string().max(2000).optional(),
    signedAt: z.iso.datetime().optional(),
    signedDocumentSha256: Hash.optional(),
    verification: z.literal('verified').optional(),
  })
  .strict()
  .refine(
    (r) =>
      r.state !== 'signed' ||
      !!(r.signedAt && r.signedDocumentSha256 && r.verification),
  );
export type SignatureReceipt = z.infer<typeof Receipt>;
export type SignatureResult =
  SignatureReceipt | { state: 'unknown' } | { state: 'not_found' };
export interface SignatureGatewayConfig {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}
export class SignatureGateway {
  private readonly base: URL;
  private readonly timeout: number;
  constructor(
    private readonly config: SignatureGatewayConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.base = new URL(config.baseUrl);
    this.timeout = config.timeoutMs ?? 10000;
    if (
      this.base.protocol !== 'https:' ||
      this.base.username ||
      this.base.password ||
      this.base.search ||
      this.base.hash ||
      !config.token.trim() ||
      this.timeout < 1000 ||
      this.timeout > 30000
    )
      throw new Error('Invalid signature gateway configuration');
    if (!this.base.pathname.endsWith('/')) this.base.pathname += '/';
  }
  signingUrl(path: string): string | null {
    // Decode before checking too: URL parsing can normalize encoded separators and backslashes.
    let decoded: string;
    try {
      decoded = decodeURIComponent(path);
    } catch {
      return null;
    }
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[\\\r\n]/u.test(path) ||
      decoded.startsWith('//') ||
      /[\\\r\n]/u.test(decoded) ||
      /%(?:2f|5c|25)/iu.test(decoded)
    )
      return null;
    const url = new URL(path, this.base);
    return url.origin === this.base.origin && !url.username && !url.password
      ? url.href
      : null;
  }
  submit(envelope: SignatureEnvelope) {
    const { idempotencyKey, payloadHash, ...document } = envelope,
      canonical = signatureEnvelope(document);
    if (
      canonical.idempotencyKey !== idempotencyKey ||
      canonical.payloadHash !== payloadHash
    )
      throw new Error('Signature document changed');
    return this.request('POST', 'v1/signatures', envelope);
  }
  lookup(envelope: Pick<SignatureEnvelope, 'idempotencyKey' | 'payloadHash'>) {
    return this.request(
      'GET',
      `v1/signatures/by-key/${encodeURIComponent(envelope.idempotencyKey)}`,
      envelope,
    );
  }
  private async request(
    method: 'GET' | 'POST',
    route: string,
    envelope: Pick<SignatureEnvelope, 'idempotencyKey' | 'payloadHash'>,
  ): Promise<SignatureResult> {
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
      if (!response.ok) return { state: 'unknown' };
      const receipt = Receipt.safeParse(
        JSON.parse((await boundedBytes(response, 65536)).toString('utf8')),
      );
      if (
        !receipt.success ||
        receipt.data.idempotencyKey !== envelope.idempotencyKey ||
        receipt.data.payloadHash !== envelope.payloadHash ||
        (receipt.data.signedAt &&
          Date.parse(receipt.data.signedAt) > Date.now()) ||
        (receipt.data.signingPath && !this.signingUrl(receipt.data.signingPath))
      )
        return { state: 'unknown' };
      return receipt.data;
    } catch {
      return { state: 'unknown' };
    }
  }
  async document(key: string, hash: string): Promise<Buffer | null> {
    try {
      const response = await this.fetcher(
        new URL(
          `v1/signatures/by-key/${encodeURIComponent(key)}/document`,
          this.base,
        ),
        {
          redirect: 'error',
          signal: AbortSignal.timeout(this.timeout),
          headers: { authorization: `Bearer ${this.config.token}` },
        },
      );
      if (
        !response.ok ||
        response.headers.get('content-type')?.split(';')[0].trim() !==
          'application/pdf'
      )
        return null;
      const bytes = await boundedBytes(response, MAX_SIGNATURE_FILE);
      return validPdf(bytes) && digest(bytes) === hash ? bytes : null;
    } catch {
      return null;
    }
  }
}
async function boundedBytes(response: Response, max: number): Promise<Buffer> {
  if (!response.body) throw new Error('Missing content');
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = (await reader.read()) as {
        value?: unknown;
        done: boolean;
      };
      if (done) break;
      if (!(value instanceof Uint8Array))
        throw new Error('Invalid response bytes');
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new Error('Oversized content');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

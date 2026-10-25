// @vitest-environment node
import { createHash } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import {
  InvoiceGateway,
  invoiceEnvelope,
} from '../../../server/providers/invoice-recognition/gateway.js';
const bytes = Buffer.from('%PDF-1.7 synthetic invoice');
const identity = {
  instanceId: 'test',
  actorId: 'owner',
  recordId: 'request',
  lineId: 'line',
  fileId: 'file',
  fileHash: createHash('sha256').update(bytes).digest('hex'),
};
const facts = { number: '000123', date: '2026-10-25', amountCents: 4500 };
const config = { baseUrl: 'https://gateway.example/oa', token: 'test-only' };
it('isolates identities across users, files, lines and edited facts', () => {
  const first = invoiceEnvelope(identity, 'verify', facts);
  expect(invoiceEnvelope(identity, 'verify', facts)).toEqual(first);
  for (const change of [
    { actorId: 'other' },
    { fileId: 'other' },
    { lineId: 'other' },
    { recordId: 'other' },
  ])
    expect(
      invoiceEnvelope({ ...identity, ...change }, 'verify', facts).operationKey,
    ).not.toBe(first.operationKey);
  expect(
    invoiceEnvelope(identity, 'verify', { ...facts, amountCents: 4501 })
      .operationKey,
  ).not.toBe(first.operationKey);
  expect(() =>
    invoiceEnvelope(identity, 'verify', { ...facts, amountCents: 1.2 }),
  ).toThrow();
});
it('sends a bounded, content-matched attachment only for recognition and rejects changed payloads', async () => {
  const envelope = invoiceEnvelope(identity, 'recognize');
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      Response.json({
        operationKey: envelope.operationKey,
        contentHash: envelope.contentHash,
        state: 'recognized',
        facts,
      }),
    );
  const gateway = new InvoiceGateway(config, fetcher);
  expect(
    await gateway.submit(envelope, { mimeType: 'application/pdf', bytes }),
  ).toMatchObject({ state: 'recognized', facts });
  const [url, init] = fetcher.mock.calls[0];
  expect(String(url)).toBe('https://gateway.example/oa/v1/invoices/recognize');
  expect(init?.redirect).toBe('error');
  const body = JSON.parse(String(init?.body));
  expect(body.document.base64).toBe(bytes.toString('base64'));
  expect(() =>
    gateway.submit(envelope, { mimeType: 'text/html', bytes }),
  ).toThrow();
  expect(() =>
    gateway.submit(envelope, {
      mimeType: 'application/pdf',
      bytes: Buffer.from('%PDF-other'),
    }),
  ).toThrow();
  expect(() =>
    gateway.submit(
      { ...envelope, contentHash: 'a'.repeat(64) },
      { mimeType: 'application/pdf', bytes },
    ),
  ).toThrow();
  expect(() =>
    gateway.submit(envelope, {
      mimeType: 'application/pdf',
      bytes: Buffer.alloc(5 * 1024 * 1024 + 1),
    }),
  ).toThrow();
});
it('does not treat ambiguous recognition or mismatched receipts as confirmed facts', async () => {
  const envelope = invoiceEnvelope(identity, 'recognize');
  const fetcher = vi.fn<typeof fetch>();
  const gateway = new InvoiceGateway(config, fetcher);
  const reply = (extra: object) =>
    Response.json({
      operationKey: envelope.operationKey,
      contentHash: envelope.contentHash,
      ...extra,
    });
  fetcher.mockResolvedValueOnce(reply({ state: 'multiple' }));
  expect(await gateway.lookup(envelope)).toMatchObject({ state: 'multiple' });
  for (const extra of [
    { state: 'recognized' },
    { state: 'multiple', facts },
    { state: 'recognized', facts, operationKey: 'foreign' },
    { state: 'recognized', facts, privateBuyer: 'unrequested' },
  ]) {
    fetcher.mockResolvedValueOnce(reply(extra));
    expect(await gateway.lookup(envelope)).toEqual({
      state: 'unknown',
      code: 'invalid_receipt',
    });
  }
});
it('requires an attributable verification receipt and rejects future time without leaking upstream errors', async () => {
  const envelope = invoiceEnvelope(identity, 'verify', facts);
  const fetcher = vi.fn<typeof fetch>();
  const gateway = new InvoiceGateway(
    config,
    fetcher,
    () => new Date('2026-10-25T07:00:00Z'),
  );
  const reply = (extra: object) =>
    Response.json({
      operationKey: envelope.operationKey,
      contentHash: envelope.contentHash,
      state: 'valid',
      reference: 'verification-1',
      checkedAt: '2026-10-25T06:59:00Z',
      ...extra,
    });
  fetcher.mockResolvedValueOnce(reply({}));
  expect(await gateway.submit(envelope)).toMatchObject({
    state: 'valid',
    reference: 'verification-1',
  });
  expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).not.toHaveProperty(
    'document',
  );
  for (const extra of [
    { checkedAt: '2026-10-26T00:00:00Z' },
    { reference: '' },
    { checkedAt: 'invalid' },
    { state: 'recognized', facts },
  ]) {
    fetcher.mockResolvedValueOnce(reply(extra));
    expect(await gateway.lookup(envelope)).toEqual({
      state: 'unknown',
      code: 'invalid_receipt',
    });
  }
  fetcher.mockRejectedValueOnce(new Error('secret endpoint response'));
  expect(await gateway.lookup(envelope)).toEqual({
    state: 'unknown',
    code: 'transport',
  });
  fetcher.mockResolvedValueOnce(new Response('', { status: 404 }));
  expect(await gateway.lookup(envelope)).toEqual({
    state: 'unknown',
    code: 'not_found',
  });
  fetcher.mockResolvedValueOnce(new Response('a'.repeat(65537)));
  expect(await gateway.lookup(envelope)).toMatchObject({ state: 'unknown' });
  fetcher.mockResolvedValueOnce(new Response('bad', { status: 503 }));
  expect(await gateway.lookup(envelope)).toEqual({
    state: 'unknown',
    code: 'unconfirmed',
  });
});
it('rejects insecure or ambiguous deployment destinations', () => {
  for (const baseUrl of [
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com?token=x',
    'https://example.com/#x',
  ])
    expect(() => new InvoiceGateway({ ...config, baseUrl })).toThrow();
  expect(() => new InvoiceGateway({ ...config, token: '' })).toThrow();
  expect(() => new InvoiceGateway({ ...config, timeoutMs: 999 })).toThrow();
});

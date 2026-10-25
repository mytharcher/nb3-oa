// @vitest-environment node
import { expect, it, vi } from 'vitest';
import {
  SignatureGateway,
  signatureEnvelope,
  digest,
} from '../../../server/providers/electronic-signatures/gateway.js';
const original = Buffer.from('%PDF-1.4\nsynthetic unsigned\n%%EOF'),
  signed = Buffer.from('%PDF-1.4\nsynthetic signed test artifact\n%%EOF');
const envelope = signatureEnvelope({
  schemaVersion: 1,
  source: {
    instanceId: 'test',
    kind: 'seal',
    id: 'one',
    version: 'version',
    number: 'S1',
  },
  document: {
    filename: 'test.pdf',
    mimeType: 'application/pdf',
    sha256: digest(original),
    base64: original.toString('base64'),
  },
});
const receipt = {
  idempotencyKey: envelope.idempotencyKey,
  payloadHash: envelope.payloadHash,
  state: 'signed',
  externalId: 'remote-1',
  signedAt: '2026-01-01T00:00:00Z',
  signedDocumentSha256: digest(signed),
  verification: 'verified',
};
it('requires verified identity, stable payload, hash and real PDF bytes', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(receipt))
    .mockResolvedValueOnce(
      new Response(signed, { headers: { 'content-type': 'application/pdf' } }),
    );
  const gateway = new SignatureGateway(
    { baseUrl: 'https://sign.example.test/gateway', token: 'synthetic' },
    fetcher,
  );
  expect((await gateway.submit(envelope)).state).toBe('signed');
  expect(
    await gateway.document(envelope.idempotencyKey, digest(signed)),
  ).toEqual(signed);
  expect(fetcher.mock.calls[0]![1]?.redirect).toBe('error');
  expect(
    JSON.parse(String(fetcher.mock.calls[0]![1]?.body)).idempotencyKey,
  ).toBe(envelope.idempotencyKey);
  await expect(async () =>
    gateway.submit({ ...envelope, payloadHash: '0'.repeat(64) }),
  ).rejects.toThrow();
});
it('never trusts mismatched, unverified or malformed receipts and documents', async () => {
  for (const body of [
    { ...receipt, payloadHash: '0'.repeat(64) },
    { ...receipt, verification: undefined },
    { ...receipt, signedAt: '2999-01-01T00:00:00Z' },
    { ...receipt, signingPath: '//attacker.test/' },
  ]) {
    const gateway = new SignatureGateway(
      { baseUrl: 'https://sign.example.test', token: 'test' },
      vi.fn().mockResolvedValue(Response.json(body)),
    );
    expect((await gateway.lookup(envelope)).state).toBe('unknown');
  }
  for (const response of [
    new Response('html', { headers: { 'content-type': 'application/pdf' } }),
    new Response(signed, { headers: { 'content-type': 'text/html' } }),
    new Response(original, { headers: { 'content-type': 'application/pdf' } }),
  ]) {
    const gateway = new SignatureGateway(
      { baseUrl: 'https://sign.example.test', token: 'test' },
      vi.fn().mockResolvedValue(response),
    );
    expect(
      await gateway.document(envelope.idempotencyKey, digest(signed)),
    ).toBeNull();
  }
});
it('signing navigation rejects alternate origins and encoded path bypasses', () => {
  const gateway = new SignatureGateway({
    baseUrl: 'https://sign.example.test',
    token: 'test',
  });
  for (const path of [
    '//evil.test',
    '/\\evil.test',
    '/%2f%2fevil.test',
    '/%255cevil.test',
    'https://evil.test',
    '/%0aevil',
  ])
    expect(gateway.signingUrl(path)).toBeNull();
  expect(gateway.signingUrl('/sign/123?ticket=opaque')).toBe(
    'https://sign.example.test/sign/123?ticket=opaque',
  );
});

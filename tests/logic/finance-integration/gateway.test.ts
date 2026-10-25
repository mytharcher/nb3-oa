// @vitest-environment node
import { expect, it, vi } from 'vitest';
import {
  FinanceGateway,
  financeEnvelope,
  type FinanceDocument,
} from '../../../server/providers/finance-integration/gateway.js';
const document: FinanceDocument = {
  schemaVersion: 1,
  source: {
    instanceId: 'oa-test',
    kind: 'reimbursement',
    id: '123',
    number: 'BX-123',
  },
  currency: 'CNY',
  applicantId: 'employee-one',
  departmentId: 'department-one',
  amountCents: 10000,
  offsetCents: 3000,
  paidCents: 7000,
  forced: false,
  lines: [
    {
      category: 'travel',
      date: '2026-10-25',
      amountCents: 10000,
      invoiceNumber: 'synthetic-invoice',
    },
  ],
};
const config = {
  baseUrl: 'https://gateway.example/oa',
  token: 'synthetic-secret',
};
it('keeps the same document key across retries and detects changed accounting facts', () => {
  const first = financeEnvelope(document);
  expect(financeEnvelope(structuredClone(document))).toEqual(first);
  const changed = financeEnvelope({ ...document, forced: true });
  expect(changed.idempotencyKey).toBe(first.idempotencyKey);
  expect(changed.payloadHash).not.toBe(first.payloadHash);
  expect(
    financeEnvelope({
      ...document,
      source: { ...document.source, instanceId: 'other-oa' },
    }).idempotencyKey,
  ).not.toBe(first.idempotencyKey);
  expect(() => financeEnvelope({ ...document, paidCents: 10000 })).toThrow();
  expect(() =>
    financeEnvelope({ ...document, bankAccount: 'private' } as FinanceDocument),
  ).toThrow();
  expect(() => financeEnvelope({ ...document, lines: [] })).toThrow();
});
it('submits only the canonical envelope with a stable key and treats accepted as not posted', async () => {
  const envelope = financeEnvelope(document);
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      idempotencyKey: envelope.idempotencyKey,
      payloadHash: envelope.payloadHash,
      state: 'accepted',
      externalId: 'job-1',
    }),
  );
  const gateway = new FinanceGateway(config, fetcher);
  expect((await gateway.submit(envelope)).state).toBe('accepted');
  const [url, init] = fetcher.mock.calls[0];
  expect(String(url)).toBe('https://gateway.example/oa/v1/finance/entries');
  expect(init.redirect).toBe('error');
  expect(init.headers['idempotency-key']).toBe(envelope.idempotencyKey);
  expect(JSON.parse(init.body)).toEqual(envelope);
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(() => gateway.submit({ ...envelope, paidCents: 1 })).toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('confirms a posted receipt only with matching identity/hash and a real voucher number', async () => {
  const envelope = financeEnvelope(document);
  const receipt = {
    idempotencyKey: envelope.idempotencyKey,
    payloadHash: envelope.payloadHash,
    state: 'posted',
    externalId: 'voucher-1',
    voucherNumber: 'ERP-1',
  };
  const fetcher = vi
    .fn()
    .mockImplementation(async () => Response.json(receipt));
  const gateway = new FinanceGateway(config, fetcher);
  expect(await gateway.lookup(envelope)).toEqual(receipt);
  expect(String(fetcher.mock.calls[0][0])).toContain(
    '/by-key/' + envelope.idempotencyKey,
  );
  for (const change of [
    { payloadHash: 'wrong' },
    { idempotencyKey: 'another' },
    { voucherNumber: undefined },
    { externalId: undefined },
  ]) {
    fetcher.mockImplementationOnce(async () =>
      Response.json({ ...receipt, ...change }),
    );
    expect(await gateway.lookup(envelope)).toEqual({
      state: 'unknown',
      code: 'invalid_receipt',
    });
  }
});
it('does not turn a timeout, 5xx, malformed or oversized response into a rejected payment', async () => {
  const envelope = financeEnvelope(document);
  const fetcher = vi.fn();
  const gateway = new FinanceGateway(config, fetcher);
  fetcher.mockRejectedValueOnce(new Error('https://secret-url?token=private'));
  expect(await gateway.submit(envelope)).toEqual({
    state: 'unknown',
    code: 'transport',
  });
  fetcher.mockResolvedValueOnce(
    new Response('private detail', { status: 500 }),
  );
  expect(await gateway.submit(envelope)).toEqual({
    state: 'unknown',
    code: 'unconfirmed',
  });
  fetcher.mockResolvedValueOnce(new Response('x'.repeat(65537)));
  expect(await gateway.lookup(envelope)).toEqual({
    state: 'unknown',
    code: 'transport',
  });
  fetcher.mockResolvedValueOnce(new Response('not json'));
  expect(await gateway.lookup(envelope)).toEqual({
    state: 'unknown',
    code: 'transport',
  });
  fetcher.mockResolvedValueOnce(new Response(null, { status: 404 }));
  expect(await gateway.lookup(envelope)).toEqual({ state: 'not_found' });
});
it('rejects insecure destinations and payment records containing loan offsets', () => {
  for (const baseUrl of [
    'http://gateway.example',
    'https://user:pass@gateway.example',
    'https://gateway.example?token=x',
    'https://gateway.example#fragment',
  ])
    expect(() => new FinanceGateway({ ...config, baseUrl })).toThrow();
  expect(() => new FinanceGateway({ ...config, token: '' })).toThrow();
  expect(() =>
    financeEnvelope({
      ...document,
      source: { ...document.source, kind: 'payment' },
    }),
  ).toThrow();
  expect(
    financeEnvelope({
      ...document,
      source: { ...document.source, kind: 'payment' },
      offsetCents: 0,
      paidCents: 10000,
      lines: [],
    }),
  ).toMatchObject({ paidCents: 10000, lines: [] });
});

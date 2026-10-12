import { expect, it } from 'vitest';
import {
  parseCents,
  centsText,
} from '../../../client/pages/payment-requests/money.js';
import {
  availableMoney,
  paymentDefaults,
  paymentInput,
  paymentFormSchema,
} from '../../../client/pages/payment-requests/form-model.js';
it('preserves a real cent at the JS safe maximum and rejects ambiguous decimal input', () => {
  expect(parseCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  expect(centsText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
  for (const text of ['90071992547409.92', '1e3', '0.001', '-1', '01.00', '1.'])
    expect(parseCents(text)).toBeNull();
});
it('never sends the stale purchase source or a contract when saving a no-prior payment', () => {
  const values = {
    ...paymentDefaults(undefined, 'owner'),
    sourceMode: 'none' as const,
    purchaseOrderId: 'old-source',
    amount: '0.01',
  };
  expect(paymentInput(values)).toMatchObject({
    sourceMode: 'none',
    purchaseOrderId: null,
    contractId: null,
    amountCents: 1,
  });
  expect(
    paymentFormSchema((k) => k).safeParse({ ...values, amount: '1.999' })
      .success,
  ).toBe(false);
});

it('formats an overdrawn cumulative source without rounding a cent', () => {
  expect(
    availableMoney(
      0,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
      'en-US',
    ),
  ).toBe('-180,143,985,094,819.82');
});

it('contract source preserves its selected version and excludes stale purchase identity', () => {
  const values = {
    ...paymentDefaults(undefined, 'owner'),
    sourceMode: 'contract' as const,
    contractId: 'contract-1',
    contractVersion: 3,
    purchaseOrderId: 'stale-order',
    vendorId: 'vendor-1',
    amount: '10.01',
  };
  expect(paymentInput(values)).toMatchObject({
    sourceMode: 'contract',
    contractId: 'contract-1',
    contractVersion: 3,
    purchaseOrderId: null,
    vendorId: 'vendor-1',
    amountCents: 1001,
  });
  expect(paymentInput({ ...values, sourceMode: 'none' })).toMatchObject({
    contractId: null,
    contractVersion: null,
    purchaseOrderId: null,
  });
});

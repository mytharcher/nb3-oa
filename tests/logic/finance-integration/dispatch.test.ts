// @vitest-environment node
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createFinanceDispatcher } from '../../../server/providers/finance-integration/dispatch.js';
import {
  financeEnvelope,
  type FinanceGatewayResult,
} from '../../../server/providers/finance-integration/gateway.js';
import { createEmployeesAppTest, createPerson } from '../employees/helpers.js';
vi.setConfig({ testTimeout: 120000 });
const test = createEmployeesAppTest();
const envelope = (id: string, forced = false) =>
  financeEnvelope({
    schemaVersion: 1,
    source: { instanceId: 'oa-test', kind: 'payment', id, number: `FK-${id}` },
    currency: 'CNY',
    applicantId: 'synthetic-applicant',
    departmentId: null,
    amountCents: 10000,
    offsetCents: 0,
    paidCents: 10000,
    forced,
    lines: [],
  });
test('durable dispatch serializes retries, preserves uncertainty, recovers leases and commits audits atomically', async ({
  testApp,
}) => {
  const db = testApp.application.container
    .resolve(databaseManagerToken)
    .connection();
  const audit = testApp.application.container.resolve(auditServiceToken);
  const person = await createPerson(testApp, 'Finance integration operator');
  let now = new Date('2026-10-25T00:00:00Z');
  const store = createFinanceDispatcher(db, audit, () => now);
  const doc = envelope('one');
  const receipt = (
    state: 'accepted' | 'posted' | 'rejected',
    value = doc,
  ): FinanceGatewayResult => ({
    idempotencyKey: value.idempotencyKey,
    payloadHash: value.payloadHash,
    state,
    ...(state === 'posted'
      ? { externalId: 'erp-one', voucherNumber: 'V-ONE' }
      : {}),
  });
  let finish!: (value: FinanceGatewayResult) => void;
  let started!: () => void;
  const start = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gateway = {
    submit: vi.fn(() => {
      started();
      return new Promise<FinanceGatewayResult>((resolve) => {
        finish = resolve;
      });
    }),
    lookup: vi.fn(),
  };
  const first = store.dispatch(
    doc,
    'destination-one',
    person.userId,
    gateway,
    'submit',
  );
  await start;
  const concurrent = await store.dispatch(
    doc,
    'destination-one',
    person.userId,
    gateway,
    'submit',
  );
  expect(concurrent.state).toBe('sending');
  expect(gateway.submit).toHaveBeenCalledTimes(1);
  finish(receipt('posted'));
  expect((await first).state).toBe('posted');
  expect(
    (
      await store.dispatch(
        doc,
        'destination-one',
        person.userId,
        gateway,
        'submit',
      )
    ).voucherNumber,
  ).toBe('V-ONE');
  expect(gateway.submit).toHaveBeenCalledTimes(1);
  await expect(
    store.dispatch(doc, 'destination-two', person.userId, gateway, 'submit'),
  ).rejects.toThrow('destination changed');
  const altered = envelope('one', true);
  await expect(
    store.dispatch(
      altered,
      'destination-one',
      person.userId,
      gateway,
      'submit',
    ),
  ).rejects.toThrow('facts or destination');

  const uncertain = envelope('uncertain');
  const remote = {
    submit: vi.fn().mockResolvedValue({ state: 'unknown', code: 'transport' }),
    lookup: vi.fn().mockResolvedValue(receipt('accepted', uncertain)),
  };
  expect(
    (
      await store.dispatch(
        uncertain,
        'destination-one',
        person.userId,
        remote,
        'submit',
      )
    ).state,
  ).toBe('unknown');
  const restarted = createFinanceDispatcher(db, audit, () => now);
  expect(
    (
      await restarted.dispatch(
        uncertain,
        'destination-one',
        person.userId,
        remote,
        'lookup',
      )
    ).state,
  ).toBe('accepted');
  expect(remote.lookup).toHaveBeenCalledWith(uncertain);
  remote.lookup.mockResolvedValue({ state: 'not_found' });
  expect(
    (
      await restarted.dispatch(
        uncertain,
        'destination-one',
        person.userId,
        remote,
        'lookup',
      )
    ).state,
  ).toBe('accepted');
  remote.lookup.mockResolvedValue(receipt('posted', uncertain));
  expect(
    (
      await restarted.dispatch(
        uncertain,
        'destination-one',
        person.userId,
        remote,
        'lookup',
      )
    ).state,
  ).toBe('posted');

  const stale = envelope('stale');
  let oldFinish!: (value: FinanceGatewayResult) => void;
  let oldStarted!: () => void;
  const oldStart = new Promise<void>((resolve) => {
    oldStarted = resolve;
  });
  const delayed = {
    submit: vi
      .fn()
      .mockImplementationOnce(() => {
        oldStarted();
        return new Promise<FinanceGatewayResult>((resolve) => {
          oldFinish = resolve;
        });
      })
      .mockResolvedValue(receipt('posted', stale)),
    lookup: vi.fn(),
  };
  const oldAttempt = store.dispatch(
    stale,
    'destination-one',
    person.userId,
    delayed,
    'submit',
  );
  await oldStart;
  now = new Date(now.getTime() + 61000);
  expect(
    (
      await restarted.dispatch(
        stale,
        'destination-one',
        person.userId,
        delayed,
        'submit',
      )
    ).state,
  ).toBe('posted');
  oldFinish(receipt('rejected', stale));
  expect((await oldAttempt).state).toBe('posted');
  expect(delayed.submit.mock.calls[0][0].idempotencyKey).toBe(
    delayed.submit.mock.calls[1][0].idempotencyKey,
  );

  const brokenAudit = createFinanceDispatcher(db, {
    ...audit,
    record: async () => {
      throw new Error('audit unavailable');
    },
  });
  const neverSend = { submit: vi.fn(), lookup: vi.fn() };
  await expect(
    brokenAudit.dispatch(
      envelope('rollback'),
      'destination-one',
      person.userId,
      neverSend,
      'submit',
    ),
  ).rejects.toThrow('audit unavailable');
  expect(await store.read('payment', 'rollback')).toBeUndefined();
  expect(neverSend.submit).not.toHaveBeenCalled();
  const logs = await audit.list({
    targetType: 'financeIntegrationDispatches',
    actorId: person.userId,
    page: 1,
    pageSize: 100,
  });
  expect(logs.total).toBeGreaterThan(5);
  expect(JSON.stringify(logs.items)).not.toContain('synthetic-applicant');
});

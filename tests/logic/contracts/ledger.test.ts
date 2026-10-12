// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { createContractLedgerService } from '../../../server/providers/contracts/ledger.ts';
import type { ContractFacts } from '../../../server/providers/contracts/contract.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const cmd = () => ({
  actorId: 'finance',
  reason: 'Contract ledger proof',
  requestKey: randomUUID(),
});
const facts: ContractFacts = {
  contractType: 'sale',
  counterparty: { kind: 'customer', name: 'Customer' },
  startsOn: '2026-10-01',
  endsOn: '2027-10-01',
  paymentTerms: 'net 30',
  standardTemplate: true,
  textVersionId: 'immutable-text-1',
  attachments: [],
};
describe('contract immutable version and payment foundation', () => {
  test('draft exits remove only candidate; accepted changes preserve versions and payment facts', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = createContractLedgerService(
        db,
        app.container.resolve(auditServiceToken),
      );
    const initial = {
      ...cmd(),
      id: randomUUID(),
      requestId: randomUUID(),
      applicantId: 'employee',
      departmentId: 'department',
      amountCents: 10001,
      facts,
    };
    await db.transaction((tx) => service.createCandidate(initial, tx));
    await db.transaction((tx) => service.createCandidate(initial, tx));
    const discard = {
      ...cmd(),
      contractId: initial.id,
      requestId: initial.requestId,
    };
    await db.transaction((tx) => service.discardCandidate(discard, tx));
    await db.transaction((tx) => service.discardCandidate(discard, tx));
    expect(
      await db.transaction((tx) => service.source(initial.id, tx)),
    ).toBeNull();
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { targetId: initial.id } }),
    ).toBeGreaterThan(0);
    const active = {
      ...initial,
      id: randomUUID(),
      requestId: randomUUID(),
      requestKey: randomUUID(),
    };
    await db.transaction((tx) => service.createCandidate(active, tx));
    await db.transaction((tx) =>
      service.publish(
        {
          ...cmd(),
          contractId: active.id,
          requestId: active.requestId,
          baseVersion: 0,
          number: 'CONTRACT0001',
          amountCents: active.amountCents,
          facts,
        },
        tx,
      ),
    );
    const hold = {
      ...cmd(),
      contractId: active.id,
      reference: `payment:${randomUUID()}`,
      cents: 4001,
    };
    await db.transaction((tx) => service.hold(hold, tx));
    await db.transaction((tx) => service.hold(hold, tx));
    expect(
      await db.transaction((tx) => service.source(active.id, tx)),
    ).toMatchObject({
      version: 1,
      heldCents: 4001,
      paidCents: 0,
      availableCents: 6000,
    });
    const change = {
      ...cmd(),
      contractId: active.id,
      requestId: randomUUID(),
      baseVersion: 1,
      number: 'CONTRACT0001',
      amountCents: 4000,
      facts,
    };
    await expect(
      db.transaction((tx) => service.publish(change, tx)),
    ).rejects.toMatchObject({ code: 'CONTRACT_AMOUNT_BELOW_COMMITTED' });
    await db.transaction((tx) =>
      service.publish({ ...change, amountCents: 4001 }, tx),
    );
    const settlement = {
      ...cmd(),
      contractId: active.id,
      reference: hold.reference,
    };
    await db.transaction((tx) => service.settle(settlement, tx));
    await db.transaction((tx) => service.settle(settlement, tx));
    expect(
      await db.transaction((tx) => service.source(active.id, tx)),
    ).toMatchObject({
      version: 2,
      heldCents: 0,
      paidCents: 4001,
      availableCents: 0,
    });
    expect(
      await db
        .repository('contractVersions')
        .count({ filter: { contractId: active.id } }),
    ).toBe(2);
    await expect(
      db.transaction((tx) =>
        service.publish(
          { ...change, requestKey: randomUUID(), amountCents: 5000 },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'CONTRACT_VERSION_CONFLICT' });
    const raced = await Promise.allSettled(
      [5000, 6000].map((amountCents) =>
        db.transaction((tx) =>
          service.publish(
            {
              ...change,
              requestKey: randomUUID(),
              requestId: randomUUID(),
              baseVersion: 2,
              amountCents,
            },
            tx,
          ),
        ),
      ),
    );
    expect(raced.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(raced.find((r) => r.status === 'rejected')).toMatchObject({
      reason: { code: 'CONTRACT_VERSION_CONFLICT' },
    });
    expect(
      await db
        .repository('contractVersions')
        .count({ filter: { contractId: active.id } }),
    ).toBe(3);
    await expect(
      db.transaction((tx) =>
        service.hold({ ...hold, requestKey: randomUUID() }, tx),
      ),
    ).rejects.toMatchObject({ code: 'CONTRACT_RESERVATION_CLOSED' });
  });
  test('concurrent holds cannot overspend; cash audit failure rolls back all funds and commands', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      service = createContractLedgerService(db, audit);
    const initial = {
      ...cmd(),
      id: randomUUID(),
      requestId: randomUUID(),
      applicantId: 'employee',
      departmentId: 'department',
      amountCents: 10001,
      facts,
    };
    await db.transaction((tx) => service.createCandidate(initial, tx));
    await db.transaction((tx) =>
      service.publish(
        {
          ...cmd(),
          contractId: initial.id,
          requestId: initial.requestId,
          baseVersion: 0,
          number: 'CONTRACT0002',
          amountCents: initial.amountCents,
          facts,
        },
        tx,
      ),
    );
    const holds = [1, 2].map(() => ({
      ...cmd(),
      contractId: initial.id,
      reference: `payment:${randomUUID()}`,
      cents: 6000,
    }));
    const outcomes = await Promise.allSettled(
      holds.map((input) => db.transaction((tx) => service.hold(input, tx))),
    );
    expect(outcomes.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    const accepted = holds[outcomes.findIndex((x) => x.status === 'fulfilled')];
    const settle = {
      ...cmd(),
      contractId: initial.id,
      reference: accepted.reference,
    };
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit unavailable'));
    await expect(
      db.transaction((tx) => service.settle(settle, tx)),
    ).rejects.toThrow('Audit unavailable');
    spy.mockRestore();
    expect(
      await db.transaction((tx) => service.source(initial.id, tx)),
    ).toMatchObject({ version: 1, paidCents: 0, heldCents: 6000 });
    expect(
      await db.repository('contractCommands').count({
        filter: { actorId: settle.actorId, requestKey: settle.requestKey },
      }),
    ).toBe(0);
    await db.transaction((tx) => service.settle(settle, tx));
    await expect(
      db.transaction((tx) =>
        service.settle({ ...settle, reason: 'changed payload' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'CONTRACT_IDEMPOTENCY_CONFLICT' });
  });
});

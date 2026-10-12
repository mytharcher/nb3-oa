// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  contractLedgerServiceToken,
  type ContractPaymentProof,
} from '../../../server/providers/contracts/contract.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
describe('contract payment reservations public invariants', () => {
  test('excess never expands approved amount; exact proof, versions, change/termination and outer rollback fail closed', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      contracts = app.container.resolve(contractLedgerServiceToken);
    const id = randomUUID(),
      ref = `oa.payment:${randomUUID()}:${id}`;
    const cmd = () => ({
      actorId: 'finance',
      requestKey: randomUUID(),
      reason: 'Synthetic contract payment',
    });
    const facts = {
      contractType: 'sale',
      counterparty: { kind: 'customer' as const, name: 'Customer' },
      startsOn: '2026-10-01',
      endsOn: '2027-10-01',
      paymentTerms: 'net 30',
      standardTemplate: true,
      textVersionId: 'v1',
      attachments: [],
    };
    await db.transaction(async (tx) => {
      await contracts.createCandidate(
        {
          ...cmd(),
          id,
          requestId: id,
          applicantId: 'owner',
          departmentId: 'department',
          amountCents: 10000,
          facts,
        },
        tx,
      );
      await contracts.publish(
        {
          ...cmd(),
          contractId: id,
          requestId: id,
          baseVersion: 0,
          number: id,
          amountCents: 10000,
          facts,
        },
        tx,
      );
    });
    await expect(
      db.transaction(async (tx) => {
        await contracts.reservePayment(
          {
            ...cmd(),
            contractId: id,
            expectedVersion: 1,
            reference: ref,
            cents: 12000,
          },
          tx,
        );
        throw new Error('outer rollback');
      }),
    ).rejects.toThrow('outer rollback');
    expect(await contracts.source(id, db.connection())).toMatchObject({
      heldCents: 0,
      paidCents: 0,
      amountCents: 10000,
    });
    const hold = await db.transaction((tx) =>
      contracts.reservePayment(
        {
          ...cmd(),
          contractId: id,
          expectedVersion: 1,
          reference: ref,
          cents: 12000,
        },
        tx,
      ),
    );
    expect(hold.requiresFullApproval).toBe(true);
    expect(await contracts.source(id, db.connection())).toMatchObject({
      heldCents: 12000,
      paidCents: 0,
      amountCents: 10000,
      availableCents: 0,
    });
    await expect(
      db.transaction((tx) =>
        contracts.publish(
          {
            ...cmd(),
            contractId: id,
            requestId: randomUUID(),
            baseVersion: 1,
            number: id,
            amountCents: 10000,
            facts,
          },
          tx,
        ),
      ),
    ).rejects.toThrow('below paid');
    await expect(
      db.transaction((tx) =>
        contracts.publish(
          {
            ...cmd(),
            contractId: id,
            requestId: randomUUID(),
            baseVersion: 1,
            number: id,
            amountCents: 12000,
            facts,
            terminate: true,
          },
          tx,
        ),
      ),
    ).rejects.toThrow('outstanding');
    const proof: ContractPaymentProof = {
      approved: true,
      contractId: id,
      reference: ref,
      cents: 12000,
      contractVersion: 1,
      sourceVersion: 7,
      requiresFullApproval: true,
      completedFullApproval: false,
      forced: false,
    };
    const settle = () => ({
      ...cmd(),
      contractId: id,
      reference: ref,
      expectedVersion: 1,
    });
    await expect(
      db.transaction((tx) =>
        contracts.settlePayment(settle(), async () => proof, tx),
      ),
    ).rejects.toThrow('full staircase');
    await expect(
      db.transaction((tx) =>
        contracts.settlePayment(
          settle(),
          async () => ({ ...proof, completedFullApproval: true, forced: true }),
          tx,
        ),
      ),
    ).rejects.toThrow('Actual cashier');
    await expect(
      db.transaction((tx) =>
        contracts.settlePayment(
          settle(),
          async () => ({ ...proof, completedFullApproval: true, cents: 1 }),
          tx,
        ),
      ),
    ).rejects.toThrow('Actual cashier');
    await expect(
      db.transaction((tx) =>
        contracts.reservePayment(
          {
            ...cmd(),
            contractId: id,
            expectedVersion: 2,
            reference: ref,
            cents: 12000,
          },
          tx,
        ),
      ),
    ).rejects.toThrow('version changed');
    const paid = settle();
    await db.transaction((tx) =>
      contracts.settlePayment(
        paid,
        async () => ({ ...proof, completedFullApproval: true }),
        tx,
      ),
    );
    await db.transaction((tx) =>
      contracts.settlePayment(
        paid,
        async () => ({ ...proof, completedFullApproval: true }),
        tx,
      ),
    );
    expect(await contracts.source(id, db.connection())).toMatchObject({
      heldCents: 0,
      paidCents: 12000,
      amountCents: 10000,
    });
    expect(
      await db
        .repository('contractMoneyLedger')
        .count({ filter: { contractId: id, kind: 'settle' } }),
    ).toBe(1);
    await expect(
      contracts.listForPayment(
        'owner',
        {
          read: { scope: true, fields: ['id'] },
          create: false,
          update: false,
          delete: false,
        },
        db.connection(),
      ),
    ).rejects.toThrow('readable contract');
  });
});

// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createContractLedgerService } from '../../../server/providers/contracts/ledger.js';
import type { ContractFacts } from '../../../server/providers/contracts/contract.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
const command = () => ({
  actorId: 'real-seal-keeper',
  requestKey: randomUUID(),
  reason: 'Actual seal evidence verification',
});
const facts: ContractFacts = {
  contractType: 'sale',
  counterparty: { kind: 'customer', name: 'Seal customer' },
  startsOn: '2026-10-01',
  endsOn: '2027-10-01',
  paymentTerms: 'net30',
  standardTemplate: true,
  textVersionId: randomUUID(),
  attachments: [],
};
test('confirmed immutable seal evidence activates only exact published version; duplicate, stale and audit rollback preserve contract facts', async ({
  app,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    ledger = createContractLedgerService(db, audit),
    id = randomUUID(),
    requestId = randomUUID();
  await db.transaction((tx) =>
    ledger.createCandidate(
      {
        ...command(),
        id,
        requestId,
        applicantId: 'actual-applicant',
        departmentId: 'actual-department',
        amountCents: 12345,
        facts,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    ledger.publish(
      {
        ...command(),
        contractId: id,
        requestId,
        baseVersion: 0,
        number: 'SEAL-CONTRACT-1',
        amountCents: 12345,
        facts,
      },
      tx,
    ),
  );
  const before = await db.transaction((tx) => ledger.source(id, tx)),
    sealRecordId = randomUUID(),
    sealedAt = new Date(Date.now() - 60_000),
    cmd = { ...command(), contractId: id, expectedVersion: 1, sealRecordId };
  const proof = () =>
    Promise.resolve({
      contractId: id,
      contractVersion: 1,
      sealRecordId,
      sealedAt,
      status: 'completed' as const,
    });
  await expect(
    db.transaction((tx) => ledger.confirmSealed(cmd, async () => null, tx)),
  ).rejects.toMatchObject({ code: 'CONTRACT_SEAL_EVIDENCE_REQUIRED' });
  expect(await db.repository('contractSealLinks').count()).toBe(0);
  const recorded = await db.transaction((tx) =>
    ledger.confirmSealed(cmd, proof, tx),
  );
  expect(recorded).toMatchObject({
    status: 'active',
    version: 1,
    amountCents: 12345,
    heldCents: 0,
    paidCents: 0,
    facts,
  });
  await db.transaction((tx) => ledger.confirmSealed(cmd, proof, tx));
  await db.transaction((tx) =>
    ledger.confirmSealed({ ...cmd, requestKey: randomUUID() }, proof, tx),
  );
  expect(
    await db
      .repository('contractSealLinks')
      .count({ filter: { contractId: id } }),
  ).toBe(1);
  await expect(
    db.transaction((tx) =>
      ledger.confirmSealed({ ...cmd, sealRecordId: randomUUID() }, proof, tx),
    ),
  ).rejects.toMatchObject({ code: 'CONTRACT_IDEMPOTENCY_CONFLICT' });
  await expect(
    db.transaction((tx) =>
      ledger.confirmSealed(
        { ...cmd, requestKey: randomUUID(), expectedVersion: 2 },
        proof,
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'CONTRACT_VERSION_CONFLICT' });
  expect((await db.transaction((tx) => ledger.source(id, tx)))?.facts).toEqual(
    before?.facts,
  );
  const secondSeal = randomUUID(),
    failure = { ...cmd, sealRecordId: secondSeal, requestKey: randomUUID() },
    spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Injected same-TX audit failure'));
  await expect(
    db.transaction((tx) =>
      ledger.confirmSealed(
        failure,
        async () => ({ ...(await proof()), sealRecordId: secondSeal }),
        tx,
      ),
    ),
  ).rejects.toThrow('Injected same-TX audit failure');
  spy.mockRestore();
  expect(
    await db
      .repository('contractSealLinks')
      .count({ filter: { sealRecordId: secondSeal } }),
  ).toBe(0);
  expect(
    await db
      .repository('contractVersions')
      .count({ filter: { contractId: id } }),
  ).toBe(1);
});

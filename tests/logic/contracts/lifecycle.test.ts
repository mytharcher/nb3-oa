// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.js';
import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { createContractLedgerService } from '../../../server/providers/contracts/ledger.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('registered contract graph and real JobExecutor: original legal output, real claimable pools, automatic partial reuse and final audit rollback', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    org = c.resolve(organizationServiceToken);
  const names = ['applicant', 'head', 'legal', 'finance', 'gm'];
  const people: Record<string, string> = {};
  for (const name of names) {
    people[name] = (await createUser(testApp, name)).user.id;
    await db.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        name,
        userId: people[name],
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  for (const role of ['legal', 'finance', 'gm'])
    await org.addDutyRoleMember(role, people[role], {
      actorId: people.applicant,
    });
  const department = await org.createDepartment(
    { title: 'Contracts proof', managerId: people.head },
    { actorId: people.applicant },
  );
  await org.addMember(
    { departmentId: department.id, userId: people.applicant, primary: true },
    { actorId: people.applicant },
  );
  const ledger = createContractLedgerService(db, audit);
  const service = c.resolve(contractHttpServiceToken);
  async function waitForReuse(recordId: string) {
    const runtime = (await service.initialize()).runtime;
    for (let attempt = 0; attempt < 150; attempt++) {
      const effects = (await runtime.listEffectRuns({ recordId })).filter(
        (effect) => effect.effect.startsWith('contract.reuseOpinions'),
      );
      if (
        effects.every((effect) =>
          ['succeeded', 'cancelled', 'failed'].includes(effect.status),
        )
      ) {
        expect(effects.some((effect) => effect.status === 'failed')).toBe(
          false,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(
      'Registered contract JobExecutor did not deliver its durable reuse effect.',
    );
  }
  const proposal = {
    contractType: 'purchase',
    counterparty: { kind: 'customer' as const, name: 'Counterparty' },
    amountCents: 10001,
    startsOn: '2026-10-01',
    endsOn: '2027-10-01',
    paymentTerms: 'Net 30',
    standardTemplate: false,
    textVersionId: null,
    attachments: [],
    reason: 'Contract approval proof',
  };
  const created = await service.create(
    { operation: 'new', contractId: null, baseVersion: 0, proposal },
    people.applicant,
    randomUUID(),
  );
  if (!created.record) throw new Error('No draft');
  const id = String(created.record.id),
    fileId = randomUUID();
  await db.repository('contractAttachmentFiles').createOne({
    values: {
      id: fileId,
      disk: 'local',
      key: 'proof.pdf',
      filename: 'Contract.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      requestId: id,
      ownerId: people.applicant,
      uploadVersion: Number(created.record.lifecycleVersion),
      purpose: 'text',
    },
  });
  const policy = { read: true, create: true, update: true, delete: false };
  const text = await service.appendText(
    id,
    people.applicant,
    fileId,
    randomUUID(),
    policy,
  );
  let detail = await service.detail(id, people.applicant);
  await service.transition(
    id,
    people.applicant,
    'edit',
    { ...proposal, textVersionId: String(text.textVersion.id) },
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await service.detail(id, people.applicant);
  await service.transition(
    id,
    people.applicant,
    'submit',
    {},
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  async function act(
    role: string,
    action: string,
    input: Record<string, unknown> = {},
  ) {
    const info = await service.detail(id, people[role]);
    const view = info.runs.find(
      (v) =>
        !['approved', 'rejected', 'returned', 'cancelled'].includes(
          v.run.status,
        ),
    );
    if (!view) throw new Error('No open run');
    const task = view.tasks.find(
      (t) =>
        t.assigneeId === people[role] &&
        ['pending', 'candidate', 'claimed'].includes(t.status),
    );
    if (!task) throw new Error(`No task for ${role}`);
    const result = await service.action(id, people[role], {
      target: { taskId: task.id },
      action,
      input: input as never,
      requestId: randomUUID(),
      contentHash: view.run.contentHash,
      comment:
        action === 'return' ? 'Revise amount' : 'Actual reviewer decision',
    });
    await waitForReuse(id);
    return result;
  }
  await act('head', 'approve');
  expect((await service.detail(id, people.applicant)).record.status).toBe(
    'legalFinance',
  );
  await expect(
    act('legal', 'approve', { data: { nonStandard: true } }),
  ).rejects.toBeDefined();
  await act('legal', 'claim');
  await expect(
    act('legal', 'approve', { data: { nonStandard: null } }),
  ).rejects.toBeDefined();
  await org.removeDutyRoleMember('legal', people.legal, {
    actorId: people.applicant,
  });
  await expect(
    act('legal', 'approve', { data: { nonStandard: true } }),
  ).rejects.toBeDefined();
  await org.addDutyRoleMember('legal', people.legal, {
    actorId: people.applicant,
  });
  await act('legal', 'approve', { data: { nonStandard: true } });
  await act('finance', 'claim');
  await expect(
    act('finance', 'approve', { data: { nonStandard: false } }),
  ).rejects.toBeDefined();
  await act('finance', 'return', { to: 'revision' });
  detail = await service.detail(id, people.applicant);
  await service.transition(
    id,
    people.applicant,
    'edit',
    {
      ...proposal,
      textVersionId: String(text.textVersion.id),
      amountCents: 11001,
    },
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await service.detail(id, people.applicant);
  await service.transition(
    id,
    people.applicant,
    'submit',
    {},
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  await act('head', 'approve');
  detail = await service.detail(id, people.applicant);
  const current = detail.runs.find((v) => v.run.status === 'legalFinance')!;
  expect(
    (
      await (
        await service.initialize()
      ).runtime.listEffectRuns({
        recordId: id,
        effect: 'contract.reuseOpinions',
      })
    ).every((effect) => effect.status === 'succeeded'),
  ).toBe(true);
  expect(current.tasks.find((t) => t.assigneeId === people.legal)?.answer).toBe(
    'approve',
  );
  expect(
    current.tasks.find((t) => t.assigneeId === people.legal)?.actorId,
  ).toBe(people.applicant);
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { targetId: id, action: 'contract.reuseOpinions' } }),
  ).toBe(1);
  await act('finance', 'claim');
  await act('finance', 'approve');
  expect((await service.detail(id, people.applicant)).record.status).toBe('gm');
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('Audit unavailable'));
  await expect(act('gm', 'approve')).rejects.toThrow('Audit unavailable');
  spy.mockRestore();
  expect((await service.detail(id, people.applicant)).record.status).toBe('gm');
  await act('gm', 'approve');
  detail = await service.detail(id, people.applicant);
  expect(detail.record.status).toBe('approved');
  expect(
    await db.transaction((tx) => ledger.source(detail.record.contractId, tx)),
  ).toMatchObject({
    version: 1,
    amountCents: 11001,
    status: 'activePendingSeal',
  });

  const approvedLedger = await service.ledgerDetail(
    detail.record.contractId,
    policy,
    policy,
  );
  expect(approvedLedger.timeZone).toBeTruthy();
  expect(
    Number.isFinite(new Date(approvedLedger.contract.updatedAt!).getTime()),
  ).toBe(true);
  expect(
    (await service.ledgerList({ page: 1, pageSize: 20 }, policy, policy)).meta
      .timeZone,
  ).toBeTruthy();
  const withoutDate = await service.ledgerDetail(
    detail.record.contractId,
    {
      ...policy,
      read: {
        scope: true,
        fields: [
          'id',
          'version',
          'status',
          'amountCents',
          'facts',
          'number',
          'requestId',
          'applicantId',
          'departmentId',
        ],
      },
    },
    policy,
  );
  expect(withoutDate.contract).not.toHaveProperty('updatedAt');

  async function branch(
    operation: 'new' | 'terminate',
    standardTemplate: boolean,
  ) {
    const sourceId = detail.record.contractId;
    const vendorService = c.resolve(vendorServiceToken);
    const vendor =
      operation === 'new'
        ? await db.transaction((tx) =>
            vendorService.create(
              {
                actorId: people.applicant,
                reason: 'Qualified source proof',
                code: randomUUID(),
                name: 'Qualified contract supplier',
                category: 'service',
                contactName: 'Source contact',
                contactPhone: '',
                contactEmail: '',
                bankName: 'Private bank',
                bankAccount: 'CONTRACT-SOURCE-BANK-SECRET',
                bankAccountName: 'Supplier',
              },
              tx,
            ),
          )
        : null;
    const proposal2 = {
      ...proposal,
      standardTemplate,
      ...(vendor
        ? {
            counterparty: {
              kind: 'vendor' as const,
              id: vendor.id,
              name: 'Forged name',
              category: 'Forged category',
            },
          }
        : {}),
      amountCents: operation === 'new' ? 5000 : 11001,
    };
    const draft = await service.create(
      {
        operation,
        contractId: operation === 'new' ? null : sourceId,
        baseVersion: operation === 'new' ? 0 : 1,
        proposal: proposal2,
      },
      people.applicant,
      randomUUID(),
    );
    const branchId = String(draft.record.id),
      file = randomUUID();
    await db.repository('contractAttachmentFiles').createOne({
      values: {
        id: file,
        disk: 'local',
        key: `${file}.pdf`,
        filename: 'Contract.pdf',
        ext: 'pdf',
        mimeType: 'application/pdf',
        size: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
        requestId: branchId,
        ownerId: people.applicant,
        uploadVersion: 0,
        purpose: 'text',
      },
    });
    const text2 = await service.appendText(
      branchId,
      people.applicant,
      file,
      randomUUID(),
      policy,
    );
    let currentDetail = await service.detail(branchId, people.applicant);
    await service.transition(
      branchId,
      people.applicant,
      'edit',
      { ...proposal2, textVersionId: String(text2.textVersion.id) },
      randomUUID(),
      currentDetail.record.lifecycleVersion,
    );
    currentDetail = await service.detail(branchId, people.applicant);
    if (vendor) {
      await expect(
        service.transition(
          branchId,
          people.applicant,
          'submit',
          {},
          randomUUID(),
          currentDetail.record.lifecycleVersion,
        ),
      ).rejects.toMatchObject({ code: 'CONTRACT_SUPPLIER_INVALID' });
      await db.transaction((tx) =>
        vendorService.applyQualification(
          {
            vendorId: vendor.id,
            expectedVersion: vendor.version,
            qualificationId: randomUUID(),
            actorId: people.applicant,
            reason: 'Qualification source fixture',
            outcome: 'qualified',
            qualificationExpiry: '2028-01-01',
          },
          tx,
        ),
      );
    }
    await service.transition(
      branchId,
      people.applicant,
      'submit',
      {},
      randomUUID(),
      currentDetail.record.lifecycleVersion,
    );
    async function vote(
      role: string,
      action: string,
      input: Record<string, unknown> = {},
    ) {
      const d = await service.detail(branchId, people[role]);
      const run = d.runs.find((r) =>
        ['head', 'legalFinance', 'standardFinance'].includes(r.run.status),
      )!;
      const task = run.tasks.find(
        (t) =>
          t.assigneeId === people[role] &&
          ['pending', 'candidate', 'claimed'].includes(t.status),
      )!;
      await service.action(branchId, people[role], {
        target: { taskId: task.id },
        action,
        input: input as never,
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        comment: 'Real branch opinion',
      });
      await waitForReuse(branchId);
    }
    await vote('head', 'approve');
    const next = await service.detail(branchId, people.applicant);
    expect(next.record.status).toBe(
      operation === 'terminate' ? 'legalFinance' : 'standardFinance',
    );
    if (operation === 'terminate') {
      await vote('legal', 'claim');
      await vote('legal', 'approve', { data: { nonStandard: true } });
    } else
      expect(
        next.runs
          .flatMap((r) => r.tasks)
          .some((t) => t.assigneeId === people.legal),
      ).toBe(false);
    await vote('finance', 'claim');
    if (operation === 'terminate') {
      const currentSource = await db.transaction((tx) =>
        ledger.source(sourceId, tx),
      );
      await db.transaction((tx) =>
        ledger.publish(
          {
            actorId: people.applicant,
            reason: 'Concurrent approved source version fixture',
            requestKey: randomUUID(),
            contractId: sourceId,
            requestId: randomUUID(),
            baseVersion: 1,
            number: currentSource!.number!,
            amountCents: currentSource!.amountCents,
            facts: currentSource!.facts,
          },
          tx,
        ),
      );
      await expect(vote('finance', 'approve')).rejects.toMatchObject({
        code: 'CONTRACT_VERSION_CONFLICT',
      });
      let stale = await service.detail(branchId, people.applicant);
      expect(stale.record.status).toBe('legalFinance');
      expect(
        stale.runs
          .find((r) => r.run.status === 'legalFinance')!
          .tasks.find((t) => t.assigneeId === people.finance)!.status,
      ).toBe('claimed');
      await vote('finance', 'return', { to: 'revision' });
      stale = await service.detail(branchId, people.applicant);
      await service.rebase(
        branchId,
        people.applicant,
        randomUUID(),
        stale.record.lifecycleVersion,
        policy,
      );
      stale = await service.detail(branchId, people.applicant);
      expect(stale.record.baseVersion).toBe(2);
      await service.transition(
        branchId,
        people.applicant,
        'submit',
        {},
        randomUUID(),
        stale.record.lifecycleVersion,
      );
      await vote('head', 'approve');
      const fresh = await service.detail(branchId, people.applicant);
      expect(
        fresh.runs
          .find((r) => r.run.status === 'legalFinance')!
          .tasks.find((t) => t.assigneeId === people.legal)!.answer,
      ).not.toBe('approve');
      await vote('legal', 'claim');
      await vote('legal', 'approve', { data: { nonStandard: true } });
      await vote('finance', 'claim');
    }
    if (vendor) {
      const before = await vendorService.get(vendor.id);
      await db.transaction((tx) =>
        vendorService.applyQualification(
          {
            vendorId: vendor.id,
            expectedVersion: before!.version!,
            qualificationId: randomUUID(),
            actorId: people.applicant,
            reason: 'Qualification revoked during approval',
            outcome: 'removed',
            qualificationExpiry: null,
          },
          tx,
        ),
      );
      await expect(vote('finance', 'approve')).rejects.toMatchObject({
        code: 'CONTRACT_SUPPLIER_INVALID',
      });
      const held = await service.detail(branchId, people.applicant);
      expect(held.record.status).toBe('standardFinance');
      expect(
        await db.transaction((tx) => ledger.source(held.record.contractId, tx)),
      ).toMatchObject({ status: 'underApproval', version: 0 });
      const after = await vendorService.get(vendor.id);
      await db.transaction((tx) =>
        vendorService.applyQualification(
          {
            vendorId: vendor.id,
            expectedVersion: after!.version!,
            qualificationId: randomUUID(),
            actorId: people.applicant,
            reason: 'New approved qualification source fixture',
            outcome: 'qualified',
            qualificationExpiry: '2028-01-01',
          },
          tx,
        ),
      );
    }

    await vote('finance', 'approve');
    const final = await service.detail(branchId, people.applicant);
    expect(final.record.status).toBe('approved');
    expect(JSON.stringify(final)).not.toContain('CONTRACT-SOURCE-BANK-SECRET');
    expect(final.record.number).toEqual(expect.any(String));
    expect(
      final.runs.some((r) =>
        r.stages.some(
          (stage) => stage.key === 'gm' || stage.key === 'executive',
        ),
      ),
    ).toBe(false);
    if (operation === 'terminate')
      expect(
        await db.transaction((tx) => ledger.source(sourceId, tx)),
      ).toMatchObject({ status: 'terminated', version: 3 });
  }
  await branch('new', true);
  await branch('terminate', true);
}, 120000);

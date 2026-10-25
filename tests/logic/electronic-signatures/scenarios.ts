import { randomUUID } from 'node:crypto';
import type { TestApp } from '@nocobase/app-testing/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  sealRequestServiceToken,
  SEAL_KIND,
} from '../../../server/providers/seals/contract.js';
import {
  createEmployee,
  grantToUser,
  composite,
  ALL,
} from '../employees/helpers.js';
export const signaturePdf = Buffer.from(
  '%PDF-1.4\nSynthetic document for protocol testing only\n%%EOF',
);
export const signedPdf = Buffer.from(
  '%PDF-1.4\nSynthetic signed artifact; not a legal signature\n%%EOF',
);
export async function electronicSealScenario(testApp: TestApp) {
  const c = testApp.application.container,
    org = c.resolve(organizationServiceToken),
    service = c.resolve(sealRequestServiceToken),
    head = await createEmployee(testApp, 'Electronic head'),
    owner = await createEmployee(testApp, 'Electronic owner'),
    keeper = await createEmployee(testApp, 'Electronic keeper'),
    stranger = await createEmployee(testApp, 'Electronic stranger');
  const department = await org.createDepartment(
    { title: 'Electronic office', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('sealKeeper', keeper.userId, {
    actorId: head.userId,
  });
  const grant = {
    resource: { type: 'settings', id: 'oa.electronicSignatures' },
    actions: [{ action: 'read' }, { action: 'send' }],
  };
  await grantToUser(
    testApp,
    'electronic-keeper',
    [
      grant,
      composite('oa.sealRequests', {
        view: { sealRequests: 'allRecords' },
        operate: { sealRequests: 'allRecords' },
      }),
    ],
    keeper.userId,
  );
  await grantToUser(testApp, 'electronic-stranger', [grant], stranger.userId);
  const input = {
      contractId: null,
      fileIds: [] as string[],
      sealType: 'official',
      executionMode: 'electronic' as const,
      copies: 0,
      external: false,
      returnDueAt: null,
      purpose: 'Approve an electronic PDF',
      contact: '',
    },
    access = { requests: ALL, view: ALL };
  let record = await service.create(owner.userId, input, randomUUID(), access);
  const file = await service.upload(
    owner.userId,
    record.id,
    new File([signaturePdf], 'approved.pdf', { type: 'application/pdf' }),
    randomUUID(),
    ALL,
  );
  record = await service.change(
    record.id,
    owner.userId,
    'edit',
    { ...input, fileIds: [file.id] },
    randomUUID(),
    record.lifecycleVersion,
    access,
  );
  record = await service.change(
    record.id,
    owner.userId,
    'submit',
    {},
    randomUUID(),
    record.lifecycleVersion,
    access,
  );
  const view = (await service.approvals.runViewsFor(SEAL_KIND, record.id)).at(
    -1,
  )!;
  const offer = (
    await service.approvals.actionsFor(SEAL_KIND, record.id, {
      id: head.userId,
    })
  ).find((row) => row.actions.some((a) => a.name === 'approve'))!;
  await service.perform(
    record.id,
    head.userId,
    {
      target: { taskId: offer.task.id },
      action: 'approve',
      contentHash: view.run.contentHash,
      requestId: randomUUID(),
    },
    access,
  );
  return { id: record.id, owner, head, keeper, stranger, service, access };
}

export async function electronicContractScenario(testApp: TestApp) {
  const { contractHttpServiceToken } =
      await import('../../../server/providers/contracts/service.js'),
    { serverFileRepositoryManagerToken } =
      await import('@nocobase/app-plugin-file/server');
  const c = testApp.application.container,
    org = c.resolve(organizationServiceToken),
    service = c.resolve(contractHttpServiceToken),
    owner = await createEmployee(testApp, 'Signed contract owner'),
    head = await createEmployee(testApp, 'Signed contract head'),
    legal = await createEmployee(testApp, 'Signed contract legal'),
    finance = await createEmployee(testApp, 'Signed contract finance');
  const department = await org.createDepartment(
    { title: 'Contract signature office', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('legal', legal.userId, { actorId: head.userId });
  await org.addDutyRoleMember('finance', finance.userId, {
    actorId: head.userId,
  });
  await grantToUser(
    testApp,
    'signature-legal',
    [
      {
        resource: { type: 'settings', id: 'oa.electronicSignatures' },
        actions: [{ action: 'read' }, { action: 'send' }],
      },
      composite('oa.contract', { view: { contractRequests: 'allRecords' } }),
    ],
    legal.userId,
  );
  const proposal = {
    contractType: 'purchase',
    counterparty: { kind: 'customer' as const, name: 'Synthetic party' },
    amountCents: 100,
    startsOn: '2026-10-01',
    endsOn: '2027-10-01',
    paymentTerms: 'Net 30',
    standardTemplate: true,
    textVersionId: null,
    attachments: [],
    reason: 'Approved electronic contract',
  };
  const created = await service.create(
    { operation: 'new', contractId: null, baseVersion: 0, proposal },
    owner.userId,
    randomUUID(),
  );
  const id = String(created.record.id);
  const { record: file } = await c
    .resolve(serverFileRepositoryManagerToken)
    .repository('contractAttachmentFiles', {
      disk: 'local',
      accessPath: '/uploads/contract',
      policy: {
        read: true,
        create: {
          scope: {
            requestId: id,
            ownerId: owner.userId,
            purpose: 'text',
            uploadVersion: Number(created.record.lifecycleVersion),
          },
          defaults: {
            requestId: id,
            ownerId: owner.userId,
            purpose: 'text',
            uploadVersion: Number(created.record.lifecycleVersion),
          },
        },
        update: false,
        delete: false,
      },
    })
    .uploadOne({
      file: new File([signaturePdf], 'approved-contract.pdf', {
        type: 'application/pdf',
      }),
    });
  const text = await service.appendText(
    id,
    owner.userId,
    file.id,
    randomUUID(),
    ALL,
  );
  let detail = await service.detail(id, owner.userId);
  await service.transition(
    id,
    owner.userId,
    'edit',
    { ...proposal, textVersionId: String(text.textVersion.id) },
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await service.detail(id, owner.userId);
  await service.transition(
    id,
    owner.userId,
    'submit',
    {},
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  for (const [actor, action] of [
    [head.userId, 'approve'],
    [finance.userId, 'claim'],
    [finance.userId, 'approve'],
  ] as const) {
    detail = await service.detail(id, actor);
    const run = detail.runs.find((r) => !r.run.endedAt)!;
    const task = run.tasks.find((t) => t.assigneeId === actor && !t.closedAt)!;
    if (!task) throw new Error(`Missing contract ${action} task`);
    await service.action(id, actor, {
      target: { taskId: task.id },
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      input: {},
    });
  }
  return {
    id,
    legal,
    owner,
    service,
    contractId: (await service.detail(id, owner.userId)).record.contractId,
  };
}

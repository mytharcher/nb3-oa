// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { isOpenRun } from '@nocobase/app-plugin-approval/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.js';
import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('registered empty head remains held and public maintenance emits a generation-specific administrator alarm', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    actor = (await createUser(testApp, 'Missing contract head')).user.id;
  await db.repository('employees').createOne({
    values: {
      id: randomUUID(),
      code: randomUUID(),
      name: 'Missing contract head',
      userId: actor,
      status: 'regular',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const department = await org.createDepartment(
    { title: 'No configured head' },
    { actorId: actor },
  );
  await org.addMember(
    { departmentId: department.id, userId: actor, primary: true },
    { actorId: actor },
  );
  const service = c.resolve(contractHttpServiceToken),
    proposal = {
      contractType: 'purchase',
      counterparty: { kind: 'customer' as const, name: 'Customer' },
      amountCents: 5000,
      startsOn: '2026-10-01',
      endsOn: '2027-10-01',
      paymentTerms: 'Net 30',
      standardTemplate: true,
      textVersionId: null,
      attachments: [],
      reason: 'Missing head proof',
    };
  const draft = await service.create(
      { operation: 'new', contractId: null, baseVersion: 0, proposal },
      actor,
      randomUUID(),
    ),
    id = String(draft.record.id),
    fileId = randomUUID();
  await db.repository('contractAttachmentFiles').createOne({
    values: {
      id: fileId,
      disk: 'local',
      key: 'head-proof.pdf',
      filename: 'Contract.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      requestId: id,
      ownerId: actor,
      uploadVersion: Number(draft.record.lifecycleVersion),
      purpose: 'text',
    },
  });
  const text = await service.appendText(id, actor, fileId, randomUUID(), {
    read: true,
    create: true,
    update: true,
    delete: false,
  });
  let detail = await service.detail(id, actor);
  await service.transition(
    id,
    actor,
    'edit',
    { ...proposal, textVersionId: String(text.textVersion.id) },
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await service.detail(id, actor);
  await service.transition(
    id,
    actor,
    'submit',
    {},
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await service.detail(id, actor);
  expect(detail.record.status).toBe('head');
  expect(detail.record.number).toBeNull();
  const run = detail.runs.find((v) => isOpenRun(v.run))!;
  expect(run.tasks).toHaveLength(0);
  const alarm = vi
    .spyOn(c.resolve(approvalNotificationServiceToken), 'alarm')
    .mockResolvedValue(undefined);
  try {
    await service.sweep();
    expect(alarm).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'oa.contract',
        recordId: id,
        eventId: `hold:${run.run.id}:${detail.record.lifecycleVersion}`,
        reason: 'unassigned',
      }),
    );
    expect((await service.detail(id, actor)).record.status).toBe('head');
  } finally {
    alarm.mockRestore();
  }
}, 60000);

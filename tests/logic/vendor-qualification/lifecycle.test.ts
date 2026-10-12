// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { vendorQualificationHttpServiceToken } from '../../../server/providers/vendor-qualification/service.js';
import {
  createPlatformAppTest,
  createUser,
  write,
} from '../platform/helpers.js';
const test = createPlatformAppTest();
test('same vendor qualification commits private account with votes and rolls back final vote if audit fails', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(vendorQualificationHttpServiceToken),
    vendors = c.resolve(vendorServiceToken),
    org = c.resolve(organizationServiceToken);
  const sessions = new Map(
    await Promise.all(
      ['applicant', 'purchasing', 'finance', 'head'].map(
        async (name) => [name, await createUser(testApp, name)] as const,
      ),
    ),
  );
  const people = Object.fromEntries(
    [...sessions].map(([name, session]) => [name, session.user.id]),
  );
  for (const [name, userId] of Object.entries(people))
    await db.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        name,
        userId,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  for (const role of ['purchasing', 'finance'])
    await org.addDutyRoleMember(role, people[role], {
      actorId: people.applicant,
    });
  const department = await org.createDepartment(
    { title: 'Qualification committee', managerId: people.head },
    { actorId: people.applicant },
  );
  await org.addMember(
    { departmentId: department.id, userId: people.applicant, primary: true },
    { actorId: people.applicant },
  );
  await db.transaction(async (tx) => {
    for (const seatKey of ['purchasing', 'finance'])
      await service.configuration.assign(
        {
          committeeVersion: 1,
          seatKey,
          personId: people[seatKey],
          expectedVersion: 0,
          actorId: people.applicant,
          reason: 'Configure fixed person',
        },
        tx,
      );
  });
  const vendor = await db.transaction((tx) =>
    vendors.create(
      {
        code: randomUUID(),
        name: 'Proposed supplier',
        category: 'service',
        contactName: 'Contact',
        contactPhone: '',
        contactEmail: '',
        bankName: 'Old bank',
        bankAccount: 'old-account',
        bankAccountName: 'Old owner',
        actorId: people.applicant,
        reason: 'Create',
      },
      tx,
    ),
  );
  const input = {
    operation: 'qualify' as const,
    vendorId: vendor.id,
    name: 'Qualified supplier',
    category: 'service',
    reason: 'Business qualification',
    quoteCents: 100,
    cases: 'Experience',
    contactName: 'Contact',
    contactPhone: '',
    contactEmail: '',
    attachments: [],
    qualificationExpiry: '2028-01-01',
  };
  const key = randomUUID(),
    created = await service.create(input, people.applicant, key),
    record = created.record;
  expect(record).toBeDefined();
  if (!record) throw new Error('Missing created record');
  expect((await service.create(input, people.applicant, key)).record?.id).toBe(
    record.id,
  );
  await expect(
    service.create({ ...input, reason: 'Different' }, people.applicant, key),
  ).rejects.toMatchObject({ kind: 'conflict' });
  const policy = {
    create: false,
    delete: false,
    read: true,
    update: true,
  };
  await service.updateBank(
    record.id,
    people.applicant,
    {
      lifecycleVersion: record.lifecycleVersion,
      bankVersion: 1,
      reason: 'Set protected facts',
      account: {
        bankName: 'Private new bank',
        bankAccount: 'private-new-account',
        bankAccountName: 'Private new owner',
      },
    },
    policy,
    policy,
  );
  const fileId = randomUUID();
  await db.repository('vendorQualificationAttachmentFiles').createOne({
    values: {
      id: fileId,
      disk: 'local',
      key: 'test.pdf',
      filename: 'Evidence.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      qualificationId: record.id,
      ownerId: people.applicant,
      uploadVersion: record.lifecycleVersion,
    },
  });
  await service.transition(
    record.id,
    people.applicant,
    'edit',
    record.lifecycleVersion,
    randomUUID(),
    { ...input, attachments: [fileId] },
  );
  let detail = await service.detail(record.id, people.applicant);
  await service.transition(
    record.id,
    people.applicant,
    'submit',
    detail.record!.lifecycleVersion,
    randomUUID(),
    {},
  );
  async function answer(
    person: string,
    action: string,
    documentId = record.id,
  ) {
    detail = await service.detail(documentId, person);
    const view = detail.runs.find((view) =>
      view.tasks.some(
        (task) =>
          task.assigneeId === person &&
          ['pending', 'candidate'].includes(task.status),
      ),
    );
    const task = view?.tasks.find(
      (task) =>
        task.assigneeId === person &&
        ['pending', 'candidate'].includes(task.status),
    );
    if (!task || !view) throw new Error('Missing offered task');
    return service.action(documentId, person, {
      target: { taskId: task.id },
      action,
      contentHash: view.run.contentHash,
      requestId: randomUUID(),
      input: {},
    });
  }
  await answer(people.purchasing, 'approve');
  await answer(people.purchasing, 'approve');
  await answer(people.head, 'approve');
  expect((await vendors.get(vendor.id))?.status).toBe('manual');
  const audit = c.resolve(auditServiceToken),
    original = audit.record.bind(audit),
    spy = vi
      .spyOn(audit, 'record')
      .mockImplementation((entry, tx) =>
        entry.action === 'vendor.qualification.qualified'
          ? Promise.reject(new Error('qualification audit failed'))
          : original(entry, tx),
      );
  await expect(answer(people.finance, 'approve')).rejects.toThrow(
    'qualification audit failed',
  );
  spy.mockRestore();
  expect((await vendors.get(vendor.id))?.status).toBe('manual');
  expect(
    (await service.detail(record.id, people.applicant)).record?.status,
  ).toBe('committee_v1');
  await answer(people.finance, 'approve');
  expect(await vendors.get(vendor.id)).toMatchObject({
    id: vendor.id,
    status: 'qualified',
    qualificationId: record.id,
    qualificationExpiry: '2028-01-01',
    bankAccount: 'private-new-account',
  });
  expect(
    JSON.stringify(await service.detail(record.id, people.applicant)),
  ).not.toContain('private-new-account');
  // A competing final vote cannot apply a second supplier update.
  const next = (await service.create(input, people.applicant, randomUUID()))
    .record!;
  await service.updateBank(
    next.id,
    people.applicant,
    {
      lifecycleVersion: next.lifecycleVersion,
      bankVersion: 1,
      reason: 'Next generation account',
      account: {
        bankName: 'Private next bank',
        bankAccount: 'CONCURRENT-PRIVATE',
        bankAccountName: 'Private next owner',
      },
    },
    policy,
    policy,
  );
  const nextFile = randomUUID();
  await db.repository('vendorQualificationAttachmentFiles').createOne({
    values: {
      id: nextFile,
      disk: 'local',
      key: 'next.pdf',
      filename: 'Evidence.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      qualificationId: next.id,
      ownerId: people.applicant,
      uploadVersion: next.lifecycleVersion,
    },
  });
  await service.transition(
    next.id,
    people.applicant,
    'edit',
    next.lifecycleVersion,
    randomUUID(),
    { ...input, attachments: [nextFile] },
  );
  const current = await service.detail(next.id, people.applicant);
  await service.transition(
    next.id,
    people.applicant,
    'submit',
    current.record!.lifecycleVersion,
    randomUUID(),
    {},
  );
  await answer(people.purchasing, 'approve', next.id);
  await answer(people.purchasing, 'approve', next.id);
  await answer(people.head, 'approve', next.id);
  await db.transaction((tx) =>
    vendors.update(
      vendor.id,
      {
        version: 2,
        name: 'Maintained supplier',
        actorId: people.applicant,
        reason: 'Concurrent supplier maintenance',
      },
      tx,
    ),
  );
  await expect(
    answer(people.finance, 'approve', next.id),
  ).rejects.toMatchObject({
    code: 'VENDOR_QUALIFICATION_VENDOR_VERSION_CONFLICT',
    kind: 'conflict',
  });
  const stale = await service.detail(next.id, people.applicant);
  expect(stale.record?.status).toBe('committee_v1');
  expect(stale.record?.sourceVendorVersion).toBe(2);
  await expect(
    service.transition(
      next.id,
      people.applicant,
      'restartReview',
      stale.record!.lifecycleVersion,
      randomUUID(),
      { reason: 'Rebase supplier facts' },
    ),
  ).rejects.toThrow();
  const authz = c.resolve(authorizationToken),
    root = (await authz.permissionSets.list()).find(
      (set) => authz.permissionSets.protection(set.key)?.unrestricted,
    )!;
  await authz.permissionSets.assign({
    permissionSet: root.key,
    subject: { type: 'user', id: people.head },
  });
  const adminView = await sessions
    .get('head')!
    .fetch(`/vendorQualifications/${next.id}`);
  expect(adminView.status).toBe(200);
  expect(
    (await adminView.json()).data.view.available.find(
      (offer: { name: string }) => offer.name === 'restartReview',
    ),
  ).toMatchObject({ allowed: true });
  const applicantView = await sessions
    .get('applicant')!
    .fetch(`/vendorQualifications/${next.id}`);
  expect(applicantView.status).toBe(200);
  expect(
    (await applicantView.json()).data.view.available.find(
      (offer: { name: string }) => offer.name === 'restartReview',
    ),
  ).toMatchObject({ allowed: false });
  const emptyReason = await sessions
    .get('head')!
    .fetch(
      `/vendorQualifications/${next.id}/transition`,
      write('POST', {
        name: 'restartReview',
        version: stale.record!.lifecycleVersion,
        requestId: randomUUID(),
        input: { reason: '' },
      }),
    );
  expect(emptyReason.status).not.toBe(200);
  expect((await service.detail(next.id, people.head)).record!.status).toBe(
    'committee_v1',
  );
  const restarted = await sessions
    .get('head')!
    .fetch(
      `/vendorQualifications/${next.id}/transition`,
      write('POST', {
        name: 'restartReview',
        version: stale.record!.lifecycleVersion,
        requestId: randomUUID(),
        input: { reason: 'Explicit rebase with fresh purchasing review' },
      }),
    );
  expect(restarted.status).toBe(200);
  const rebased = await service.detail(next.id, people.applicant);
  expect(rebased.record).toMatchObject({
    status: 'purchasing',
    sourceVendorVersion: 3,
    name: input.name,
  });
  expect(rebased.timeline.runs.length).toBeGreaterThanOrEqual(
    stale.timeline.runs.length,
  );
  await answer(people.purchasing, 'approve', next.id);
  await answer(people.purchasing, 'approve', next.id);
  await answer(people.head, 'approve', next.id);
  const final = await service.detail(next.id, people.finance),
    run = final.runs.find((view) =>
      view.tasks.some(
        (task) =>
          task.assigneeId === people.finance && task.status === 'pending',
      ),
    )!;
  const task = run.tasks.find(
    (task) => task.assigneeId === people.finance && task.status === 'pending',
  )!;
  const votes = await Promise.allSettled(
    [1, 2].map(() =>
      service.action(next.id, people.finance, {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        input: {},
      }),
    ),
  );
  expect(votes.filter((result) => result.status === 'fulfilled')).toHaveLength(
    1,
  );
  expect(votes.filter((result) => result.status === 'rejected')).toHaveLength(
    1,
  );
  expect(await vendors.get(vendor.id)).toMatchObject({
    version: 4,
    qualificationId: next.id,
    bankAccount: 'CONCURRENT-PRIVATE',
  });
  const notifications = c.resolve(approvalNotificationServiceToken),
    alarm = vi.spyOn(notifications, 'alarm').mockResolvedValue();
  // Company calendar dates: before the 30-day window does not send; the
  // boundary sends to the actual approved request, with a stable dedupe key.
  await service.expiryReminders(new Date('2027-12-01T12:00:00Z'));
  expect(alarm).not.toHaveBeenCalled();
  await service.expiryReminders(new Date('2027-12-02T12:00:00Z'));
  await service.expiryReminders(new Date('2027-12-03T12:00:00Z'));
  expect(alarm).toHaveBeenCalledTimes(2);
  expect(alarm.mock.calls[0][0]).toMatchObject({
    recordId: next.id,
    eventId: `vendor-expiry:${vendor.id}:2028-01-01:30`,
    detail: {
      key: 'vendorQualifications.schedule.expiryReminder',
      values: { supplierName: input.name, expiry: '2028-01-01' },
    },
  });
  expect(alarm.mock.calls[1][0].eventId).toBe(alarm.mock.calls[0][0].eventId);
  alarm.mockRestore();
  expect(
    (await service.listForCenter(people.applicant, 'all', policy)).map(
      (r) => r.id,
    ),
  ).toEqual(expect.arrayContaining([record.id, next.id]));
  expect(
    JSON.stringify(
      await service.listForCenter(people.applicant, 'all', policy),
    ),
  ).not.toContain('CONCURRENT-PRIVATE');
  await org.addMember(
    { departmentId: department.id, userId: people.purchasing, primary: true },
    { actorId: people.applicant },
  );
  const removal = (
    await service.create(
      {
        ...input,
        operation: 'remove',
        attachments: [],
        reason: 'Remove expired supplier',
      },
      people.purchasing,
      randomUUID(),
    )
  ).record!;
  await service.transition(
    removal.id,
    people.purchasing,
    'submit',
    removal.lifecycleVersion,
    randomUUID(),
    {},
  );
  const removalView = await service.detail(removal.id, people.purchasing);
  expect(removalView.record?.status).toBe('removalReview');
  expect(removalView.runs.some((v) => v.tasks.some((t) => t.assigneeId))).toBe(
    false,
  );
  const heldAlarm = vi.spyOn(notifications, 'alarm').mockResolvedValue();
  await service.sweep();
  expect(
    heldAlarm.mock.calls.some(
      ([entry]) =>
        entry.recordId === removal.id && entry.reason === 'unassigned',
    ),
  ).toBe(true);
  heldAlarm.mockRestore();
});

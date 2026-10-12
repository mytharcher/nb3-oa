// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { expect } from 'vitest';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { notificationTest as test } from '../knowledge/helpers.js';
import { replacementSource } from './replacement-source.js';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { vi } from 'vitest';
import {
  ALL,
  createEmployee,
  createPerson,
  employees,
} from '../employees/helpers.js';
import { kindFile, upload } from '../import/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { importServiceToken } from '../../../server/providers/import/service.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';

async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    capacity = c.resolve(headcountServiceToken);
  const person = await createEmployee(testApp, 'Roster ' + randomUUID());
  const write = { actorId: person.userId };
  const department = await org.createDepartment(
    { code: randomUUID(), title: 'Roster department' },
    write,
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Roster position' },
    write,
  );
  await employees(testApp).updateEmployee(
    person.employeeId,
    { positionId: position.id },
    ALL,
    person.userId,
  );
  await org.addMember(
    { departmentId: department.id, userId: person.userId, primary: true },
    write,
  );
  const command = () => ({
    actorId: person.userId,
    requestKey: randomUUID(),
    reason: 'Roster test',
  });
  const a = await db.transaction((tx) =>
    capacity.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year: Number(
          c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
        ),
        limit: 3,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    capacity.reconcile(
      {
        ...command(),
        accountId: a.id,
        expectedVersion: a.version,
        employeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  return {
    c,
    db,
    org,
    capacity,
    person,
    department,
    position,
    account: a,
    command,
    write,
    archive: employees(testApp),
  };
}
const patch = (body: unknown) => ({
  method: 'PATCH',
  headers: { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

test('administrator HTTP preserves ordinary edits but rejects occupancy-removing corrections with no audit/history residue', async ({
  testApp,
  request,
}) => {
  const f = await fixture(testApp),
    admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const path = `/employees/${f.person.employeeId}`;
  expect((await request(path, patch({ positionId: null }))).status).toBe(401);
  expect(
    (await (await f.person.session()).fetch(path, patch({ positionId: null })))
      .status,
  ).toBe(403);
  expect((await admin.fetch(path, patch({ phone: '555-test' }))).status).toBe(
    200,
  );
  const before = await f.db.repository('auditLogs').count();
  const denied = await admin.fetch(path, patch({ positionId: null }));
  expect(denied.status).toBe(400);
  expect(await denied.json()).toMatchObject({
    error: { reason: 'EMPLOYEE_HEADCOUNT_CONFLICT' },
  });
  const correction = await admin.fetch(`${path}/correctStatus`, {
    ...patch({
      status: 'left',
      active: false,
      reason: 'Invalid administrative exit',
    }),
    method: 'POST',
  });
  expect(correction.status).toBe(400);
  expect(await f.archive.getById(f.person.employeeId)).toMatchObject({
    positionId: f.position.id,
    status: 'regular',
    active: true,
    phone: '555-test',
  });
  expect(await f.db.repository('auditLogs').count()).toBe(before);
  expect(
    await f.db
      .repository('employeeHistory')
      .count({ filter: { employeeId: f.person.employeeId } }),
  ).toBe(0);
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1, available: 2 });
});

test('guard checks every initialized year and rejects new administrative intake without inventing used', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const year = f.account.year + 1;
  const a = await f.db.transaction((tx) =>
    f.capacity.create(
      {
        ...f.command(),
        departmentId: f.department.id,
        positionId: f.position.id,
        year,
        limit: 5,
      },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.capacity.reconcile(
      {
        ...f.command(),
        accountId: a.id,
        expectedVersion: a.version,
        employeeIds: [f.person.employeeId],
      },
      tx,
    ),
  );
  const next = await createPerson(testApp, 'Admin intake');
  await f.org.addMember(
    { departmentId: f.department.id, userId: next.userId, primary: true },
    f.write,
  );
  await expect(
    f.archive.createEmployee(
      {
        userId: next.userId,
        code: randomUUID(),
        name: 'Admin intake',
        status: 'probation',
        positionId: f.position.id,
      },
      ALL,
      f.person.userId,
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_HEADCOUNT_CONFLICT' });
  expect(await f.archive.getByUserId(next.userId)).toBeUndefined();
  for (const id of [a.id, f.account.id])
    expect(await f.capacity.balance(id, f.db.connection())).toMatchObject({
      used: 1,
    });
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'leaving', reason: 'Correct leaving status' },
    ALL,
    f.person.userId,
  );
  expect(await f.archive.getById(f.person.employeeId)).toMatchObject({
    status: 'leaving',
  });
});

test('employee import preview and execution refuse primary-department moves to uninitialized targets and roll back every row', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const target = await f.org.createDepartment(
    { code: randomUUID(), title: 'Uninitialized target' },
    f.write,
  );
  const archive = (await f.archive.getById(f.person.employeeId))!;
  const first = await createPerson(testApp, 'Earlier batch row');
  const file = await kindFile('employees', [
    {
      code: randomUUID(),
      user: first.email,
      name: 'Earlier batch row',
      status: 'regular',
    },
    {
      code: archive.code,
      user: f.person.email,
      name: 'Changed by import',
      positionCode: f.position.code!,
      departmentCode: target.code!,
      status: 'regular',
    },
  ]);
  const imports = f.c.resolve(importServiceToken);
  const preview = await imports.preview('employees', file, admin.user.id);
  expect(preview).toMatchObject({
    result: 'invalid',
    createdCount: 0,
    errors: [
      expect.objectContaining({
        code: 'WRITE_FAILED',
        params: expect.objectContaining({ reason: 'HEADCOUNT_ROSTER_DRIFT' }),
      }),
    ],
  });
  const result = await imports.run('employees', file, admin.user.id);
  expect(result).toMatchObject({
    status: 'failed',
    createdCount: 0,
    updatedCount: 0,
    errorCount: 1,
  });
  expect(await f.archive.getByUserId(first.userId)).toBeUndefined();
  expect(await f.archive.getById(f.person.employeeId)).toMatchObject({
    name: archive.name,
  });
  expect((await f.org.primaryDepartmentOf(f.person.userId))?.id).toBe(
    f.department.id,
  );
  expect(
    await f.db.repository('auditLogs').count({
      filter: { reason: `import:${result.id}`, action: 'employee.update' },
    }),
  ).toBe(0);
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1 });
  expect(result.file?.id).toBeTruthy();
});

test('import HTTP retains authorization and allows a consistent ordinary edit with preview rollback', async ({
  testApp,
  request,
}) => {
  const f = await fixture(testApp),
    admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const archive = (await f.archive.getById(f.person.employeeId))!;
  const file = await kindFile('employees', [
    {
      code: archive.code,
      user: f.person.email,
      name: 'Consistent imported name',
      positionCode: f.position.code!,
      departmentCode: f.department.code!,
      status: 'regular',
    },
  ]);
  expect(
    (await request('/imports/preview', upload('employees', file))).status,
  ).toBe(401);
  expect(
    (
      await (
        await f.person.session()
      ).fetch('/imports/preview', upload('employees', file))
    ).status,
  ).toBe(403);
  const preview = await admin.fetch(
    '/imports/preview',
    upload('employees', file),
  );
  expect(preview.status).toBe(200);
  expect(await preview.json()).toMatchObject({
    data: { result: 'ok', updatedCount: 1 },
  });
  expect((await f.archive.getById(f.person.employeeId))?.name).toBe(
    archive.name,
  );
  const run = await admin.fetch('/imports', upload('employees', file));
  expect(run.status).toBe(201);
  expect(await run.json()).toMatchObject({
    data: { status: 'succeeded', updatedCount: 1 },
  });
  expect((await f.archive.getById(f.person.employeeId))?.name).toBe(
    'Consistent imported name',
  );
});

test('same caller transaction sees earlier primary-membership drift and rolls back its organization writes', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const target = await f.org.createDepartment(
    { title: 'Outside roster' },
    f.write,
  );
  await expect(
    f.db.transaction((tx) =>
      f.capacity.within(tx, async (c) => {
        await f.org.addMember(
          { departmentId: target.id, userId: f.person.userId, primary: true },
          { ...f.write, connection: c },
        );
        await f.archive.updateEmployee(
          f.person.employeeId,
          { phone: 'Must roll back' },
          ALL,
          f.person.userId,
          { connection: c },
        );
      }),
    ),
  ).rejects.toMatchObject({ code: 'EMPLOYEE_HEADCOUNT_CONFLICT' });
  expect((await f.org.primaryDepartmentOf(f.person.userId))?.id).toBe(
    f.department.id,
  );
  expect((await f.archive.getById(f.person.employeeId))?.phone).toBeNull();
});

test('caller failure after a permitted employee edit rolls back its audit and releases the guard for a retry', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const before = await f.db.repository('auditLogs').count();
  await expect(
    f.db.transaction((tx) =>
      f.capacity.protectRoster([f.person.userId], tx, async (c) => {
        await f.archive.updateEmployee(
          f.person.employeeId,
          { phone: 'Rolled back' },
          ALL,
          f.person.userId,
          { connection: c },
        );
        throw new Error('Caller audit failed');
      }),
    ),
  ).rejects.toThrow('Caller audit failed');
  expect((await f.archive.getById(f.person.employeeId))?.phone).toBeNull();
  expect(await f.db.repository('auditLogs').count()).toBe(before);
  await f.archive.updateEmployee(
    f.person.employeeId,
    { phone: 'Retry succeeded' },
    ALL,
    f.person.userId,
  );
  expect((await f.archive.getById(f.person.employeeId))?.phone).toBe(
    'Retry succeeded',
  );
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1, available: 2 });
});

test('administrator correction restoring a leaving employee blocks approved future replacements permanently', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'leaving', reason: 'Leaving fact' },
    ALL,
    f.person.userId,
  );
  const source = await replacementSource(f.db.connection(), {
    applicantId: f.person.userId,
    departmentId: f.department.id,
    positionId: f.position.id,
    accountId: f.account.id,
    year: f.account.year,
    employeeId: f.person.employeeId,
  });
  await f.db.transaction((tx) =>
    f.capacity.hold(
      {
        ...f.command(),
        ...source,
        accountId: f.account.id,
        quantity: 1,
        replacementEmployeeIds: [f.person.employeeId],
      },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.capacity.allocate({ ...f.command(), ...source }, tx),
  );
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'regular', reason: 'Corrected leaving fact' },
    ALL,
    f.person.userId,
  );
  expect(await f.capacity.reservation(source, f.db.connection())).toMatchObject(
    { blocked: 1 },
  );
  await verifyReplacementInbox(
    f.db.connection(),
    f.c.resolve(notificationServiceToken),
    source.sourceId,
    f.person,
  );
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1, replacementBlocked: 1 });
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'leaving', reason: 'A later leaving fact' },
    ALL,
    f.person.userId,
  );
  expect(await f.capacity.reservation(source, f.db.connection())).toMatchObject(
    { blocked: 1 },
  );
  await verifyReplacementInbox(
    f.db.connection(),
    f.c.resolve(notificationServiceToken),
    source.sourceId,
    f.person,
  );
  expect(
    await f.db.repository('auditLogs').count({
      filter: {
        action: 'employee.correctStatus',
        reason: 'Corrected leaving fact',
      },
    }),
  ).toBe(1);
});

test('import restoration uses the same public replacement invalidation and previews roll it back', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'leaving', reason: 'Leaving before import' },
    ALL,
    f.person.userId,
  );
  const source = await replacementSource(f.db.connection(), {
    applicantId: f.person.userId,
    departmentId: f.department.id,
    positionId: f.position.id,
    accountId: f.account.id,
    year: f.account.year,
    employeeId: f.person.employeeId,
  });
  await f.db.transaction((tx) =>
    f.capacity.hold(
      {
        ...f.command(),
        ...source,
        accountId: f.account.id,
        quantity: 1,
        replacementEmployeeIds: [f.person.employeeId],
      },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.capacity.allocate({ ...f.command(), ...source }, tx),
  );
  const archive = (await f.archive.getById(f.person.employeeId))!;
  const file = await kindFile('employees', [
    {
      code: archive.code,
      user: f.person.email,
      name: archive.name,
      positionCode: f.position.code!,
      departmentCode: f.department.code!,
      status: 'regular',
    },
  ]);
  const imports = f.c.resolve(importServiceToken);
  expect(
    await imports.preview('employees', file, f.person.userId),
  ).toMatchObject({ result: 'ok', updatedCount: 1 });
  expect(
    await f.db
      .repository('headcountReplacementNotices')
      .count({ filter: { sourceId: source.sourceId } }),
  ).toBe(0);
  expect((await f.archive.getById(f.person.employeeId))?.status).toBe(
    'leaving',
  );
  expect(await f.capacity.reservation(source, f.db.connection())).toMatchObject(
    { blocked: 0 },
  );
  expect(await imports.run('employees', file, f.person.userId)).toMatchObject({
    status: 'succeeded',
    updatedCount: 1,
  });
  expect((await f.archive.getById(f.person.employeeId))?.status).toBe(
    'regular',
  );
  expect(await f.capacity.reservation(source, f.db.connection())).toMatchObject(
    { blocked: 1 },
  );
  await verifyReplacementInbox(
    f.db.connection(),
    f.c.resolve(notificationServiceToken),
    source.sourceId,
    f.person,
  );
  expect(
    await f.capacity.balance(f.account.id, f.db.connection()),
  ).toMatchObject({ used: 1 });
});

async function verifyReplacementInbox(
  tx: import('@nocobase/db').DatabaseConnection,
  notification: import('@nocobase/app-plugin-notification/server').NotificationService,
  sourceId: string,
  person: Awaited<ReturnType<typeof createEmployee>>,
) {
  let noticeId = '';
  await vi.waitFor(
    async () => {
      const notices = await tx
        .repository('headcountReplacementNotices')
        .findMany({ filter: { sourceId } });
      expect(notices).toHaveLength(1);
      expect(notices[0]?.status).toBe('notified');
      noticeId = String(notices[0]!.id);
      expect(JSON.stringify(notices)).not.toContain('Sensitive synthetic');
    },
    { timeout: 10000 },
  );
  const key = `oa.headcounts.blocked:${noticeId}:${person.userId}`;
  await vi.waitFor(
    async () => {
      const state = await notification.getByIdempotencyKey(key);
      expect(state?.terminal).toBe(true);
      expect(state?.summary.accepted).toBe(1);
    },
    { timeout: 10000 },
  );
  const sent = await notification.getByIdempotencyKey(key);
  const session = await person.session();
  const response = await session.fetch(
    '/notificationInApp/messages?pageSize=100',
  );
  expect(response.status).toBe(200);
  const messages = (await response.json()).data as {
    notificationId: string;
    target: unknown;
  }[];
  const linked = messages.filter(
    (m) => m.notificationId === sent!.notificationId,
  );
  expect(linked).toHaveLength(1);
  expect(linked[0]?.target).toEqual({
    type: 'route',
    path: `/recruitment-requests/${sourceId}`,
  });
}

async function blockedFixture(testApp: Parameters<typeof createEmployee>[0]) {
  const f = await fixture(testApp);
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'leaving', reason: 'Future source' },
    ALL,
    f.person.userId,
  );
  const source = await replacementSource(f.db.connection(), {
    applicantId: f.person.userId,
    departmentId: f.department.id,
    positionId: f.position.id,
    accountId: f.account.id,
    year: f.account.year,
    employeeId: f.person.employeeId,
  });
  await f.db.transaction((tx) =>
    f.capacity.hold(
      {
        ...f.command(),
        ...source,
        accountId: f.account.id,
        quantity: 1,
        replacementEmployeeIds: [f.person.employeeId],
      },
      tx,
    ),
  );
  return { ...f, source };
}

test('restoration caller failure rolls back frozen notice and effects; public command replay and historical backfill stay unique', async ({
  testApp,
}) => {
  const f = await blockedFixture(testApp);
  await expect(
    f.db.transaction(async (tx) => {
      await f.archive.correctStatus(
        f.person.employeeId,
        { status: 'regular', reason: 'Aborted restore' },
        ALL,
        f.person.userId,
        { connection: tx },
      );
      expect(
        await tx
          .repository('headcountReplacementNotices')
          .count({ filter: { sourceId: f.source.sourceId } }),
      ).toBe(1);
      throw new Error('Source caller failure');
    }),
  ).rejects.toThrow('Source caller failure');
  expect(
    await f.db
      .repository('headcountReplacementNotices')
      .count({ filter: { sourceId: f.source.sourceId } }),
  ).toBe(0);
  expect((await f.archive.getById(f.person.employeeId))?.status).toBe(
    'leaving',
  );
  expect(
    await f.capacity.reservation(f.source, f.db.connection()),
  ).toMatchObject({ blocked: 0 });
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'regular', reason: 'Restore retry' },
    ALL,
    f.person.userId,
  );
  const command = { ...f.command(), employeeId: f.person.employeeId };
  await f.db.transaction((tx) =>
    f.capacity.invalidateReplacements(command, tx),
  );
  await f.db.transaction((tx) =>
    f.capacity.invalidateReplacements(command, tx),
  );
  expect(
    await f.db
      .repository('headcountReplacementNotices')
      .count({ filter: { sourceId: f.source.sourceId } }),
  ).toBe(1);
  // Simulate a pre-outbox deployment's blocked source, preserving its actual source/seat facts.
  await f.db
    .repository('headcountReplacementNotices')
    .deleteMany({ filter: { sourceId: f.source.sourceId } });
  await f.capacity.recoverReplacementNotifications(f.db.connection());
  await f.capacity.recoverReplacementNotifications(f.db.connection());
  expect(
    await f.db
      .repository('headcountReplacementNotices')
      .count({ filter: { sourceId: f.source.sourceId } }),
  ).toBe(1);
  expect(
    await f.capacity.reservation(f.source, f.db.connection()),
  ).toMatchObject({ blocked: 1 });
});

test('recruitment owner honors current action, row and id-field policies; restored grants do not redispatch a settled suppression', async ({
  testApp,
}) => {
  const f = await blockedFixture(testApp);
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'regular', reason: 'Restored policy source' },
    ALL,
    f.person.userId,
  );
  const { recruitmentServiceToken } =
    await import('../../../server/providers/recruitment/service.js');
  const { authorizationToken } =
    await import('@nocobase/app-plugin-authorization/server');
  const { createRecruitmentReplacementOwner } =
    await import('../../../server/providers/recruitment/notifications.js');
  const { userAdministrationServiceToken } =
    await import('@nocobase/app-plugin-authentication');
  const { createReplacementNotifications } =
    await import('../../../server/providers/headcounts/notifications.js');
  const authz = f.c.resolve(authorizationToken),
    recruitment = f.c.resolve(recruitmentServiceToken);
  const read = (policy: import('@nocobase/db').RepositoryPolicy) =>
    f.db.transaction((tx) =>
      recruitment.replacementNoticeEligible(
        f.source.sourceId,
        f.person.userId,
        tx,
        { create: false, update: false, delete: false, ...policy },
      ),
    );
  expect(await read({ read: { fields: ['id'], scope: true } })).toBe(true);
  expect(
    await read({
      read: {
        fields: ['id'],
        scope: (filter) => filter.string('id').eq('different-source'),
      },
    }),
  ).toBe(false);
  // Explicitly requesting a field excluded by the read policy must fail closed.
  await expect(
    read({ read: { fields: ['reason'], scope: true } }),
  ).rejects.toThrow();
  const send =
    vi.fn<
      import('@nocobase/app-plugin-notification/server').NotificationService['send']
    >();
  const owner = createRecruitmentReplacementOwner({
    service: () => recruitment,
    db: f.db,
    authz,
    users: f.c.resolve(userAdministrationServiceToken),
    notification: {
      send,
    } as unknown as import('@nocobase/app-plugin-notification/server').NotificationService,
    channels: { inbox: { provider: 'in-app' } },
    inbox: () => 'inbox',
    delivery: async () => ({
      channel: 'inbox',
      title: 'Safe title',
      body: 'Safe body',
    }),
  });
  const notices = createReplacementNotifications({
    db: f.db,
    dispatcher: { dispatch: async () => {} },
  });
  notices.register('oa.recruitment', owner);
  const id = await f.db.transaction((tx) =>
    notices.enqueue(f.source, f.person.userId, tx),
  );
  const original = await authz.permissionSets.get('oa-recruitment-employee');
  if (!original) throw new Error('Missing main recruitment employee default');
  await authz.permissionSets.update(original.key, { ...original, grants: [] });
  const [run] = await notices.runtime.listEffectRuns({ recordId: id });
  await notices.runtime.runEffect(run.id);
  expect(send).not.toHaveBeenCalled();
  expect(
    (
      await f.db
        .repository('headcountReplacementNotices')
        .findOne({ filter: { id } })
    )?.status,
  ).toBe('notified');
  await authz.permissionSets.update(original.key, original);
  await notices.runtime.runEffect(run.id);
  expect(send).not.toHaveBeenCalled();
});

test('unavailable inbox retains pending outbox, retries its immutable body/key and repeated execution creates one actual delivery', async ({
  testApp,
}) => {
  const f = await blockedFixture(testApp);
  await f.archive.correctStatus(
    f.person.employeeId,
    { status: 'regular', reason: 'Retry source' },
    ALL,
    f.person.userId,
  );
  const { recruitmentServiceToken } =
    await import('../../../server/providers/recruitment/service.js');
  const { authorizationToken } =
    await import('@nocobase/app-plugin-authorization/server');
  const { createRecruitmentReplacementOwner } =
    await import('../../../server/providers/recruitment/notifications.js');
  const { userAdministrationServiceToken } =
    await import('@nocobase/app-plugin-authentication');
  const { createReplacementNotifications } =
    await import('../../../server/providers/headcounts/notifications.js');
  let clock = Date.now(),
    body = 'Frozen safe body';
  const channels = { inbox: { provider: 'in-app' as const, enabled: false } };
  const notification = f.c.resolve(notificationServiceToken),
    send = vi.spyOn(notification, 'send');
  try {
    const owner = createRecruitmentReplacementOwner({
      service: () => f.c.resolve(recruitmentServiceToken),
      db: f.db,
      authz: f.c.resolve(authorizationToken),
      users: f.c.resolve(userAdministrationServiceToken),
      notification,
      channels,
      inbox: () => 'inbox',
      delivery: async () => ({ channel: 'inbox', title: 'Safe title', body }),
    });
    const notices = createReplacementNotifications({
      db: f.db,
      dispatcher: { dispatch: async () => {} },
      now: () => new Date(clock),
    });
    notices.register('oa.recruitment', owner);
    const id = await f.db.transaction((tx) =>
      notices.enqueue(f.source, f.person.userId, tx),
    );
    const [run] = await notices.runtime.listEffectRuns({ recordId: id });
    await notices.runtime.runEffect(run.id);
    expect(
      (
        await f.db
          .repository('headcountReplacementNotices')
          .findOne({ filter: { id } })
      )?.status,
    ).toBe('pending');
    expect(
      (await notices.runtime.listEffectRuns({ recordId: id }))[0].status,
    ).toBe('queued');
    channels.inbox.enabled = true;
    body = 'Changed deployment copy';
    clock += 6000;
    await notices.runtime.runEffect(run.id);
    await notices.runtime.runEffect(run.id);
    const key = `oa.headcounts.blocked:${id}:${f.person.userId}`;
    expect(
      send.mock.calls.filter(([input]) => input.idempotencyKey === key),
    ).toHaveLength(1);
    expect(
      send.mock.calls.find(([input]) => input.idempotencyKey === key)?.[0]
        .messages,
    ).toEqual({
      inbox: {
        to: f.person.userId,
        title: 'Safe title',
        body: 'Frozen safe body',
        target: {
          type: 'route',
          path: `/recruitment-requests/${f.source.sourceId}`,
        },
      },
    });
    await vi.waitFor(
      async () => {
        const state = await notification.getByIdempotencyKey(key);
        expect(state?.terminal).toBe(true);
        expect(state?.summary.accepted).toBe(1);
      },
      { timeout: 10000 },
    );
  } finally {
    send.mockRestore();
  }
});

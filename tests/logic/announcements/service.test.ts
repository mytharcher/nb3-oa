// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.js';
import { createEmployee, ALL } from '../employees/helpers.js';
import { createAnnouncementService } from '../../../server/providers/announcements/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
const test = createPlatformAppTest();
async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    publisher = await createEmployee(testApp, 'Announcement publisher'),
    reader = await createEmployee(testApp, 'Announcement reader');
  let time = new Date('2030-01-01T00:00:00Z');
  const notices: { users: string[]; key: string }[] = [];
  const deps = {
    db,
    audit: c.resolve(auditServiceToken),
    org: c.resolve(orgServiceToken),
    now: () => time,
    dispatcher: { dispatch: async () => {} },
    notify: async (users: string[], _id: string, key: string) => {
      notices.push({ users, key });
    },
  };
  const service = createAnnouncementService(deps),
    cmd = (actorId = publisher.userId) => ({
      actorId,
      requestId: randomUUID(),
    }),
    input = () => ({
      ...cmd(),
      title: 'Policy notice',
      body: 'Please read the new policy.',
      audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
      requiresConfirmation: true,
      pinned: true,
      attachments: [],
      validFrom: '2029-12-31T00:00:00Z',
      validUntil: '2030-01-03T00:00:00Z',
    });
  return {
    db,
    publisher,
    reader,
    service,
    deps,
    notices,
    cmd,
    input,
    setTime: (v: string) => {
      time = new Date(v);
    },
    save: (i = input()) => db.transaction((tx) => service.save(i, tx)),
    publish: (id: string, expectedVersion: number) =>
      db.transaction((tx) =>
        service.act({ ...cmd(), id, expectedVersion, action: 'publish' }, tx),
      ),
  };
}
test('publication freezes recipient roster, confirmation is own-only, replay conflicts and journals are immutable', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    i = f.input(),
    draft = await f.save(i);
  expect((await f.save(i)).id).toBe(draft.id);
  await expect(f.save({ ...i, title: 'Changed' })).rejects.toThrow(
    'COMMAND_CONFLICT',
  );
  const published = await f.publish(draft.id, draft.version);
  expect(published.status).toBe('published');
  const receipts = await f.service.receipts(
    draft.id,
    f.publisher.userId,
    f.db.connection(),
  );
  expect(receipts.map((r) => r.userId)).toEqual(
    expect.arrayContaining([f.publisher.userId, f.reader.userId]),
  );
  const late = await createEmployee(testApp, 'Late joining employee');
  expect(
    await f.service.get(draft.id, late.userId, f.db.connection()),
  ).toBeUndefined();
  await expect(
    f.db.transaction((tx) =>
      f.service.confirm({ ...f.cmd(late.userId), id: draft.id }, tx),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const confirm = { ...f.cmd(f.reader.userId), id: draft.id };
  expect(
    (await f.db.transaction((tx) => f.service.confirm(confirm, tx))).status,
  ).toBe('confirmed');
  expect(
    (await f.db.transaction((tx) => f.service.confirm(confirm, tx))).status,
  ).toBe('confirmed');
  expect(
    (await f.service.pending(f.reader.userId, f.db.connection())).count,
  ).toBe(0);
  await expect(
    f.service.receipts(draft.id, f.reader.userId, f.db.connection()),
  ).rejects.toThrow('ACCESS_DENIED');
  expect(
    await f.db.repository('oaLifecycleTransitions').count({
      filter: (f) =>
        f.and([
          f.string('lifecycle').eq('oa.announcementReceipt'),
          f.or(receipts.map((r) => f.string('recordId').eq(r.id))),
        ]),
    }),
  ).toBe(receipts.length + 1);
});
test('expired confirmation and revoked reads fail closed; audit failure rolls back publication and receipt batch', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    draft = await f.save(),
    broken = createAnnouncementService({
      ...f.deps,
      audit: {
        ...f.deps.audit,
        record: async () => {
          throw new Error('Audit failure');
        },
      },
    });
  await expect(
    f.db.transaction((tx) =>
      broken.act(
        {
          ...f.cmd(),
          id: draft.id,
          expectedVersion: draft.version,
          action: 'publish',
        },
        tx,
      ),
    ),
  ).rejects.toThrow('Audit failure');
  expect(
    await f.db
      .repository('announcementReceipts')
      .count({ filter: { announcementId: draft.id } }),
  ).toBe(0);
  expect(
    (await f.service.get(draft.id, f.publisher.userId, f.db.connection()))
      ?.status,
  ).toBe('draft');
  const pub = await f.publish(draft.id, draft.version);
  f.setTime('2030-01-03T00:00:00Z');
  await expect(
    f.db.transaction((tx) =>
      f.service.confirm({ ...f.cmd(f.reader.userId), id: pub.id }, tx),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  f.setTime('2030-01-02T00:00:00Z');
  await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(),
        id: pub.id,
        expectedVersion: pub.version,
        action: 'revoke',
      },
      tx,
    ),
  );
  expect(
    await f.service.get(pub.id, f.reader.userId, f.db.connection()),
  ).toBeUndefined();
  expect(
    await f.db
      .repository('announcementReceipts')
      .count({ filter: { announcementId: pub.id } }),
  ).toBeGreaterThan(0);
});
test('command replay checks current read/update policies and pending ignores departure roster drift', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    draft = await f.save(),
    publish = {
      ...f.cmd(),
      id: draft.id,
      expectedVersion: draft.version,
      action: 'publish' as const,
    };
  const a = await f.db.transaction((tx) => f.service.act(publish, tx, ALL));
  await expect(
    f.db.transaction((tx) =>
      f.service.act(publish, tx, { ...ALL, read: false }),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  await expect(
    f.db.transaction((tx) =>
      f.service.act(publish, tx, { ...ALL, update: false }),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  expect(
    (await f.db.transaction((tx) => f.service.act(publish, tx, ALL))).id,
  ).toBe(a.id);
  await f.db.repository('employees').updateOne({
    filter: { id: f.reader.employeeId },
    values: { active: false },
  });
  expect(
    await f.service.get(a.id, f.reader.userId, f.db.connection()),
  ).toBeUndefined();
  expect(
    (await f.service.pending(f.reader.userId, f.db.connection())).count,
  ).toBe(0);
});
test('future publication activates through durable trigger and reminder creates one effect per command', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    draft = await f.save({ ...f.input(), validFrom: '2030-01-02T00:00:00Z' }),
    pub = await f.publish(draft.id, draft.version);
  expect(pub.status).toBe('scheduled');
  expect(
    (await f.service.pending(f.reader.userId, f.db.connection())).count,
  ).toBe(0);
  f.setTime('2030-01-02T00:00:01Z');
  await f.service.runtime.runTriggers();
  const activated = (await f.service.get(
    pub.id,
    f.publisher.userId,
    f.db.connection(),
  ))!;
  expect(activated.status).toBe('published');
  const before = await f.db
    .repository('oaLifecycleEffectRuns')
    .count({ filter: { lifecycle: 'oa.announcement', recordId: pub.id } });
  const reminder = {
    ...f.cmd(),
    id: pub.id,
    expectedVersion: activated.version,
    action: 'remind' as const,
  };
  await f.db.transaction((tx) => f.service.act(reminder, tx));
  await f.db.transaction((tx) => f.service.act(reminder, tx));
  expect(
    await f.db
      .repository('oaLifecycleEffectRuns')
      .count({ filter: { lifecycle: 'oa.announcement', recordId: pub.id } }),
  ).toBe(before + 1);
});
test('effect dispatch excludes confirmed/departed recipients and replay never redelivers; expired effects remain silent', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    draft = await f.save(),
    published = await f.publish(draft.id, draft.version);
  const effects = await f.service.runtime.listEffectRuns({
    recordId: published.id,
  });
  expect(effects.length).toBe(1);
  await f.db.transaction((tx) =>
    f.service.confirm({ ...f.cmd(f.reader.userId), id: published.id }, tx),
  );
  await f.service.runtime.runEffect(effects[0].id);
  await f.service.runtime.runEffect(effects[0].id);
  expect(f.notices).toHaveLength(1);
  expect(f.notices[0].users).not.toContain(f.reader.userId);
  const reminder = await f.db.transaction((tx) =>
    f.service.act(
      {
        ...f.cmd(),
        id: published.id,
        expectedVersion: published.version,
        action: 'remind',
      },
      tx,
    ),
  );
  const next = (
    await f.service.runtime.listEffectRuns({ recordId: published.id })
  ).filter((e) => e.id !== effects[0].id);
  expect(next).toHaveLength(1);
  f.setTime('2030-01-03T00:00:00Z');
  await f.service.runtime.runEffect(next[0].id);
  expect(f.notices).toHaveLength(1);
  expect(reminder.status).toBe('published');
});
test('department descendants and duty role union are frozen and deduplicated; invalid scopes rollback', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    { organizationServiceToken } =
      await import('../../../server/providers/org/index.js'),
    org = testApp.application.container.resolve(organizationServiceToken);
  const top = await org.createDepartment(
      { title: 'Announcement parent' },
      { actorId: f.publisher.userId },
    ),
    child = await org.createDepartment(
      { title: 'Announcement child', parentId: top.id },
      { actorId: f.publisher.userId },
    );
  await org.addMember(
    { departmentId: child.id, userId: f.reader.userId, primary: true },
    { actorId: f.publisher.userId },
  );
  await org.addDutyRoleMember('admin', f.reader.userId, {
    actorId: f.publisher.userId,
  });
  const i = {
      ...f.input(),
      audience: {
        all: false,
        departmentIds: [top.id],
        dutyRoleCodes: ['admin'],
      },
    },
    draft = await f.save(i);
  await f.publish(draft.id, draft.version);
  const receipts = await f.service.receipts(
    draft.id,
    f.publisher.userId,
    f.db.connection(),
  );
  expect(receipts).toHaveLength(1);
  expect(receipts[0].userId).toBe(f.reader.userId);
  await org.removeDutyRoleMember('admin', f.reader.userId, {
    actorId: f.publisher.userId,
  });
  await org.removeMember(child.id, f.reader.userId, {
    actorId: f.publisher.userId,
  });
  expect(
    await f.service.get(draft.id, f.reader.userId, f.db.connection()),
  ).toBeTruthy();
  const invalid = await f.save({
    ...f.input(),
    audience: { all: false, departmentIds: ['missing'], dutyRoleCodes: [] },
  });
  await expect(f.publish(invalid.id, invalid.version)).rejects.toThrow(
    'INVALID_AUDIENCE',
  );
  expect(
    await f.db
      .repository('announcementReceipts')
      .count({ filter: { announcementId: invalid.id } }),
  ).toBe(0);
});
test('concurrent publication commits one frozen batch and concurrent confirmation writes one final journal', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    draft = await f.save();
  const results = await Promise.allSettled([
    f.publish(draft.id, draft.version),
    f.publish(draft.id, draft.version),
  ]);
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const receipts = await f.service.receipts(
    draft.id,
    f.publisher.userId,
    f.db.connection(),
  );
  const confirmed = await Promise.allSettled([
    f.db.transaction((tx) =>
      f.service.confirm({ ...f.cmd(f.reader.userId), id: draft.id }, tx),
    ),
    f.db.transaction((tx) =>
      f.service.confirm({ ...f.cmd(f.reader.userId), id: draft.id }, tx),
    ),
  ]);
  expect(
    confirmed.filter((r) => r.status === 'fulfilled').length,
  ).toBeGreaterThanOrEqual(1);
  expect(
    await f.db
      .repository('announcementReceipts')
      .count({ filter: { announcementId: draft.id } }),
  ).toBe(receipts.length);
  expect(
    await f.db.repository('oaLifecycleTransitions').count({
      filter: (f) =>
        f.and([
          f.string('lifecycle').eq('oa.announcementReceipt'),
          f.or(receipts.map((r) => f.string('recordId').eq(r.id))),
        ]),
    }),
  ).toBe(receipts.length + 1);
});

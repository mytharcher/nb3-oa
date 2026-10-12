// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import {
  lockUserForAdministration,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { createEmployee, ALL } from '../employees/helpers.js';
import { createWorkItemAppTest } from './helpers.js';
import {
  createWorkItemService,
  type ConfirmationHandoverInput,
} from '../../../server/providers/work-items/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createWorkItemAppTest();
async function setup(app: Parameters<typeof createEmployee>[0]) {
  const c = app.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    creator = await createEmployee(app, 'Original creator'),
    worker = await createEmployee(app, 'Actual worker'),
    successor = await createEmployee(app, 'Confirmation successor'),
    hr = await createEmployee(app, 'Handover HR'),
    other = await createEmployee(app, 'Later successor');
  await org.addDutyRoleMember('hr', hr.userId, { actorId: creator.userId });
  const notices: string[][] = [],
    deps = {
      db,
      org: c.resolve(orgServiceToken),
      employees: c.resolve(employeeServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      audit: c.resolve(auditServiceToken),
      dispatcher: { dispatch: async () => {} },
      notify: async (ids: string[]) => {
        notices.push(ids);
      },
      now: () => new Date('2030-01-01T00:00:00Z'),
    },
    service = createWorkItemService(deps),
    saveInput = {
      actorId: creator.userId,
      requestId: randomUUID(),
      title: 'Confirm result',
      description: 'Retain creation facts',
      targetUserId: worker.userId,
      dutyRoleCode: null,
      dueAt: '2030-01-05T00:00:00Z',
      requiresConfirmation: true,
      attachments: [],
    };
  const draft = await db.transaction((tx) => service.save(saveInput, tx, ALL)),
    assigned = await db.transaction((tx) =>
      service.act(
        {
          id: draft.id,
          actorId: creator.userId,
          requestId: randomUUID(),
          expectedVersion: draft.version,
          action: 'dispatch',
        },
        tx,
        ALL,
      ),
    );
  const input: ConfirmationHandoverInput = {
    id: assigned.id,
    actorId: hr.userId,
    requestId: randomUUID(),
    expectedVersion: assigned.version,
    fromUserId: creator.userId,
    toUserId: successor.userId,
    reason: 'Departure confirmation handover',
  };
  const transfer = (i = input, p = { view: ALL, handover: ALL }) =>
    db.transaction((tx) => service.handoverConfirmation(i, tx, p));
  return {
    c,
    db,
    org,
    creator,
    worker,
    successor,
    hr,
    other,
    service,
    deps,
    assigned,
    saveInput,
    input,
    transfer,
    notices,
  };
}
test('actual HR handover moves only confirmation responsibility; current DTO replay, audit and receipt-owner notices remain truthful', async ({
  testApp,
}) => {
  const f = await setup(testApp),
    before = await f.db.repository('workItemCommands').findMany(),
    awaiting = await f.db.transaction((tx) =>
      f.service.act(
        {
          id: f.assigned.id,
          actorId: f.worker.userId,
          requestId: randomUUID(),
          expectedVersion: f.assigned.version,
          action: 'complete',
          result: 'Actual result',
        },
        tx,
        ALL,
      ),
    );
  f.input.expectedVersion = awaiting.version;
  const moved = await f.transfer();
  expect(moved).toMatchObject({
    creatorUserId: f.creator.userId,
    confirmationOwnerUserId: f.successor.userId,
    assigneeUserId: f.worker.userId,
    status: 'awaitingConfirmation',
    result: 'Actual result',
    version: awaiting.version + 1,
  });
  expect(
    (await f.service.departureBlockers(f.creator.userId, f.db.connection()))
      .remaining,
  ).toBe(0);
  expect(
    (await f.service.departureBlockers(f.successor.userId, f.db.connection()))
      .items[0]?.reasons,
  ).toEqual(['confirmationOwner']);
  expect(
    (await f.service.departureBlockers(f.worker.userId, f.db.connection()))
      .remaining,
  ).toBe(1);
  expect(
    await f.service.actions(moved, f.creator.userId, f.db.connection()),
  ).not.toContain('confirm');
  expect(
    await f.service.actions(moved, f.successor.userId, f.db.connection()),
  ).toEqual(['confirm', 'return']);
  await expect(
    f.db.transaction((tx) =>
      f.service.act(
        {
          id: moved.id,
          actorId: f.creator.userId,
          requestId: randomUUID(),
          expectedVersion: moved.version,
          action: 'confirm',
        },
        tx,
        ALL,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const commands = await f.db.repository('workItemCommands').findMany(),
    journal = await f.db
      .repository('oaLifecycleTransitions')
      .count({ filter: { recordId: moved.id } });
  expect((await f.transfer()).version).toBe(moved.version);
  expect(await f.db.repository('workItemCommands').findMany()).toEqual(
    commands,
  );
  expect(
    await f.db
      .repository('oaLifecycleTransitions')
      .count({ filter: { recordId: moved.id } }),
  ).toBe(journal);
  const replay = await f.db.transaction((tx) =>
    f.service.save(f.saveInput, tx, ALL),
  );
  expect(replay.confirmationOwnerUserId).toBe(f.successor.userId);
  expect(replay.version).toBe(moved.version);
  for (const row of before)
    expect(
      await f.db
        .repository('workItemCommands')
        .findOne({ filter: { id: row.id } }),
    ).toEqual(row);
  const runs = await f.service.runtime.listEffectRuns({ recordId: moved.id });
  for (const r of runs) {
    await f.service.runtime.runEffect(r.id);
    await f.service.runtime.runEffect(r.id);
  }
  expect(f.notices).toEqual([[f.successor.userId]]);
  const audit = await f.db.repository('auditLogs').findMany({
    filter: { targetId: moved.id, action: 'workItem.handoverConfirmation' },
  });
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({ reason: f.input.reason });
  const complete = await f.db.transaction((tx) =>
    f.service.act(
      {
        id: moved.id,
        actorId: f.successor.userId,
        requestId: randomUUID(),
        expectedVersion: moved.version,
        action: 'confirm',
      },
      tx,
      ALL,
    ),
  );
  expect(complete.status).toBe('completed');
  expect((await f.transfer()).version).toBe(complete.version);
});
test('handover enforces actual HR/admin, both accounts, exact source/version, full mutation policy, and revocation on replay', async ({
  testApp,
}) => {
  const f = await setup(testApp);
  await expect(
    f.transfer({ ...f.input, actorId: f.creator.userId }),
  ).rejects.toThrow('ACCESS_DENIED');
  await expect(
    f.transfer({ ...f.input, toUserId: f.worker.userId }),
  ).rejects.toThrow('INVALID_TARGET');
  await expect(
    f.transfer({ ...f.input, fromUserId: f.other.userId }),
  ).rejects.toThrow('VERSION_CONFLICT');
  await expect(
    f.transfer({ ...f.input, expectedVersion: 999 }),
  ).rejects.toThrow('VERSION_CONFLICT');
  await expect(f.transfer({ ...f.input, reason: ' ' })).rejects.toThrow(
    'REASON_REQUIRED',
  );
  const restricted: RepositoryPolicy = {
    ...ALL,
    update: { fields: ['version', 'status', 'statusChangedAt'], scope: true },
  };
  await expect(
    f.transfer(f.input, { view: ALL, handover: restricted }),
  ).rejects.toThrow('ACCESS_DENIED');
  await expect(
    f.transfer(f.input, { view: { ...ALL, read: false }, handover: ALL }),
  ).rejects.toThrow('ACCESS_DENIED');
  await f.org.addDutyRoleMember('admin', f.other.userId, {
    actorId: f.creator.userId,
  });
  const moved = await f.transfer({ ...f.input, actorId: f.other.userId });
  await expect(
    f.transfer({
      ...f.input,
      actorId: f.other.userId,
      reason: 'Other payload',
    }),
  ).rejects.toThrow('COMMAND_CONFLICT');
  await expect(
    f.transfer(
      { ...f.input, actorId: f.other.userId },
      { view: ALL, handover: restricted },
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  await f.org.removeDutyRoleMember('admin', f.other.userId, {
    actorId: f.creator.userId,
  });
  await expect(
    f.transfer({ ...f.input, actorId: f.other.userId }),
  ).rejects.toThrow('ACCESS_DENIED');
  const next = await f.transfer({
    ...f.input,
    requestId: randomUUID(),
    fromUserId: f.successor.userId,
    toUserId: f.other.userId,
    expectedVersion: moved.version,
  });
  expect(next.confirmationOwnerUserId).toBe(f.other.userId);
  await expect(
    f.transfer({ ...f.input, actorId: f.other.userId }),
  ).rejects.toThrow('ACCESS_DENIED');
  await expect(f.transfer()).rejects.toThrow('COMMAND_CONFLICT');
  await f.org.addDutyRoleMember('admin', f.other.userId, {
    actorId: f.creator.userId,
  });
  await expect(
    f.transfer({ ...f.input, actorId: f.other.userId }),
  ).rejects.toThrow('VERSION_CONFLICT');
});
test('handover journal, owner and notice rollback with audit/outer transaction and preserve blocked handling reason', async ({
  testApp,
}) => {
  const f = await setup(testApp),
    blocked = await f.db.transaction((tx) =>
      f.service.act(
        {
          id: f.assigned.id,
          actorId: f.worker.userId,
          requestId: randomUUID(),
          expectedVersion: f.assigned.version,
          action: 'block',
          reason: 'Actual external blocker',
        },
        tx,
        ALL,
      ),
    );
  f.input.expectedVersion = blocked.version;
  const broken = createWorkItemService({
    ...f.deps,
    audit: {
      ...f.deps.audit,
      record: async () => {
        throw new Error('Audit fails');
      },
    },
  });
  await expect(
    f.db.transaction((tx) =>
      broken.handoverConfirmation(f.input, tx, { view: ALL, handover: ALL }),
    ),
  ).rejects.toThrow('Audit fails');
  const initial = await f.db
    .repository('workItems')
    .findOne({ filter: { id: blocked.id } });
  await expect(
    f.db.transaction(async (tx) => {
      await f.service.handoverConfirmation(f.input, tx, {
        view: ALL,
        handover: ALL,
      });
      throw new Error('Outer rollback');
    }),
  ).rejects.toThrow('Outer rollback');
  expect(
    await f.db.repository('workItems').findOne({ filter: { id: blocked.id } }),
  ).toEqual(initial);
  const moved = await f.transfer();
  expect(moved).toMatchObject({
    status: 'blocked',
    reason: 'Actual external blocker',
    assigneeUserId: f.worker.userId,
    confirmationOwnerUserId: f.successor.userId,
  });
  expect(
    await f.db.repository('oaLifecycleTransitions').count({
      filter: { recordId: moved.id, transition: 'handoverConfirmation' },
    }),
  ).toBe(1);
});
test('shared account locks reject handover after recipient disable and account scans see committed obligations', async ({
  testApp,
}) => {
  const f = await setup(testApp);
  let acquired!: () => void, release!: () => void;
  const locked = new Promise<void>((r) => {
      acquired = r;
    }),
    resume = new Promise<void>((r) => {
      release = r;
    });
  const disabling = f.db.transaction(async (tx) => {
    await lockUserForAdministration(tx, f.successor.userId);
    acquired();
    await resume;
    await f.deps.users.withConnection(tx).disable(f.successor.userId);
  });
  await locked;
  const outcome = f.transfer().then(
    () => 'unexpected',
    (e: Error) => e.message,
  );
  release();
  await disabling;
  expect(await outcome).toBe('INVALID_TARGET');
  expect(
    (await f.service.departureBlockers(f.creator.userId, f.db.connection()))
      .remaining,
  ).toBe(1);
  const moved = await f.transfer({ ...f.input, toUserId: f.other.userId });
  await f.db.transaction(async (tx) => {
    await lockUserForAdministration(tx, f.other.userId);
    expect(
      (await f.service.departureBlockers(f.other.userId, tx)).remaining,
    ).toBe(1);
  });
  expect(moved.creatorUserId).toBe(f.creator.userId);
});

test('browser confirmation capability intersects actual HR, current field policies and state without mutating', async ({
  testApp,
}) => {
  const f = await setup(testApp),
    tx = f.db.connection(),
    policies = { view: ALL, handover: ALL };
  expect(
    await f.service.canHandoverConfirmation(
      f.assigned.id,
      f.hr.userId,
      tx,
      policies,
    ),
  ).toBe(true);
  expect(
    await f.service.canHandoverConfirmation(
      f.assigned.id,
      f.creator.userId,
      tx,
      policies,
    ),
  ).toBe(false);
  expect(
    await f.service.canHandoverConfirmation(f.assigned.id, f.hr.userId, tx, {
      view: ALL,
      handover: { ...ALL, update: false },
    }),
  ).toBe(false);
  const current = await f.service.get(f.assigned.id, f.hr.userId, tx, ALL);
  expect(current).toMatchObject({
    version: f.assigned.version,
    confirmationOwnerUserId: f.creator.userId,
  });
});

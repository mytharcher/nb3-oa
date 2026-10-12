// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { test } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  headcountServiceToken,
  createHeadcountService,
} from '../../../server/providers/headcounts/index.js';
import type { HeadcountBalance } from '../../../server/providers/headcounts/contract.js';
async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(headcountServiceToken),
    calendar = c.resolve(calendarServiceToken);
  const actor = await createEmployee(testApp, 'Quota HR'),
    ctx = { actorId: actor.userId };
  const department = await org.createDepartment(
      { title: 'Capacity ' + randomUUID() },
      ctx,
    ),
    position = await org.createPosition(
      { code: randomUUID(), title: 'Real position' },
      ctx,
    ),
    year = Number(calendar.localDate(new Date()).slice(0, 4));
  const command = (requestKey = randomUUID()) => ({
    actorId: actor.userId,
    reason: 'Capacity source proof',
    requestKey,
  });
  const create = async (limit: number, annual = year) =>
    db.transaction((tx) =>
      service.create(
        {
          ...command(),
          departmentId: department.id,
          positionId: position.id,
          year: annual,
          limit,
        },
        tx,
      ),
    );
  const initialize = async (a: HeadcountBalance, ids: string[] = []) =>
    db.transaction((tx) =>
      service.reconcile(
        {
          ...command(),
          accountId: a.id,
          expectedVersion: a.version,
          employeeIds: ids,
        },
        tx,
      ),
    );
  const hire = async (
    name: string,
    status: 'probation' | 'regular' = 'regular',
  ) => {
    const person = await createEmployee(testApp, name, {
      positionId: position.id,
      status,
    });
    await org.addMember(
      { departmentId: department.id, userId: person.userId, primary: true },
      ctx,
    );
    return person;
  };
  return {
    c,
    db,
    org,
    service,
    calendar,
    actor,
    department,
    position,
    year,
    command,
    create,
    initialize,
    hire,
  };
}
test('initialization matches full real roster including probation, CAS and durable commands', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    probation = await f.hire('Unenabled probation', 'probation'),
    regular = await f.hire('Actual regular'),
    a = await f.create(3);
  await f.c.resolve(userAdministrationServiceToken).disable(probation.userId);
  await expect(
    f.db.transaction((tx) =>
      f.service.hold(
        {
          ...f.command(),
          sourceKind: 'recruitment',
          sourceId: 'not-ready',
          accountId: a.id,
          quantity: 1,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_NOT_INITIALIZED' });
  await expect(f.initialize(a, [regular.employeeId])).rejects.toMatchObject({
    code: 'HEADCOUNT_INCOMPLETE_ROSTER',
  });
  expect((await f.service.balance(a.id, f.db.connection()))!.initialized).toBe(
    false,
  );
  const initialized = await f.initialize(a, [
    regular.employeeId,
    probation.employeeId,
  ]);
  expect(initialized).toMatchObject({ used: 2, available: 1 });
  const request = {
    ...f.command(),
    accountId: a.id,
    expectedVersion: initialized.version,
    employeeIds: [regular.employeeId, probation.employeeId],
  };
  const first = await f.db.transaction((tx) =>
      f.service.reconcile(request, tx),
    ),
    retry = await f.db.transaction((tx) => f.service.reconcile(request, tx));
  expect(retry).toEqual(first);
  expect(first.used).toBe(2);
  await expect(
    f.db.transaction((tx) =>
      f.service.reconcile({ ...request, reason: 'Different payload' }, tx),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_IDEMPOTENCY_CONFLICT' });
  await expect(
    f.db.transaction((tx) =>
      f.service.adjustLimit(
        {
          ...f.command(),
          accountId: a.id,
          expectedVersion: initialized.version,
          limit: 3,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_VERSION_CONFLICT' });
  await expect(
    f.db.transaction((tx) =>
      f.service.adjustLimit(
        {
          ...f.command(),
          accountId: a.id,
          expectedVersion: first.version,
          limit: 1,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  expect(
    await f.db
      .repository('headcountOccupancies')
      .count({ filter: { accountId: a.id, state: 'used' } }),
  ).toBe(2);
  const future = await f.create(3, f.year + 1);
  await f.org.setDepartmentActive(f.department.id, false, {
    actorId: f.actor.userId,
  });
  await expect(f.initialize(future, [])).rejects.toMatchObject({
    code: 'HEADCOUNT_INVALID_IDENTITY',
  });
  expect(await f.service.balance(future.id, f.db.connection())).toMatchObject({
    initialized: false,
  });
});
test('concurrent capacity holds, approved seats, real consumption, closure and audit rollback', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    a = await f.initialize(await f.create(1)),
    base = { sourceKind: 'recruitment', accountId: a.id, quantity: 1 };
  const contenders = ['A', 'B'].map((sourceId) => ({
    ...f.command(),
    ...base,
    sourceId,
  }));
  const results = await Promise.allSettled(
    contenders.map((input) =>
      f.db.transaction((tx) => f.service.hold(input, tx)),
    ),
  );
  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  const winner = results.findIndex((r) => r.status === 'fulfilled'),
    source = {
      sourceKind: 'recruitment',
      sourceId: contenders[winner].sourceId,
    };
  expect(
    await f.service.reservation(
      { sourceKind: 'recruitment', sourceId: 'missing' },
      f.db.connection(),
    ),
  ).toBeNull();
  expect(await f.service.reservation(source, f.db.connection())).toMatchObject({
    accountId: a.id,
    state: 'pending',
    quantity: 1,
    remaining: 1,
    consumed: 0,
    blocked: 0,
  });
  await f.db.transaction((tx) =>
    f.service.allocate({ ...f.command(), ...source }, tx),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 0,
    allocated: 1,
    available: 0,
  });
  expect(await f.service.reservation(source, f.db.connection())).toMatchObject({
    state: 'allocated',
    remaining: 1,
  });
  const person = await f.hire('Onboard actual person', 'probation'),
    audit = f.c.resolve(auditServiceToken);
  const fault = createHeadcountService({
    audit: {
      ...audit,
      record: async () => {
        throw new Error('audit failure');
      },
    },
    employees: f.c.resolve(employeeServiceToken),
    org: f.c.resolve(orgServiceToken),
    calendar: f.calendar,
  });
  const consume = { ...f.command(), ...source, employeeId: person.employeeId };
  await expect(
    f.db.transaction((tx) => fault.consume(consume, tx)),
  ).rejects.toThrow('audit failure');
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 0,
    allocated: 1,
  });
  expect(
    await f.db
      .repository('headcountOccupancies')
      .count({ filter: { employeeId: person.employeeId } }),
  ).toBe(0);
  const done = await f.db.transaction((tx) => f.service.consume(consume, tx));
  expect(done).toMatchObject({ state: 'filled', remaining: 0, consumed: 1 });
  expect(
    await f.db.transaction((tx) => f.service.consume(consume, tx)),
  ).toEqual(done);
  await f.db.transaction((tx) =>
    f.service.close({ ...f.command(), ...source }, tx),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
    available: 0,
  });
});
test('future replacement atomically receives departing occupancy without exposing ordinary available', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    old = await f.hire('Real leaving employee'),
    a = await f.initialize(await f.create(1), [old.employeeId]),
    employees = f.c.resolve(employeeServiceToken);
  await f.db.transaction((tx) =>
    employees.applyStatusChange(
      {
        employeeId: old.employeeId,
        status: 'leaving',
        kind: 'departure',
        effectiveAt: f.calendar.localDate(new Date()),
      },
      { actorId: f.actor.userId },
      tx,
    ),
  );
  const source = { sourceKind: 'recruitment', sourceId: 'replacement' },
    hold = {
      ...f.command(),
      ...source,
      accountId: a.id,
      quantity: 1,
      replacementEmployeeIds: [old.employeeId],
    };
  await f.db.transaction((tx) => f.service.hold(hold, tx));
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    pending: 0,
    replacementPending: 1,
    available: 0,
  });
  await expect(
    f.db.transaction((tx) =>
      f.service.hold({ ...hold, ...f.command(), sourceId: 'duplicate' }, tx),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_REPLACEMENT_UNAVAILABLE' });
  await f.db.transaction((tx) =>
    f.service.allocate({ ...f.command(), ...source }, tx),
  );
  await expect(
    f.db.transaction((tx) =>
      f.service.consume(
        { ...f.command(), ...source, employeeId: old.employeeId },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_NO_ALLOCATION' });
  const release = { ...f.command(), employeeId: old.employeeId };
  await f.db.transaction((tx) =>
    f.service.within(tx, async (guarded) => {
      await employees.applyStatusChange(
        {
          employeeId: old.employeeId,
          status: 'left',
          active: false,
          kind: 'departure',
          effectiveAt: f.calendar.localDate(new Date()),
        },
        { actorId: f.actor.userId },
        guarded,
      );
      await f.service.releaseEmployee(release, guarded);
      expect(await f.service.balance(a.id, guarded)).toMatchObject({
        used: 0,
        allocated: 1,
        replacementAllocated: 0,
        available: 0,
      });
    }),
  );
  const newPerson = await f.hire('Replacement onboarding', 'probation');
  await expect(
    f.db.transaction((tx) =>
      f.service.hold(
        {
          ...f.command(),
          sourceKind: 'recruitment',
          sourceId: 'new-race',
          accountId: a.id,
          quantity: 1,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  await f.db.transaction((tx) =>
    f.service.consume(
      { ...f.command(), ...source, employeeId: newPerson.employeeId },
      tx,
    ),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    available: 0,
  });
  await f.db.transaction((tx) => f.service.releaseEmployee(release, tx));
  await expect(
    f.db.transaction((tx) =>
      f.service.hold(
        { ...hold, ...f.command(), sourceId: 'source-reused' },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_REPLACEMENT_UNAVAILABLE' });
});
test('restoration blocks future replacements, cancellation preserves used and left vacancy checks capacity', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    person = await f.hire('Restored employee'),
    a = await f.initialize(await f.create(1), [person.employeeId]),
    employees = f.c.resolve(employeeServiceToken),
    source = { sourceKind: 'recruitment', sourceId: 'restored-source' };
  await f.db.transaction((tx) =>
    employees.applyStatusChange(
      {
        employeeId: person.employeeId,
        status: 'leaving',
        kind: 'departure',
        effectiveAt: f.calendar.localDate(new Date()),
      },
      { actorId: f.actor.userId },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.service.hold(
      {
        ...f.command(),
        ...source,
        accountId: a.id,
        quantity: 1,
        replacementEmployeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.service.within(tx, async (guarded) => {
      await employees.applyStatusChange(
        {
          employeeId: person.employeeId,
          status: 'regular',
          kind: 'correction',
          effectiveAt: f.calendar.localDate(new Date()),
        },
        { actorId: f.actor.userId },
        guarded,
      );
      expect(
        await f.service.invalidateReplacements(
          { ...f.command(), employeeId: person.employeeId },
          guarded,
        ),
      ).toEqual([source]);
    }),
  );
  await expect(
    f.db.transaction((tx) =>
      f.service.allocate({ ...f.command(), ...source }, tx),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_REPLACEMENT_BLOCKED' });
  expect(await f.service.reservation(source, f.db.connection())).toMatchObject({
    blocked: 1,
    remaining: 1,
    consumed: 0,
  });
  await f.db.transaction((tx) =>
    f.service.close({ ...f.command(), ...source }, tx),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    available: 0,
    replacementBlocked: 0,
  });
  await f.db.transaction((tx) =>
    f.service.within(tx, async (guarded) => {
      await employees.applyStatusChange(
        {
          employeeId: person.employeeId,
          status: 'left',
          kind: 'departure',
          effectiveAt: f.calendar.localDate(new Date()),
        },
        { actorId: f.actor.userId },
        guarded,
      );
      await f.service.releaseEmployee(
        { ...f.command(), employeeId: person.employeeId },
        guarded,
      );
    }),
  );
  await f.db.transaction((tx) =>
    f.service.hold(
      {
        ...f.command(),
        sourceKind: 'recruitment',
        sourceId: 'new-first',
        accountId: a.id,
        quantity: 1,
      },
      tx,
    ),
  );
  await expect(
    f.db.transaction((tx) =>
      f.service.hold(
        {
          ...f.command(),
          sourceKind: 'recruitment',
          sourceId: 'old-vacancy',
          accountId: a.id,
          quantity: 1,
          replacementEmployeeIds: [person.employeeId],
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
});
test('old-year allocation requires explicit target-year initialization and rebind, with all-or-nothing capacity', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    old = await f.initialize(await f.create(2, f.year - 1)),
    target = await f.create(1, f.year),
    source = { sourceKind: 'recruitment', sourceId: 'prior-year' };
  await f.db.transaction((tx) =>
    f.service.hold(
      { ...f.command(), ...source, accountId: old.id, quantity: 2 },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.service.allocate({ ...f.command(), ...source }, tx),
  );
  const person = await f.hire('New year actual employee', 'probation');
  await expect(
    f.db.transaction((tx) =>
      f.service.consume(
        { ...f.command(), ...source, employeeId: person.employeeId },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_YEAR_REBIND_REQUIRED' });
  await expect(
    f.db.transaction((tx) =>
      f.service.rebind(
        { ...f.command(), ...source, targetAccountId: target.id },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_NOT_INITIALIZED' });
  // Reconcile the real current roster, never treating an existing probation archive as zero used.
  const initialized = await f.initialize(target, [person.employeeId]);
  await expect(
    f.db.transaction((tx) =>
      f.service.rebind(
        { ...f.command(), ...source, targetAccountId: target.id },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  expect(await f.service.balance(old.id, f.db.connection())).toMatchObject({
    allocated: 2,
  });
  const enlarged = await f.db.transaction((tx) =>
    f.service.adjustLimit(
      {
        ...f.command(),
        accountId: target.id,
        expectedVersion: initialized.version,
        limit: 3,
      },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.service.rebind(
      { ...f.command(), ...source, targetAccountId: enlarged.id },
      tx,
    ),
  );
  expect(await f.service.balance(old.id, f.db.connection())).toMatchObject({
    allocated: 0,
  });
  expect(await f.service.balance(target.id, f.db.connection())).toMatchObject({
    used: 1,
    allocated: 2,
    available: 0,
  });
  const another = await f.hire('Explicit new-year intake', 'probation');
  await f.db.transaction((tx) =>
    f.service.consume(
      { ...f.command(), ...source, employeeId: another.employeeId },
      tx,
    ),
  );
  expect(await f.service.balance(target.id, f.db.connection())).toMatchObject({
    used: 2,
    allocated: 1,
  });
  expect(
    await f.db
      .repository('headcountJournal')
      .count({ filter: { action: 'rebindOut' } }),
  ).toBe(1);
});
test('opposite department transfers share sorted locks and roll back actual primary membership with audit', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    aPerson = await f.hire('First transfer employee'),
    other = await f.org.createDepartment(
      { title: 'Other ' + randomUUID() },
      { actorId: f.actor.userId },
    ),
    bPerson = await createEmployee(testApp, 'Second transfer employee', {
      positionId: f.position.id,
    });
  await f.org.addMember(
    { departmentId: other.id, userId: bPerson.userId, primary: true },
    { actorId: f.actor.userId },
  );
  const a = await f.initialize(await f.create(2), [aPerson.employeeId]);
  let b = await f.db.transaction((tx) =>
    f.service.create(
      {
        ...f.command(),
        departmentId: other.id,
        positionId: f.position.id,
        year: f.year,
        limit: 2,
      },
      tx,
    ),
  );
  b = await f.db.transaction((tx) =>
    f.service.reconcile(
      {
        ...f.command(),
        accountId: b.id,
        expectedVersion: b.version,
        employeeIds: [bPerson.employeeId],
      },
      tx,
    ),
  );
  const toB = { sourceKind: 'transfer', sourceId: 'to-B' },
    toA = { sourceKind: 'transfer', sourceId: 'to-A' };
  for (const [source, accountId] of [
    [toB, b.id],
    [toA, a.id],
  ] as const) {
    await f.db.transaction((tx) =>
      f.service.hold({ ...f.command(), ...source, accountId, quantity: 1 }, tx),
    );
    await f.db.transaction((tx) =>
      f.service.allocate({ ...f.command(), ...source }, tx),
    );
  }
  const audit = f.c.resolve(auditServiceToken),
    fault = createHeadcountService({
      audit: {
        ...audit,
        record: async () => {
          throw new Error('transfer audit failure');
        },
      },
      employees: f.c.resolve(employeeServiceToken),
      org: f.c.resolve(orgServiceToken),
      calendar: f.calendar,
    });
  const transfer = {
    ...f.command(),
    ...toB,
    employeeId: aPerson.employeeId,
    sourceAccountId: a.id,
  };
  await expect(
    f.db.transaction((tx) =>
      fault.within(tx, async (c) => {
        await f.org.addMember(
          { departmentId: other.id, userId: aPerson.userId, primary: true },
          { actorId: f.actor.userId, connection: c },
        );
        await fault.transfer(transfer, c);
      }),
    ),
  ).rejects.toThrow('transfer audit failure');
  expect((await f.org.primaryDepartmentOf(aPerson.userId))?.id).toBe(
    f.department.id,
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    allocated: 1,
  });
  await Promise.all([
    f.db.transaction((tx) =>
      f.service.within(tx, async (c) => {
        await f.org.addMember(
          { departmentId: other.id, userId: aPerson.userId, primary: true },
          { actorId: f.actor.userId, connection: c },
        );
        await f.service.transfer(transfer, c);
      }),
    ),
    f.db.transaction((tx) =>
      f.service.within(tx, async (c) => {
        await f.org.addMember(
          {
            departmentId: f.department.id,
            userId: bPerson.userId,
            primary: true,
          },
          { actorId: f.actor.userId, connection: c },
        );
        await f.service.transfer(
          {
            ...f.command(),
            ...toA,
            employeeId: bPerson.employeeId,
            sourceAccountId: b.id,
          },
          c,
        );
      }),
    ),
  ]);
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
    available: 1,
  });
  expect(await f.service.balance(b.id, f.db.connection())).toMatchObject({
    used: 1,
    allocated: 0,
    available: 1,
  });
  expect((await f.org.primaryDepartmentOf(aPerson.userId))?.id).toBe(other.id);
  expect((await f.org.primaryDepartmentOf(bPerson.userId))?.id).toBe(
    f.department.id,
  );
  const returnSource = {
    sourceKind: 'transfer',
    sourceId: 'return-A-in-same-year',
  };
  await f.db.transaction((tx) =>
    f.service.hold(
      { ...f.command(), ...returnSource, accountId: a.id, quantity: 1 },
      tx,
    ),
  );
  await f.db.transaction((tx) =>
    f.service.allocate({ ...f.command(), ...returnSource }, tx),
  );
  await f.db.transaction((tx) =>
    f.service.within(tx, async (c) => {
      await f.org.addMember(
        {
          departmentId: f.department.id,
          userId: aPerson.userId,
          primary: true,
        },
        { actorId: f.actor.userId, connection: c },
      );
      await f.service.transfer(
        {
          ...f.command(),
          ...returnSource,
          employeeId: aPerson.employeeId,
          sourceAccountId: b.id,
        },
        c,
      );
    }),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 2,
    allocated: 0,
    available: 0,
  });
  expect(
    await f.db
      .repository('headcountOccupancies')
      .count({ filter: { accountId: a.id, employeeId: aPerson.employeeId } }),
  ).toBe(2);
});
test('departure races with approval and cancellation without exposing a future replacement slot', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    person = await f.hire('Race leaving employee'),
    a = await f.initialize(await f.create(1), [person.employeeId]),
    employees = f.c.resolve(employeeServiceToken);
  await f.db.transaction((tx) =>
    employees.applyStatusChange(
      {
        employeeId: person.employeeId,
        status: 'leaving',
        kind: 'departure',
        effectiveAt: f.calendar.localDate(new Date()),
      },
      { actorId: f.actor.userId },
      tx,
    ),
  );
  const source = { sourceKind: 'recruitment', sourceId: 'race-approval' };
  await f.db.transaction((tx) =>
    f.service.hold(
      {
        ...f.command(),
        ...source,
        accountId: a.id,
        quantity: 1,
        replacementEmployeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  const releasing = { ...f.command(), employeeId: person.employeeId };
  await Promise.all([
    f.db.transaction((tx) =>
      f.service.allocate({ ...f.command(), ...source }, tx),
    ),
    f.db.transaction((tx) =>
      f.service.within(tx, async (c) => {
        await employees.applyStatusChange(
          {
            employeeId: person.employeeId,
            status: 'left',
            kind: 'departure',
            effectiveAt: f.calendar.localDate(new Date()),
          },
          { actorId: f.actor.userId },
          c,
        );
        await f.service.releaseEmployee(releasing, c);
      }),
    ),
  ]);
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 0,
    pending: 0,
    allocated: 1,
    available: 0,
  });
  await f.db.transaction((tx) =>
    f.service.close({ ...f.command(), ...source }, tx),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 0,
    allocated: 0,
    available: 1,
  });
  const later = { sourceKind: 'recruitment', sourceId: 'left-vacancy-again' };
  await f.db.transaction((tx) =>
    f.service.hold(
      {
        ...f.command(),
        ...later,
        accountId: a.id,
        quantity: 1,
        replacementEmployeeIds: [person.employeeId],
      },
      tx,
    ),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 1,
    available: 0,
  });
  await f.db.transaction((tx) =>
    f.service.close({ ...f.command(), ...later }, tx),
  );
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 0,
    available: 1,
  });
});
test('reconciliation final roster verification detects same-transaction primary-membership drift and rolls back facts', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    outside = await createEmployee(testApp, 'Roster drift employee', {
      positionId: f.position.id,
    }),
    a = await f.create(2),
    audit = f.c.resolve(auditServiceToken);
  const drift = createHeadcountService({
    audit: {
      ...audit,
      record: async (entry, tx) => {
        await audit.record(entry, tx);
        if (entry.action === 'headcount.reconcile')
          await f.org.addMember(
            {
              departmentId: f.department.id,
              userId: outside.userId,
              primary: true,
            },
            { actorId: f.actor.userId, connection: tx },
          );
      },
    },
    employees: f.c.resolve(employeeServiceToken),
    org: f.c.resolve(orgServiceToken),
    calendar: f.calendar,
  });
  await expect(
    f.db.transaction((tx) =>
      drift.reconcile(
        {
          ...f.command(),
          accountId: a.id,
          expectedVersion: a.version,
          employeeIds: [],
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_ROSTER_DRIFT' });
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    initialized: false,
    version: a.version,
    used: 0,
  });
  expect(await f.org.primaryDepartmentOf(outside.userId)).toBeUndefined();
  expect(
    await f.db
      .repository('headcountJournal')
      .count({ filter: { action: 'reconcile', accountId: a.id } }),
  ).toBe(0);
});
test('whole-batch shortage and approval audit failure leave the exact original pending seats', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    a = await f.initialize(await f.create(2)),
    source = { sourceKind: 'recruitment', sourceId: 'whole-batch' };
  await expect(
    f.db.transaction((tx) =>
      f.service.hold(
        { ...f.command(), ...source, accountId: a.id, quantity: 3 },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  expect(
    await f.db
      .repository('headcountSeats')
      .count({ filter: { accountId: a.id } }),
  ).toBe(0);
  await f.db.transaction((tx) =>
    f.service.hold(
      { ...f.command(), ...source, accountId: a.id, quantity: 2 },
      tx,
    ),
  );
  const audit = f.c.resolve(auditServiceToken),
    fault = createHeadcountService({
      audit: {
        ...audit,
        record: async () => {
          throw new Error('approval audit rollback');
        },
      },
      employees: f.c.resolve(employeeServiceToken),
      org: f.c.resolve(orgServiceToken),
      calendar: f.calendar,
    }),
    allocate = { ...f.command(), ...source };
  await expect(
    f.db.transaction((tx) => fault.allocate(allocate, tx)),
  ).rejects.toThrow('approval audit rollback');
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 2,
    allocated: 0,
    available: 0,
  });
  await f.db.transaction((tx) => f.service.allocate(allocate, tx));
  const current = (await f.service.balance(a.id, f.db.connection()))!;
  await expect(
    f.db.transaction((tx) =>
      f.service.adjustLimit(
        {
          ...f.command(),
          accountId: a.id,
          expectedVersion: current.version,
          limit: 1,
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  const person = await f.hire('One approved intake', 'probation');
  await f.db.transaction((tx) =>
    f.service.consume(
      { ...f.command(), ...source, employeeId: person.employeeId },
      tx,
    ),
  );
  const close = { ...f.command(), ...source };
  await f.db.transaction((tx) => f.service.close(close, tx));
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    used: 1,
    pending: 0,
    allocated: 0,
    available: 1,
  });
  expect(
    await f.db
      .repository('headcountSeats')
      .count({ filter: { accountId: a.id, state: 'consumed' } }),
  ).toBe(1);
  expect(
    await f.db
      .repository('headcountSeats')
      .count({ filter: { accountId: a.id, state: 'released' } }),
  ).toBe(1);
});
test('pending revision replaces the full reservation transactionally and cannot rewrite approval or consumed history', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    a = await f.initialize(await f.create(3)),
    source = { sourceKind: 'recruitment', sourceId: 'returned-revision' };
  await f.db.transaction((tx) =>
    f.service.hold(
      { ...f.command(), ...source, accountId: a.id, quantity: 2 },
      tx,
    ),
  );
  await expect(
    f.db.transaction((tx) =>
      f.service.reviseHold(
        { ...f.command(), ...source, accountId: a.id, quantity: 4 },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_INSUFFICIENT' });
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 2,
    available: 1,
  });
  const revision = { ...f.command(), ...source, accountId: a.id, quantity: 1 };
  const changed = await f.db.transaction((tx) =>
    f.service.reviseHold(revision, tx),
  );
  expect(changed).toMatchObject({ quantity: 1, remaining: 1 });
  const journal = await f.service.journal(
    a.id,
    f.db.connection(),
    { read: true, create: false, update: false, delete: false },
    { page: 1, pageSize: 100 },
  );
  expect(
    journal.items.find((row) => row.action === 'reviseHold')?.evidence,
  ).toMatchObject({ source: { kind: source.sourceKind, id: source.sourceId } });
  expect(
    await f.db.transaction((tx) => f.service.reviseHold(revision, tx)),
  ).toEqual(changed);
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    pending: 1,
    available: 2,
  });
  expect(
    await f.db
      .repository('headcountSeats')
      .count({ filter: { accountId: a.id, state: 'released' } }),
  ).toBe(2);
  await f.db.transaction((tx) =>
    f.service.allocate({ ...f.command(), ...source }, tx),
  );
  await expect(
    f.db.transaction((tx) =>
      f.service.reviseHold(
        { ...f.command(), ...source, accountId: a.id, quantity: 2 },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'HEADCOUNT_SOURCE_STATE' });
  expect(await f.service.balance(a.id, f.db.connection())).toMatchObject({
    allocated: 1,
    available: 2,
  });
});

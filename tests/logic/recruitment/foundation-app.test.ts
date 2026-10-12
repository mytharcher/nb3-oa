// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { databaseManagerToken } from '@nocobase/db';
import { test } from '../headcounts/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  calendarServiceToken,
  ruleServiceToken,
} from '../../../server/providers/platform/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
import {
  createRecruitmentSubmissionCoordinator,
  type RecruitmentProposal,
  type RecruitmentSubmissionSnapshot,
} from '../../../server/providers/recruitment/submission.js';
import { createRequisitionService } from '../../../server/providers/recruitment/requisitions.js';
import type { TestApp } from '@nocobase/app-testing/server';
async function fixture(testApp: TestApp, limit = 2) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    audit = c.resolve(auditServiceToken);
  if (!(await db.connection().collections.get('recruitmentCommands')))
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'recruitment-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/recruitment/migrations',
            ),
          },
        ],
        tableName: 'recruitmentCandidateMigrationHistory',
      })
      .latest();
  const actor = await createEmployee(testApp, 'Recruitment head');
  const ctx = { actorId: actor.userId };
  const department = await org.createDepartment(
    { title: 'Hiring ' + randomUUID(), managerId: actor.userId },
    ctx,
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Engineer' },
    ctx,
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Associate', rank: 1 },
    ctx,
  );
  const year = Number(
    c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
  );
  const command = (requestKey = randomUUID()) => ({
    actorId: actor.userId,
    requestKey,
    reason: 'Recruitment proof',
  });
  const account = await db.transaction(async (tx) => {
    const created = await headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year,
        limit,
      },
      tx,
    );
    return headcounts.reconcile(
      {
        ...command(),
        accountId: created.id,
        expectedVersion: created.version,
        employeeIds: [],
      },
      tx,
    );
  });
  const current = await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).current(tx),
  );
  await db.transaction((tx) =>
    c.resolve(salaryGradeServiceToken).publish(
      {
        ...command(),
        expectedVersion: current.version,
        bands: [
          ...(current.revision?.bands ?? []),
          { gradeId: grade.id, minimumCents: 10000, maximumCents: 20000 },
        ],
      },
      tx,
    ),
  );
  const coordinator = createRecruitmentSubmissionCoordinator({
    org: c.resolve(orgServiceToken),
    employees: c.resolve(employeeServiceToken),
    headcounts,
    grades: c.resolve(salaryGradeServiceToken),
    rules: c.resolve(ruleServiceToken),
  });
  const proposal: RecruitmentProposal = {
    id: randomUUID(),
    departmentId: department.id,
    positionId: position.id,
    gradeId: grade.id,
    accountId: account.id,
    year,
    quantity: 2,
    kind: 'additional',
    replacementEmployeeIds: [],
    minimumCents: 12000,
    maximumCents: 18000,
  };
  const submitCommand = {
    ...command(),
    resubmission: false,
    now: new Date(),
    authorizeTarget: async (id: string) => id === department.id,
  };
  const requisitions = createRequisitionService({ headcounts, audit });
  const submit = (p = proposal, command = submitCommand) =>
    coordinator.submit(
      p,
      command,
      db.connection(),
      async (snapshot, salary, reservation) => ({
        snapshot,
        salary,
        reservation,
      }),
    );
  return {
    c,
    db,
    org,
    headcounts,
    audit,
    department,
    position,
    grade,
    actor,
    account,
    command,
    proposal,
    submitCommand,
    coordinator,
    submit,
    requisitions,
  };
}
test('real public submit guard: salary snapshots, head skipping, atomic revise and caller failure', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const initial = await f.submit();
  expect(initial.snapshot).toMatchObject({
    headRequired: false,
    executiveRequired: true,
    gmRequired: true,
    rank: 1,
  });
  expect(JSON.stringify(initial.snapshot)).not.toMatch(
    /minimumCents|maximumCents/,
  );
  expect(initial.salary).toMatchObject({
    minimumCents: 12000,
    maximumCents: 18000,
    band: { tableVersion: 1 },
  });
  expect(initial.reservation).toMatchObject({ state: 'pending', quantity: 2 });
  // Returned approval stays pending. The owning lifecycle must call reviseHold only on actual resubmit.
  const retry = { ...f.submitCommand, ...f.command(), resubmission: true };
  await expect(
    f.submit({ ...f.proposal, quantity: 3 }, retry),
  ).rejects.toThrow();
  expect(
    await f.db.transaction((tx) =>
      f.headcounts.reservation(
        { sourceKind: 'oa.recruitment', sourceId: f.proposal.id },
        tx,
      ),
    ),
  ).toMatchObject({ quantity: 2, remaining: 2 });
  const revision = await f.submit({ ...f.proposal, quantity: 1 }, retry);
  expect(revision.reservation.quantity).toBe(1);
  await expect(
    f.coordinator.submit(
      { ...f.proposal, quantity: 2 },
      { ...retry, ...f.command() },
      f.db.connection(),
      async () => {
        throw new Error('SDK callback failure');
      },
    ),
  ).rejects.toThrow('SDK callback failure');
  expect(
    await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)),
  ).toMatchObject({ pending: 1, available: 1 });
  await expect(
    f.submit(
      { ...f.proposal, maximumCents: 20001 },
      { ...retry, ...f.command() },
    ),
  ).rejects.toThrow('OUTSIDE_RANGE');
  await expect(
    f.submit(f.proposal, {
      ...retry,
      ...f.command(),
      authorizeTarget: async () => false,
    }),
  ).rejects.toThrow('FORBIDDEN');
});
test('real final allocation/requisition is atomic, unique, replay-safe and salary-free; close releases remaining', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    submitted = await f.submit(),
    finalCommand = f.command('final');
  const spy = vi.spyOn(f.audit, 'record').mockImplementationOnce(async () => {
    throw new Error('Audit failure');
  });
  await expect(
    f.db.transaction((tx) =>
      f.requisitions.publish(
        {
          id: f.proposal.id,
          lifecycleVersion: 7,
          snapshot: submitted.snapshot,
        },
        finalCommand,
        tx,
      ),
    ),
  ).rejects.toThrow('Audit failure');
  spy.mockRestore();
  expect(await f.db.repository('requisitions').count()).toBe(0);
  expect(
    await f.db.transaction((tx) =>
      f.headcounts.reservation(
        { sourceKind: 'oa.recruitment', sourceId: f.proposal.id },
        tx,
      ),
    ),
  ).toMatchObject({ state: 'pending' });
  const req = await f.db.transaction((tx) =>
    f.requisitions.publish(
      { id: f.proposal.id, lifecycleVersion: 7, snapshot: submitted.snapshot },
      finalCommand,
      tx,
    ),
  );
  expect(req).toMatchObject({
    remaining: 2,
    consumed: 0,
    status: 'recruiting',
    sourceYear: f.proposal.year,
  });
  expect(
    await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)),
  ).toMatchObject({ used: 0, pending: 0, allocated: 2 });
  expect(
    (
      await f.db.transaction((tx) =>
        f.requisitions.publish(
          {
            id: f.proposal.id,
            lifecycleVersion: 7,
            snapshot: submitted.snapshot,
          },
          finalCommand,
          tx,
        ),
      )
    ).id,
  ).toBe(req.id);
  await expect(
    f.db.transaction((tx) =>
      f.requisitions.publish(
        {
          id: f.proposal.id,
          lifecycleVersion: 7,
          snapshot: { ...submitted.snapshot, quantity: 1 },
        },
        finalCommand,
        tx,
      ),
    ),
  ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  expect(await f.db.repository('requisitions').count()).toBe(1);
  expect(
    JSON.stringify(await f.db.repository('requisitionCommands').findMany()),
  ).not.toMatch(/minimumCents|maximumCents/);
  const closeCommand = f.command('close');
  expect(
    await f.db.transaction((tx) =>
      f.requisitions.close(req.id, 0, closeCommand, tx, {
        read: true,
        create: false,
        update: true,
        delete: false,
      }),
    ),
  ).toMatchObject({ status: 'closed', remaining: 0, consumed: 0, version: 1 });
  expect(
    await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)),
  ).toMatchObject({ used: 0, allocated: 0, available: 2 });
  expect(
    await f.db.transaction((tx) =>
      f.requisitions.close(req.id, 0, closeCommand, tx, {
        read: true,
        create: false,
        update: true,
        delete: false,
      }),
    ),
  ).toMatchObject({ status: 'closed' });
  await expect(
    f.db.transaction((tx) =>
      f.requisitions.close(req.id, 1, closeCommand, tx, {
        read: true,
        create: false,
        update: true,
        delete: false,
      }),
    ),
  ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
});
test('real one-seat concurrency and approved-seat consume/close preserve real employee occupancy', async ({
  testApp,
}) => {
  const f = await fixture(testApp, 1);
  const p = { ...f.proposal, quantity: 1 };
  const race = await Promise.allSettled(
    [1, 2].map((i) =>
      f.submit(
        { ...p, id: `${p.id}-${i}` },
        { ...f.submitCommand, ...f.command() },
      ),
    ),
  );
  expect(race.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const winner = race.findIndex((r) => r.status === 'fulfilled');
  const frozen = (
    race[winner] as PromiseFulfilledResult<{
      snapshot: RecruitmentSubmissionSnapshot;
    }>
  ).value.snapshot;
  const sourceId = `${p.id}-${winner + 1}`;
  const req = await f.db.transaction((tx) =>
    f.requisitions.publish(
      { id: sourceId, lifecycleVersion: 7, snapshot: frozen },
      f.command(),
      tx,
    ),
  );
  const person = await createEmployee(testApp, 'New colleague', {
    positionId: f.position.id,
    status: 'probation',
  });
  const employee = await f.c
    .resolve(employeeServiceToken)
    .getByUserId(person.userId);
  await f.org.addMember(
    { departmentId: f.department.id, userId: person.userId, primary: true },
    { actorId: f.actor.userId },
  );
  const consumeCommand = f.command('consume');
  const consumed = await f.db.transaction((tx) =>
    f.requisitions.consume(req.id, employee!.id, 0, consumeCommand, tx),
  );
  expect(consumed).toMatchObject({
    status: 'full',
    remaining: 0,
    consumed: 1,
    version: 1,
  });
  expect(
    await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)),
  ).toMatchObject({ used: 1, allocated: 0, available: 0 });
  expect(
    await f.db.transaction((tx) =>
      f.requisitions.consume(req.id, employee!.id, 0, consumeCommand, tx),
    ),
  ).toMatchObject({ consumed: 1 });
  await expect(
    f.db.transaction((tx) =>
      f.requisitions.close(req.id, 1, f.command(), tx, {
        read: true,
        create: false,
        update: true,
        delete: false,
      }),
    ),
  ).rejects.toThrow('VERSION_CONFLICT');
  // Fixture created employee facts separately: this is capacity integration proof, not completed onboarding.
});

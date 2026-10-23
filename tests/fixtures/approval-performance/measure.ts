import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp } from '../../logic/org/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { withApprovalTimings } from '../../../server/providers/approval-runtime/timing.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { recruitmentServiceToken } from '../../../server/providers/recruitment/service.js';
import { transferServiceToken } from '../../../server/providers/transfer/service.js';
import { departureServiceToken } from '../../../server/providers/departure/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { legacyReadable, type LegacyRow } from './legacy-readable.js';

// Explicit PG provisioner from org/helpers creates/drops only its own schema.
// No SQL text, user ids or credentials are written to the report.
const app = await startOrgTestApp();
try {
  const c = app.testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const org = app.organization;
  const people = await Promise.all(
    [
      'manager',
      'head',
      'hr',
      'gm',
      'hrbp',
      'hrDirector',
      'receiver',
      'stranger',
    ].map((name) => createEmployee(app.testApp, `Perf ${name}`)),
  );
  const [manager, head, hr, gm, hrbp, hrDirector, receiver, stranger] = people;
  const context = { actorId: hr.userId };
  for (const [role, person] of [
    ['hr', hr],
    ['gm', gm],
    ['hrbp', hrbp],
    ['hrDirector', hrDirector],
  ] as const)
    await org.addDutyRoleMember(role, person.userId, context);
  const department = await org.createDepartment(
    {
      title: 'Performance fixture',
      managerId: head.userId,
      executiveId: gm.userId,
    },
    context,
  );
  const position = await org.createPosition(
    { code: randomUUID(), title: 'Performance position' },
    context,
  );
  const grade = await org.createGrade(
    { code: randomUUID(), title: 'Performance grade', rank: 1 },
    context,
  );
  const worker = await createEmployee(app.testApp, 'Perf worker', {
    managerId: manager.employeeId,
    positionId: position.id,
    gradeId: grade.id,
  });
  await org.addMember(
    { userId: worker.userId, departmentId: department.id, primary: true },
    context,
  );
  const employees = c.resolve(employeeServiceToken);
  await db.transaction((tx) =>
    employees.appendCompensation(
      {
        employeeId: worker.employeeId,
        gradeId: grade.id,
        baseSalary: '1000.00',
        effectiveFrom: '2026-01-01',
      },
      context,
      tx,
    ),
  );
  const grades = c.resolve(salaryGradeServiceToken);
  const current = await grades.current(db.connection());
  await grades.publish(
    {
      ...context,
      expectedVersion: current.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 200000 }],
      reason: 'Synthetic performance fixture',
    },
    db.connection(),
  );
  const calendar = c.resolve(calendarServiceToken);
  const year = Number(calendar.localDate(new Date()).slice(0, 4));
  const headcounts = c.resolve(headcountServiceToken);
  const account = await db.transaction(async (tx) => {
    const created = await headcounts.create(
      {
        ...context,
        requestKey: randomUUID(),
        reason: 'Synthetic performance fixture',
        departmentId: department.id,
        positionId: position.id,
        year,
        limit: 10,
      },
      tx,
    );
    return headcounts.reconcile(
      {
        ...context,
        requestKey: randomUUID(),
        reason: 'Synthetic performance fixture',
        accountId: created.id,
        expectedVersion: created.version,
        employeeIds: [worker.employeeId],
      },
      tx,
    );
  });
  const command = () => ({
    ...context,
    requestKey: randomUUID(),
    reason: 'Synthetic performance fixture',
  });
  const all = { read: true, create: true, update: true, delete: false };
  const leave = c.resolve(leaveServiceToken);
  const leaveDraft = await leave.create(
    {
      leaveType: 'personal',
      startDate: `${year}-12-07`,
      endDate: `${year}-12-07`,
      startHalf: 'am',
      endHalf: 'pm',
      reason: 'Synthetic performance fixture',
      attachments: [],
      handoverUserId: null,
      enableDelegation: false,
    },
    worker.userId,
  );
  const sample = async (name: string, work: () => Promise<unknown>) =>
    withApprovalTimings(work, (timing) =>
      process.stdout.write(
        JSON.stringify({
          sample: name,
          employees: people.length + 1,
          recordsPerSample: 1,
          ...timing,
        }) + '\n',
      ),
    );
  await sample('leave.submit', () =>
    leave.transition(
      String(leaveDraft.record.id),
      'submit',
      worker.userId,
      Number(leaveDraft.record.lifecycleVersion),
      randomUUID(),
    ),
  );
  const recruitment = c.resolve(recruitmentServiceToken);
  const recruitmentDraft = await recruitment.create(
    {
      departmentId: department.id,
      positionId: position.id,
      gradeId: grade.id,
      accountId: account.id,
      year,
      quantity: 1,
      kind: 'additional',
      replacementEmployeeIds: [],
      minimumCents: 100000,
      maximumCents: 150000,
      expectedStartDate: `${year}-12-01`,
      jobDescription: 'Synthetic performance fixture',
      reason: 'Synthetic performance fixture',
    },
    command(),
    all,
  );
  await sample('recruitment.submit', () =>
    recruitment.transition(
      recruitmentDraft.id,
      'submit',
      recruitmentDraft.lifecycleVersion,
      command(),
      all,
    ),
  );
  const transfer = c.resolve(transferServiceToken);
  const policies = { view: all, write: all, salary: all };
  const transferDraft = await transfer.create(
    {
      employeeId: worker.employeeId,
      kinds: ['salaryChange'],
      targetDepartmentId: department.id,
      targetPositionId: position.id,
      targetGradeId: grade.id,
      targetManagerId: manager.employeeId,
      effectiveDate: `${year}-12-01`,
      targetSalary: '1200.00',
      sourceAccountId: account.id,
      targetAccountId: account.id,
      reason: 'Synthetic performance fixture',
    },
    command(),
    policies,
  );
  await sample('transfer.submit', () =>
    transfer.transition(
      transferDraft.id,
      'submit',
      transferDraft.lifecycleVersion,
      command(),
      policies,
    ),
  );
  const departure = c.resolve(departureServiceToken);
  const departureDraft = await departure.create(
    {
      departureType: 'resignation',
      reason: 'Synthetic performance fixture',
      expectedLastWorkingDay: `${year}-12-31`,
      handoverUserId: receiver.userId,
    },
    worker.userId,
  );
  await sample('departure.submit', () =>
    departure.transition(
      String(departureDraft.record.id),
      'submit',
      worker.userId,
      Number(departureDraft.record.lifecycleVersion),
      randomUUID(),
    ),
  );
  const source = leaveDraft.record;
  for (const size of [100, 500]) {
    const existing = await db.repository('leaveRequests').count();
    await db.repository('leaveRequests').createMany({
      values: Array.from({ length: size - existing }, () => ({
        ...source,
        id: randomUUID(),
        number: null,
      })),
    });
    const records = await db.repository<LegacyRow>('leaveRequests').findMany();
    const directory = await c.resolve(approvalDirectoryServiceToken).snapshot();
    const sdk = leave.approvals;
    let start = performance.now();
    const expected: string[] = [];
    for (const row of records)
      if (
        await legacyReadable('oa.leave', row, stranger.userId, {
          db,
          org,
          employees,
          directory,
          approvals: sdk,
          lifecycle: 'oa.leave',
        })
      )
        expected.push(row.id);
    const beforeMs = performance.now() - start;
    start = performance.now();
    const actual = await leave.readableIds(stranger.userId);
    const afterMs = performance.now() - start;
    if (JSON.stringify(actual.sort()) !== JSON.stringify(expected.sort()))
      throw new Error('Performance comparison changed visibility');
    process.stdout.write(
      JSON.stringify({
        sample: 'leave.readableIds',
        records: size,
        beforeMs,
        afterMs,
        matched: actual.length,
      }) + '\n',
    );
  }
} finally {
  await app.close();
}

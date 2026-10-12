// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { databaseManagerToken } from '@nocobase/db';
import { test } from './helpers.js';
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
} from '../../../server/providers/recruitment/submission.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { json } from '../org/helpers.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { departureApprovalReassignmentToken } from '../../../server/providers/departure/contract.js';
import { recruitmentServiceToken } from '../../../server/providers/recruitment/service.js';
import { createRecruitmentService } from '../../../server/providers/recruitment/service.js';
import { createRequisitionService } from '../../../server/providers/recruitment/requisitions.js';
import type { TestApp } from '@nocobase/app-testing/server';
import {
  renderTimelineEntry,
  type ApprovalTimeline,
} from '@nocobase/app-plugin-approval/client';
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

const policy = { read: true, create: true, update: true, delete: false };
function host(f: Awaited<ReturnType<typeof fixture>>) {
  const notifications = {
    task: vi.fn(async () => {}),
    result: vi.fn(async () => {}),
    alarm: vi.fn(async () => {}),
  };
  const service = createRecruitmentService({
    db: f.db,
    org: f.c.resolve(orgServiceToken),
    employees: f.c.resolve(employeeServiceToken),
    headcounts: f.headcounts,
    grades: f.c.resolve(salaryGradeServiceToken),
    rules: f.c.resolve(ruleServiceToken),
    calendar: f.c.resolve(calendarServiceToken),
    audit: f.audit,
    directory: f.c.resolve(approvalDirectoryServiceToken),
    users: f.c.resolve(userAdministrationServiceToken),
    notifications,
  });
  return { service, notifications };
}
test('production host create/edit/submit salary freeze and atomic caller replay', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    { service } = host(f);
  const { id: _id, ...proposal } = f.proposal;
  const input = {
    ...proposal,
    expectedStartDate: '2026-12-01',
    jobDescription: 'Build OA',
    reason: 'Real demand',
  };
  const command = f.command('host-create');
  const created = await service.create(input, command, policy);
  expect(created.status).toBe('draft');
  await expect(
    service.create(input, command, { ...policy, create: false }),
  ).rejects.toThrow('FORBIDDEN');
  expect(await service.create(input, command, policy)).toEqual(created);
  await expect(
    service.create({ ...input, quantity: 1 }, command, policy),
  ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  expect(
    await f.db
      .repository('recruitmentSalaryRevisions')
      .count({ filter: { requestId: created.id } }),
  ).toBe(1);
  const readCoordination = vi.spyOn(f.headcounts, 'within');
  await service.readableIds('uninvolved-performance-reader');
  expect(readCoordination).not.toHaveBeenCalled();
  const submitted = await service.transition(
    created.id,
    'submit',
    created.lifecycleVersion,
    f.command('host-submit'),
    policy,
  );
  expect(readCoordination).toHaveBeenCalled();
  readCoordination.mockRestore();
  expect(submitted.status).toBe('hrbp');
  expect(submitted.privateSalaryRevisionId).not.toBe(
    created.privateSalaryRevisionId,
  );
  expect(
    await f.db
      .repository('recruitmentSalaryRevisions')
      .count({ filter: { requestId: created.id } }),
  ).toBe(2);
  const salary = await service.salary(created.id, policy, policy);
  expect(salary).toEqual({ minimumCents: 12000, maximumCents: 18000 });
  const detail = await service.detail(created.id, f.actor.userId, policy);
  expect(JSON.stringify(detail)).not.toMatch(/minimumCents|maximumCents|band/);
  expect(detail.users).toContainEqual({
    id: f.actor.userId,
    name: 'Recruitment head',
  });
  const balance = await f.db.transaction((tx) =>
    f.headcounts.balance(f.account.id, tx),
  );
  expect(balance?.pending).toBe(2);
  const withdrawn = await service.transition(
    created.id,
    'withdraw',
    submitted.lifecycleVersion,
    f.command('host-withdraw'),
    policy,
  );
  expect(withdrawn.status).toBe('withdrawn');
  expect(
    (await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)))
      ?.pending,
  ).toBe(0);
  await expect(
    service.salary(created.id, policy, {
      read: false,
      create: false,
      update: false,
      delete: false,
    }),
  ).rejects.toThrow();
});
test('host rejects target mutation scope and never stores a rejected salary revision', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    { service } = host(f);
  const { id: _id, ...proposal } = f.proposal;
  const input = {
    ...proposal,
    expectedStartDate: '2026-12-01',
    jobDescription: 'Build OA',
    reason: 'Real demand',
  };
  const record = await service.create(input, f.command(), policy);
  await expect(
    service.edit(
      record.id,
      { ...input, minimumCents: 13000 },
      record.lifecycleVersion,
      f.command(),
      { ...policy, update: false },
    ),
  ).rejects.toThrow();
  expect(
    await f.db
      .repository('recruitmentSalaryRevisions')
      .count({ filter: { requestId: record.id } }),
  ).toBe(1);
  await expect(
    service.transition(
      record.id,
      'submit',
      record.lifecycleVersion,
      f.command(),
      { ...policy, update: false },
    ),
  ).rejects.toThrow();
  expect(
    (await f.db.transaction((tx) => f.headcounts.balance(f.account.id, tx)))
      ?.pending,
  ).toBe(0);
});

test('real HTTP salary requires both policies; replay is denied after grant revocation', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    authz = f.c.resolve(authorizationToken),
    session = await f.actor.session();
  await f.db
    .query()
    .deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', '=', 'oa-recruitment-employee')
    .execute();
  const key = 'rec-http-' + randomUUID();
  const set = definePermissionSet(key)
    .grant({
      resource: { type: 'composite', id: 'oa.recruitment' },
      actions: ['submit', 'view', 'operate'].map((action) => ({
        action,
        policy: {
          type: 'composite',
          scopes: { recruitmentRequests: 'allRecords' },
        },
      })),
    })
    .build();
  await authz.permissionSets.create(set);
  await authz.permissionSets.assign({
    permissionSet: key,
    subject: { type: 'user', id: f.actor.userId },
  });
  const { id: _id, ...proposal } = f.proposal;
  const body = {
    proposal: {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'Build OA',
      reason: 'Real demand',
    },
    requestKey: 'http-create',
    reason: 'Create demand',
  };
  const created = await session.fetch('/recruitmentRequests', json(body));
  expect(created.status).toBe(200);
  const payload = (await created.json()) as {
    data: { record: { id: string; lifecycleVersion: number } };
  };
  const id = payload.data.record.id;
  expect(JSON.stringify(payload)).not.toMatch(/minimumCents|maximumCents|band/);
  expect(
    (await session.fetch(`/recruitmentRequests/${id}/salary`)).status,
  ).toBe(403);
  const metadata = await session.fetch(
    `/recruitmentRequests/formOptions?requestId=${id}&mode=edit`,
  );
  expect(metadata.status).toBe(200);
  const options = (await metadata.json()).data;
  expect(options.editableFields).toContain('quantity');
  expect(options.editableFields).not.toContain('minimumCents');
  expect(JSON.stringify(options)).not.toMatch(
    /minimumCents":|maximumCents":|bankAccount/,
  );
  const createOptions = await session.fetch(
    '/recruitmentRequests/createOptions',
  );
  expect(createOptions.status).toBe(200);
  const creationMetadata = (await createOptions.clone().json()).data;
  expect(creationMetadata.canCreate).toBe(true);
  expect(
    (await createOptions.json()).data.departments.map(
      (row: { id: string }) => row.id,
    ),
  ).toContain(f.proposal.departmentId);
  const accounts = await session.fetch(
    `/recruitmentRequests/capacityOptions?mode=create&departmentId=${f.department.id}&positionId=${f.position.id}&year=${f.proposal.year}`,
  );
  expect(accounts.status).toBe(200);
  expect((await accounts.json()).data).toEqual([
    {
      id: f.account.id,
      departmentId: f.department.id,
      positionId: f.position.id,
      year: f.proposal.year,
      initialized: true,
    },
  ]);
  const employeeHead = await authz.permissionSets.get('oa-employees-head');
  expect(employeeHead).toBeDefined();
  try {
    await authz.permissionSets.update('oa-employees-head', {
      ...employeeHead!,
      grants: [],
    });
    expect(
      (
        await session.fetch(
          `/recruitmentRequests/createReplacementCandidates?departmentId=${f.department.id}&positionId=${f.position.id}`,
        )
      ).status,
    ).toBe(403);
  } finally {
    await authz.permissionSets.update('oa-employees-head', employeeHead!);
  }
  const hiddenDepartment = await f.org.createDepartment(
    { title: 'Unrelated option department' },
    { actorId: f.actor.userId },
  );
  expect(
    (
      await session.fetch(
        `/recruitmentRequests/capacityOptions?mode=create&departmentId=${hiddenDepartment.id}&positionId=${f.position.id}&year=${f.proposal.year}`,
      )
    ).status,
  ).toBe(403);
  const salaryKey = 'rec-salary-' + randomUUID();
  await authz.permissionSets.create(
    definePermissionSet(salaryKey)
      .grant({
        resource: { type: 'composite', id: 'oa.recruitment' },
        actions: [
          {
            action: 'viewSalary',
            policy: {
              type: 'composite',
              scopes: { recruitmentRequests: 'allRecords' },
            },
          },
        ],
      })
      .build(),
  );
  await authz.permissionSets.assign({
    permissionSet: salaryKey,
    subject: { type: 'user', id: f.actor.userId },
  });
  const salary = await session.fetch(`/recruitmentRequests/${id}/salary`);
  expect(salary.status).toBe(200);
  expect((await salary.json()).data).toEqual({
    minimumCents: 12000,
    maximumCents: 18000,
  });
  await authz.permissionSets.delete(key);
  expect(
    (await session.fetch(`/recruitmentRequests/${id}/salary`)).status,
  ).toBe(403);
  expect((await session.fetch('/recruitmentRequests', json(body))).status).toBe(
    403,
  );
  expect(
    await f.db.repository('recruitmentRequests').count({ filter: { id } }),
  ).toBe(1);
  expect(
    (await testApp.request(`/recruitmentRequests/${id}/salary`)).status,
  ).toBe(401);
  await authz.permissionSets.assign({
    permissionSet: 'oa-recruitment-employee',
    subject: { type: 'authenticated', id: '*' },
  });
});
test('real native approvals publish final version and allocation in the SDK transaction', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    { service } = host(f);
  const reviewers = new Map<string, string>();
  for (const code of ['hrbp', 'hrDirector', 'gm']) {
    const person = await createEmployee(testApp, 'Recruitment ' + code);
    reviewers.set(code, person.userId);
    await f.org.addDutyRoleMember(code, person.userId, {
      actorId: f.actor.userId,
    });
  }
  const executive = await createEmployee(testApp, 'Recruitment VP');
  await f.org.updateDepartment(
    f.department.id,
    { executiveId: executive.userId },
    { actorId: f.actor.userId },
  );
  const { id: _id, ...proposal } = f.proposal;
  const record = await service.create(
    {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'Build OA',
      reason: 'Real demand',
    },
    f.command(),
    policy,
  );
  let current = await service.transition(
    record.id,
    'submit',
    record.lifecycleVersion,
    f.command(),
    policy,
  );
  let steps = 0;
  while (current.status !== 'approved' && steps++ < 6) {
    const reviewerId =
      current.status === 'executive'
        ? executive.userId
        : reviewers.get(current.status)!;
    const detail = await service.detail(current.id, reviewerId, policy);
    const offer = detail.taskActions.find((offer) =>
      offer.actions.some((action) => action.name === 'approve'),
    );
    expect(offer).toBeDefined();
    const command = { ...f.command('approve-' + steps), actorId: reviewerId },
      input = {
        target: { taskId: offer!.task.id },
        action: 'approve',
        requestId: command.requestKey,
      };
    current = await service.action(current.id, input, command, {
      ...policy,
      update: false,
    });
    expect(
      await service.action(current.id, input, command, {
        ...policy,
        update: false,
      }),
    ).toEqual(current);
    await expect(
      service.action(
        current.id,
        { ...input, comment: 'Changed replay' },
        command,
        policy,
      ),
    ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  }
  expect(current.status).toBe('approved');
  const requisition = await f.db
    .repository('requisitions')
    .findOne({ filter: { requestId: current.id } });
  expect(requisition).toMatchObject({
    sourceVersion: current.lifecycleVersion,
    remaining: 2,
    consumed: 0,
    status: 'recruiting',
  });
  expect(
    (
      await f.db.transaction((tx) =>
        f.headcounts.reservation(
          { sourceKind: 'oa.recruitment', sourceId: current.id },
          tx,
        ),
      )
    )?.state,
  ).toBe('allocated');
  expect(
    JSON.stringify(await service.detail(current.id, f.actor.userId, policy)),
  ).not.toMatch(/minimumCents|maximumCents|band/);
});
test('default grants require a headed target and preserve administrator edits', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    ordinary = await createEmployee(
      testApp,
      'Recruitment unauthorized employee',
    );
  const install = (tableName: string) =>
    f.db
      .createSeeder({
        sources: [
          {
            packageName: 'recruitment-permissions-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/recruitment/seeds',
            ),
          },
        ],
        tableName,
      })
      .run();
  await install('recruitmentSeedProof');
  if (
    !(await f.db
      .query()
      .selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('permissionSetKey', '=', 'oa-recruitment-employee')
      .executeTakeFirst())
  )
    await f.c.resolve(authorizationToken).permissionSets.assign({
      permissionSet: 'oa-recruitment-employee',
      subject: { type: 'authenticated', id: '*' },
    });
  const { id: _id, ...proposal } = f.proposal;
  const body = {
    proposal: {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'Build OA',
      reason: 'Real demand',
    },
    requestKey: randomUUID(),
    reason: 'Create demand',
  };
  const os = await ordinary.session(),
    hs = await f.actor.session();
  expect((await os.fetch('/recruitmentRequests', json(body))).status).toBe(403);
  const response = await hs.fetch('/recruitmentRequests', json(body));
  expect(response.status).toBe(200);
  const result = (await response.json()) as {
    data: { record: { id: string } };
  };
  expect(
    (
      await hs.fetch(
        '/recruitmentRequests/' + result.data.record.id + '/salary',
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await os.fetch(
        '/recruitmentRequests/' + result.data.record.id + '/salary',
      )
    ).status,
  ).toBe(403);
  const authz = f.c.resolve(authorizationToken);
  const definition = await authz.permissionSets.get('oa-recruitment-employee');
  expect(definition).toBeDefined();
  // Use the public writer: raw text in this JSON-encoded title corrupts later authorization reads.
  await authz.permissionSets.update('oa-recruitment-employee', {
    ...definition!,
    title: 'Administrator title',
  });
  await install('recruitmentSeedReplayProof');
  expect(
    (await authz.permissionSets.get('oa-recruitment-employee'))?.title,
  ).toBe('Administrator title');
});

test('registered departure owner migrates real recruitment tasks and audits atomically', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    service = f.c.resolve(recruitmentServiceToken);
  const from = await createEmployee(testApp, 'Departing hiring head'),
    to = await createEmployee(testApp, 'Successor hiring head');
  const { signIn, DEFAULT_ADMIN_CREDENTIALS } =
    await import('@nocobase/app-plugin-authentication/testing');
  const administrator = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const administratorId = administrator.user.id;
  await f.db.repository('employees').createOne({
    values: {
      id: randomUUID(),
      code: 'REC-ADMIN-' + randomUUID(),
      name: 'Approval administrator',
      userId: administratorId,
      status: 'regular',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await f.org.updateDepartment(
    f.department.id,
    { managerId: from.userId },
    { actorId: f.actor.userId },
  );
  const { id: _id, ...proposal } = f.proposal;
  const draft = await service.create(
    {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'Build OA',
      reason: 'Real demand',
    },
    f.command(),
    policy,
  );
  const submitted = await service.transition(
    draft.id,
    'submit',
    draft.lifecycleVersion,
    f.command(),
    policy,
  );
  expect(submitted.status).toBe('head');
  const before = await service.approvals.tasksOf(from.userId, ['pending']);
  const task = before.find((task) => task.recordId === submitted.id)!;
  expect(task).toBeDefined();
  const command = {
    from: from.userId,
    to: to.userId,
    requestKey: 'recruitment-departure-' + randomUUID(),
    reason: 'Real departure handover',
  };
  const audit = f.c.resolve(auditServiceToken),
    original = audit.record.bind(audit);
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'recruitment.reassign')
        throw new Error('audit unavailable');
      return original(entry, tx);
    });
  try {
    expect(
      await f.c.resolve(departureApprovalReassignmentToken).reassign(command),
    ).toEqual({ remaining: 1 });
  } finally {
    spy.mockRestore();
  }
  expect(
    (await service.approvals.tasksOf(from.userId, ['pending'])).some(
      (task) => task.recordId === submitted.id,
    ),
  ).toBe(true);
  expect(
    await f.c.resolve(departureApprovalReassignmentToken).reassign(command),
  ).toEqual({ remaining: 0 });
  expect(
    (await service.approvals.tasksOf(from.userId, ['pending'])).some(
      (task) => task.recordId === submitted.id,
    ),
  ).toBe(false);
  expect(
    (await service.approvals.tasksOf(to.userId, ['pending'])).some(
      (task) => task.recordId === submitted.id,
    ),
  ).toBe(true);
  expect(
    await f.db.repository('auditLogs').count({
      filter: { action: 'recruitment.reassign', targetId: submitted.id },
    }),
  ).toBe(1);
  expect(
    await f.c.resolve(departureApprovalReassignmentToken).reassign(command),
  ).toEqual({ remaining: 0 });
});

test('native earlier-stage return and restricted reviewer amendment rebuild real hold and fresh opinions safely', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    { service } = host(f);
  const hrbp = await createEmployee(testApp, 'A2 HRBP');
  const director = await createEmployee(testApp, 'A2 HR director');
  await f.org.addDutyRoleMember('hrbp', hrbp.userId, {
    actorId: f.actor.userId,
  });
  for (const previous of await f.org.dutyRoleMembers('hrDirector'))
    await f.org.removeDutyRoleMember('hrDirector', previous, {
      actorId: f.actor.userId,
    });
  await f.org.addDutyRoleMember('hrDirector', director.userId, {
    actorId: f.actor.userId,
  });
  const { id: _id, ...proposal } = f.proposal;
  const record = await service.create(
    {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'A2 native review',
      reason: 'A2 proof',
    },
    f.command(),
    policy,
  );
  let current = await service.transition(
    record.id,
    'submit',
    record.lifecycleVersion,
    f.command(),
    policy,
  );
  expect(current.status).toBe('hrbp');
  const perform = async (
    actorId: string,
    action: string,
    input?: Record<string, string>,
  ) => {
    const offer = (
      await service.approvals.actionsFor('oa.recruitment', record.id, {
        id: actorId,
      })
    ).find((o) => o.actions.some((a) => a.name === action));
    expect(offer).toBeDefined();
    const command = { ...f.command(), actorId };
    current = await service.action(
      record.id,
      {
        target: { taskId: offer!.task.id },
        action,
        requestId: command.requestKey,
        input,
        comment: action === 'return' ? 'Recheck previous stage' : undefined,
      },
      command,
      policy,
    );
  };
  await perform(hrbp.userId, 'approve');
  expect(current.status).toBe('hrDirector');
  const returnOffer = (
    await service.approvals.actionsFor('oa.recruitment', record.id, {
      id: director.userId,
    })
  )
    .flatMap((o) => o.actions)
    .find((a) => a.name === 'return');
  expect(returnOffer?.options).toMatchObject({
    targets: expect.arrayContaining(['revision', 'hrbp']),
  });
  await perform(director.userId, 'return', { to: 'hrbp' });
  expect(current.status).toBe('hrbp');
  expect(
    (
      await f.headcounts.reservation(
        { sourceKind: 'oa.recruitment', sourceId: record.id },
        f.db.connection(),
      )
    )?.quantity,
  ).toBe(2);
  await perform(hrbp.userId, 'approve');
  expect(current.status).toBe('hrDirector');
  const restrictedOptions = await service.formOptions(
    director.userId,
    record.id,
    'reviewEdit',
    { view: policy, write: policy },
  );
  expect(restrictedOptions.editableFields).toEqual(['gradeId', 'quantity']);
  expect(restrictedOptions.positions).toEqual([]);
  expect(restrictedOptions.grades.length).toBeGreaterThan(0);
  const salaryOptions = await service.formOptions(
    director.userId,
    record.id,
    'reviewEdit',
    { view: policy, write: policy, salary: policy },
  );
  expect(salaryOptions.editableFields).toEqual([
    'gradeId',
    'quantity',
    'minimumCents',
    'maximumCents',
  ]);
  expect(JSON.stringify(salaryOptions)).not.toContain('minimumCents":');
  await expect(
    service.formOptions(f.actor.userId, record.id, 'reviewEdit', {
      view: policy,
      write: policy,
    }),
  ).rejects.toThrow('NOT_CURRENT_REVIEWER');
  const amendment = { ...f.command(), actorId: director.userId };
  const beforeSalary = await f.db
    .repository('recruitmentSalaryRevisions')
    .count({ filter: { requestId: record.id } });
  await expect(
    service.reviewEdit(
      record.id,
      { departmentId: 'forged' },
      current.lifecycleVersion,
      amendment,
      { view: policy, write: policy, salary: policy },
    ),
  ).rejects.toThrow('FIELDS_FORBIDDEN');
  await expect(
    service.reviewEdit(
      record.id,
      { minimumCents: 13000 },
      current.lifecycleVersion,
      amendment,
      { view: policy, write: policy },
    ),
  ).rejects.toThrow('FORBIDDEN');
  await expect(
    service.reviewEdit(
      record.id,
      { quantity: 1 },
      current.lifecycleVersion,
      { ...amendment, actorId: f.actor.userId },
      { view: policy, write: policy },
    ),
  ).rejects.toThrow('FORBIDDEN');
  expect(
    await f.db
      .repository('recruitmentSalaryRevisions')
      .count({ filter: { requestId: record.id } }),
  ).toBe(beforeSalary);
  const version = current.lifecycleVersion;
  const reviewerPermission = definePermissionSet(
    'rec-review-http-' + randomUUID(),
  )
    .grant({
      resource: { type: 'composite', id: 'oa.recruitment' },
      actions: ['view', 'viewSalary', 'reviewEdit', 'operate'].map(
        (action) => ({
          action,
          policy: {
            type: 'composite',
            scopes: { recruitmentRequests: 'allRecords' },
          },
        }),
      ),
    })
    .build();
  const authz = f.c.resolve(authorizationToken);
  await authz.permissionSets.create(reviewerPermission);
  await authz.permissionSets.assign({
    permissionSet: reviewerPermission.key,
    subject: { type: 'user', id: director.userId },
  });
  const reviewerSession = await director.session();
  const httpOptions = await reviewerSession.fetch(
    `/recruitmentRequests/formOptions?requestId=${record.id}&mode=reviewEdit`,
  );
  expect({
    status: httpOptions.status,
    body: await httpOptions.clone().text(),
  }).toMatchObject({ status: 200 });
  expect((await httpOptions.json()).data.editableFields).toEqual([
    'gradeId',
    'quantity',
    'minimumCents',
    'maximumCents',
  ]);
  const saved = await reviewerSession.fetch(
    `/recruitmentRequests/${record.id}/reviewEdit`,
    json({
      ...amendment,
      actorId: undefined,
      version,
      patch: { quantity: 1, minimumCents: 13000 },
    }),
  );
  expect(saved.status).toBe(200);
  const safeSaved = await saved.json();
  expect(JSON.stringify(safeSaved)).not.toMatch(
    /minimumCents|maximumCents|bankAccount/,
  );
  current = safeSaved.data.record;

  expect(current.status).toBe('hrbp');
  expect(current.quantity).toBe(1);
  expect(
    (
      await f.headcounts.reservation(
        { sourceKind: 'oa.recruitment', sourceId: record.id },
        f.db.connection(),
      )
    )?.quantity,
  ).toBe(1);
  expect(await service.salary(record.id, policy, policy)).toMatchObject({
    minimumCents: 13000,
    maximumCents: 18000,
  });
  expect(
    await service.reviewEdit(
      record.id,
      { quantity: 1, minimumCents: 13000 },
      version,
      amendment,
      { view: policy, write: policy, salary: policy },
    ),
  ).toEqual(current);
  await expect(
    service.reviewEdit(
      record.id,
      { quantity: 1, minimumCents: 13000 },
      version,
      amendment,
      { view: policy, write: policy, salary: { ...policy, read: false } },
    ),
  ).rejects.toThrow();
  const runs = await service.approvals.runViewsFor('oa.recruitment', record.id);
  expect(
    runs.filter((r) =>
      ['head', 'hrbp', 'hrDirector', 'executive', 'gm'].includes(r.run.status),
    ),
  ).toHaveLength(1);
  expect(
    JSON.stringify(await service.detail(record.id, director.userId, policy)),
  ).not.toMatch(/13000|18000|minimumCents|maximumCents/);
});

test('public replacement identities retain employee scope and fields and do not certify capacity', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const own = await createEmployee(testApp, 'Replacement own', {
    status: 'leaving',
    positionId: f.position.id,
  });
  const outsider = await createEmployee(testApp, 'Replacement outside', {
    status: 'left',
    positionId: f.position.id,
  });
  await f.org.addMember(
    { departmentId: f.department.id, userId: own.userId, primary: true },
    { actorId: f.actor.userId },
  );
  const other = await f.org.createDepartment(
    { title: 'Outside recruitment' },
    { actorId: f.actor.userId },
  );
  await f.org.addMember(
    { departmentId: other.id, userId: outsider.userId, primary: true },
    { actorId: f.actor.userId },
  );
  const employees = f.c.resolve(employeeServiceToken);
  const query = { departmentId: f.department.id, positionId: f.position.id };
  const identities = await employees.recruitmentReplacementCandidates(
    query,
    policy,
    f.db.connection(),
  );
  expect(identities).toEqual([
    { id: own.employeeId, name: 'Replacement own', status: 'leaving' },
  ]);
  expect(Object.keys(identities[0]!).sort()).toEqual(['id', 'name', 'status']);
  await expect(
    employees.recruitmentReplacementCandidates(
      query,
      { ...policy, read: { scope: true, fields: ['id'] } },
      f.db.connection(),
    ),
  ).rejects.toThrow();
  expect(
    await employees.recruitmentReplacementCandidates(
      query,
      {
        ...policy,
        read: {
          scope: { id: outsider.employeeId },
          fields: ['id', 'name', 'status', 'positionId', 'userId'],
        },
      },
      f.db.connection(),
    ),
  ).toEqual([]);
});

for (const change of [
  'unchanged',
  'jobDescription',
  'quantity',
  'salary',
  'gradeTable',
] as const)
  test(`main registered recruitment resubmission reuses only valid covered opinions: ${change}`, async ({
    testApp,
  }) => {
    const f = await fixture(testApp, 3);
    const service = f.c.resolve(recruitmentServiceToken);
    const reviewers = new Map<
      string,
      Awaited<ReturnType<typeof createEmployee>>
    >();
    for (const code of ['hrbp', 'hrDirector', 'gm']) {
      for (const old of await f.org.dutyRoleMembers(code))
        await f.org.removeDutyRoleMember(code, old, {
          actorId: f.actor.userId,
        });
      const person = await createEmployee(testApp, 'Reuse ' + code);
      reviewers.set(code, person);
      await f.org.addDutyRoleMember(code, person.userId, {
        actorId: f.actor.userId,
      });
    }
    const executive = await createEmployee(testApp, 'Reuse executive');
    reviewers.set('executive', executive);
    await f.org.updateDepartment(
      f.department.id,
      { executiveId: executive.userId },
      { actorId: f.actor.userId },
    );
    const { id: _id, ...proposal } = f.proposal;
    const input = {
      ...proposal,
      expectedStartDate: '2026-12-01',
      jobDescription: 'Reuse coverage',
      reason: 'Reuse proof',
    };
    let current = await service.create(input, f.command(), policy);
    const id = current.id;
    const submit = () =>
      service.transition(
        id,
        'submit',
        current.lifecycleVersion,
        f.command(),
        policy,
      );
    const act = async (stage: string, action = 'approve') => {
      const actorId = reviewers.get(stage)!.userId;
      const offer = (
        await service.approvals.actionsFor('oa.recruitment', id, {
          id: actorId,
        })
      ).find((o) => o.actions.some((a) => a.name === action));
      expect(offer).toBeDefined();
      const command = { ...f.command(), actorId };
      current = await service.action(
        id,
        {
          target: { taskId: offer!.task.id },
          action,
          requestId: command.requestKey,
          ...(action === 'return'
            ? { input: { to: 'revision' }, comment: 'Applicant correction' }
            : {}),
        },
        command,
        policy,
      );
    };
    current = await submit();
    for (const stage of ['hrbp', 'hrDirector', 'executive']) await act(stage);
    const original = await service.approvals.runViewsFor('oa.recruitment', id);
    const originalSalaryId = current.privateSalaryRevisionId;
    await act('gm', 'return');
    expect(current.status).toBe('revision');
    if (change !== 'gradeTable') {
      const patch =
        change === 'jobDescription'
          ? { jobDescription: 'Different JD' }
          : change === 'quantity'
            ? { quantity: 1 }
            : change === 'salary'
              ? { minimumCents: 13000 }
              : {};
      current = await service.edit(
        id,
        { ...input, ...patch },
        current.lifecycleVersion,
        f.command(),
        policy,
      );
    } else {
      const grades = f.c.resolve(salaryGradeServiceToken);
      await f.db.transaction(async (tx) => {
        const table = await grades.current(tx);
        await grades.publish(
          {
            ...f.command(),
            expectedVersion: table.version,
            bands: table.revision!.bands,
          },
          tx,
        );
      });
    }
    // No submit grant cannot exploit a previously approved task to bypass the host transaction.
    await expect(
      service.transition(id, 'submit', current.lifecycleVersion, f.command(), {
        ...policy,
        update: false,
      }),
    ).rejects.toThrow('FORBIDDEN');
    const beforeRuns = await service.approvals.runViewsFor(
      'oa.recruitment',
      id,
    );
    const beforeHold = await f.headcounts.reservation(
      { sourceKind: 'oa.recruitment', sourceId: id },
      f.db.connection(),
    );
    const submitVersion = current.lifecycleVersion;
    const submitCommand = f.command();
    if (change === 'quantity') {
      const audit = vi
        .spyOn(f.audit, 'record')
        .mockRejectedValueOnce(new Error('reuse hold audit failed'));
      await expect(
        service.transition(id, 'submit', submitVersion, submitCommand, policy),
      ).rejects.toThrow('reuse hold audit failed');
      audit.mockRestore();
      expect(
        await f.headcounts.reservation(
          { sourceKind: 'oa.recruitment', sourceId: id },
          f.db.connection(),
        ),
      ).toEqual(beforeHold);
      expect(await service.approvals.runViewsFor('oa.recruitment', id)).toEqual(
        beforeRuns,
      );
      expect(
        (await service.detail(id, f.actor.userId, policy)).record.status,
      ).toBe('revision');
    }
    current = await service.transition(
      id,
      'submit',
      submitVersion,
      submitCommand,
      policy,
    );
    expect(
      await service.transition(
        id,
        'submit',
        submitVersion,
        submitCommand,
        policy,
      ),
    ).toEqual(current);
    const unchangedSalary = [
      'unchanged',
      'jobDescription',
      'quantity',
    ].includes(change);
    expect(current.privateSalaryRevisionId === originalSalaryId).toBe(
      unchangedSalary,
    );
    expect(current.status).toBe(change === 'unchanged' ? 'gm' : 'hrbp');
    if (change === 'jobDescription') {
      await act('hrbp');
      expect(current.status).toBe('gm');
    }
    const views = await service.approvals.runViewsFor('oa.recruitment', id);
    const reused = views
      .flatMap((view) => view.tasks)
      .filter((task) => task.data?.reusedFromTaskId);
    const expectedStages =
      change === 'unchanged'
        ? ['hrbp', 'hrDirector', 'executive']
        : change === 'jobDescription'
          ? ['hrDirector', 'executive']
          : [];
    expect(
      reused
        .map(
          (task) =>
            views.find((view) => view.run.id === task.runId)!.run.plan[0]!
              .stage,
        )
        .sort(),
    ).toEqual(expectedStages.sort());
    for (const task of reused) {
      expect(
        original
          .flatMap((view) => view.tasks)
          .some(
            (source) =>
              source.id === task.data!.reusedFromTaskId &&
              source.actorId === source.assigneeId &&
              source.answer === 'approve',
          ),
      ).toBe(true);
      expect(task.id).not.toBe(task.data!.reusedFromTaskId);
    }
    const session = await f.actor.session();
    const response = await session.fetch(`/recruitmentRequests/${id}`);
    expect({
      status: response.status,
      body: await response.clone().text(),
    }).toMatchObject({ status: 200 });
    const safe = await response.json();
    expect(JSON.stringify(safe)).not.toMatch(
      /minimumCents|maximumCents|12000|18000/,
    );
    const timeline = safe.data.timeline as ApprovalTimeline;
    const entries = timeline.runs.flatMap((run) => [
      ...run.entries,
      ...run.stages.flatMap((stage) => stage.entries),
    ]);
    const reusedEntries = entries.filter(
      (entry) => entry.type === 'system' && entry.event.kind === 'task.reused',
    );
    expect(reusedEntries).toHaveLength(expectedStages.length);
    for (const entry of reusedEntries) {
      // The unchanged production detail uses this exact public renderer for SDK evidence.
      expect(
        renderTimelineEntry(entry, {
          t: (_key, options) => String(options?.defaultValue),
          name: (id) => id,
          stage: (key) => key,
        }).title,
      ).toBe('kept an earlier decision');
    }
    const hold = await f.headcounts.reservation(
      { sourceKind: 'oa.recruitment', sourceId: id },
      f.db.connection(),
    );
    expect(hold?.quantity).toBe(change === 'quantity' ? 1 : 2);
    while (current.status !== 'approved') await act(current.status);
    expect(
      (
        await f.db
          .repository('requisitions')
          .findOne({ filter: { requestId: id } })
      )?.remaining,
    ).toBe(change === 'quantity' ? 1 : 2);
    expect(
      (
        await f.headcounts.reservation(
          { sourceKind: 'oa.recruitment', sourceId: id },
          f.db.connection(),
        )
      )?.state,
    ).toBe('allocated');
  });

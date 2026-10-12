// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterEach, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import {
  transferServiceToken,
  TRANSFER_FIELDS,
} from '../../../server/providers/transfer/service.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  ALL,
  createEmployee,
  createPerson,
  grantToUser,
  employees as employeeModule,
} from '../employees/helpers.js';
import { test } from './helpers.js';
afterEach(() => vi.useRealTimers());
test('production host executes native six-stage personnel approval and closes old runs after restricted reviewer modification', async ({
  testApp,
}) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-11T01:00:00Z'));
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    employee = c.resolve(employeeServiceToken),
    grades = c.resolve(salaryGradeServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    service = c.resolve(transferServiceToken);
  if (!(await db.connection().collections.get('transferCommands')))
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'transfer-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/transfer/migrations',
            ),
          },
        ],
        tableName: 'transferCandidateMigrations',
      })
      .latest();
  await service.initialize();
  const actor = await createEmployee(testApp, 'Transfer HR author'),
    manager = await createEmployee(testApp, 'Transfer manager'),
    sourceHead = await createEmployee(testApp, 'Transfer source head'),
    targetHead = await createEmployee(testApp, 'Transfer target head'),
    hr = await createEmployee(testApp, 'Transfer HR reviewer'),
    executive = await createEmployee(testApp, 'Transfer executive'),
    gm = await createEmployee(testApp, 'Transfer GM');
  const context = { actorId: actor.userId };
  await org.addDutyRoleMember('hr', actor.userId, context);
  await org.addDutyRoleMember('hr', hr.userId, context);
  await org.addDutyRoleMember('gm', gm.userId, context);
  const sourceDepartment = await org.createDepartment(
      { title: randomUUID(), managerId: sourceHead.userId },
      context,
    ),
    targetDepartment = await org.createDepartment(
      {
        title: randomUUID(),
        managerId: targetHead.userId,
        executiveId: executive.userId,
      },
      context,
    );
  const sourcePosition = await org.createPosition(
      { code: randomUUID(), title: 'Source position' },
      context,
    ),
    targetPosition = await org.createPosition(
      { code: randomUUID(), title: 'Target position' },
      context,
    ),
    grade = await org.createGrade(
      { code: randomUUID(), title: 'Transfer salary band', rank: 1 },
      context,
    );
  const subject = await createEmployee(testApp, 'Transfer employee', {
    managerId: manager.employeeId,
    positionId: sourcePosition.id,
    gradeId: grade.id,
  });
  await org.addMember(
    {
      departmentId: sourceDepartment.id,
      userId: subject.userId,
      primary: true,
    },
    context,
  );
  await db.transaction((tx) =>
    employee.appendCompensation(
      {
        employeeId: subject.employeeId,
        baseSalary: '1000.00',
        gradeId: grade.id,
        effectiveFrom: '2026-01-01',
      },
      context,
      tx,
    ),
  );
  const pointer = await grades.current(db.connection());
  await grades.publish(
    {
      expectedVersion: pointer.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 200000 }],
      actorId: actor.userId,
      reason: 'Real personnel salary table',
    },
    db.connection(),
  );
  const command = {
    actorId: actor.userId,
    requestKey: randomUUID(),
    reason: 'Personnel change capacity',
  };
  const sourceAccount = await db.transaction((tx) =>
      headcounts.create(
        {
          ...command,
          departmentId: sourceDepartment.id,
          positionId: sourcePosition.id,
          year: 2026,
          limit: 2,
        },
        tx,
      ),
    ),
    targetAccount = await db.transaction((tx) =>
      headcounts.create(
        {
          ...command,
          requestKey: randomUUID(),
          departmentId: targetDepartment.id,
          positionId: targetPosition.id,
          year: 2026,
          limit: 2,
        },
        tx,
      ),
    );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: sourceAccount.id,
        expectedVersion: sourceAccount.version,
        employeeIds: [subject.employeeId],
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: targetAccount.id,
        expectedVersion: targetAccount.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  const policies = { view: ALL, write: ALL, salary: ALL },
    record = await service.create(
      {
        employeeId: subject.employeeId,
        kinds: ['transfer', 'salaryChange'],
        targetDepartmentId: targetDepartment.id,
        targetPositionId: targetPosition.id,
        targetGradeId: grade.id,
        targetManagerId: targetHead.employeeId,
        effectiveDate: '2026-10-11',
        targetSalary: '1300.01',
        sourceAccountId: sourceAccount.id,
        targetAccountId: targetAccount.id,
        reason: 'Real transfer',
      },
      { ...command, requestKey: randomUUID() },
      policies,
    );
  const readCoordination = vi.spyOn(headcounts, 'within');
  await service.readableIds('uninvolved-performance-reader');
  expect(readCoordination).not.toHaveBeenCalled();
  let current = await service.transition(
    record.id,
    'submit',
    record.lifecycleVersion,
    { ...command, requestKey: randomUUID() },
    policies,
  );
  expect(readCoordination).toHaveBeenCalled();
  readCoordination.mockRestore();
  expect(current.status).toBe('manager');
  async function approve(person: { userId: string }, requestId = record.id) {
    const offers = await service.approvals.actionsFor(
      'oa.transfer',
      requestId,
      { id: person.userId },
    );
    const offer = offers.find((o) =>
      o.actions.some((a) => a.name === 'approve'),
    );
    expect(offer).toBeDefined();
    const options = await service.formOptions(
      person.userId,
      'reviewEdit',
      policies,
      requestId,
    );
    if (
      ['manager', 'sourceHead', 'targetHead', 'hr', 'executive', 'gm'].includes(
        current.status,
      )
    )
      expect(options.editableFields.length).toBeGreaterThan(0);
    if (current.status === 'targetHead') {
      const restricted = await service.formOptions(
        person.userId,
        'reviewEdit',
        {
          ...policies,
          write: {
            read: true,
            create: false,
            update: { fields: ['effectiveDate'], scope: true },
            delete: false,
          },
        },
        requestId,
      );
      expect(restricted.editableFields).toEqual(['effectiveDate']);
      expect(restricted.positions).toEqual([]);
    }
    if (['executive', 'gm'].includes(current.status)) {
      const withoutSalary = await service.formOptions(
        person.userId,
        'reviewEdit',
        { view: policies.view, write: policies.write },
        requestId,
      );
      expect(withoutSalary.editableFields).toEqual(['targetGradeId']);
      expect(withoutSalary.managers).toEqual([]);
    }
    if (current.status === 'targetHead')
      expect(options.editableFields).toEqual([
        'targetPositionId',
        'effectiveDate',
      ]);
    if (['executive', 'gm'].includes(current.status))
      expect(options.editableFields).toEqual(['targetGradeId', 'targetSalary']);
    expect(JSON.stringify(options)).not.toMatch(
      /currentCents|bankAccount|baseSalary/,
    );
    current = await service.action(
      requestId,
      {
        target: { taskId: offer!.task.id },
        action: 'approve',
        requestId: randomUUID(),
        input: {},
      },
      { actorId: person.userId, requestKey: randomUUID(), reason: 'Reviewed' },
      policies,
    );
  }
  const copied = await createEmployee(testApp, 'Transfer center copy');
  // This approval does not enable dynamic CC; a non-involved employee cannot
  // enter copied/pending/done merely because the owner view policy is broad.
  expect(await service.listForCenter(copied.userId, 'copied', ALL)).toEqual([]);
  expect(await service.listForCenter(copied.userId, 'pending', ALL)).toEqual(
    [],
  );
  expect(await service.listForCenter(copied.userId, 'done', ALL)).toEqual([]);
  const delegate = await createEmployee(testApp, 'Transfer center delegate');
  const directory = c.resolve(approvalDirectoryServiceToken);
  const delegation = await directory.createManualDelegation(
    {
      principalId: manager.userId,
      delegateId: delegate.userId,
      scope: ['oa.transfer'],
      from: new Date(Date.now() - 60000).toISOString(),
      to: new Date(Date.now() + 3600000).toISOString(),
    },
    { actorId: manager.userId },
  );
  expect(
    (await service.listForCenter(manager.userId, 'pending', ALL)).map(
      (r) => r.id,
    ),
  ).toContain(record.id);
  expect(
    (await service.listForCenter(delegate.userId, 'pending', ALL)).map(
      (r) => r.id,
    ),
  ).toContain(record.id);
  expect(await service.listForCenter(actor.userId, 'pending', ALL)).toEqual([]);
  expect(await service.listForCenter(delegate.userId, 'done', ALL)).toEqual([]);
  const centerMine = await service.listForCenter(actor.userId, 'mine', ALL);
  expect(
    await service.listForCenter(actor.userId, 'mine', {
      ...ALL,
      read: {
        fields: [...TRANSFER_FIELDS],
        scope: { id: 'outside-current-scope' },
      },
    }),
  ).toEqual([]);
  expect(centerMine).toEqual([
    expect.objectContaining({ id: record.id, amount: null, unit: null }),
  ]);
  expect(JSON.stringify(centerMine)).not.toMatch(
    /1300|1000|privateSalary|snapshot|targetSalary|currentSalary/,
  );
  await expect(
    service.listForCenter(actor.userId, 'mine', { ...ALL, read: false }),
  ).rejects.toThrow();
  await expect(
    service.listForCenter(actor.userId, 'mine', {
      ...ALL,
      read: { fields: ['id'], scope: true },
    }),
  ).rejects.toThrow();
  await directory.disableManualDelegation(delegation.id, {
    actorId: manager.userId,
  });
  expect(await service.listForCenter(delegate.userId, 'pending', ALL)).toEqual(
    [],
  );
  const activeDelegation = await directory.createManualDelegation(
    {
      principalId: manager.userId,
      delegateId: delegate.userId,
      scope: ['oa.transfer'],
      from: new Date(Date.now() - 60000).toISOString(),
      to: new Date(Date.now() + 3600000).toISOString(),
    },
    { actorId: manager.userId },
  );
  await service.listForCenter(delegate.userId, 'pending', ALL);
  await approve(delegate);
  expect(
    (await service.listForCenter(delegate.userId, 'done', ALL)).map(
      (r) => r.id,
    ),
  ).toContain(record.id);
  expect(await service.listForCenter(manager.userId, 'done', ALL)).toEqual([]);
  expect(await service.listForCenter(delegate.userId, 'pending', ALL)).toEqual(
    [],
  );
  await directory.disableManualDelegation(activeDelegation.id, {
    actorId: manager.userId,
  });
  expect(current.status).toBe('sourceHead');
  await approve(sourceHead);
  expect(current.status).toBe('targetHead');
  await approve(targetHead);
  expect(current.status).toBe('hr');
  await approve(hr);
  expect(current.status).toBe('executive');
  await approve(executive);
  expect(current.status).toBe('gm');
  await approve(gm);
  expect(current.status).toBe('pendingEffective');
  expect(
    await headcounts.balance(targetAccount.id, db.connection()),
  ).toMatchObject({ allocated: 1, used: 0 });
  expect(
    JSON.stringify(await service.detail(record.id, actor.userId, ALL)),
  ).not.toContain('130001');
  const salaryOnly = await createPerson(
    testApp,
    'Salary permission without ordinary view',
  );
  const permission = (actions: string[]) => [
    {
      resource: { type: 'composite' as const, id: 'oa.transfer' },
      actions: actions.map((action) => ({
        action,
        policy: {
          type: 'composite' as const,
          scopes: { transferRequests: 'allRecords' },
        },
      })),
    },
  ];
  const hrKey = 'transfer-private-' + randomUUID();
  await grantToUser(
    testApp,
    'transfer-view-' + randomUUID(),
    permission(['view']),
    manager.userId,
  );
  await grantToUser(
    testApp,
    'transfer-only-salary-' + randomUUID(),
    permission(['viewSalary']),
    salaryOnly.userId,
  );
  await grantToUser(
    testApp,
    hrKey,
    permission(['view', 'viewSalary']),
    hr.userId,
  );
  const managerSession = await manager.session(),
    salaryOnlySession = await salaryOnly.session(),
    hrSession = await hr.session();
  expect(
    (await managerSession.fetch('/transferRequests/' + record.id + '/salary'))
      .status,
  ).toBe(403);
  expect(
    (
      await salaryOnlySession.fetch(
        '/transferRequests/' + record.id + '/salary',
      )
    ).status,
  ).toBe(403);
  const salaryResponse = await hrSession.fetch(
    '/transferRequests/' + record.id + '/salary',
  );
  expect(salaryResponse.status).toBe(200);
  expect(await salaryResponse.json()).toMatchObject({
    data: { targetSalary: '1300.01', currentSalary: 100000 },
  });
  await c.resolve(authorizationToken).permissionSets.delete(hrKey);
  // Main installations also grant HR pay access by duty: revoke that independent source too.
  await org.removeDutyRoleMember('hr', hr.userId, context);
  expect(
    (await hrSession.fetch('/transferRequests/' + record.id + '/salary'))
      .status,
  ).toBe(403);

  await org.addDutyRoleMember('hr', hr.userId, context);
  expect(await service.maintenance()).toMatchObject({
    completed: 1,
    failures: [],
  });
  expect(await employee.getById(subject.employeeId)).toMatchObject({
    positionId: targetPosition.id,
  });
  expect(await org.primaryDepartmentOf(subject.userId)).toMatchObject({
    id: targetDepartment.id,
  });
  expect(
    await employee.currentCompensationOf(
      subject.employeeId,
      '2026-10-11',
      db.connection(),
    ),
  ).toMatchObject({ baseSalary: '1300.01' });
  expect(
    await headcounts.balance(sourceAccount.id, db.connection()),
  ).toMatchObject({ used: 0 });
  expect(
    await headcounts.balance(targetAccount.id, db.connection()),
  ).toMatchObject({ used: 1, allocated: 0 });
  const second = await service.create(
    {
      employeeId: subject.employeeId,
      kinds: ['salaryChange'],
      targetDepartmentId: targetDepartment.id,
      targetPositionId: targetPosition.id,
      targetGradeId: grade.id,
      targetManagerId: targetHead.employeeId,
      effectiveDate: '2026-10-11',
      targetSalary: '1700.01',
      sourceAccountId: null,
      targetAccountId: null,
      reason: 'Second salary change',
    },
    { ...command, requestKey: randomUUID() },
    policies,
  );
  current = await service.transition(
    second.id,
    'submit',
    second.lifecycleVersion,
    { ...command, requestKey: randomUUID() },
    policies,
  );
  for (let attempts = 0; current.status !== 'hr' && attempts < 4; attempts++)
    await approve(targetHead, second.id);
  expect(current.status).toBe('hr');
  const frozenGradeRevisionId = current.snapshot!.gradeRevisionId;
  const beforeEdit = await service.approvals.runViewsFor(
    'oa.transfer',
    second.id,
  );
  const oldTasks = beforeEdit
    .flatMap((view) => view.tasks)
    .filter((task) => ['pending', 'claimed'].includes(task.status));
  expect(oldTasks.length).toBeGreaterThan(0);
  const publishedNow = await grades.current(db.connection());
  await grades.publish(
    {
      expectedVersion: publishedNow.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 135000 }],
      actorId: actor.userId,
      reason: 'Narrow future payroll band',
    },
    db.connection(),
  );
  current = await service.reviewEdit(
    second.id,
    { targetSalary: '1500.01' },
    current.lifecycleVersion,
    {
      actorId: hr.userId,
      requestKey: randomUUID(),
      reason: 'Actual HR salary correction',
    },
    policies,
  );
  expect(current.status).toBe('manager');
  expect(current.snapshot).toMatchObject({
    executiveRequired: false,
    gmRequired: false,
    gradeRevisionId: frozenGradeRevisionId,
  });
  const afterEdit = await service.approvals.runViewsFor(
    'oa.transfer',
    second.id,
  );
  expect(
    afterEdit
      .flatMap((view) => view.tasks)
      .filter((task) => oldTasks.some((old) => old.id === task.id))
      .every(
        (task) => !['pending', 'claimed', 'waiting'].includes(task.status),
      ),
  ).toBe(true);
  await expect(
    service.action(
      second.id,
      {
        target: { taskId: oldTasks[0].id },
        action: 'approve',
        requestId: randomUUID(),
        input: {},
      },
      { actorId: hr.userId, requestKey: randomUUID(), reason: 'Stale task' },
      policies,
    ),
  ).rejects.toBeDefined();
  await expect(
    service.reviewEdit(
      second.id,
      { targetSalary: '1800.00' },
      current.lifecycleVersion,
      {
        actorId: targetHead.userId,
        requestKey: randomUUID(),
        reason: 'Manager cannot read or edit pay',
      },
      policies,
    ),
  ).rejects.toMatchObject({ reason: 'TRANSFER_FIELDS_FORBIDDEN' });
  for (let attempts = 0; current.status !== 'hr' && attempts < 4; attempts++)
    await approve(targetHead, second.id);
  await approve(hr, second.id);
  expect(current.status).toBe('pendingEffective');
  expect(
    JSON.stringify(await service.detail(second.id, hr.userId, ALL)),
  ).not.toContain('150001');
  expect(await service.maintenance()).toMatchObject({
    completed: 1,
    failures: [],
  });
  expect(
    await employee.currentCompensationOf(
      subject.employeeId,
      '2026-10-11',
      db.connection(),
    ),
  ).toMatchObject({ baseSalary: '1500.01' });
  const third = await service.create(
    {
      employeeId: subject.employeeId,
      kinds: ['salaryChange'],
      targetDepartmentId: targetDepartment.id,
      targetPositionId: targetPosition.id,
      targetGradeId: grade.id,
      targetManagerId: targetHead.employeeId,
      effectiveDate: '2099-12-31',
      targetSalary: '1300.00',
      sourceAccountId: null,
      targetAccountId: null,
      reason: 'Future personnel change',
    },
    { ...command, requestKey: randomUUID() },
    policies,
  );
  current = await service.transition(
    third.id,
    'submit',
    third.lifecycleVersion,
    { ...command, requestKey: randomUUID() },
    policies,
  );
  for (let attempts = 0; current.status !== 'hr' && attempts < 4; attempts++)
    await approve(targetHead, third.id);
  await approve(hr, third.id);
  expect(current.status).toBe('pendingEffective');
  expect(await service.maintenance()).toMatchObject({
    completed: 0,
    failures: [],
  });
  current = await service.transition(
    third.id,
    'requestCancellation',
    current.lifecycleVersion,
    {
      ...command,
      requestKey: randomUUID(),
      reason: 'Cancel before effective date',
    },
    policies,
  );
  expect(current.status).toBe('cancellationReview');
  expect(current.cancelConfirmerId).toBe(hr.userId);
  await expect(
    service.action(
      third.id,
      {
        target: {
          runId: (
            await service.approvals.runViewsFor('oa.transfer', third.id)
          ).at(-1)!.run.id,
        },
        action: 'approve',
        input: {},
        requestId: randomUUID(),
      },
      { ...command, requestKey: randomUUID() },
      policies,
    ),
  ).rejects.toBeDefined();
  const successor = await createEmployee(testApp, 'Successor HR confirmer');
  await org.addDutyRoleMember('hr', successor.userId, context);
  const { signIn, DEFAULT_ADMIN_CREDENTIALS } =
    await import('@nocobase/app-plugin-authentication/testing');
  const administrator = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  await employeeModule(testApp).createEmployee(
    {
      userId: administrator.user.id,
      code: 'TRANSFER-ADMIN-' + randomUUID(),
      name: 'Personnel task administrator',
      status: 'regular',
      hireDate: '2026-01-01',
    },
    ALL,
    administrator.user.id,
  );
  const reassignOffers = await service.approvals.actionsFor(
    'oa.transfer',
    third.id,
    { id: administrator.user.id },
  );
  const reassignOffer = reassignOffers.find((offer) =>
    offer.actions.some((action) => action.name === 'reassign'),
  )!;
  expect(reassignOffer).toBeDefined();
  current = await service.action(
    third.id,
    {
      target: { taskId: reassignOffer.task.id },
      action: 'reassign',
      input: { to: successor.userId, override: true },
      requestId: randomUUID(),
      comment: 'Independent HR handover',
    },
    {
      actorId: administrator.user.id,
      requestKey: randomUUID(),
      reason: 'Independent HR handover',
    },
    policies,
  );
  expect(current.status).toBe('cancellationReview');
  await approve(successor, third.id);
  expect(current.status).toBe('cancelled');
  const replay = { ...command, requestKey: randomUUID() };
  const draft = await service.create(
    {
      employeeId: subject.employeeId,
      kinds: ['salaryChange'],
      targetDepartmentId: targetDepartment.id,
      targetPositionId: targetPosition.id,
      targetGradeId: grade.id,
      targetManagerId: targetHead.employeeId,
      effectiveDate: '2099-12-31',
      sourceAccountId: null,
      targetAccountId: null,
      targetSalary: '1300.00',
      reason: 'Replay scope',
    },
    replay,
    policies,
  );
  await expect(
    service.create(
      {
        employeeId: subject.employeeId,
        kinds: ['salaryChange'],
        targetDepartmentId: targetDepartment.id,
        targetPositionId: targetPosition.id,
        targetGradeId: grade.id,
        targetManagerId: targetHead.employeeId,
        effectiveDate: '2099-12-31',
        sourceAccountId: null,
        targetAccountId: null,
        targetSalary: '1300.00',
        reason: 'Replay scope',
      },
      replay,
      { view: { ...ALL, read: false }, write: ALL },
    ),
  ).rejects.toMatchObject({ reason: 'TRANSFER_FORBIDDEN' });
  expect(draft.status).toBe('draft');
  const fourth = await service.create(
    {
      employeeId: subject.employeeId,
      kinds: ['transfer', 'salaryChange'],
      targetDepartmentId: sourceDepartment.id,
      targetPositionId: sourcePosition.id,
      targetGradeId: grade.id,
      targetManagerId: sourceHead.employeeId,
      effectiveDate: '2026-12-31',
      targetSalary: '1300.00',
      sourceAccountId: targetAccount.id,
      targetAccountId: sourceAccount.id,
      reason: 'Approved across year',
    },
    { ...command, requestKey: randomUUID() },
    policies,
  );
  current = await service.transition(
    fourth.id,
    'submit',
    fourth.lifecycleVersion,
    { ...command, requestKey: randomUUID() },
    policies,
  );
  for (
    let attempts = 0;
    current.status !== 'targetHead' && attempts < 4;
    attempts++
  )
    await approve(targetHead, fourth.id);
  await approve(sourceHead, fourth.id);
  await approve(hr, fourth.id);
  expect(current.status).toBe('pendingEffective');
  const newSource = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command,
        requestKey: randomUUID(),
        departmentId: targetDepartment.id,
        positionId: targetPosition.id,
        year: 2027,
        limit: 2,
      },
      tx,
    ),
  );
  const newTarget = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command,
        requestKey: randomUUID(),
        departmentId: sourceDepartment.id,
        positionId: sourcePosition.id,
        year: 2027,
        limit: 2,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: newSource.id,
        expectedVersion: newSource.version,
        employeeIds: [subject.employeeId],
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: newTarget.id,
        expectedVersion: newTarget.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2027-01-01T00:00:00Z'));
  try {
    expect(await service.maintenance()).toMatchObject({
      completed: 0,
      failures: [{ id: fourth.id, reason: 'TRANSFER_YEAR_REBIND_REQUIRED' }],
    });
    expect(
      (await service.detail(fourth.id, actor.userId, ALL)).record
        .executionFailureCode,
    ).toBe('TRANSFER_YEAR_REBIND_REQUIRED');
    const rebindCommand = { ...command, requestKey: randomUUID() };
    const rebindVersion = current.lifecycleVersion;
    current = await service.rebind(
      fourth.id,
      current.lifecycleVersion,
      rebindCommand,
      policies,
    );
    await org.removeDutyRoleMember('hr', actor.userId, context);
    await expect(
      service.rebind(fourth.id, rebindVersion, rebindCommand, policies),
    ).rejects.toMatchObject({ reason: 'TRANSFER_FORBIDDEN' });
    await org.addDutyRoleMember('hr', actor.userId, context);
    expect(current.sourceAccountId).toBe(newSource.id);
    expect(await service.maintenance()).toMatchObject({
      completed: 1,
      failures: [],
    });
    expect(await service.maintenance()).toMatchObject({
      completed: 0,
      failures: [],
    });
    expect(
      (await service.detail(fourth.id, actor.userId, ALL)).record
        .executionFailureCode,
    ).toBeNull();
    expect(
      await headcounts.balance(newSource.id, db.connection()),
    ).toMatchObject({ used: 0 });
    expect(
      await headcounts.balance(newTarget.id, db.connection()),
    ).toMatchObject({ used: 1 });
  } finally {
    vi.useRealTimers();
  }
});

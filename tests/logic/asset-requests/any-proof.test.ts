// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  ApprovalService,
  type Approval,
} from '@nocobase/app-plugin-approval/server';
import {
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { assetRequestApproval } from '../../../server/providers/asset-requests/approval.js';
import { ASSET_REQUEST_LIFECYCLE } from '../../../server/providers/asset-requests/contract.js';
const test = createEmployeesAppTest();
test('installed public SDK gives appraisal and finance independent member places: one approval or all rejections', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    directory = c.resolve(approvalDirectoryServiceToken);
  const [applicant, head, adminA, adminB, financeA, financeB] =
    await Promise.all(
      ['Applicant', 'Head', 'Admin A', 'Admin B', 'Finance A', 'Finance B'].map(
        (name) => createEmployee(testApp, `Asset ${name}`),
      ),
    );
  for (const person of [adminA!, adminB!])
    await org.addDutyRoleMember('admin', person.userId, {
      actorId: head!.userId,
    });
  for (const person of [financeA!, financeB!])
    await org.addDutyRoleMember('finance', person.userId, {
      actorId: head!.userId,
    });
  const snapshot = await directory.snapshot(),
    services = () => ({ directory: snapshot, connection: db.connection() });
  // This test isolates SDK voting semantics; inventory effects have separate real transaction coverage.
  const graph = assetRequestApproval({
    calendar: c.resolve(calendarServiceToken),
    submit: () => ({}),
    write: async () => {},
  });
  const runtime = new LifecycleRuntime({
    store: createRepositoryLifecycleStore(db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
  });
  runtime.register(graph, { services });
  const approvals = new ApprovalService(
    runtime,
    [graph.approval as unknown as Approval<never>],
    services,
  );
  async function action(
    id: string,
    actorId: string,
    name: string,
    data?: { appraisalOpinion: string },
  ) {
    const views = await approvals.runViewsFor(ASSET_REQUEST_LIFECYCLE, id),
      view = views.at(-1)!;
    const task = view.tasks.find(
      (t) => t.assigneeId === actorId && t.status === 'pending',
    )!;
    expect(task).toBeTruthy();
    return approvals.perform({
      actor: { id: actorId },
      target: { taskId: task.id },
      action: name,
      contentHash: view.run.contentHash,
      requestId: randomUUID(),
      comment: name === 'reject' ? 'Not suitable' : undefined,
      input: data ? { data } : undefined,
    });
  }
  async function record() {
    const id = randomUUID();
    await runtime.create(
      ASSET_REQUEST_LIFECYCLE,
      {
        id,
        applicantId: applicant!.userId,
        createdById: applicant!.userId,
        employeeId: applicant!.employeeId,
        departmentId: null,
        headApproverId: head!.userId,
        issuedById: null,
        number: null,
        operation: 'scrap',
        category: null,
        assetIds: ['actual-asset-proof'],
        quantity: 1,
        purpose: 'Disposal review',
        borrowDueDate: null,
        scrapReason: 'Broken',
        photos: [],
        allocation: null,
        originalValueCents: 1000,
        ruleSnapshot: null,
        needsGm: false,
        appraisalOpinion: null,
        handlingUnits: null,
        approvedFingerprint: null,
        exceptionReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { actor: { id: applicant!.userId } },
    );
    await runtime.fire(ASSET_REQUEST_LIFECYCLE, id, 'submit', {
      manual: true,
      actor: { id: applicant!.userId },
      expect: {
        version: Number(
          (await db.repository('assetRequests').findOne({ filter: { id } }))!
            .lifecycleVersion,
        ),
      },
      requestId: randomUUID(),
    });
    await action(id, head!.userId, 'approve');
    return id;
  }
  const id = await record();
  expect(
    (await approvals.runViewsFor(ASSET_REQUEST_LIFECYCLE, id)).at(-1)!.tasks,
  ).toHaveLength(2);
  await action(id, adminA!.userId, 'reject');
  expect(
    (await db.repository('assetRequests').findOne({ filter: { id } }))!.status,
  ).toBe('appraisal');
  await action(id, adminB!.userId, 'approve', {
    appraisalOpinion: 'Irreparable damage confirmed',
  });
  expect(
    (await db.repository('assetRequests').findOne({ filter: { id } }))!.status,
  ).toBe('finance');
  await action(id, financeA!.userId, 'reject');
  expect(
    (await db.repository('assetRequests').findOne({ filter: { id } }))!.status,
  ).toBe('finance');
  await action(id, financeB!.userId, 'approve');
  expect(
    (await db.repository('assetRequests').findOne({ filter: { id } }))!.status,
  ).toBe('scrapped');
  const rejected = await record();
  await action(rejected, adminA!.userId, 'reject');
  await action(rejected, adminB!.userId, 'reject');
  expect(
    (await db
      .repository('assetRequests')
      .findOne({ filter: { id: rejected } }))!.status,
  ).toBe('rejected');
});

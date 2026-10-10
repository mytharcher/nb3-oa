// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  leaveServiceToken,
  type LeaveInput,
  type LeaveService,
} from '../../../server/providers/leave/index.ts';

let app: OrgTestApp;
let service: LeaveService;
const people: Record<string, string> = {};
function form(startDate: string, endDate: string): LeaveInput {
  return {
    leaveType: 'personal',
    startDate,
    endDate,
    startHalf: 'am',
    endHalf: 'pm',
    reason: 'Approval routing verification',
    attachments: [],
    handoverUserId: null,
    enableDelegation: false,
  };
}
async function approve(id: string, actorId: string, expectedStage: string) {
  const detail = await service.detail(id, actorId);
  expect(detail.record.status).toBe(expectedStage);
  const offered = detail.taskActions.find((a) =>
    a.actions.some((action) => action.name === 'approve'),
  );
  expect(offered).toBeDefined();
  const run = detail.runs.find((r) => r.run.id === offered!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offered!.task.id },
      action: 'approve',
      contentHash: run.run.contentHash,
      requestId: `routing-${id}-${expectedStage}`,
    },
    actorId,
  );
}

describe('leave rule routing', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const container = app.testApp.application.container;
    service = container.resolve(leaveServiceToken);
    const db = container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    for (const name of ['applicant', 'manager', 'head', 'hr']) {
      people[name] = (await app.createUser(`Routing-${name}`)).user.id;
      await db.repository('employees').createOne({
        values: {
          id: `routing-${name}`,
          code: `ROUTING-${name.toUpperCase()}`,
          userId: people[name],
          name,
          managerId: name === 'applicant' ? 'routing-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: 'routing-department',
        title: 'Routing department',
        managerId: people.head,
        active: true,
      },
    });
    await db.repository('departmentMembers').createOne({
      values: {
        id: 'routing-membership',
        departmentId: 'routing-department',
        userId: people.applicant,
        primary: true,
        active: true,
      },
    });
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: 'routing-hr',
        dutyRoleCode: 'hr',
        userId: people.hr,
        active: true,
      },
    });
  }, 120000);
  afterAll(async () => app?.close());

  it('requires manager, department head and HR for seven or more work days', async () => {
    const draft = await service.create(
      form('2026-11-16', '2026-11-25'),
      people.applicant!,
    );
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      people.applicant!,
      Number(draft.record.lifecycleVersion),
      `submit-${id}`,
    );
    const submitted = await service.detail(id, people.applicant!);
    expect(Number(submitted.record.days)).toBeGreaterThanOrEqual(7);
    expect(submitted.record.ruleSnapshot).toBeTruthy();
    await approve(id, people.manager!, 'manager');
    await approve(id, people.head!, 'head');
    await approve(id, people.hr!, 'hr');
    const approved = await service.detail(id, people.applicant!);
    expect(approved.record.status).toBe('approved');
    const attendance = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('leaveAttendance')
      .findMany({ filter: { applicationId: id } });
    expect(attendance).toHaveLength(1);
  });

  it('does not ask the same manager to approve the department-head stage again', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('departments').updateMany({
      filter: { id: 'routing-department' },
      values: { managerId: people.manager },
    });
    const draft = await service.create(
      form('2026-12-07', '2026-12-09'),
      people.applicant!,
    );
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      people.applicant!,
      Number(draft.record.lifecycleVersion),
      `submit-${id}`,
    );
    await approve(id, people.manager!, 'manager');
    const detail = await service.detail(id, people.applicant!);
    expect(Number(detail.record.days)).toBe(3);
    expect(detail.record.status).toBe('approved');
    expect(
      detail.taskActions
        .flatMap((a) => a.actions)
        .some((a) => a.name === 'approve'),
    ).toBe(false);
  });
});

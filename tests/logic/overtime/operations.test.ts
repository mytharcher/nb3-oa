// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  overtimeServiceToken,
  type OvertimeInput,
  type OvertimeService,
} from '../../../server/providers/overtime/index.ts';

let app: OrgTestApp;
let service: OvertimeService;
const people: Record<string, string> = {};
function form(date: string): OvertimeInput {
  return {
    date,
    minutes: 120,
    settlement: 'compensatory',
    reason: 'Overtime operations verification',
  };
}
describe('overtime collaboration operations', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const container = app.testApp.application.container;
    service = container.resolve(overtimeServiceToken);
    const db = container.resolve(databaseManagerToken);
    const now = new Date().toISOString();
    for (const name of ['applicant', 'manager', 'head', 'hr', 'outsider']) {
      people[name] = (await app.createUser(`Routing-${name}`)).user.id;
      await db.repository('employees').createOne({
        values: {
          id: `overtime-ops-${name}`,
          code: `OVERTIME-OPS-${name.toUpperCase()}`,
          userId: people[name],
          name,
          managerId: name === 'applicant' ? 'overtime-ops-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: 'overtime-ops-department',
        title: 'Routing department',
        managerId: people.head,
        active: true,
      },
    });
    await db.repository('departmentMembers').createOne({
      values: {
        id: 'overtime-ops-membership',
        departmentId: 'overtime-ops-department',
        userId: people.applicant,
        primary: true,
        active: true,
      },
    });
    for (const person of ['manager', 'head'])
      await db.repository('departmentMembers').createOne({
        values: {
          id: `overtime-ops-member-${person}`,
          departmentId: 'overtime-ops-department',
          userId: people[person],
          primary: true,
          active: true,
        },
      });
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: 'overtime-ops-hr',
        dutyRoleCode: 'hr',
        userId: people.hr,
        active: true,
      },
    });
  }, 120000);
  afterAll(async () => app?.close());

  it('enforces recipient scope, preserves transfer evidence, signer depth and applicant reminder cooldown', async () => {
    const draft = await service.create(form('2027-03-01'), people.applicant!);
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      people.applicant!,
      Number(draft.record.lifecycleVersion),
      `submit-${id}`,
    );
    const directory = app.testApp.application.container.resolve(
      approvalDirectoryServiceToken,
    );
    for (const principal of ['manager', 'head'])
      await directory.createManualDelegation(
        {
          principalId: people[principal]!,
          delegateId: people.outsider!,
          scope: ['oa.overtime'],
          from: new Date(Date.now() - 60_000).toISOString(),
          to: new Date(Date.now() + 86400_000).toISOString(),
        },
        { actorId: people[principal]! },
      );
    let detail = await service.detail(id, people.manager!);
    const run = detail.runs.at(-1)!;
    const task = run.tasks.find(
      (task) => task.assigneeId === people.manager && task.status === 'pending',
    )!;
    const candidates = await service.candidates(
      id,
      task.id,
      'transfer',
      people.manager!,
      {},
    );
    expect(candidates.people.map((person) => person.id)).toContain(people.head);
    expect(candidates.people.map((person) => person.id)).not.toContain(
      people.outsider,
    );
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'transfer',
          input: { to: people.outsider! },
          comment: 'handover',
          requestId: `invalid-${id}`,
        },
        people.outsider!,
      ),
    ).rejects.toThrow();
    await service.action(
      id,
      {
        target: { runId: run.run.id },
        action: 'urge',
        requestId: `urge-${id}`,
      },
      people.applicant!,
    );
    await expect(
      service.action(
        id,
        {
          target: { runId: run.run.id },
          action: 'urge',
          requestId: `urge-again-${id}`,
        },
        people.applicant!,
      ),
    ).rejects.toThrow();
    await expect(
      service.action(
        id,
        {
          target: { runId: run.run.id },
          action: 'urge',
          requestId: `urge-other-${id}`,
        },
        people.manager!,
      ),
    ).rejects.toThrow();
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'transfer',
        input: { to: people.head! },
        comment: 'handover',
        requestId: `transfer-${id}`,
      },
      people.outsider!,
    );
    detail = await service.detail(id, people.head!);
    expect(
      detail.runs.at(-1)!.tasks.find((row) => row.id === task.id)?.status,
    ).toBe('transferred');
    const successor = detail.runs
      .at(-1)!
      .tasks.find(
        (row) => row.assigneeId === people.head && row.status === 'pending',
      )!;
    await service.action(
      id,
      {
        target: { taskId: successor.id },
        action: 'addSigner',
        input: { person: people.hr!, mode: 'before' },
        requestId: `signer-${id}`,
      },
      people.outsider!,
    );
    detail = await service.detail(id, people.hr!);
    const signer = detail.runs
      .at(-1)!
      .tasks.find(
        (row) => row.assigneeId === people.hr && row.status === 'pending',
      )!;
    expect(signer).toBeDefined();
    await expect(
      service.action(
        id,
        {
          target: { taskId: signer.id },
          action: 'addSigner',
          input: { person: people.outsider!, mode: 'alongside' },
          requestId: `depth-${id}`,
        },
        people.hr!,
      ),
    ).rejects.toThrow();
    expect(detail.record.status).toBe('manager');
  });
});

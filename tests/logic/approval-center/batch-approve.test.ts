import { probationServiceToken } from '../../../server/providers/probation/contract.js';
import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_SERVER,
  OA_TEST_ORIGIN,
  OA_TEST_DATABASE_ENV,
} from '../oa-test-origin.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { apiDocsToken } from '@nocobase/app-server/router';
import { createEmployee } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { json } from '../org/helpers.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'e'.repeat(64) }] },
    app: { publicOrigin: OA_TEST_ORIGIN },
  },
});
describe('current safe batch approvals through owner public API', () => {
  test('twenty independent outcomes enforce the write cap, preserve ordinary view and hashes, and replay without duplicate SDK history', async ({
    testApp,
    request,
  }) => {
    expect(
      (
        await request(
          '/approvalCenter/batchApproveOptions',
          json({ items: [{ kind: 'oa.leave', id: 'missing' }] }),
        )
      ).status,
    ).toBe(401);
    const manager = await createEmployee(testApp, 'Batch manager');
    const owner = await createEmployee(testApp, 'Batch applicant', {
      managerId: manager.employeeId,
    });
    const org = testApp.application.container.resolve(organizationServiceToken);
    const department = await org.createDepartment(
      { title: 'Batch department', managerId: manager.userId },
      { actorId: owner.userId },
    );
    await org.addMember(
      { departmentId: department.id, userId: owner.userId, primary: true },
      { actorId: owner.userId },
    );
    const service = testApp.application.container.resolve(leaveServiceToken);
    const ids: string[] = [];
    for (let day = 1; day <= 20; day++) {
      const date = new Date(Date.UTC(2027, 1, 1 + (day - 1) * 7))
        .toISOString()
        .slice(0, 10);
      const created = await service.create(
        {
          leaveType: 'personal',
          startDate: date,
          endDate: date,
          startHalf: 'am',
          endHalf: 'pm',
          reason: 'Synthetic batch fixture',
          attachments: [],
          handoverUserId: null,
          enableDelegation: false,
        },
        owner.userId,
      );
      const id = String(created.record.id);
      ids.push(id);
      await service.transition(
        id,
        'submit',
        owner.userId,
        Number(created.record.lifecycleVersion),
        randomUUID(),
      );
    }
    const session = await manager.session();
    const options = await session.fetch(
      '/approvalCenter/batchApproveOptions',
      json({ items: ids.map((id) => ({ kind: 'oa.leave', id })) }),
    );
    expect(options.status).toBe(200);
    const candidates = (await options.json()).data;
    expect(candidates).toHaveLength(20);
    expect(Object.keys(candidates[0]).sort()).toEqual([
      'contentHash',
      'id',
      'kind',
      'taskId',
    ]);
    const items = candidates.map((item: Record<string, string>) => ({
      ...item,
      requestId: randomUUID(),
    }));
    // Writes are capped at 20; option discovery separately supports a 100-row page.
    const overLimit = await session.fetch(
      '/approvalCenter/batchApprove',
      json({
        items: [
          ...items,
          { ...items[0], id: 'twenty-first', requestId: randomUUID() },
        ],
      }),
    );
    expect(overLimit.status).toBe(400);
    const optionsOverLimit = await session.fetch(
      '/approvalCenter/batchApproveOptions',
      json({
        items: Array.from({ length: 101 }, (_, index) => ({
          kind: 'oa.leave',
          id: `missing-${index}`,
        })),
      }),
    );
    expect(optionsOverLimit.status).toBe(400);
    const stale = { ...items[1], contentHash: 'stale-content' };
    const response = await session.fetch(
      '/approvalCenter/batchApprove',
      json({
        items: items.map((item: Record<string, string>, index: number) =>
          index === 1 ? stale : item,
        ),
      }),
    );
    expect(response.status).toBe(200);
    expect(
      (await response.json()).data.map((v: { status: string }) => v.status),
    ).toEqual(
      Array.from({ length: 20 }, (_, index) =>
        index === 1 ? 'unavailable' : 'approved',
      ),
    );
    const fullReplay = await session.fetch(
      '/approvalCenter/batchApprove',
      json({
        items: items.map((item: Record<string, string>, index: number) =>
          index === 1 ? stale : item,
        ),
      }),
    );
    expect(
      (await fullReplay.json()).data.map((v: { status: string }) => v.status),
    ).toEqual(Array.from({ length: 20 }, () => 'unavailable'));
    for (let index = 0; index < ids.length; index++) {
      if (index === 1) continue;
      const history = (
        await service.detail(ids[index], manager.userId)
      ).runs.flatMap((run) => run.tasks);
      expect(
        history.filter((task) => task.requestId === items[index].requestId),
      ).toHaveLength(1);
    }
    const detail = await service.detail(ids[0], manager.userId);
    expect(
      detail.runs
        .flatMap((v) => v.tasks)
        .some(
          (v) =>
            v.id === items[0].taskId &&
            v.answer === 'approve' &&
            v.actorId === manager.userId &&
            v.requestId === items[0].requestId,
        ),
    ).toBe(true);
    expect(
      (
        await session.fetch(
          '/approvalCenter/batchApprove',
          json({ items: [items[0], items[0]] }),
        )
      ).status,
    ).toBe(400);
    const crossTarget = await session.fetch(
      '/approvalCenter/batchApprove',
      json({ items: [{ ...items[1], taskId: items[0].taskId }] }),
    );
    expect(crossTarget.status).toBe(200);
    expect((await crossTarget.json()).data[0].status).toBe('unavailable');
    expect(
      (await service.detail(ids[1], manager.userId)).runs
        .flatMap((v) => v.tasks)
        .find((v) => v.id === items[1].taskId)?.answer,
    ).toBeNull();
    const replay = await session.fetch(
      '/approvalCenter/batchApprove',
      json({ items: [items[0]] }),
    );
    expect((await replay.json()).data[0].status).toBe('unavailable');
    expect(
      (await service.detail(ids[0], manager.userId)).runs
        .flatMap((v) => v.tasks)
        .filter((v) => v.requestId === items[0].requestId),
    ).toHaveLength(1);
    expect(
      (
        await session.fetch(
          '/approvalCenter/batchApprove',
          json({
            items: [items[0], { ...items[1], requestId: items[0].requestId }],
          }),
        )
      ).status,
    ).toBe(400);
    const authz = testApp.application.container.resolve(authorizationToken);
    const set = await authz.permissionSets.get('oa-leave-employee');
    try {
      await authz.permissionSets.update(set!.key, { ...set!, grants: [] });
      expect(
        (
          await (
            await session.fetch(
              '/approvalCenter/batchApproveOptions',
              json({ items: [{ kind: 'oa.leave', id: ids[1] }] }),
            )
          ).json()
        ).data,
      ).toEqual([]);
      const denied = await session.fetch(
        '/approvalCenter/batchApprove',
        json({ items: [items[1]] }),
      );
      expect((await denied.json()).data[0].status).toBe('unavailable');
    } finally {
      await authz.permissionSets.update(set!.key, set!);
    }
    const unsupported = await session.fetch(
      '/approvalCenter/batchApproveOptions',
      json({ items: [{ kind: 'oa.workItem', id: 'opaque' }] }),
    );
    expect((await unsupported.json()).data).toEqual([]);
    // A genuine manager approval requiring evaluation/conclusion is never batch eligible.
    await org.addDutyRoleMember('hr', manager.userId, {
      actorId: manager.userId,
    });
    const probationOwner = await createEmployee(
      testApp,
      'Batch probation applicant',
      {
        managerId: manager.employeeId,
        status: 'probation',
        probationEndDate: '2027-06-01',
      },
    );
    await org.addMember(
      {
        departmentId: department.id,
        userId: probationOwner.userId,
        primary: true,
      },
      { actorId: manager.userId },
    );
    const probation = testApp.application.container.resolve(
      probationServiceToken,
    );
    const probationDraft = await probation.create(
      {
        employeeId: probationOwner.employeeId,
        selfEvaluation: 'Synthetic probation evaluation',
      },
      manager.userId,
      probationOwner.userId,
    );
    const probationId = String(probationDraft.record.id);
    await probation.transition(
      probationId,
      'submit',
      probationOwner.userId,
      Number(probationDraft.record.lifecycleVersion),
      randomUUID(),
    );
    const probationDetail = await probation.detail(probationId, manager.userId);
    expect(
      probationDetail.taskActions.some((v) =>
        v.actions.some((a) => a.name === 'approve'),
      ),
    ).toBe(true);
    const required = await session.fetch(
      '/approvalCenter/batchApproveOptions',
      json({ items: [{ kind: 'oa.probation', id: probationId }] }),
    );
    expect((await required.json()).data).toEqual([]);
    const docs = await testApp.application.container
      .resolve(apiDocsToken)
      .getDocument();
    expect(
      docs.paths?.['/api/approvalCenter/batchApprove']?.post?.operationId,
    ).toBe('approvalCenterBatchApprove');
  }, 600000);
});

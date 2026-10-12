// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  outingServiceToken,
  type OutingService,
  type OutingInput,
} from '../../../server/providers/outings/index.ts';
let app: OrgTestApp;
let service: OutingService;
let applicant: string;
let manager: string;
async function submitted(input: OutingInput) {
  const draft = await service.create(input, applicant);
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    applicant,
    Number(draft.record.lifecycleVersion),
    `submit-${id}`,
  );
  const detail = await service.detail(id, manager);
  const task = detail.taskActions.find((row) =>
    row.actions.some((action) => action.name === 'approve'),
  )!.task;
  await service.action(
    id,
    {
      target: { taskId: task.id },
      action: 'approve',
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: `approve-${id}`,
    },
    manager,
  );
  return id;
}
describe('outing approval and attendance facts', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    service = c.resolve(outingServiceToken);
    manager = (await app.createUser('OutingManager')).user.id;
    applicant = (await app.createUser('OutingApplicant')).user.id;
    const db = c.resolve(databaseManagerToken),
      now = new Date().toISOString();
    for (const [id, userId, managerId] of [
      ['outing-manager', manager, null],
      ['outing-applicant', applicant, 'outing-manager'],
    ])
      await db
        .repository('employees')
        .createOne({
          values: {
            id,
            userId,
            managerId,
            code: id,
            name: id,
            status: 'regular',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        });
  }, 120000);
  afterAll(async () => app?.close());
  it('permits a pre-start withdrawal and deactivates its approved attendance period', async () => {
    const id = await submitted({
      startAt: new Date(Date.now() + 3600_000).toISOString(),
      endAt: new Date(Date.now() + 7200_000).toISOString(),
      location: 'Customer office',
      reason: 'Meet client',
    });
    const detail = await service.detail(id, applicant);
    expect(detail.record.status).toBe('approved');
    await service.transition(
      id,
      'withdraw',
      applicant,
      Number(detail.record.lifecycleVersion),
      `withdraw-${id}`,
    );
    const fact = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('attendanceActivities')
      .findOne({ filter: { applicationId: id } });
    expect(fact).toMatchObject({
      status: 'withdrawn',
      active: false,
      actualEndAt: null,
    });
  });
  it('blocks withdrawal after start and only a supervisor can terminate while preserving the elapsed period', async () => {
    const input = {
      startAt: new Date(Date.now() - 3600_000).toISOString(),
      endAt: new Date(Date.now() + 3600_000).toISOString(),
      location: 'Partner office',
      reason: 'Service visit',
    };
    const id = await submitted(input);
    let detail = await service.detail(id, applicant);
    await expect(
      service.transition(
        id,
        'withdraw',
        applicant,
        Number(detail.record.lifecycleVersion),
        `late-withdraw-${id}`,
      ),
    ).rejects.toThrow();
    await expect(
      service.transition(
        id,
        'terminate',
        applicant,
        Number(detail.record.lifecycleVersion),
        `own-terminate-${id}`,
        { reason: 'Stop' },
      ),
    ).rejects.toThrow();
    await expect(
      service.transition(
        id,
        'terminate',
        manager,
        Number(detail.record.lifecycleVersion),
        `blank-terminate-${id}`,
        { reason: ' ' },
      ),
    ).rejects.toThrow();
    await service.transition(
      id,
      'terminate',
      manager,
      Number(detail.record.lifecycleVersion),
      `terminate-${id}`,
      { reason: 'Meeting ended early' },
    );
    detail = await service.detail(id, manager);
    expect(detail.record.status).toBe('terminated');
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const fact = await db
      .repository('attendanceActivities')
      .findOne({ filter: { applicationId: id } });
    expect(fact).toMatchObject({
      status: 'terminated',
      active: true,
      startAt: input.startAt,
      endAt: input.endAt,
    });
    expect(Date.parse(String(fact!.actualEndAt))).toBeGreaterThan(
      Date.parse(input.startAt),
    );
    expect(Date.parse(String(fact!.actualEndAt))).toBeLessThan(
      Date.parse(input.endAt),
    );
    const audit = await db
      .repository('auditLogs')
      .findMany({ filter: { targetId: id } });
    expect(audit.some((row) => row.action === 'outing.terminate')).toBe(true);
  });
});

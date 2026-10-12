// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  supplyServiceToken,
  type SupplyService,
} from '../../../server/providers/supplies/index.ts';
let adminActor: string;
let ownerSession: TestSession,
  handlerSession: TestSession,
  adminSession: TestSession;
let app: OrgTestApp,
  service: SupplyService,
  applicant: string,
  manager: string,
  handler: string,
  otherHandler: string;
const input = {
  items: [{ code: 'stationery', quantity: 3 }],
  purpose: 'New starter desk',
};
async function current(id: string, actor = applicant) {
  return service.detail(id, actor);
}
async function action(
  id: string,
  actor: string,
  name: string,
  comment?: string,
) {
  const detail = await current(id, actor);
  const task = detail.taskActions.find((row) =>
    row.actions.some((a) => a.name === name),
  )?.task;
  return service.action(
    id,
    {
      target: task
        ? { taskId: task.id }
        : { runId: detail.runs.at(-1)!.run.id },
      action: name,
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: `${name}-${id}-${crypto.randomUUID()}`,
      comment,
    },
    actor,
  );
}
async function submitted() {
  const draft = await service.create(input, applicant),
    id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    applicant,
    Number(draft.record.lifecycleVersion),
    `submit-${id}`,
  );
  await action(id, manager, 'approve');
  return id;
}
describe('supplies administrative handling and issuance ledger', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    service = c.resolve(supplyServiceToken);
    adminSession = await app.admin();
    adminActor = adminSession.user.id;
    manager = (await app.createUser('SupplyManager')).user.id;
    ownerSession = await app.createUser('SupplyApplicant');
    applicant = ownerSession.user.id;
    handlerSession = await app.createUser('SupplyHandler');
    handler = handlerSession.user.id;
    otherHandler = (await app.createUser('SupplyOtherHandler')).user.id;
    const db = c.resolve(databaseManagerToken),
      now = new Date().toISOString();
    for (const [id, userId, managerId] of [
      ['supply-manager', manager, null],
      ['supply-applicant', applicant, 'supply-manager'],
      ['supply-handler', handler, null],
      ['supply-other-handler', otherHandler, null],
    ])
      await db.repository('employees').createOne({
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
    for (const userId of [handler, otherHandler])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `admin-${userId}`,
          dutyRoleCode: 'admin',
          userId,
          active: true,
        },
      });
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: `approval-admin-${handler}`,
        dutyRoleCode: 'approval.admin',
        userId: handler,
        active: true,
      },
    });
  }, 120000);
  afterAll(async () => app?.close());
  it('requires administrative claim, prevents applicant withdrawal during execution, issues exactly once', async () => {
    const id = await submitted();
    let detail = await current(id);
    expect(detail.record.status).toBe('issuing');
    expect(detail.record.approvedAt).toBeTruthy();
    await expect(
      service.transition(
        id,
        'withdraw',
        applicant,
        Number(detail.record.lifecycleVersion),
        `withdraw-${id}`,
      ),
    ).rejects.toThrow();
    await expect(action(id, handler, 'complete')).rejects.toThrow();
    const claims = await Promise.allSettled([
      action(id, handler, 'claim'),
      action(id, otherHandler, 'claim'),
    ]);
    expect(claims.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
    const winner = claims[0]!.status === 'fulfilled' ? handler : otherHandler;
    await action(id, winner, 'complete');
    detail = await current(id);
    expect(detail.record.status).toBe('issued');
    const rows = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('supplyIssueLedger')
      .findMany({ filter: { applicationId: id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      recipientName: 'SupplyApplicant',
      itemLabel: { 'zh-CN': '办公用品', 'en-US': 'Office supplies' },
      requestedQuantity: 3,
      actualQuantity: 3,
      outcome: 'issued',
      issuerId: winner,
    });
    await expect(action(id, winner, 'complete')).rejects.toThrow();
  });
  it('retains the approved fact on unavailable, resumes unchanged content, and requires manager approval for changed quantity', async () => {
    const id = await submitted();
    await action(id, handler, 'claim');
    await expect(action(id, handler, 'unable')).rejects.toThrow();
    await action(id, handler, 'unable', 'No stock');
    let detail = await current(id);
    const approvalAt = detail.record.approvedAt;
    expect(detail.record.status).toBe('exception');
    const dictionary = app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('dictionaries');
    await dictionary.updateMany({
      filter: { type: 'officeItem', code: 'stationery' },
      values: { active: false },
    });
    await service.transition(
      id,
      'submit',
      applicant,
      Number(detail.record.lifecycleVersion),
      `retry-${id}`,
    );
    detail = await current(id);
    expect(detail.record.status).toBe('issuing');
    expect(detail.record.approvedAt).toBe(approvalAt);
    expect(detail.record.itemSnapshot?.stationery).toMatchObject({
      active: true,
      extra: { requiresPrintInfo: false },
    });
    await dictionary.updateMany({
      filter: { type: 'officeItem', code: 'stationery' },
      values: { active: true },
    });
    await action(id, handler, 'claim');
    await action(id, handler, 'unable', 'Still no stock');
    detail = await current(id);
    await service.transition(
      id,
      'edit',
      applicant,
      Number(detail.record.lifecycleVersion),
      `edit-${id}`,
      { items: [{ code: 'stationery', quantity: 4 }], purpose: input.purpose },
    );
    detail = await current(id);
    await service.transition(
      id,
      'submit',
      applicant,
      Number(detail.record.lifecycleVersion),
      `resubmit-${id}`,
    );
    expect((await current(id)).record.status).toBe('manager');
  });
  it('forced closure requires a reason and explicitly records unknown actual issuance rather than a delivery', async () => {
    const id = await submitted();
    await expect(
      action(id, handler, 'forceComplete', 'No stock'),
    ).rejects.toThrow();
    await expect(action(id, adminActor, 'forceComplete')).rejects.toThrow();
    await action(
      id,
      adminActor,
      'forceComplete',
      'Issue not confirmed; close by administrative decision',
    );
    expect((await current(id)).record.status).toBe('forcedClosed');
    const row = await app.testApp.application.container
      .resolve(databaseManagerToken)
      .repository('supplyIssueLedger')
      .findOne({ filter: { applicationId: id } });
    expect(row).toMatchObject({
      actualQuantity: null,
      outcome: 'forcedClosed',
      reason: 'Issue not confirmed; close by administrative decision',
    });
  });
  it('protects the issuance ledger independently and returns resolved users', async () => {
    expect((await app.testApp.request('/supplyRequests/ledger')).status).toBe(
      401,
    );
    expect((await ownerSession.fetch('/supplyRequests/ledger')).status).toBe(
      403,
    );
    const response = await handlerSession.fetch(
      '/supplyRequests/ledger?page=1&pageSize=1&sortBy=number&direction=asc',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: {
        items: Array<{
          recipient: { id: string; name: string };
          issuer: { id: string; name: string };
        }>;
        nextOffset: number | null;
      };
      meta: { total: number; page: number; pageSize: number };
    };
    expect(body.meta).toEqual({ total: 2, page: 1, pageSize: 1 });
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]!.recipient.name).toBeTruthy();
    expect(body.data.nextOffset).toBe(1);
    expect((await ownerSession.fetch('/supplyRequests')).status).toBe(200);
    expect((await adminSession.fetch('/supplyRequests/ledger')).status).toBe(
      200,
    );
  });
  it('requires complete name card printing information on submission', async () => {
    const draft = await service.create(
      {
        items: [{ code: 'businessCards', quantity: 100 }],
        purpose: 'Customer visits',
      },
      applicant,
    );
    await expect(
      service.transition(
        String(draft.record.id),
        'submit',
        applicant,
        Number(draft.record.lifecycleVersion),
        'missing-print-info',
      ),
    ).rejects.toThrow('print information');
  });
});

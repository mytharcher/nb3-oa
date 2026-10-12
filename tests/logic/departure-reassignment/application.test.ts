// @vitest-environment node
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  authorizedViewPolicy,
  resolveReassignmentOwners,
  REASSIGNMENT_LIFECYCLES,
} from '../../../server/providers/departure-reassignment/owners.js';
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  createGeneralRequestService,
  GENERAL_LIFECYCLE,
  type GeneralRequestService,
} from '../../../server/providers/general-requests/service.js';
import {
  createDepartureReassignment,
  taskRequestId,
} from '../../../server/providers/departure-reassignment/service.js';
import { createReassignmentJournal } from '../../../server/providers/departure-reassignment/journal.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.js';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
let app: OrgTestApp;
let general: GeneralRequestService;
const ids: Record<string, string> = {};
function owner(action: GeneralRequestService['action'] = general.action) {
  return {
    lifecycle: GENERAL_LIFECYCLE,
    approvals: general.approvals,
    action: async (
      id: string,
      input: Parameters<GeneralRequestService['action']>[1],
      actor: string,
    ) =>
      action(
        id,
        input,
        actor,
        await authorizedViewPolicy(
          app.testApp.application.container.resolve(authorizationToken),
          actor,
          GENERAL_LIFECYCLE,
          'generalRequests',
        ),
      ),
  };
}
function adapter(action?: GeneralRequestService['action']) {
  const c = app.testApp.application.container;
  return createDepartureReassignment({
    directory: c.resolve(approvalDirectoryServiceToken),
    journal: createReassignmentJournal(
      c.resolve(databaseManagerToken),
      c.resolve(auditServiceToken),
    ),
    owners: () => [owner(action)],
  });
}
async function submit() {
  const draft = await general.create(
    {
      title: 'Handover test',
      body: 'Existing pending work',
      attachments: [],
      extraApproverIds: [ids.extra1, ids.extra2, ids.extra3],
    },
    ids.applicant,
  );
  await general.transition(
    String(draft.record.id),
    'submit',
    ids.applicant,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  return String(draft.record.id);
}
function command(key = randomUUID()) {
  return {
    from: ids.from,
    to: ids.to,
    reason: 'Departure handover',
    requestKey: `departure:${key}:reassign`,
  };
}
describe('departure public task migration on the real application database', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    for (const name of [
      'applicant',
      'from',
      'to',
      'admin',
      'extra1',
      'extra2',
      'extra3',
    ]) {
      ids[name] =
        name === 'admin'
          ? (await app.admin()).user.id
          : (await app.createUser(`reassignment-${name}`)).user.id;
      await db.repository('employees').createOne({
        values: {
          id: `reassignment-${name}`,
          code: `REASSIGN-${name}`,
          name,
          userId: ids[name],
          managerId: name === 'applicant' ? 'reassignment-from' : null,
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    general = createGeneralRequestService({
      db,
      org: c.resolve(orgServiceToken),
      audit: c.resolve(auditServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      employees: c.resolve(employeeServiceToken),
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      notifications: { task: vi.fn(), result: vi.fn(), alarm: vi.fn() },
    });
  }, 120000);
  afterAll(async () => app?.close());
  it('resolves all registered public business owners without a departure dependency cycle', () => {
    const owners = resolveReassignmentOwners(app.testApp.application);
    expect(owners.map((owner) => owner.lifecycle)).toEqual([
      ...REASSIGNMENT_LIFECYCLES,
    ]);
    expect(
      owners.every(
        (owner) =>
          typeof owner.approvals.tasksOf === 'function' &&
          typeof owner.action === 'function',
      ),
    ).toBe(true);
  });
  it('moves actual pending SDK tasks with a recorded administrator, durable key and exact public receipt', async () => {
    const id = await submit();
    const before = (await general.approvals.tasksOf(ids.from)).find(
      (t) => t.recordId === id,
    )!;
    const input = command();
    expect(await adapter().reassign(input)).toEqual({ remaining: 0 });
    const actions = await general.approvals.actionsOf(GENERAL_LIFECYCLE, id);
    expect(
      actions.find(
        (a) => a.requestId === taskRequestId(input.requestKey, before.id),
      ),
    ).toMatchObject({
      name: 'reassign',
      taskId: before.id,
      actorId: ids.admin,
      input: { to: ids.to, override: false },
      comment: input.reason,
    });
    expect(await adapter().reassign(input)).toEqual({ remaining: 0 });
    expect(
      (await general.approvals.actionsOf(GENERAL_LIFECYCLE, id)).filter(
        (a) => a.name === 'reassign',
      ),
    ).toHaveLength(1);
    await expect(
      adapter().reassign({ ...input, to: ids.extra1 }),
    ).rejects.toMatchObject({ code: 'REASSIGNMENT_REQUEST_REUSED' });
  });
  it('keeps real partial commits and retries only the still-assigned task without duplicating the first receipt', async () => {
    const first = await submit(),
      second = await submit();
    let refuse = true;
    const action: GeneralRequestService['action'] = async (
      id,
      input,
      actor,
      policy,
    ) => {
      if (id === second && refuse) throw new Error('Transient domain refusal');
      return general.action(id, input, actor, policy);
    };
    const input = command();
    expect(await adapter(action).reassign(input)).toEqual({ remaining: 1 });
    expect(
      (await general.approvals.actionsOf(GENERAL_LIFECYCLE, first)).filter(
        (a) => a.name === 'reassign',
      ),
    ).toHaveLength(1);
    refuse = false;
    expect(await adapter(action).reassign(input)).toEqual({ remaining: 0 });
    for (const id of [first, second])
      expect(
        (await general.approvals.actionsOf(GENERAL_LIFECYCLE, id)).filter(
          (a) => a.name === 'reassign',
        ),
      ).toHaveLength(1);
  });
  it('rejects an inactive successor before migrating any pending task', async () => {
    const id = await submit();
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('employees').updateOne({
      filter: { id: 'reassignment-to' },
      values: { active: false },
    });
    await expect(adapter().reassign(command())).rejects.toMatchObject({
      code: 'REASSIGNMENT_RECIPIENT_INACTIVE',
    });
    expect(
      (await general.approvals.tasksOf(ids.from)).some(
        (t) => t.recordId === id,
      ),
    ).toBe(true);
    await db.repository('employees').updateOne({
      filter: { id: 'reassignment-to' },
      values: { active: true },
    });
    await adapter().reassign(command());
  });
  it('reserves one immutable payload before concurrent different recipients can perform any SDK migration', async () => {
    const id = await submit();
    const input = command();
    const results = await Promise.allSettled([
      adapter().reassign(input),
      adapter().reassign({ ...input, to: ids.extra1 }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({
      status: 'rejected',
      reason: { code: 'REASSIGNMENT_REQUEST_REUSED' },
    });
    const actions = (
      await general.approvals.actionsOf(GENERAL_LIFECYCLE, id)
    ).filter((a) => a.name === 'reassign');
    expect(actions).toHaveLength(1);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const reserved = await db
      .repository('departureReassignmentCommands')
      .findOne({ filter: { requestKey: input.requestKey } });
    expect(actions[0].input.to).toBe(reserved!.toId);
  });
});

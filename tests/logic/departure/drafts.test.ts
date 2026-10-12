// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  createDepartureService,
  type DepartureDependencies,
} from '../../../server/providers/departure/service.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
let app: OrgTestApp;
let service: ReturnType<typeof createDepartureService>;
let dependencies: DepartureDependencies;
const ids: Record<string, string> = {};
let count = 0;
async function person() {
  const session = await app.createUser(`departure-person-${++count}`);
  const id = randomUUID();
  await dependencies.db.repository('employees').createOne({
    values: {
      id,
      code: id,
      name: 'Departing employee',
      userId: session.user.id,
      status: 'probation',
      active: true,
      probationEndDate: '2026-11-01',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return { employeeId: id, applicantId: session.user.id };
}
async function source() {
  const identity = await person();
  const sourceProbationId = randomUUID();
  await dependencies.db.repository('probationRequests').createOne({
    values: {
      id: sourceProbationId,
      ...identity,
      createdById: ids.hr,
      selfEvaluation: 'Completed probation',
      probationEndDate: '2026-11-01',
      conclusion: 'declined',
      hrActorId: ids.hr,
      status: 'gm',
      statusChangedAt: new Date(),
      lifecycleVersion: 3,
      createdAt: new Date(),
    },
  });
  return {
    ...identity,
    sourceProbationId,
    delegatedById: ids.hr,
    requestKey: `probation:${sourceProbationId}:departure`,
  };
}
describe('departure draft actual application boundaries', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    dependencies = {
      db: c.resolve(databaseManagerToken),
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      org: c.resolve(orgServiceToken),
      employees: c.resolve(employeeServiceToken),
      audit: c.resolve(auditServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
      users: c.resolve(userAdministrationServiceToken),
    };
    for (const role of ['hr', 'outsider'])
      ids[role] = (await app.createUser(`departure-${role}`)).user.id;
    await dependencies.db.repository('dutyRoleMembers').createOne({
      values: {
        id: randomUUID(),
        dutyRoleCode: 'hr',
        userId: ids.hr,
        active: true,
      },
    });
    service = createDepartureService(dependencies);
  }, 120000);
  afterAll(async () => app?.close());
  it('creates a real linked unsubmitted draft and idempotently reuses it inside caller transaction', async () => {
    const input = await source();
    const pair = await dependencies.db.connection().transaction(async (tx) => {
      const first = await service.adapter.createDeclinedProbationDraft(
        input,
        tx,
      );
      const second = await service.adapter.createDeclinedProbationDraft(
        input,
        tx,
      );
      return [first, second];
    });
    expect(pair[0]).toEqual(pair[1]);
    const detail = await service.detail(pair[0].id, input.applicantId);
    expect(detail.record).toMatchObject({
      employeeId: input.employeeId,
      applicantId: input.applicantId,
      createdById: ids.hr,
      sourceProbationId: input.sourceProbationId,
      sourceKey: input.requestKey,
      departureType: 'declinedProbation',
      status: 'draft',
      expectedLastWorkingDay: null,
      handoverUserId: null,
    });
    expect(detail.readyForSubmission).toBe(false);
    expect(
      (await dependencies.employees.getById(input.employeeId))?.status,
    ).toBe('probation');
  });
  it('rolls back draft, lifecycle logs and audit if the caller fails after linkage', async () => {
    const input = await source();
    let linkedId = '';
    await expect(
      dependencies.db.connection().transaction(async (tx) => {
        linkedId = (
          await service.adapter.createDeclinedProbationDraft(input, tx)
        ).id;
        throw new Error('caller failed');
      }),
    ).rejects.toThrow('caller failed');
    expect(
      await dependencies.db
        .repository('departureRequests')
        .findMany({ filter: { sourceProbationId: input.sourceProbationId } }),
    ).toHaveLength(0);
    expect(
      await dependencies.db.repository('auditLogs').findMany({
        filter: { targetType: 'departureRequests', targetId: linkedId },
      }),
    ).toHaveLength(0);
    expect(
      await dependencies.db
        .repository('oaLifecycleTransitions')
        .findMany({ filter: { recordId: linkedId } }),
    ).toHaveLength(0);
  });
  it('refuses forged employee, applicant, HR and request-key bindings without writing', async () => {
    const input = await source();
    for (const change of [
      { employeeId: randomUUID() },
      { applicantId: ids.outsider },
      { delegatedById: ids.outsider },
      { requestKey: 'arbitrary' },
    ]) {
      await expect(
        dependencies.db
          .connection()
          .transaction((tx) =>
            service.adapter.createDeclinedProbationDraft(
              { ...input, ...change },
              tx,
            ),
          ),
      ).rejects.toMatchObject({ name: 'DepartureError' });
    }
    expect(
      await dependencies.db
        .repository('departureRequests')
        .findMany({ filter: { sourceProbationId: input.sourceProbationId } }),
    ).toHaveLength(0);
  });
  it('allows self resignation and exact HR proxy, refuses outsiders and no submitted phase', async () => {
    const first = await person();
    const result = await service.create(
      { departureType: 'resignation', reason: 'Career change' },
      first.applicantId,
    );
    expect(result.record).toMatchObject({ ...first, status: 'draft' });
    await expect(
      service.transition(
        String(result.record.id),
        'submit',
        first.applicantId,
        Number(result.record.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow();
    const second = await person();
    await expect(
      service.create(
        {
          employeeId: second.employeeId,
          departureType: 'dismissal',
          reason: 'HR decision',
        },
        ids.outsider,
      ),
    ).rejects.toMatchObject({ code: 'DEPARTURE_DELEGATE_FORBIDDEN' });
    expect(
      (
        await service.create(
          {
            employeeId: second.employeeId,
            departureType: 'dismissal',
            reason: 'HR decision',
          },
          ids.hr,
        )
      ).record.applicantId,
    ).toBe(second.applicantId);
  });
  it('does not bypass an ordinary record policy for the employee or HR', async () => {
    const input = await source();
    const result = await dependencies.db
      .connection()
      .transaction((tx) =>
        service.adapter.createDeclinedProbationDraft(input, tx),
      );
    const policy = {
      create: false,
      update: false,
      delete: false,
      read: { scope: { id: 'outside' }, fields: ['id'] },
    };
    for (const actor of [input.applicantId, ids.hr])
      await expect(
        service.detail(result.id, actor, policy),
      ).rejects.toMatchObject({ kind: 'permission' });
  });
});

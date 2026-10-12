// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  createGeneralRequestService,
  GENERAL_LIFECYCLE,
  type GeneralRequestService,
  type GeneralRequestInput,
} from '../../../server/providers/general-requests/service.js';
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
let service: GeneralRequestService;
const ids: Record<string, string> = {};
function form(
  approvers = [ids.first, ids.second, ids.third],
): GeneralRequestInput {
  return {
    title: 'Exceptional request',
    body: 'A matter without another policy',
    attachments: [],
    extraApproverIds: approvers,
  };
}
async function submit(input = form()) {
  const draft = await service.create(input, ids.applicant);
  const result = await service.transition(
    String(draft.record.id),
    'submit',
    ids.applicant,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  return String(result.record.id);
}
async function act(id: string, actorId: string, action = 'approve') {
  const detail = await service.detail(id, actorId);
  const offered = detail.taskActions.find((v) =>
    v.actions.some((a) => a.name === action),
  );
  expect(offered).toBeDefined();
  const run = detail.runs.find((r) => r.run.id === offered!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offered!.task.id },
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(action === 'return'
        ? { input: { to: 'revision' }, comment: 'Clarify the proposed matter' }
        : action === 'reject'
          ? { comment: 'Not accepted' }
          : {}),
    },
    actorId,
  );
}
describe('general requests lifecycle on the application database', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);
    service = createGeneralRequestService({
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
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'manager',
      'first',
      'second',
      'third',
      'stranger',
    ]) {
      ids[name] = (await app.createUser(`General-${name}`)).user.id;
      await db
        .repository('employees')
        .createOne({
          values: {
            id: `general-${name}`,
            code: `GEN-${name}`,
            name,
            userId: ids[name],
            managerId: name === 'applicant' ? 'general-manager' : null,
            status: 'regular',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        });
    }
  }, 120000);
  afterAll(async () => app?.close());
  it('requires the manager and exactly the requested order of three extra approvers', async () => {
    const id = await submit();
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'manager',
    );
    await act(id, ids.manager);
    const baseline = await service.detail(id, ids.first);
    expect(baseline.record.status).toBe('extra');
    expect(
      (await service.detail(id, ids.second)).taskActions.some((t) =>
        t.actions.some((a) => a.name === 'approve'),
      ),
    ).toBe(false);
    await act(id, ids.first);
    const second = await service.detail(id, ids.second);
    expect(second.record.status).toBe('extra');
    expect(second.record.lifecycleVersion).toBe(
      baseline.record.lifecycleVersion,
    );
    await act(id, ids.second);
    expect((await service.detail(id, ids.third)).record.status).toBe('extra');
    await act(id, ids.third);
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'approved',
    );
    expect((await service.detail(id, ids.applicant)).record.number).toMatch(
      /^GENERAL/,
    );
  });
  it('rejects self, duplicate and missing additional reviewers at submission', async () => {
    for (const extras of [
      [ids.applicant],
      [ids.first, ids.first],
      [],
      [ids.stranger, ids.first, ids.second, ids.third],
    ]) {
      const draft = await service.create(form(extras), ids.applicant);
      await expect(
        service.transition(
          String(draft.record.id),
          'submit',
          ids.applicant,
          Number(draft.record.lifecycleVersion),
          randomUUID(),
        ),
      ).rejects.toThrow();
      expect(
        (await service.detail(String(draft.record.id), ids.applicant)).record
          .status,
      ).toBe('draft');
    }
  });
  it('returns for correction, reloads new reviewed content, and reenters the first stage', async () => {
    const id = await submit(form([ids.first]));
    await act(id, ids.manager);
    await act(id, ids.first, 'return');
    let detail = await service.detail(id, ids.applicant);
    expect(detail.record.status).toBe('revision');
    await service.transition(
      id,
      'edit',
      ids.applicant,
      detail.record.lifecycleVersion,
      randomUUID(),
      { ...form([ids.first]), body: 'Clarified information' },
    );
    detail = await service.detail(id, ids.applicant);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      detail.record.lifecycleVersion,
      randomUUID(),
    );
    detail = await service.detail(id, ids.manager);
    expect(detail.record.status).toBe('manager');
    expect(detail.record.body).toBe('Clarified information');
    await act(id, ids.manager);
    await act(id, ids.first);
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'approved',
    );
  });
  it('refuses direct final transitions, outsiders, stale content and mismatched task targets', async () => {
    const id = await submit(form([ids.first]));
    const detail = await service.detail(id, ids.manager);
    const task = detail.taskActions.find((v) =>
      v.actions.some((a) => a.name === 'approve'),
    )!.task;
    const hash = detail.runs.find((v) => v.run.id === task.runId)!.run
      .contentHash;
    await expect(
      service.runtime.fire(GENERAL_LIFECYCLE, id, 'managerApproved', {
        actor: { id: ids.manager },
      }),
    ).rejects.toThrow();
    for (const actor of [ids.stranger])
      await expect(
        service.action(
          id,
          {
            target: { taskId: task.id },
            action: 'approve',
            contentHash: hash,
            requestId: randomUUID(),
          },
          actor,
        ),
      ).rejects.toThrow();
    await expect(
      service.action(
        id,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: 'stale',
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toThrow();
    const other = await submit(form([ids.first]));
    await expect(
      service.action(
        other,
        {
          target: { taskId: task.id },
          action: 'approve',
          contentHash: hash,
          requestId: randomUUID(),
        },
        ids.manager,
      ),
    ).rejects.toThrow();
  });
  it('rejects forged cross-document attachment IDs and can withdraw from sequential review', async () => {
    await expect(
      service.create({ ...form(), attachments: ['forged'] }, ids.applicant),
    ).rejects.toThrow();
    const id = await submit(form([ids.first]));
    await act(id, ids.manager);
    const detail = await service.detail(id, ids.applicant);
    await expect(
      service.transition(
        id,
        'edit',
        ids.applicant,
        detail.record.lifecycleVersion,
        randomUUID(),
        { ...form(), attachments: ['forged'] },
      ),
    ).rejects.toThrow();
    await service.transition(
      id,
      'withdraw',
      ids.applicant,
      detail.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await service.detail(id, ids.applicant)).record.status).toBe(
      'withdrawn',
    );
    expect(
      (await service.detail(id, ids.first)).taskActions.some((t) =>
        t.actions.some((a) => a.name === 'approve'),
      ),
    ).toBe(false);
  });
});

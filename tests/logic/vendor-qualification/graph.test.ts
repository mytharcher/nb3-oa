// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import type { QualificationGraphHost } from '../../../server/providers/vendor-qualification/graph.js';
import { createQualificationRuntime } from '../../../server/providers/vendor-qualification/runtime.js';
import { DEFAULT_COMMITTEE } from '../../../server/providers/vendor-qualification/configuration.js';
import { VENDOR_QUALIFICATION_KIND } from '../../../server/providers/vendor-qualification/contract.js';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
const test = createPlatformAppTest();
const configuredTwoVotePolicy = DEFAULT_COMMITTEE;
for (const decision of ['abstain', 'reject', 'missing'] as const) {
  test(`actual SDK preserves frozen generation after restart and resolves finance ${decision} without return or extra signer`, async ({
    app,
    testApp,
  }) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      org = c.resolve(organizationServiceToken);
    const users = Object.fromEntries(
      await Promise.all(
        ['applicant', 'purchasing', 'finance', 'head'].map(async (key) => [
          key,
          (await createUser(testApp, key)).user.id,
        ]),
      ),
    );
    for (const [name, userId] of Object.entries(users))
      await db.repository('employees').createOne({
        values: {
          id: randomUUID(),
          code: randomUUID(),
          name,
          userId,
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    for (const role of ['purchasing', 'finance'])
      await org.addDutyRoleMember(role, users[role], {
        actorId: users.applicant,
      });
    const dept = await org.createDepartment(
      { title: 'Committee department', managerId: users.head },
      { actorId: users.applicant },
    );
    await org.addMember(
      { departmentId: dept.id, userId: users.applicant, primary: true },
      { actorId: users.applicant },
    );
    const host: QualificationGraphHost = {
      versions: [configuredTwoVotePolicy],
      calendar: c.resolve(calendarServiceToken),
      submit: async () => ({
        committeeVersion: 1,
        committeeSnapshot: configuredTwoVotePolicy,
      }),
      edit: async () => ({}),
      restart: async () => ({}),
      removalHead: async () => users.purchasing,
      candidates: async (_, __, seat) =>
        seat === 'finance' && decision === 'missing'
          ? []
          : [users[seat === 'department' ? 'head' : seat]],
      apply: async () => {},
    };
    let sdk = createQualificationRuntime(
      db,
      c.resolve(approvalDirectoryServiceToken),
      host,
    );
    const record = await sdk.read(() =>
      sdk.runtime.create(
        VENDOR_QUALIFICATION_KIND,
        {
          id: randomUUID(),
          applicantId: users.applicant,
          createdById: users.applicant,
          operation: 'qualify',
          vendorId: randomUUID(),
          name: 'Vendor',
          category: 'service',
          reason: 'Qualify',
          quoteCents: 100,
          cases: '',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          attachments: [],
          qualificationExpiry: '2027-10-10',
          departmentId: dept.id,
          number: null,
          sourceVendorVersion: 1,
          committeeVersion: null,
          committeeSnapshot: null,
          ruleSnapshot: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { actor: { id: users.applicant } },
      ),
    );
    const id = String(record.record.id);
    await sdk.read(() =>
      sdk.runtime.fire(VENDOR_QUALIFICATION_KIND, id, 'submit', {
        actor: { id: users.applicant },
        manual: true,
        expect: { version: Number(record.record.lifecycleVersion) },
        requestId: randomUUID(),
      }),
    );
    async function answer(person: string, action: 'approve' | 'abstain') {
      const views = await sdk.read(() =>
        sdk.approvals.runViewsFor(VENDOR_QUALIFICATION_KIND, id),
      );
      const task = views
        .flatMap((v) => v.tasks)
        .find(
          (t) =>
            t.assigneeId === person &&
            ['pending', 'candidate'].includes(t.status),
        );
      expect(task).toBeDefined();
      await sdk.read(() =>
        sdk.approvals.perform({
          target: { taskId: task!.id },
          action,
          actor: { id: person },
          contentHash: views.find((v) =>
            v.tasks.some((t) => t.id === task!.id),
          )!.run.contentHash,
          requestId: randomUUID(),
          input: {},
          comment: 'Committee decision',
        }),
      );
    }
    await answer(users.purchasing, 'approve');
    const view = await sdk.read(() =>
      sdk.approvals.runViewsFor(VENDOR_QUALIFICATION_KIND, id),
    );
    expect(view.at(-1)?.run.status).toBe('committee_v1');
    await answer(users.purchasing, 'approve');
    await answer(users.head, 'approve');
    expect(
      await db.repository('vendorQualifications').findOne({ filter: { id } }),
    ).toMatchObject({ status: 'committee_v1' });
    // Simulate a restart loading a newly published policy while this stay is pending.
    // The old named stage and frozen generation retain their original threshold.
    sdk = createQualificationRuntime(
      db,
      c.resolve(approvalDirectoryServiceToken),
      {
        ...host,
        versions: [
          configuredTwoVotePolicy,
          { ...DEFAULT_COMMITTEE, version: 2, min: 3 },
        ],
      },
    );
    if (decision === 'missing') {
      const held = await db
        .repository('vendorQualifications')
        .findOne({ filter: { id } });
      expect(held).toMatchObject({
        status: 'committee_v1',
        committeeVersion: 1,
      });
      const still = await sdk.read(() =>
        sdk.approvals.runViewsFor(VENDOR_QUALIFICATION_KIND, id),
      );
      expect(
        still
          .flatMap((view) => view.tasks)
          .some((task) => task.assigneeId === users.finance),
      ).toBe(false);
      return;
    }
    const offered = await sdk.read(() =>
      sdk.approvals.actionsFor(VENDOR_QUALIFICATION_KIND, id, {
        id: users.finance,
      }),
    );
    const names = offered.flatMap((item) =>
      item.actions.map((action) => action.name),
    );
    expect(names).toContain('abstain');
    expect(names).not.toContain('return');
    expect(names).not.toContain('addSigner');
    expect(names).not.toContain('transfer');
    await answer(users.finance, decision);
    expect(
      await db.repository('vendorQualifications').findOne({ filter: { id } }),
    ).toMatchObject({
      status: decision === 'abstain' ? 'qualified' : 'rejected',
      committeeVersion: 1,
    });
  });
}

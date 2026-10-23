// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { describe, expect, vi } from 'vitest';
import {
  createEmployeesAppTest,
  createEmployee,
  grantToUser,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { employeeServiceToken } from '../../../server/providers/employees/contract.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.ts';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/service.ts';
import type { ReimbursementRecord } from '../../../server/providers/reimbursement/contract.ts';
const test = createEmployeesAppTest();
const empty = {
  reason: 'Office costs',
  authorizationId: null,
  loanId: null,
  offsetCents: 0,
  overrunReason: '',
  lines: [],
};
const bytes = '%PDF-1.7\nEvidence\n%%EOF';
async function record(response: Response): Promise<ReimbursementRecord> {
  expect([200, 201]).toContain(response.status);
  return (await response.json()).data.record;
}
describe('reimbursement actual HTTP secure evidence and bank boundaries', () => {
  test('checks independent file read/write scopes, rejects foreign files, and keeps account data out of business responses', async ({
    testApp,
    request,
  }) => {
    const manager = await createEmployee(testApp, 'Reimbursement reviewer'),
      owner = await createEmployee(testApp, 'Reimbursement owner', {
        managerId: manager.employeeId,
      }),
      stranger = await createEmployee(testApp, 'Reimbursement outside'),
      accountant = await createEmployee(testApp, 'Default accountant'),
      cashier = await createEmployee(testApp, 'Default cashier');
    const financialReaders = await Promise.all(
      ['financeManager', 'cfo'].map(async (role) => ({
        role,
        person: await createEmployee(testApp, `Outside ${role}`),
      })),
    );
    for (const person of [owner, manager])
      await grantToUser(
        testApp,
        'reimbursement-' + person.userId,
        [
          {
            resource: { type: 'composite', id: 'oa.reimbursement' },
            actions: ['submit', 'view', 'paymentAccount'].map((action) => ({
              action,
              policy: {
                type: 'composite',
                scopes: { reimbursementRequests: 'allRecords' },
              },
            })),
          },
        ],
        person.userId,
      );
    const own = await owner.session(),
      reviewer = await manager.session(),
      other = await stranger.session(),
      db = testApp.database;
    const org = testApp.application.container.resolve(organizationServiceToken),
      department = await org.createDepartment(
        { title: 'Reimbursement HTTP', managerId: manager.userId },
        { actorId: manager.userId },
      );
    await org.addMember(
      { departmentId: department.id, userId: owner.userId, primary: true },
      { actorId: manager.userId },
    );
    await org.addDutyRoleMember('finance', accountant.userId, {
      actorId: manager.userId,
    });
    await org.addDutyRoleMember('cashier', cashier.userId, {
      actorId: manager.userId,
    });
    await db.transaction((tx) =>
      testApp.application.container
        .resolve(financeAssignmentServiceToken)
        .create(
          {
            departmentId: department.id,
            accountantId: accountant.userId,
            actorId: manager.userId,
            reason: 'Default bank role test',
          },
          tx,
        ),
    );
    for (const { role, person } of financialReaders) {
      await org.addDutyRoleMember(role, person.userId, {
        actorId: manager.userId,
      });
      await grantToUser(
        testApp,
        `reimbursement-financial-reader-${role}`,
        [
          {
            resource: { type: 'composite', id: 'oa.reimbursement' },
            actions: [
              {
                action: 'view',
                policy: {
                  type: 'composite',
                  scopes: { reimbursementRequests: 'oa.reimbursementReadable' },
                },
              },
            ],
          },
        ],
        person.userId,
      );
    }
    const employees =
        testApp.application.container.resolve(employeeServiceToken),
      bank = vi.spyOn(employees, 'paymentAccountOf').mockResolvedValue({
        bankName: 'Bank',
        bankAccount: '001234567',
        bankAccountName: 'Owner',
      });
    const upload = async (
      id: string,
      file = new File([bytes], 'invoice.pdf', { type: 'application/pdf' }),
    ) => {
      const body = new FormData();
      body.append('file', file);
      return own.fetch('/reimbursementAttachments/uploadOne', {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN, 'x-reimbursement-request-id': id },
        body,
      });
    };
    try {
      expect((await request('/reimbursementRequests')).status).toBe(401);
      // The production seed grants ordinary employees their own applications.
      const ordinaryDraft = await record(
        await other.fetch('/reimbursementRequests', json(empty)),
      );
      expect(
        (await other.fetch(`/reimbursementRequests/${ordinaryDraft.id}`))
          .status,
      ).toBe(200);
      const deniedAuthorization =
        testApp.application.container.resolve(authorizationToken);
      const originalDeniedFor =
        deniedAuthorization.for.bind(deniedAuthorization);
      const denySubmit = vi
        .spyOn(deniedAuthorization, 'for')
        .mockImplementation((identity) => {
          const context = originalDeniedFor(identity);
          return {
            ...context,
            authorize: async (check) => {
              const decision = await context.authorize(check);
              return check.resource.type === 'composite' &&
                check.resource.id === 'oa.reimbursement' &&
                check.action === 'submit'
                ? { ...decision, effect: 'deny' as const }
                : decision;
            },
          };
        });
      try {
        expect(
          (await other.fetch('/reimbursementRequests', json(empty))).status,
        ).toBe(403);
      } finally {
        denySubmit.mockRestore();
      }

      bank.mockResolvedValueOnce({
        bankName: 'Bank',
        bankAccount: '',
        bankAccountName: 'Owner',
      });
      const incompleteOptions = await own.fetch(
        '/reimbursementRequests/options',
      );
      expect(incompleteOptions.status).toBe(200);
      const readiness = (await incompleteOptions.json()).data;
      expect(readiness.paymentAccountComplete).toBe(false);
      for (const field of ['bankName', 'bankAccount', 'bankAccountName'])
        expect(readiness).not.toHaveProperty(field);
      const options = await own.fetch('/reimbursementRequests/options');
      expect(options.status).toBe(200);
      expect((await options.json()).data).toMatchObject({
        applicantId: owner.userId,
        paymentAccountComplete: true,
        authorizations: [],
        loans: [],
      });
      expect(
        (
          await own.fetch(
            `/reimbursementRequests/options?applicantId=${stranger.userId}`,
          )
        ).status,
      ).toBe(403);
      const createPayload = { ...empty, requestId: randomUUID() };
      const concurrent = await Promise.all([
        own.fetch('/reimbursementRequests', json(createPayload)),
        own.fetch('/reimbursementRequests', json(createPayload)),
      ]);
      expect(concurrent.map((response) => response.status)).toEqual([201, 201]);
      const copies = await Promise.all(concurrent.map(record));
      expect(copies[0].id).toBe(copies[1].id);
      expect(
        (
          await own.fetch(
            '/reimbursementRequests',
            json({ ...createPayload, reason: 'Changed input' }),
          )
        ).status,
      ).toBe(409);
      const draft = await record(
          await own.fetch('/reimbursementRequests', json(empty)),
        ),
        foreign = await record(
          await own.fetch('/reimbursementRequests', json(empty)),
        );
      const bad = await upload(
        draft.id,
        new File(['<script>'], 'bad.pdf', { type: 'application/pdf' }),
      );
      expect(bad.status).toBe(400);
      expect(
        (await other.fetch(`/reimbursementRequests/${draft.id}`)).status,
      ).toBe(403);
      const uploaded = await upload(draft.id);
      expect(uploaded.status).toBe(201);
      const file = (await uploaded.json()).data.record;
      const spareResponse = await upload(draft.id);
      expect(spareResponse.status).toBe(201);
      const spare = (await spareResponse.json()).data.record;
      const url = new URL(file.contentUrl, OA_TEST_ORIGIN).href;
      expect((await other.fetch(url)).status).toBe(403);
      expect((await own.fetch(url)).status).toBe(200);
      // Exercise independent field restrictions at the public authorization boundary.
      // A record-level grant must not become evidence-field access.
      const authorization =
        testApp.application.container.resolve(authorizationToken);
      const originalFor = authorization.for.bind(authorization);
      const narrow = vi
        .spyOn(authorization, 'for')
        .mockImplementation((identity) => {
          const context = originalFor(identity);
          return {
            ...context,
            authorize: async (check) => {
              const decision = await context.authorize(check);
              if (
                check.resource.type !== 'composite' ||
                check.resource.id !== 'oa.reimbursement' ||
                !decision.conditions?.database
              )
                return decision;
              const database = decision.conditions.database;
              const policy = database.reimbursementRequests;
              if (!policy) return decision;
              return {
                ...decision,
                conditions: {
                  ...decision.conditions,
                  database: {
                    ...database,
                    reimbursementRequests: {
                      ...policy,
                      read: {
                        scope: true,
                        fields: [
                          'id',
                          'applicantId',
                          'createdById',
                          'status',
                          'lifecycleVersion',
                        ],
                      },
                    },
                  },
                },
              };
            },
          };
        });
      try {
        expect((await own.fetch(url)).status).toBe(403);
        expect((await upload(draft.id)).status).toBe(403);
        expect(
          (
            await own.fetch('/reimbursementAttachments/findMany', {
              ...json({ limit: 10 }),
              headers: {
                ...json({}).headers,
                'x-reimbursement-request-id': draft.id,
              },
            })
          ).status,
        ).toBe(403);
      } finally {
        narrow.mockRestore();
      }
      const audit = testApp.application.container.resolve(auditServiceToken),
        fail = vi
          .spyOn(audit, 'record')
          .mockRejectedValueOnce(new Error('File audit unavailable'));
      expect((await upload(draft.id)).status).toBe(500);
      fail.mockRestore();
      expect(
        await db
          .repository('reimbursementAttachmentFiles')
          .count({ filter: { reimbursementId: draft.id } }),
      ).toBe(2);
      const line = {
        id: randomUUID(),
        category: 'office',
        date: '2026-10-11',
        amountCents: 100,
        invoiceNumber: randomUUID(),
        attachmentIds: [file.id],
        standardExceptionReason: '',
      };
      const wrong = await record(
        await own.fetch(
          `/reimbursementRequests/${foreign.id}/transition`,
          json({
            transition: 'edit',
            version: foreign.lifecycleVersion,
            requestId: randomUUID(),
            input: { ...empty, lines: [line] },
          }),
        ),
      );
      expect(
        (
          await own.fetch(
            `/reimbursementRequests/${foreign.id}/transition`,
            json({
              transition: 'submit',
              version: wrong.lifecycleVersion,
              requestId: randomUUID(),
              input: {},
            }),
          )
        ).status,
      ).toBe(400);
      const edited = await record(
        await own.fetch(
          `/reimbursementRequests/${draft.id}/transition`,
          json({
            transition: 'edit',
            version: draft.lifecycleVersion,
            requestId: randomUUID(),
            input: { ...empty, lines: [line] },
          }),
        ),
      );
      const submitted = await own.fetch(
        `/reimbursementRequests/${draft.id}/transition`,
        json({
          transition: 'submit',
          version: edited.lifecycleVersion,
          requestId: randomUUID(),
          input: {},
        }),
      );
      expect(submitted.status).toBe(200);
      expect(JSON.stringify(await submitted.json())).not.toContain('001234567');
      expect((await reviewer.fetch(url)).status).toBe(200);
      expect(
        (await own.fetch(new URL(spare.contentUrl, OA_TEST_ORIGIN).href))
          .status,
      ).toBe(403);
      expect(
        (
          await reviewer.fetch(
            `/reimbursementRequests/${draft.id}/paymentAccount`,
          )
        ).status,
      ).toBe(403);
      const info = await own.fetch(
        `/reimbursementRequests/${draft.id}/paymentAccount`,
      );
      expect(info.status).toBe(200);
      const savedAccount = (await info.json()).data;
      expect(savedAccount.bankAccount).toBe('001234567');
      const staleCorrection = await own.fetch(
        `/reimbursementRequests/${draft.id}/paymentAccount`,
        {
          ...json({
            // A stale version within PostgreSQL's INTEGER range tests the
            // conflict contract without failing in the database parameter cast.
            version: 2_147_483_647,
            payeeVersion: savedAccount.version,
            account: {
              bankName: 'Changed bank',
              bankAccount: 'CHANGED',
              bankAccountName: 'Changed holder',
            },
          }),
          method: 'PATCH',
        },
      );
      expect(staleCorrection.status).toBe(409);
      expect((await staleCorrection.json()).error.reason).toBe(
        'REIMBURSEMENT_PAYMENT_ACCOUNT_STALE',
      );
      expect(
        (
          await (
            await own.fetch(`/reimbursementRequests/${draft.id}/paymentAccount`)
          ).json()
        ).data,
      ).toEqual(savedAccount);

      expect(
        (await other.fetch(`/reimbursementRequests/${draft.id}/paymentAccount`))
          .status,
      ).toBe(403);
      const detail = await reviewer.fetch(`/reimbursementRequests/${draft.id}`);
      expect(detail.status).toBe(200);
      expect(JSON.stringify(await detail.json())).not.toContain('001234567');
      for (const { person } of financialReaders) {
        const financialSession = await person.session();
        const financialDetail = await financialSession.fetch(
          `/reimbursementRequests/${draft.id}`,
        );
        expect(financialDetail.status).toBe(200);
        expect(JSON.stringify(await financialDetail.json())).not.toContain(
          '001234567',
        );
        const financialList = await financialSession.fetch(
          '/reimbursementRequests',
        );
        expect(financialList.status).toBe(200);
        expect(
          (
            await financialSession.fetch(
              `/reimbursementRequests/${draft.id}/paymentAccount`,
            )
          ).status,
        ).toBe(403);
      }
      const service = testApp.application.container.resolve(
        reimbursementServiceToken,
      );
      expect((await service.detail(draft.id, owner.userId)).record.status).toBe(
        'manager',
      );
      const excludedOwnerPolicy = {
        create: false,
        update: false,
        delete: false,
        read: {
          scope: { id: ordinaryDraft.id },
          fields: ['id', 'applicantId', 'createdById'],
        },
      };
      await expect(
        service.detail(draft.id, owner.userId, excludedOwnerPolicy),
      ).rejects.toMatchObject({
        code: 'REIMBURSEMENT_ACCESS_DENIED',
        kind: 'permission',
      });
      const activeRun = (await service.detail(draft.id, owner.userId)).runs.at(
        -1,
      )!;
      for (const action of ['appoint', 'reassign']) {
        const target =
          action === 'appoint'
            ? `runId=${randomUUID()}`
            : `taskId=${randomUUID()}`;
        expect(
          (
            await own.fetch(
              `/reimbursementRequests/${draft.id}/candidates?${target}&action=${action}`,
            )
          ).status,
        ).toBe(403);
        const wrongTarget =
          action === 'appoint'
            ? `taskId=${activeRun.tasks[0].id}`
            : `runId=${activeRun.run.id}`;
        expect(
          (
            await own.fetch(
              `/reimbursementRequests/${draft.id}/candidates?${wrongTarget}&action=${action}`,
            )
          ).status,
        ).toBe(400);
      }
      const ccCandidates = await own.fetch(
        `/reimbursementRequests/${draft.id}/candidates?runId=${activeRun.run.id}&action=cc&search=Reimbursement`,
      );
      expect(ccCandidates.status).toBe(200);
      expect((await ccCandidates.json()).data.people).toContainEqual(
        expect.objectContaining({ id: manager.userId }),
      );
      expect(
        (
          await own.fetch(
            `/reimbursementRequests/${draft.id}/candidates?runId=${randomUUID()}&action=cc`,
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await own.fetch(
            `/reimbursementRequests/${draft.id}/candidates?runId=${activeRun.run.id}&taskId=other&action=cc`,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await own.fetch(
            `/reimbursementRequests/${draft.id}/candidates?taskId=${activeRun.tasks[0].id}&action=cc`,
          )
        ).status,
      ).toBe(400);
      // These sessions receive bank access solely from the shipped role seeds.
      const accountantSession = await accountant.session(),
        cashierSession = await cashier.session();
      expect(
        (
          await accountantSession.fetch(
            `/reimbursementRequests/${draft.id}/paymentAccount`,
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await cashierSession.fetch(
            `/reimbursementRequests/${draft.id}/paymentAccount`,
          )
        ).status,
      ).toBe(403);
      const managerDetail = await service.detail(draft.id, manager.userId);
      const managerTask = managerDetail.taskActions.find((a) =>
        a.actions.some((op) => op.name === 'approve'),
      )!;
      await service.action(
        draft.id,
        {
          target: { taskId: managerTask.task.id },
          action: 'approve',
          input: {},
          contentHash: managerDetail.runs.at(-1)!.run.contentHash,
          requestId: randomUUID(),
        },
        manager.userId,
      );
      const financeDetail = await service.detail(draft.id, accountant.userId);
      expect(financeDetail.record.status).toBe('finance');
      const financeTask = financeDetail.taskActions.find((a) =>
        a.actions.some((op) => op.name === 'approve'),
      )!;
      await service.action(
        draft.id,
        {
          target: { taskId: financeTask.task.id },
          action: 'approve',
          input: {},
          contentHash: financeDetail.runs.at(-1)!.run.contentHash,
          requestId: randomUUID(),
        },
        accountant.userId,
      );
      expect((await service.detail(draft.id, owner.userId)).record.status).toBe(
        'cashier',
      );
      const defaultCashierBank = await cashierSession.fetch(
        `/reimbursementRequests/${draft.id}/paymentAccount`,
      );
      expect(defaultCashierBank.status).toBe(200);
      expect((await defaultCashierBank.json()).data.bankAccount).toBe(
        '001234567',
      );
    } finally {
      bank.mockRestore();
      vi.restoreAllMocks();
    }
  }, 120000);
});

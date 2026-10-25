// @vitest-environment node
import { randomUUID } from 'node:crypto';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { offeredActions } from '@nocobase/app-plugin-approval/client';
import { createPlatformAppTest, createUser } from '../platform/helpers.ts';
import { composite } from '../employees/helpers.ts';
import { write } from '../platform/helpers.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.ts';
import { invoiceServiceToken } from '../../../server/providers/invoices/contract.ts';
import {
  purchaseOrderServiceToken,
  type PurchaseRecord,
} from '../../../server/providers/purchases/contract.ts';
import {
  paymentRequestServiceToken,
  type PaymentRequestInput,
} from '../../../server/providers/payment-requests/contract.ts';
import type { PaymentRequestService } from '../../../server/providers/payment-requests/service.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.ts';
const test = createPlatformAppTest();
describe('payment requests: authoritative orders and actual cashier settlement', () => {
  test('counts concurrent inflight payments, enforces the additional staircase and settles actual evidence with audit rollback', async ({
    app,
    testApp,
  }) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      tx = db.connection(),
      org = c.resolve(organizationServiceToken),
      authz = c.resolve(authorizationToken);
    const users = Object.fromEntries(
      await Promise.all(
        ['applicant', 'head', 'finance', 'finance2', 'cashier'].map(
          async (name) =>
            [name, await createUser(testApp, `Payment ${name}`)] as const,
        ),
      ),
    );
    for (const [name, user] of Object.entries(users)) {
      await tx.repository('employees').createOne({
        values: {
          id: randomUUID(),
          code: randomUUID(),
          name,
          userId: user.user.id,
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      const key = `payment-test-${name}`;
      await authz.permissionSets.create({
        key,
        title: key,
        grants: [
          composite('oa.payment', {
            submit: { paymentRequests: 'allRecords' },
            view: { paymentRequests: 'allRecords' },
            paymentAccount: { paymentRequests: 'allRecords' },
            voucherEvidence: { paymentRequests: 'allRecords' },
          }),
        ],
      });
      await authz.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'user', id: user.user.id },
      });
    }
    const department = await org.createDepartment(
      { title: 'Payment HQ', managerId: users.head.user.id },
      { actorId: users.head.user.id },
    );
    await org.addMember(
      {
        departmentId: department.id,
        userId: users.applicant.user.id,
        primary: true,
      },
      { actorId: users.head.user.id },
    );
    for (const [name, role] of [
      ['finance', 'finance'],
      ['finance2', 'finance'],
      ['cashier', 'cashier'],
    ])
      await org.addDutyRoleMember(role, users[name].user.id, {
        actorId: users.head.user.id,
      });
    const vendor = await c.resolve(vendorServiceToken).create(
      {
        code: 'PAY-' + randomUUID(),
        name: 'Supplier',
        category: 'Office',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        bankName: 'Private bank',
        bankAccount: 'PAYSECRET12345',
        bankAccountName: 'Supplier company',
        actorId: users.head.user.id,
        reason: 'Test supplier',
      },
      tx,
    );
    const account = {
        departmentId: department.id,
        year: 2026,
        subject: 'office',
      },
      budgets = c.resolve(budgetServiceToken),
      purchaseId = randomUUID(),
      orderId = randomUUID(),
      orders = c.resolve(purchaseOrderServiceToken);
    await budgets.allocate(
      {
        ...account,
        deltaCents: 100000,
        reference: 'payment-test-allocation',
        requestKey: randomUUID(),
        actorId: users.head.user.id,
        reason: 'Budget',
      },
      tx,
    );
    await budgets.adjustHold(
      {
        ...account,
        cents: 10000,
        reference: `oa.purchase:${purchaseId}`,
        requestKey: randomUUID(),
        actorId: users.head.user.id,
        reason: 'Approved purchase hold',
      },
      tx,
    );
    await orders.issue(
      {
        id: purchaseId,
        orderId,
        number: 'PUR-' + randomUUID(),
        departmentId: department.id,
        applicantId: users.applicant.user.id,
        selectedVendorId: vendor.id,
        actualCents: 10000,
        heldCents: 10000,
        heldAccount: account,
        items: [
          {
            id: 'item',
            name: 'Paper',
            specification: '',
            quantity: '1',
            unit: 'box',
          },
        ],
        status: 'approved',
      } as PurchaseRecord,
      users.head.user.id,
      tx,
    );
    const service = c.resolve(
      paymentRequestServiceToken,
    ) as PaymentRequestService;
    const input = (): PaymentRequestInput => ({
      reason: 'Supplier installment',
      sourceMode: 'purchase',
      purchaseOrderId: orderId,
      contractId: null,
      noPriorApprovalReason: '',
      vendorId: vendor.id,
      amountCents: 6000,
      invoiceNumber: randomUUID(),
      attachments: [],
      paymentMethod: 'bankTransfer',
    });
    const upload = async (
      id: string,
      name: 'applicant' | 'cashier',
      purpose: 'invoice' | 'voucher',
    ) => {
      const body = new FormData();
      body.append(
        'file',
        new File(['%PDF-1.7\nEvidence\n%%EOF'], 'proof.pdf', {
          type: 'application/pdf',
        }),
      );
      const response = await users[name].fetch(
        '/paymentAttachments/uploadOne',
        {
          method: 'POST',
          headers: {
            origin: OA_TEST_ORIGIN,
            'x-payment-request-id': id,
            'x-payment-file-purpose': purpose,
          },
          body,
        },
      );
      expect(response.status).toBe(201);
      return (await response.json()).data.record;
    };
    const prepare = async (data = input()) => {
      const draft = (await service.create(data, users.applicant.user.id))
        .record;
      const file = await upload(String(draft.id), 'applicant', 'invoice');
      const result = await service.transition(
        String(draft.id),
        'edit',
        users.applicant.user.id,
        Number(draft.lifecycleVersion),
        randomUUID(),
        { ...data, attachments: [file.id] },
      );
      return result.record;
    };
    const requests = await Promise.all([prepare(), prepare()]);
    await Promise.all(
      requests.map((record) =>
        service.transition(
          String(record.id),
          'submit',
          users.applicant.user.id,
          Number(record.lifecycleVersion),
          randomUUID(),
        ),
      ),
    );
    const details = await Promise.all(
      requests.map((record) =>
        service.detail(String(record.id), users.applicant.user.id),
      ),
    );
    expect(details.map((d) => d.record.status).sort()).toEqual([
      'finance',
      'head',
    ]);
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 0,
      pendingCents: 12000,
    });
    const normal = details.find((d) => d.record.status === 'finance')!,
      extra = details.find((d) => d.record.status === 'head')!;
    expect(extra.record.fullApprovalRequired).toBe(true);
    expect(extra.record.sourceCumulativeCents).toBe(12000);
    expect(
      (
        await users.applicant.fetch(
          `/paymentRequests/${extra.record.id}/candidates?runId=${normal.runs[0].run.id}&action=cc`,
        )
      ).status,
    ).toBe(403);
    const ccCandidates = await users.head.fetch(
      `/paymentRequests/${extra.record.id}/candidates?runId=${extra.runs[0].run.id}&action=cc`,
    );
    expect(ccCandidates.status).toBe(200);
    expect((await ccCandidates.json()).data.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: users.applicant.user.id,
          name: expect.any(String),
        }),
      ]),
    );
    expect(
      (
        await users.head.fetch(
          `/paymentRequests/${extra.record.id}/candidates?runId=${extra.runs[0].run.id}&taskId=${extra.runs[0].tasks[0].id}&action=cc`,
        )
      ).status,
    ).toBe(400);
    const act = async (
      id: string,
      name: keyof typeof users,
      action: string,
      output?: Record<string, unknown>,
    ) => {
      const d = await service.detail(id, users[name].user.id);
      const offer = offeredActions(
        d.taskActions,
        d.runActions,
        d.runs.map((run) => run.run),
      ).find((a) => a.name === action);
      expect(offer).toBeDefined();
      const run = d.runs.find((view) =>
        'runId' in offer!.target
          ? view.run.id === offer!.target.runId
          : view.tasks.some((task) => task.id === offer!.target.taskId),
      )!;
      return service.action(
        id,
        {
          target: offer!.target,
          action,
          requestId: randomUUID(),
          contentHash: run.run.contentHash,
          ...(output
            ? { input: output as import('@nocobase/lifecycle').JsonObject }
            : {}),
          ...(['unable', 'reject', 'return'].includes(action)
            ? { comment: 'Recorded explanation' }
            : {}),
        },
        users[name].user.id,
      );
    };
    await act(normal.record.id, 'finance', 'approve');
    const cashier = await service.detail(
      normal.record.id,
      users.cashier.user.id,
      { read: true, create: false, update: false, delete: false },
    );
    expect(cashier.record.status).toBe('cashier');
    await expect(
      orders.settlePayment(
        {
          orderId,
          paymentId: normal.record.id,
          actorId: users.cashier.user.id,
          requestKey: randomUUID(),
          verifier: service,
        },
        tx,
      ),
    ).rejects.toThrow('actual claimed cashier');
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 0,
      pendingCents: 12000,
    });
    const businessResponse = await users.head.fetch(
      `/paymentRequests/${normal.record.id}`,
    );
    expect(businessResponse.status).toBe(200);
    expect(JSON.stringify(await businessResponse.json())).not.toContain(
      'PAYSECRET12345',
    );
    expect(
      (
        await users.head.fetch(
          `/paymentRequests/${normal.record.id}/paymentAccount`,
        )
      ).status,
    ).toBe(403);
    await act(normal.record.id, 'cashier', 'claim');
    const voucher = await upload(normal.record.id, 'cashier', 'voucher');
    const voucherUrl = new URL(voucher.contentUrl, OA_TEST_ORIGIN).href;
    expect((await users.head.fetch(voucherUrl)).status).toBe(403);
    expect((await users.applicant.fetch(voucherUrl)).status).toBe(403);
    expect((await users.cashier.fetch(voucherUrl)).status).toBe(200);
    const output = {
      voucherNumber: 'VOUCHER-001',
      voucherAttachments: [voucher.id],
    };
    const audit = c.resolve(auditServiceToken),
      failAudit = vi
        .spyOn(audit, 'record')
        .mockImplementation(async (entry) => {
          if (entry.action === 'paymentRequest.paid')
            throw new Error('Audit failed');
        });
    await expect(
      act(normal.record.id, 'cashier', 'complete', output),
    ).rejects.toThrow();
    failAudit.mockRestore();
    expect(
      (await service.detail(normal.record.id, users.applicant.user.id)).record
        .status,
    ).toBe('cashier');
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 0,
      pendingCents: 12000,
    });
    expect(await tx.repository('paymentRequestLedger').count()).toBe(0);
    expect(
      await c
        .resolve(invoiceServiceToken)
        .forDocument(`oa.payment:${normal.record.id}`),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: 'held', cents: 6000 }),
      ]),
    );
    await act(normal.record.id, 'cashier', 'complete', output);
    expect(
      (await service.detail(normal.record.id, users.applicant.user.id)).record
        .status,
    ).toBe('paid');
    expect(
      await service.financeExport(normal.record.id, users.finance.user.id, {
        read: true,
        create: false,
        update: false,
        delete: false,
      }),
    ).toMatchObject({
      id: normal.record.id,
      amountCents: 6000,
      offsetCents: 0,
      paidCents: 6000,
      forced: false,
      lines: [],
    });
    await expect(
      service.financeExport(normal.record.id, users.finance.user.id, {
        read: { fields: ['id'], scope: true },
        create: false,
        update: false,
        delete: false,
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_REQUEST_FIELDS_RESTRICTED' });
    expect(
      await c
        .resolve(invoiceServiceToken)
        .forDocument(`oa.payment:${normal.record.id}`),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: 'used', cents: 6000 }),
      ]),
    );
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 6000,
      pendingCents: 6000,
    });
    expect((await orders.get(orderId))?.status).toBe('awaitingReceipt');
    expect((await users.head.fetch(voucherUrl)).status).toBe(200);
    const originalFor = authz.for.bind(authz);
    const fieldBoundary = vi
      .spyOn(authz, 'for')
      .mockImplementation((identity) => {
        const context = originalFor(identity);
        return {
          ...context,
          authorize: async (check) => {
            const decision = await context.authorize(check);
            if (
              check.resource.type !== 'composite' ||
              check.resource.id !== 'oa.payment' ||
              !decision.conditions?.database
            )
              return decision;
            const database = decision.conditions.database;
            const policy = database.paymentRequests;
            if (!policy) return decision;
            return {
              ...decision,
              conditions: {
                ...decision.conditions,
                database: {
                  ...database,
                  paymentRequests: {
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
      expect(
        (await users.applicant.fetch(`/paymentRequests/${normal.record.id}`))
          .status,
      ).toBe(403);
      expect(
        (
          await users.applicant.fetch(
            `/paymentRequests/${normal.record.id}/paymentAccount`,
          )
        ).status,
      ).toBe(403);
      expect(
        (await users.applicant.fetch('/paymentRequests/options')).status,
      ).toBe(403);
      expect((await users.applicant.fetch(voucherUrl)).status).toBe(403);
      expect(
        (
          await users.applicant.fetch('/paymentAttachments/findMany', {
            headers: {
              'x-payment-request-id': normal.record.id,
              'x-payment-file-purpose': 'voucher',
            },
          })
        ).status,
      ).toBe(403);
    } finally {
      fieldBoundary.mockRestore();
    }
    const optionsResponse = await users.applicant.fetch(
      '/paymentRequests/options',
    );
    expect(optionsResponse.status).toBe(200);
    const optionsData = (await optionsResponse.json()).data;
    expect(optionsData.orders[0].applicant).toMatchObject({
      id: users.applicant.user.id,
      name: expect.any(String),
    });
    expect(JSON.stringify(optionsData)).not.toContain('PAYSECRET12345');
    const listResponse = await users.applicant.fetch(
      '/paymentRequests?view=mine',
    );
    expect(listResponse.status).toBe(200);
    expect((await listResponse.json()).data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: normal.record.id,
          applicant: expect.objectContaining({
            id: users.applicant.user.id,
            name: expect.any(String),
          }),
        }),
      ]),
    );
    const balances = await budgets.balance(account, tx);
    expect(balances).toMatchObject({ heldCents: 10000, usedCents: 0 });
    await expect(
      act(normal.record.id, 'cashier', 'complete', output),
    ).rejects.toThrow();
    await act(extra.record.id, 'head', 'approve');
    await act(extra.record.id, 'finance', 'approve');
    expect(
      (await service.detail(extra.record.id, users.applicant.user.id)).record
        .headApprovedAt,
    ).not.toBeNull();
    await act(extra.record.id, 'cashier', 'claim');
    await act(extra.record.id, 'cashier', 'unable');
    const exception = await service.detail(
      extra.record.id,
      users.applicant.user.id,
    );
    expect(exception.record.status).toBe('exception');
    await service.transition(
      extra.record.id,
      'withdraw',
      users.applicant.user.id,
      exception.record.lifecycleVersion,
      randomUUID(),
    );
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 6000,
      pendingCents: 0,
    });
    const createPayload = { ...input(), requestId: randomUUID() };
    const concurrent = await Promise.all([
      users.applicant.fetch('/paymentRequests', write('POST', createPayload)),
      users.applicant.fetch('/paymentRequests', write('POST', createPayload)),
    ]);
    expect(concurrent.map((response) => response.status)).toEqual([201, 201]);
    const bodies = await Promise.all(
      concurrent.map((response) => response.json()),
    );
    expect(bodies[0].data.record.id).toBe(bodies[1].data.record.id);
    expect(
      (
        await users.applicant.fetch(
          '/paymentRequests',
          write('POST', { ...createPayload, amountCents: 6001 }),
        )
      ).status,
    ).toBe(409);
    // Account correction preserves the approved source and financial opinions;
    // explicit exception retry still requires a fresh cashier claim.
    const retryDraft = await prepare();
    await service.transition(
      String(retryDraft.id),
      'submit',
      users.applicant.user.id,
      Number(retryDraft.lifecycleVersion),
      randomUUID(),
    );
    await act(String(retryDraft.id), 'head', 'approve');
    await act(String(retryDraft.id), 'finance', 'approve');
    await act(String(retryDraft.id), 'cashier', 'claim');
    await act(String(retryDraft.id), 'cashier', 'unable');
    const retryBefore = (
      await service.detail(String(retryDraft.id), users.applicant.user.id)
    ).record;
    expect(retryBefore.handlingFailureReason).toBe('Recorded explanation');
    const payee = await service.paymentAccount(
      String(retryDraft.id),
      users.applicant.user.id,
    );
    // A broad bank grant never substitutes for an ordinary view scope.
    const bankWide = vi.spyOn(authz, 'for').mockImplementation((identity) => {
      const context = originalFor(identity);
      return {
        ...context,
        authorize: async (check) => {
          const decision = await context.authorize(check);
          if (
            check.resource.type === 'composite' &&
            check.resource.id === 'oa.payment' &&
            check.action === 'view' &&
            decision.conditions?.database?.paymentRequests
          ) {
            return {
              ...decision,
              conditions: {
                ...decision.conditions,
                database: {
                  ...decision.conditions.database,
                  paymentRequests: {
                    ...decision.conditions.database.paymentRequests,
                    read: {
                      scope: {
                        kind: 'filter',
                        version: 1,
                        root: {
                          kind: 'condition',
                          path: ['id'],
                          operator: '$eq',
                          value: randomUUID(),
                        },
                      },
                    },
                  },
                },
              },
            };
          }
          return decision;
        },
      };
    });
    try {
      expect(
        (
          await users.applicant.fetch(
            `/paymentRequests/${retryDraft.id}/paymentAccount`,
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await users.applicant.fetch(
            `/paymentRequests/${retryDraft.id}/paymentAccount`,
            write('PATCH', {
              lifecycleVersion: retryBefore.lifecycleVersion,
              payeeVersion: payee!.version,
              reason: 'Attempt with excluded view scope',
              account: {
                bankName: 'Excluded bank',
                bankAccount: 'EXCLUDED',
                bankAccountName: 'Supplier',
              },
            }),
          )
        ).status,
      ).toBe(403);
    } finally {
      bankWide.mockRestore();
    }

    await service.correctPaymentAccount(
      String(retryDraft.id),
      users.applicant.user.id,
      retryBefore.lifecycleVersion,
      payee!.version,
      {
        bankName: 'Corrected bank',
        bankAccount: 'CORRECTEDSECRET',
        bankAccountName: 'Supplier company',
      },
      'Bank correction',
    );
    await service.transition(
      String(retryDraft.id),
      'retryCash',
      users.applicant.user.id,
      retryBefore.lifecycleVersion,
      randomUUID(),
    );
    const retryAfter = (
      await service.detail(String(retryDraft.id), users.applicant.user.id)
    ).record;
    expect(retryAfter.financeApprovedAt).toBe(retryBefore.financeApprovedAt);
    expect(JSON.stringify(retryAfter)).not.toContain('CORRECTEDSECRET');
    await act(String(retryDraft.id), 'cashier', 'claim');
    await act(String(retryDraft.id), 'cashier', 'unable');
    const forceBefore = (
      await service.detail(String(retryDraft.id), users.applicant.user.id)
    ).record;
    const administrator = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    await expect(
      service.transition(
        String(retryDraft.id),
        'forcePayException',
        administrator.user.id,
        forceBefore.lifecycleVersion,
        randomUUID(),
        { reason: 'Manual confirmation', confirmedCents: 5999 },
      ),
    ).rejects.toThrow('exact confirmation');
    await service.transition(
      String(retryDraft.id),
      'forcePayException',
      administrator.user.id,
      forceBefore.lifecycleVersion,
      randomUUID(),
      { reason: 'Manual confirmation', confirmedCents: 6000 },
    );
    expect(await service.paymentFact(String(retryDraft.id))).toMatchObject({
      forced: true,
      cents: 6000,
    });
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 12000,
      pendingCents: 0,
    });
    expect(await budgets.balance(account)).toMatchObject({
      heldCents: 10000,
      usedCents: 0,
    });

    // Without prior approval, even a tiny payment must receive head + finance.
    const noSource = await prepare({
      ...input(),
      sourceMode: 'none',
      purchaseOrderId: null,
      noPriorApprovalReason: 'Unplanned expense',
      amountCents: 1,
    });
    await service.transition(
      String(noSource.id),
      'submit',
      users.applicant.user.id,
      Number(noSource.lifecycleVersion),
      randomUUID(),
    );
    expect(
      (await service.detail(String(noSource.id), users.applicant.user.id))
        .record.status,
    ).toBe('head');
    await act(String(noSource.id), 'head', 'approve');
    await act(String(noSource.id), 'finance', 'reject');
    expect(
      (await service.detail(String(noSource.id), users.applicant.user.id))
        .record.status,
    ).toBe('finance');
    await act(String(noSource.id), 'finance2', 'reject');
    expect(
      (await service.detail(String(noSource.id), users.applicant.user.id))
        .record.status,
    ).toBe('rejected');
    const raceDraft = await prepare();
    await service.transition(
      String(raceDraft.id),
      'submit',
      users.applicant.user.id,
      Number(raceDraft.lifecycleVersion),
      randomUUID(),
    );
    await act(String(raceDraft.id), 'head', 'approve');
    await act(String(raceDraft.id), 'finance', 'approve');
    await act(String(raceDraft.id), 'cashier', 'claim');
    await expect(
      service.transition(
        String(raceDraft.id),
        'reviseBusiness',
        users.applicant.user.id,
        (await service.detail(String(raceDraft.id), users.applicant.user.id))
          .record.lifecycleVersion,
        randomUUID(),
        {
          ...input(),
          attachments: (
            await service.detail(String(raceDraft.id), users.applicant.user.id)
          ).record.attachments,
        },
      ),
    ).rejects.toThrow();
    await act(String(raceDraft.id), 'cashier', 'unable');
    const raceBefore = (
      await service.detail(String(raceDraft.id), users.applicant.user.id)
    ).record;
    const race = await Promise.allSettled([
      service.transition(
        String(raceDraft.id),
        'reviseBusiness',
        users.applicant.user.id,
        raceBefore.lifecycleVersion,
        randomUUID(),
        {
          ...input(),
          invoiceNumber: raceBefore.invoiceNumber,
          attachments: raceBefore.attachments,
          sourceMode: 'none',
          purchaseOrderId: null,
          noPriorApprovalReason: 'Changed business needs fresh approval',
        },
      ),
      service.transition(
        String(raceDraft.id),
        'retryCash',
        users.applicant.user.id,
        raceBefore.lifecycleVersion,
        randomUUID(),
      ),
    ]);
    expect(race.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    const raceAfter = (
      await service.detail(String(raceDraft.id), users.applicant.user.id)
    ).record;
    expect(['revision', 'cashier']).toContain(raceAfter.status);
    const raceTotals = await orders.paymentTotals(orderId);
    expect(raceTotals.pendingCents).toBe(
      raceAfter.status === 'revision' ? 0 : 6000,
    );
    if (raceAfter.status === 'revision') {
      expect(raceAfter.sourceOrderId).toBeNull();
      await expect(
        act(String(raceDraft.id), 'cashier', 'complete', {
          voucherNumber: 'Stale',
          voucherAttachments: [],
        }),
      ).rejects.toThrow();
      await service.transition(
        String(raceDraft.id),
        'submit',
        users.applicant.user.id,
        raceAfter.lifecycleVersion,
        randomUUID(),
      );
      expect(
        (await service.detail(String(raceDraft.id), users.applicant.user.id))
          .record.status,
      ).toBe('head');
    }
    const cleanup = (
      await service.detail(String(raceDraft.id), users.applicant.user.id)
    ).record;
    await service.transition(
      String(raceDraft.id),
      'terminate',
      administrator.user.id,
      cleanup.lifecycleVersion,
      randomUUID(),
      { reason: 'Race cleanup' },
    );
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 12000,
      pendingCents: 0,
    });

    // Verify the fresh source/version check occurs after public source locks,
    // and an intervening mutation aborts the complete prelude transaction.
    const stale = await prepare();
    const publicLock = orders.lockPaymentSources.bind(orders);
    let intervened = false;
    const lockSpy = vi
      .spyOn(orders, 'lockPaymentSources')
      .mockImplementation(async (ids, connection) => {
        await publicLock(ids, connection);
        if (!intervened) {
          intervened = true;
          await connection.repository('paymentRequests').updateMany({
            filter: { id: stale.id },
            values: {
              purchaseOrderId: null,
              lifecycleVersion: Number(stale.lifecycleVersion) + 1,
            },
          });
        }
      });
    await expect(
      service.transition(
        String(stale.id),
        'submit',
        users.applicant.user.id,
        Number(stale.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow('source changed');
    lockSpy.mockRestore();
    const unchanged = (
      await service.detail(String(stale.id), users.applicant.user.id)
    ).record;
    expect(unchanged.purchaseOrderId).toBe(orderId);
    expect(unchanged.lifecycleVersion).toBe(stale.lifecycleVersion);
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 12000,
      pendingCents: 0,
    });

    const duplicateInvoice = await prepare({
      ...input(),
      invoiceNumber: normal.record.invoiceNumber,
    });
    await expect(
      service.transition(
        String(duplicateInvoice.id),
        'submit',
        users.applicant.user.id,
        Number(duplicateInvoice.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow();
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: 12000,
      pendingCents: 0,
    });
    const foreignEvidence = (
      await service.create(input(), users.applicant.user.id)
    ).record;
    await expect(
      service.transition(
        String(foreignEvidence.id),
        'edit',
        users.applicant.user.id,
        Number(foreignEvidence.lifecycleVersion),
        randomUUID(),
        { ...input(), attachments: normal.record.attachments },
      ),
    ).rejects.toThrow();

    const cfo = await createUser(testApp, 'View-only CFO');
    await tx.repository('employees').createOne({
      values: {
        id: randomUUID(),
        code: randomUUID(),
        name: 'View-only CFO',
        userId: cfo.user.id,
        status: 'regular',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await org.addDutyRoleMember('cfo', cfo.user.id, {
      actorId: administrator.user.id,
    });
    const bankSet = (await authz.permissionSets.get('oa-payment-cfo'))!;
    await authz.permissionSets.update(bankSet.key, {
      ...bankSet,
      grants: bankSet.grants.map((grant) => ({
        ...grant,
        actions: grant.actions.filter(
          (action) => action.action !== 'paymentAccount',
        ),
      })),
    });
    expect(
      (await cfo.fetch(`/paymentRequests/${normal.record.id}`)).status,
    ).toBe(200);
    expect(
      (await cfo.fetch(`/paymentRequests/${normal.record.id}/paymentAccount`))
        .status,
    ).toBe(403);
    await authz.permissionSets.update(bankSet.key, bankSet);

    const cashVendor = await c.resolve(vendorServiceToken).create(
      {
        code: 'CASH-' + randomUUID(),
        name: 'Cash supplier',
        category: 'Office',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        bankName: '',
        bankAccount: '',
        bankAccountName: '',
        actorId: administrator.user.id,
        reason: 'Cash account fixture',
      },
      tx,
    );
    const cashDraft = await prepare({
      ...input(),
      sourceMode: 'none',
      purchaseOrderId: null,
      noPriorApprovalReason: 'Cash expense',
      vendorId: cashVendor.id,
      paymentMethod: 'cash',
      amountCents: 1,
    });
    await service.transition(
      String(cashDraft.id),
      'submit',
      users.applicant.user.id,
      Number(cashDraft.lifecycleVersion),
      randomUUID(),
    );
    await act(String(cashDraft.id), 'head', 'approve');
    await act(String(cashDraft.id), 'finance', 'approve');
    await act(String(cashDraft.id), 'cashier', 'claim');
    const cashEvidence = await upload(
      String(cashDraft.id),
      'cashier',
      'voucher',
    );
    await act(String(cashDraft.id), 'cashier', 'complete', {
      voucherNumber: 'CASH-RECEIPT',
      voucherAttachments: [cashEvidence.id],
    });
    expect(
      (await service.detail(String(cashDraft.id), users.applicant.user.id))
        .record.status,
    ).toBe('paid');

    await org.updateDepartment(
      department.id,
      { executiveId: users.head.user.id },
      { actorId: administrator.user.id },
    );
    await org.addDutyRoleMember('gm', users.head.user.id, {
      actorId: administrator.user.id,
    });
    const large = await prepare({
      ...input(),
      sourceMode: 'none',
      purchaseOrderId: null,
      noPriorApprovalReason: 'Unplanned large expense',
      amountCents: 100000000,
    });
    await service.transition(
      String(large.id),
      'submit',
      users.applicant.user.id,
      Number(large.lifecycleVersion),
      randomUUID(),
    );
    await act(String(large.id), 'head', 'approve');
    await act(String(large.id), 'finance', 'approve');
    expect(
      (await service.detail(String(large.id), users.applicant.user.id)).record
        .status,
    ).toBe('executive');
    await act(String(large.id), 'head', 'approve');
    const merged = (
      await service.detail(String(large.id), users.applicant.user.id)
    ).record;
    expect(merged.status).toBe('cashier');
    expect(merged.gmMerged).toMatchObject({
      personId: users.head.user.id,
      stages: ['executive', 'gm'],
    });
    await service.transition(
      String(large.id),
      'terminate',
      administrator.user.id,
      merged.lifecycleVersion,
      randomUUID(),
      { reason: 'Cancel fixture' },
    );
    for (const [cents, expected] of [
      [5000000, 'cashier'],
      [20000000, 'executive'],
    ] as const) {
      const boundary = await prepare({
        ...input(),
        sourceMode: 'none',
        purchaseOrderId: null,
        noPriorApprovalReason: 'Exact threshold',
        amountCents: cents,
      });
      await service.transition(
        String(boundary.id),
        'submit',
        users.applicant.user.id,
        Number(boundary.lifecycleVersion),
        randomUUID(),
      );
      await act(String(boundary.id), 'head', 'approve');
      await act(String(boundary.id), 'finance', 'approve');
      expect(
        (await service.detail(String(boundary.id), users.applicant.user.id))
          .record.status,
      ).toBe(expected);
      if (expected === 'executive') {
        await act(String(boundary.id), 'head', 'approve');
        const exactGm = (
          await service.detail(String(boundary.id), users.applicant.user.id)
        ).record;
        expect(exactGm.status).toBe('cashier');
        expect(exactGm.gmMerged).toBeNull();
        expect(exactGm.gmApprovedAt).toBeNull();
      }
      const finished = (
        await service.detail(String(boundary.id), users.applicant.user.id)
      ).record;
      await service.transition(
        String(boundary.id),
        'terminate',
        administrator.user.id,
        finished.lifecycleVersion,
        randomUUID(),
        { reason: 'Boundary cleanup' },
      );
    }

    // Public run-scoped administrator confirmation performs the same funding
    // settlement atomically, with a forced marker rather than a cashier receipt.
    const forcedDraft = await prepare();
    await service.transition(
      String(forcedDraft.id),
      'submit',
      users.applicant.user.id,
      Number(forcedDraft.lifecycleVersion),
      randomUUID(),
    );
    await act(String(forcedDraft.id), 'head', 'approve');
    await act(String(forcedDraft.id), 'finance', 'approve');
    const forceView = await service.detail(
      String(forcedDraft.id),
      administrator.user.id,
    );
    const forceOffer = offeredActions(
      forceView.taskActions,
      forceView.runActions,
      forceView.runs.map((v) => v.run),
    ).find((a) => a.name === 'forceComplete');
    expect(forceOffer).toBeDefined();
    expect(forceOffer!.target).toHaveProperty('runId');
    const forceInput = {
      target: forceOffer!.target,
      action: 'forceComplete',
      contentHash: forceView.runs.find(
        (v) =>
          'runId' in forceOffer!.target &&
          v.run.id === forceOffer!.target.runId,
      )!.run.contentHash,
      comment: 'Administrator explicitly recorded forced payment',
      input: { confirmedCents: 6000, voucherNumber: null },
      requestId: randomUUID(),
    };
    await expect(
      service.action(
        String(forcedDraft.id),
        { ...forceInput, input: { confirmedCents: 5999, voucherNumber: null } },
        administrator.user.id,
      ),
    ).rejects.toThrow();
    await expect(
      service.action(
        String(forcedDraft.id),
        forceInput,
        users.applicant.user.id,
      ),
    ).rejects.toThrow();
    const beforeForced = await orders.paymentTotals(orderId);
    const auditService = c.resolve(auditServiceToken),
      recordAudit = auditService.record.bind(auditService);
    const forceAudit = vi
      .spyOn(auditService, 'record')
      .mockImplementation(async (entry, connection) => {
        if (entry.action === 'paymentRequest.forcedPaid')
          throw new Error('Forced audit rollback');
        return recordAudit(entry, connection);
      });
    await expect(
      service.action(String(forcedDraft.id), forceInput, administrator.user.id),
    ).rejects.toThrow('Forced audit rollback');
    forceAudit.mockRestore();
    expect(await orders.paymentTotals(orderId)).toEqual(beforeForced);
    expect(
      await tx
        .repository('paymentRequestLedger')
        .findMany({ filter: { requestId: forcedDraft.id } }),
    ).toHaveLength(0);
    expect(
      await c
        .resolve(invoiceServiceToken)
        .forDocument(`oa.payment:${forcedDraft.id}`),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'held' })]),
    );
    await service.action(
      String(forcedDraft.id),
      { ...forceInput, requestId: randomUUID() },
      administrator.user.id,
    );
    expect(
      (await service.detail(String(forcedDraft.id), administrator.user.id))
        .record.status,
    ).toBe('forcedPaid');
    expect(await service.paymentFact(String(forcedDraft.id), tx)).toEqual(
      expect.objectContaining({ forced: true, cents: 6000 }),
    );
    expect(
      await c
        .resolve(invoiceServiceToken)
        .forDocument(`oa.payment:${forcedDraft.id}`),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'used' })]),
    );
    expect(await orders.paymentTotals(orderId)).toEqual({
      paidCents: beforeForced.paidCents + 6000,
      pendingCents: beforeForced.pendingCents - 6000,
    });
    await expect(
      service.action(
        String(forcedDraft.id),
        { ...forceInput, requestId: randomUUID() },
        administrator.user.id,
      ),
    ).rejects.toThrow();
    await org.updateDepartment(
      department.id,
      { managerId: null },
      { actorId: administrator.user.id },
    );
    const held = await prepare({
      ...input(),
      sourceMode: 'none',
      purchaseOrderId: null,
      noPriorApprovalReason: 'Unassigned fixture',
      amountCents: 1,
    });
    await service.transition(
      String(held.id),
      'submit',
      users.applicant.user.id,
      Number(held.lifecycleVersion),
      randomUUID(),
    );
    const adminHead = await service.detail(
      String(held.id),
      administrator.user.id,
    );
    const appoint = await administrator.fetch(
      `/paymentRequests/${held.id}/candidates?runId=${adminHead.runs.find((v) => v.run.status === 'head')!.run.id}&action=appoint`,
    );
    expect(appoint.status).toBe(200);
    expect(
      (
        await administrator.fetch(
          `/paymentRequests/${held.id}/candidates?taskId=${randomUUID()}&action=appoint`,
        )
      ).status,
    ).toBe(400);
    const notify = c.resolve(approvalNotificationServiceToken);
    const alarm = vi.spyOn(notify, 'alarm').mockResolvedValue(undefined);
    await service.maintenance();
    expect(alarm).toHaveBeenCalledWith(
      expect.objectContaining({
        recordId: held.id,
        kind: 'oa.payment',
        reason: 'unassigned',
        recipients: expect.arrayContaining([administrator.user.id]),
      }),
    );
    alarm.mockRestore();
  }, 120000);
});

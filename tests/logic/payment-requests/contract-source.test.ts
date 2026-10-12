import { contractLedgerServiceToken } from '../../../server/providers/contracts/contract.ts';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
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
const test = createPlatformAppTest();
for (const kind of ['vendor', 'customer'] as const)
  describe(`contract payments: ${kind} authoritative contract and actual cashier settlement`, () => {
    test('contract excess follows the staircase, actual cashier settles once, rollback and withdrawal preserve contract facts', async ({
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
        const key = `payment-test-${kind}-${name}`;
        await authz.permissionSets.create({
          key,
          title: key,
          grants: [
            composite('oa.contract', {
              ledger: {
                contracts: 'allRecords',
                contractVersions: 'allRecords',
              },
            }),
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
      await c.resolve(vendorServiceToken).applyQualification(
        {
          vendorId: vendor.id,
          expectedVersion: vendor.version,
          qualificationId: randomUUID(),
          actorId: users.head.user.id,
          reason: 'Approved qualification fixture',
          outcome: 'qualified',
          qualificationExpiry: '2027-12-31',
        },
        tx,
      );
      const contracts = c.resolve(contractLedgerServiceToken),
        contractId = randomUUID();
      const contractFacts = {
        contractType: 'purchase',
        counterparty:
          kind === 'vendor'
            ? {
                kind: 'vendor' as const,
                id: vendor.id,
                name: vendor.name,
                category: vendor.category,
              }
            : { kind: 'customer' as const, name: 'Customer contract' },
        startsOn: '2026-10-01',
        endsOn: '2027-10-01',
        paymentTerms: 'net 30',
        standardTemplate: true,
        textVersionId: 'text-v1',
        attachments: [],
      };
      const contractCommand = () => ({
        actorId: users.head.user.id,
        requestKey: randomUUID(),
        reason: 'Approved contract fixture',
      });
      await db.transaction(async (connection) => {
        await contracts.createCandidate(
          {
            ...contractCommand(),
            id: contractId,
            requestId: contractId,
            applicantId: users.applicant.user.id,
            departmentId: department.id,
            amountCents: 10000,
            facts: contractFacts,
          },
          connection,
        );
        await contracts.publish(
          {
            ...contractCommand(),
            contractId,
            requestId: contractId,
            baseVersion: 0,
            number: 'CT-' + contractId,
            amountCents: 10000,
            facts: contractFacts,
          },
          connection,
        );
      });
      const totals = async () => {
        const source = (await contracts.source(contractId, tx))!;
        return { paidCents: source.paidCents, pendingCents: source.heldCents };
      };
      const service = c.resolve(
        paymentRequestServiceToken,
      ) as PaymentRequestService;
      const input = (): PaymentRequestInput => ({
        reason: 'Supplier installment',
        sourceMode: 'contract',
        purchaseOrderId: null,
        contractId,
        contractVersion: 1,
        noPriorApprovalReason: '',
        vendorId: kind === 'vendor' ? vendor.id : null,
        amountCents: 6000,
        invoiceNumber: randomUUID(),
        attachments: [],
        paymentMethod: kind === 'vendor' ? 'bankTransfer' : 'cash',
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
        const created = await users.applicant.fetch(
          '/paymentRequests',
          write('POST', { ...data, requestId: randomUUID() }),
        );
        expect({
          status: created.status,
          body: created.status >= 400 ? await created.json() : undefined,
        }).toMatchObject({ status: 201 });
        const draft = (await created.json()).data.record;
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
      const denied = await createUser(testApp, 'No contract grant');
      const unauthorizedOptions = await denied.fetch(
        '/paymentRequests/options',
      );
      expect(unauthorizedOptions.status).toBe(200);
      expect((await unauthorizedOptions.json()).data.contracts).toEqual([]);
      expect(
        (
          await denied.fetch(
            '/paymentRequests',
            write('POST', { ...input(), requestId: randomUUID() }),
          )
        ).status,
      ).toBe(403);
      const candidateResponse = await users.applicant.fetch(
        '/paymentRequests/options',
      );
      expect(candidateResponse.status).toBe(200);
      expect((await candidateResponse.json()).data.contracts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: contractId,
            version: 1,
            counterparty: contractFacts.counterparty,
          }),
        ]),
      );
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
      expect(await totals()).toEqual({
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
        contracts.settlePayment(
          {
            ...contractCommand(),
            actorId: users.cashier.user.id,
            contractId,
            expectedVersion: 1,
            reference: `oa.payment:${normal.record.id}:${contractId}`,
          },
          (connection) =>
            service.confirm(
              {
                paymentId: normal.record.id,
                purchaseOrderId: '',
                contractId,
                actorId: users.cashier.user.id,
                cents: normal.record.amountCents,
              },
              connection,
            ),
          tx,
        ),
      ).rejects.toThrow('actual claimed cashier');
      expect(await totals()).toEqual({
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
      expect(await totals()).toEqual({
        paidCents: 0,
        pendingCents: 12000,
      });
      expect(
        await tx
          .repository('paymentRequestLedger')
          .count({ filter: { requestId: normal.record.id } }),
      ).toBe(0);
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
        await c
          .resolve(invoiceServiceToken)
          .forDocument(`oa.payment:${normal.record.id}`),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ state: 'used', cents: 6000 }),
        ]),
      );
      expect(await totals()).toEqual({
        paidCents: 6000,
        pendingCents: 6000,
      });
      expect((await orders.get(orderId))?.status).toBe('awaitingReceipt');
      expect((await users.head.fetch(voucherUrl)).status).toBe(200);
      expect(
        await tx
          .repository('contractMoneyLedger')
          .count({ filter: { contractId, kind: 'settle' } }),
      ).toBe(1);
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
      expect(await totals()).toEqual({
        paidCents: 6000,
        pendingCents: 0,
      });
      const returned = await prepare({ ...input(), amountCents: 1000 });
      await service.transition(
        String(returned.id),
        'submit',
        users.applicant.user.id,
        Number(returned.lifecycleVersion),
        randomUUID(),
      );
      await act(String(returned.id), 'finance', 'return', { to: 'revision' });
      expect(await totals()).toEqual({ paidCents: 6000, pendingCents: 1000 });
      const revision = (
        await service.detail(String(returned.id), users.applicant.user.id)
      ).record;
      await service.transition(
        revision.id,
        'withdraw',
        users.applicant.user.id,
        revision.lifecycleVersion,
        randomUUID(),
      );
      expect(await totals()).toEqual({ paidCents: 6000, pendingCents: 0 });
      const switchDraft = await prepare({ ...input(), amountCents: 1000 });
      await service.transition(
        String(switchDraft.id),
        'submit',
        users.applicant.user.id,
        Number(switchDraft.lifecycleVersion),
        randomUUID(),
      );
      await act(String(switchDraft.id), 'finance', 'approve');
      await act(String(switchDraft.id), 'cashier', 'claim');
      await act(String(switchDraft.id), 'cashier', 'unable');
      const beforeSwitch = (
        await service.detail(String(switchDraft.id), users.applicant.user.id)
      ).record;
      const switched = await service.transition(
        beforeSwitch.id,
        'reviseBusiness',
        users.applicant.user.id,
        beforeSwitch.lifecycleVersion,
        randomUUID(),
        {
          ...input(),
          amountCents: 1000,
          sourceMode: 'none',
          contractId: null,
          contractVersion: null,
          purchaseOrderId: null,
          vendorId: vendor.id,
          noPriorApprovalReason: 'Independent payment',
          attachments: beforeSwitch.attachments,
        },
      );
      expect(await totals()).toEqual({ paidCents: 6000, pendingCents: 0 });
      expect(
        await tx
          .repository('paymentPayees')
          .findOne({ filter: { requestId: beforeSwitch.id } }),
      ).toMatchObject({ bankName: '', bankAccount: '', bankAccountName: '' });
      await service.transition(
        beforeSwitch.id,
        'withdraw',
        users.applicant.user.id,
        Number(switched.record.lifecycleVersion),
        randomUUID(),
      );
      const stale = await prepare({ ...input(), amountCents: 500 });
      await db.transaction((connection) =>
        contracts.publish(
          {
            ...contractCommand(),
            contractId,
            requestId: randomUUID(),
            baseVersion: 1,
            number: 'CT-' + contractId,
            amountCents: 10000,
            facts: contractFacts,
          },
          connection,
        ),
      );
      await expect(
        service.transition(
          String(stale.id),
          'submit',
          users.applicant.user.id,
          Number(stale.lifecycleVersion),
          randomUUID(),
        ),
      ).rejects.toThrow('contract changed');
      expect(
        (await service.detail(String(stale.id), users.applicant.user.id)).record
          .status,
      ).toBe('draft');
      expect(await totals()).toEqual({ paidCents: 6000, pendingCents: 0 });
    }, 120000);
  });

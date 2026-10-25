// @vitest-environment node
import { it, vi } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.js';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
  employees,
  ALL,
} from '../../logic/employees/helpers.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'finance reconciles a paid request from its original detail at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'finance-integration',
      apiPort: 14161,
      vitePort: 15161,
      config: {
        financeIntegration: {
          enabled: true,
          instanceId: 'browser-fixture',
          baseUrl: 'https://finance.example/oa/',
          token: 'synthetic-only',
        },
      },
    });
    const original = globalThis.fetch;
    let wire: { idempotencyKey: string; payloadHash: string } | undefined;
    let sends = 0;
    const remote = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const target = String(input instanceof Request ? input.url : input);
        if (!target.startsWith('https://finance.example/oa/'))
          return original(input, init);
        if (init?.method === 'POST') {
          wire = JSON.parse(String(init.body));
          sends++;
          return Response.json({
            idempotencyKey: wire!.idempotencyKey,
            payloadHash: wire!.payloadHash,
            state: 'accepted',
          });
        }
        return Response.json({
          idempotencyKey: wire!.idempotencyKey,
          payloadHash: wire!.payloadHash,
          state: 'posted',
          externalId: 'fixture-entry',
          voucherNumber: 'V-BROWSER-001',
        });
      });
    try {
      const c = h.testApp.application.container;
      const manager = await createEmployee(h.testApp, 'Finance manager');
      const applicant = await createEmployee(h.testApp, 'Expense applicant', {
        managerId: manager.employeeId,
      });
      const finance = await createEmployee(h.testApp, 'Finance operator');
      const cashier = await createEmployee(h.testApp, 'Expense cashier');
      const org = c.resolve(organizationServiceToken);
      const db = c.resolve(databaseManagerToken);
      const department = await org.createDepartment(
        { title: 'Expense team', managerId: manager.userId },
        { actorId: manager.userId },
      );
      await org.addMember(
        {
          departmentId: department.id,
          userId: applicant.userId,
          primary: true,
        },
        { actorId: manager.userId },
      );
      await org.addDutyRoleMember('finance', finance.userId, {
        actorId: manager.userId,
      });
      await org.addDutyRoleMember('cashier', cashier.userId, {
        actorId: manager.userId,
      });
      await db.transaction((tx) =>
        c.resolve(financeAssignmentServiceToken).create(
          {
            departmentId: department.id,
            accountantId: finance.userId,
            actorId: manager.userId,
            reason: 'Browser expense flow',
          },
          tx,
        ),
      );
      await employees(h.testApp).updateProfile(
        applicant.employeeId,
        {
          bankName: 'Synthetic bank',
          bankAccount: '6222000000000000001',
          bankAccountName: 'Expense applicant',
        },
        ALL,
        applicant.userId,
      );
      await grantToUser(
        h.testApp,
        randomUUID(),
        [
          {
            resource: { type: 'settings', id: 'oa.financeIntegration' },
            actions: [{ action: 'read' }, { action: 'send' }],
          },
          composite('oa.reimbursement', {
            view: { reimbursementRequests: 'allRecords' },
          }),
        ],
        finance.userId,
      );
      const draft = await c.resolve(reimbursementServiceToken).create(
        {
          reason: 'Actual workflow finance browser request',
          authorizationId: null,
          loanId: null,
          offsetCents: 0,
          overrunReason: '',
          lines: [
            {
              id: randomUUID(),
              category: 'other',
              date: '2026-10-25',
              amountCents: 500,
              invoiceNumber: 'TEST-INV',
              attachmentIds: [randomUUID()],
              standardExceptionReason: '',
            },
          ],
        },
        applicant.userId,
      );
      const service = c.resolve(reimbursementServiceToken);
      const files = c
        .resolve(serverFileRepositoryManagerToken)
        .repository('reimbursementAttachmentFiles', {
          connection: 'main',
          disk: 'local',
          accessPath: '/uploads/reimbursement',
          policy: {
            read: true,
            create: {
              scope: {
                reimbursementId: draft.record.id,
                ownerId: applicant.userId,
              },
              defaults: {
                reimbursementId: draft.record.id,
                ownerId: applicant.userId,
                uploadVersion: draft.record.lifecycleVersion,
              },
            },
            update: false,
            delete: false,
          },
        });
      const { record: file } = await files.uploadOne({
        file: new File(
          [Buffer.from('%PDF-1.7 synthetic expense invoice')],
          'expense.pdf',
          { type: 'application/pdf' },
        ),
      });
      await service.transition(
        draft.record.id,
        'edit',
        applicant.userId,
        draft.record.lifecycleVersion,
        randomUUID(),
        {
          reason: draft.record.reason,
          authorizationId: null,
          loanId: null,
          offsetCents: 0,
          overrunReason: '',
          lines: draft.record.lines.map((line) => ({
            ...line,
            attachmentIds: [file.id],
          })),
        },
      );
      const saved = await service.detail(draft.record.id, applicant.userId);
      await service.transition(
        draft.record.id,
        'submit',
        applicant.userId,
        saved.record.lifecycleVersion,
        randomUUID(),
      );
      const act = async (actorId: string, action: string) => {
        const current = await service.detail(draft.record.id, actorId);
        const offer = current.taskActions.find((row) =>
          row.actions.some((item) => item.name === action),
        );
        expect(offer, `${current.record.status}: ${action}`).toBeDefined();
        const run = current.runs.find(
          (row) => row.run.id === offer!.task.runId,
        )!;
        await service.action(
          draft.record.id,
          {
            target: { taskId: offer!.task.id },
            action,
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          actorId,
        );
      };
      await act(manager.userId, 'approve');
      await act(finance.userId, 'approve');
      expect(
        (await service.detail(draft.record.id, cashier.userId)).record.status,
      ).toBe('cashier');
      await act(cashier.userId, 'claim');
      const cashierPage = await h.pageFor(await cashier.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      const url = `${h.origin}${h.basePath}/approvals/mine/reimbursement/${draft.record.id}`;
      await cashierPage.goto(url);
      await cashierPage
        .getByRole('button', { name: 'Confirm payment', exact: true })
        .click();
      const paymentDrawer = cashierPage.getByRole('dialog', {
        name: /^Confirm payment reimbursement/,
      });
      await paymentDrawer
        .getByLabel('Payment voucher number', { exact: false })
        .fill('BANK-BROWSER-001');
      const payment = cashierPage.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname.includes(
            `/reimbursementRequests/${draft.record.id}/`,
          ),
      );
      await paymentDrawer
        .getByRole('button', { name: 'Confirm payment', exact: true })
        .click();
      await cashierPage
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Confirm payment', exact: true })
        .click();
      expect((await payment).status()).toBe(200);
      await expect(paymentDrawer).not.toBeVisible();
      expect(
        (await service.detail(draft.record.id, finance.userId)).record.status,
      ).toBe('paid');
      await expect(
        cashierPage.getByText('Paid', { exact: true }),
      ).toBeVisible();
      await cashierPage.screenshot({
        path: path.join(h.screenshotsDir, 'cashier-paid-en-375.png'),
        fullPage: true,
      });
      await cashierPage.close();
      const page = await h.pageFor(await finance.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await page.goto(url);
      const section = page.getByRole('region', {
        name: 'Finance system',
        exact: true,
      });
      await expect(section).toBeVisible({ timeout: 30000 });
      await section
        .getByRole('button', { name: 'Send to finance system' })
        .click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      expect(sends).toBe(0);
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Send', exact: true })
        .click();
      await expect(
        section.getByText(
          'Received by the finance system; posting not confirmed',
        ),
      ).toBeVisible();
      await section.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'finance-accepted-en-375.png'),
      });
      await section
        .getByRole('button', { name: 'Check external result' })
        .click();
      await expect(
        section.getByText('External voucher: V-BROWSER-001'),
      ).toBeVisible();
      await expect(
        section.getByRole('button', { name: 'Retry sending' }),
      ).toHaveCount(0);
      expect(sends).toBe(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'finance-posted-en-375.png'),
      });
      await page.close();
      const zh = await h.pageFor(await finance.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'zh-CN',
        colorScheme: 'dark',
      });
      await zh.goto(url);
      await expect(zh.getByText(/V-BROWSER-001/)).toBeVisible({
        timeout: 30000,
      });
      await zh.getByText(/V-BROWSER-001/).scrollIntoViewIfNeeded();
      await zh.screenshot({
        path: path.join(h.screenshotsDir, 'finance-posted-zh-375.png'),
      });
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            sends,
            checks: [
              'real uploaded invoice and public manager/finance approvals',
              'cashier confirms payment through original 375px drawer',
              'actual paid record detail',
              'confirmation before send',
              'accepted differs from posted',
              'lookup persists voucher',
              '375px no document overflow',
              'Chinese dark state',
            ],
            limit:
              'Synthetic users and gateway, real local payment lifecycle; no production payment or external posting',
          },
          null,
          2,
        ),
      );
    } finally {
      remote.mockRestore();
      await h.close();
    }
  },
  240000,
);

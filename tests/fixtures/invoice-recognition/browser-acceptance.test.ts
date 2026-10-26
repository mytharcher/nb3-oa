import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.js';
// @vitest-environment node
import { externalIntegrationsEnabled } from '../../../shared/external-integrations.js';
import { it, vi } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  employees,
  ALL,
} from '../../logic/employees/helpers.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
it.runIf(
  process.env.OA_BROWSER_ACCEPTANCE === '1' && externalIntegrationsEnabled,
)(
  'employee reviews OCR before saving a reimbursement and verifies its current facts at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'invoice-recognition',
      apiPort: 14171,
      vitePort: 15171,
      config: {
        invoiceRecognition: {
          enabled: true,
          instanceId: 'browser',
          baseUrl: 'https://invoice.example/oa/',
          token: 'synthetic',
        },
      },
    });
    const original = globalThis.fetch;
    const remote = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        if (!String(input).startsWith('https://invoice.example/oa/'))
          return original(input, init);
        const envelope = JSON.parse(String(init?.body));
        return Response.json({
          operationKey: envelope.operationKey,
          contentHash: envelope.contentHash,
          ...(envelope.operation === 'recognize'
            ? {
                state: 'recognized',
                facts: {
                  number: 'OCR-BROWSER-001',
                  date: '2026-10-25',
                  amountCents: 1200,
                },
              }
            : {
                state: 'valid',
                reference: 'VERIFY-BROWSER-001',
                checkedAt: new Date().toISOString(),
              }),
        });
      });
    try {
      const c = h.testApp.application.container,
        manager = await createEmployee(h.testApp, 'Invoice manager'),
        user = await createEmployee(h.testApp, 'Invoice employee', {
          managerId: manager.employeeId,
        }),
        finance = await createEmployee(h.testApp, 'Invoice accountant');
      const org = c.resolve(organizationServiceToken),
        db = c.resolve(databaseManagerToken);
      const department = await org.createDepartment(
        { title: 'Invoice team', managerId: manager.userId },
        { actorId: manager.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: user.userId, primary: true },
        { actorId: manager.userId },
      );
      await org.addDutyRoleMember('finance', finance.userId, {
        actorId: manager.userId,
      });
      await db.transaction((tx) =>
        c.resolve(financeAssignmentServiceToken).create(
          {
            departmentId: department.id,
            accountantId: finance.userId,
            actorId: manager.userId,
            reason: 'Invoice acceptance',
          },
          tx,
        ),
      );
      await employees(h.testApp).updateProfile(
        user.employeeId,
        {
          bankName: 'Synthetic bank',
          bankAccount: '6222000000000000001',
          bankAccountName: 'Invoice employee',
        },
        ALL,
        user.userId,
      );
      const draft = await c.resolve(reimbursementServiceToken).create(
        {
          reason: 'Synthetic invoice browser request',
          authorizationId: null,
          loanId: null,
          offsetCents: 0,
          overrunReason: '',
          lines: [
            {
              id: randomUUID(),
              category: 'other',
              date: '2026-10-24',
              amountCents: 1000,
              invoiceNumber: 'MANUAL',
              attachmentIds: [randomUUID()],
              standardExceptionReason: '',
            },
          ],
        },
        user.userId,
      );
      const files = c
        .resolve(serverFileRepositoryManagerToken)
        .repository('reimbursementAttachmentFiles', {
          connection: 'main',
          disk: 'local',
          accessPath: '/uploads/reimbursement',
          policy: {
            read: true,
            create: {
              scope: { reimbursementId: draft.record.id, ownerId: user.userId },
              defaults: {
                reimbursementId: draft.record.id,
                ownerId: user.userId,
                uploadVersion: draft.record.lifecycleVersion,
              },
            },
            update: false,
            delete: false,
          },
        });
      const bytes = Buffer.from('%PDF-1.7 synthetic invoice');
      const { record: file } = await files.uploadOne({
        file: new File([bytes], 'invoice.pdf', { type: 'application/pdf' }),
      });
      const line = draft.record.lines[0];
      await c
        .resolve(databaseManagerToken)
        .repository('reimbursementRequests')
        .updateOne({
          filter: { id: draft.record.id },
          values: { lines: [{ ...line, attachmentIds: [file.id] }] },
        });
      const page = await h.pageFor(await user.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      const base = `${h.origin}${h.basePath}`;
      await page.goto(
        `${base}/approvals/mine/editReimbursement/${draft.record.id}`,
      );
      await page
        .getByRole('button', { name: 'Recognize attachment 1', exact: true })
        .click({ timeout: 30000 });
      await expect(
        page
          .getByRole('dialog')
          .filter({ hasText: 'Review recognized invoice' }),
      ).toBeVisible();
      await expect(page.locator('input[id$="-invoiceNumber"]')).toHaveValue(
        'MANUAL',
      );
      await expect(
        page.getByRole('link', { name: 'invoice.pdf', exact: true }).last(),
      ).toBeVisible();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'invoice-review-en-375.png'),
      });
      await page
        .getByRole('button', { name: 'Apply to this line', exact: true })
        .click();
      await expect(page.locator('input[id$="-invoiceNumber"]')).toHaveValue(
        'OCR-BROWSER-001',
      );
      await expect(page.locator('input[id$="-amount"]')).toHaveValue('12.00');
      const saved = page.waitForResponse(
        (response) =>
          response.url().includes('/transition') &&
          response.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Save draft', exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      const service = c.resolve(reimbursementServiceToken);
      const current = await service.detail(draft.record.id, user.userId);
      await service.transition(
        draft.record.id,
        'submit',
        user.userId,
        current.record.lifecycleVersion,
        randomUUID(),
      );
      const managerView = await service.detail(draft.record.id, manager.userId);
      const offer = managerView.taskActions.find((value) =>
        value.actions.some((action) => action.name === 'approve'),
      )!;
      const run = managerView.runs.find(
        (value) => value.run.id === offer.task.runId,
      )!;
      await service.action(
        draft.record.id,
        {
          target: { taskId: offer.task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        manager.userId,
      );
      expect(
        (await service.detail(draft.record.id, finance.userId)).record.status,
      ).toBe('finance');
      await page.close();
      const financePage = await h.pageFor(await finance.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await financePage.goto(
        `${base}/approvals/mine/reimbursement/${draft.record.id}`,
      );
      await financePage
        .getByRole('button', {
          name: 'Verify invoice · attachment 1',
          exact: true,
        })
        .click({ timeout: 30000 });
      await expect(
        financePage.getByText(
          'External verification matched the current invoice facts.',
          { exact: true },
        ),
      ).toBeVisible();
      expect(
        await financePage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await financePage
        .getByText('Verification reference: VERIFY-BROWSER-001')
        .scrollIntoViewIfNeeded();
      await financePage.screenshot({
        path: path.join(h.screenshotsDir, 'invoice-verified-en-375.png'),
      });
      await financePage.close();
      const zh = await h.pageFor(await user.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'zh-CN',
        colorScheme: 'dark',
      });
      await zh.goto(`${base}/approvals/mine/reimbursement/${draft.record.id}`);
      await expect(
        zh.getByText('外部核验结果与当前发票信息一致。', { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await zh
        .getByText('核验查询编号：VERIFY-BROWSER-001')
        .scrollIntoViewIfNeeded();
      await zh.screenshot({
        path: path.join(h.screenshotsDir, 'invoice-verified-zh-375.png'),
      });
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            checks: [
              'protected actual attachment',
              'explicit review before apply',
              'original save transition',
              'current finance reviewer verifies after real manager approval',
              'applicant reloads shared verification with persisted current facts',
              '375px English and Chinese dark',
            ],
            limit:
              'Synthetic PDF bytes and gateway responses; no actual invoice issuer validation',
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
  120000,
);

// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { contractLedgerServiceToken } from '../../../server/providers/contracts/contract.js';

it.runIf(process.env.OA_CONTRACT_PAYMENTS_BROWSER === '1')(
  'real applicant contract picker, customer payee, source switch and 375px drawer',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'contract-payments',
      apiPort: 14167,
      vitePort: 15167,
    });
    const errors: string[] = [];
    try {
      const owner = await createEmployee(
        h.testApp,
        'Contract Payment Applicant',
      );
      const head = await createEmployee(h.testApp, 'Contract Payment Head');
      const c = h.testApp.application.container,
        org = c.resolve(organizationServiceToken),
        db = c.resolve(databaseManagerToken),
        contracts = c.resolve(contractLedgerServiceToken);
      const department = await org.createDepartment(
        { title: 'Contract Payment HQ', managerId: head.userId },
        { actorId: head.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: owner.userId, primary: true },
        { actorId: head.userId },
      );
      await grantToUser(
        h.testApp,
        'browser-contract-payment',
        [
          {
            resource: { type: 'page', id: 'oa-payment-requests' },
            actions: [{ action: 'access' }],
          },
          composite('oa.payment', {
            submit: { paymentRequests: 'allRecords' },
            view: { paymentRequests: 'allRecords' },
          }),
          composite('oa.contract', {
            ledger: { contracts: 'allRecords', contractVersions: 'allRecords' },
          }),
        ],
        owner.userId,
      );
      const id = randomUUID(),
        facts = {
          contractType: 'sale',
          counterparty: { kind: 'customer' as const, name: 'Browser Customer' },
          startsOn: '2026-10-01',
          endsOn: '2027-10-01',
          paymentTerms: 'cash',
          standardTemplate: true,
          textVersionId: 'v1',
          attachments: [],
        };
      const cmd = () => ({
        actorId: head.userId,
        requestKey: randomUUID(),
        reason: 'Synthetic browser contract',
      });
      await db.transaction(async (tx) => {
        await contracts.createCandidate(
          {
            ...cmd(),
            id,
            requestId: id,
            applicantId: owner.userId,
            departmentId: department.id,
            amountCents: 10000,
            facts,
          },
          tx,
        );
        await contracts.publish(
          {
            ...cmd(),
            contractId: id,
            requestId: id,
            baseVersion: 0,
            number: 'CT-BROWSER-001',
            amountCents: 10000,
            facts,
          },
          tx,
        );
      });
      const session = await owner.session();
      for (const locale of ['en-US', 'zh-CN']) {
        const page = await h.pageFor(session, {
          locale,
          viewport: { width: 375, height: 812 },
          colorScheme: 'dark',
        });
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          `${h.origin}${h.basePath}/paymentRequests/new?view=mine#contract-picker`,
          { waitUntil: 'domcontentloaded' },
        );
        await browserExpect(page.locator('#payment-sourceMode')).toBeEnabled({
          timeout: 60000,
        });
        await page.locator('#payment-sourceMode').click();
        await page
          .getByRole('option', {
            name: locale === 'en-US' ? 'Contract' : '合同',
            exact: true,
          })
          .click();
        await page.locator('#payment-contractId').click();
        await page.getByRole('option', { name: /CT-BROWSER-001/ }).click();
        await browserExpect(page.locator('#payment-contractId')).toContainText(
          'Browser Customer',
        );
        await browserExpect(page.locator('#payment-vendorId')).toHaveCount(0);
        await browserExpect(
          page.getByText(
            locale === 'en-US' ? 'Contract version: 1' : '合同版本: 1',
            { exact: true },
          ),
        ).toBeVisible();
        await page
          .locator('#payment-reason')
          .fill(locale === 'en-US' ? 'Customer installment' : '客户分期付款');
        await page.locator('#payment-amount').fill('60.00');
        const footer = page.locator('[data-slot="route-overlay-footer"]');
        await browserExpect(
          footer.getByRole('button', {
            name: locale === 'en-US' ? 'Save draft' : '保存为草稿',
            exact: true,
          }),
        ).toBeInViewport();
        await browserExpect(
          footer.getByRole('button', {
            name: locale === 'en-US' ? 'Submit' : '提交',
            exact: true,
          }),
        ).toBeInViewport();
        await page.screenshot({
          path: `${h.screenshotsDir}/${locale}-contract-picker-375-dark.png`,
          fullPage: true,
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.locator('#payment-sourceMode').click();
        await page
          .getByRole('option', {
            name: locale === 'en-US' ? 'No prior approval' : '无前置批准',
            exact: true,
          })
          .click();
        await browserExpect(page.locator('#payment-contractId')).toHaveCount(0);
        await browserExpect(page.locator('#payment-no-prior')).toBeVisible();
        await browserExpect(page.locator('#payment-reason')).toHaveValue(
          locale === 'en-US' ? 'Customer installment' : '客户分期付款',
        );
        await footer
          .getByRole('button', {
            name: locale === 'en-US' ? 'Cancel' : '取消',
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: locale === 'en-US' ? 'Discard changes' : '放弃修改',
            exact: true,
          })
          .click();
        await footer
          .getByRole('button', {
            name: locale === 'en-US' ? 'Cancel' : '取消',
            exact: true,
          })
          .click();
        await browserExpect(page).toHaveURL(
          /\/paymentRequests\?view=mine#contract-picker$/,
        );
        await page.close();
      }
      expect(errors).toEqual([]);
      console.info(
        'CONTRACT_PAYMENT_BROWSER',
        JSON.stringify({
          locale: ['en-US', 'zh-CN'],
          width: 375,
          theme: 'dark',
          screenshots: h.screenshotsDir,
          errors,
        }),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);

// @vitest-environment node
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  employees,
  ALL,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.js';
import { databaseManagerToken } from '@nocobase/db';
const proof = {
  name: 'mobile-proof.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT6sAAAAASUVORK5CYII=',
    'base64',
  ),
};
async function pickDay(page: Page, selector: string, date: string) {
  await page.locator(selector).click();
  const value = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US');
  const day = page.locator(`[data-day="${value}"]`).last();
  for (let attempt = 0; attempt < 3 && !(await day.isVisible()); attempt++)
    await page.getByRole('button', { name: /next month/i }).click();
  await day.click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function submit(page: Page, resource: string) {
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.includes(`/api/${resource}/`) &&
      new URL(r.url()).pathname.endsWith('/transition') &&
      r.request().method() === 'POST' &&
      r.request().postDataJSON()?.transition === 'submit',
  );
  await page
    .getByRole('button', { name: 'Submit', exact: true })
    .last()
    .click();
  const sent = await response;
  expect(await sent.text(), `submit ${resource}`).not.toContain('"error"');
  expect(sent.status()).toBe(200);
  const match = new URL(sent.url()).pathname.match(
    new RegExp(`/${resource}/([^/]+)/transition$`),
  );
  return match![1];
}
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'employees submit leave, outings and reimbursement and managers review evidence and approve/reject at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'mobile-approvals',
      apiPort: 14173,
      vitePort: 15173,
    });
    const checks: string[] = [],
      screenshots: string[] = [];
    try {
      const c = h.testApp.application.container,
        org = c.resolve(organizationServiceToken),
        calendar = c.resolve(calendarServiceToken),
        db = c.resolve(databaseManagerToken);
      const manager = await createEmployee(h.testApp, 'Mobile manager');
      const employee = await createEmployee(h.testApp, 'Mobile employee', {
        managerId: manager.employeeId,
      });
      const finance = await createEmployee(h.testApp, 'Mobile accountant');
      const department = await org.createDepartment(
        { title: 'Mobile acceptance team', managerId: manager.userId },
        { actorId: manager.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: employee.userId, primary: true },
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
            reason: 'Synthetic mobile acceptance setup',
          },
          tx,
        ),
      );
      await employees(h.testApp).updateProfile(
        employee.employeeId,
        {
          bankName: 'Synthetic bank',
          bankAccount: '6222000000000000001',
          bankAccountName: 'Mobile employee',
        },
        ALL,
        employee.userId,
      );
      const page = await h.pageFor(await employee.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      let reviewer = await h.pageFor(await manager.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      const pendingRequests = new Set<string>();
      page.on('request', (r) => pendingRequests.add(r.url()));
      page.on('requestfinished', (r) => pendingRequests.delete(r.url()));
      page.on('console', (m) => {
        if (m.type() === 'error') console.log('Mobile console', m.text());
      });
      page.on('requestfailed', (request) =>
        console.log('Mobile request failed', request.url(), request.failure()),
      );
      page.on('pageerror', (error) =>
        console.log('Mobile page error', error.message),
      );
      page.setDefaultTimeout(30000);
      reviewer.setDefaultTimeout(30000);
      const base = `${h.origin}${h.basePath}`;
      let day = calendar.addCalendarDays(calendar.localDate(new Date()), 2);
      while (!calendar.isWorkday(day)) day = calendar.addCalendarDays(day, 1);
      await page.goto(`${base}/taskCenter/newLeave`);
      await expect(page.locator('#leave-type')).toBeVisible();
      await page.locator('#leave-type').click();
      await page
        .getByRole('option', { name: 'Personal leave', exact: true })
        .click();
      await pickDay(page, '#leave-startDate', day);
      await pickDay(page, '#leave-endDate', day);
      await page
        .locator('#leave-reason')
        .pressSequentially('Mobile leave request');
      const uploaded = page.waitForResponse((r) =>
        r.url().includes('leaveAttachments/uploadOne'),
      );
      await page.locator('#leave-file').setInputFiles(proof);
      expect((await uploaded).ok()).toBe(true);
      await noOverflow(page);
      let shot = path.join(h.screenshotsDir, '375-leave-ready.png');
      await page.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      const leaveId = await submit(page, 'leaveRequests');
      checks.push(
        'Employee submits leave with a real uploaded attachment at 375px',
      );
      await reviewer.goto(`${base}/taskCenter`);
      await expect(
        reviewer.locator('[data-slot=task-open]').first(),
      ).toBeVisible();
      await reviewer.locator('[data-slot=task-open]').first().click();
      const attachment = reviewer
        .getByRole('link', { name: /mobile-proof/ })
        .first();
      await expect(attachment).toBeVisible();
      const bytes = await reviewer
        .context()
        .request.get(
          new URL((await attachment.getAttribute('href'))!, reviewer.url())
            .href,
        );
      expect(bytes.status()).toBe(200);
      expect(bytes.headers()['content-type']).toContain('image/png');
      const downloadPromise = reviewer.waitForEvent('download');
      await attachment.click();
      const download = await downloadPromise;
      expect(await download.failure()).toBeNull();
      await noOverflow(reviewer);
      shot = path.join(h.screenshotsDir, '375-leave-review.png');
      await reviewer.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      await reviewer
        .getByRole('button', { name: 'Approve', exact: true })
        .click();
      await reviewer
        .locator('#approval-comment')
        .pressSequentially('Reviewed on mobile');
      const approved = reviewer.waitForResponse(
        (r) =>
          r.url().includes(`/leaveRequests/${leaveId}/action`) &&
          r.request().method() === 'POST',
      );
      await reviewer
        .getByRole('button', { name: 'Approve', exact: true })
        .last()
        .click();
      expect((await approved).status()).toBe(200);
      checks.push(
        'Manager opens the real pending task, reads protected attachment bytes and approves with a comment',
      );
      await page.goto(`${base}/taskCenter/newOuting`);
      await expect(page.locator('#business-startAt'))
        .toBeVisible({ timeout: 60000 })
        .catch((error) => {
          console.log('Mobile pending', [...pendingRequests]);
          throw error;
        });
      await pickDay(page, '#business-startAt', day);
      await page.locator('input[type="time"]').nth(0).fill('10:00');
      await pickDay(page, '#business-endAt', day);
      await page.locator('input[type="time"]').nth(1).fill('11:00');
      await page
        .locator('#business-location')
        .pressSequentially('Customer office');
      await page
        .locator('#business-reason')
        .pressSequentially('Mobile outing request');
      await noOverflow(page);
      const outingId = await submit(page, 'outingRequests');
      reviewer = await h.pageFor(await manager.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await reviewer.goto(`${base}/taskCenter`);
      await expect(
        reviewer.locator('[data-slot=task-open]').first(),
      ).toBeVisible();
      await reviewer.locator('[data-slot=task-open]').first().click();
      await reviewer.getByRole('button', { name: 'More', exact: true }).click();
      await reviewer
        .getByRole('menuitem', { name: 'Reject', exact: true })
        .click();
      await reviewer
        .locator('#approval-comment')
        .pressSequentially('Need a different visit time');
      await reviewer
        .getByRole('button', { name: 'Reject', exact: true })
        .last()
        .click();
      const rejected = reviewer.waitForResponse(
        (r) =>
          r.url().includes(`/outingRequests/${outingId}/action`) &&
          r.request().method() === 'POST',
      );
      await reviewer
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Reject', exact: true })
        .click();
      expect((await rejected).status()).toBe(200);
      checks.push(
        'Employee submits an outing and manager rejects it with the required reason and confirmation at 375px',
      );
      await page.goto(`${base}/taskCenter/newReimbursement`);
      await expect(page.locator('#reimbursement-reason')).toBeVisible();
      await page
        .locator('#reimbursement-reason')
        .pressSequentially('Mobile reimbursement request');
      await page
        .getByRole('button', { name: 'Add expense line', exact: true })
        .click();
      const category = page.locator('[id^="line-"][id$="-category"]').first();
      await category.click();
      await page.getByRole('option', { name: 'Other', exact: true }).click();
      const expenseDate = calendar.localDate(new Date());
      await pickDay(page, '[id^="line-"][id$="-date"]', expenseDate);
      await page.locator('[id^="line-"][id$="-amount"]').first().fill('10.00');
      await page
        .locator('[id^="line-"][id$="-invoiceNumber"]')
        .first()
        .fill('MOBILE-SYNTHETIC-001');
      const evidence = page.waitForResponse((r) =>
        r.url().includes('reimbursementAttachments/uploadOne'),
      );
      await page.locator('input[type="file"]').first().setInputFiles(proof);
      expect((await evidence).ok()).toBe(true);
      await noOverflow(page);
      shot = path.join(h.screenshotsDir, '375-reimbursement-ready.png');
      await page.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      await submit(page, 'reimbursementRequests');
      checks.push(
        'Employee submits reimbursement with a real bank profile, designated accountant, expense line and uploaded evidence',
      );
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            date: new Date().toISOString(),
            checks,
            screenshots,
            isolation:
              'Disposable PostgreSQL, real application endpoints and synthetic role accounts; no API mocking',
          },
          null,
          2,
        ),
      );
    } catch (error) {
      for (const [index, context] of h.browser.contexts().entries())
        for (const p of context
          .pages()
          .filter((p) => p.url().startsWith(h.origin))) {
          console.log(
            'Mobile failure page',
            p.url(),
            await p.locator('body').innerText(),
          );
          await p
            .screenshot({
              path: path.join(h.screenshotsDir, `failure-${index}.png`),
              fullPage: true,
              timeout: 5000,
            })
            .catch(() => undefined);
        }
      throw error;
    } finally {
      await h.close();
    }
  },
  300000,
);

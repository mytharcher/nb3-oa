// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
it.runIf(process.env.OA_BATCH_BROWSER === '1')(
  'isolated ten-item manager batch approval, mobile scrolling and current view revocation',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'approval-batch',
      apiPort: 14175,
      vitePort: 15175,
    });
    try {
      const c = h.testApp.application.container;
      const manager = await createEmployee(h.testApp, 'Batch browser manager');
      const owner = await createEmployee(h.testApp, 'Batch browser applicant', {
        managerId: manager.employeeId,
      });
      const org = c.resolve(organizationServiceToken),
        ctx = { actorId: owner.userId };
      const department = await org.createDepartment(
        { title: 'Batch browser department', managerId: manager.userId },
        ctx,
      );
      await org.addMember(
        { departmentId: department.id, userId: owner.userId, primary: true },
        ctx,
      );
      const service = c.resolve(leaveServiceToken);
      const ids: string[] = [];
      for (let day = 1; day <= 10; day++) {
        const date = new Date(Date.UTC(2027, 1, 1 + (day - 1) * 7))
          .toISOString()
          .slice(0, 10);
        const draft = await service.create(
          {
            leaveType: 'personal',
            startDate: date,
            endDate: date,
            startHalf: 'am',
            endHalf: 'pm',
            reason: 'Synthetic batch browser',
            attachments: [],
            handoverUserId: null,
            enableDelegation: false,
          },
          owner.userId,
        );
        const id = String(draft.record.id);
        ids.push(id);
        await service.transition(
          id,
          'submit',
          owner.userId,
          Number(draft.record.lifecycleVersion),
          randomUUID(),
        );
      }
      const session = await manager.session(),
        page = await h.pageFor(session);
      let mutationRequests = 0;
      page.on('request', (request) => {
        if (
          new URL(request.url()).pathname.endsWith(
            '/approvalCenter/batchApprove',
          )
        )
          mutationRequests++;
      });
      await page.goto(`${h.origin}${h.basePath}/`);
      await page
        .getByRole('button', {
          name: 'Open task list · Batch approval',
          exact: true,
        })
        .click();
      await browserExpect(page).toHaveURL(/\/taskCenter/);
      await page.goto(
        `${h.origin}${h.basePath}/approvals/todo?kind=oa.leave&pageSize=20#batch`,
      );
      const checks = page.getByRole('checkbox');
      await browserExpect(checks).toHaveCount(10, { timeout: 90000 });
      for (let index = 0; index < 10; index++) await checks.nth(index).check();
      const batch = page.getByRole('button', {
        name: /Approve selected \(10\)|批量同意（10）/,
      });
      await browserExpect(batch).toBeEnabled();
      await batch.click();
      await browserExpect(page.getByRole('alertdialog')).toBeVisible();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${h.screenshotsDir}/confirm-desktop.png`,
      });
      for (const locale of process.env.OA_BATCH_BROWSER_SKIP_MATRIX === '1'
        ? []
        : ['en-US', 'zh-CN'])
        for (const theme of ['light', 'dark'])
          for (const preset of ['default', 'compact']) {
            const mobile = await h.pageFor(session, {
              locale,
              viewport: { width: 375, height: 812 },
            });
            await mobile.addInitScript(
              ({ theme, preset }) => {
                localStorage.setItem('nocobase:main:theme:color-scheme', theme);
                localStorage.setItem('nocobase:main:theme:preset', preset);
              },
              { theme, preset },
            );
            await mobile.goto(
              `${h.origin}${h.basePath}/approvals/todo?kind=oa.leave&pageSize=20#batch`,
            );
            await browserExpect(mobile.getByRole('checkbox')).toHaveCount(10, {
              timeout: 90000,
            });
            for (let index = 0; index < 10; index++)
              await mobile.getByRole('checkbox').nth(index).check();
            await mobile
              .getByRole('button', {
                name: /Approve selected \(10\)|批量同意（10）/,
              })
              .click();
            await browserExpect(mobile.getByRole('alertdialog')).toBeVisible();
            const list = mobile.getByRole('alertdialog').getByRole('list');
            await browserExpect(list.getByRole('listitem')).toHaveCount(10);
            if (
              await list.evaluate(
                (element) => element.scrollHeight > element.clientHeight,
              )
            ) {
              await list.evaluate((element) => {
                element.scrollTop = element.scrollHeight;
              });
              expect(
                await list.evaluate((element) => element.scrollTop > 0),
              ).toBe(true);
            }
            await browserExpect(
              list.getByRole('listitem').last(),
            ).toBeVisible();
            const footer = mobile.getByRole('button', {
              name: /^(Approve selected|确认同意)$/,
            });
            const box = await footer.boundingBox();
            expect(box!.y + box!.height).toBeLessThanOrEqual(812);
            expect(
              await mobile.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
            ).toBe(true);
            await mobile.waitForTimeout(350);
            await mobile.screenshot({
              path: `${h.screenshotsDir}/confirm-${locale}-${theme}-${preset}-375.png`,
              fullPage: true,
            });
            await mobile.context().close();
          }
      await page.keyboard.press('Escape');
      await browserExpect(page.getByRole('alertdialog')).toHaveCount(0);
      await browserExpect(batch).toBeFocused();
      await batch.click();
      // Permissions are revoked after the reviewed candidates exist, before the actual execution.
      const sets = c.resolve(authorizationToken).permissionSets,
        set = await sets.get('oa-leave-employee');
      await sets.update(set!.key, { ...set!, grants: [] });
      await page
        .getByRole('button', { name: /^(Approve selected|确认同意)$/ })
        .click();
      await browserExpect(
        page.getByRole('status').filter({ hasText: /Unavailable|已不可办理/ }),
      ).toBeVisible();
      await browserExpect(
        page
          .getByRole('status')
          .filter({ hasText: /Unavailable|已不可办理/ })
          .locator('p'),
      ).toHaveCount(10);
      expect(
        (await service.detail(ids[0], manager.userId)).runs
          .flatMap((v) => v.tasks)
          .some((v) => v.actorId === manager.userId),
      ).toBe(false);
      await sets.update(set!.key, set!);
      await page.reload();
      await browserExpect(checks).toHaveCount(10, { timeout: 90000 });
      for (let index = 0; index < 10; index++) await checks.nth(index).check();
      await batch.click();
      await page
        .getByRole('button', { name: /^(Approve selected|确认同意)$/ })
        .click();
      await browserExpect(
        page.getByRole('button', { name: /Approving|正在同意/ }),
      ).toBeDisabled();
      await page.keyboard.press('Escape');
      await browserExpect(page.getByRole('alertdialog')).toBeVisible();
      await browserExpect(
        page.getByRole('status').filter({ hasText: /Approved|已同意/ }),
      ).toBeVisible({ timeout: 180000 });
      await browserExpect(
        page
          .getByRole('status')
          .filter({ hasText: /Approved|已同意/ })
          .locator('p'),
      ).toHaveCount(10);
      expect(mutationRequests).toBe(2);
      await browserExpect(checks).toHaveCount(0);
      for (const id of ids)
        expect(
          (await service.detail(id, manager.userId)).runs
            .flatMap((v) => v.tasks)
            .filter(
              (v) => v.answer === 'approve' && v.actorId === manager.userId,
            ),
        ).toHaveLength(1);
      expect(new URL(page.url()).pathname).toBe(`${h.basePath}/taskCenter`);
      await page.setViewportSize({ width: 375, height: 812 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.waitForTimeout(350);
      await page.screenshot({
        path: `${h.screenshotsDir}/completed-mobile.png`,
        fullPage: true,
      });
    } finally {
      await h.close();
    }
  },
  600000,
);

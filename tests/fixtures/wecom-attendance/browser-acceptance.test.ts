// @vitest-environment node
import { it, vi } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { attendanceServiceToken } from '../../../server/providers/attendance/contract.js';
import { attendanceManagementServiceToken } from '../../../server/providers/attendance-management/contract.js';
import { createWecomAttendanceService } from '../../../server/providers/wecom-attendance/service.js';
import {
  wecomAttendanceServiceToken,
  type WecomAttendanceConfig,
} from '../../../server/providers/wecom-attendance/contract.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'HR runs real synchronization endpoints at desktop and 375px with only the external vendor response synthesized',
  async () => {
    const original = globalThis.fetch;
    let unavailable = false,
      vendorCalls = 0;
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.startsWith('https://qyapi.weixin.qq.com/cgi-bin/gettoken'))
          return Response.json({
            access_token: 'synthetic-only',
            expires_in: 7200,
          });
        if (
          url.startsWith(
            'https://qyapi.weixin.qq.com/cgi-bin/checkin/getcheckindata',
          )
        ) {
          vendorCalls++;
          return Response.json(
            unavailable ? { errcode: 45009 } : { errcode: 0, checkindata: [] },
          );
        }
        return original(input, init);
      });
    const h = await startIsolatedBrowserApp({
      name: 'wecom-attendance',
      apiPort: 14179,
      vitePort: 15179,
    });
    try {
      const c = h.testApp.application.container,
        org = c.resolve(organizationServiceToken),
        calendar = c.resolve(calendarServiceToken);
      const hr = await createEmployee(h.testApp, 'Source acceptance HR');
      await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      // Synthetic in-memory fixture configuration only; no business configuration file or real credential is changed.
      const config =
        h.testApp.application.config.get<WecomAttendanceConfig>(
          'wecomAttendance',
        )!;
      Object.assign(config, {
        enabled: true,
        corpId: 'synthetic-corp',
        secret: 'synthetic-secret',
        mappings: [{ wecomUserId: 'synthetic-native-hr', userId: hr.userId }],
      });
      // Install the unchanged production service factory with fixture configuration; HTTP/routes/database remain real.
      Object.assign(
        c.resolve(wecomAttendanceServiceToken),
        createWecomAttendanceService({
          config,
          db: c.resolve(databaseManagerToken),
          calendar,
          org: c.resolve(orgServiceToken),
          employees: c.resolve(employeeServiceToken),
          management: c.resolve(attendanceManagementServiceToken),
          attendance: c.resolve(attendanceServiceToken),
          audit: c.resolve(auditServiceToken),
        }),
      );
      const page = await h.pageFor(await hr.session(), { locale: 'en-US' }),
        base = `${h.origin}${h.basePath}`;
      await page.goto(`${base}/wecom-attendance`);
      await expect(
        page.getByText('Ready to synchronize 1 mapped employee.'),
      ).toBeVisible({ timeout: 30000 });
      const day = calendar.addCalendarDays(calendar.localDate(new Date()), -1);
      async function fillAndSubmit(reason: string) {
        await page
          .getByRole('button', { name: 'Synchronize', exact: true })
          .first()
          .click();
        for (const selector of ['#wecom-start', '#wecom-end']) {
          if ((await page.locator(selector).getAttribute('data-empty')) === 'false') continue;
          await page.locator(selector).click();
          const value = new Date(`${day}T12:00:00Z`).toLocaleDateString(
            'en-US',
          );
          const button = page.locator(`[data-day="${value}"]`).last();
          if (!(await button.isVisible()))
            await page.getByRole('button', { name: /previous month/i }).click();
          await button.click();
        }
        await page.locator('#wecom-reason').fill(reason);
        const response = page.waitForResponse(
          (r) =>
            r.url().endsWith('/wecomSource/sync') &&
            r.request().method() === 'POST',
        );
        await page
          .getByRole('button', { name: 'Synchronize', exact: true })
          .last()
          .click();
        expect((await response).status()).toBe(200);
      }
      await fillAndSubmit('Synthetic vendor browser acceptance');
      await expect(page.getByText('Completed', { exact: true })).toBeVisible();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'desktop-completed.png'),
        fullPage: true,
      });
      await page.setViewportSize({ width: 375, height: 812 });
      unavailable = true;
      await fillAndSubmit('Synthetic retry acceptance');
      await expect(
        page.getByText(/Some records could not be imported/).last(),
      ).toBeVisible();
      unavailable = false;
      const retry = page.waitForResponse(
        (r) =>
          r.url().endsWith('/wecomSource/sync') &&
          r.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Retry', exact: true })
        .last()
        .click();
      expect((await retry).status()).toBe(200);
      await expect(page.getByRole('dialog')).not.toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, '375-completed.png'),
        fullPage: true,
      });
      expect(vendorCalls).toBe(3);
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            vendorCalls,
            checks: [
              'HR configured status',
              'real sync endpoint commits a run',
              'vendor failure persists and same input retry completes',
              '375px no overflow',
            ],
            scope:
              'Disposable PostgreSQL and real business HTTP; external WeCom fetch only is synthesized, empty-source UI run; actual check-in/night-shift insertion independently verified in PostgreSQL service test',
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
      spy.mockRestore();
    }
  },
  180000,
);

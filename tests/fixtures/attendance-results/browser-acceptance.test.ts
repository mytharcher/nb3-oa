// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { attendanceManagementServiceToken } from '../../../server/providers/attendance-management/contract.js';
import {
  attendanceServiceToken,
  attendanceEvaluationServiceToken,
} from '../../../server/providers/attendance/index.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'corrects a missing punch through employee and manager UI and exports the recalculated month at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'attendance-results',
      apiPort: 14177,
      vitePort: 15177,
    });
    const screenshots: string[] = [];
    try {
      const c = h.testApp.application.container,
        db = c.resolve(databaseManagerToken),
        org = c.resolve(organizationServiceToken),
        calendar = c.resolve(calendarServiceToken),
        management = c.resolve(attendanceManagementServiceToken);
      const manager = await createEmployee(h.testApp, 'Attendance manager'),
        employee = await createEmployee(h.testApp, 'Attendance employee', {
          managerId: manager.employeeId,
        }),
        hr = await createEmployee(h.testApp, 'Attendance HR');
      await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      const department = await org.createDepartment(
        { title: 'Attendance acceptance', managerId: manager.userId },
        { actorId: manager.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: employee.userId, primary: true },
        { actorId: manager.userId },
      );
      let date = calendar.addCalendarDays(calendar.localDate(new Date()), -1);
      while (!calendar.isWorkday(date))
        date = calendar.addCalendarDays(date, -1);
      const shift = await db.transaction((tx) =>
        management.saveShift(
          {
            code: 'acceptance-day',
            enabled: true,
            expectedVersion: null,
            actorId: hr.userId,
            reason: 'Synthetic shift',
            definition: {
              name: 'Day',
              timeZone: calendar.timeZone(),
              lateToleranceMinutes: 0,
              earlyToleranceMinutes: 0,
              absenceThresholdMinutes: 480,
              intervals: [
                {
                  start: '09:00',
                  startDayOffset: 0,
                  end: '18:00',
                  endDayOffset: 0,
                },
              ],
            },
          },
          tx,
        ),
      );
      await db.transaction((tx) =>
        management.saveSchedule(
          {
            departmentId: department.id,
            date,
            shiftRevisionId: shift.revision.id,
            restDay: false,
            expectedVersion: null,
            actorId: hr.userId,
            reason: 'Synthetic schedule',
          },
          tx,
        ),
      );
      await c.resolve(attendanceServiceToken).ingestBatch(
        [
          {
            userId: employee.userId,
            date,
            punchKind: 'out',
            punchedAt: calendar
              .resolveLocalDateTime(date, '18:00')
              .toISOString(),
            source: 'synthetic-browser',
            sourceKey: 'checkout',
            sourceData: {},
          },
        ],
        { actorId: hr.userId },
      );
      const before = await c
        .resolve(attendanceEvaluationServiceToken)
        .evaluate({
          userId: employee.userId,
          date,
          actorId: hr.userId,
          requestKey: 'initial',
          reason: 'Synthetic missing punch setup',
        });
      expect(before.result.missingPunches).toBe(1);
      const options = {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      };
      const page = await h.pageFor(await employee.session(), options),
        reviewer = await h.pageFor(await manager.session(), options);
      page.setDefaultTimeout(30000);
      reviewer.setDefaultTimeout(30000);
      const base = `${h.origin}${h.basePath}`,
        url = `${base}/attendance-results?month=${date.slice(0, 7)}`;
      await page.goto(url);
      await page
        .getByRole('button', {
          name: 'Request check-in correction',
          exact: true,
        })
        .click();
      await expect(page.locator('#business-original')).toBeVisible();
      await page.locator('input[type=time]').fill('09:00');
      await page
        .locator('#business-reason')
        .fill('Forgot to clock in; worked the full scheduled day');
      await page
        .locator('#business-proof')
        .fill('Manager witnessed arrival at 09:00');
      const submitted = page.waitForResponse(
        (r) =>
          r.url().includes('/attendanceChangeRequests/') &&
          r.url().endsWith('/transition') &&
          r.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Submit', exact: true })
        .last()
        .click();
      const sent = await submitted;
      expect(await sent.text()).not.toContain('"error"');
      expect(sent.status()).toBe(200);
      const id = new URL(sent.url()).pathname.match(
        /attendanceChangeRequests\/([^/]+)\/transition/,
      )![1];
      await reviewer.goto(`${base}/taskCenter`);
      await reviewer.locator('[data-slot=task-open]').first().click();
      await reviewer
        .getByRole('button', { name: 'Approve', exact: true })
        .click();
      await reviewer
        .locator('#approval-comment')
        .fill('Confirmed full attendance');
      const approved = reviewer.waitForResponse(
        (r) =>
          r.url().includes(`/attendanceChangeRequests/${id}/action`) &&
          r.request().method() === 'POST',
      );
      await reviewer
        .getByRole('button', { name: 'Approve', exact: true })
        .last()
        .click();
      expect((await approved).status()).toBe(200);
      let shot = path.join(h.screenshotsDir, '375-approved.png');
      await reviewer.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      await page.goto(url);
      await page
        .getByRole('button', { name: 'Recalculate', exact: true })
        .click();
      await page
        .locator('#attendance-calculate-reason')
        .fill('Reconcile the approved correction');
      const calculated = page.waitForResponse(
        (r) =>
          r.url().includes('/attendanceResults/calculate') &&
          r.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Calculate', exact: true })
        .click();
      expect((await calculated).status()).toBe(200);
      await expect(page.getByText('Normal', { exact: true })).toBeVisible();
      const current = await page.request.get(
        `${base}/api/attendanceResults?month=${date.slice(0, 7)}`,
      );
      expect(current.status()).toBe(200);
      const result = (await current.json()).data;
      expect(result.summary).toMatchObject({
        normalDays: 1,
        exceptionDays: 0,
        missingPunches: 0,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      shot = path.join(h.screenshotsDir, '375-normal-month.png');
      await page.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      const hrPage = await h.pageFor(await hr.session(), options);
      await hrPage.goto(url);
      const download = hrPage.waitForEvent('download');
      await hrPage
        .getByRole('button', { name: 'Export month', exact: true })
        .click();
      const exported = await download;
      await exported.saveAs(path.join(h.screenshotsDir, 'attendance.csv'));
      shot = path.join(h.screenshotsDir, '375-hr-month.png');
      await hrPage.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            date: new Date().toISOString(),
            timeZone: calendar.timeZone(),
            checks: [
              'missing check-in prefilled',
              'employee submitted correction',
              'manager approved',
              'recalculated normal with zero missing punches',
              'whole-month summary',
              'HR CSV downloaded',
            ],
            screenshots,
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  180000,
);

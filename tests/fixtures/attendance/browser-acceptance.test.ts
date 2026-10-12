// @vitest-environment node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.runIf(process.env.OA_ATTENDANCE_BROWSER === '1')(
  'attendance configuration isolated HR browser acceptance',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'attendance-management',
      apiPort: 14148,
      vitePort: 15148,
    });
    const evidence = {
      checks: [] as string[],
      screenshots: [] as string[],
      errors: [] as string[],
    };
    const base = `${h.origin}${h.basePath}/attendance-management`;
    const go = (p: Page, suffix = '') =>
      p.goto(base + suffix, { waitUntil: 'domcontentloaded' });
    async function json(
      p: Page,
      suffix: string,
      method = 'GET',
      body?: unknown,
    ) {
      return p.evaluate(
        async ({ url, method, body }) => {
          const r = await fetch(url, {
            method,
            credentials: 'include',
            ...(body === undefined
              ? {}
              : {
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(body),
                }),
          });
          return { status: r.status, body: await r.json() };
        },
        {
          url: `${h.basePath}/api/attendanceManagement/${suffix}`,
          method,
          body,
        },
      );
    }
    const check = (s: string) => evidence.checks.push(s);
    let currentPage: Page | undefined;
    try {
      const hr = await createEmployee(h.testApp, 'Synthetic Attendance HR');
      const outsider = await createEmployee(
        h.testApp,
        'Synthetic Attendance Outsider',
      );
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      const department = await org.createDepartment(
        { title: 'Synthetic Attendance Department', managerId: null },
        { actorId: hr.userId },
      );
      const session = await hr.session(),
        page = await h.pageFor(session);
      currentPage = page;
      page.setDefaultTimeout(25000);
      page.on('pageerror', (e) => evidence.errors.push(e.message));
      await page.goto(`${h.origin}${h.basePath}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const baseline = [...evidence.errors];
      const swagger = await page.evaluate(
        async (url) => (await fetch(url)).json(),
        `${h.basePath}/api/swagger`,
      );
      expect(
        swagger.paths['/api/attendanceManagement/shifts'].post.operationId,
      ).toBe('saveAttendanceShift');
      await go(page);
      await page
        .getByRole('button', { name: 'Add shift', exact: true })
        .click();
      await page
        .locator('#attendance-shift-form-code')
        .pressSequentially('browser-day');
      await page
        .locator('#attendance-shift-form-name')
        .pressSequentially('Browser day');
      await page.locator('#attendance-shift-form-name').focus();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.imeSetComposition', {
        text: 'ban',
        selectionStart: 3,
        selectionEnd: 3,
      });
      await cdp.send('Input.insertText', { text: '班' });
      await expect(page.locator('#attendance-shift-form-name')).toHaveValue(
        'Browser day班',
      );
      await page
        .getByRole('button', { name: 'Add interval', exact: true })
        .click();
      await page.locator('#attendance-shift-form-0-start').fill('09:00');
      await page.locator('#attendance-shift-form-0-end').fill('18:00');
      await page
        .locator('#attendance-shift-form-lateToleranceMinutes')
        .fill('5');
      await page
        .locator('#attendance-shift-form-earlyToleranceMinutes')
        .fill('5');
      await page
        .locator('#attendance-shift-form-absenceThresholdMinutes')
        .fill('240');
      await page
        .locator('#attendance-shift-form-reason')
        .fill('Synthetic browser configuration');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'browser-day', exact: true }),
      ).toBeVisible();
      const first = (await json(page, 'shifts')).body.data[0];
      const original = (await json(page, `shifts/${first.id}`)).body.data;
      expect(first.currentRevision).toBe(1);
      check(
        'Q04 actual HR browser creates explicit shift; sequential typing and Chinese IME retain input',
      );
      await go(page, `/${first.id}/edit`);
      await expect(page.locator('#attendance-shift-form-code')).toHaveAttribute(
        'readonly',
        '',
      );
      await page
        .locator('#attendance-shift-form-name')
        .fill('Edited browser day');
      await page
        .locator('#attendance-shift-form-reason')
        .fill('Synthetic edit');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'browser-day', exact: true }),
      ).toBeVisible();
      await go(page, `/${first.id}/revisions/1`);
      await expect(
        page
          .getByRole('dialog')
          .getByRole('heading', { name: 'Browser day班', exact: true }),
      ).toBeVisible();
      expect(
        (await json(page, `shiftRevision?id=${original.revision.id}`)).body.data
          .name,
      ).toBe('Browser day班');
      check(
        'Q04 browser edit publishes revision 2; immutable revision 1 and code remain unchanged',
      );
      const query = `?tab=schedule&departmentId=${department.id}&date=2035-01-02`;
      await go(page, query);
      await expect(
        page.getByText(
          'No schedule is configured for this department and date. Attendance evaluation remains blocked.',
          { exact: true },
        ),
      ).toBeVisible();
      await page
        .getByRole('button', { name: 'Configure schedule', exact: true })
        .click();
      await page.locator('#attendance-shift-choice').click();
      await page
        .getByRole('option', {
          name: 'browser-day · Edited browser day',
          exact: true,
        })
        .click();
      await page
        .locator('#attendance-schedule-reason')
        .fill('Synthetic department schedule');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.locator('#attendance-schedule-reason')).toHaveCount(0);
      await expect(
        page.getByText('Scheduled working day', { exact: true }),
      ).toBeVisible();
      const current = (
        await json(
          page,
          `schedule?departmentId=${department.id}&date=2035-01-02`,
        )
      ).body.data;
      expect(current.revision.shiftRevisionId).not.toBe(original.revision.id);
      await page
        .getByRole('button', { name: 'Configure schedule', exact: true })
        .click();
      await page.getByRole('dialog').getByRole('checkbox').click();
      await page
        .locator('#attendance-schedule-reason')
        .fill('Explicit rest day');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.locator('#attendance-schedule-reason')).toHaveCount(0);
      await expect(
        page.getByText('Explicit rest day', { exact: true }).first(),
      ).toBeVisible();
      const rest = (
        await json(
          page,
          `schedule?departmentId=${department.id}&date=2035-01-02`,
        )
      ).body.data;
      expect(rest.revision.restDay).toBe(true);
      expect(rest.revision.shiftRevisionId).toBeNull();
      expect(
        (
          await json(
            page,
            `schedule?departmentId=${department.id}&date=2035-01-02&revision=1`,
          )
        ).body.data.revision.restDay,
      ).toBe(false);
      check(
        'Q05 browser missing configuration blocks; department exact revision schedule and explicit rest day preserve working history',
      );
      // A concurrent real write advances CAS while the browser keeps its original edit.
      await go(page, `/${first.id}/edit`);
      await expect(page.locator('#attendance-shift-form-name')).toHaveValue(
        'Edited browser day',
      );
      const latest = (await json(page, `shifts/${first.id}`)).body.data;
      expect(
        (
          await json(page, 'shifts', 'POST', {
            id: first.id,
            code: first.code,
            expectedVersion: latest.shift.version,
            enabled: true,
            definition: {
              name: 'Concurrent browser day',
              timeZone: latest.revision.timeZone,
              intervals: latest.revision.intervals,
              lateToleranceMinutes: latest.revision.lateToleranceMinutes,
              earlyToleranceMinutes: latest.revision.earlyToleranceMinutes,
              absenceThresholdMinutes: latest.revision.absenceThresholdMinutes,
            },
            reason: 'Concurrent synthetic writer',
          })
        ).status,
      ).toBe(200);
      await page
        .locator('#attendance-shift-form-name')
        .fill('Kept stale input');
      await page.locator('#attendance-shift-form-reason').fill('CAS attempt');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByText(
          'The configuration changed. Reload before saving. Your input has been kept.',
          { exact: true },
        ),
      ).toBeVisible();
      await expect(page.locator('#attendance-shift-form-name')).toHaveValue(
        'Kept stale input',
      );
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(page.locator('#attendance-shift-form-name')).toHaveValue(
        'Concurrent browser day',
      );
      check(
        'Q06 actual concurrent write returns 409; stale input retained, visible reload recovers latest version',
      );
      await go(page);
      const stranger = await h.pageFor(await outsider.session());
      await go(stranger);
      expect((await json(stranger, 'shifts')).status).toBe(403);
      await expect(
        stranger.getByText('Access denied', { exact: true }),
      ).toBeVisible();
      await expect(
        stranger.getByRole('button', { name: 'Add shift', exact: true }),
      ).toHaveCount(0);
      const sets =
        h.testApp.application.container.resolve(
          authorizationToken,
        ).permissionSets;
      const configured = (await sets.get('oa-attendance-management-hr'))!;
      await sets.update(configured.key, { ...configured, grants: [] });
      expect((await json(page, 'shifts')).status).toBe(403);
      await go(page);
      await expect(
        page.getByText('Access denied', { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Add shift', exact: true }),
      ).toHaveCount(0);
      await sets.update(configured.key, configured);
      await org.addMember(
        { departmentId: department.id, userId: hr.userId, primary: true },
        { actorId: hr.userId },
      );
      const scopedGrants = configured.grants.map((grant) =>
        grant.resource.type === 'composite'
          ? {
              ...grant,
              actions: grant.actions.map((action) => ({
                ...action,
                policy: {
                  type: 'composite' as const,
                  scopes: {
                    attendanceShifts: 'allRecords',
                    attendanceShiftRevisions: 'allRecords',
                    attendanceSchedules:
                      'oa.attendanceManagement.myDepartments',
                    attendanceScheduleRevisions: 'allRecords',
                  },
                },
              })),
            }
          : grant,
      );
      await sets.update(configured.key, {
        ...configured,
        grants: scopedGrants,
      });
      await go(page, query);
      await expect(
        page.getByText('Explicit rest day', { exact: true }).first(),
      ).toBeVisible();
      await org.removeMember(department.id, hr.userId, { actorId: hr.userId });
      expect(
        (
          await json(
            page,
            `schedule?departmentId=${department.id}&date=2035-01-02`,
          )
        ).body.data,
      ).toBeNull();
      expect(
        (
          await json(page, 'schedule', 'POST', {
            departmentId: department.id,
            date: '2035-01-03',
            restDay: true,
            shiftRevisionId: null,
            expectedVersion: null,
            reason: 'Out of current scope',
          })
        ).status,
      ).toBe(403);
      await go(page, query);
      await expect(
        page.getByText('Explicit rest day', { exact: true }),
      ).toHaveCount(0);
      await sets.update(configured.key, configured);
      check(
        'Q06 real persisted department scope re-evaluates current membership; inaccessible schedule cleared and creation rejected',
      );
      let failed = false;
      await page.route(
        '**/api/attendanceManagement/shifts?*',
        async (route) => {
          if (!failed) {
            failed = true;
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                error: { code: 'INTERNAL_ERROR', message: 'Synthetic failure' },
              }),
            });
          } else await route.continue();
        },
      );
      await go(page);
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(
        page.getByRole('link', { name: 'browser-day', exact: true }),
      ).toBeVisible();
      await page.unroute('**/api/attendanceManagement/shifts?*');
      check('Q06 transient 500 list failure recovers via visible Retry');
      await org.removeDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      expect((await json(page, 'shifts')).status).toBe(403);
      await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      check(
        'Q06 ordinary identity, current persisted grant revocation and real HR duty removal fail closed',
      );
      for (const locale of ['en-US', 'zh-CN'])
        for (const theme of ['light', 'dark'])
          for (const preset of ['compact', 'default']) {
            const visual = await h.pageFor(session, {
              locale,
              viewport: { width: 375, height: 812 },
            });
            await visual.addInitScript(
              ({ theme, preset }) => {
                localStorage.setItem('nocobase:main:theme:color-scheme', theme);
                localStorage.setItem('nocobase:main:theme:preset', preset);
              },
              { theme, preset },
            );
            await go(visual, `/${first.id}/edit`);
            await expect(
              visual.locator('#attendance-shift-form-name'),
            ).toHaveValue('Concurrent browser day');
            await expect(visual.locator('html')).toHaveClass(new RegExp(theme));
            await expect(visual.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            expect(
              await visual.evaluate(
                () =>
                  document.documentElement.scrollWidth > window.innerWidth + 1,
              ),
            ).toBe(false);
            const back = visual.getByRole('link', {
              name: locale === 'zh-CN' ? '返回' : 'Back',
              exact: true,
            });
            await expect(back).toBeVisible();
            await visual
              .locator('#attendance-shift-form-name')
              .fill('Dirty mobile');
            await back.click();
            await expect(visual.getByRole('alertdialog')).toBeVisible();
            await visual
              .getByRole('button', {
                name: locale === 'zh-CN' ? '继续编辑' : 'Continue editing',
                exact: true,
              })
              .click();
            await expect(visual.getByRole('alertdialog')).toBeHidden();
            const target = path.join(
              h.screenshotsDir,
              `mobile-${locale}-${theme}-${preset}.png`,
            );
            await visual.screenshot({ path: target, fullPage: true });
            evidence.screenshots.push(target);
            await visual.context().close();
          }
      check(
        'Q06 375px bilingual light/dark compact/default form and dirty mobile return guard verified',
      );
      expect(evidence.errors.filter((e) => !baseline.includes(e))).toEqual([]);
    } finally {
      if (currentPage)
        await currentPage
          .screenshot({
            path: path.join(h.screenshotsDir, 'final-state.png'),
            fullPage: true,
          })
          .catch(() => undefined);
      await writeFile(
        path.join(h.screenshotsDir, 'attendance-evidence.json'),
        JSON.stringify(evidence, null, 2),
      );
      await h.close();
    }
  },
  240000,
);

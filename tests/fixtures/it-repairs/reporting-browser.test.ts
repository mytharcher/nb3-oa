// @vitest-environment node
import { it, expect } from 'vitest';
import { expect as browserExpect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { ruleServiceToken } from '../../../server/providers/platform/index.js';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { createEmployee, grantToUser } from '../../logic/employees/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import type { Repair } from '../../../server/providers/it-repairs/service.js';
import en from '../../../client/locales/modules/it-repairs.en-US.js';
import zh from '../../../client/locales/modules/it-repairs.zh-CN.js';
it.runIf(process.env.OA_IT_REPAIR_BROWSER === '1')(
  'phase-three native roles use bilingual mobile filters, reports, CSV and restricted transfer',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'it-repairs-reporting',
      apiPort: 14287,
      vitePort: 15287,
      config: { oaApprovals: { inbox: 'demo-inbox' } },
    });
    try {
      const c = h.testApp.application.container,
        f = await prepareRepairs(h.testApp),
        authz = c.resolve(authorizationToken),
        e1 = await createEmployee(h.testApp, 'Browser query E1'),
        k = await createEmployee(h.testApp, 'Browser restricted lead');
      for (const [p, role] of [
        [f.a, 'handling-employee'],
        [f.a, 'reportEmployee'],
        [f.leader, 'handling-leader'],
        [f.leader, 'reportLeader'],
        [f.leader, 'securityTransfer'],
        [e1, 'handling-engineer'],
        [k, 'handling-leader'],
        [k, 'reportLeader'],
      ] as const)
        await authz.permissionSets.assign({
          permissionSet: `oa-it-repairs-${role}`,
          subject: { type: 'user', id: p.userId },
        });
      await authz.permissionSets.assign({
        permissionSet: 'oa-process-manager-itRepair',
        subject: { type: 'user', id: f.leader.userId },
      });
      await grantToUser(
        h.testApp,
        'browser-repair-rules',
        [
          {
            resource: { type: 'settings', id: 'oa.platform.rules' },
            actions: [{ action: 'read' }, { action: 'update' }],
          },
        ],
        f.admin.userId,
      );
      const a = await f.a.session(),
        l = await f.leader.session(),
        e = await e1.session(),
        s = await f.admin.session(),
        ks = await k.session();
      await c.resolve(ruleServiceToken).set({
        key: 'calendar.timeZone',
        value: 'Asia/Singapore',
        actorId: f.admin.userId,
      });
      for (const [id, title, leaders, engineers, categories, security] of [
        [
          'browser-general',
          'Browser General IT',
          [f.leader.userId],
          [e1.userId],
          ['device'],
          false,
        ],
        ['browser-secure', 'Browser Restricted IT', [k.userId], [], [], true],
      ] as const) {
        expect(
          (
            await s.fetch(
              `/itRepairs/groups/${id}`,
              write('POST', {
                requestKey: randomUUID(),
                expectedVersion: 0,
                title,
                leaderIds: leaders,
                engineerIds: engineers,
                categories,
                active: true,
                security,
              }),
            )
          ).status,
        ).toBe(200);
      }
      const create = async (title: string) => {
        const saved = (
          await (
            await a.fetch(
              '/itRepairs/save',
              write('POST', {
                requestKey: randomUUID(),
                draft: {
                  title,
                  description: 'Public synthetic failure',
                  category: 'device',
                  impact: 'partial',
                  location: 'Lab',
                  contact: '',
                  occurredAt: null,
                  assetId: null,
                },
              }),
            )
          ).json()
        ).data as Repair;
        return (
          await (
            await a.fetch(
              `/itRepairs/${saved.id}/submit`,
              write('POST', {
                requestKey: randomUUID(),
                expectedVersion: saved.version,
              }),
            )
          ).json()
        ).data as Repair;
      };
      const act = async (
        row: Repair,
        session: typeof a,
        action: string,
        data: Record<string, unknown> = {},
      ) => {
        const r = await session.fetch(
          `/itRepairs/${row.id}/actions`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: row.version,
            action,
            data,
          }),
        );
        expect(r.status).toBe(200);
        return (await r.json()).data as Repair;
      };
      for (const locale of ['en-US', 'zh-CN']) {
        const copy = (locale === 'zh-CN' ? zh : en).itRepairs;
        for (const session of [a, l, e, s, ks])
          await session.fetch('/i18n/locale', write('PUT', { locale }));
        await c.resolve(ruleServiceToken).set({
          key: 'itRepair.securityTransfer',
          value: 0,
          actorId: f.admin.userId,
        });
        let closed = await create(`报修 Browser closed ${locale}`);
        closed = await act(closed, l, 'triage', {
          priority: 'P3',
          advice: 'Investigate',
          assigneeId: e1.userId,
        });
        closed = await act(closed, e, 'start');
        closed = await act(closed, e, 'resolve', {
          cause: 'Cause',
          solution: 'Solution',
          completion: 'Done',
          resultType: 'restored',
        });
        await act(closed, a, 'accept', { rating: 5 });
        let repair = await create(`报修 Browser restricted ${locale}`);
        repair = await act(repair, l, 'triage', {
          priority: 'P3',
          advice: 'Investigate',
          assigneeId: e1.userId,
        });
        repair = await act(repair, e, 'start');
        const pages = await Promise.all(
            [a, l, e, s, ks].map((session) =>
              h.pageFor(session, {
                locale,
                viewport: { width: 375, height: 812 },
                timezoneId: 'Asia/Singapore',
              }),
            ),
          ),
          [ap, lp, ep, sp, kp] = pages;
        const errors: string[] = [];
        for (const p of pages)
          p.on('pageerror', (err) => errors.push(err.message));
        const visible = async (p: Page) =>
          expect(
            await p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        await ap.goto(`${h.origin}${h.basePath}/it-repair-reports`);
        await browserExpect(
          ap.getByRole('heading', { name: copy.reports, exact: true }),
        ).toBeVisible();
        await browserExpect(
          ap.getByText(copy.report.compliance, { exact: true }),
        ).toBeVisible();
        await ap
          .getByRole('link', { name: copy.query.filters, exact: true })
          .click();
        await browserExpect(
          ap.getByRole('button', { name: copy.query.preset90, exact: true }),
        ).toBeVisible();
        await ap
          .getByRole('button', {
            name: copy.query.presetLastMonth,
            exact: true,
          })
          .click();
        await ap
          .getByRole('button', { name: copy.query.apply, exact: true })
          .click();
        const companyMonth = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Singapore',
          year: 'numeric',
          month: '2-digit',
        })
          .format(new Date())
          .split('-')
          .map(Number);
        const previousStart = new Date(
          Date.UTC(companyMonth[0], companyMonth[1] - 2, 1) - 8 * 3600000,
        ).toISOString();
        const currentStart = new Date(
          Date.UTC(companyMonth[0], companyMonth[1] - 1, 1) - 8 * 3600000,
        ).toISOString();
        await browserExpect(ap).toHaveURL(
          (url) =>
            url.searchParams.get('from') === previousStart &&
            url.searchParams.get('to') === currentStart,
        );
        await ap
          .getByRole('link', { name: copy.query.filters, exact: true })
          .click();
        await ap
          .getByRole('button', { name: copy.query.preset7, exact: true })
          .click();
        await ap
          .getByRole('combobox', { name: copy.query.priority, exact: true })
          .click();
        await ap.getByRole('option', { name: 'P3', exact: true }).click();
        await ap
          .getByRole('button', { name: copy.query.apply, exact: true })
          .click();
        await browserExpect(ap).toHaveURL(
          (url) =>
            url.pathname.endsWith('/it-repair-reports') &&
            url.searchParams.has('from'),
        );
        await browserExpect(
          ap.getByText(new RegExp(copy.query.active)),
        ).toBeVisible();
        await visible(ap);
        await browserExpect(
          ap.getByText(copy.report.compliance, { exact: true }),
        ).toBeVisible();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-report.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await ap
          .getByText(copy.report.durations, { exact: true })
          .scrollIntoViewIfNeeded();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-durations.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await ap
          .getByRole('link', { name: copy.report.userClosed, exact: true })
          .first()
          .click();
        await browserExpect(ap).toHaveURL(
          (url) => url.searchParams.get('cohort') === 'userClosed',
        );
        await browserExpect(
          ap.getByRole('link', {
            name: `报修 Browser closed ${locale}`,
            exact: true,
          }),
        ).toBeVisible();
        const downloading = ap.waitForEvent('download');
        await ap
          .getByRole('button', { name: copy.export, exact: true })
          .click();
        const download = await downloading;
        expect(download.suggestedFilename()).toBe('it-repairs.csv');
        expect(await download.failure()).toBeNull();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-filtered-list.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await visible(ap);
        for (const control of [
          ap.getByRole('button', { name: copy.export, exact: true }),
          ap.getByRole('button', { name: /^(Refresh|刷新)$/ }).first(),
        ]) {
          const box = await control.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(375);
        }
        const search = ap.getByPlaceholder(copy.search);
        await search.click();
        await ap.keyboard.type('Browser');
        await search.press('Home');
        await ap.keyboard.type('Q');
        await browserExpect(search).toHaveValue('QBrowser');
        await search.press('Backspace');
        await browserExpect(search).toHaveValue('Browser');
        await search.fill('');
        const cdp = await ap.context().newCDPSession(ap);
        await cdp.send('Input.imeSetComposition', {
          text: 'baoxiu',
          selectionStart: 6,
          selectionEnd: 6,
        });
        await cdp.send('Input.insertText', { text: '报修' });
        await browserExpect(search).toHaveValue('报修');
        await browserExpect(ap).toHaveURL(
          (url) => url.searchParams.get('q') === '报修',
        );
        await cdp.detach();
        const activeQuery = new URL(ap.url()).search;
        await ap.route('**/api/itRepairs/export', (route) =>
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: { message: 'Synthetic export failure' },
            }),
          }),
        );
        await ap
          .getByRole('button', { name: copy.export, exact: true })
          .click();
        await browserExpect(
          ap.getByRole('button', { name: copy.export, exact: true }),
        ).toBeEnabled();
        expect(new URL(ap.url()).search).toBe(activeQuery);
        await ap.unroute('**/api/itRepairs/export');
        await ep.goto(`${h.origin}${h.basePath}/it-repairs`);
        await browserExpect(
          ep.getByRole('button', { name: copy.export, exact: true }),
        ).toHaveCount(0);
        await ep.goto(`${h.origin}${h.basePath}/it-repair-reports`);
        await browserExpect(
          ep.getByRole('heading', { name: copy.reports, exact: true }),
        ).toHaveCount(0);
        await lp.goto(
          `${h.origin}${h.basePath}/processManagement/definitions/oa.itRepair`,
        );
        await browserExpect(
          lp.getByText(copy.states.triage, { exact: true }).first(),
        ).toBeVisible();
        await visible(lp);
        await lp.goto(`${h.origin}${h.basePath}/it-repairs/${repair.id}`);
        await browserExpect(
          lp.getByText(repair.title, { exact: true }).first(),
        ).toBeVisible();
        const off = (
          await (await l.fetch(`/itRepairs/${repair.id}/handling`)).json()
        ).data.actions;
        expect(off).not.toContain('transferSecurity');
        await sp.goto(
          `${h.origin}${h.basePath}/it-repair-groups/browser-secure`,
        );
        await browserExpect(
          sp.getByRole('checkbox', { name: copy.securityGroup }),
        ).toBeChecked();
        await sp.screenshot({
          path: `${h.screenshotsDir}/${locale}-security-settings.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await sp.goto(`${h.origin}${h.basePath}/approval-rules?domain=sla`);
        await browserExpect(
          sp
            .getByText(
              locale === 'zh-CN'
                ? '安全转交开关（0关闭，1开启）'
                : 'Restricted transfer (0 off, 1 on)',
              { exact: true },
            )
            .first(),
        ).toBeVisible();
        await c.resolve(ruleServiceToken).set({
          key: 'itRepair.securityTransfer',
          value: 1,
          actorId: f.admin.userId,
        });
        await lp.goto(`${h.origin}${h.basePath}/it-repairs/${repair.id}`);
        await lp.getByRole('combobox', { name: copy.selectAction }).click();
        await lp
          .getByRole('option', {
            name: copy.actions.transferSecurity,
            exact: true,
          })
          .click();
        await lp
          .getByRole('button', { name: copy.openAction, exact: true })
          .click();
        await lp
          .getByRole('combobox', {
            name: copy.query.groupId,
            exact: true,
          })
          .click();
        await lp
          .getByRole('option', { name: 'Browser Restricted IT', exact: true })
          .click();
        await lp
          .locator('#handling-reason')
          .fill('Restricted synthetic response');
        await lp
          .getByRole('button', {
            name: copy.actions.transferSecurity,
            exact: true,
          })
          .click();
        await browserExpect(lp.getByRole('alertdialog')).toBeVisible();
        await lp.screenshot({
          path: `${h.screenshotsDir}/${locale}-security-confirm.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await lp
          .getByRole('alertdialog')
          .getByRole('button', {
            name: copy.actions.transferSecurity,
            exact: true,
          })
          .click();
        await browserExpect(lp).toHaveURL((url) =>
          url.pathname.endsWith('/it-repairs'),
        );
        await browserExpect(
          lp.getByRole('link', { name: repair.title, exact: true }),
        ).toHaveCount(0);
        await visible(lp);
        await browserExpect(lp.getByPlaceholder(copy.search)).toBeFocused();
        await kp.goto(`${h.origin}${h.basePath}/it-repairs/${repair.id}`);
        await browserExpect(
          kp.getByText(repair.title, { exact: true }).first(),
        ).toBeVisible();
        await browserExpect(
          kp.getByText(copy.timeline, { exact: true }),
        ).toBeVisible();
        await kp.screenshot({
          path: `${h.screenshotsDir}/${locale}-security-lead.png`,
          fullPage: true,
          animations: 'disabled',
        });
        await ap.goto(
          `${h.origin}${h.basePath}/it-repair-reports?from=2027-01-01T00%3A00%3A00Z&to=2027-02-01T00%3A00%3A00Z`,
        );
        await browserExpect(
          ap.getByText(copy.report.noData, { exact: true }).first(),
        ).toBeVisible();
        await ap
          .getByText(copy.report.noData, { exact: true })
          .first()
          .scrollIntoViewIfNeeded();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-no-samples.png`,
          fullPage: true,
          animations: 'disabled',
        });
        if (locale === 'en-US') {
          await ap.setViewportSize({ width: 1440, height: 1000 });
          await ap.goto(`${h.origin}${h.basePath}/it-repair-reports`);
          await browserExpect(
            ap.getByText(copy.report.compliance, { exact: true }),
          ).toBeVisible();
          await visible(ap);
          await ap.screenshot({
            path: `${h.screenshotsDir}/${locale}-desktop-report.png`,
            fullPage: true,
            animations: 'disabled',
          });
          const darkPage = await h.pageFor(a, {
            locale,
            viewport: { width: 375, height: 812 },
            colorScheme: 'dark',
            timezoneId: 'Asia/Singapore',
          });
          darkPage.on('pageerror', (err) => errors.push(err.message));
          await darkPage.goto(`${h.origin}${h.basePath}/it-repair-reports`);
          await browserExpect(
            darkPage.getByText(copy.report.compliance, { exact: true }),
          ).toBeVisible();
          await browserExpect(darkPage.locator('html')).toHaveClass(/dark/);
          await visible(darkPage);
          await darkPage.screenshot({
            path: `${h.screenshotsDir}/${locale}-dark-report.png`,
            fullPage: true,
            animations: 'disabled',
          });
          await darkPage.context().close();
        }
        expect(errors).toEqual([]);
        for (const p of pages) await p.context().close();
      }
    } finally {
      await h.close();
    }
  },
  240000,
);

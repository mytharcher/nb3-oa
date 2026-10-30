import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
// @vitest-environment node
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { write } from '../../logic/platform/helpers.js';
it.runIf(process.env.OA_IT_REPAIR_BROWSER === '1')(
  'employee and leader use real Chinese/English intake drawers at desktop and 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'it-repairs',
      apiPort: 14282,
      vitePort: 15282,
      config: { oaApprovals: { inbox: 'demo-inbox' } },
    });
    try {
      const f = await prepareRepairs(h.testApp),
        admin = await f.admin.session();
      const config = await admin.fetch(
        '/itRepairs/groups/it',
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          title: 'IT',
          leaderIds: [f.leader.userId],
          engineerIds: [],
          categories: ['device', 'network', 'software', 'account'],
          active: true,
        }),
      );
      expect(config.status).toBe(200);
      for (const locale of ['en-US', 'zh-CN']) {
        const employeeSession = await f.a.session();
        await employeeSession.fetch('/i18n/locale', write('PUT', { locale }));
        const page = await h.pageFor(employeeSession, {
          locale,
          viewport: { width: 375, height: 812 },
        });
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        const base = `${h.origin}${h.basePath}`;
        await page.goto(
          `${base}/${locale === 'en-US' ? 'newItRepair' : 'it-repairs/new'}`,
        );
        await browserExpect(page.locator('#repair-title')).toBeVisible({
          timeout: 60000,
        });
        await page
          .locator('#repair-title')
          .pressSequentially(`Repair ${locale}`);
        await page.locator('#repair-title').press('Enter');
        await browserExpect(page).toHaveURL(
          /(?:it-repairs|itRepair)\/[a-f0-9-]+/,
        );
        await page.reload();
        await browserExpect(page.locator('#repair-title')).toHaveValue(
          `Repair ${locale}`,
        );
        await page
          .getByRole('button', {
            name: locale === 'zh-CN' ? '提交' : 'Submit',
            exact: true,
          })
          .click();
        await browserExpect(
          page.locator('#repair-description'),
        ).toHaveAttribute('aria-invalid', 'true');
        await page
          .locator('#repair-description')
          .fill('Synthetic printer failure');
        await page.locator('#repair-location').fill('Test office');
        await page.locator('#repair-category').click();
        await page
          .getByRole('option', {
            name: locale === 'zh-CN' ? '设备' : 'Device',
            exact: true,
          })
          .click();
        await page.locator('#repair-impact').click();
        await page
          .getByRole('option', {
            name: locale === 'zh-CN' ? '本人部分受影响' : 'Partly affected',
            exact: true,
          })
          .click();
        await page
          .getByRole('button', {
            name: locale === 'zh-CN' ? '保存草稿' : 'Save draft',
            exact: true,
          })
          .click();
        await browserExpect(page).toHaveURL(
          /(?:it-repairs|itRepair)\/[a-f0-9-]+/,
        );
        await browserExpect(
          page.getByRole('button', {
            name: locale === 'zh-CN' ? '提交' : 'Submit',
            exact: true,
          }),
        ).toBeEnabled();
        const id = page.url().split('/').at(-1)!;
        await page.reload();
        await browserExpect(page.locator('#repair-title')).toHaveValue(
          `Repair ${locale}`,
        );
        await browserExpect(page.locator('input[type=file]')).toBeEnabled();
        await page.locator('input[type=file]').setInputFiles({
          name: 'fault.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Synthetic log'),
        });
        await browserExpect(
          page.getByText('fault.txt', { exact: true }).first(),
        ).toBeVisible();
        await page
          .getByRole('button', {
            name: locale === 'zh-CN' ? '提交' : 'Submit',
            exact: true,
          })
          .click();
        await browserExpect(
          page
            .getByText(locale === 'zh-CN' ? '待分诊' : 'Awaiting triage', {
              exact: true,
            })
            .last(),
        ).toBeVisible();
        await browserExpect(page.locator('#repair-draft-form')).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: `${h.screenshotsDir}/${locale}-employee-375.png`,
          fullPage: true,
        });
        const leaderSession = await f.leader.session();
        await leaderSession.fetch('/i18n/locale', write('PUT', { locale }));
        const leader = await h.pageFor(leaderSession, { locale });
        const repair = (
          await (await employeeSession.fetch(`/itRepairs/${id}`)).json()
        ).data;
        await browserExpect
          .poll(
            async () => {
              const messages = await h.testApp.application.container
                .resolve(inAppNotificationStoreToken)
                .list({ userId: f.a.userId, limit: 20 });
              return messages.some(
                (item) =>
                  item.body.includes(repair.number) &&
                  item.target?.type === 'route' &&
                  item.target.path === `/it-repairs/${id}`,
              );
            },
            { timeout: 10000 },
          )
          .toBe(true);
        await leader.goto(`${base}/taskCenter?source=oa.itRepair`);
        await leader
          .getByRole('button', { name: repair.number, exact: true })
          .click();
        await browserExpect(leader).toHaveURL(
          new RegExp(`taskCenter/itRepair/${id}`),
        );
        await browserExpect(
          leader.getByText(`Repair ${locale}`, { exact: true }).first(),
        ).toBeVisible({ timeout: 30000 });
        await leader.screenshot({
          path: `${h.screenshotsDir}/${locale}-leader.png`,
          fullPage: true,
        });
        const outsider = await h.pageFor(await f.b.session(), { locale });
        await outsider.goto(`${base}/it-repairs/${id}`);
        await browserExpect(
          outsider.getByText('Synthetic printer failure', { exact: true }),
        ).toHaveCount(0);
        await browserExpect(outsider.locator('[role=alert]')).toBeVisible({
          timeout: 30000,
        });
        expect(errors).toEqual([]);
        await page.context().close();
        await leader.context().close();
        await outsider.context().close();
      }
      // An intake accepted before its category has a group must become visible after configuration.
      const requester = await f.a.session();
      const orphanDraft = (
        await (
          await requester.fetch(
            '/itRepairs/save',
            write('POST', {
              requestKey: randomUUID(),
              draft: {
                title: 'Recovered outage',
                description: 'Synthetic missing category mapping',
                category: 'other',
                impact: 'partial',
                location: 'Test office',
                contact: '',
                occurredAt: null,
                assetId: null,
              },
            }),
          )
        ).json()
      ).data;
      const orphan = (
        await (
          await requester.fetch(
            `/itRepairs/${orphanDraft.id}/submit`,
            write('POST', {
              requestKey: randomUUID(),
              expectedVersion: orphanDraft.version,
            }),
          )
        ).json()
      ).data;
      expect(orphan.groupId).toBeNull();
      expect(
        (await (await f.leader.session()).fetch(`/itRepairs/${orphan.id}`))
          .status,
      ).toBe(403);
      const settings = await h.pageFor(await f.admin.session(), {
        locale: 'en-US',
      });
      await settings.goto(`${h.origin}${h.basePath}/it-repair-groups/it`);
      await browserExpect(settings.locator('#group-title')).toHaveValue('IT', {
        timeout: 30000,
      });
      await browserExpect(settings.locator('#group-leaderIds')).toBeVisible();
      await settings
        .getByRole('checkbox', { name: 'Other', exact: true })
        .check();
      await settings.getByRole('button', { name: 'Save', exact: true }).click();
      await browserExpect(settings).toHaveURL(/it-repair-groups$/);
      await settings
        .getByRole('button', { name: 'Recover unassigned repairs' })
        .click();
      await browserExpect(settings.getByRole('status')).toContainText(
        'No matching unassigned repairs remain.',
      );
      await settings.screenshot({
        path: `${h.screenshotsDir}/en-US-routing-recovery.png`,
        fullPage: true,
      });
      const recoveredLeader = await h.pageFor(await f.leader.session(), {
        locale: 'en-US',
      });
      await recoveredLeader.goto(
        `${h.origin}${h.basePath}/it-repairs/${orphan.id}`,
      );
      await browserExpect(
        recoveredLeader.getByText('Synthetic missing category mapping', {
          exact: true,
        }),
      ).toBeVisible();
      await recoveredLeader.screenshot({
        path: `${h.screenshotsDir}/en-US-recovered-leader.png`,
        fullPage: true,
      });
      await recoveredLeader.context().close();
      const repaired = (
        await (await requester.fetch(`/itRepairs/${orphan.id}`)).json()
      ).data;
      for (const key of [
        'number',
        'submittedAt',
        'responseDueAt',
        'resolutionDueAt',
      ])
        expect(repaired[key]).toEqual(orphan[key]);
      const settingsZh = await h.pageFor(await f.admin.session(), {
        locale: 'zh-CN',
      });
      await settingsZh.goto(`${h.origin}${h.basePath}/it-repair-groups`);
      await settingsZh.getByRole('button', { name: '恢复未分组报修' }).click();
      await browserExpect(settingsZh.getByRole('status')).toContainText(
        '暂无匹配的未分组工单',
      );
      await settingsZh.screenshot({
        path: `${h.screenshotsDir}/zh-CN-routing-recovery.png`,
        fullPage: true,
      });
      await settingsZh.context().close();
      await settings.goto(`${h.origin}${h.basePath}/it-repair-groups/calendar`);
      await browserExpect(settings.locator('#window-0-start')).toHaveValue(
        '09:00',
      );
      await settings.locator('#window-0-end').fill('11:45');
      await settings.getByRole('button', { name: 'Save', exact: true }).click();
      await browserExpect(settings).toHaveURL(/it-repair-groups$/);
      await settings.screenshot({
        path: `${h.screenshotsDir}/en-US-configuration.png`,
        fullPage: true,
      });
      await settings.context().close();
    } finally {
      await h.close();
    }
  },
  240000,
);

// @vitest-environment node
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import en from '../../../client/locales/modules/it-repairs.en-US.js';
import zh from '../../../client/locales/modules/it-repairs.zh-CN.js';
it.runIf(process.env.OA_IT_REPAIR_BROWSER === '1')(
  'read-only bilingual mobile compatibility banner and denied write',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'it-repairs-read-only',
      apiPort: 14289,
      vitePort: 15289,
      config: { itRepairs: { mode: 'readOnly' } },
    });
    try {
      const f = await prepareRepairs(h.testApp),
        session = await f.a.session();
      await h.testApp.connection.repository('itRepairGroups').createOne({
        values: {
          id: 'readonly-pending',
          title: 'Synthetic pending configuration',
          leaderIds: [f.leader.userId],
          engineerIds: [],
          categories: ['network'],
          active: true,
          security: false,
          version: 1,
          routingCursor: '00000000-0000-0000-0000-000000000000',
          updatedAt: new Date(),
        },
      });
      for (const locale of ['en-US', 'zh-CN']) {
        for (const scheme of ['light', 'dark']) {
          await session.fetch('/i18n/locale', write('PUT', { locale }));
          const page = await h.pageFor(session, {
            viewport: { width: 375, height: 812 },
            locale,
          });
          await page.addInitScript(
            ({ base, scheme }) => {
              const browser = globalThis as unknown as {
                localStorage: { setItem(key: string, value: string): void };
              };
              const path = base.replace(/^\/+|\/+$/g, '');
              browser.localStorage.setItem(
                `nocobase:${path ? encodeURIComponent(path) : '%2F'}:theme:color-scheme`,
                scheme,
              );
            },
            { base: h.basePath, scheme },
          );
          await page.goto(`${h.origin}${h.basePath}/it-repairs`);
          await browserExpect(
            page.getByText((locale === 'en-US' ? en : zh).itRepairs.readOnly),
          ).toBeVisible();
          await browserExpect(
            page.getByRole('button', {
              name: (locale === 'en-US' ? en : zh).itRepairs.create,
              exact: true,
            }),
          ).toHaveCount(0);
          expect(
            await page.evaluate(() => {
              const window = globalThis as unknown as {
                document: { documentElement: { scrollWidth: number } };
                innerWidth: number;
              };
              return (
                window.document.documentElement.scrollWidth <= window.innerWidth
              );
            }),
          ).toBe(true);
          await page.screenshot({
            path: `${h.screenshotsDir}/${locale}-${scheme}-read-only.png`,
          });
          await page.context().close();
        }
        if (locale === 'en-US') {
          const admin = await f.admin.session();
          const page = await h.pageFor(admin, {
            viewport: { width: 375, height: 812 },
            locale,
          });
          await page.goto(`${h.origin}${h.basePath}/it-repair-groups`);
          await browserExpect(
            page.getByText(en.itRepairs.recoveryPending),
          ).toBeVisible();
          await page.screenshot({
            path: `${h.screenshotsDir}/en-US-pending-sync.png`,
          });
          await page.context().close();
        }
      }
      expect(
        (await session.fetch('/itRepairs/save', write('POST', {}))).status,
      ).toBe(503);
    } finally {
      await h.close();
    }
  },
  120000,
);

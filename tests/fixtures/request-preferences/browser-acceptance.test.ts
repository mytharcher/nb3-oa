// @vitest-environment node
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'migrates favorites across independent browsers and isolates a second account',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'request-preferences',
      apiPort: 14174,
      vitePort: 15174,
    });
    try {
      const owner = await createEmployee(h.testApp, 'Favorites owner');
      const other = await createEmployee(h.testApp, 'Favorites other');
      const session = await owner.session();
      const first = await h.pageFor(session, {
        viewport: { width: 375, height: 812 },
      });
      const legacyKey = `nb3-oa:request-favorites:${owner.userId}`;
      await first.addInitScript((key) => {
        if (!sessionStorage.getItem('legacy-seeded')) {
          localStorage.setItem(key, JSON.stringify(['loan']));
          sessionStorage.setItem('legacy-seeded', 'yes');
        }
      }, legacyKey);
      const cards = (page: Page) =>
        page.locator('[data-slot="request-action-card"]');
      const openHome = async (page: Page) => {
        const loaded = page.waitForResponse((r) =>
          /\/api\/requestPreferences(?:\/migrate)?$/.test(
            new URL(r.url()).pathname,
          ),
        );
        await page.goto(`${h.origin}${h.basePath}/`);
        expect((await loaded).status()).toBe(200);
        await expect(
          page.getByRole('button', { name: 'All requests', exact: true }),
        ).toBeVisible();
      };
      await openHome(first);
      await expect(cards(first)).toHaveCount(1);
      await expect(cards(first)).toHaveAttribute('href', /newLoan/);
      expect(
        await first.evaluate((key) => localStorage.getItem(key), legacyKey),
      ).toBeNull();

      const second = await h.pageFor(await owner.session(), {
        viewport: { width: 375, height: 812 },
      });
      await openHome(second);
      await expect(cards(second)).toHaveCount(1);
      await expect(cards(second)).toHaveAttribute('href', /newLoan/);
      expect(
        await second.evaluate((key) => localStorage.getItem(key), legacyKey),
      ).toBeNull();
      await second
        .getByRole('button', { name: 'All requests', exact: true })
        .click();
      const drawer = second.getByRole('dialog');
      const leave = drawer.locator(
        '[data-slot="request-action-card"][href*="newLeave"]',
      );
      const label = await leave.innerText();
      const saved = second.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith('/api/requestPreferences') &&
          r.request().method() === 'PUT',
      );
      await drawer
        .getByRole('button', { name: `Favorite: ${label}`, exact: true })
        .click();
      expect((await saved).status()).toBe(200);
      await expect(
        drawer.getByRole('button', { name: `Favorite: ${label}`, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      await second.keyboard.press('Escape');
      await expect(cards(second)).toHaveCount(2);
      // A stale legacy browser must not overwrite the server's newer choices.
      await first.evaluate(
        (key) => localStorage.setItem(key, JSON.stringify(['travel'])),
        legacyKey,
      );
      await openHome(first);
      await expect(cards(first)).toHaveCount(2);
      await expect(
        first.locator('[data-slot="request-action-card"][href*="newLeave"]'),
      ).toBeVisible();
      await expect(
        first.locator('[data-slot="request-action-card"][href*="newLoan"]'),
      ).toBeVisible();
      expect(
        (await (await session.fetch('/requestPreferences')).json()).data
          .favorites,
      ).toEqual(['loan', 'leave']);

      const otherSession = await other.session();
      const third = await h.pageFor(otherSession, {
        viewport: { width: 375, height: 812 },
      });
      await openHome(third);
      await expect(cards(third)).toHaveCount(6);
      expect(
        (await (await otherSession.fetch('/requestPreferences')).json()).data
          .favorites,
      ).toBeNull();
      expect(
        (await (await session.fetch('/requestPreferences')).json()).data
          .favorites,
      ).toEqual(['loan', 'leave']);
      for (const [name, page] of [
        ['owner', first],
        ['other', third],
      ] as const) {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `${name}-375.png`),
          fullPage: true,
        });
      }
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks: [
              'legacy migration',
              'independent browser persistence',
              'UI favorite saved',
              'stale migration preserves newer choices',
              'second account isolation',
              '375px no horizontal overflow',
            ],
            scope:
              'Disposable PostgreSQL and isolated main application; synthetic accounts',
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);

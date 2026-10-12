// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { expect, it } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../../fixtures/browser/harness.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.skipIf(process.env.OA_BROWSER_ACCEPTANCE !== '1')(
  'hands over confirmation through the real browser and denies the original owner',
  async () => {
    const app = await startIsolatedBrowserApp({
      name: 'work-items',
      apiPort: 14149,
      vitePort: 15149,
    });
    try {
      const creator = await createEmployee(app.testApp, 'Browser Creator');
      const worker = await createEmployee(app.testApp, 'Browser Worker');
      const successor = await createEmployee(app.testApp, 'Browser Successor');
      const hr = await createEmployee(app.testApp, 'Browser HR');
      await app.testApp.application.container
        .resolve(organizationServiceToken)
        .addDutyRoleMember('hr', hr.userId, { actorId: creator.userId });
      const cs = await creator.session(),
        ws = await worker.session(),
        hs = await hr.session(),
        ss = await successor.session();
      const response = await cs.fetch(
        '/workItems',
        write('POST', {
          requestId: randomUUID(),
          title: 'Isolated browser confirmation',
          description: 'Synthetic browser acceptance',
          targetUserId: worker.userId,
          dutyRoleCode: null,
          dueAt: '2035-01-01T00:00:00Z',
          requiresConfirmation: true,
          attachments: [],
        }),
      );
      expect(response.status).toBe(200);
      let item = (await response.json()).data;
      for (const [session, action, extra] of [
        [cs, 'dispatch', {}],
        [ws, 'complete', { result: 'Synthetic completion' }],
      ] as const) {
        const changed = await session.fetch(
          `/workItems/${item.id}/${action}`,
          write('POST', {
            requestId: randomUUID(),
            expectedVersion: item.version,
            ...extra,
          }),
        );
        expect(changed.status).toBe(200);
        item = (await changed.json()).data;
      }
      const page = await app.pageFor(hs, {
        viewport: { width: 375, height: 812 },
        colorScheme: 'dark',
      });
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(
        `${app.origin}${app.basePath}/work-items/${item.id}/handover-confirmation`,
        { waitUntil: 'domcontentloaded' },
      );
      const target = page.locator('#handover-target');
      await browserExpect(target).toBeEnabled({ timeout: 90000 });
      await page.addInitScript(() => {
        const preferences = JSON.parse(
          localStorage.getItem('workitem-browser-prefs') ??
            '{"locale":"en-US","theme":"dark","preset":"default"}',
        );
        localStorage.setItem('nocobase.locale', preferences.locale);
        localStorage.setItem(
          'nocobase:main:theme:color-scheme',
          preferences.theme,
        );
        localStorage.setItem('nocobase:main:theme:preset', preferences.preset);
      });
      for (const locale of ['en-US', 'zh-CN']) {
        for (const theme of ['light', 'dark']) {
          for (const preset of ['default', 'compact']) {
            await page.evaluate(
              (value) =>
                localStorage.setItem(
                  'workitem-browser-prefs',
                  JSON.stringify(value),
                ),
              { locale, theme, preset },
            );
            await page.reload({ waitUntil: 'domcontentloaded' });
            await browserExpect(target).toBeEnabled({ timeout: 90000 });
            await browserExpect(page.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            await browserExpect(page.locator('html')).toHaveClass(
              new RegExp(theme),
            );
            await browserExpect(
              page.locator('button[form="confirmation-handover"]'),
            ).toHaveText(
              locale === 'en-US' ? 'Hand over confirmation' : '交接确认责任',
            );
            await page.screenshot({
              path: path.join(
                app.screenshotsDir,
                `hr-handover-${locale}-${theme}-${preset}.png`,
              ),
            });
          }
        }
      }
      await target.fill('Browser Successor');
      await page.getByRole('option', { name: /Browser Successor/ }).click();
      await page
        .locator('#handover-reason')
        .fill('Synthetic browser responsibility handover');
      await page.screenshot({
        path: path.join(app.screenshotsDir, 'hr-handover-mobile-dark.png'),
      });
      await page.keyboard.press('Escape');
      await browserExpect(page.getByRole('alertdialog')).toBeVisible();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: /Continue editing|继续编辑/ })
        .click();
      await browserExpect(page.locator('#handover-reason')).toHaveValue(
        'Synthetic browser responsibility handover',
      );
      const handedResponse = page.waitForResponse(
        (r) =>
          r.url().includes(`/workItems/${item.id}/handoverConfirmation`) &&
          r.request().method() === 'POST',
      );
      await page
        .locator('button[type="submit"][form="confirmation-handover"]')
        .click();
      expect((await handedResponse).status()).toBe(200);
      await browserExpect(page).toHaveURL(
        new RegExp(`/work-items/${item.id}$`),
      );
      const detail = (await (await ss.fetch(`/workItems/${item.id}`)).json())
        .data;
      expect(detail.confirmationOwner.id).toBe(successor.userId);
      expect(detail.actions).toEqual(['confirm', 'return']);
      const original = await cs.fetch(
        `/workItems/${item.id}/confirm`,
        write('POST', {
          requestId: randomUUID(),
          expectedVersion: detail.version,
        }),
      );
      expect(original.status).toBe(403);
      const successorPage = await app.pageFor(ss);
      await successorPage.goto(
        `${app.origin}${app.basePath}/work-items/${item.id}/actions/confirm`,
        { waitUntil: 'domcontentloaded' },
      );
      const confirmForm = successorPage.locator('form');
      await browserExpect(confirmForm).toBeVisible({ timeout: 90000 });
      const confirmation = successorPage.waitForResponse(
        (r) =>
          r.url().includes(`/workItems/${item.id}/confirm`) &&
          r.request().method() === 'POST',
      );
      await successorPage
        .getByRole('button', { name: /Confirm completion|确认完成/ })
        .last()
        .click();
      await successorPage
        .getByRole('alertdialog')
        .getByRole('button', { name: /Confirm completion|确认完成/ })
        .click();
      expect((await confirmation).status()).toBe(200);
      expect(
        (await (await ss.fetch(`/workItems/${item.id}`)).json()).data.status,
      ).toBe('completed');
      expect(errors).toEqual([]);
      await page.context().close();
      await successorPage.context().close();
    } finally {
      await app.close();
    }
  },
  240000,
);

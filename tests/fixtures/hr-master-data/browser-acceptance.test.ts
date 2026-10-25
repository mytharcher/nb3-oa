// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createPerson, grantToUser } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { write } from '../../logic/platform/helpers.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'HR reviews a local ownership conflict and replays the source batch at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'hr-master-data',
      apiPort: 14181,
      vitePort: 15181,
    });
    try {
      const hr = await createPerson(h.testApp, 'HR integration operator');
      await grantToUser(
        h.testApp,
        'browser-hr-integration',
        [
          {
            resource: { type: 'settings', id: 'oa.hrMasterData' },
            actions: ['read', 'sync', 'manage'].map((action) => ({ action })),
          },
          {
            resource: { type: 'settings', id: 'oa.org.grades' },
            actions: [{ action: 'read' }, { action: 'update' }],
          },
        ],
        hr.userId,
      );
      const session = await hr.session();
      expect(
        (
          await session.fetch(
            '/hrMasterData/sources',
            write('PUT', {
              id: 'browser-hr',
              name: 'HR gateway',
              principalId: hr.userId,
              active: true,
            }),
          )
        ).status,
      ).toBe(200);
      const batch = {
        source: 'browser-hr',
        eventId: 'browser-initial',
        items: [
          {
            entity: 'grade',
            externalId: 'grade-1',
            revision: 1,
            operation: 'upsert',
            data: { code: 'HR-G', title: 'Gateway grade', rank: 1 },
          },
        ],
      };
      expect(
        (await session.fetch('/hrMasterData/batches', write('POST', batch)))
          .status,
      ).toBe(200);
      const org = h.testApp.application.container.resolve(
          organizationServiceToken,
        ),
        grade = (await org.listGrades()).find((row) => row.code === 'HR-G')!;
      await org.updateGrade(
        grade.id,
        { title: 'Local correction' },
        { actorId: hr.userId },
      );
      expect(
        (
          await session.fetch(
            '/hrMasterData/batches',
            write('POST', {
              ...batch,
              eventId: 'browser-retry',
              items: [
                {
                  ...batch.items[0],
                  revision: 2,
                  data: { code: 'HR-G', title: 'Gateway revised', rank: 2 },
                },
              ],
            }),
          )
        ).status,
      ).toBe(400);
      const page = await h.pageFor(session, {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      page.setDefaultTimeout(30000);
      await page.goto(`${h.origin}${h.basePath}/hr-master-data`);
      await expect(
        page.getByRole('heading', { name: 'HR synchronization', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'This record was changed locally. HR must review and explicitly restore external ownership before retrying.',
          { exact: true },
        ),
      ).toBeVisible();
      await page
        .getByRole('button', {
          name: 'Restore external ownership',
          exact: true,
        })
        .click();
      await page
        .locator('#hr-reclaim-reason')
        .fill('Reviewed local correction; restore approved source ownership');
      const reclaim = page.waitForResponse(
        (r) => r.url().includes('/reclaim') && r.request().method() === 'POST',
      );
      await page
        .getByRole('button', {
          name: 'Confirm external ownership',
          exact: true,
        })
        .click();
      expect((await reclaim).status()).toBe(200);
      const replay = page.waitForResponse(
        (r) => r.url().includes('/replay') && r.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Retry original batch', exact: true })
        .click();
      expect((await replay).status()).toBe(200);
      await expect(
        page.getByRole('button', { name: 'Retry original batch', exact: true }),
      ).toHaveCount(0);
      expect(
        (await org.listGrades()).find((row) => row.id === grade.id)?.title,
      ).toBe('Gateway revised');
      await page
        .getByRole('button', { name: 'Edit source', exact: true })
        .click();
      await page.locator('#hr-source-name').fill('Reviewed HR gateway');
      const save = page.waitForResponse(
        (r) =>
          r.url().includes('/hrMasterData/sources') &&
          r.request().method() === 'PUT',
      );
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      expect((await save).status()).toBe(200);
      await expect(
        page.getByRole('heading', { name: 'Reviewed HR gateway', exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const shot = path.join(h.screenshotsDir, '375-hr-replayed.png');
      await page.screenshot({ path: shot, fullPage: true });
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks: [
              'real source and failed batch loaded',
              'explicit HR reclaim reason',
              'same-batch replay updates owning grade',
              'source drawer save',
              '375px no horizontal overflow',
            ],
            screenshots: [shot],
            scope:
              'isolated PostgreSQL, synthetic standard gateway events; not customer provider connectivity',
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

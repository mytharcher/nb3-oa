import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { OA_TEST_ORIGIN } from '../../logic/oa-test-origin.js';

const h = await startIsolatedBrowserApp({
  name: 'knowledge',
  apiPort: 14142,
  vitePort: 15142,
});
const checks: string[] = [],
  errors: string[] = [],
  screenshots: string[] = [];
try {
  const manager = await createEmployee(
    h.testApp,
    'Synthetic Knowledge Administrator',
  );
  const reader = await createEmployee(h.testApp, 'Synthetic Knowledge Reader');
  const org = h.testApp.application.container.resolve(organizationServiceToken);
  await org.addDutyRoleMember('admin', manager.userId, {
    actorId: manager.userId,
  });
  const editor = await manager.session(),
    viewer = await reader.session();
  const publish = async (input: Record<string, unknown>) => {
    const response = await editor.fetch(
      '/knowledge/documents',
      write('POST', {
        requestKey: randomUUID(),
        folderId: null,
        departmentIds: [],
        dutyRoleCodes: [],
        ...input,
      }),
    );
    if (response.status !== 200) throw new Error(await response.text());
    return (
      (await response.json()) as {
        data: { id: string; latestVersionId: string; version: number };
      }
    ).data;
  };
  const doc = await publish({
    title: 'Synthetic policy',
    kind: 'markdown',
    markdown:
      'Historical safe text <script>window.knowledgeUnsafe=true</script>',
  });
  await publish({
    id: doc.id,
    expectedVersion: doc.version,
    title: 'Synthetic policy',
    kind: 'markdown',
    markdown: 'Current policy text',
  });
  const upload = new FormData();
  upload.set(
    'file',
    new File(['Synthetic guarded preview bytes'], 'synthetic-knowledge.txt', {
      type: 'text/plain',
    }),
  );
  upload.set('requestKey', randomUUID());
  const uploaded = await editor.fetch('/knowledge/files', {
    method: 'POST',
    headers: { origin: OA_TEST_ORIGIN },
    body: upload,
  });
  if (uploaded.status !== 200) throw new Error(await uploaded.text());
  const fileId = ((await uploaded.json()) as { data: { id: string } }).data.id;
  const fileDoc = await publish({
    title: 'Synthetic guarded file',
    kind: 'file',
    fileId,
  });
  const page = await h.pageFor(viewer);
  page.setDefaultTimeout(25000);
  page.on('pageerror', (e) => errors.push(e.message));
  const base = `${h.origin}${h.basePath}/knowledge`;
  await page.goto(`${base}/${doc.id}?version=${doc.latestVersionId}#source`);
  await expect(
    page.getByText('Historical safe text', { exact: false }),
  ).toBeVisible();
  expect(await page.evaluate(() => 'knowledgeUnsafe' in window)).toBe(false);
  await expect(
    page.getByRole('link', { name: 'Publish a new version', exact: true }),
  ).toHaveCount(0);
  checks.push(
    'Historical markdown is inert text; ordinary employee has no publishing action',
  );
  const detailPath = `${h.basePath}/api/knowledge/documents/${doc.id}`;
  await page.route(`**${detailPath}`, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { message: 'Synthetic temporary failure' },
      }),
    }),
  );
  await page
    .getByRole('button', { name: 'Refresh', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('button', { name: 'Retry', exact: true }),
  ).toBeVisible();
  await page.unroute(`**${detailPath}`);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Retry', exact: true }),
  ).toHaveCount(0);
  checks.push(
    '500 detail recovery retains safe history and retry reloads actual current resource',
  );
  const preview = `${base}/${fileDoc.id}/versions/${fileDoc.latestVersionId}/preview`;
  await page.goto(preview);
  await expect(
    page
      .getByRole('dialog')
      .getByText('Synthetic guarded preview bytes', { exact: true }),
  ).toBeVisible({ timeout: 30000 });
  checks.push(
    'Actual guarded text bytes render in the local file preview dialog',
  );
  const bytesPath = `/knowledge/documents/${fileDoc.id}/versions/${fileDoc.latestVersionId}/content`;
  const bytes = await viewer.fetch(bytesPath);
  expect(bytes.status).toBe(200);
  expect(bytes.headers.get('x-content-type-options')).toBe('nosniff');
  expect(bytes.headers.get('cache-control')).toContain('no-store');
  for (const locale of ['en-US', 'zh-CN'])
    for (const theme of ['light', 'dark'])
      for (const density of ['default', 'compact']) {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.addInitScript(
          ({ locale, theme, density }) => {
            localStorage.setItem('nocobase.locale', locale);
            localStorage.setItem('i18nextLng', locale);
            const scope = location.pathname.split('/')[1];
            localStorage.setItem(`nocobase:${scope}:theme:color-scheme`, theme);
            localStorage.setItem(`nocobase:${scope}:theme:preset`, density);
          },
          { locale, theme, density },
        );
        await page.goto(preview);
        await expect(
          page
            .getByRole('dialog')
            .getByText('Synthetic guarded preview bytes', { exact: true }),
        ).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(() =>
              document.documentElement.classList.contains('dark'),
            ),
          )
          .toBe(theme === 'dark');
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.dataset.theme),
          )
          .toBe(density);
        await expect(
          page.getByRole('button', {
            name: `${locale === 'zh-CN' ? '下载' : 'Download'}: synthetic-knowledge.txt`,
            exact: true,
          }),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const target = path.join(
          h.screenshotsDir,
          `${locale}-${theme}-${density}-375.png`,
        );
        await page.screenshot({ path: target, fullPage: true });
        screenshots.push(target);
      }
  checks.push(
    'Eight 375px locale/theme/density preview variants render without document overflow',
  );
  await publish({
    id: fileDoc.id,
    expectedVersion: fileDoc.version,
    title: 'Synthetic guarded file',
    kind: 'markdown',
    markdown: 'Restricted latest document',
    dutyRoleCodes: ['hr'],
  });
  expect((await viewer.fetch(bytesPath)).status).toBe(403);
  expect(
    (
      await viewer.fetch(
        `/knowledge/documents/${fileDoc.id}/versions/${fileDoc.latestVersionId}/file`,
      )
    ).status,
  ).toBe(403);
  await page.reload();
  await expect(
    page.getByText('Synthetic guarded preview bytes', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Retry|重试/, exact: true }),
  ).toHaveCount(0);
  checks.push(
    'Changing current audience removes old-version metadata/bytes access and clears browser preview on reload without Retry',
  );
  await publish({
    id: doc.id,
    expectedVersion: 2,
    title: 'Synthetic policy',
    kind: 'markdown',
    markdown: 'Restricted current text',
    dutyRoleCodes: ['hr'],
  });
  await page.goto(`${base}/${doc.id}?version=${doc.latestVersionId}`);
  await expect(
    page.getByText('Historical safe text', { exact: false }),
  ).toHaveCount(0);
  expect((await viewer.fetch(`/knowledge/documents/${doc.id}`)).status).toBe(
    403,
  );
  checks.push(
    'Historical markdown uses current audience; publication-time visibility grants no history bypass',
  );
  expect(errors).toEqual([]);
  await writeFile(
    path.join(h.screenshotsDir, 'result.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        checks,
        errors,
        screenshots,
      },
      null,
      2,
    ),
  );
  console.log('Knowledge Q10 browser acceptance passed', checks);
} finally {
  await h.close();
}

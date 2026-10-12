import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

const h = await startIsolatedBrowserApp({
  name: 'knowledge-fifth',
  apiPort: 14145,
  vitePort: 15145,
});
const checks: string[] = [],
  errors: string[] = [],
  screenshots: string[] = [];
try {
  const manager = await createEmployee(
    h.testApp,
    'Synthetic Knowledge Fifth Administrator',
  );
  const reader = await createEmployee(
    h.testApp,
    'Synthetic Knowledge Fifth Reader',
  );
  const org = h.testApp.application.container.resolve(organizationServiceToken);
  const authz = h.testApp.application.container.resolve(authorizationToken);
  await org.addDutyRoleMember('admin', manager.userId, {
    actorId: manager.userId,
  });
  const editor = await manager.session(),
    viewer = await reader.session();
  const page = await h.pageFor(editor);
  page.setDefaultTimeout(25000);
  page.on('pageerror', (e) => errors.push(e.message));
  const base = `${h.origin}${h.basePath}/knowledge`;
  await page.goto(`${base}/folders`);
  await page.getByText('New folder', { exact: true }).click();
  await page.locator('#folder-title').pressSequentially('Synthetic policies');
  await page.getByRole('button', { name: 'Save folder', exact: true }).click();
  await expect(page.locator('#folder-title')).toHaveCount(0);
  await expect(
    page.getByRole('cell', { name: 'Synthetic policies', exact: true }),
  ).toBeVisible();
  const folderResponse = await editor.fetch('/knowledge/folders');
  const folder = (
    (await folderResponse.json()) as {
      data: { id: string; title: string; version: number }[];
    }
  ).data.find((f) => f.title === 'Synthetic policies')!;
  await page
    .getByRole('row')
    .filter({
      has: page.getByRole('cell', { name: 'Synthetic policies', exact: true }),
    })
    .getByText('Publish a new version', { exact: true })
    .click();
  await page.locator('#folder-title').fill('Synthetic policies revised');
  await page.getByRole('button', { name: 'Save folder', exact: true }).click();
  await expect(page.locator('#folder-title')).toHaveCount(0);
  checks.push(
    'F01: real folder create/edit persists through main HTTP and browser',
  );
  await page.goto(`${base}/new`);
  await page
    .locator('#knowledge-title')
    .pressSequentially('Synthetic fifth policy');
  await page.locator('#knowledge-folder').click();
  await page
    .getByRole('option', { name: 'Synthetic policies revised', exact: true })
    .click();
  await page
    .locator('#knowledge-markdown')
    .pressSequentially('First immutable body');
  const documentPath = `${h.basePath}/api/knowledge/documents`;
  const attempts: Record<string, unknown>[] = [];
  await page.route(`**${documentPath}`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    attempts.push(route.request().postDataJSON() as Record<string, unknown>);
    if (attempts.length === 1)
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'Synthetic temporary publication failure' },
        }),
      });
    else await route.continue();
  });
  await page
    .getByRole('button', { name: 'Publish version', exact: true })
    .click();
  await expect(
    page.getByText('Unable to load or save. Your current draft is retained.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('#knowledge-markdown')).toHaveValue(
    'First immutable body',
  );
  await page
    .getByRole('button', { name: 'Publish version', exact: true })
    .click();
  await expect(page.locator('#knowledge-title')).toHaveCount(0);
  expect(attempts).toHaveLength(2);
  expect(attempts[1]).toEqual(attempts[0]);
  await page.unroute(`**${documentPath}`);
  const list = await editor.fetch(
    '/knowledge/documents?q=Synthetic%20fifth%20policy',
  );
  const doc = (
    (await list.json()) as {
      data: {
        id: string;
        folderId: string;
        version: number;
        latestVersionId: string;
      }[];
    }
  ).data[0];
  expect(doc.folderId).toBe(folder.id);
  expect(doc.version).toBe(1);
  checks.push(
    'F01: UI Markdown publication uses selected folder; 500 retry preserves exact request key/body and creates one version',
  );
  await page.goto(`${base}/${doc.id}/edit`);
  await expect(page.locator('#knowledge-markdown')).toHaveValue(
    'First immutable body',
  );
  await page.locator('#knowledge-markdown').fill('Unsaved stale second body');
  const external = await editor.fetch(
    '/knowledge/documents',
    write('POST', {
      requestKey: randomUUID(),
      id: doc.id,
      expectedVersion: 1,
      title: 'Synthetic fifth policy',
      folderId: folder.id,
      departmentIds: [],
      dutyRoleCodes: [],
      kind: 'markdown',
      markdown: 'Concurrent second body',
    }),
  );
  expect(external.status).toBe(200);
  await page
    .getByRole('button', { name: 'Publish version', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Load latest version', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#knowledge-markdown')).toHaveValue(
    'Unsaved stale second body',
  );
  await page
    .getByRole('button', { name: 'Load latest version', exact: true })
    .click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'discards this unsaved draft',
  );
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Load latest version', exact: true })
    .click();
  await expect(page.locator('#knowledge-markdown')).toHaveValue(
    'Concurrent second body',
  );
  await page
    .locator('#knowledge-markdown')
    .fill('Browser third immutable body');
  await page
    .getByRole('button', { name: 'Publish version', exact: true })
    .click();
  await expect(page.locator('#knowledge-title')).toHaveCount(0);
  await page.goto(`${base}/${doc.id}?version=${doc.latestVersionId}`);
  await expect(
    page.getByText('First immutable body', { exact: true }),
  ).toBeVisible();
  const detail = await viewer.fetch(`/knowledge/documents/${doc.id}`);
  const frozen = (
    (await detail.json()) as {
      data: {
        document: { version: number };
        versions: { version: number; markdown: string }[];
      };
    }
  ).data;
  expect(frozen.document.version).toBe(3);
  expect(frozen.versions).toHaveLength(3);
  expect(frozen.versions.find((v) => v.version === 1)?.markdown).toBe(
    'First immutable body',
  );
  expect(frozen.versions.find((v) => v.version === 2)?.markdown).toBe(
    'Concurrent second body',
  );
  checks.push(
    'F02: CAS refuses stale edit, named discard reloads latest, browser publishes v3 while v1/v2 remain frozen and selectable',
  );
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
        await page.goto(`${base}/${doc.id}/edit`);
        await expect(page.locator('#knowledge-markdown')).toHaveValue(
          'Browser third immutable body',
        );
        await expect(
          page.getByRole('button', {
            name: locale === 'zh-CN' ? '发布版本' : 'Publish version',
            exact: true,
          }),
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
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const target = path.join(
          h.screenshotsDir,
          `${locale}-${theme}-${density}-375-form.png`,
        );
        await page.screenshot({ path: target, fullPage: true });
        screenshots.push(target);
      }
  checks.push(
    'F03: eight actual bilingual/theme/density 375px edit forms show publication control without document overflow',
  );
  await page.addInitScript(() =>
    localStorage.setItem('nocobase.locale', 'en-US'),
  );
  const defaults = await authz.permissionSets.get('oa-knowledge-admin');
  if (!defaults) throw new Error('Missing main knowledge default permissions');
  await authz.permissionSets.update(defaults.key, {
    ...defaults,
    grants: defaults.grants.map((g) =>
      g.resource.id === 'oa.knowledgeFolders'
        ? { ...g, actions: g.actions.filter((a) => a.action !== 'manage') }
        : g,
    ),
  });
  expect(
    (
      await editor.fetch(
        '/knowledge/folders',
        write('POST', {
          requestKey: randomUUID(),
          title: 'Forbidden folder',
          parentId: null,
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (await editor.fetch(`/knowledge/formOptions?documentId=${doc.id}`)).status,
  ).toBe(200);
  await page.goto(`${base}/folders`);
  await expect(page.getByText('New folder', { exact: true })).toHaveCount(0);
  await authz.permissionSets.update(defaults.key, {
    ...defaults,
    grants: defaults.grants.map((g) =>
      g.resource.id === 'oa.knowledgeDocuments'
        ? { ...g, actions: g.actions.filter((a) => a.action !== 'manage') }
        : g,
    ),
  });
  expect((await editor.fetch('/knowledge/formOptions')).status).toBe(403);
  expect(
    (
      await editor.fetch(
        '/knowledge/folders',
        write('POST', {
          requestKey: randomUUID(),
          title: 'Folder allowed without document manage',
          parentId: null,
        }),
      )
    ).status,
  ).toBe(200);
  await page.goto(`${base}/${doc.id}`);
  await expect(
    page.getByText('Browser third immutable body', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Publish a new version', { exact: true }),
  ).toHaveCount(0);
  await authz.permissionSets.update(defaults.key, defaults);
  await page.goto(`${base}/${doc.id}/edit`);
  await expect(page.locator('#knowledge-markdown')).toBeVisible();
  await page.locator('#knowledge-markdown').fill('Private revoked draft');
  await org.removeDutyRoleMember('admin', manager.userId, {
    actorId: manager.userId,
  });
  await page
    .getByRole('button', { name: 'Publish version', exact: true })
    .click();
  await expect(page.locator('#knowledge-markdown')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Retry', exact: true }),
  ).toHaveCount(0);
  expect((await editor.fetch('/knowledge/formOptions')).status).toBe(403);
  checks.push(
    'F03: folder and document manage grants revoke independently; actual admin role revocation clears private mutation draft and offers no retry',
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
  console.log('Knowledge F01–F03 browser acceptance passed', checks);
} finally {
  await h.close();
}

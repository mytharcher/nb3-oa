// @vitest-environment node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { DOCX_MIME } from '../../../server/providers/template-print/renderer.js';

function document(marker: string) {
  return Buffer.from(
    zipSync({
      '[Content_Types].xml': strToU8(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
      '_rels/.rels': strToU8(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      'word/document.xml': strToU8(
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${marker} {d.reason} {d.applicant.name}</w:t></w:r></w:p></w:body></w:document>`,
      ),
    }),
  );
}

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'template print isolated main-app browser acceptance F07-F09',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'template-print',
      apiPort: 14138,
      vitePort: 15138,
    });
    const base = `${h.origin}${h.basePath}`;
    const evidence = {
      checks: [] as string[],
      screenshots: [] as string[],
      pageErrors: [] as string[],
      expectedHttp: [] as string[],
    };
    const check = (s: string) => evidence.checks.push(s);
    const go = (p: Page, suffix = '') =>
      p.goto(`${base}/print-templates${suffix}`, {
        waitUntil: 'domcontentloaded',
      });
    async function json(
      p: Page,
      suffix: string,
      method = 'GET',
      body?: unknown,
    ) {
      return p.evaluate(
        async ({ url, method, body }) => {
          const response = await fetch(url, {
            method,
            credentials: 'include',
            ...(body === undefined
              ? {}
              : {
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(body),
                }),
          });
          return { status: response.status, body: await response.json() };
        },
        { url: `${h.basePath}/api/${suffix}`, method, body },
      );
    }
    async function shot(p: Page, name: string) {
      const target = path.join(h.screenshotsDir, `${name}.png`);
      await p.screenshot({ path: target, fullPage: true });
      evidence.screenshots.push(target);
    }
    try {
      const manager = await createEmployee(h.testApp, 'Browser Print Manager');
      const owner = await createEmployee(h.testApp, 'Browser Print Owner');
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      await org.addDutyRoleMember('admin', manager.userId, {
        actorId: manager.userId,
      });
      const managerSession = await manager.session(),
        ownerSession = await owner.session();
      const admin = await h.pageFor(managerSession),
        employee = await h.pageFor(ownerSession);
      for (const page of [admin, employee]) {
        page.setDefaultTimeout(25000);
        page.on('pageerror', (e) => evidence.pageErrors.push(e.message));
      }
      await admin.goto(`${base}/`);
      await expect(admin.getByRole('heading', { level: 1 })).toBeVisible();
      expect(evidence.pageErrors).toEqual([]);
      await go(admin);
      await expect(
        admin.getByText('No print templates yet', { exact: true }),
      ).toBeVisible();
      await admin
        .getByRole('link', { name: 'New template', exact: true })
        .click();
      await admin.getByRole('button', { name: 'Create', exact: true }).click();
      await expect(admin.locator('#print-template-name')).toBeFocused();
      await expect(
        admin.getByText('Enter 1–120 characters', { exact: true }),
      ).toBeVisible();
      await admin.locator('#print-template-name').fill('Browser Template');
      const cdp = await admin.context().newCDPSession(admin);
      await cdp.send('Input.imeSetComposition', {
        text: 'zhong',
        selectionStart: 5,
        selectionEnd: 5,
      });
      await cdp.send('Input.insertText', { text: '中国' });
      await expect(admin.locator('#print-template-name')).toHaveValue(
        'Browser Template中国',
      );
      await admin.getByRole('button', { name: 'Create', exact: true }).click();
      await expect(
        admin.getByRole('link', { name: 'Browser Template中国', exact: true }),
      ).toBeVisible();
      const templates = await json(admin, 'printTemplates?mode=manage');
      expect(templates.status).toBe(200);
      const id = templates.body.data[0].id as string;
      check(
        'F07 actual admin-duty user creates template through browser; empty table, required focus and real IME preserve input',
      );
      await go(admin, `/${id}?source=leave#origin`);
      await expect(
        admin.getByRole('heading', {
          name: 'Browser Template中国',
          exact: true,
        }),
      ).toBeVisible();
      await admin
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await admin.locator('#print-template-file').setInputFiles({
        name: 'invalid.docx',
        mimeType: DOCX_MIME,
        buffer: Buffer.from('invalid'),
      });
      await admin
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await expect(
        admin.getByText('Check the input and try again', { exact: true }),
      ).toBeVisible();
      expect(
        await admin
          .locator('#print-template-file')
          .evaluate((e: HTMLInputElement) => e.files?.[0]?.name),
      ).toBe('invalid.docx');
      const original = document('ORIGINAL');
      await admin.locator('#print-template-file').setInputFiles({
        name: '中文模板.docx',
        mimeType: DOCX_MIME,
        buffer: original,
      });
      await admin
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await expect(admin.locator('#print-template-file')).toHaveCount(0);
      let detail = (await json(admin, `printTemplates/${id}?mode=manage`)).body
        .data;
      expect(detail.revisions).toHaveLength(1);
      const first = detail.revisions[0];
      expect(detail.record.currentRevisionId).toBe(first.id);
      await expect(
        admin.locator('dl').getByText('Browser Print Manager', { exact: true }),
      ).toBeVisible();
      const downloaded = admin.waitForEvent('download');
      await admin
        .getByRole('button', { name: 'Download', exact: true })
        .click();
      const file = await downloaded;
      expect(await readFile((await file.path())!)).toEqual(original);
      expect(file.suggestedFilename()).toBe('Browser Template中国-1.docx');
      check(
        'F07 browser rejects malformed DOCX without losing selection, uploads validated multipart and downloads exact immutable revision bytes',
      );
      await admin.getByRole('button', { name: 'Edit', exact: true }).click();
      await admin.locator('#print-template-name').fill('Updated Template');
      await admin.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        admin.getByRole('heading', { name: 'Updated Template', exact: true }),
      ).toBeVisible();
      await admin
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await admin.locator('#print-template-file').setInputFiles({
        name: 'replacement.docx',
        mimeType: DOCX_MIME,
        buffer: document('REPLACEMENT'),
      });
      await admin
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await expect(admin.locator('#print-template-file')).toHaveCount(0);
      detail = (await json(admin, `printTemplates/${id}?mode=manage`)).body
        .data;
      expect(detail.revisions).toHaveLength(2);
      expect(detail.record.currentRevisionId).not.toBe(first.id);
      expect(
        detail.revisions.find((r: { id: string }) => r.id === first.id)
          .contentHash,
      ).toBe(first.contentHash);
      const oldDownload = admin.waitForEvent('download');
      await admin
        .getByRole('row')
        .filter({ hasText: 'Browser Print Manager' })
        .last()
        .getByRole('button', { name: 'Download', exact: true })
        .click();
      expect(await readFile((await (await oldDownload).path())!)).toEqual(
        original,
      );
      await admin
        .getByRole('button', {
          name: 'Actions for template "Updated Template"',
          exact: true,
        })
        .click();
      await admin
        .getByRole('menuitem', { name: 'Disable', exact: true })
        .click();
      await expect(
        admin.getByRole('alertdialog', {
          name: 'Disable template "Updated Template"?',
          exact: true,
        }),
      ).toBeVisible();
      await admin
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Disable', exact: true })
        .click();
      await expect(admin.getByRole('alertdialog')).toHaveCount(0);
      await employee.goto(`${base}/approvals`, {
        waitUntil: 'domcontentloaded',
      });
      expect(
        (await json(employee, 'printTemplates?mode=use&source=leave')).body
          .data[0].active,
      ).toBe(false);
      expect(
        (await json(admin, `printTemplates/${id}?mode=manage`)).body.data
          .revisions,
      ).toHaveLength(2);
      await admin
        .getByRole('button', {
          name: 'Actions for template "Updated Template"',
          exact: true,
        })
        .click();
      await admin
        .getByRole('menuitem', { name: 'Enable', exact: true })
        .click();
      await expect(
        admin.getByText('Available', { exact: true }).last(),
      ).toBeVisible();
      check(
        'F08 browser metadata edit, revision replacement, immutable old download, named disable confirmation and re-enable; use list marks disabled templates while immutable history remains',
      );
      const created = await json(employee, 'leaveRequests', 'POST', {
        leaveType: 'personal',
        startDate: '2026-10-12',
        endDate: '2026-10-12',
        startHalf: 'am',
        endHalf: 'pm',
        reason: 'Synthetic browser & <reason>',
        attachments: [],
        handoverUserId: null,
        enableDelegation: false,
      });
      expect(created.status).toBe(200);
      const recordId = created.body.data.record.id;
      const printUrl = `${base}/approvals/mine/leave/${recordId}/print?tab=mine#source`;
      await employee.goto(printUrl);
      await employee.locator('#print-template-choice').click();
      await employee
        .getByRole('option', { name: 'Updated Template', exact: true })
        .click();
      const renderDownload = employee.waitForEvent('download');
      await employee
        .getByRole('button', { name: 'Download', exact: true })
        .click();
      const output = await readFile((await (await renderDownload).path())!);
      const xml = strFromU8(unzipSync(output)['word/document.xml']!);
      expect(xml).toContain('Synthetic browser &amp; &lt;reason&gt;');
      expect(xml).toContain('REPLACEMENT');
      expect(xml).not.toContain('{d.');
      await expect(employee.locator('#print-template-choice')).toHaveCount(0);
      check(
        'F09 actual non-manager employee selects published revision and renders real leave source through three intersected policies, browser download contains escaped DTO',
      );
      const sets =
        h.testApp.application.container.resolve(
          authorizationToken,
        ).permissionSets;
      const defaults = (await sets.get('oa-document-print'))!;
      for (const action of ['use', 'printLeave']) {
        const revoked = await h.pageFor(ownerSession);
        revoked.setDefaultTimeout(25000);
        revoked.on('pageerror', (e) => evidence.pageErrors.push(e.message));
        await revoked.goto(printUrl);
        await revoked.locator('#print-template-choice').click();
        await revoked
          .getByRole('option', { name: 'Updated Template', exact: true })
          .click();
        await expect(
          revoked.getByRole('button', { name: 'Download', exact: true }),
        ).toBeEnabled();
        await sets.update(defaults.key, {
          ...defaults,
          grants: defaults.grants.map((g) => ({
            ...g,
            actions: g.actions.filter((a) => a.action !== action),
          })),
        });
        await revoked
          .getByRole('button', { name: 'Download', exact: true })
          .click();
        await expect(
          revoked
            .getByText('Access denied. Contact an administrator', {
              exact: true,
            })
            .first(),
        ).toBeVisible();
        await expect(
          revoked.getByRole('button', { name: 'Download', exact: true }),
        ).toBeDisabled();
        await expect(revoked.locator('#print-template-choice')).toHaveCount(0);
        expect(
          (
            await json(revoked, `printTemplates/${id}/render`, 'POST', {
              recordId,
              revisionId: detail.record.currentRevisionId,
              locale: 'en-US',
            })
          ).status,
        ).toBe(403);
        evidence.expectedHttp.push(`${action} revocation returns 403`);
        await sets.update(defaults.key, defaults);
        await revoked.context().close();
      }
      check(
        'F09 use and source-print revoked after loaded selection return real 403, clear stale selector/detail and disable download',
      );
      const managerSet = (await sets.get('oa-print-template-admin'))!;
      await go(admin, `/${id}`);
      await expect(
        admin.getByRole('heading', { name: 'Updated Template', exact: true }),
      ).toBeVisible();
      await sets.update(managerSet.key, { ...managerSet, grants: [] });
      await admin
        .getByRole('button', { name: 'Download', exact: true })
        .first()
        .click();
      await expect(
        admin
          .getByText('Access denied. Contact an administrator', { exact: true })
          .first(),
      ).toBeVisible();
      await expect(
        admin.locator('dl').getByText('Browser Print Manager', { exact: true }),
      ).toHaveCount(0);
      await expect(
        admin.getByRole('button', { name: 'Edit', exact: true }),
      ).toHaveCount(0);
      await sets.update(managerSet.key, managerSet);
      check(
        'F09 manage revoked after detail load denies immutable content download and clears prior metadata/history/actions',
      );
      expect((await json(employee, 'printTemplates?mode=manage')).status).toBe(
        403,
      );
      let fail = true;
      await admin.route('**/api/printTemplates?*', async (route) => {
        if (!fail) return route.continue();
        fail = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Synthetic transient failure' },
          }),
        });
      });
      await go(admin);
      await expect(
        admin.getByText('Unable to load templates. Retry', { exact: true }),
      ).toBeVisible();
      await admin.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(
        admin.getByRole('link', { name: 'Updated Template', exact: true }),
      ).toBeVisible();
      await admin.unroute('**/api/printTemplates?*');
      await go(admin, '?source=payment&page=2');
      await admin
        .getByRole('combobox', { name: 'Business source', exact: true })
        .click();
      await admin.getByRole('option', { name: 'Leave', exact: true }).click();
      expect(new URL(admin.url()).searchParams.get('page')).toBeNull();
      await expect(
        admin.getByRole('link', { name: 'Updated Template', exact: true }),
      ).toBeVisible();
      const missingId = randomUUID();
      const missingResponse = admin.waitForResponse((r) =>
        r.url().includes(`/api/printTemplates/${missingId}`),
      );
      await go(admin, `/${missingId}?source=leave`);
      expect((await missingResponse).status()).toBe(403);
      await expect(
        admin
          .getByText('Access denied. Contact an administrator', { exact: true })
          .first(),
      ).toBeVisible();
      await expect(
        admin.getByRole('button', { name: 'Retry', exact: true }),
      ).toHaveCount(0);
      await admin.route(`**/api/printTemplates/${missingId}?*`, (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { message: 'Synthetic missing response' },
          }),
        }),
      );
      await admin.getByRole('button', { name: 'Refresh', exact: true }).click();
      await expect(admin).toHaveURL(`${base}/print-templates?source=leave`);
      await admin.unroute(`**/api/printTemplates/${missingId}?*`);
      evidence.expectedHttp.push(
        'missing UUID actual 403; fault-injected 404 source return',
      );
      check(
        'F09 transient 500 Retry restores list; source filtering resets URL page; actual missing UUID is denied; injected 404 returns to filtered list',
      );
      for (const locale of ['en-US', 'zh-CN'])
        for (const theme of ['light', 'dark'])
          for (const preset of ['compact', 'default']) {
            const mobile = await h.pageFor(managerSession, {
              locale,
              viewport: { width: 375, height: 812 },
            });
            mobile.setDefaultTimeout(25000);
            mobile.on('pageerror', (e) => evidence.pageErrors.push(e.message));
            await mobile.addInitScript(
              ({ theme, preset }) => {
                localStorage.setItem('nocobase:main:theme:color-scheme', theme);
                localStorage.setItem('nocobase:main:theme:preset', preset);
              },
              { theme, preset },
            );
            await go(mobile, `/${id}`);
            await expect(
              mobile.getByRole('heading', {
                name: 'Updated Template',
                exact: true,
              }),
            ).toBeVisible();
            await expect(mobile.locator('html')).toHaveClass(new RegExp(theme));
            await expect(mobile.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            expect(
              await mobile.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
              ),
            ).toBe(true);
            const edit = mobile.getByRole('button', {
              name: locale === 'zh-CN' ? '编辑' : 'Edit',
              exact: true,
            });
            await expect(edit).toBeVisible();
            const box = await edit.boundingBox();
            expect(box!.y + box!.height).toBeLessThanOrEqual(812);
            await shot(mobile, `mobile-${locale}-${theme}-${preset}`);
            await edit.click();
            await expect(mobile.locator('#print-template-name')).toBeVisible();
            await mobile
              .getByRole('button', {
                name: locale === 'zh-CN' ? '取消' : 'Cancel',
                exact: true,
              })
              .click();
            await expect(mobile.locator('#print-template-name')).toHaveCount(0);
            await mobile.context().close();
          }
      check(
        'F09 375px bilingual light/dark compact/default real detail and edit overlay, no document overflow, fixed footer accessible',
      );
      expect(evidence.pageErrors).toEqual([]);
      await writeFile(
        path.join(h.screenshotsDir, '..', 'evidence.json'),
        JSON.stringify(evidence, null, 2),
      );
      console.log(JSON.stringify(evidence, null, 2));
    } finally {
      await h.close();
    }
  },
  300000,
);

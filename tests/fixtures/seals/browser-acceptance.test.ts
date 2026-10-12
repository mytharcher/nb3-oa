// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { expect, it } from 'vitest';
import { expect as browserExpect, type Page } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.runIf(process.env.OA_SEALS_BROWSER === '1')(
  'isolated real-role seal browser creation, approval, checkout and return',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'seals',
      apiPort: 14159,
      vitePort: 15159,
    });
    const errors: string[] = [];
    try {
      const owner = await createEmployee(h.testApp, 'Browser Seal Applicant');
      const head = await createEmployee(h.testApp, 'Browser Seal Head');
      const legal = await createEmployee(h.testApp, 'Browser Seal Legal');
      const keeper = await createEmployee(h.testApp, 'Browser Seal Keeper');
      const gm = await createEmployee(h.testApp, 'Browser Seal GM');
      const adminOnly = await createEmployee(
        h.testApp,
        'Browser Seal Administrative Viewer',
      );
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      const department = await org.createDepartment(
        { title: 'Browser seal department', managerId: head.userId },
        { actorId: head.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: owner.userId, primary: true },
        { actorId: head.userId },
      );
      await org.addDutyRoleMember('legal', legal.userId, {
        actorId: head.userId,
      });
      await org.addDutyRoleMember('gm', gm.userId, { actorId: head.userId });
      await org.addDutyRoleMember('sealKeeper', keeper.userId, {
        actorId: head.userId,
      });
      await org.addDutyRoleMember('admin', keeper.userId, {
        actorId: head.userId,
      });
      await org.addDutyRoleMember('admin', adminOnly.userId, {
        actorId: head.userId,
      });
      const pages = await Promise.all(
        [owner, head, legal, keeper, gm].map(async (person) =>
          h.pageFor(await person.session()),
        ),
      );
      for (const page of pages) {
        page.setDefaultTimeout(20000);
        page.on('pageerror', (error) => errors.push(error.message));
      }
      const [applicant, manager, , custodian, chief] = pages;
      const go = (page: Page, suffix: string) =>
        page.goto(`${h.origin}${h.basePath}${suffix}`, {
          waitUntil: 'domcontentloaded',
        });
      async function json(page: Page, suffix: string) {
        return page.evaluate(
          async ({ basePath, suffix }) => {
            const response = await fetch(`${basePath}/api/${suffix}`);
            return { status: response.status, body: await response.json() };
          },
          { basePath: h.basePath, suffix },
        );
      }
      async function chooseDate(
        page: Page,
        id: string,
        timeLabel: string,
        day: Date,
        time: string,
      ) {
        await page.locator(`#${id}`).click();
        const iso = day.toLocaleDateString('en-US');
        await page.locator(`[data-day="${iso}"]:visible`).last().click();
        await page.locator(`input[aria-label="${timeLabel}"]`).fill(time);
      }
      async function action(
        page: Page,
        id: string,
        label: string,
        fill?: () => Promise<void>,
      ) {
        const loaded = page.waitForResponse(
          (response) =>
            response
              .url()
              .includes(`/sealBrowser/requests/${id}/capabilities`) &&
            response.status() === 200,
        );
        await go(page, `/seal-requests/${id}`);
        await loaded;
        console.info(
          'BROWSER_ACTION',
          label,
          (
            await page
              .locator(
                '[data-slot=record-detail-footer], [data-slot=route-overlay-footer]',
              )
              .allTextContents()
          ).join('|'),
        );
        const primary = page.getByRole('button', { name: label, exact: true });
        try {
          await browserExpect(primary).toBeVisible({ timeout: 5000 });
          await primary.click();
        } catch {
          await page
            .getByRole('button', { name: 'More actions', exact: true })
            .click();
          await page
            .getByRole('menuitem', { name: label, exact: true })
            .click();
        }
        const dialog = page.getByRole('dialog').last();
        await browserExpect(
          dialog.getByRole('button', { name: 'Confirm action', exact: true }),
        ).toBeVisible();
        if (fill) await fill();
        const command = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            response.url().endsWith(`/sealRequests/${id}/actions`),
        );
        await dialog
          .getByRole('button', { name: 'Confirm action', exact: true })
          .click();
        const response = await command;
        expect({
          status: response.status(),
          error: response.status() >= 400 ? await response.json() : undefined,
        }).toMatchObject({ status: 200 });
        await browserExpect(page).toHaveURL(
          new RegExp(`/seal-requests/${id}$`),
        );
      }
      // S01: prepare the actual instance through the real browser management entry.
      await go(custodian, '/seal-instances#management');
      await custodian
        .getByRole('button', { name: 'New seal', exact: true })
        .click();
      await custodian.locator('#seal-instance-code').fill('BROWSER-SEAL');
      await custodian
        .locator('#seal-instance-name')
        .fill('Browser actual seal');
      await custodian
        .locator('#seal-instance-reason')
        .fill('Disposable synthetic physical asset');
      await custodian.locator('#seal-instance-type').click();
      await custodian
        .getByRole('option', { name: 'Company seal', exact: true })
        .click();
      await custodian
        .getByRole('button', { name: 'Save seal', exact: true })
        .click();
      await browserExpect(custodian).toHaveURL(
        new RegExp('/seal-instances#management$'),
      );
      const instances = await json(custodian, 'seals');
      expect(instances.body.data[0]).toMatchObject({
        code: 'BROWSER-SEAL',
        version: 1,
        active: true,
      });
      await custodian
        .getByRole('button', { name: 'Edit seal', exact: true })
        .click();
      await custodian
        .locator('#seal-instance-reason')
        .fill('Browser metadata edit');
      await custodian
        .locator('#seal-instance-name')
        .fill('Browser actual seal');
      await custodian
        .getByRole('button', { name: 'Save seal', exact: true })
        .click();
      await browserExpect(custodian).toHaveURL(
        new RegExp('/seal-instances#management$'),
      );
      expect((await json(custodian, 'seals')).body.data[0].version).toBe(2);
      for (const active of [false, true]) {
        await custodian
          .getByRole('button', { name: 'Edit seal', exact: true })
          .click();
        await custodian
          .locator('#seal-instance-reason')
          .fill(
            active ? 'Re-enable physical seal' : 'Disable unused physical seal',
          );
        await custodian.getByRole('switch').click();
        await browserExpect(custodian.getByRole('switch')).toHaveAttribute(
          'aria-checked',
          String(active),
        );
        await custodian.setViewportSize({ width: 375, height: 812 });
        expect(
          await custodian.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
        ).toBe(false);
        await browserExpect(
          custodian.getByRole('button', { name: 'Save seal', exact: true }),
        ).toBeInViewport();
        await browserExpect(
          custodian.getByRole('button', { name: 'Cancel', exact: true }),
        ).toBeInViewport();
        await browserExpect
          .poll(
            async () =>
              (await custodian
                .locator('[data-slot=route-overlay-footer]')
                .boundingBox())!.y +
              (await custodian
                .locator('[data-slot=route-overlay-footer]')
                .boundingBox())!.height,
          )
          .toBeLessThanOrEqual(812);
        await custodian.screenshot({
          path: `${h.screenshotsDir}/management-${active ? 'enabled' : 'disabled'}-mobile.png`,
          fullPage: true,
        });
        await custodian
          .getByRole('button', { name: 'Save seal', exact: true })
          .click();
        if (!active)
          await custodian
            .getByRole('button', { name: 'Disable seal', exact: true })
            .click();
        await browserExpect(custodian).toHaveURL(
          new RegExp('/seal-instances#management$'),
        );
        expect((await json(custodian, 'seals')).body.data[0].active).toBe(
          active,
        );
        await custodian.setViewportSize({ width: 1365, height: 900 });
      }
      const sets =
        h.testApp.application.container.resolve(
          authorizationToken,
        ).permissionSets;
      // S02: template source is selected in the real management form.
      await go(custodian, '/print-templates/new');
      await custodian
        .locator('#print-template-name')
        .fill('Browser actual seal registration');
      await custodian.locator('#print-template-source').click();
      await custodian
        .getByRole('option', { name: 'Seal registration', exact: true })
        .click();
      await custodian
        .getByRole('button', { name: 'Create', exact: true })
        .click();
      await browserExpect(custodian).toHaveURL(new RegExp('/print-templates$'));
      const templates = await json(custodian, 'printTemplates?mode=manage');
      const templateId = templates.body.data[0].id;
      const docx = Buffer.from(
        zipSync({
          '[Content_Types].xml': strToU8(
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
          ),
          '_rels/.rels': strToU8(
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
          ),
          'word/document.xml': strToU8(
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{d.number} {d.actualCopies} {d.sealedAt}</w:t></w:r></w:p></w:body></w:document>',
          ),
        }),
      );
      await go(custodian, `/print-templates/upload/${templateId}`);
      await custodian.locator('#print-template-file').setInputFiles({
        name: 'actual-seal.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: docx,
      });
      await custodian
        .getByRole('button', { name: 'Upload revision', exact: true })
        .click();
      await browserExpect(custodian).toHaveURL(new RegExp('/print-templates$'));
      await org.removeDutyRoleMember('admin', keeper.userId, {
        actorId: head.userId,
      });
      const administrativeViewer = await h.pageFor(await adminOnly.session());
      administrativeViewer.on('pageerror', (error) =>
        errors.push(error.message),
      );
      for (const external of [false, true]) {
        const purpose = external
          ? 'Browser real checkout'
          : 'Browser actual stamping';
        await go(applicant, '/seal-requests#browser-source');
        await applicant
          .getByRole('button', { name: 'New seal request', exact: true })
          .click();
        await applicant.locator('#seal-type').click();
        await applicant
          .getByRole('option', { name: 'Company seal', exact: true })
          .click();
        await applicant.locator('#seal-purpose').pressSequentially(purpose);
        await applicant.locator('#seal-copies').fill('2');
        if (external) {
          await applicant.getByRole('switch').click();
          const tomorrow = new Date(Date.now() + 86400000);
          await chooseDate(
            applicant,
            'seal-due',
            'Expected return time',
            tomorrow,
            '23:00',
          );
        }
        await applicant.locator('#seal-upload').setInputFiles({
          name: 'synthetic-seal.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4\nDisposable seal evidence'),
        });
        await browserExpect(
          applicant.getByRole('button', { name: 'Remove', exact: true }),
        ).toBeVisible();
        await applicant
          .getByRole('button', { name: 'Save and submit', exact: true })
          .click();
        await browserExpect(applicant).toHaveURL(
          new RegExp('/seal-requests#browser-source$'),
        );
        const list = await json(applicant, 'sealRequests');
        expect(list.status).toBe(200);
        const record = list.body.data.find(
          (r: { purpose: string }) => r.purpose === purpose,
        );
        expect(record).toBeTruthy();
        const id = record.id;
        await action(manager, id, 'Approve');
        if (external) await action(chief, id, 'Approve');
        await action(custodian, id, 'Claim');
        await action(custodian, id, 'Complete actual handling', async () => {
          await custodian.locator('#seal-instance').click();
          await custodian
            .getByRole('option', {
              name: 'Browser actual seal · BROWSER-SEAL',
              exact: true,
            })
            .click();
          const today = new Date();
          await chooseDate(
            custodian,
            external ? 'seal-borrowedAt' : 'seal-sealedAt',
            external ? 'Actual checkout time' : 'Actual sealing time',
            today,
            '00:01',
          );
        });
        if (external) {
          const borrowed = await json(applicant, `sealRequests/${id}`);
          expect(borrowed.body.data.record.status).toBe('returning');
          expect(borrowed.body.data.record.actualCopies).toBeNull();
          expect(borrowed.body.data.record.sealedAt).toBeNull();
          await action(custodian, id, 'Claim');
          await action(custodian, id, 'Complete actual handling', async () => {
            const today = new Date();
            await chooseDate(
              custodian,
              'seal-sealedAt',
              'Actual sealing time',
              today,
              '00:02',
            );
            await chooseDate(
              custodian,
              'seal-returnedAt',
              'Actual return time',
              today,
              '00:03',
            );
          });
        }
        const completed = await json(applicant, `sealRequests/${id}`);
        expect(completed.status).toBe(200);
        expect(completed.body.data.record.status).toBe('completed');
        const ledgerId = completed.body.data.record.ledgerId;
        await go(applicant, `/seal-ledger#ledger-source`);
        await applicant
          .getByRole('link', { name: ledgerId, exact: true })
          .click();
        await browserExpect(applicant).toHaveURL(
          new RegExp(`/seal-ledger/${ledgerId}#ledger-source$`),
        );
        await browserExpect(
          applicant.getByRole('heading', {
            name: completed.body.data.record.number,
            exact: true,
          }),
        ).toBeVisible();
        await applicant.setViewportSize({ width: 375, height: 812 });
        expect(
          await applicant.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
        ).toBe(false);
        await browserExpect(
          applicant.getByRole('button', {
            name: 'Download business document',
            exact: true,
          }),
        ).toBeInViewport();
        await applicant.screenshot({
          path: `${h.screenshotsDir}/ledger-${external ? 'return' : 'internal'}-mobile.png`,
          fullPage: true,
        });
        await applicant.setViewportSize({ width: 1365, height: 900 });
        if (!external) {
          const chinese = await h.pageFor(await owner.session(), {
            locale: 'zh-CN',
          });
          chinese.on('pageerror', (error) => errors.push(error.message));
          await chinese.addInitScript((basePath) => {
            const scope = encodeURIComponent(
              basePath.replace(/^\/+|\/+$/g, ''),
            );
            localStorage.setItem(
              `nocobase:${scope}:theme:color-scheme`,
              'dark',
            );
            localStorage.setItem(`nocobase:${scope}:theme:preset`, 'default');
          }, h.basePath);
          await chinese.setViewportSize({ width: 375, height: 812 });
          await go(chinese, `/seal-ledger/${ledgerId}#ledger-source`);
          await browserExpect(
            chinese.getByRole('heading', {
              name: completed.body.data.record.number,
              exact: true,
            }),
          ).toBeVisible();
          await browserExpect(chinese.locator('html')).toHaveClass(/dark/);
          await browserExpect(
            chinese.getByText('归还确认人', { exact: true }),
          ).toBeVisible();
          expect(
            await chinese.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            ),
          ).toBe(false);
          await chinese.screenshot({
            path: `${h.screenshotsDir}/ledger-internal-zh-dark-mobile.png`,
            fullPage: true,
          });
          await chinese.context().close();
        }
        await go(custodian, `/seal-ledger/${ledgerId}#print-source`);
        await custodian
          .getByRole('button', {
            name: 'Download business document',
            exact: true,
          })
          .click();
        await custodian.locator('#print-template-choice').click();
        await custodian
          .getByRole('option', {
            name: 'Browser actual seal registration',
            exact: true,
          })
          .click();
        await browserExpect(
          custodian.getByRole('button', { name: 'Download', exact: true }),
        ).toBeEnabled();
        await custodian.setViewportSize({ width: 375, height: 812 });
        expect(
          await custodian.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 1,
          ),
        ).toBe(false);
        await custodian.screenshot({
          path: `${h.screenshotsDir}/print-${external ? 'return' : 'internal'}-mobile.png`,
          fullPage: true,
        });
        const downloaded = custodian.waitForEvent('download');
        await custodian
          .getByRole('button', { name: 'Download', exact: true })
          .click();
        const file = await downloaded;
        const xml = strFromU8(
          unzipSync(await readFile((await file.path())!))['word/document.xml']!,
        );
        expect(xml).toContain(completed.body.data.record.number);
        expect(xml).not.toContain('{d.');
        await browserExpect(custodian).toHaveURL(
          new RegExp(`/seal-ledger/${ledgerId}#print-source$`),
        );
        await custodian.setViewportSize({ width: 1365, height: 900 });
        if (!external) {
          // Loaded selection is invalidated when current source permission is revoked.
          await go(custodian, `/seal-requests/${id}/print`);
          await custodian.locator('#print-template-choice').click();
          await custodian
            .getByRole('option', {
              name: 'Browser actual seal registration',
              exact: true,
            })
            .click();
          await browserExpect(
            custodian.getByRole('button', { name: 'Download', exact: true }),
          ).toBeEnabled();
          const custom = (await sets.get('oa-document-print'))!;
          await sets.update(custom.key, {
            ...custom,
            grants: custom.grants.map((g) => ({
              ...g,
              actions: g.actions.filter(
                (a) => a.action !== 'printSealRegistration',
              ),
            })),
          });
          const refused = custodian.waitForResponse(
            (response) =>
              response.url().endsWith(`/printTemplates/${templateId}/render`) &&
              response.request().method() === 'POST',
          );
          await custodian
            .getByRole('button', { name: 'Download', exact: true })
            .click();
          expect((await refused).status()).toBe(403);
          await browserExpect(
            custodian.locator('#print-template-choice'),
          ).toHaveCount(0);
          await sets.update(custom.key, custom);
          // A source grant never substitutes for current ordinary receipt/ledger view.
          const adminView = (await sets.get('oa-seals-admin'))!;
          const employeeView = (await sets.get('oa-seals-employee'))!;
          const keeperView = (await sets.get('oa-seals-keeper'))!;
          await go(custodian, `/seal-ledger/${ledgerId}#revoked-source`);
          await browserExpect(
            custodian.getByRole('heading', {
              name: completed.body.data.record.number,
              exact: true,
            }),
          ).toBeVisible();
          for (const saved of [adminView, employeeView, keeperView])
            await sets.update(saved.key, {
              ...saved,
              grants: saved.grants.filter(
                (g) => g.resource.id !== 'oa.sealLedger',
              ),
            });
          const ordinaryRefusal = await custodian.evaluate(
            async ({ basePath, templateId, recordId }) => {
              const template = await (
                await fetch(
                  `${basePath}/api/printTemplates/${templateId}?mode=use`,
                )
              ).json();
              return (
                await fetch(
                  `${basePath}/api/printTemplates/${templateId}/render`,
                  {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                      recordId,
                      revisionId: template.data.record.currentRevisionId,
                      locale: 'en-US',
                    }),
                  },
                )
              ).status;
            },
            {
              basePath: h.basePath,
              templateId,
              recordId: completed.body.data.record.ledgerId,
            },
          );
          expect(ordinaryRefusal).toBe(403);
          expect((await json(custodian, `sealLedger/${ledgerId}`)).status).toBe(
            403,
          );
          const refresh = custodian
            .getByRole('button', { name: 'Refresh', exact: true })
            .last();
          if (await refresh.isVisible()) await refresh.click();
          await browserExpect(
            custodian.getByRole('heading', {
              name: completed.body.data.record.number,
              exact: true,
            }),
          ).toHaveCount(0);

          for (const saved of [adminView, employeeView, keeperView])
            await sets.update(saved.key, saved);
          await sets.update(custom.key, custom);
        }
        // Default employee own ledger/receipt and default administrative viewer both render real bytes.
        for (const actorPage of [applicant, administrativeViewer, chief]) {
          await go(actorPage, `/seal-requests/${id}`);
          const rendered = await actorPage.evaluate(
            async ({ basePath, templateId, recordId }) => {
              const template = await (
                await fetch(
                  `${basePath}/api/printTemplates/${templateId}?mode=use`,
                )
              ).json();
              const result = await fetch(
                `${basePath}/api/printTemplates/${templateId}/render`,
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    recordId,
                    revisionId: template.data.record.currentRevisionId,
                    locale: 'en-US',
                  }),
                },
              );
              const bytes = new Uint8Array(await result.arrayBuffer());
              return { status: result.status, prefix: [...bytes.slice(0, 4)] };
            },
            {
              basePath: h.basePath,
              templateId,
              recordId: completed.body.data.record.ledgerId,
            },
          );
          expect(rendered.status).toBe(actorPage === chief ? 403 : 200);
          if (actorPage !== chief)
            expect(rendered.prefix).toEqual([80, 75, 3, 4]);
        }
        await custodian.screenshot({
          path: `${h.screenshotsDir}/${external ? 'returned' : 'stamped'}.png`,
          fullPage: true,
        });
        await go(applicant, `/seal-requests/${id}#mobile`);
        await applicant.setViewportSize({ width: 375, height: 812 });
        await browserExpect(
          applicant.getByRole('heading', {
            name: completed.body.data.record.number,
            exact: true,
          }),
        ).toBeVisible();
        expect(
          await applicant.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 1,
          ),
        ).toBe(false);
        await applicant.screenshot({
          path: `${h.screenshotsDir}/${external ? 'returned' : 'stamped'}-mobile.png`,
          fullPage: true,
        });
        await applicant.setViewportSize({ width: 1365, height: 900 });
      }
      await org.addDutyRoleMember('admin', keeper.userId, {
        actorId: head.userId,
      });
      // S03: loaded admin form is wiped on POST denial after revocation.
      await go(custodian, '/seal-instances/new');
      await custodian.locator('#seal-instance-code').fill('REVOKED-SEAL');
      await custodian
        .locator('#seal-instance-name')
        .fill('Revoked metadata input');
      await custodian.locator('#seal-instance-reason').fill('Must never save');
      await custodian.locator('#seal-instance-type').click();
      await custodian
        .getByRole('option', { name: 'Company seal', exact: true })
        .click();
      const adminSet = (await sets.get('oa-seals-admin'))!;
      await sets.update(adminSet.key, {
        ...adminSet,
        grants: adminSet.grants.map((g) => ({
          ...g,
          actions: g.actions.filter((a) => a.action !== 'manage'),
        })),
      });
      const deniedWrite = custodian.waitForResponse(
        (r) => r.url().endsWith('/seals') && r.request().method() === 'POST',
      );
      await custodian
        .getByRole('button', { name: 'Save seal', exact: true })
        .click();
      expect((await deniedWrite).status()).toBe(403);
      await browserExpect(custodian.locator('#seal-instance-name')).toHaveCount(
        0,
      );
      await browserExpect(
        custodian.getByRole('button', { name: 'Save seal', exact: true }),
      ).toBeDisabled();
      await custodian.setViewportSize({ width: 375, height: 812 });
      expect(
        await custodian.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
      ).toBe(false);
      await browserExpect(
        custodian.getByRole('button', { name: 'Save seal', exact: true }),
      ).toBeInViewport();
      await browserExpect(
        custodian.getByRole('button', { name: 'Cancel', exact: true }),
      ).toBeInViewport();
      await browserExpect
        .poll(
          async () =>
            (await custodian
              .locator('[data-slot=route-overlay-footer]')
              .boundingBox())!.y +
            (await custodian
              .locator('[data-slot=route-overlay-footer]')
              .boundingBox())!.height,
        )
        .toBeLessThanOrEqual(812);
      await custodian.screenshot({
        path: `${h.screenshotsDir}/management-revoked-mobile.png`,
        fullPage: true,
      });
      await sets.update(adminSet.key, adminSet);
      await grantToUser(
        h.testApp,
        'seal-non-admin-manage',
        [
          composite('oa.seals', {
            view: { seals: 'allRecords' },
            manage: { seals: 'allRecords' },
          }),
        ],
        owner.userId,
      );
      await go(applicant, '/seal-instances/new');
      await applicant.locator('#seal-instance-code').fill('NO-ROLE-SEAL');
      await applicant
        .locator('#seal-instance-name')
        .fill('No real administrative role');
      await applicant.locator('#seal-instance-reason').fill('Must never save');
      await applicant.locator('#seal-instance-type').click();
      await applicant
        .getByRole('option', { name: 'Company seal', exact: true })
        .click();
      const roleDenied = applicant.waitForResponse(
        (r) => r.url().endsWith('/seals') && r.request().method() === 'POST',
      );
      await applicant
        .getByRole('button', { name: 'Save seal', exact: true })
        .click();
      expect((await roleDenied).status()).toBe(403);
      await browserExpect(applicant.locator('#seal-instance-name')).toHaveCount(
        0,
      );
      expect((await json(custodian, 'seals')).body.data).toHaveLength(1);
      expect(errors).toEqual([]);
    } finally {
      await h.close();
    }
  },
  360000,
);

// @vitest-environment node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { it } from 'vitest';
import { expect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
const headers = [
  'userId',
  'date',
  'punchKind',
  'punchedAt',
  'source',
  'sourceKey',
  'sourceData',
];
async function xlsx(rows: unknown[][]) {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('attendance').addRows([headers, ...rows]);
  return Buffer.from(await book.xlsx.writeBuffer());
}
it.runIf(process.env.OA_ATTENDANCE_IMPORT_BROWSER === '1')(
  'controlled Excel import actual HR browser acceptance',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'attendance-import',
      apiPort: 14159,
      vitePort: 15159,
    });
    const evidence = {
      checks: [] as string[],
      screenshots: [] as string[],
      errors: [] as string[],
    };
    const url = `${h.origin}${h.basePath}/attendance-import`;
    try {
      const c = h.testApp.application.container,
        db = c.resolve(databaseManagerToken),
        org = c.resolve(organizationServiceToken);
      const hr = await createEmployee(h.testApp, 'Synthetic Excel HR'),
        employee = await createEmployee(h.testApp, 'Synthetic Excel employee'),
        outsider = await createEmployee(h.testApp, 'Synthetic Excel outsider');
      await org.addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      const session = await hr.session(),
        page = await h.pageFor(session);
      page.setDefaultTimeout(20000);
      page.on('pageerror', (e) => evidence.errors.push(e.message));
      await page.goto(`${h.origin}${h.basePath}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const baseline = [...evidence.errors];
      await page.goto(url);
      await expect(
        page.getByRole('heading', { name: 'Import attendance evidence' }),
      ).toBeVisible();
      await expect(
        page.getByText('Choose an .xlsx file to start the preview.'),
      ).toBeVisible();
      const downloadPromise = page.waitForEvent('download');
      await page
        .getByRole('button', { name: 'Download Excel template' })
        .click();
      const download = await downloadPromise,
        stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
      const template = new ExcelJS.Workbook();
      await template.xlsx.load(Buffer.concat(chunks));
      expect(template.worksheets[0].rowCount).toBe(1);
      expect(template.worksheets[0].getRow(1).values).toEqual([
        undefined,
        ...headers,
      ]);
      evidence.checks.push(
        'D2 browser downloads a real empty XLSX readable by ExcelJS',
      );
      const original = [
        employee.userId,
        '2035-01-02',
        'in',
        '',
        'browser-excel',
        'one',
        '{"raw":"原始记录","nested":[1,true,null]}',
      ];
      const upload = async (rows: unknown[][]) =>
        page.locator('#attendance-import-file').setInputFiles({
          name: 'attendance.xlsx',
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: await xlsx(rows),
        });
      for (const raw of ['{"n":9007199254740993}', '{"n":1,"n":2}']) {
        await upload([[...original.slice(0, 6), raw]]);
        await expect(
          page.locator('#attendance-import-file-error'),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Confirm batch import' }),
        ).toHaveCount(0);
        expect(await db.repository('attendanceRecords').count()).toBe(0);
      }
      const malicious = zipSync(unzipSync(await xlsx([original])), {
        level: 0,
      });
      const central = malicious.findIndex(
        (_, i) =>
          malicious[i] === 0x50 &&
          malicious[i + 1] === 0x4b &&
          malicious[i + 2] === 1 &&
          malicious[i + 3] === 2,
      );
      new DataView(malicious.buffer).setUint32(central + 24, 0, true);
      await page.locator('#attendance-import-file').setInputFiles({
        name: 'malicious.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(malicious),
      });
      await expect(page.locator('#attendance-import-file-error')).toContainText(
        'safe extraction limits',
      );
      await expect(
        page.getByRole('button', { name: 'Confirm batch import' }),
      ).toHaveCount(0);
      const deflateFiles = unzipSync(await xlsx([original]));
      deflateFiles['unused.bin'] = strToU8('ABCDEF'.repeat(100000));
      const deflateLie = zipSync(deflateFiles),
        deflateView = new DataView(deflateLie.buffer);
      for (let at = 0; at + 46 < deflateLie.length; at++) {
        if (deflateView.getUint32(at, true) !== 0x02014b50) continue;
        const name = strFromU8(
          deflateLie.subarray(
            at + 46,
            at + 46 + deflateView.getUint16(at + 28, true),
          ),
        );
        if (name !== 'unused.bin') continue;
        deflateView.setUint32(at + 24, 3, true);
        deflateView.setUint32(
          deflateView.getUint32(at + 42, true) + 22,
          3,
          true,
        );
      }
      await page.locator('#attendance-import-file').setInputFiles({
        name: 'deflate-lie.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from(deflateLie),
      });
      await expect(page.locator('#attendance-import-file-error')).toContainText(
        'safe extraction limits',
      );
      await expect(
        page.getByRole('button', { name: 'Confirm batch import' }),
      ).toHaveCount(0);
      expect(await db.repository('attendanceRecords').count()).toBe(0);
      evidence.checks.push(
        'Acceptance fixes: browser rejects unsafe JSON integer/duplicate key and false stored/deflate ZIP output size before any record write',
      );
      await upload([original]);
      await expect(page.getByText('Preview: 1 rows')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Confirm batch import' }),
      ).toBeDisabled();
      await page.getByText('Expand original evidence', { exact: true }).click();
      await expect(page.getByText('原始记录', { exact: false })).toBeVisible();
      let posts = 0;
      page.on('request', (r) => {
        if (
          r.method() === 'POST' &&
          r.url().endsWith('/attendanceManagement/ingestBatch')
        )
          posts++;
      });
      await page.getByRole('checkbox').click();
      const responsePromise = page.waitForResponse((r) =>
        r.url().endsWith('/attendanceManagement/ingestBatch'),
      );
      await page
        .getByRole('button', { name: 'Confirm batch import' })
        .dblclick();
      const first = await responsePromise;
      expect(first.status()).toBe(200);
      const receipt = (await first.json()).data;
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: '1 evidence rows imported.' }),
      ).toBeVisible();
      expect(posts).toBe(1);
      const persisted = await db
        .repository('attendanceRecords')
        .findOne({ filter: { id: receipt.recordIds[0] } });
      expect(persisted?.sourceData).toEqual({
        raw: '原始记录',
        nested: [1, true, null],
      });
      expect(await db.repository('attendanceRecords').count()).toBe(1);
      evidence.checks.push(
        'D2/D4/D5 real Excel shared strings preserve source JSON; confirmation gates one actual atomic HTTP',
      );
      await upload([original]);
      await expect(page.getByText('Preview: 1 rows')).toBeVisible();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: '1 evidence rows imported.' }),
      ).toHaveCount(0);
      await page.getByRole('checkbox').click();
      await page.getByRole('button', { name: 'Confirm batch import' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: '1 evidence rows imported.' }),
      ).toBeVisible();
      expect(await db.repository('attendanceRecords').count()).toBe(1);
      expect(
        await db
          .repository('auditLogs')
          .count({ filter: { action: 'attendance.ingest' } }),
      ).toBe(1);
      await upload([
        [...original.slice(0, 5), 'rolled-back', original[6]],
        [...original.slice(0, 6), '{"changed":true}'],
      ]);
      await expect(page.getByText('Preview: 2 rows')).toBeVisible();
      await page.getByRole('checkbox').click();
      await page.getByRole('button', { name: 'Confirm batch import' }).click();
      await expect(
        page.getByText(
          'A source key already has different evidence. No rows from this batch were imported.',
        ),
      ).toBeVisible();
      expect(await db.repository('attendanceRecords').count()).toBe(1);
      evidence.checks.push(
        'D5 real source replay is no-op; second-row source conflict rolls back first-row fact and audit',
      );
      await upload([
        [
          ...original.slice(0, 3),
          { formula: 'NOW()', result: 1 },
          ...original.slice(4),
        ],
      ]);
      await expect(page.locator('#attendance-import-file-error')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Confirm batch import' }),
      ).toHaveCount(0);
      evidence.checks.push('D3 real formula XLSX rejected before HTTP');
      await upload([[...original.slice(0, 5), 'retry', original[6]]]);
      await expect(page.getByText('Preview: 1 rows')).toBeVisible();
      await page.getByRole('checkbox').click();
      await page.route(
        '**/api/attendanceManagement/ingestBatch',
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              reason: 'PRIVATE',
              message: 'secret infrastructure',
            }),
          });
        },
        { times: 1 },
      );
      await page.getByRole('button', { name: 'Confirm batch import' }).click();
      await expect(
        page.getByText(
          'The batch could not be imported. Review the file and try again.',
        ),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Try importing again' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: '1 evidence rows imported.' }),
      ).toBeVisible();
      evidence.checks.push(
        'D6 injected one-time 500 preserves preview and actual retry succeeds without raw server error',
      );
      for (const locale of ['en-US', 'zh-CN'])
        for (const theme of ['light', 'dark'])
          for (const preset of ['compact', 'default']) {
            const visual = await h.pageFor(session, {
              locale,
              viewport: { width: 375, height: 812 },
            });
            await visual.addInitScript(
              ({ theme, preset }) => {
                localStorage.setItem('nocobase:main:theme:color-scheme', theme);
                localStorage.setItem('nocobase:main:theme:preset', preset);
              },
              { theme, preset },
            );
            await visual.goto(url);
            await visual.locator('#attendance-import-file').setInputFiles({
              name: 'attendance.xlsx',
              mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              buffer: await xlsx([original]),
            });
            await expect(
              visual.getByText(
                locale === 'zh-CN' ? '预览：1 行' : 'Preview: 1 rows',
              ),
            ).toBeVisible();
            await expect(visual.locator('html')).toHaveClass(new RegExp(theme));
            await expect(visual.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            expect(
              await visual.evaluate(
                () =>
                  document.documentElement.scrollWidth > window.innerWidth + 1,
              ),
            ).toBe(false);
            const screenshot = path.join(
              h.screenshotsDir,
              `mobile-${locale}-${theme}-${preset}.png`,
            );
            await visual.screenshot({ path: screenshot, fullPage: true });
            evidence.screenshots.push(screenshot);
            await visual.context().close();
          }
      evidence.checks.push(
        'D7 375px bilingual light/dark compact/default preview, no document horizontal overflow',
      );
      const denied = await h.pageFor(await outsider.session());
      await denied.goto(url);
      await expect(
        denied.getByText('Access denied', { exact: true }),
      ).toBeVisible();
      expect(await denied.locator('#attendance-import-file').count()).toBe(0);
      const permissionSets = c.resolve(authorizationToken).permissionSets;
      const set = await permissionSets.get('oa-attendance-import-hr');
      expect(set).toBeTruthy();
      await permissionSets.update(set!.key, { ...set!, grants: [] });
      await page.reload();
      await expect(
        page.getByText('Access denied', { exact: true }),
      ).toBeVisible();
      expect(await page.locator('#attendance-import-file').count()).toBe(0);
      evidence.checks.push(
        'D1 actual ordinary user and persisted grant revocation deny route and remove evidence controls',
      );
      expect(evidence.errors.filter((e) => !baseline.includes(e))).toEqual([]);
    } finally {
      await writeFile(
        path.join(h.screenshotsDir, 'attendance-import-evidence.json'),
        JSON.stringify(evidence, null, 2),
      );
      await h.close();
    }
  },
  240000,
);

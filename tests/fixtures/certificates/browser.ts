import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect as baseExpect, type Page } from '@playwright/test';
import { strToU8, zipSync, unzipSync, strFromU8 } from 'fflate';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { ALL, createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { templatePrintServiceToken } from '../../../server/providers/template-print/contract.js';
import { DOCX_MIME } from '../../../server/providers/template-print/renderer.js';
const expect = baseExpect.configure({ timeout: 30_000 });
const host = await startIsolatedBrowserApp({
  name: 'certificates',
  apiPort: 13391,
  vitePort: 13392,
});
const evidence = {
  scope:
    'Disposable whole main App; synthetic applicant, manager and actual HR duty; real Carbone DOCX; no production or Word/WPS claim',
  checks: [] as string[],
  screenshots: [] as string[],
  errors: [] as string[],
};
try {
  const c = host.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    templates = c.resolve(templatePrintServiceToken);
  const head = await createEmployee(
    host.testApp,
    'Certificate browser manager',
  );
  const owner = await createEmployee(
    host.testApp,
    'Certificate browser applicant',
    { managerId: head.employeeId },
  );
  const hr = await createEmployee(host.testApp, 'Certificate browser HR');
  const context = { actorId: head.userId };
  const department = await org.createDepartment(
    { title: 'Certificate browser department', managerId: head.userId },
    context,
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    context,
  );
  await org.addDutyRoleMember('hr', hr.userId, context);
  const template = await templates.create(
    hr.userId,
    {
      requestKey: randomUUID(),
      name: 'Browser fixed certificate',
      source: 'certificates',
    },
    ALL,
  );
  const bytes = zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{d.number} {d.employee.name} {d.income.monthlyFormatted}</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  const upload = await templates.upload(
    template.record.id,
    hr.userId,
    {
      requestKey: randomUUID(),
      version: 1,
      file: new File([bytes], 'browser-income.docx', { type: DOCX_MIME }),
    },
    ALL,
  );
  const ownerSession = await owner.session(),
    hrSession = await hr.session();
  const applicant = await host.pageFor(ownerSession),
    manager = await host.pageFor(await head.session()),
    handler = await host.pageFor(hrSession);
  await applicant.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined });
  });
  for (const page of [applicant, manager, handler]) {
    page.on('pageerror', (e) => evidence.errors.push(e.message));
    await page.addInitScript(() => {
      const prefs = JSON.parse(
        localStorage.getItem('certificate-browser-prefs') ??
          '{"locale":"en-US","theme":"light","preset":"compact"}',
      );
      localStorage.setItem('nocobase.locale', prefs.locale);
      localStorage.setItem('i18nextLng', prefs.locale);
      localStorage.setItem('nocobase:main:theme:color-scheme', prefs.theme);
      localStorage.setItem('nocobase:main:theme:preset', prefs.preset);
    });
  }
  async function go(page: Page, suffix: string) {
    await page.goto(`${host.origin}${host.basePath}/certificates${suffix}`);
  }
  async function shot(page: Page, name: string) {
    const target = path.join(host.screenshotsDir, `${name}.png`);
    await page.screenshot({ path: target, fullPage: true });
    evidence.screenshots.push(target);
  }
  async function action(page: Page, id: string, name: string) {
    await go(page, `/${id}/actions/${name}`);
    await expect(page.locator('#certificate-action')).toBeVisible();
    await page
      .getByRole('button', { name: 'Confirm', exact: true })
      .last()
      .click();
    await expect(page.locator('#certificate-action')).toHaveCount(0);
  }
  await go(applicant, '/new');
  await expect(applicant.locator('#certificate-form')).toBeVisible();
  await applicant.locator('#purpose').fill('Synthetic employment draft');
  const draftCreated = applicant.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      new URL(r.url()).pathname.endsWith('/api/certificateRequests'),
  );
  await applicant
    .getByRole('button', { name: 'Save draft', exact: true })
    .click();
  expect((await draftCreated).status()).toBe(200);
  await expect(applicant.locator('#certificate-form')).toHaveCount(0);
  await go(applicant, '/new');
  await expect(applicant.locator('#certificate-form')).toBeVisible();
  await applicant.locator('#certificateType').click();
  await applicant.getByRole('option', { name: 'Income', exact: true }).click();
  await applicant
    .locator('#purpose')
    .pressSequentially('Synthetic bank evidence');
  // Real IME composition leaves typed content stable.
  await applicant.locator('#purpose').focus();
  const ime = await applicant.context().newCDPSession(applicant);
  await ime.send('Input.imeSetComposition', {
    text: 'zhengming',
    selectionStart: 9,
    selectionEnd: 9,
  });
  await ime.send('Input.insertText', { text: '证明' });
  await ime.detach();
  const created = applicant.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      new URL(r.url()).pathname.endsWith('/api/certificateRequests'),
  );
  await applicant.getByRole('button', { name: 'Submit', exact: true }).click();
  const record = (await (await created).json()).data;
  await expect(applicant.locator('#certificate-form')).toHaveCount(0);
  const submitted = await ownerSession.fetch(
    `/certificateRequests/${record.id}`,
  );
  expect((await submitted.json()).data.record.status).toBe('head');
  evidence.checks.push(
    'Local HTTP compatibility: absent randomUUID still saves employment draft and directly submits income request with current edit grant',
  );
  await action(manager, record.id, 'approve');
  evidence.checks.push(
    'Q01: applicant creates income request with typing/IME; real employee manager approves through browser action; state enters HR handling',
  );
  await action(handler, record.id, 'claim');
  await go(handler, `/${record.id}/issue`);
  await expect(handler.locator('#certificate-issue')).toBeVisible();
  await handler.locator('#certificate-template').click();
  await handler
    .getByRole('option', { name: 'Browser fixed certificate' })
    .click();
  await handler.locator('#certificate-date').click();
  await handler.locator('[data-day="2026-10-11"]').click();
  await handler.locator('#certificate-income').pressSequentially('12345.67');
  const prepareResponse = handler.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().endsWith('/prepare'),
  );
  await handler
    .getByRole('button', { name: 'Prepare issuance', exact: true })
    .click();
  const preparation = (await (await prepareResponse).json()).data;
  expect(preparation.revisionId).toBe(upload.revision.id);
  const replacement = await templates.upload(
    template.record.id,
    hr.userId,
    {
      requestKey: randomUUID(),
      version: 2,
      file: new File([bytes], 'replacement.docx', { type: DOCX_MIME }),
    },
    ALL,
  );
  expect(replacement.revision.id).not.toBe(preparation.revisionId);
  await expect(
    handler.getByRole('button', { name: 'Generate document', exact: true }),
  ).toBeEnabled();
  // Simulate a worker outage at the actual renderer; browser receives real route failure.
  const realRender = templates.render.bind(templates);
  templates.render = async () => {
    throw new Error('isolated worker outage');
  };
  await handler
    .getByRole('button', { name: 'Generate document', exact: true })
    .click();
  await expect(
    handler.getByRole('alert').filter({ hasText: 'Unable to complete' }),
  ).toBeVisible();
  expect(await db.repository('certificateIssues').count()).toBe(0);
  expect(await db.repository('employeeArchiveReferences').count()).toBe(0);
  templates.render = async (...args) => {
    expect(args[2].revisionId).toBe(upload.revision.id);
    return realRender(...args);
  };
  await handler
    .getByRole('button', { name: 'Generate document', exact: true })
    .click();
  await expect(
    handler.getByRole('button', { name: 'Confirm issuance', exact: true }),
  ).toBeEnabled();
  const confirmResponse = handler.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().endsWith('/actions'),
  );
  await handler
    .getByRole('button', { name: 'Confirm issuance', exact: true })
    .click();
  const confirmation = await confirmResponse;
  expect(confirmation.status()).toBe(200);
  const replay = await hrSession.fetch(
    `/certificateRequests/${record.id}/actions`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: (await import('../../logic/oa-test-origin.js')).OA_TEST_ORIGIN,
      },
      body: confirmation.request().postData()!,
    },
  );
  expect(replay.status).toBe(200);
  expect(await db.repository('certificateIssues').count()).toBe(1);
  expect(await db.repository('employeeArchiveReferences').count()).toBe(1);
  await go(handler, `/${record.id}`);
  const download = handler.waitForEvent('download');
  await handler
    .getByRole('button', { name: 'Download DOCX', exact: true })
    .click();
  const actual = await download;
  expect(actual.suggestedFilename()).toMatch(/\.docx$/);
  const detail = (
    await (await hrSession.fetch(`/certificateRequests/${record.id}`)).json()
  ).data;
  const contentPath = `/certificateIssues/${detail.record.issueId}/content`,
    response = await hrSession.fetch(contentPath);
  const xml = strFromU8(
    unzipSync(new Uint8Array(await response.arrayBuffer()))[
      'word/document.xml'
    ],
  );
  expect(xml).toContain('12,345.67');
  expect(xml).toContain(preparation.number);
  evidence.checks.push(
    'Q02: HR claim/prepare fixed revision; actual renderer failure keeps issue/archive empty; retry generates real DOCX; confirmation replay creates exactly one issue/archive; browser download verified',
  );
  await go(applicant, `/${record.id}`);
  await expect(
    applicant.getByRole('button', { name: 'Download DOCX', exact: true }),
  ).toHaveCount(0);
  expect((await ownerSession.fetch(contentPath)).status).toBe(403);
  expect(await applicant.locator('body').innerText()).not.toContain(
    '12,345.67',
  );
  for (const locale of ['en-US', 'zh-CN'])
    for (const theme of ['light', 'dark'])
      for (const preset of ['compact', 'default']) {
        await handler.evaluate(
          (prefs) =>
            localStorage.setItem(
              'certificate-browser-prefs',
              JSON.stringify(prefs),
            ),
          { locale, theme, preset },
        );
        await handler.setViewportSize({ width: 375, height: 812 });
        await go(handler, `/${record.id}`);
        await expect(handler.getByRole('dialog').last()).toBeVisible();
        await expect(
          handler.getByRole('button', {
            name: locale === 'en-US' ? 'Download DOCX' : '下载 DOCX',
            exact: true,
          }),
        ).toBeVisible();
        expect(await handler.locator('html').getAttribute('data-theme')).toBe(
          preset,
        );
        expect(await handler.locator('html').getAttribute('class')).toContain(
          theme,
        );
        expect(
          await handler.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await shot(handler, `issued-${locale}-${theme}-${preset}-375`);
      }
  await handler.evaluate(() =>
    localStorage.setItem(
      'certificate-browser-prefs',
      JSON.stringify({ locale: 'en-US', theme: 'light', preset: 'compact' }),
    ),
  );
  const brokenDetail = `**/api/certificateRequests/${record.id}`;
  await handler.route(brokenDetail, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'ISOLATED_FAILURE' } }),
    }),
  );
  await go(handler, `/${record.id}`);
  await expect(
    handler.getByRole('button', { name: 'Retry', exact: true }),
  ).toBeVisible();
  await expect(
    handler.getByRole('button', { name: 'Download DOCX', exact: true }),
  ).toHaveCount(0);
  await handler.unroute(brokenDetail);
  await handler.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    handler.getByRole('button', { name: 'Download DOCX', exact: true }),
  ).toBeVisible();
  evidence.checks.push(
    'Q03: detail HTTP 500 hides stale downloads; browser Retry restores authorized detail',
  );
  const permissionSets = c.resolve(authorizationToken).permissionSets;
  const originalHr = (await permissionSets.get('oa-certificates-hr'))!;
  await permissionSets.update(originalHr.key, {
    ...originalHr,
    grants: originalHr.grants.map((grant) => ({
      ...grant,
      actions: grant.actions.filter((item) => item.action !== 'viewIncome'),
    })),
  });
  expect((await hrSession.fetch(contentPath)).status).toBe(403);
  await go(handler, `/${record.id}`);
  await expect(
    handler.getByRole('button', { name: 'Download DOCX', exact: true }),
  ).toHaveCount(0);
  await permissionSets.update(originalHr.key, originalHr);
  expect((await hrSession.fetch(contentPath)).status).toBe(200);
  evidence.checks.push(
    'Q03: revoking only independent viewIncome denies bytes while HR duty remains; restoring exact permission set restores access',
  );
  await org.removeDutyRoleMember('hr', hr.userId, context);
  expect((await hrSession.fetch(contentPath)).status).toBe(403);
  expect(
    (
      await hrSession.fetch(
        `/certificatePreparations/${preparation.id}/generate`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: (await import('../../logic/oa-test-origin.js'))
              .OA_TEST_ORIGIN,
          },
          body: '{}',
        },
      )
    ).status,
  ).toBe(403);
  await go(handler, `/${record.id}`);
  await expect(
    handler.getByRole('button', { name: /Download DOCX|下载 DOCX/ }),
  ).toHaveCount(0);
  evidence.checks.push(
    'Q03: ordinary applicant never receives income download/amount; current HR-duty revocation denies bytes and old preparation; 375px both languages/themes/densities rendered without horizontal page overflow',
  );
  expect(evidence.errors).toEqual([]);
} finally {
  await writeFile(
    path.join(host.screenshotsDir, 'evidence.json'),
    JSON.stringify(evidence, null, 2),
  );
  await host.close();
}

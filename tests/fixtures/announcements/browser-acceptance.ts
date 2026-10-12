import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  expect,
  type Page,
  type BrowserContextOptions,
} from '@playwright/test';
import type { TestApp } from '@nocobase/app-testing/server';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { createEmployee } from '../../logic/employees/helpers.js';

export async function runAnnouncementBrowser(
  testApp: TestApp,
  pageFor: (
    session: TestSession,
    options?: BrowserContextOptions,
  ) => Promise<Page>,
  screenshotsDir: string,
  baseUrl: string,
) {
  await mkdir(screenshotsDir, { recursive: true });
  const evidence: {
    scope: string;
    checks: string[];
    screenshots: string[];
    errors: string[];
    expectedDenials: { path: string; status: number }[];
  } = {
    scope:
      'Isolated complete main App, synthetic public-service employee and actual admin-duty publisher; no production acceptance claim',
    checks: [],
    screenshots: [],
    errors: [],
    expectedDenials: [],
  };
  const publisher = await createEmployee(
    testApp,
    'Browser announcement publisher',
  );
  const employee = await createEmployee(
    testApp,
    'Browser announcement employee',
  );
  const org = testApp.application.container.resolve(organizationServiceToken);
  await org.addDutyRoleMember('admin', publisher.userId, {
    actorId: publisher.userId,
  });
  const publisherSession = await publisher.session(),
    employeeSession = await employee.session();
  const admin = await pageFor(publisherSession),
    reader = await pageFor(employeeSession);
  for (const page of [admin, reader]) {
    page.on('pageerror', (e) => evidence.errors.push(e.message));
    await page.addInitScript(() => {
      const config = JSON.parse(
        localStorage.getItem('announcement-browser-prefs') ??
          '{"locale":"en-US","theme":"light","preset":"compact"}',
      );
      localStorage.setItem('nocobase.locale', config.locale);
      localStorage.setItem('i18nextLng', config.locale);
      localStorage.setItem('nocobase:main:theme:color-scheme', config.theme);
      localStorage.setItem('nocobase:main:theme:preset', config.preset);
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  const check = (name: string) => evidence.checks.push(name);
  async function shot(page: Page, name: string) {
    const target = path.join(screenshotsDir, `${name}.png`);
    await page.screenshot({ path: target, fullPage: true });
    evidence.screenshots.push(target);
  }
  async function dismissToasts(page: Page) {
    const close = page.locator('[data-slot=toast-close]:visible');
    while (await close.count()) {
      try {
        await close.first().click({ timeout: 1500 });
      } catch (error) {
        if (await close.count()) throw error;
      }
    }
  }
  const go = (page: Page, suffix: string) =>
    page.goto(`${baseUrl}${suffix}`, { waitUntil: 'domcontentloaded' });
  async function browserJSON(
    page: Page,
    suffix: string,
    method = 'GET',
    body?: unknown,
  ) {
    return page.evaluate(
      async ({ suffix, method, body }) => {
        const r = await fetch(`/main/api/${suffix}`, {
          method,
          credentials: 'include',
          ...(body === undefined
            ? {}
            : {
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
              }),
        });
        return { status: r.status, body: await r.json() };
      },
      { suffix, method, body },
    );
  }
  try {
    await go(admin, '/');
    await admin.getByRole('heading', { level: 1 }).waitFor();
    await shot(admin, 'baseline-home');
    const baselineErrors = [...evidence.errors];
    await go(admin, '/announcements?mode=mine#acceptance');
    await expect(
      admin.getByRole('button', { name: 'New announcement', exact: true }),
    ).toBeVisible();
    await expect(admin.getByRole('table')).toBeVisible();
    check(
      'Real admin-duty default permission seed exposes list/create; empty list keeps headers',
    );
    await admin
      .getByRole('button', { name: 'New announcement', exact: true })
      .click();
    await expect(admin.locator('#announcement-title')).toBeVisible();
    await admin
      .locator('#announcement-title')
      .pressSequentially('Browser policy');
    const cdp = await admin.context().newCDPSession(admin);
    await cdp.send('Input.imeSetComposition', {
      text: 'zhong',
      selectionStart: 5,
      selectionEnd: 5,
    });
    await cdp.send('Input.insertText', { text: '中国' });
    await expect(admin.locator('#announcement-title')).toHaveValue(
      'Browser policy中国',
    );
    await admin
      .locator('#announcement-body')
      .pressSequentially('Read this policy. 请完成本人确认。');
    await admin.keyboard.press('Escape');
    await expect(admin.getByRole('alertdialog')).toBeVisible();
    await admin
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await expect(admin.locator('#announcement-title')).toHaveValue(
      'Browser policy中国',
    );
    check(
      'Dirty drawer Escape opens discard confirmation and cancellation retains input',
    );
    await admin
      .getByRole('checkbox', { name: 'Everyone', exact: true })
      .click();
    await admin
      .getByRole('checkbox', { name: 'Confirmation required', exact: true })
      .click();
    await shot(admin, 'publisher-create-ime');
    await admin
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(admin).toHaveURL(/\/announcements\?mode=mine#acceptance$/);
    const draftLink = admin.getByRole('link', {
      name: 'Browser policy中国',
      exact: true,
    });
    await expect(draftLink).toBeVisible();
    const href = await draftLink.getAttribute('href');
    if (!href) throw new Error('Draft link absent');
    const id = new URL(href, baseUrl).pathname.split('/').at(-1)!;
    check(
      'Browser create/save with character input and real Chinese IME; source query/hash retained',
    );
    await draftLink.click();
    await admin.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(admin.locator('#announcement-file')).toBeVisible();
    await admin.locator('#announcement-file').setInputFiles({
      name: 'policy.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Isolated announcement attachment\n'),
    });
    await expect(
      admin.getByRole('checkbox', {
        name: 'Include attachment policy.txt',
        exact: true,
      }),
    ).toBeChecked();
    await admin
      .getByRole('button', { name: 'Save draft', exact: true })
      .click();
    await expect(admin).toHaveURL(
      new RegExp(`/announcements/${id}\\?mode=mine#acceptance$`),
    );
    const saveToast = admin.locator('[data-slot=toast]:visible').last();
    await expect(saveToast).toBeVisible();
    const detailFooter = admin
      .getByRole('dialog', { name: 'Browser policy中国', exact: true })
      .locator('[data-slot=route-overlay-footer]');
    await expect
      .poll(async () => {
        const toastBox = await saveToast.boundingBox(),
          footerBox = await detailFooter.boundingBox();
        return toastBox && footerBox
          ? toastBox.y + toastBox.height <= footerBox.y
          : false;
      })
      .toBe(true);
    await shot(admin, 'saved-toast-above-footer');
    check(
      'Success toast remains visible above active detail footer; Publish clicked without manual dismissal',
    );
    await admin.getByRole('button', { name: 'Publish', exact: true }).click();
    await admin
      .getByRole('dialog', { name: 'Publish', exact: true })
      .getByRole('button', { name: 'Publish', exact: true })
      .click();
    await admin
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Publish', exact: true })
      .click();
    await expect(
      admin.getByRole('button', { name: 'Recipient receipts', exact: true }),
    ).toBeVisible();
    await expect(
      admin.getByRole('button', { name: 'Edit', exact: true }),
    ).toHaveCount(0);
    await shot(admin, 'publisher-published-frozen');
    check(
      'Actual browser private attachment upload/save/publication freezes editing',
    );
    await go(reader, `/announcements/${id}?mode=received#reader-source`);
    await expect(
      reader.getByRole('button', { name: 'New announcement', exact: true }),
    ).toHaveCount(0);
    await expect(
      reader.getByRole('button', { name: 'Confirm receipt', exact: true }),
    ).toBeVisible();
    await expect(
      reader.getByRole('button', { name: 'Recipient receipts', exact: true }),
    ).toHaveCount(0);
    await expect(
      reader.getByRole('link', { name: 'policy.txt', exact: true }),
    ).toBeVisible();
    const fileUrl = await reader
      .getByRole('link', { name: 'policy.txt', exact: true })
      .getAttribute('href');
    const bytes = await reader.evaluate(async (url) => {
      const r = await fetch(url!);
      return { status: r.status, text: await r.text() };
    }, fileUrl);
    expect(bytes.status).toBe(200);
    expect(bytes.text).toBe('Isolated announcement attachment\n');
    await reader
      .getByRole('button', { name: 'Confirm receipt', exact: true })
      .click();
    await reader
      .getByRole('dialog', { name: 'Confirm receipt', exact: true })
      .getByRole('button', { name: 'Confirm receipt', exact: true })
      .click();
    await expect(reader).toHaveURL(
      new RegExp(`/announcements/${id}\\?mode=received#reader-source$`),
    );
    await expect(reader.getByText(/^Confirmed/)).toBeVisible();
    await expect(
      reader.getByRole('button', { name: 'Confirm receipt', exact: true }),
    ).toHaveCount(0);
    await shot(reader, 'employee-confirmed');
    check(
      'Actual employee default policy reads protected bytes and confirms only own receipt; no management entry',
    );
    await dismissToasts(admin);
    await admin
      .getByRole('button', { name: 'Recipient receipts', exact: true })
      .click();
    await expect(
      admin.getByText('Browser announcement employee', { exact: true }),
    ).toBeVisible();
    await expect(
      admin.getByText('Confirmed', { exact: true }).last(),
    ).toBeVisible();
    await shot(admin, 'publisher-frozen-receipts');
    check(
      'Actual publisher independent roster policy returns employee confirmed state and counts',
    );
    await go(admin, `/announcements/${id}?mode=mine#acceptance`);
    await admin.getByRole('button', { name: 'Remind', exact: true }).click();
    await admin
      .getByRole('dialog', { name: 'Remind', exact: true })
      .getByRole('button', { name: 'Remind', exact: true })
      .click();
    await expect(admin).toHaveURL(
      new RegExp(`/announcements/${id}\\?mode=mine#acceptance$`),
    );
    check(
      'Actual publisher reminds current pending recipients using a real transition',
    );
    // A future draft is seeded through the same public HTTP contract, then published and revoked in the browser.
    const future = await browserJSON(admin, 'announcements', 'POST', {
      requestId: randomUUID(),
      title: 'Future browser policy',
      body: 'Not active yet',
      audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
      requiresConfirmation: true,
      pinned: false,
      attachments: [],
      validFrom: new Date(Date.now() + 86400000).toISOString(),
      validUntil: new Date(Date.now() + 2 * 86400000).toISOString(),
    });
    expect(future.status).toBe(200);
    const futureId = future.body.data.id as string;
    await go(admin, `/announcements/${futureId}?mode=mine#future`);
    await dismissToasts(admin);
    await admin.getByRole('button', { name: 'Publish', exact: true }).click();
    await admin
      .getByRole('dialog', { name: 'Publish', exact: true })
      .getByRole('button', { name: 'Publish', exact: true })
      .click();
    await admin
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Publish', exact: true })
      .click();
    await expect(
      admin
        .getByRole('dialog', { name: 'Future browser policy', exact: true })
        .getByText('Scheduled', { exact: true }),
    ).toBeVisible();
    await expect(
      admin.getByRole('button', { name: 'Confirm receipt', exact: true }),
    ).toHaveCount(0);
    await expect(
      admin.getByRole('button', { name: 'Remind', exact: true }),
    ).toHaveCount(0);
    await shot(admin, 'publisher-future-scheduled');
    const futureRead = await browserJSON(reader, `announcements/${futureId}`);
    expect([403, 404]).toContain(futureRead.status);
    evidence.expectedDenials.push({
      path: 'future employee detail',
      status: futureRead.status,
    });
    await dismissToasts(admin);
    await admin.getByRole('button', { name: 'Revoke', exact: true }).click();
    await admin
      .getByRole('dialog', { name: 'Revoke', exact: true })
      .getByRole('button', { name: 'Revoke', exact: true })
      .click();
    await admin
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Revoke', exact: true })
      .click();
    await expect(
      admin
        .getByRole('dialog', { name: 'Future browser policy', exact: true })
        .getByText('Revoked', { exact: true }),
    ).toBeVisible();
    check(
      'Future publication schedules without premature read/confirm/remind; scheduled revocation succeeds',
    );
    // Revoke the published record and prove its old recipient no longer reads the detail or frozen attachment.
    await go(admin, `/announcements/${id}?mode=mine#acceptance`);
    await dismissToasts(admin);
    await admin.getByRole('button', { name: 'Revoke', exact: true }).click();
    await admin
      .getByRole('dialog', { name: 'Revoke', exact: true })
      .getByRole('button', { name: 'Revoke', exact: true })
      .click();
    await admin
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Revoke', exact: true })
      .click();
    await expect(
      admin
        .getByRole('dialog', { name: 'Browser policy中国', exact: true })
        .getByText('Revoked', { exact: true }),
    ).toBeVisible();
    const revokedRead = await browserJSON(reader, `announcements/${id}`);
    expect([403, 404]).toContain(revokedRead.status);
    evidence.expectedDenials.push({
      path: 'revoked employee detail',
      status: revokedRead.status,
    });
    const revokedBytes = await reader.evaluate(
      async (url) => (await fetch(url!)).status,
      fileUrl,
    );
    expect([403, 404]).toContain(revokedBytes);
    evidence.expectedDenials.push({
      path: 'revoked protected bytes',
      status: revokedBytes,
    });
    await dismissToasts(admin);
    await admin
      .getByRole('button', { name: 'Recipient receipts', exact: true })
      .click();
    await expect(
      admin.getByText('Browser announcement employee', { exact: true }),
    ).toBeVisible();
    check(
      'Published revocation removes employee detail/byte access and keeps actual historical receipts',
    );
    // Revoke actual admin duty membership through the organization facade; a browser reload reauthorizes current grants.
    await org.removeDutyRoleMember('admin', publisher.userId, {
      actorId: publisher.userId,
    });
    const rosterDenied = await browserJSON(
      admin,
      `announcements/${id}/receipts`,
    );
    expect(rosterDenied.status).toBe(403);
    evidence.expectedDenials.push({
      path: 'publisher roster after actual duty removal',
      status: rosterDenied.status,
    });
    await go(admin, '/announcements?mode=mine');
    await expect(
      admin.getByRole('button', { name: 'New announcement', exact: true }),
    ).toHaveCount(0);
    check(
      'Removing actual admin-duty membership revokes management policy immediately at HTTP and browser reload',
    );
    // Resume the role solely in this disposable fixture for visual matrix checks.
    await org.addDutyRoleMember('admin', publisher.userId, {
      actorId: publisher.userId,
    });
    for (const locale of ['en-US', 'zh-CN'])
      for (const theme of ['light', 'dark'])
        for (const preset of ['compact', 'default']) {
          const visual = await pageFor(publisherSession, {
            locale,
            viewport: { width: 375, height: 812 },
          });
          visual.on('pageerror', (error) =>
            evidence.errors.push(error.message),
          );
          await visual.addInitScript(
            ({ theme, preset }) => {
              localStorage.setItem('nocobase:main:theme:color-scheme', theme);
              localStorage.setItem('nocobase:main:theme:preset', preset);
            },
            { theme, preset },
          );
          try {
            await visual.setViewportSize({ width: 375, height: 812 });
            await go(visual, `/announcements/${id}?mode=mine#mobile`);
            await expect(
              visual.getByRole('heading', {
                name: 'Browser policy中国',
                exact: true,
              }),
            ).toBeVisible();
            await expect(visual.locator('html')).toHaveClass(new RegExp(theme));
            await expect(visual.locator('html')).toHaveAttribute(
              'data-theme',
              preset,
            );
            const overflow = await visual.evaluate(
              () =>
                document.documentElement.scrollWidth > window.innerWidth + 1,
            );
            expect(overflow).toBe(false);
            const revokeButton = visual.getByRole('button', {
              name: locale === 'zh-CN' ? '收件人回执' : 'Recipient receipts',
              exact: true,
            });
            await expect(revokeButton).toBeVisible();
            const box = await revokeButton.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.y + box!.height).toBeLessThanOrEqual(812);
            expect(box!.height).toBeGreaterThanOrEqual(44);
            await shot(visual, `mobile-${locale}-${theme}-${preset}`);
          } finally {
            await visual.context().close();
          }
        }
    check(
      '375px detail/footer reachable in Chinese/English, light/dark, compact/default; no document horizontal overflow',
    );
    expect(evidence.errors.filter((e) => !baselineErrors.includes(e))).toEqual(
      [],
    );
    return evidence;
  } catch (error) {
    await shot(admin, 'failure-admin');
    await writeFile(
      path.join(screenshotsDir, 'failure-page.txt'),
      await admin.locator('body').innerText(),
    );
    throw error;
  } finally {
    await writeFile(
      path.join(screenshotsDir, 'announcement-browser-evidence.json'),
      JSON.stringify(evidence, null, 2),
    );
    await admin.context().close();
    await reader.context().close();
  }
}

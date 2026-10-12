import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { startIsolatedBrowserApp } from '../browser/harness.js';
const host = await startIsolatedBrowserApp({
  name: 'onboarding-transfer-attachments-final',
  apiPort: 13381,
  vitePort: 13382,
});
try {
  const c = host.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const first = await createEmployee(host.testApp, 'Synthetic IT first'),
    second = await createEmployee(
      host.testApp,
      'Synthetic IT second with a deliberately long name for phone selection',
    );
  await org.addDutyRoleMember('it', first.userId, { actorId: first.userId });
  await org.addDutyRoleMember('it', second.userId, { actorId: first.userId });
  const id = randomUUID(),
    taskId = `${id}:it`,
    now = new Date();
  await db.repository('onboardings').createOne({
    values: {
      id,
      creatorId: first.userId,
      employeeId: first.employeeId,
      userId: first.userId,
      requisitionId: randomUUID(),
      departmentId: randomUUID(),
      positionId: randomUUID(),
      gradeId: randomUUID(),
      hireDate: '2026-10-20',
      status: 'handling',
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  await db.repository('onboardingTasks').createOne({
    values: {
      id: taskId,
      onboardingId: id,
      kind: 'it',
      status: 'claimed',
      assigneeId: first.userId,
      targetUserId: null,
      dutyRoleCode: 'it',
      dueDate: '2026-10-19',
      facts: null,
      forced: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  });
  const session = await first.session(),
    firstPage = await host.pageFor(session, {
      locale: 'en-US',
      viewport: { width: 375, height: 812 },
    }),
    pageErrors: string[] = [];
  firstPage.on('pageerror', (e) => pageErrors.push(e.message));
  const prefix = `${host.origin}${host.basePath}/onboardings/${id}`;
  await firstPage.goto(
    `${prefix}/tasks/${encodeURIComponent(taskId)}/transfer`,
  );
  await firstPage.getByRole('combobox', { name: /New handler/ }).click();
  await firstPage.getByRole('option', { name: second.userId }).count();
  const candidate = firstPage.getByRole('option', {
    name: /Synthetic IT second/,
  });
  await expect(candidate).toBeVisible();
  expect(
    await candidate.evaluate((el) => {
      const name =
        el.querySelector('[data-slot=user-name] > span:last-child') ?? el;
      return name.scrollWidth <= name.clientWidth;
    }),
  ).toBe(true);
  await firstPage.screenshot({
    path: path.join(host.screenshotsDir, 'transfer-options-375.png'),
    fullPage: true,
  });
  await firstPage.getByRole('option', { name: /Synthetic IT second/ }).click();
  await firstPage
    .getByLabel('Reason', { exact: false })
    .fill('Same duty pool actual handover');
  await firstPage.screenshot({
    path: path.join(host.screenshotsDir, 'transfer-375.png'),
    fullPage: true,
  });
  await firstPage
    .getByRole('button', { name: 'Transfer', exact: true })
    .click();
  await expect(firstPage).toHaveURL(new RegExp(`/onboardings/${id}$`));
  await expect(firstPage.getByText(second.userId, { exact: true })).toHaveCount(
    0,
  );
  await expect(
    firstPage.getByText(
      'Synthetic IT second with a deliberately long name for phone selection',
      { exact: true },
    ),
  ).toBeVisible();
  const page = await host.pageFor(await second.session(), {
    locale: 'en-US',
    viewport: { width: 375, height: 812 },
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(`${prefix}/tasks/${encodeURIComponent(taskId)}/complete`);
  await page.getByLabel('Upload attachment').setInputFiles({
    name: 'unsafe.txt',
    mimeType: 'text/html',
    buffer: Buffer.from('<html>unsafe</html>'),
  });
  await expect(page.getByRole('alert').first()).toBeVisible();
  await page.getByLabel('Upload attachment').setInputFiles({
    name: 'safe-evidence.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Synthetic protected task evidence'),
  });
  await expect(
    page.getByText('safe-evidence.txt', { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByLabel('Device reference', { exact: false })
    .fill('Text evidence only; no claimed stock movement');
  await page
    .getByLabel('Reason', { exact: false })
    .fill('Complete with frozen file evidence');
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'attachments-375.png'),
    fullPage: true,
  });
  let dropped = false;
  await page.route(
    `**/api/onboardings/${id}/tasks/**/actions`,
    async (route) => {
      if (!dropped) {
        dropped = true;
        await route.fetch();
        await route.abort('failed');
      } else await route.continue();
    },
  );
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await expect(page.getByRole('button', { name: /Retry/ })).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'unknown-result-375.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: /Retry/ }).click();
  await expect(page).toHaveURL(new RegExp(`/onboardings/${id}$`));
  await expect(
    page.getByText('safe-evidence.txt', { exact: false }).first(),
  ).toBeVisible();
  expect(
    (await db.repository('onboardings').findOne({ filter: { id } }))?.status,
  ).toBe('completed');
  const matrixEvidence = [];
  for (const locale of ['en-US', 'zh-CN'])
    for (const color of ['light', 'dark']) {
      const matrix = await host.pageFor(await second.session(), {
        locale,
        viewport: { width: 375, height: 812 },
      });
      matrix.on('pageerror', (e) => pageErrors.push(e.message));
      await matrix.addInitScript(
        ({ base, color }) => {
          const scope = encodeURIComponent(base.replace(/^\/+|\/+$/g, ''));
          localStorage.setItem(`nocobase:${scope}:theme:color-scheme`, color);
          localStorage.setItem(`nocobase:${scope}:theme:preset`, 'default');
        },
        { base: host.basePath, color },
      );
      await matrix.goto(prefix);
      await expect(
        matrix.getByText('safe-evidence.txt', { exact: false }).first(),
      ).toBeVisible();
      await expect(
        matrix
          .getByRole('dialog')
          .getByText(locale === 'zh-CN' ? '已完成' : 'Completed', {
            exact: true,
          })
          .first(),
      ).toBeVisible();
      const htmlClass = await matrix.locator('html').getAttribute('class'),
        theme = await matrix.locator('html').getAttribute('data-theme');
      expect(htmlClass).toContain(color);
      expect(theme).toBe('default');
      expect(
        await matrix.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      matrixEvidence.push({
        locale,
        color,
        htmlClass,
        theme,
        completedLabel: locale === 'zh-CN' ? '已完成' : 'Completed',
      });
      await matrix.screenshot({
        path: path.join(
          host.screenshotsDir,
          `completed-${locale}-${color}-375.png`,
        ),
        fullPage: true,
      });
    }
  expect(pageErrors).toEqual([]);
  await writeFile(
    path.join(host.screenshotsDir, 'result.json'),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        status: 'passed',
        scope:
          'Isolated main App with synthetic safe task fixture: actual same-pool transfer, rejected MIME recovery, public File upload/freeze, last completion lost response and identical retry, 375px en/zh light/dark. Not full recruitment-to-onboarding or production.',
        pageErrors,
        matrixEvidence,
      },
      null,
      2,
    ),
  );
  console.log('onboarding transfer/attachments browser passed');
} finally {
  await host.close();
}

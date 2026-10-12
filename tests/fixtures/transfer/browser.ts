import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee, createPerson } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { salaryGradeServiceToken } from '../../../server/providers/job-grades/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { transferServiceToken } from '../../../server/providers/transfer/service.js';
const host = await startIsolatedBrowserApp({
  name: 'transfer',
  apiPort: 13381,
  vitePort: 13382,
});
try {
  const c = host.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    employee = c.resolve(employeeServiceToken),
    grades = c.resolve(salaryGradeServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    service = c.resolve(transferServiceToken),
    calendar = c.resolve(calendarServiceToken),
    today = calendar.localDate(new Date());
  const actor = await createEmployee(host.testApp, 'Transfer HR author'),
    manager = await createEmployee(host.testApp, 'Transfer manager'),
    sourceHead = await createEmployee(host.testApp, 'Transfer source head'),
    targetHead = await createEmployee(host.testApp, 'Transfer target head'),
    hr = await createEmployee(host.testApp, 'Transfer HR reviewer'),
    executive = await createEmployee(host.testApp, 'Transfer executive'),
    gm = await createEmployee(host.testApp, 'Transfer GM');
  const context = { actorId: actor.userId };
  await org.addDutyRoleMember('hr', actor.userId, context);
  await org.addDutyRoleMember('hr', hr.userId, context);
  await org.addDutyRoleMember('gm', gm.userId, context);
  const sourceDepartment = await org.createDepartment(
      { title: 'Synthetic source department', managerId: sourceHead.userId },
      context,
    ),
    targetDepartment = await org.createDepartment(
      {
        title: randomUUID(),
        managerId: targetHead.userId,
        executiveId: executive.userId,
      },
      context,
    );
  const sourcePosition = await org.createPosition(
      { code: randomUUID(), title: 'Source position' },
      context,
    ),
    targetPosition = await org.createPosition(
      { code: randomUUID(), title: 'Target position' },
      context,
    ),
    grade = await org.createGrade(
      { code: randomUUID(), title: 'Transfer salary band', rank: 1 },
      context,
    );
  const subject = await createEmployee(host.testApp, 'Transfer employee', {
    managerId: manager.employeeId,
    positionId: sourcePosition.id,
    gradeId: grade.id,
  });
  await org.addMember(
    {
      departmentId: sourceDepartment.id,
      userId: subject.userId,
      primary: true,
    },
    context,
  );
  await db.transaction((tx) =>
    employee.appendCompensation(
      {
        employeeId: subject.employeeId,
        baseSalary: '1000.00',
        gradeId: grade.id,
        effectiveFrom: today.slice(0, 4) + '-01-01',
      },
      context,
      tx,
    ),
  );
  const pointer = await grades.current(db.connection());
  await grades.publish(
    {
      expectedVersion: pointer.version,
      bands: [{ gradeId: grade.id, minimumCents: 0, maximumCents: 200000 }],
      actorId: actor.userId,
      reason: 'Real personnel salary table',
    },
    db.connection(),
  );
  const command = {
    actorId: actor.userId,
    requestKey: randomUUID(),
    reason: 'Personnel change capacity',
  };
  const sourceAccount = await db.transaction((tx) =>
      headcounts.create(
        {
          ...command,
          departmentId: sourceDepartment.id,
          positionId: sourcePosition.id,
          year: Number(today.slice(0, 4)),
          limit: 2,
        },
        tx,
      ),
    ),
    targetAccount = await db.transaction((tx) =>
      headcounts.create(
        {
          ...command,
          requestKey: randomUUID(),
          departmentId: targetDepartment.id,
          positionId: targetPosition.id,
          year: Number(today.slice(0, 4)),
          limit: 2,
        },
        tx,
      ),
    );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: sourceAccount.id,
        expectedVersion: sourceAccount.version,
        employeeIds: [subject.employeeId],
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command,
        requestKey: randomUUID(),
        accountId: targetAccount.id,
        expectedVersion: targetAccount.version,
        employeeIds: [],
      },
      tx,
    ),
  );

  const errors: string[] = [];
  const page = await host.pageFor(await actor.session());
  page.setDefaultTimeout(20000);
  page.on('pageerror', (e) => errors.push(e.message));
  const url = (suffix = '') =>
    `${host.origin}${host.basePath}/personnel-changes${suffix}`;
  const pick = async (label: string, name: string) => {
    await page.getByLabel(label, { exact: true }).click();
    await page.getByRole('option', { name, exact: true }).click();
  };
  await page.goto(url() + '#browser-source');
  await expect(
    page.getByRole('heading', { name: 'Personnel changes', exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('No personnel change requests')).toBeVisible();
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await pick('Employee', 'Transfer employee');
  await pick('Target department', targetDepartment.title);
  await pick('Target position', 'Target position');
  await pick('Target grade', 'Transfer salary band');
  await pick('Target manager', 'Transfer target head');
  await page
    .getByRole('checkbox', { name: 'Salary change', exact: true })
    .check();
  await page.getByLabel('Target salary (CNY)', { exact: true }).fill('1300.01');
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'date-diagnostic.png'),
    fullPage: true,
  });
  await page.getByLabel(/^Effective date(?: \*)?$/).click();
  await page
    .locator(
      `button[data-day="${new Date(today + 'T12:00:00').toLocaleDateString('en-US')}"]`,
    )
    .last()
    .click();
  await page
    .getByLabel('Reason', { exact: true })
    .pressSequentially('Actual browser transfer');
  await page.getByLabel('Reason', { exact: true }).focus();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', {
    text: 'zhuangang',
    selectionStart: 9,
    selectionEnd: 9,
  });
  await cdp.send('Input.insertText', { text: '转岗' });
  await cdp.detach();
  await expect(page.getByLabel('Reason', { exact: true })).toHaveValue(/转岗/);
  await expect(
    page.getByText('Capacity account identities resolved.', { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'create-filled.png'),
    fullPage: true,
  });
  const creation = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      r.url().endsWith('/api/transferRequests'),
  );
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const created = await creation;
  expect(created.status()).toBe(201);
  const requestId = (await created.json()).data.record.id as string;
  await expect(
    page.getByRole('link', { name: requestId, exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(
    new RegExp('/personnel-changes#browser-source$'),
  );
  await page.getByRole('link', { name: requestId, exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp('/' + requestId + '#browser-source$'),
  );
  await expect(
    page.getByText('Manager review', { exact: true }).first(),
  ).toBeVisible();
  const stages = [
    [manager, 'sourceHead'],
    [sourceHead, 'targetHead'],
    [targetHead, 'hr'],
    [hr, 'executive'],
    [executive, 'gm'],
    [gm, 'pendingEffective'],
  ] as const;
  for (const [reviewer, next] of stages) {
    const reviewerSession = await reviewer.session();
    const reviewerPage = await host.pageFor(reviewerSession);
    reviewerPage.setDefaultTimeout(20000);
    reviewerPage.on('pageerror', (e) => errors.push(e.message));
    await reviewerPage.goto(
      url('/' + requestId) + '?q=transfer#browser-source',
    );
    await expect(
      reviewerPage.getByRole('button', { name: 'Approve', exact: true }),
    ).toBeVisible({ timeout: 60000 });
    if (
      [manager, sourceHead, targetHead].includes(reviewer as typeof manager)
    ) {
      await expect(
        reviewerPage.getByText(
          /You cannot view salary for this request|You do not have permission for this personnel change\./,
        ),
      ).toBeVisible();
      expect(
        (
          await reviewerSession.fetch(
            '/transferRequests/' + requestId + '/salary',
          )
        ).status,
      ).toBe(403);
    }
    await reviewerPage
      .getByRole('button', { name: 'Approve', exact: true })
      .click();
    await reviewerPage
      .getByLabel('Reason', { exact: true })
      .fill('Actual current offer reviewed');
    const action = reviewerPage.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().endsWith('/actions'),
    );
    await reviewerPage
      .getByRole('button', { name: 'Confirm action', exact: true })
      .click();
    const response = await action;
    expect(response.status()).toBe(200);
    expect((await response.json()).data.record.status).toBe(next);
    await expect(reviewerPage).toHaveURL(
      new RegExp('/' + requestId + '\\?q=transfer#browser-source$'),
    );
    await reviewerPage.screenshot({
      path: path.join(host.screenshotsDir, `stage-${next}.png`),
      fullPage: true,
    });
    await reviewerPage.context().close();
  }
  expect(await service.maintenance()).toMatchObject({
    completed: 1,
    failures: [],
  });
  expect(await employee.getById(subject.employeeId)).toMatchObject({
    positionId: targetPosition.id,
  });
  expect(await org.primaryDepartmentOf(subject.userId)).toMatchObject({
    id: targetDepartment.id,
  });
  expect(
    await headcounts.balance(sourceAccount.id, db.connection()),
  ).toMatchObject({ used: 0 });
  expect(
    await headcounts.balance(targetAccount.id, db.connection()),
  ).toMatchObject({ used: 1, allocated: 0 });
  const hrSession = await hr.session();
  const salary = await hrSession.fetch(
    '/transferRequests/' + requestId + '/salary',
  );
  expect(salary.status).toBe(200);
  await org.removeDutyRoleMember('hr', hr.userId, context);
  expect(
    (await hrSession.fetch('/transferRequests/' + requestId + '/salary'))
      .status,
  ).toBe(403);
  const unrelated = await createPerson(
    host.testApp,
    'Unrelated transfer reader',
  );
  expect(
    (await (await unrelated.session()).fetch('/transferRequests/' + requestId))
      .status,
  ).toBe(403);
  await page.goto(url('/' + requestId));
  await expect(
    page.getByText('Effective', { exact: true }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === 'running' &&
            Number.isFinite(a.effect?.getComputedTiming().iterations),
        )
        .map((a) => a.finished.catch(() => undefined)),
    );
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'effective-mobile.png'),
    fullPage: true,
  });
  for (const locale of ['en-US', 'zh-CN'])
    for (const mode of ['light', 'dark'])
      for (const preset of ['compact', 'default']) {
        const mobile = await host.pageFor(await actor.session(), {
          locale,
          viewport: { width: 375, height: 812 },
        });
        mobile.on('pageerror', (e) => errors.push(e.message));
        await mobile.addInitScript(
          ({ base, mode, preset }) => {
            const scope = encodeURIComponent(base.replace(/^\/+|\/+$/g, ''));
            localStorage.setItem(`nocobase:${scope}:theme:color-scheme`, mode);
            localStorage.setItem(`nocobase:${scope}:theme:preset`, preset);
          },
          { base: host.basePath, mode, preset },
        );
        await mobile.goto(url('/' + requestId) + '?q=transfer#browser-source');
        await expect(mobile.getByRole('dialog').last()).toBeVisible();
        await expect(
          mobile
            .getByRole('dialog')
            .last()
            .getByText('Transfer employee', { exact: true })
            .first(),
        ).toBeVisible();
        await mobile.evaluate(async () => {
          await Promise.all(
            document
              .getAnimations()
              .filter(
                (a) =>
                  a.playState === 'running' &&
                  Number.isFinite(a.effect?.getComputedTiming().iterations),
              )
              .map((a) => a.finished.catch(() => undefined)),
          );
        });
        expect(
          await mobile.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const bounds = await mobile.getByRole('dialog').last().boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(813);
        expect(await mobile.locator('html').getAttribute('data-theme')).toBe(
          preset,
        );
        expect(await mobile.locator('html').getAttribute('class')).toContain(
          mode,
        );
        await mobile.screenshot({
          path: path.join(
            host.screenshotsDir,
            `effective-${locale}-${mode}-${preset}-375.png`,
          ),
          fullPage: true,
        });
        await mobile
          .getByRole('button', {
            name: locale === 'en-US' ? 'Close' : '关闭',
            exact: true,
          })
          .last()
          .click();
        await expect(mobile).toHaveURL(
          new RegExp('/personnel-changes\\?q=transfer#browser-source$'),
        );
        await mobile.context().close();
      }
  expect(errors).toEqual([]);
  await writeFile(
    path.join(host.screenshotsDir, 'result.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        requestId,
        pageErrors: errors,
        scope:
          'Actual main App browser create/submit/six current SDK offers/real effectiveness/private salary revocation/375px',
      },
      null,
      2,
    ),
  );
  console.log('Transfer actual browser six-stage acceptance passed.');
} finally {
  await host.close();
}

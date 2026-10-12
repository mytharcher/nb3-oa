import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../server/providers/headcounts/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { requisitionServiceToken } from '../../../server/providers/recruitment/requisitions.js';
import type { RecruitmentSubmissionSnapshot } from '../../../server/providers/recruitment/submission.js';
const host = await startIsolatedBrowserApp({
  name: 'onboarding-timeline-eleventh',
  apiPort: 13471,
  vitePort: 13472,
});
try {
  const c = host.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    headcounts = c.resolve(headcountServiceToken),
    calendar = c.resolve(calendarServiceToken),
    requisitions = c.resolve(requisitionServiceToken);
  const hr = await createEmployee(host.testApp, 'Synthetic onboarding HR'),
    context = { actorId: hr.userId };
  await org.addDutyRoleMember('hr', hr.userId, context);
  await org.addDutyRoleMember('it', hr.userId, context);
  await grantToUser(
    host.testApp,
    'onboarding-physical-it',
    [
      composite('oa.assets', {
        manage: { assets: 'allRecords' },
        returnHeld: { assets: 'allRecords' },
      }),
    ],
    hr.userId,
  );
  const assets = c.resolve(assetServiceToken);
  const physicalCategory = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0]!.code;
  const physical = await db.transaction(async (tx) =>
    assets.create(
      {
        code: randomUUID(),
        category: physicalCategory,
        name: 'Actual IT equipment',
        serialNumber: 'BROWSER-ONB-SERIAL',
        originalValueCents: 98765,
        actorId: hr.userId,
        reason: 'Actual inventory receipt',
      },
      tx,
    ),
  );

  const admin = await createEmployee(
      host.testApp,
      'Synthetic onboarding admin',
    ),
    finance = await createEmployee(
      host.testApp,
      'Synthetic onboarding finance',
    ),
    manager = await createEmployee(
      host.testApp,
      'Synthetic onboarding manager',
    );
  await org.addDutyRoleMember('admin', admin.userId, context);
  await org.addDutyRoleMember('finance', finance.userId, context);
  await grantToUser(
    host.testApp,
    'browser-mentor-directory',
    [
      composite('oa.employees.directory', {
        view: { employees: 'allRecords' },
      }),
    ],
    manager.userId,
  );
  await grantToUser(
    host.testApp,
    'browser-hr-creation-directory',
    [
      composite('oa.employees.directory', {
        view: { employees: 'allRecords' },
      }),
    ],
    hr.userId,
  );
  const department = await org.createDepartment(
      { title: 'Synthetic hire department', managerId: manager.userId },
      context,
    ),
    position = await org.createPosition(
      { code: randomUUID(), title: 'Synthetic role' },
      context,
    ),
    grade = await org.createGrade(
      { code: randomUUID(), title: 'Synthetic grade', rank: 1 },
      context,
    ),
    hireDate = calendar.localDate(new Date()),
    command = () => ({
      actorId: hr.userId,
      requestKey: randomUUID(),
      reason: 'Isolated browser fixture',
    });
  const account = await db.transaction((tx) =>
    headcounts.create(
      {
        ...command(),
        departmentId: department.id,
        positionId: position.id,
        year: Number(hireDate.slice(0, 4)),
        limit: 3,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    headcounts.reconcile(
      {
        ...command(),
        accountId: account.id,
        expectedVersion: account.version,
        employeeIds: [],
      },
      tx,
    ),
  );
  const sourceId = randomUUID();
  await db.transaction((tx) =>
    headcounts.hold(
      {
        ...command(),
        sourceKind: 'oa.recruitment',
        sourceId,
        accountId: account.id,
        quantity: 3,
      },
      tx,
    ),
  );
  const source = await db.transaction((tx) =>
    requisitions.publish(
      {
        id: sourceId,
        lifecycleVersion: 1,
        snapshot: {
          departmentId: department.id,
          positionId: position.id,
          gradeId: grade.id,
          accountId: account.id,
          year: Number(hireDate.slice(0, 4)),
          quantity: 3,
        } as RecruitmentSubmissionSnapshot,
      },
      command(),
      tx,
    ),
  );
  const page = await host.pageFor(await hr.session());
  page.setDefaultTimeout(20000);
  const label = (name: string) =>
    page.getByLabel(new RegExp('^' + name + '(?: \\*)?$'));
  const settled = async () => {
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === 'running' &&
              Number.isFinite(animation.effect?.getComputedTiming().iterations),
          )
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
  };
  const mobileBounds = async () => {
    await settled();
    await expect
      .poll(
        async () => {
          const current = await page.getByRole('dialog').last().boundingBox();
          return current ? current.x + current.width : Infinity;
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(376);
    const bounds = await page.getByRole('dialog').last().boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(-1);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(813);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  };
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${host.origin}${host.basePath}/onboardings`);
  await expect(
    page.getByRole('heading', { name: 'Onboarding', exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('No onboarding records')).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'list-empty.png'),
    fullPage: true,
  });
  const createHire = async (employeeName: string) => {
    await page
      .getByRole('button', { name: 'Create onboarding', exact: true })
      .click();
    await expect(label('Employee name')).toBeVisible();
    await label('Recruitment allocation').click();
    await page.getByRole('option', { name: new RegExp(source.id) }).click();
    for (const [label, value] of [
      ['Employee name', employeeName],
      ['Account email', `${randomUUID()}@example.test`],
      ['Initial password', 'synthetic-hire-password'],
      ['Employee code', randomUUID()],

      ['Base salary', '12000.00'],
      ['Creation reason', 'Isolated actual browser creation'],
      ['Workstation requirements', 'Desk near the onboarding team'],
    ])
      await page.getByLabel(new RegExp('^' + label + '(?: \\*)?$')).fill(value);
    await label('Mentor employee').click();
    await page
      .getByRole('option', { name: /Synthetic onboarding manager/ })
      .click();
    for (const [name, day] of [
      ['Hire date', hireDate],
      ['Probation end date', calendar.addCalendarDays(hireDate, 7)],
    ]) {
      await label(name).click();
      const selector = `button[data-day="${new Date(day + 'T12:00:00').toLocaleDateString('en-US')}"]`;
      for (
        let month = 0;
        month < 12 && !(await page.locator(selector).count());
        month++
      )
        await page.getByRole('button', { name: /next month/i }).click();
      await page.locator(selector).last().click();
      await expect(page.locator('[data-slot=popover-content]')).toBeHidden();
    }
    await page.screenshot({
      path: path.join(host.screenshotsDir, 'create-filled.png'),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Create onboarding', exact: true })
      .click();
    await expect(
      page.getByRole('link', { name: employeeName, exact: true }),
    ).toBeVisible({ timeout: 30000 });
  };
  await createHire('Synthetic browser hire');
  await page
    .getByRole('link', { name: 'Synthetic browser hire', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Account and equipment', exact: true }),
  ).toBeVisible();
  const it = page.locator('section').filter({
    has: page.getByRole('heading', {
      name: 'Account and equipment',
      exact: true,
    }),
  });
  await it.getByRole('button', { name: 'Claim', exact: true }).click();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'claim-form-diagnostic.png'),
    fullPage: true,
  });
  await label('Reason').fill('Synthetic IT claim');
  await page.getByRole('button', { name: 'Claim', exact: true }).click();
  await expect(page.getByText('Claimed', { exact: true })).toBeVisible({
    timeout: 20000,
  });
  await it.getByRole('button', { name: 'Complete', exact: true }).click();
  await label('Device reference').fill('synthetic-issued-device');
  await page.getByRole('button', { name: 'Add asset', exact: true }).click();
  await page.getByLabel('Asset code', { exact: true }).fill(physical.code);
  await page
    .getByLabel('Serial number', { exact: true })
    .fill('BROWSER-ONB-SERIAL');
  await label('Reason').fill('Actual reference confirmed');
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'asset-issue-input-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await mobileBounds();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'asset-issue-input-375.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await expect(
    page.getByText('synthetic-issued-device', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Timeline', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Timeline' })
      .getByText('Task claimed', { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Timeline' })
      .getByText('Task completed', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'it-completed.png'),
    fullPage: true,
  });
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'assigned',
  });
  const recordUrl = page.url();
  await org.updateDepartment(department.id, { managerId: hr.userId }, context);
  await page.reload();
  await page
    .getByRole('button', { name: 'Reassign department head', exact: true })
    .click();
  await expect(page.getByText(/Assign this outstanding task/)).toBeVisible();
  await label('Reason').fill('Current head reassignment');
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'reassign-current-head.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Reassign department head', exact: true })
    .click();
  await expect(page).toHaveURL(recordUrl);
  const createdRecord = await db.repository('onboardings').findOne({
    filter: { id: new URL(recordUrl).pathname.split('/').at(-1)! },
  });
  expect(createdRecord).toMatchObject({
    mentorEmployeeId: manager.employeeId,
    workstationRequirement: 'Desk near the onboarding team',
  });
  await org.updateDepartment(
    department.id,
    { managerId: manager.userId },
    context,
  );
  await page.reload();
  await page
    .getByRole('button', { name: 'Reassign department head', exact: true })
    .click();
  await label('Reason').fill('Restore current department head');
  await page
    .getByRole('button', { name: 'Reassign department head', exact: true })
    .click();
  await expect(page).toHaveURL(recordUrl);
  const adminPage = await host.pageFor(await admin.session());
  const financePage = await host.pageFor(await finance.session());
  const managerPage = await host.pageFor(await manager.session());
  for (const actorPage of [adminPage, financePage, managerPage]) {
    actorPage.setDefaultTimeout(20000);
    actorPage.on('pageerror', (error) => errors.push(error.message));
  }
  const taskSection = (actorPage: typeof page, heading: string) =>
    actorPage.locator('section').filter({
      has: actorPage.getByRole('heading', { name: heading, exact: true }),
    });
  const completeTask = async (
    actorPage: typeof page,
    heading: string,
    facts: Record<string, string>,
    url = recordUrl,
  ) => {
    await actorPage.goto(url);
    const section = taskSection(actorPage, heading);
    await expect(section).toBeVisible();
    await section.getByRole('button', { name: 'Claim', exact: true }).click();
    await actorPage
      .getByLabel(/^Reason(?: \*)?$/)
      .fill('Synthetic ordinary role claim');
    await actorPage.getByRole('button', { name: 'Claim', exact: true }).click();
    await expect(section.getByText('Claimed', { exact: true })).toBeVisible();
    await section
      .getByRole('button', { name: 'Complete', exact: true })
      .click();
    if (heading === 'Workstation and badge') {
      await actorPage
        .getByRole('button', { name: 'Complete', exact: true })
        .click();
      const workstation = actorPage.getByLabel(/^Workstation/);
      await expect(workstation).toHaveAttribute('aria-invalid', 'true');
      await expect(workstation).toBeFocused();
      await workstation.pressSequentially('Synthetic ');
      const cdp = await actorPage.context().newCDPSession(actorPage);
      await cdp.send('Input.imeSetComposition', {
        text: 'gong',
        selectionStart: 4,
        selectionEnd: 4,
      });
      await cdp.send('Input.imeSetComposition', {
        text: 'gongwei',
        selectionStart: 7,
        selectionEnd: 7,
      });
      await cdp.send('Input.insertText', { text: '工位' });
      await expect(workstation).toHaveValue('Synthetic 工位');
      await expect(workstation).not.toHaveAttribute('aria-invalid', 'true');
      await expect(actorPage.getByLabel(/^Reason/)).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await cdp.detach();
    }
    for (const [name, value] of Object.entries(facts)) {
      if (name === 'Mentor employee') {
        await actorPage.getByLabel(/^Mentor employee/).click();
        await actorPage
          .getByRole('option', { name: /Synthetic onboarding admin/ })
          .click();
      } else
        await actorPage
          .getByLabel(new RegExp('^' + name + '(?: [*])?$'))
          .fill(value);
    }
    await actorPage
      .getByLabel(/^Reason(?: \*)?$/)
      .fill('Synthetic ordinary role completion');
    const failingPath = '**/api/onboardings/*/tasks/*/actions';
    let originalBody: string | null = null;
    if (heading === 'Workstation and badge' && url === recordUrl) {
      await actorPage.route(
        failingPath,
        async (route) => {
          originalBody = route.request().postData();
          await route.abort('failed');
        },
        { times: 1 },
      );
    }
    await actorPage
      .getByRole('button', { name: 'Complete', exact: true })
      .click();
    if (heading === 'Workstation and badge' && url === recordUrl) {
      await expect(
        actorPage.getByRole('button', {
          name: 'Retry same command',
          exact: true,
        }),
      ).toBeVisible();
      await expect(actorPage.getByLabel(/^Workstation/)).toBeDisabled();
      const retried = actorPage.waitForRequest(
        (request) =>
          request.method() === 'POST' && request.url().endsWith('/actions'),
      );
      await actorPage
        .getByRole('button', { name: 'Retry same command', exact: true })
        .click();
      expect((await retried).postData()).toBe(originalBody);
    }
    await expect(section.getByText('Completed', { exact: true })).toBeVisible();
  };
  await completeTask(adminPage, 'Workstation and badge', {
    Workstation: 'SYNTH-DESK-1',
    'Access badge reference': 'SYNTH-BADGE-1',
  });
  await completeTask(financePage, 'Payment account and social insurance', {
    Bank: 'Synthetic bank',
    'Bank account': 'synthetic-bank-0001',
    'Account holder': 'Synthetic browser hire',
    'Social insurance reference': 'SYNTH-SOCIAL-1',
  });
  await financePage
    .getByRole('button', { name: 'Payment account', exact: true })
    .click();
  await expect(
    financePage.getByText('synthetic-bank-0001', { exact: true }),
  ).toBeVisible();
  await expect(
    financePage.getByRole('button', { name: 'Salary', exact: true }),
  ).toHaveCount(0);
  const bankPath =
    new URL(recordUrl).pathname.replace('/onboardings/', '/api/onboardings/') +
    '/bank';
  await org.removeDutyRoleMember('finance', finance.userId, context);
  expect(
    await financePage.evaluate(
      async (url) => (await fetch(url)).status,
      bankPath,
    ),
  ).toBe(403);
  await financePage.reload();
  await expect(
    financePage.getByText('synthetic-bank-0001', { exact: true }),
  ).toHaveCount(0);
  await expect(
    financePage.getByRole('button', { name: 'Payment account', exact: true }),
  ).toHaveCount(0);
  await org.addDutyRoleMember('finance', finance.userId, context);
  await page.reload();
  await page.getByRole('button', { name: 'Salary', exact: true }).click();
  await expect(page.getByText('12000.00', { exact: true })).toBeVisible();
  await org.removeDutyRoleMember('hr', hr.userId, context);
  expect(
    await page.evaluate(
      async (url) => (await fetch(url)).status,
      new URL(recordUrl).pathname.replace(
        '/onboardings/',
        '/api/onboardings/',
      ) + '/salary',
    ),
  ).toBe(403);
  await page.reload();
  await expect(page.getByText('12000.00', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Salary', exact: true }),
  ).toHaveCount(0);
  await org.addDutyRoleMember('hr', hr.userId, context);
  await page.reload();
  await page.setViewportSize({ width: 375, height: 812 });
  await mobileBounds();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'detail-mobile.png'),
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await label('Reason').fill('Synthetic new hire declined');
  await page
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Recovery task', exact: true }).first(),
  ).toBeVisible({ timeout: 20000 });
  await expect(
    page
      .getByRole('region', { name: 'Timeline' })
      .getByText(
        'Onboarding cancelled; recovery work created for completed tasks',
        { exact: true },
      ),
  ).toBeVisible();
  await mobileBounds();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'cancelled-recovery-mobile.png'),
    fullPage: true,
  });
  await page
    .getByRole('region', { name: 'Timeline' })
    .getByText(
      'Onboarding cancelled; recovery work created for completed tasks',
      { exact: true },
    )
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'timeline-cancelled-375.png'),
    fullPage: true,
  });
  const recover = async (
    actorPage: typeof page,
    url: string,
    receipt: string,
  ) => {
    await actorPage.goto(url);
    const section = taskSection(actorPage, 'Recovery task').filter({
      has: actorPage.getByRole('button', { name: 'Claim', exact: true }),
    });
    await expect(section).toHaveCount(1);
    await section.getByRole('button', { name: 'Claim', exact: true }).click();
    await actorPage.getByLabel(/^Reason/).fill('Synthetic recovery claim');
    await actorPage.getByRole('button', { name: 'Claim', exact: true }).click();
    const claimed = taskSection(actorPage, 'Recovery task').filter({
      has: actorPage.getByRole('button', { name: 'Complete', exact: true }),
    });
    await claimed
      .getByRole('button', { name: 'Complete', exact: true })
      .click();
    await actorPage.getByLabel(/^Recovery receipt/).fill(receipt);
    if (receipt === 'SYNTH-IT-RETURN') {
      await actorPage
        .getByRole('button', { name: 'Add asset', exact: true })
        .click();
      await actorPage
        .getByLabel('Asset code', { exact: true })
        .fill(physical.code);
      await actorPage
        .getByLabel('Serial number', { exact: true })
        .fill('BROWSER-ONB-SERIAL');
    }
    await actorPage
      .getByLabel(/^Reason/)
      .fill('Synthetic recovery confirmation');
    await actorPage
      .getByRole('button', { name: 'Complete', exact: true })
      .click();
    await expect(actorPage.getByText(receipt, { exact: true })).toBeVisible();
  };
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'assigned',
  });
  await recover(page, recordUrl, 'SYNTH-IT-RETURN');
  expect(await assets.get(physical.id, db.connection())).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
  });
  await recover(adminPage, recordUrl, 'SYNTH-ADMIN-RETURN');
  await recover(financePage, recordUrl, 'SYNTH-FINANCE-RETURN');
  await page.goto(`${host.origin}${host.basePath}/onboardings`);
  await createHire('Synthetic mentor cancellation');
  await page
    .getByRole('link', { name: 'Synthetic mentor cancellation', exact: true })
    .click();
  const mentorCancelUrl = page.url();
  await completeTask(
    managerPage,
    'Mentor and 30-day plan',
    {
      'Mentor employee': admin.employeeId,
      '30-day onboarding plan': 'Synthetic mentor plan',
    },
    mentorCancelUrl,
  );
  await page.reload();
  await page
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await page.getByLabel(/^Reason/).fill('Synthetic mentor cancellation');
  await page
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cancel onboarding', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Recovery task', exact: true }),
  ).toBeVisible();
  await recover(managerPage, mentorCancelUrl, 'SYNTH-MENTOR-RETURN');
  await page.goto(`${host.origin}${host.basePath}/onboardings`);
  await createHire('Synthetic all tasks');
  await page
    .getByRole('link', { name: 'Synthetic all tasks', exact: true })
    .click();
  const allUrl = page.url();
  await completeTask(
    page,
    'Account and equipment',
    { 'Device reference': 'SYNTH-ALL-DEVICE' },
    allUrl,
  );
  await completeTask(
    adminPage,
    'Workstation and badge',
    {
      Workstation: 'SYNTH-ALL-DESK',
      'Access badge reference': 'SYNTH-ALL-BADGE',
    },
    allUrl,
  );
  await completeTask(
    financePage,
    'Payment account and social insurance',
    {
      Bank: 'Synthetic bank',
      'Bank account': 'synthetic-bank-0002',
      'Account holder': 'Synthetic all tasks',
      'Social insurance reference': 'SYNTH-ALL-SOCIAL',
    },
    allUrl,
  );
  await page.reload();
  await expect(
    page.getByRole('dialog').last().getByText('Handling', { exact: true }),
  ).toBeVisible();
  await completeTask(
    managerPage,
    'Mentor and 30-day plan',
    {
      'Mentor employee': admin.employeeId,
      '30-day onboarding plan': 'Synthetic all task plan',
    },
    allUrl,
  );
  await page.reload();
  await expect(
    page.getByRole('dialog').last().getByText('Completed', { exact: true }),
  ).toHaveCount(5);
  for (const locale of ['en-US', 'zh-CN'])
    for (const mode of ['light', 'dark'])
      for (const preset of ['compact', 'default']) {
        const matrixPage = await host.pageFor(await hr.session(), {
          locale,
          viewport: { width: 375, height: 812 },
        });
        await matrixPage.addInitScript(
          ({ base, mode, preset }) => {
            const scope = encodeURIComponent(base.replace(/^\/+|\/+$/g, ''));
            localStorage.setItem(`nocobase:${scope}:theme:color-scheme`, mode);
            localStorage.setItem(`nocobase:${scope}:theme:preset`, preset);
          },
          { base: host.basePath, mode, preset },
        );
        matrixPage.on('pageerror', (error) => errors.push(error.message));
        await matrixPage.goto(allUrl);
        await expect(matrixPage.getByRole('dialog').last()).toBeVisible();
        await expect(
          matrixPage
            .getByRole('dialog')
            .last()
            .getByText(locale === 'zh-CN' ? '已完成' : 'Completed', {
              exact: true,
            }),
        ).toHaveCount(5);
        await matrixPage.evaluate(async () => {
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
          await matrixPage.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        const bounds = await matrixPage
          .getByRole('dialog')
          .last()
          .boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(376);
        expect(bounds!.y).toBeGreaterThanOrEqual(-1);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(813);
        expect(
          await matrixPage.locator('html').getAttribute('data-theme'),
        ).toBe(preset);
        expect(
          await matrixPage.locator('html').getAttribute('class'),
        ).toContain(mode);
        await matrixPage.screenshot({
          path: path.join(
            host.screenshotsDir,
            `all-${locale}-${mode}-${preset}-375.png`,
          ),
          fullPage: true,
        });
        await matrixPage
          .getByRole('region', {
            name: locale === 'zh-CN' ? '办理时间线' : 'Timeline',
            exact: true,
          })
          .getByRole('heading')
          .scrollIntoViewIfNeeded();
        await matrixPage.screenshot({
          path: path.join(
            host.screenshotsDir,
            `timeline-${locale}-${mode}-${preset}-375.png`,
          ),
          fullPage: true,
        });
        await matrixPage.context().close();
      }
  expect(errors).toEqual([]);
  await writeFile(
    path.join(host.screenshotsDir, 'result.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        scope:
          'isolated actual App/Vite synthetic HR/IT/admin/finance/department manager: three hires, ordinary four task completion, actual IT whole asset issue/cancellation preserving custody/owner return; admin/finance/mentor cancellation/recovery, bank withdrawal, joint completion; 375px bilingual light/dark compact/default',
        pageErrors: errors,
        mobileBoundsAndHorizontalOverflowPassed: true,
        passed: true,
      },
      null,
      2,
    ),
  );
  console.log(
    'Isolated onboarding browser passed: list/create/claim/complete/mobile.',
  );
} finally {
  await host.close();
}

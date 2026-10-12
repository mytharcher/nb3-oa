import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { write } from '../../logic/platform/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
} from '../../../server/providers/platform/index.js';
import { vehicleRequestServiceToken } from '../../../server/providers/vehicles/index.js';
const host = await startIsolatedBrowserApp({
  name: 'vehicles',
  apiPort: 13481,
  vitePort: 13482,
});
try {
  const c = host.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(vehicleRequestServiceToken),
    calendar = c.resolve(calendarServiceToken);
  const owner = await createEmployee(
      host.testApp,
      'Synthetic vehicle applicant',
    ),
    head = await createEmployee(host.testApp, 'Synthetic vehicle head'),
    admin = await createEmployee(host.testApp, 'Synthetic vehicle dispatch');
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  const department = await org.createDepartment(
    { title: 'Synthetic vehicle department', managerId: head.userId },
    { actorId: admin.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: admin.userId },
  );
  const type = (await c.resolve(dictionaryServiceToken).list('vehicleType'))[0]!
    .code;
  const vehicle = await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: 'SYN-BROWSER',
        name: 'Synthetic browser vehicle',
        vehicleType: type,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Isolated browser fixture',
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    service.vehicles.create(
      {
        plateNumber: 'SYN-SPARE',
        name: 'Synthetic spare vehicle',
        vehicleType: type,
        capacity: 4,
        status: 'active',
        actorId: admin.userId,
        reason: 'Isolated conflict recovery',
      },
      tx,
    ),
  );
  const os = await owner.session(),
    hs = await head.session(),
    as = await admin.session();
  const page = await host.pageFor(os),
    hp = await host.pageFor(hs),
    ap = await host.pageFor(as);
  const errors: string[] = [];
  for (const p of [page, hp, ap]) {
    p.setDefaultTimeout(20000);
    p.on('pageerror', (e) => errors.push(e.message));
  }
  const url = (id = '') =>
    `${host.origin}${host.basePath}/vehicle-requests${id ? '/' + id : ''}`;
  const action = async (
    p: Page,
    name: string,
    configure?: () => Promise<void>,
  ) => {
    await p.getByRole('button', { name, exact: true }).click();
    await expect(p.locator('#vehicle-action-form')).toBeVisible();
    if (configure) await configure();
    await p
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: 'Confirm', exact: true })
      .click();
    if (['Withdraw', 'Unable to dispatch'].includes(name))
      await p
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Confirm', exact: true })
        .click();
    await expect(p.locator('#vehicle-action-form')).toHaveCount(0);
  };
  await page.goto(url());
  await expect(
    page.getByRole('heading', { name: 'Vehicle requests', exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('No records yet', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New request', exact: true }).click();
  await expect(page.locator('#vehicle-purpose')).toBeVisible();
  await page
    .locator('#vehicle-purpose')
    .pressSequentially('Synthetic browser trip');
  const ime = await page.context().newCDPSession(page);
  await ime.send('Input.imeSetComposition', {
    text: 'che',
    selectionStart: 3,
    selectionEnd: 3,
  });
  await ime.send('Input.insertText', { text: '车辆' });
  await expect(page.locator('#vehicle-purpose')).toHaveValue(
    'Synthetic browser trip车辆',
  );
  await page.locator('#vehicle-purpose').press('Home');
  for (let cursor = 0; cursor < 10; cursor++)
    await page.locator('#vehicle-purpose').press('ArrowRight');
  await page.locator('#vehicle-purpose').pressSequentially('verified ');
  await expect(page.locator('#vehicle-purpose')).toHaveValue(
    'Synthetic verified browser trip车辆',
  );
  await page
    .locator('#vehicle-destination')
    .pressSequentially('Synthetic office');
  const day = calendar.addCalendarDays(calendar.localDate(new Date()), 3);
  for (const id of ['startAt', 'endAt']) {
    await page.locator(`#vehicle-${id}`).click();
    const selector = `button[data-day="${new Date(day + 'T12:00:00').toLocaleDateString('en-US')}"]`;
    for (let n = 0; n < 12 && !(await page.locator(selector).count()); n++)
      await page.getByRole('button', { name: /next month/i }).click();
    await page.locator(selector).last().click();
    await page
      .locator(
        `input[type=time][aria-label="${id === 'startAt' ? 'Start time' : 'End time'}"]`,
      )
      .fill(id === 'startAt' ? '09:00' : '10:00');
  }
  const created = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' &&
      r.url().endsWith('/api/vehicleRequests'),
  );
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const id = (await (await created).json()).data.record.id as string;
  await expect(page.locator('#vehicle-request-form')).toHaveCount(0);
  await page.goto(url(id));
  await action(page, 'Submit');
  await expect(
    page.getByText('Head review', { exact: true }).first(),
  ).toBeVisible();
  await hp.goto(url(id));
  await action(hp, 'Approve');
  await ap.goto(url(id));
  await action(ap, 'Claim dispatch task');
  await ap.getByRole('button', { name: 'Dispatch', exact: true }).click();
  await ap.locator('#vehicle-action-vehicleId').click();
  await ap
    .getByRole('option', {
      name: 'Synthetic browser vehicle · SYN-BROWSER',
      exact: true,
    })
    .click();
  await expect(ap.locator('#vehicle-action-vehicleId')).toContainText(
    'Synthetic browser vehicle · SYN-BROWSER',
  );
  // Occupy the stale browser candidate through another real SDK-authorized request.
  const first = (
    await (await os.fetch(`/vehicleBrowser/requests/${id}`)).json()
  ).data.record;
  const rival = await service.create(
    {
      purpose: 'Synthetic rival',
      destination: first.destination,
      startAt: first.startAt,
      endAt: first.endAt,
      passengers: 1,
      needsDriver: false,
    },
    owner.userId,
  );
  await service.transition(
    rival.record.id,
    'submit',
    owner.userId,
    rival.record.lifecycleVersion,
    randomUUID(),
  );
  const perform = async (
    session: typeof os,
    source: string,
    name: string,
    privateInput?: Record<string, unknown>,
  ) => {
    const d = (
      await (await session.fetch(`/vehicleBrowser/requests/${source}`)).json()
    ).data;
    const offer = d.taskActions.find((o: { actions: { name: string }[] }) =>
      o.actions.some((a) => a.name === name),
    );
    const run = d.runs.find((r: { tasks: { id: string }[] }) =>
      r.tasks.some((t) => t.id === offer.task.id),
    );
    const r = await session.fetch(
      `/vehicleRequests/${source}/actions`,
      write('POST', {
        target: { taskId: offer.task.id },
        action: name,
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        ...(privateInput
          ? { privateInput }
          : { comment: 'Synthetic rival preparation' }),
      }),
    );
    expect(r.status).toBe(200);
  };
  await perform(hs, rival.record.id, 'approve');
  await perform(as, rival.record.id, 'claim');
  await perform(as, rival.record.id, 'complete', {
    vehicleId: vehicle.id,
    driverId: null,
  });
  await ap
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(
    ap.getByText('The vehicle or driver is busy. Choose another.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(ap.locator('#vehicle-action-form')).toBeVisible();
  await ap.screenshot({
    path: path.join(host.screenshotsDir, 'stale-dispatch-conflict.png'),
    fullPage: true,
  });
  await ap.locator('#vehicle-action-vehicleId').click();
  await ap
    .getByRole('option', {
      name: 'Synthetic spare vehicle · SYN-SPARE',
      exact: true,
    })
    .click();
  await ap
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(ap.locator('#vehicle-action-form')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText('Usage pending', { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Withdraw', exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await action(page, 'Register usage', async () => {
    await page.locator('#vehicle-action-mileage').fill('25');
    await page.locator('#vehicle-action-fuel').fill('123.45');
    await page
      .locator('#vehicle-action-exception')
      .pressSequentially('Synthetic receipt');
    await page.screenshot({
      path: path.join(host.screenshotsDir, 'usage-filled-375.png'),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
  await expect(
    page.getByText('Completed', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('Usage receipt', { exact: true })).toBeVisible();
  await expect(page.getByText('123.45', { exact: false })).toHaveCount(0);
  await ap.reload();
  await expect(ap.getByText(/123\.45/)).toBeVisible();
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: admin.userId,
  });
  await ap
    .getByRole('dialog')
    .first()
    .getByRole('button', { name: 'Refresh', exact: true })
    .click();
  await expect(ap.getByText(/123\.45/)).toHaveCount(0);
  await expect
    .poll(
      async () => (await as.fetch(`/vehicleRequests/${id}/usageCost`)).status,
    )
    .toBe(403);
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'completed-owner.png'),
    fullPage: true,
  });
  // A second real owner draft exercises withdrawal independently of a dispatched immutable fact.
  const request = await service.create(
    {
      purpose: 'Synthetic withdrawn trip',
      destination: 'Office',
      startAt: day + 'T03:00:00Z',
      endAt: day + 'T04:00:00Z',
      passengers: 1,
      needsDriver: false,
    },
    owner.userId,
  );
  await page.goto(url(request.record.id));
  await action(page, 'Submit');
  await action(page, 'Withdraw');
  await expect(
    page.getByText('Withdrawn', { exact: true }).last(),
  ).toBeVisible();
  const detailPattern = `**/api/vehicleBrowser/requests/${id}`;
  for (const status of [500, 403, 404]) {
    await page.route(detailPattern, (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'SYNTHETIC', message: 'Synthetic transport failure' },
        }),
      }),
    );
    await page.goto(url(id));
    await expect(
      page.getByText(
        status === 403
          ? 'You cannot access this record or operation.'
          : status === 404
            ? 'The record is missing or outside your scope.'
            : 'The operation failed. Try again.',
        { exact: true },
      ),
    ).toBeVisible();
    if (status === 500)
      await expect(
        page.getByRole('button', { name: 'Retry', exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.getByRole('button', { name: 'Retry', exact: true }),
      ).toHaveCount(0);
    await page.screenshot({
      path: path.join(host.screenshotsDir, `error-${status}.png`),
      fullPage: true,
    });
    await page.unroute(detailPattern);
    if (status === 500)
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
    else await page.goto(url(id));
    await expect(
      page.getByText('Usage receipt', { exact: true }),
    ).toBeVisible();
  }
  await page.addInitScript(() => {
    const pref = JSON.parse(
      localStorage.getItem('vehicle-browser-preferences') ?? 'null',
    );
    if (pref) {
      localStorage.setItem('nocobase.locale', pref.locale);
      localStorage.setItem('i18nextLng', pref.locale);
    }
  });
  for (const locale of ['en-US', 'zh-CN'])
    for (const theme of ['light', 'dark'])
      for (const density of ['default', 'compact']) {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.evaluate(
          ({ locale, theme, density }) => {
            localStorage.setItem(
              'vehicle-browser-preferences',
              JSON.stringify({ locale }),
            );
            localStorage.setItem('nocobase.locale', locale);
            localStorage.setItem('i18nextLng', locale);
            const scope = location.pathname.split('/')[1];
            localStorage.setItem(`nocobase:${scope}:theme:color-scheme`, theme);
            localStorage.setItem(`nocobase:${scope}:theme:preset`, density);
          },
          { locale, theme, density },
        );
        await page.goto(url(id));
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(
          page.getByText(locale === 'zh-CN' ? '用后登记' : 'Usage receipt', {
            exact: true,
          }),
        ).toBeVisible();
        await expect
          .poll(() =>
            page.evaluate(() => document.documentElement.dataset.theme),
          )
          .toBe(density);
        await expect
          .poll(() =>
            page.evaluate(() =>
              document.documentElement.classList.contains('dark'),
            ),
          )
          .toBe(theme === 'dark');
        expect(
          await page.getByRole('dialog').locator('ol').first().innerText(),
        ).not.toMatch(/\b(done|ended|current|upcoming|returned)\b/);
        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          )
          .toBe(true);
        await page.screenshot({
          path: path.join(
            host.screenshotsDir,
            `${locale}-${theme}-${density}-375.png`,
          ),
          fullPage: true,
        });
      }
  expect(errors).toEqual([]);
  await writeFile(
    path.join(host.screenshotsDir, 'result.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        pageErrors: errors,
        vehicleId: vehicle.id,
        scope:
          'Synthetic actual main App browser: create draft/submit/head approval/claim/stale dispatch conflict and recovery/375px usage/submitted withdrawal/private cost role revoke/IME/500 recovery/403 and 404 no Retry/eight locale-theme-density mobile variants',
      },
      null,
      2,
    ),
  );
  console.log('Vehicles browser acceptance passed');
} finally {
  await host.close();
}

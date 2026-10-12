// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'meeting rooms isolated real-role browser acceptance',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'meeting-rooms',
      apiPort: 14137,
      vitePort: 15137,
    });
    const evidence = {
      checks: [] as string[],
      screenshots: [] as string[],
      errors: [] as string[],
    };
    const base = `${h.origin}${h.basePath}`;
    const check = (s: string) => evidence.checks.push(s);
    async function shot(p: Page, name: string) {
      const target = path.join(h.screenshotsDir, `${name}.png`);
      await p.screenshot({ path: target, fullPage: true });
      evidence.screenshots.push(target);
    }
    async function json(
      p: Page,
      suffix: string,
      method = 'GET',
      body?: unknown,
    ) {
      return p.evaluate(
        async ({ url, method, body }) => {
          const r = await fetch(url, {
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
        { url: `${h.basePath}/api/${suffix}`, method, body },
      );
    }
    const go = (p: Page, suffix: string) =>
      p.goto(`${base}/meeting-rooms${suffix}`, {
        waitUntil: 'domcontentloaded',
      });
    try {
      const manager = await createEmployee(
          h.testApp,
          'Browser Room Administrator',
        ),
        owner = await createEmployee(h.testApp, 'Browser Room Organizer'),
        other = await createEmployee(h.testApp, 'Browser Room Stranger');
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      await org.addDutyRoleMember('admin', manager.userId, {
        actorId: manager.userId,
      });
      const adminSession = await manager.session(),
        ownerSession = await owner.session();
      const admin = await h.pageFor(adminSession),
        employee = await h.pageFor(ownerSession),
        stranger = await h.pageFor(await other.session());
      for (const p of [admin, employee, stranger]) {
        p.setDefaultTimeout(25000);
        p.on('pageerror', (e) => evidence.errors.push(e.message));
      }
      await admin.goto(`${base}/`);
      await expect(admin.getByRole('heading', { level: 1 })).toBeVisible();
      const baselineErrors = [...evidence.errors];
      await go(admin, '?tab=rooms#source');
      await admin
        .getByRole('button', { name: 'Add meeting room', exact: true })
        .click();
      await admin.locator('#room-name').fill('Boardroom');
      await admin.locator('#room-capacity').fill('6');
      await admin.locator('#room-location').fill('Synthetic floor');
      await admin.locator('#room-facilities').fill('Screen');
      await admin.locator('#room-reason').fill('Browser acceptance');
      await admin
        .getByRole('switch', {
          name: 'Administrative confirmation required',
          exact: true,
        })
        .click();
      await admin.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        admin.getByRole('link', { name: 'Boardroom', exact: true }),
      ).toBeVisible();
      const rooms = await json(admin, 'meetingRooms');
      expect(rooms.status).toBe(200);
      const room = rooms.body.data.find(
        (r: { name: string }) => r.name === 'Boardroom',
      );
      check(
        'T04 actual admin-duty creates room with name/capacity/location/facilities and confirmation policy',
      );
      await go(employee, '?tab=rooms');
      await expect(
        employee.getByRole('button', { name: 'Add meeting room', exact: true }),
      ).toHaveCount(0);
      await go(employee, `/room/${room.id}/reserve?tab=rooms#source`);
      await employee.locator('#booking-title').fill('Private meeting');
      const cdp = await employee.context().newCDPSession(employee);
      await employee.locator('#booking-title').focus();
      await cdp.send('Input.imeSetComposition', {
        text: 'zhong',
        selectionStart: 5,
        selectionEnd: 5,
      });
      await cdp.send('Input.insertText', { text: '中国' });
      await expect(employee.locator('#booking-title')).toHaveValue(
        'Private meeting中国',
      );
      await employee.locator('#booking-date').click();
      // Select a future day from the real date picker, independently of the server's local time.
      await employee
        .locator('[data-slot=calendar] button[data-day]')
        .filter({ hasNot: employee.locator('[disabled]') })
        .last()
        .click();
      await employee.locator('#booking-startTime').fill('09:00');
      await employee.locator('#booking-endTime').fill('10:00');
      await employee.locator('#booking-frequency').click();
      await employee
        .getByRole('option', { name: 'Daily', exact: true })
        .click();
      await employee.locator('#booking-count').fill('3');
      await employee
        .getByRole('button', { name: 'Cancel', exact: true })
        .click();
      await expect(employee.getByRole('alertdialog')).toBeVisible();
      await employee
        .getByRole('button', { name: 'Keep editing', exact: true })
        .click();
      await employee
        .getByRole('button', { name: 'Book a meeting room', exact: true })
        .last()
        .click();
      await expect(employee.locator('#booking-title')).toHaveCount(0);
      await expect(employee).toHaveURL(
        `${base}/meeting-rooms/room/${room.id}?tab=rooms#source`,
      );
      const list = await json(employee, 'meetingBookings?mode=mine');
      expect(list.status).toBe(200);
      const series = list.body.data.filter(
        (b: { title: string }) => b.title === 'Private meeting中国',
      );
      expect(series).toHaveLength(3);
      series.sort((a: { startAt: string }, b: { startAt: string }) =>
        a.startAt.localeCompare(b.startAt),
      );
      const booking = series[0];
      check(
        'T05 browser creates finite three-day series; real IME and discard guard preserve typed input',
      );
      await go(stranger, '?tab=rooms');
      const privateRead = await json(stranger, `meetingBookings/${booking.id}`);
      expect(privateRead.status).toBe(404);
      const availability = await json(
        stranger,
        `meetingRooms/${room.id}/availability?startAt=${booking.startAt}&endAt=${series[2].endAt}`,
      );
      expect(availability.status).toBe(200);
      expect(availability.body.data.busy).toHaveLength(3);
      expect(JSON.stringify(availability.body)).not.toContain(
        'Private meeting',
      );
      expect(JSON.stringify(availability.body)).not.toContain(owner.userId);
      check(
        'T05 foreign browser session sees busy intervals without title/organizer and cannot read detail',
      );
      await go(employee, `/booking/${booking.id}/edit?tab=mine#source`);
      await employee
        .getByRole('switch', {
          name: 'This and future active bookings',
          exact: true,
        })
        .click();
      await expect(
        employee.getByText('This affects 3 active booking(s).', {
          exact: true,
        }),
      ).toBeVisible();
      await employee.locator('#booking-title').fill('Edited series');
      await employee.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(employee.locator('#booking-title')).toHaveCount(0);
      await expect(employee).toHaveURL(
        `${base}/meeting-rooms/booking/${booking.id}?tab=mine#source`,
      );
      for (const row of series) {
        const r = await json(employee, `meetingBookings/${row.id}`);
        expect(r.body.data.title).toBe('Edited series');
        expect(r.body.data.version).toBeGreaterThan(row.version);
      }
      check(
        'T05 browser future edit commits every currently mutable series member',
      );
      const secondDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: booking.companyTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(series[1].startAt));
      expect(
        (
          await json(admin, 'meetingBookings', 'POST', {
            requestId: randomUUID(),
            roomId: room.id,
            title: 'Atomicity blocker',
            attendeeUserIds: [],
            date: secondDate,
            startTime: '11:00',
            endTime: '12:00',
          })
        ).status,
      ).toBe(200);
      const before = await Promise.all(
        series.map(
          async (row: { id: string }) =>
            (await json(employee, `meetingBookings/${row.id}`)).body.data,
        ),
      );
      await go(employee, `/booking/${booking.id}/edit?tab=mine#source`);
      await employee
        .getByRole('switch', {
          name: 'This and future active bookings',
          exact: true,
        })
        .click();
      await expect(
        employee.getByText('This affects 3 active booking(s).', {
          exact: true,
        }),
      ).toBeVisible();
      await employee.locator('#booking-startTime').fill('11:00');
      await employee.locator('#booking-endTime').fill('12:00');
      await employee.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        employee.getByText(
          'The time overlaps another booking. Choose another time.',
          { exact: true },
        ),
      ).toBeVisible();
      for (const row of before) {
        const after = (await json(employee, `meetingBookings/${row.id}`)).body
          .data;
        expect(after.version).toBe(row.version);
        expect(after.startAt).toBe(row.startAt);
      }
      await employee.locator('#booking-startTime').fill('10:00');
      await employee.locator('#booking-endTime').fill('11:00');
      await employee.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(employee.locator('#booking-title')).toHaveCount(0);
      check(
        'T05 browser future edit conflict leaves all versions/times unchanged, then corrected adjacent intervals commit together',
      );
      const fresh = (await json(employee, `meetingBookings/${booking.id}`)).body
        .data;
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: fresh.companyTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(fresh.startAt));
      const conflict = await json(employee, 'meetingBookings', 'POST', {
        requestId: randomUUID(),
        roomId: room.id,
        title: 'Conflict',
        attendeeUserIds: [],
        date: parts,
        startTime: '09:30',
        endTime: '10:30',
        recurrence: { frequency: 'daily', count: 3 },
      });
      expect(conflict.status).toBe(409);
      expect(
        (await json(employee, 'meetingBookings?mode=mine')).body.meta.total,
      ).toBe(3);
      check(
        'T05 conflicting pending-confirmation finite batch returns 409 and creates zero extra records',
      );
      await go(admin, `/booking/${booking.id}?tab=administration`);
      await admin
        .getByRole('button', { name: 'Confirm booking', exact: true })
        .click();
      await admin
        .getByRole('dialog', { name: 'Confirm booking', exact: true })
        .getByRole('button', { name: 'Confirm booking', exact: true })
        .click();
      await expect(
        admin.getByText('Confirmed', { exact: true }).last(),
      ).toBeVisible();
      check(
        'T06 second real administrative actor confirms employee booking via actual browser action',
      );
      const self = await json(admin, 'meetingBookings', 'POST', {
        requestId: randomUUID(),
        roomId: room.id,
        title: 'Admin own meeting',
        attendeeUserIds: [],
        date: '2035-01-02',
        startTime: '09:00',
        endTime: '10:00',
      });
      expect(self.status).toBe(200);
      const own = self.body.data[0];
      await go(admin, `/booking/${own.id}?tab=mine`);
      await expect(
        admin.getByRole('heading', { name: 'Admin own meeting', exact: true }),
      ).toBeVisible();
      await expect(
        admin.getByRole('button', { name: 'Confirm booking', exact: true }),
      ).toHaveCount(0);
      expect(
        (
          await json(admin, `meetingBookings/${own.id}/confirm`, 'POST', {
            requestId: randomUUID(),
            expectedVersion: own.version,
          })
        ).status,
      ).toBe(403);
      check(
        'T06 own administrative booking cannot self-confirm in browser or HTTP',
      );
      await org.removeDutyRoleMember('admin', manager.userId, {
        actorId: manager.userId,
      });
      expect(
        (await json(admin, `meetingBookings/${series[1].id}`)).status,
      ).toBe(404);
      await go(admin, '?tab=rooms');
      await expect(
        admin.getByRole('button', { name: 'Add meeting room', exact: true }),
      ).toHaveCount(0);
      await expect(
        admin.getByRole('tab', { name: 'Administration', exact: true }),
      ).toHaveCount(0);
      check(
        'T06 actual admin-duty revocation removes foreign detail scope and management UI',
      );
      await org.addDutyRoleMember('admin', manager.userId, {
        actorId: manager.userId,
      });
      await go(admin, `/room/${room.id}/edit`);
      await admin.getByRole('switch', { name: 'Enabled', exact: true }).click();
      await admin
        .locator('#room-reason')
        .fill('Disable without deleting history');
      await admin.getByRole('button', { name: 'Save', exact: true }).click();
      expect(
        (await json(admin, `meetingRooms/${room.id}`)).body.data.active,
      ).toBe(false);
      expect(
        (await json(employee, `meetingBookings/${booking.id}`)).status,
      ).toBe(200);
      check('T04 browser disables room and preserves previous bookings');
      let failed = false;
      await employee.route('**/api/meetingRooms?*', async (route) => {
        if (!failed) {
          failed = true;
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Synthetic retry failure',
              },
            }),
          });
        } else await route.continue();
      });
      await go(employee, '?tab=rooms');
      await employee
        .getByRole('button', { name: 'Retry', exact: true })
        .click();
      await expect(
        employee.getByRole('link', { name: 'Boardroom', exact: true }),
      ).toBeVisible();
      await employee.unroute('**/api/meetingRooms?*');
      check('T06 transient list error recovers through visible Retry');
      for (const locale of ['en-US', 'zh-CN'])
        for (const theme of ['light', 'dark'])
          for (const preset of ['compact', 'default']) {
            const visual = await h.pageFor(ownerSession, {
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
            await go(visual, `/booking/${booking.id}?tab=mine#mobile`);
            await expect(
              visual.getByRole('heading', {
                name: 'Edited series',
                exact: true,
              }),
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
            const action = visual.getByRole('button', {
              name: locale === 'zh-CN' ? '取消预订' : 'Cancel booking',
              exact: true,
            });
            await expect(action).toBeVisible();
            const box = await action.boundingBox();
            expect(box!.y + box!.height).toBeLessThanOrEqual(812);
            expect(box!.height).toBeGreaterThanOrEqual(44);
            await shot(visual, `mobile-${locale}-${theme}-${preset}`);
            await visual.context().close();
          }
      check(
        'T06 375px Chinese/English light/dark compact/default detail has no document overflow and usable fixed actions',
      );
      expect(
        evidence.errors.filter((e) => !baselineErrors.includes(e)),
      ).toEqual([]);
      await shot(admin, 'admin-final');
    } finally {
      await writeFile(
        path.join(h.screenshotsDir, 'meeting-rooms-evidence.json'),
        JSON.stringify(evidence, null, 2),
      );
      await h.close();
    }
  },
  240000,
);

// @vitest-environment node
import { it } from 'vitest';
import { expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { meetingRoomServiceToken } from '../../../server/providers/meeting-rooms/contract.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'real meeting booking, reschedule and cancellation synchronize participant schedules and the home card',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'meeting-schedule-sync',
      apiPort: 14157,
      vitePort: 15157,
    });
    const checks: string[] = [];
    try {
      const c = h.testApp.application.container,
        db = c.resolve(databaseManagerToken);
      const owner = await createEmployee(h.testApp, 'Meeting organizer'),
        attendee = await createEmployee(h.testApp, 'Meeting attendee'),
        stranger = await createEmployee(h.testApp, 'Meeting outsider'),
        administrator = await createEmployee(h.testApp, 'Room administrator');
      await c
        .resolve(organizationServiceToken)
        .addDutyRoleMember('admin', administrator.userId, {
          actorId: administrator.userId,
        });
      const room = await db.transaction((tx) =>
        c.resolve(meetingRoomServiceToken).saveRoom(
          {
            actorId: administrator.userId,
            requestId: randomUUID(),
            name: 'Sync room',
            location: 'Test floor',
            facilities: null,
            capacity: 5,
            active: true,
            requiresAdminConfirmation: false,
            reason: 'Synthetic browser fixture',
          },
          tx,
        ),
      );
      const opts = {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
        timezoneId: 'Asia/Shanghai',
      };
      const page = await h.pageFor(await owner.session(), opts),
        participant = await h.pageFor(await attendee.session(), opts),
        outside = await h.pageFor(await stranger.session(), opts);
      for (const p of [page, participant, outside]) p.setDefaultTimeout(25000);
      const base = `${h.origin}${h.basePath}`;
      const today = await page.evaluate(() =>
        new Date().toLocaleDateString('en-CA'),
      );
      // Late today keeps the meeting editable while making it visible in today's card.
      await page.goto(
        `${base}/meeting-rooms/reserve?selectedRoom=${room.id}&meetingDate=${today}&meetingStart=23:00&meetingEnd=23:15`,
      );
      await page.locator('#booking-title').fill('Browser sync meeting');
      await page.locator('#booking-attendeeUserIds').fill('Meeting attendee');
      await page.getByRole('option', { name: /Meeting attendee/ }).click();
      await page
        .getByRole('dialog', { name: 'Book a meeting room', exact: true })
        .getByRole('button', { name: 'Book a meeting room', exact: true })
        .click();
      await expect(page.locator('#booking-form')).toHaveCount(0);
      const booking = await db
        .repository('meetingBookings')
        .findOne({ filter: { title: 'Browser sync meeting' } });
      expect(booking).toBeTruthy();
      const bookingUrl = `${base}/meeting-rooms/booking/${booking!.id}`;
      const title = (p: Page, name = 'Browser sync meeting') =>
        p.getByRole('link', { name, exact: true });
      for (const p of [page, participant]) {
        await p.goto(`${base}/personal-schedules`);
        await expect(title(p)).toBeVisible();
      }
      const participantScheduleUrl =
        await title(participant).getAttribute('href');
      checks.push('UI booking creates organizer and attendee schedules');
      await outside.goto(`${base}/personal-schedules`);
      await expect(
        outside.getByText('No appointments on this day'),
      ).toBeVisible();
      await outside.goto(`${h.origin}${participantScheduleUrl}`);
      await expect(
        outside.getByText(
          'This appointment does not exist or has been deleted. Return to your schedule.',
        ),
      ).toBeVisible();
      await participant.goto(`${base}/`);
      const card = participant.locator('[data-slot="card"]').filter({
        has: participant.getByText("Today's schedule", { exact: true }),
      });
      await expect(
        card.getByRole('link', { name: 'Browser sync meeting', exact: true }),
      ).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await expect
        .poll(() => card.evaluate((el) => el.getBoundingClientRect().height))
        .toBeLessThan(600);
      const siblingWidths = await card.evaluate((el) =>
        Array.from(el.parentElement!.children).map(
          (child) => child.getBoundingClientRect().width,
        ),
      );
      expect(siblingWidths.every((width) => width > 250)).toBe(true);
      await participant.screenshot({
        path: path.join(h.screenshotsDir, 'today-booked-en-375.png'),
        fullPage: true,
      });
      const chinese = await h.pageFor(await attendee.session(), {
        ...opts,
        locale: 'zh-CN',
        colorScheme: 'dark',
      });
      await chinese.goto(`${base}/`);
      const chineseCard = chinese
        .locator('[data-slot="card"]')
        .filter({ has: chinese.getByText('今日日程', { exact: true }) });
      await expect(
        chineseCard.getByRole('link', {
          name: 'Browser sync meeting',
          exact: true,
        }),
      ).toBeVisible();
      await chineseCard.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          chineseCard.evaluate((el) => el.getBoundingClientRect().height),
        )
        .toBeLessThan(600);
      await chinese.screenshot({
        path: path.join(h.screenshotsDir, 'today-booked-zh-dark-375.png'),
        fullPage: true,
      });
      await participant.setViewportSize({ width: 1440, height: 1000 });
      await card.scrollIntoViewIfNeeded();
      const desktopWidths = await card.evaluate((el) =>
        Array.from(el.parentElement!.children).map(
          (child) => child.getBoundingClientRect().width,
        ),
      );
      expect(
        Math.max(...desktopWidths) - Math.min(...desktopWidths),
      ).toBeLessThan(2);
      await participant.screenshot({
        path: path.join(h.screenshotsDir, 'today-booked-en-desktop.png'),
        fullPage: true,
      });
      await participant.setViewportSize(opts.viewport);
      checks.push(
        'mobile card widths remain readable in English light and Chinese dark; desktop columns share equal width',
      );
      await page.goto(`${bookingUrl}/edit`);
      await page.locator('#booking-title').fill('Rescheduled browser meeting');
      await page.locator('#booking-startTime').fill('23:20');
      await page.locator('#booking-endTime').fill('23:40');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.locator('#booking-form')).toHaveCount(0);
      await card.getByRole('button', { name: 'Refresh', exact: true }).click();
      await expect(
        card.getByRole('link', {
          name: 'Rescheduled browser meeting',
          exact: true,
        }),
      ).toBeVisible();
      await expect(card).toContainText('11:20');
      await expect(
        card.getByRole('link', { name: 'Browser sync meeting', exact: true }),
      ).toHaveCount(0);
      checks.push(
        'home card explicit refresh replaces the old meeting title and time',
      );
      for (const p of [page, participant]) {
        await p.goto(`${base}/personal-schedules`);
        await expect(title(p, 'Rescheduled browser meeting')).toBeVisible();
        await expect(title(p)).toHaveCount(0);
      }
      await participant.screenshot({
        path: path.join(h.screenshotsDir, 'attendee-rescheduled-en-375.png'),
        fullPage: true,
      });
      await participant.goto(`${base}/`);
      await expect(
        card.getByRole('link', {
          name: 'Rescheduled browser meeting',
          exact: true,
        }),
      ).toBeVisible();
      await page.goto(`${bookingUrl}/action/cancel`);
      await page.locator('#meeting-action-reason').fill('Browser cancellation');
      await page
        .getByRole('dialog', { name: 'Cancel booking', exact: true })
        .getByRole('button', { name: 'Cancel booking', exact: true })
        .click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Cancel booking', exact: true })
        .click();
      await expect(page.locator('#meeting-action-form')).toHaveCount(0);
      await card.getByRole('button', { name: 'Refresh', exact: true }).click();
      await expect(card.getByText('No appointments on this day')).toBeVisible();
      for (const p of [page, participant]) {
        await p.goto(`${base}/personal-schedules`);
        await expect(p.getByText('No appointments on this day')).toBeVisible();
      }
      checks.push(
        'UI cancellation removes both schedules and refresh clears home card',
      );
      checks.push('outsider list and direct schedule URL remain isolated');
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify({ checks }, null, 2),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);

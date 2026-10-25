// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { it, expect, vi } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee, grantToUser } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { outingServiceToken } from '../../../server/providers/outings/index.js';
import { travelServiceToken } from '../../../server/providers/travel/index.js';
import { cancellationServiceToken } from '../../../server/providers/leave-cancellations/service.js';
import { travelCancellationServiceToken } from '../../../server/providers/travel/cancellation-service.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'manager today shows three approved team activities, excludes non-team data, and follows effective cancellations at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'team-status',
      apiPort: 14181,
      vitePort: 15181,
    });
    try {
      const c = h.testApp.application.container;
      const org = c.resolve(organizationServiceToken),
        calendar = c.resolve(calendarServiceToken);
      const date = calendar.localDate(new Date());
      // Freeze Date only; browser/network/scheduler timers remain real. All
      // synthetic approvals occur before work starts; later cancellations test effective prefixes.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(calendar.resolveLocalDateTime(date, '00:00'));
      const manager = await createEmployee(h.testApp, 'Team manager');
      const owner = await createEmployee(h.testApp, 'Team colleague', {
        managerId: manager.employeeId,
      });
      const otherManager = await createEmployee(h.testApp, 'Outside manager');
      const outsider = await createEmployee(h.testApp, 'Outside colleague', {
        managerId: otherManager.employeeId,
      });
      const otherDepartment = await org.createDepartment(
        { title: 'Other team', managerId: otherManager.userId },
        { actorId: otherManager.userId },
      );
      await org.addMember(
        {
          departmentId: otherDepartment.id,
          userId: outsider.userId,
          primary: true,
        },
        { actorId: otherManager.userId },
      );
      await grantToUser(
        h.testApp,
        'team-browser-read-all',
        [
          {
            resource: { type: 'composite', id: 'oa.leave' },
            actions: [
              {
                action: 'view',
                policy: {
                  type: 'composite',
                  scopes: { leaveRequests: 'allRecords' },
                },
              },
            ],
          },
        ],
        manager.userId,
      );
      const department = await org.createDepartment(
        { title: 'Manager team', managerId: manager.userId },
        { actorId: manager.userId },
      );
      for (const userId of [owner.userId, manager.userId])
        await org.addMember(
          { departmentId: department.id, userId, primary: true },
          { actorId: manager.userId },
        );
      await org.addDutyRoleMember('finance', manager.userId, {
        actorId: manager.userId,
      });
      await calendar.setDay({ date, kind: 'workday' }, manager.userId);
      const leave = c.resolve(leaveServiceToken),
        outing = c.resolve(outingServiceToken),
        travel = c.resolve(travelServiceToken);
      const startAt = calendar
          .resolveLocalDateTime(date, '09:00')
          .toISOString(),
        endAt = calendar.resolveLocalDateTime(date, '18:00').toISOString();
      const leaveDraft = await leave.create(
        {
          leaveType: 'personal',
          startDate: date,
          endDate: date,
          startHalf: 'am',
          endHalf: 'am',
          reason: 'Synthetic team leave',
          attachments: [],
          handoverUserId: null,
          enableDelegation: false,
        },
        owner.userId,
      );
      const outingDraft = await outing.create(
        {
          startAt,
          endAt,
          location: 'Synthetic office',
          reason: 'Synthetic team outing',
        },
        owner.userId,
      );
      const travelDraft = await travel.create(
        {
          destination: 'Synthetic city',
          international: false,
          startAt,
          endAt,
          reason: 'Synthetic team travel',
          companionIds: [],
          attachments: [],
          transportCents: 0,
          lodgingCents: 0,
          allowanceCents: 0,
          needsLoan: false,
          needsBooking: false,
        },
        owner.userId,
      );
      const outsideDraft = await leave.create(
        {
          leaveType: 'personal',
          startDate: date,
          endDate: date,
          startHalf: 'am',
          endHalf: 'am',
          reason: 'Synthetic outside team',
          attachments: [],
          handoverUserId: null,
          enableDelegation: false,
        },
        outsider.userId,
      );
      for (const { service, draft, applicant, reviewer } of [
        {
          service: leave,
          draft: leaveDraft,
          applicant: owner.userId,
          reviewer: manager.userId,
        },
        {
          service: outing,
          draft: outingDraft,
          applicant: owner.userId,
          reviewer: manager.userId,
        },
        {
          service: travel,
          draft: travelDraft,
          applicant: owner.userId,
          reviewer: manager.userId,
        },
        {
          service: leave,
          draft: outsideDraft,
          applicant: outsider.userId,
          reviewer: otherManager.userId,
        },
      ]) {
        const id = String(draft.record.id);
        await service.transition(
          id,
          'submit',
          applicant,
          Number(draft.record.lifecycleVersion),
          randomUUID(),
        );
        for (let stage = 0; stage < 5; stage++) {
          const d = await service.detail(id, reviewer);
          if (['approved', 'completed'].includes(String(d.record.status)))
            break;
          const offer = d.taskActions.find((item) =>
            item.actions.some((action) => action.name === 'approve'),
          );
          expect(offer, `${id} current stage ${d.record.status}`).toBeDefined();
          const run = d.runs.find((item) => item.run.id === offer!.task.runId)!;
          await service.action(
            id,
            {
              target: { taskId: offer!.task.id },
              action: 'approve',
              contentHash: run.run.contentHash,
              requestId: randomUUID(),
            },
            reviewer,
          );
        }
        expect(['approved', 'completed']).toContain(
          (await service.detail(id, reviewer)).record.status,
        );
      }
      const session = await manager.session();
      const result = await (
        await session.fetch('/personalSchedules/team?scope=managed')
      ).json();
      expect(result.meta).toEqual({ date, timeZone: calendar.timeZone() });
      const visible = await (
        await session.fetch(`/personalSchedules/team?date=${date}`)
      ).json();
      expect(
        visible.data.some(
          (row: { userId: string }) => row.userId === outsider.userId,
        ),
      ).toBe(true);
      expect(
        new Set(result.data.map((row: { kind: string }) => row.kind)),
      ).toEqual(new Set(['leave', 'outing', 'travel']));
      expect(
        result.data.every(
          (row: { userId: string }) => row.userId === owner.userId,
        ),
      ).toBe(true);
      expect(
        (
          await (
            await (
              await outsider.session()
            ).fetch('/personalSchedules/team?scope=managed')
          ).json()
        ).data,
      ).toEqual([]);
      expect(
        (
          await session.fetch(
            '/personalSchedules/team?scope=managed&userIds=bogus',
          )
        ).status,
      ).toBe(400);
      vi.useRealTimers();
      const page = await h.pageFor(session, {
        locale: 'en-US',
        viewport: { width: 375, height: 812 },
      });
      const teamLoaded = page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith('/personalSchedules/team') &&
          r.status() === 200,
      );
      await page.goto(`${h.origin}${h.basePath}/`);
      await teamLoaded;
      const card = page.getByRole('region', { name: 'Today’s team status' });
      await browserExpect(
        card.getByText('Leave · 1', { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await browserExpect(
        card.getByText('Business trip · 1', { exact: true }),
      ).toBeVisible();
      await browserExpect(
        card.getByText('Outing · 1', { exact: true }),
      ).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      const brandBox = await page
        .locator('header a[aria-label="NocoOA home"]')
        .boundingBox();
      const searchBox = await page
        .locator('header a[href$="/search"]')
        .boundingBox();
      await browserExpect(
        page.locator('header a[href$="/taskCenter"],header a[href$="/inbox"]'),
      ).toHaveCount(0);
      expect(brandBox).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(searchBox!.x);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `${h.screenshotsDir}/team-en-375.png`,
        fullPage: true,
      });
      await card.getByRole('link', { name: 'View team calendar' }).click();
      await browserExpect(page).toHaveURL(/scope=managed/);
      await browserExpect(
        page.getByText('Team colleague', { exact: true }),
      ).toHaveCount(3);
      await page.screenshot({
        path: `${h.screenshotsDir}/calendar-en-375.png`,
        fullPage: true,
      });
      await page.close();
      const zh = await h.pageFor(session, {
        locale: 'zh-CN',
        viewport: { width: 375, height: 812 },
      });
      const zhLoaded = zh.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith('/personalSchedules/team') &&
          r.status() === 200,
      );
      await zh.goto(`${h.origin}${h.basePath}/`);
      await zhLoaded;
      const chinese = zh.getByRole('region', { name: '今日团队状态' });
      await browserExpect(
        chinese.getByText('请假 · 1', { exact: true }),
      ).toBeVisible();
      await chinese.scrollIntoViewIfNeeded();
      await zh.screenshot({
        path: `${h.screenshotsDir}/team-zh-375.png`,
        fullPage: true,
      });
      await zh.close();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(calendar.resolveLocalDateTime(date, '00:00'));
      const leaveCancel = c.resolve(cancellationServiceToken),
        tripCancel = c.resolve(travelCancellationServiceToken);
      const lc = await leaveCancel.create(
        {
          originalLeaveId: String(leaveDraft.record.id),
          cancelAll: true,
          endDate: date,
          endHalf: 'am',
          reason: 'Synthetic cancellation for effective team status',
        },
        owner.userId,
      );
      const tc = await tripCancel.create(
        {
          sourceId: String(travelDraft.record.id),
          reason: 'Synthetic cancelled trip',
        },
        owner.userId,
      );
      for (const { service, draft } of [
        { service: leaveCancel, draft: lc },
        { service: tripCancel, draft: tc },
      ]) {
        // Leave is cancelled before it starts; trip cancellation clips an elapsed morning.
        if (service === tripCancel)
          vi.setSystemTime(calendar.resolveLocalDateTime(date, '11:00'));
        const id = String(draft.record.id);
        await service.transition(
          id,
          'submit',
          owner.userId,
          Number(draft.record.lifecycleVersion),
          randomUUID(),
        );
        for (let stage = 0; stage < 5; stage++) {
          const d = await service.detail(id, manager.userId);
          if (['approved', 'completed'].includes(String(d.record.status)))
            break;
          const offer = d.taskActions.find((item) =>
            item.actions.some((action) => action.name === 'approve'),
          );
          expect(offer).toBeDefined();
          const run = d.runs.find((item) => item.run.id === offer!.task.runId)!;
          await service.action(
            id,
            {
              target: { taskId: offer!.task.id },
              action: 'approve',
              contentHash: run.run.contentHash,
              requestId: randomUUID(),
            },
            manager.userId,
          );
        }
      }
      const activeOuting = await outing.detail(
        String(outingDraft.record.id),
        manager.userId,
      );
      await outing.transition(
        String(outingDraft.record.id),
        'terminate',
        manager.userId,
        Number(activeOuting.record.lifecycleVersion),
        randomUUID(),
        { reason: 'End after elapsed morning' },
      );
      const cancelled = await (
        await session.fetch('/personalSchedules/team?scope=managed')
      ).json();
      expect(
        new Set(cancelled.data.map((row: { kind: string }) => row.kind)),
      ).toEqual(new Set(['outing', 'travel']));
      for (const row of cancelled.data) {
        expect(Date.parse(row.startAt)).toBe(Date.parse(startAt));
        expect(Date.parse(row.endAt)).toBe(
          +calendar.resolveLocalDateTime(date, '11:00'),
        );
      }
      vi.useRealTimers();
      const after = await h.pageFor(session, {
        locale: 'en-US',
        viewport: { width: 375, height: 812 },
      });
      const afterLoaded = after.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith('/personalSchedules/team') &&
          r.status() === 200,
      );
      await after.goto(`${h.origin}${h.basePath}/`);
      await afterLoaded;
      const updated = after.getByRole('region', {
        name: 'Today’s team status',
      });
      await browserExpect(
        updated.getByText('Leave · 0', { exact: true }),
      ).toBeVisible();
      await browserExpect(
        updated.getByText('Business trip · 1', { exact: true }),
      ).toBeVisible();
      await browserExpect(
        updated.getByText('Outing · 1', { exact: true }),
      ).toBeVisible();
      await updated.scrollIntoViewIfNeeded();
      await after.screenshot({
        path: `${h.screenshotsDir}/team-cancelled-375.png`,
        fullPage: true,
      });
    } finally {
      vi.useRealTimers();
      await h.close();
    }
  },
  240000,
);

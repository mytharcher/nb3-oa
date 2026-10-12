// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { it } from 'vitest';
import { expect } from '@playwright/test';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { createUser } from '../../logic/platform/helpers.js';
import { grantToUser } from '../../logic/employees/helpers.js';
import { startIsolatedBrowserApp } from '../browser/harness.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'V06 efficiency real SDK isolated browser acceptance',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'approval-efficiency',
      apiPort: 14162,
      vitePort: 15162,
    });
    try {
      const db = h.testApp.application.container.resolve(databaseManagerToken),
        leave = h.testApp.application.container.resolve(leaveServiceToken),
        authz = h.testApp.application.container.resolve(authorizationToken);
      const reader = await createUser(h.testApp, 'Efficiency reader'),
        other = await createUser(h.testApp, 'Efficiency other'),
        manager = await createUser(h.testApp, 'Efficiency manager');
      const managerEmployee = randomUUID(),
        departmentId = randomUUID();
      for (const [user, id, managerId] of [
        [manager.user, managerEmployee, null],
        [reader.user, randomUUID(), managerEmployee],
        [other.user, randomUUID(), managerEmployee],
      ] as const)
        await db.repository('employees').createOne({
          values: {
            id,
            code: id,
            userId: user.id,
            name: user.name,
            managerId,
            status: 'regular',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      await db.repository('departments').createOne({
        values: {
          id: departmentId,
          title: 'Efficiency department',
          managerId: manager.user.id,
          active: true,
        },
      });
      for (const user of [reader.user, other.user])
        await db.repository('departmentMembers').createOne({
          values: {
            id: randomUUID(),
            departmentId,
            userId: user.id,
            primary: true,
            active: true,
          },
        });
      const ids: string[] = [];
      for (const applicant of [reader.user, other.user]) {
        const draft = await leave.create(
          {
            leaveType: 'personal',
            startDate: '2026-11-02',
            endDate: '2026-11-02',
            startHalf: 'am',
            endHalf: 'pm',
            reason: 'secret synthetic reason',
            attachments: [],
            handoverUserId: null,
            enableDelegation: false,
          },
          applicant.id,
        );
        const id = String(draft.record.id);
        ids.push(id);
        await leave.transition(
          id,
          'submit',
          applicant.id,
          Number(draft.record.lifecycleVersion),
          randomUUID(),
        );
        if (applicant.id === reader.user.id) {
          const first = await leave.detail(id, manager.user.id);
          const firstOffer = first.taskActions.find((t) =>
            t.actions.some((a) => a.name === 'return'),
          )!;
          const firstRun = first.runs.find(
            (r) => r.run.id === firstOffer.task.runId,
          )!;
          await leave.action(
            id,
            {
              target: { taskId: firstOffer.task.id },
              action: 'return',
              comment: 'Synthetic correction needed',
              input: { to: 'revision' },
              contentHash: firstRun.run.contentHash,
              requestId: randomUUID(),
            },
            manager.user.id,
          );
          const revision = await leave.detail(id, applicant.id);
          await leave.transition(
            id,
            'submit',
            applicant.id,
            Number(revision.record.lifecycleVersion),
            randomUUID(),
          );
        }
        const detail = await leave.detail(id, manager.user.id);
        const offer = detail.taskActions.find((t) =>
          t.actions.some((a) => a.name === 'approve'),
        )!;
        expect(offer).toBeDefined();
        const run = detail.runs.find((r) => r.run.id === offer.task.runId)!;
        await leave.action(
          id,
          {
            target: { taskId: offer.task.id },
            action: 'approve',
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          manager.user.id,
        );
      }

      const viewer = await createUser(
        h.testApp,
        'Independent efficiency viewer',
      );
      const key = `efficiency-browser-${randomUUID()}`;
      await grantToUser(
        h.testApp,
        key,
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
        viewer.user.id,
      );
      for (const locale of process.env.OA_BROWSER_FIXES_ONLY === '1'
        ? ['en-US']
        : ['en-US', 'zh-CN'])
        for (const color of process.env.OA_BROWSER_FIXES_ONLY === '1'
          ? ['light']
          : ['light', 'dark'])
          for (const preset of process.env.OA_BROWSER_FIXES_ONLY === '1'
            ? ['default']
            : ['default', 'compact']) {
            const en = locale === 'en-US';
            const p = await h.pageFor(viewer, {
              locale,
              viewport: { width: 375, height: 812 },
            });
            const errors: string[] = [];
            p.on('pageerror', (e) => errors.push(e.message));
            await p.addInitScript(
              ({ color, preset }) => {
                localStorage.setItem('nocobase:main:theme:color-scheme', color);
                localStorage.setItem('nocobase:main:theme:preset', preset);
              },
              { color, preset },
            );
            await p.goto(`${h.origin}${h.basePath}/reports`);
            await p
              .getByRole('tab', {
                name: en
                  ? 'Leave decision task elapsed time'
                  : '请假决策任务自然耗时',
                exact: true,
              })
              .click();
            const year = p.getByLabel(en ? 'Start year' : '开始年份', {
              exact: true,
            });
            await year.focus();
            await p.keyboard.type('2026');
            await expect(p.locator('tbody tr')).toHaveCount(1);
            await p
              .getByLabel(en ? 'Start month (optional)' : '开始月份（可选）', {
                exact: true,
              })
              .fill('11');
            await expect(p.locator('tbody tr')).toHaveCount(1);
            const downloadEvent = p.waitForEvent('download');
            await p
              .getByRole('button', {
                name: en ? 'Export Excel' : '导出 Excel',
                exact: true,
              })
              .click();
            const download = await downloadEvent;
            expect(download.suggestedFilename()).toBe(
              'leave-approval-efficiency.xlsx',
            );
            await p.screenshot({
              path: path.join(
                h.screenshotsDir,
                `${locale}-${color}-${preset}-375.png`,
              ),
              fullPage: true,
            });
            for (const status of [500, 403, 412, 401]) {
              const pattern = '**/api/reports/leave-approval-efficiency?*';
              await p.route(pattern, (r) =>
                r.fulfill({
                  status,
                  contentType: 'application/json',
                  body: JSON.stringify({
                    error: { message: 'private synthetic error' },
                  }),
                }),
              );
              await p
                .getByRole('button', {
                  name: en ? 'Refresh' : '刷新',
                  exact: true,
                })
                .click();
              await expect(p.locator('tbody tr')).toHaveCount(0);
              if (status === 500)
                await expect(
                  p.getByRole('button', {
                    name: en ? 'Retry' : '重试',
                    exact: true,
                  }),
                ).toBeVisible();
              if (status === 403)
                await expect(
                  p.getByRole('button', {
                    name: en ? 'Export Excel' : '导出 Excel',
                    exact: true,
                  }),
                ).toHaveCount(0);
              if (status === 412)
                await expect(
                  p.getByRole('button', {
                    name: en ? 'Retry' : '重试',
                    exact: true,
                  }),
                ).toHaveCount(0);
              if (status === 401)
                await expect(
                  p.getByRole('button', {
                    name: en ? 'Sign in again' : '重新登录',
                    exact: true,
                  }),
                ).toBeVisible();
              await expect(
                p.getByText('private synthetic error', { exact: true }),
              ).toHaveCount(0);
              await p.unroute(pattern);
              await p
                .getByRole('button', {
                  name: en ? 'Refresh' : '刷新',
                  exact: true,
                })
                .click();
              await expect(p.locator('tbody tr')).toHaveCount(1);
            }
            if (process.env.OA_BROWSER_FIXES_ONLY === '1') {
              await authz.permissionSets.delete(key);
              await authz.permissionSets.delete('oa-leave-employee');
              await p
                .getByRole('button', { name: 'Refresh', exact: true })
                .click();
              await expect(p.locator('tbody tr')).toHaveCount(0);
              await expect(
                p.getByRole('button', { name: 'Export Excel', exact: true }),
              ).toHaveCount(0);
              if ((await year.inputValue()) === '') await year.fill('2026');
              await expect(
                p.locator('[role=tabpanel] [data-slot=alert].text-destructive'),
              ).toBeVisible();
            }
            expect(errors).toEqual([]);
            await p.close();
          }
      if (process.env.OA_BROWSER_FIXES_ONLY !== '1')
        await authz.permissionSets.delete(key);
    } finally {
      await h.close();
    }
  },
  240000,
);

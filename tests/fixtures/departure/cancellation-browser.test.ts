// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { departureServiceToken } from '../../../server/providers/departure/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';

it.runIf(process.env.OA_DEPARTURE_BROWSER === '1')(
  'real HR browser requests departure cancellation and another HR confirms',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'departure-cancellation',
      apiPort: 14162,
      vitePort: 15162,
    });
    try {
      const c = h.testApp.application.container,
        org = c.resolve(organizationServiceToken),
        service = c.resolve(departureServiceToken),
        calendar = c.resolve(calendarServiceToken);
      const initiator = await createEmployee(
          h.testApp,
          'Cancellation requesting HR',
        ),
        reviewer = await createEmployee(
          h.testApp,
          'Cancellation confirming HR',
        );
      await org.addDutyRoleMember('hr', initiator.userId, {
        actorId: initiator.userId,
      });
      await org.addDutyRoleMember('hr', reviewer.userId, {
        actorId: initiator.userId,
      });
      const grade = await org.createGrade(
        { code: randomUUID(), title: 'Cancellation worker grade', rank: 1 },
        { actorId: initiator.userId },
      );
      const worker = await createEmployee(
        h.testApp,
        'Cancellation retained employee',
        { managerId: initiator.employeeId, gradeId: grade.id },
      );
      const department = await org.createDepartment(
        {
          title: 'Cancellation browser department',
          managerId: initiator.userId,
        },
        { actorId: initiator.userId },
      );
      await org.addMember(
        { departmentId: department.id, userId: worker.userId, primary: true },
        { actorId: initiator.userId },
      );
      const day = calendar.addCalendarDays(calendar.localDate(new Date()), 10);
      const draft = await service.create(
        {
          departureType: 'resignation',
          reason: 'Browser cancellation fixture',
          expectedLastWorkingDay: day,
          handoverUserId: reviewer.userId,
        },
        worker.userId,
      );
      const id = String(draft.record.id);
      await service.transition(
        id,
        'submit',
        worker.userId,
        Number(draft.record.lifecycleVersion),
        randomUUID(),
      );
      for (let n = 0; n < 4; n++) {
        const detail = await service.detail(id, initiator.userId);
        if (detail.record.status === 'handover') break;
        const offer = detail.taskActions.find((row) =>
          row.actions.some((a) => a.name === 'approve'),
        )!;
        const run = detail.runs.find((row) => row.run.id === offer.task.runId)!;
        await service.action(
          id,
          {
            target: { taskId: offer.task.id },
            action: 'approve',
            requestId: randomUUID(),
            contentHash: run.run.contentHash,
            ...(detail.record.status === 'hr'
              ? { input: { data: { lastWorkingDay: day } } }
              : {}),
          },
          initiator.userId,
        );
      }
      expect((await service.detail(id, initiator.userId)).record.status).toBe(
        'handover',
      );
      const requester = await h.pageFor(await initiator.session()),
        confirmer = await h.pageFor(await reviewer.session());
      const errors: string[] = [];
      for (const page of [requester, confirmer]) {
        page.setDefaultTimeout(25000);
        page.on('pageerror', (e) => errors.push(e.message));
      }
      const detailUrl = `${h.origin}${h.basePath}/departureRequests/${id}`;
      await requester.goto(detailUrl, { waitUntil: 'domcontentloaded' });
      const requestButton = requester.getByRole('button', {
        name: 'Request departure cancellation',
        exact: true,
      });
      await browserExpect(requestButton).toBeEnabled();
      await requestButton.click();
      const form = requester.getByRole('dialog').last();
      await form
        .locator('textarea')
        .fill('Employment retained after HR discussion');
      await form
        .getByRole('button', {
          name: 'Request departure cancellation',
          exact: true,
        })
        .click();
      const requestResponse = requester.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().endsWith(`/departureRequests/${id}/transitions`),
      );
      const confirmation = requester.getByRole('alertdialog').last();
      await browserExpect(confirmation).toBeVisible({ timeout: 20000 });
      await confirmation
        .getByRole('button', {
          name: 'Request departure cancellation',
          exact: true,
        })
        .click();
      expect((await requestResponse).status()).toBe(200);
      await browserExpect(
        requester
          .getByRole('dialog')
          .first()
          .getByText('Cancellation confirmation', { exact: true })
          .first(),
      ).toBeVisible({ timeout: 20000 });
      await requester.screenshot({
        path: path.join(h.screenshotsDir, 'request-awaiting-other-hr.png'),
      });
      await confirmer.goto(detailUrl, { waitUntil: 'domcontentloaded' });
      const approve = confirmer.getByRole('button', {
        name: 'Approve',
        exact: true,
      });
      await browserExpect(approve).toBeVisible({ timeout: 20000 });
      await approve.click();
      await browserExpect(confirmer.locator('#departure-action')).toBeVisible({
        timeout: 20000,
      });
      const approveForm = confirmer.getByRole('dialog').last();
      await approveForm
        .getByRole('button', { name: 'Approve', exact: true })
        .click();
      const approveConfirmation = confirmer.getByRole('alertdialog').last();
      await browserExpect(approveConfirmation).toBeVisible({ timeout: 20000 });
      await approveConfirmation
        .getByRole('button', { name: 'Approve', exact: true })
        .click();
      await browserExpect(
        confirmer
          .getByRole('dialog')
          .first()
          .getByText('Cancelled', { exact: true })
          .first(),
      ).toBeVisible({ timeout: 20000 });
      expect(
        await confirmer.getByRole('dialog').first().innerText(),
      ).not.toContain('departureRequests.workStates.cancelled');
      expect(
        await confirmer.getByRole('dialog').first().innerText(),
      ).not.toContain('departureRequests.executionStates.cancelled');
      await confirmer.screenshot({
        path: path.join(h.screenshotsDir, 'confirmed-cancellation.png'),
      });
      expect(
        (await service.detail(id, initiator.userId)).execution?.status,
      ).toBe('cancelled');
      expect(errors).toEqual([]);
      const out = path.dirname(h.screenshotsDir);
      await mkdir(out, { recursive: true });
      await writeFile(
        path.join(out, 'result.json'),
        JSON.stringify(
          {
            passed: true,
            scope:
              'ordinary browser HR cancellation request and distinct HR SDK confirmation',
            at: new Date().toISOString(),
            pageErrors: errors,
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  180000,
);

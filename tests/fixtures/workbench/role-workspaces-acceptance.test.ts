import { prepareWorkspaceQueues } from './role-workspaces-scenarios.js';
// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'real responsibilities render authorized role workspaces at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'role-workspaces',
      apiPort: 14163,
      vitePort: 15163,
    });
    try {
      const ordinary = await createEmployee(h.testApp, 'Workspace ordinary');
      const operator = await createEmployee(h.testApp, 'Workspace operator');
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      for (const role of ['hr', 'finance', 'cashier', 'admin', 'purchasing'])
        await org.addDutyRoleMember(role, operator.userId, {
          actorId: operator.userId,
        });
      await org.createDepartment(
        { title: 'Workspace managed', managerId: operator.userId },
        { actorId: operator.userId },
      );
      const queues = await prepareWorkspaceQueues(h, operator.userId);
      const base = `${h.origin}${h.basePath}`;
      const screenshots: string[] = [];
      for (const [label, user] of [
        ['ordinary', ordinary],
        ['operator', operator],
      ] as const) {
        const page = await h.pageFor(await user.session(), {
          viewport: { width: 375, height: 812 },
          locale: 'en-US',
        });
        page.setDefaultTimeout(30000);
        const response = page.waitForResponse((r) =>
          new URL(r.url()).pathname.endsWith('/api/workbench/roleContext'),
        );
        await page.goto(`${base}/`);
        expect((await response).status()).toBe(200);
        const filters = page.getByRole('group', {
          name: 'Filter by responsibility',
        });
        if (label === 'ordinary') await expect(filters).toHaveCount(0);
        else {
          await expect(filters).toBeVisible();
          for (const title of [
            'Team',
            'HR',
            'Finance',
            'Administration',
            'Procurement',
          ])
            await expect(
              filters.getByRole('button', { name: title, exact: true }),
            ).toBeVisible();
          await expect(
            page.getByRole('region', { name: 'My workspaces' }),
          ).toHaveCount(0);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        const shot = path.join(h.screenshotsDir, `${label}-375.png`);
        await page.screenshot({ path: shot, fullPage: true });
        screenshots.push(shot);
        await page.close();
      }
      const handlerPage = await h.pageFor(await operator.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      handlerPage.setDefaultTimeout(30000);
      for (const queue of queues) {
        await handlerPage.goto(`${base}/`);
        const region = handlerPage
          .getByRole('heading', { name: 'Needs my attention', exact: true })
          .locator('xpath=ancestor::*[@data-slot="card"]');
        const link = region.locator(`a[href*="/${queue.id}"]`).first();
        await expect(link).toBeVisible();
        await link.click();
        const verb = queue.action.startsWith('Claim') ? 'claim' : 'approve';
        await handlerPage
          .getByRole('button', { name: queue.action, exact: true })
          .first()
          .click();
        const comment = handlerPage.locator('#approval-comment');
        await expect(comment).toBeVisible();
        await comment.fill('Verified specialist handling');
        const response = handlerPage.waitForResponse(
          (r) =>
            r.url().includes(`/${queue.endpoint}/${queue.id}/action`) &&
            r.request().method() === 'POST',
        );
        await handlerPage
          .getByRole('button', { name: queue.action, exact: true })
          .last()
          .click();
        expect((await response).status()).toBe(200);
        const detail = await queue.service.detail(queue.id, operator.userId);
        expect(
          detail.taskActions.some((row) =>
            row.actions.some((action) => action.name === verb),
          ),
        ).toBe(false);
        if (
          ['supplyRequests', 'purchaseRequests', 'loanRequests'].includes(
            queue.endpoint,
          )
        ) {
          await handlerPage.goto(handlerPage.url().split('/action/')[0]);
          const completeLabel =
            queue.endpoint === 'supplyRequests'
              ? 'Confirm issuance'
              : queue.endpoint === 'loanRequests'
                ? 'Complete payment'
                : 'Complete pricing';
          await handlerPage
            .getByRole('button', { name: completeLabel, exact: true })
            .first()
            .click();
          if (queue.endpoint === 'purchaseRequests') {
            await handlerPage.locator('#purchase-actual').fill('100.00');
            await handlerPage.locator('#purchase-selected-vendor').click();
            await handlerPage
              .getByRole('option', { name: /Workspace supplier 1/ })
              .click();
            for (let i = 0; i < 3; i++) {
              await handlerPage
                .getByRole('button', { name: 'Add vendor quote', exact: true })
                .click();
              await handlerPage.locator(`#purchase-quote-vendor-${i}`).click();
              await handlerPage
                .getByRole('option', {
                  name: new RegExp(`Workspace supplier ${i + 1}`),
                })
                .click();
              const upload = handlerPage.waitForResponse((r) =>
                r.url().includes('purchaseAttachments/uploadOne'),
              );
              await handlerPage
                .locator(`#purchase-quote-file-${i}`)
                .setInputFiles({
                  name: `quote-${i}.png`,
                  mimeType: 'image/png',
                  buffer: Buffer.from(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT6sAAAAASUVORK5CYII=',
                    'base64',
                  ),
                });
              expect((await upload).status()).toBe(201);
            }
            await handlerPage
              .locator('#purchase-pricing-comment')
              .fill(
                'Compared three supplier quotations and selected the reviewed price',
              );
            await handlerPage
              .getByRole('button', { name: 'Confirm', exact: true })
              .last()
              .click();
          } else {
            await expect(
              handlerPage.locator('#approval-comment'),
            ).toBeVisible();
            await handlerPage
              .locator('#approval-comment')
              .fill('Completed specialist fulfillment');
            if (queue.endpoint === 'loanRequests')
              await handlerPage
                .locator('#loan-payment-voucher')
                .fill('SYNTHETIC-PAYMENT-001');
          }
          const complete = handlerPage.waitForResponse(
            (r) =>
              r.url().includes(`/${queue.endpoint}/${queue.id}/action`) &&
              r.request().method() === 'POST',
          );
          await handlerPage
            .getByRole('button', {
              name:
                queue.endpoint === 'purchaseRequests'
                  ? 'Confirm'
                  : completeLabel,
              exact: true,
            })
            .last()
            .click();
          if (queue.endpoint === 'loanRequests') {
            const confirmation = handlerPage.getByRole('alertdialog');
            await expect(confirmation).toBeVisible();
            await confirmation
              .getByRole('button', { name: completeLabel, exact: true })
              .click();
          }
          expect((await complete).status()).toBe(200);
          const finished = await queue.service.detail(
            queue.id,
            operator.userId,
          );
          if (queue.endpoint === 'supplyRequests')
            expect(finished.record.status).toBe('issued');
          if (queue.endpoint === 'loanRequests')
            expect(finished.record.status).toBe('paid');
          if (queue.endpoint === 'purchaseRequests')
            expect(finished.record.status).toBe('finance');
        }
        const loaded = handlerPage.waitForResponse(
          (r) =>
            new URL(r.url()).pathname.endsWith(
              `/${queue.endpoint}/${queue.id}`,
            ) && r.request().method() === 'GET',
        );
        await handlerPage.goto(handlerPage.url().split('/action/')[0]);
        await loaded;
        await expect(
          handlerPage
            .getByRole('button', { name: 'Print / Save PDF', exact: true })
            .first(),
        ).toBeVisible();
        const shot = path.join(
          h.screenshotsDir,
          `${queue.endpoint}-handled-375.png`,
        );
        if (queue.endpoint === 'purchaseRequests') {
          await expect(
            handlerPage
              .getByText('Workspace supplier 1', { exact: true })
              .first(),
          ).toBeVisible();
        }
        await handlerPage.screenshot({ path: shot, fullPage: true });
        screenshots.push(shot);
      }
      await handlerPage.close();
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks: [
              'ordinary employee has no responsibility filters',
              'five effective responsibilities produce filters on a single personal pending list',
              'real roleContext endpoint succeeds',
              '375px no horizontal overflow',
              'HR leave approval and finance expense-plan approval through real workbench pending links',
              'administrative supplies claimed and issued; original service confirms issued',
              'procurement claimed and priced with three uploaded quotations; original service confirms finance handoff',
              'cashier claimed and completed loan payment; original service confirms paid',
            ],
            screenshots,
            scope:
              'isolated PostgreSQL synthetic users; no production acceptance',
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);

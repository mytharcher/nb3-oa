// @vitest-environment node
import { it, expect } from 'vitest';
import { expect as browserExpect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import en from '../../../client/locales/modules/it-repairs.en-US.js';
import zh from '../../../client/locales/modules/it-repairs.zh-CN.js';
it.runIf(process.env.OA_IT_REPAIR_BROWSER === '1')(
  'A E1 L complete handling and acceptance return in both languages at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'it-repairs-handling',
      apiPort: 14286,
      vitePort: 15286,
      config: { oaApprovals: { inbox: 'demo-inbox' } },
    });
    try {
      const f = await prepareRepairs(h.testApp),
        e1 = await createEmployee(h.testApp, 'Browser E1'),
        authz = h.testApp.application.container.resolve(authorizationToken);
      for (const [person, role] of [
        [f.a, 'employee'],
        [f.leader, 'leader'],
        [e1, 'engineer'],
      ] as const)
        await authz.permissionSets.assign({
          permissionSet: `oa-it-repairs-handling-${role}`,
          subject: { type: 'user', id: person.userId },
        });
      const a = await f.a.session(),
        l = await f.leader.session(),
        e = await e1.session(),
        s = await f.admin.session();
      expect(
        (
          await s.fetch(
            '/itRepairs/groups/browser',
            write('POST', {
              requestKey: randomUUID(),
              expectedVersion: 0,
              title: 'Browser IT',
              leaderIds: [f.leader.userId],
              engineerIds: [e1.userId],
              categories: ['device'],
              active: true,
            }),
          )
        ).status,
      ).toBe(200);
      for (const locale of ['en-US', 'zh-CN']) {
        const copy = locale === 'zh-CN' ? zh.itRepairs : en.itRepairs;
        for (const session of [a, l, e])
          await session.fetch('/i18n/locale', write('PUT', { locale }));
        const pages = await Promise.all(
            [a, l, e].map((session) =>
              h.pageFor(session, {
                locale,
                viewport: { width: 375, height: 812 },
              }),
            ),
          ),
          [ap, lp, ep] = pages;
        const errors: string[] = [];
        for (const p of pages)
          p.on('pageerror', (err) => errors.push(err.message));
        const saved = (
          await (
            await a.fetch(
              '/itRepairs/save',
              write('POST', {
                requestKey: randomUUID(),
                draft: {
                  title: `Browser handling ${locale}`,
                  description: 'Synthetic printer failure',
                  category: 'device',
                  impact: 'partial',
                  location: 'Test office',
                  contact: '',
                  occurredAt: null,
                  assetId: null,
                },
              }),
            )
          ).json()
        ).data;
        const submitted = await a.fetch(
          `/itRepairs/${saved.id}/submit`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: saved.version,
          }),
        );
        expect(submitted.status).toBe(200);
        const submittedRow = (await submitted.json()).data;
        await lp.goto(`${h.origin}${h.basePath}/taskCenter?source=oa.itRepair`);
        await lp
          .getByRole('button', { name: submittedRow.number, exact: true })
          .click();
        await browserExpect(lp).toHaveURL(
          new RegExp(`taskCenter/itRepair/${saved.id}`),
        );
        const detail = `${h.origin}${h.basePath}/it-repairs/${saved.id}`;
        const act = async (
          p: Page,
          action: keyof typeof copy.actions,
          values: Record<string, string> = {},
        ) => {
          await p.goto(`${detail}?repairAction=${action}`);
          await browserExpect(p.locator('#repair-action-form')).toBeVisible({
            timeout: 60000,
          });
          for (const [name, value] of Object.entries(values)) {
            const field = p.locator(`#handling-${name}`);
            if (name === 'followUpAt') {
              await field.click();
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              await p
                .locator(
                  `[data-day="${tomorrow.toLocaleDateString(locale)}"]:visible`,
                )
                .last()
                .click();
              await p
                .getByRole('textbox', { name: copy.time, exact: true })
                .fill('18:00');
            } else if (
              [
                'priority',
                'party',
                'resultType',
                'rating',
                'approve',
                'pauseRequested',
              ].includes(name)
            ) {
              await field.click();
              await p.getByRole('option', { name: value, exact: true }).click();
            } else await field.fill(value);
          }
          if (action === 'triage')
            await p.screenshot({
              path: `${h.screenshotsDir}/${locale}-leader-triage.png`,
              fullPage: true,
            });
          if (action === 'resolve') {
            await p.locator('#handling-completion').fill('');
            await p
              .getByRole('button', { name: copy.actions.resolve, exact: true })
              .click();
            await browserExpect(
              p.locator('#handling-completion'),
            ).toBeFocused();
            await browserExpect(p.locator('#handling-cause')).toHaveValue(
              values.cause!,
            );
            await p.locator('#handling-completion').fill(values.completion!);
          }
          await p
            .getByRole('button', { name: copy.actions[action], exact: true })
            .click();
          if (action === 'cancel')
            await p
              .getByRole('alertdialog')
              .getByRole('button', { name: copy.actions.cancel, exact: true })
              .click();
          await browserExpect(p).not.toHaveURL(/repairAction=/, {
            timeout: 20000,
          });
          expect(
            await p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        };
        await act(lp, 'requestSupplement', { reason: 'Add fault details' });
        await act(ap, 'supplement', { message: 'Supplemental user context' });
        await act(lp, 'triage', {
          priority: 'P3',
          advice: 'Restart and retest',
        });
        await act(ep, 'claim');
        await act(ep, 'start');
        await act(ep, 'internal', { message: 'PRIVATE synthetic diagnosis' });
        await ep.goto(detail);
        await ep
          .getByRole('combobox', { name: copy.attachmentVisibility })
          .click();
        await ep
          .getByRole('option', { name: copy.internalOnly, exact: true })
          .click();
        const uploaded = ep.waitForResponse(
          (r) => r.url().endsWith('/upload') && r.request().method() === 'POST',
        );
        await ep.locator('input[type=file]').setInputFiles({
          name: 'internal-browser.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('PRIVATE SYNTHETIC FILE'),
        });
        expect((await uploaded).status()).toBe(200);
        await ep.goto(detail);
        await browserExpect(
          ep.getByText('internal-browser.txt', { exact: true }).first(),
        ).toBeVisible();
        await ep
          .getByText('internal-browser.txt', { exact: true })
          .first()
          .evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await ep.screenshot({
          path: `${h.screenshotsDir}/${locale}-engineer-internal.png`,
          fullPage: true,
        });
        await ap.goto(detail);
        await browserExpect(
          ap.getByText('internal-browser.txt', { exact: true }),
        ).toHaveCount(0);
        await browserExpect(
          ap.getByText('PRIVATE synthetic diagnosis', { exact: true }),
        ).toHaveCount(0);
        await act(ep, 'wait', {
          reason: 'Need user confirmation',
          party: copy.handlingOptions.employee,
          pauseRequested: copy.handlingOptions.true,
          followUpAt: '',
        }).catch(async (error) => {
          throw error;
        });
        await browserExpect(
          ep.getByText(copy.pausePending, { exact: true }),
        ).toBeVisible();
        await act(lp, 'approvePause', {
          reason: 'Employee unavailable, approved now',
        });
        await ep.goto(detail);
        await browserExpect(
          ep.getByText(copy.pauseApproved, { exact: true }),
        ).toBeVisible();
        // Resume preserves the elapsed repair clock.
        await act(ep, 'resume', { reason: 'User available' });
        await act(ap, 'cancel', { reason: 'Request cancellation review' });
        await browserExpect(
          ap.getByText(copy.cancelPending, { exact: true }),
        ).toBeVisible();
        await act(lp, 'reviewCancel', {
          approve: copy.handlingOptions.false,
          reason: 'Continue agreed repair',
        });
        const result = {
          cause: 'Synthetic cause',
          solution: 'Synthetic repair',
          completion: 'Verified recovery',
          resultType: copy.handlingOptions.restored,
        };
        await act(ep, 'resolve', result);
        await ap.goto(detail);
        await browserExpect(
          ap.getByText(copy.states.acceptance, { exact: true }).last(),
        ).toBeVisible();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-acceptance.png`,
          fullPage: true,
        });
        await act(ap, 'return', { reason: 'Failure reproduced' });
        await act(ep, 'resolve', result);
        await act(ap, 'accept', { rating: '4', evaluation: 'Restored' });
        await ap.goto(detail);
        await browserExpect(
          ap.getByText(copy.states.closed, { exact: true }).last(),
        ).toBeVisible();
        await ap.screenshot({
          path: `${h.screenshotsDir}/${locale}-closed.png`,
          fullPage: true,
        });
        expect(errors).toEqual([]);
        for (const p of pages) await p.context().close();
      }
    } finally {
      await h.close();
    }
  },
  240000,
);

// @vitest-environment node
import { externalIntegrationsEnabled } from '../../../shared/external-integrations.js';
import { it, vi } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  electronicSealScenario,
  signedPdf,
} from '../../logic/electronic-signatures/scenarios.js';
import {
  digest,
  type SignatureEnvelope,
} from '../../../server/providers/electronic-signatures/gateway.js';
it.runIf(
  process.env.OA_BROWSER_ACCEPTANCE === '1' && externalIntegrationsEnabled,
)(
  '375px electronic owner channel and actual keeper signing archive in English and Chinese',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'electronic-signatures',
      apiPort: 14157,
      vitePort: 15157,
      config: {
        electronicSignatures: {
          enabled: true,
          instanceId: 'browser-test',
          baseUrl: 'https://sign.example.test/',
          token: 'synthetic',
        },
      },
    });
    let spy: ReturnType<typeof vi.spyOn> | undefined;
    try {
      const s = await electronicSealScenario(h.testApp),
        base = `${h.origin}${h.basePath}`;
      const owner = await h.pageFor(await s.owner.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await owner.goto(`${base}/seal-requests/new`);
      await expect(owner.locator('#seal-execution-mode')).toBeVisible({
        timeout: 30000,
      });
      await owner.locator('#seal-execution-mode').click();
      await owner
        .getByRole('option', { name: 'Electronic signature', exact: true })
        .click();
      await expect(owner.locator('#seal-copies')).toHaveCount(0);
      await owner.locator('#seal-execution-mode').scrollIntoViewIfNeeded();
      await owner.screenshot({
        path: path.join(h.screenshotsDir, 'channel-form-en-375.png'),
        fullPage: true,
      });
      const actualFetch = globalThis.fetch;
      let envelope: SignatureEnvelope;
      let state = 'accepted';
      spy = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input, init) => {
          if (!String(input).startsWith('https://sign.example.test/'))
            return actualFetch(input, init);
          if (String(input).endsWith('/document'))
            return new Response(signedPdf, {
              headers: { 'content-type': 'application/pdf' },
            });
          if (init?.method === 'POST')
            envelope = JSON.parse(String(init.body)) as SignatureEnvelope;
          return Response.json({
            idempotencyKey: envelope.idempotencyKey,
            payloadHash: envelope.payloadHash,
            state,
            externalId: 'browser-signature',
            ...(state === 'signed'
              ? {
                  signedAt: new Date(Date.now() - 1000).toISOString(),
                  signedDocumentSha256: digest(signedPdf),
                  verification: 'verified',
                }
              : { signingPath: '/sign/browser' }),
          });
        });
      const page = await h.pageFor(await s.keeper.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await page.goto(`${base}/seal-requests/${s.id}`);
      const section = page.getByRole('region', {
        name: 'Electronic signing',
        exact: true,
      });
      await expect(
        section.getByRole('button', { name: 'Send for signing', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await section
        .getByRole('button', { name: 'Send for signing', exact: true })
        .click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Send for signing', exact: true })
        .click();
      await expect(
        section.getByText('Accepted by signing service', { exact: true }),
      )
        .toBeVisible({ timeout: 30000 })
        .catch(async (error) => {
          await page.screenshot({
            path: path.join(h.screenshotsDir, 'signing-failure.png'),
            fullPage: true,
          });
          await writeFile(
            path.join(h.screenshotsDir, 'signing-failure.txt'),
            await page.locator('body').innerText(),
          );
          throw error;
        });
      await section.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'signing-en-375.png'),
        fullPage: true,
      });
      state = 'signed';
      await section
        .getByRole('button', { name: 'Check status / recover', exact: true })
        .click();
      await expect(
        section.getByText('Signed document archived', { exact: true }),
      ).toBeVisible();
      await expect(
        section.getByRole('button', {
          name: 'Download signed PDF',
          exact: true,
        }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await section.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'archived-en-375.png'),
        fullPage: true,
      });
      const zh = await h.pageFor(await s.keeper.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'zh-CN',
        colorScheme: 'dark',
      });
      await zh.goto(`${base}/seal-requests/${s.id}`);
      const zhSection = zh.getByRole('region', {
        name: '电子签章',
        exact: true,
      });
      await expect(
        zhSection.getByText('签署文件已归档', { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        zhSection.getByText(
          '签章服务已确认完成，签后PDF经核验已归档至本单据。',
          { exact: true },
        ),
      ).toBeVisible();
      await zhSection.scrollIntoViewIfNeeded();
      await zh.screenshot({
        path: path.join(h.screenshotsDir, 'archived-zh-375.png'),
        fullPage: true,
      });
      const denied = await h.pageFor(await s.stranger.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      await denied.goto(`${base}/seal-requests/${s.id}`);
      await expect(
        denied.getByText('Signed document archived', { exact: true }),
      ).toHaveCount(0);
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            checks: [
              'electronic channel declared before approval hides physical copy inputs',
              'real authorized keeper sends approved PDF from source drawer',
              'accepted remains unfinished',
              'verified signed PDF archives and closes actual task',
              'English 375px and Chinese dark archive visible',
              'no horizontal page overflow',
            ],
          },
          null,
          2,
        ),
      );
    } finally {
      spy?.mockRestore();
      await h.close();
    }
  },
  120000,
);

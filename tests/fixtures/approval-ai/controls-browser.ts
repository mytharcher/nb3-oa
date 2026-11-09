import { expect, type Page } from '@playwright/test';
import path from 'node:path';

/** Standard block controls over a real authorized report; no legacy conversation/settings APIs. */
export async function checkApprovalAiControls(
  page: Page,
  h: { origin: string; basePath: string; screenshotsDir: string },
  recordId: string,
) {
  await page.goto(
    h.origin + h.basePath + '/contractRequests/contract/' + recordId,
  );
  const panel = page.getByRole('region', { name: 'AI approval assistance' });
  await expect(panel).toBeVisible();
  await expect(
    panel.getByText('Verify the supplied contract terms before approving.'),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'Ready', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Generate again', exact: true }),
  ).toBeEnabled();
  await page.keyboard.press('Escape');
  for (const mode of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: mode as 'light' | 'dark' });
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await panel.scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(
          h.screenshotsDir,
          `native-controls-${mode}-${width}.png`,
        ),
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
  let failedRead = false;
  await page.route('**/api/approvalAi/reviews?**', async (route) => {
    if (failedRead)
      await route.fulfill({
        status: 403,
        json: { error: { message: 'Synthetic access revocation' } },
      });
    else await route.continue();
  });
  failedRead = true;
  await page.reload();
  await expect(
    page.getByText('Verify the supplied contract terms before approving.'),
  ).toHaveCount(0);
}

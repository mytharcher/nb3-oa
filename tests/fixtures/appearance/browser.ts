import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';

const host = await startIsolatedBrowserApp({
  name: 'appearance',
  apiPort: 13581,
  vitePort: 13582,
});
try {
  const user = await createEmployee(host.testApp, 'Appearance tester');
  const session = await user.session();
  const page = await host.pageFor(session);
  page.setDefaultTimeout(20_000);
  const select = async (p: Page, name: string) => {
    const radio = p.getByRole('radio', { name, exact: true });
    await radio.locator('..').click();
    await expect(radio).toBeChecked();
  };
  const open = async (p: Page) => {
    const account = p.getByRole('button', { name: 'Open account menu' });
    await account.focus();
    await p.keyboard.press('Enter');
    await p.getByRole('menuitem', { name: 'Appearance', exact: true }).click();
    await expect(p.getByRole('dialog', { name: 'Appearance' })).toBeVisible();
  };
  await page.goto(`${host.origin}${host.basePath}/`);
  await expect(
    page.getByRole('button', { name: 'Open account menu' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Appearance', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Open account menu' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('menuitem', { name: 'Appearance', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'desktop-account-menu.png'),
  });
  const entry = page.getByRole('menuitem', { name: 'Appearance', exact: true });
  await entry.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Appearance' });
  await expect(panel).toBeVisible();
  await select(page, 'Dark');
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await select(page, 'Spacious');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'default');
  await expect(panel).toBeVisible();
  await page.screenshot({
    path: path.join(host.screenshotsDir, 'desktop-appearance-dark.png'),
  });
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'default');
  await open(page);
  await expect(
    page.getByRole('radio', { name: 'Dark', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('radio', { name: 'Spacious', exact: true }),
  ).toBeChecked();
  await select(page, 'Light');
  await expect(page.locator('html')).toHaveClass(/light/u);
  await select(page, 'Compact');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'compact');
  await select(page, 'System');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/light/u);
  await page.reload();
  await open(page);
  await expect(
    page.getByRole('radio', { name: 'System', exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole('radio', { name: 'Compact', exact: true }),
  ).toBeChecked();
  await page.getByRole('radio', { name: 'Compact', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('radio', { name: 'Spacious', exact: true }),
  ).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(entry).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open account menu' }),
  ).toBeFocused();
  console.log(
    'PASS desktop: menu, modes, presets, persistence, media updates and keyboard focus',
  );

  const mobile = await host.pageFor(session, {
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(`${host.origin}${host.basePath}/`);
  await mobile.getByRole('button', { name: 'Open account menu' }).tap();
  await mobile.getByRole('menuitem', { name: 'Appearance', exact: true }).tap();
  const mobilePanel = mobile.getByRole('dialog', { name: 'Appearance' });
  await expect(mobilePanel).toBeVisible();
  await select(mobile, 'Dark');
  await select(mobile, 'Spacious');
  const bounds = await mobilePanel.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(667);
  await mobile.screenshot({
    path: path.join(host.screenshotsDir, 'mobile-appearance.png'),
  });
  await mobile.reload();
  await expect(mobile.locator('html')).toHaveClass(/dark/u);
  await expect(mobile.locator('html')).toHaveAttribute('data-theme', 'default');
  await mobile.setViewportSize({ width: 667, height: 375 });
  await open(mobile);
  await select(mobile, 'Compact');
  const landscape = await mobilePanel.boundingBox();
  expect(landscape!.y).toBeGreaterThanOrEqual(0);
  expect(landscape!.y + landscape!.height).toBeLessThanOrEqual(375);
  console.log(
    'PASS mobile: touch entry, options, geometry, short viewport scrolling and persistence',
  );

  await page.getByRole('button', { name: 'Open account menu' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Language' }).hover();
  await expect(
    page.getByRole('menuitemradio', { name: 'English' }),
  ).toBeVisible();
  await page
    .getByRole('menuitemradio', { name: '中文（中国）', exact: true })
    .click();
  await page.getByRole('button', { name: '打开账户菜单' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: '外观', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '外观' })).toBeVisible();
  await expect(
    page.getByRole('radio', { name: '浅色', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('menuitem', { name: /语言/u }).hover();
  await page.getByRole('menuitemradio', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Open account menu' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Personal archive' }).click();
  await expect(page).toHaveURL(/personal-archive/u);
  await expect(
    page.getByText('Appearance tester', { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open account menu' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/login/u);
  console.log(
    'PASS other menu functions: language submenu, personal archive and sign out',
  );
  console.log(`Screenshots: ${host.screenshotsDir}`);
} finally {
  await host.close();
}

import { expect, test } from '@playwright/test';

const base = process.env.DEMO_TEST_BASE_URL;
test.skip(
  !base,
  'Set DEMO_TEST_BASE_URL to the running local application, including its base path.',
);

test('header switches accounts, reloads permissions and describes persistent changes', async ({
  page,
  context,
}) => {
  const root = base!.replace(/\/$/u, '');
  await page.addInitScript(() => {
    if (!localStorage.getItem('nocobase.locale:/main/'))
      localStorage.setItem('nocobase.locale:/main/', 'zh-CN');
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${root}/`);
  const menu = page.getByRole('button', { name: /演示模式.*切换账户/u });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(
    page
      .getByRole('menuitemradio')
      .filter({ hasText: '系统管理员' })
      .first()
      .locator('[data-slot="badge"]')
      .first(),
  ).toBeVisible();
  await page.screenshot({ path: '/tmp/oa-demo-role-tags-desktop.png' });
  await expect(
    page.getByText('修改会保存。切换账号以体验不同角色的权限。'),
  ).toBeVisible();
  const response = await context.request.get(`${root}/api/demoMode/accounts`);
  const { data: accounts } = (await response.json()) as {
    data: { username: string; name: string; current: boolean }[];
  };
  const target = accounts.find((account) => !account.current);
  expect(target).toBeDefined();
  const switched = page.waitForResponse((r) =>
    r
      .url()
      .endsWith(
        `/demoMode/accounts/${encodeURIComponent(target!.username)}/signIn`,
      ),
  );
  await page
    .getByRole('menuitemradio')
    .filter({ hasText: target!.name })
    .first()
    .click();
  expect((await switched).status()).toBe(200);
  await expect
    .poll(async () => {
      const response = await context.request.get(
        `${root}/api/demoMode/accounts`,
      );
      const { data } = await response.json();
      return data.find((account: { current: boolean }) => account.current)
        ?.username;
    })
    .toBe(target!.username);
  await expect(menu).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator('html')
    .evaluate((element) => element.classList.add('dark'));
  await menu.click();
  await expect(page.getByRole('menuitemradio').first()).toBeVisible();
  await expect(
    page
      .getByRole('menuitemradio')
      .filter({ hasText: '系统管理员' })
      .first()
      .locator('[data-slot="badge"]')
      .first(),
  ).toBeVisible();
  await page.screenshot({ path: '/tmp/oa-demo-role-tags-mobile.png' });
  await page.evaluate(() =>
    localStorage.setItem('nocobase.locale:/main/', 'en-US'),
  );
  await page.reload();
  await page
    .getByRole('button', { name: /Demo mode.*Switch account/u })
    .click();
  await expect(
    page
      .getByRole('menuitemradio')
      .filter({ hasText: 'System administrator' })
      .first()
      .locator('[data-slot="badge"]')
      .first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

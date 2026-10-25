import console from 'node:console';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
/* global document, innerWidth */
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/system-navigation-groups');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
await build({
  entryPoints: [
    path.join(root, 'tests/fixtures/system-navigation/preview.tsx'),
  ],
  bundle: true,
  format: 'esm',
  outfile: path.join(output, 'preview.js'),
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'synthetic-api',
      setup(builder) {
        builder.onResolve(
          {
            filter: /^@nocobase\/app-plugin-authorization\/client$/,
          },
          (args) => ({ path: args.path, namespace: 'synthetic-api' }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'synthetic-api' }, () => ({
          contents:
            'export function useAuthorizationRevision(){return 0}; export function useAuthorizationClient(){return {can:async()=>true}}',
          loader: 'js',
        }));
      },
    },
  ],
});
const stylesheet = path.join(root, 'client/styles.css');
const css = await postcss([tailwind()]).process(
  await readFile(stylesheet, 'utf8'),
  { from: stylesheet },
);
await writeFile(path.join(output, 'preview.css'), css.css);
await writeFile(
  path.join(output, 'standalone.html'),
  '<!doctype html><html lang="en" data-theme="default"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="preview.css"></head><body><div id="root"></div><script type="module" src="preview.js"></script></body></html>',
);
const server = createServer(async (req, res) => {
  const file = (req.url ?? '/').split('?')[0].slice(1) || 'standalone.html';
  res.setHeader(
    'Content-Type',
    file.endsWith('.js')
      ? 'text/javascript'
      : file.endsWith('.css')
        ? 'text/css'
        : 'text/html',
  );
  try {
    res.end(await readFile(path.join(output, file)));
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const evidence = {
  kind: 'actual sidebar components with synthetic route tree; no real-role acceptance',
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['zh-CN', 'en-US'])
    for (const theme of ['default', 'compact'])
      for (const dark of [false, true])
        for (const mode of ['expanded', 'collapsed', 'mobile']) {
          await page.setViewportSize({
            width: mode === 'mobile' ? 375 : 1365,
            height: 640,
          });
          await page.goto(
            `${origin}/?language=${language}${mode === 'collapsed' ? '&collapsed' : ''}`,
          );
          await page.evaluate(
            ({ dark, theme }) => {
              document.documentElement.classList.toggle('dark', dark);
              document.documentElement.dataset.theme = theme;
            },
            { dark, theme },
          );
          if (mode === 'mobile')
            await page
              .getByRole('button', { name: /Open navigation|打开导航/ })
              .click();
          if (mode === 'collapsed') {
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await expect(page.getByRole('dialog')).toBeVisible();
          }
          // Base UI starts the sheet transition on the next frame; let it settle before capture.
          if (mode === 'mobile') await page.waitForTimeout(400);
          await expect(page.getByRole('group')).toHaveCount(3);
          await expect(
            page
              .getByRole('group', {
                name:
                  language === 'zh-CN'
                    ? '用户与组织'
                    : 'Users and organization',
              })
              .getByRole('link', {
                name: language === 'zh-CN' ? '权限管理' : 'Access control',
                exact: true,
              }),
          ).toBeVisible();
          await expect(
            page.getByRole('link', {
              name: language === 'zh-CN' ? '用户账号' : 'User accounts',
              exact: true,
            }),
          ).toBeVisible();
          const links = page.locator('[role="group"] a');
          await expect(links).toHaveCount(12);
          // Capture the title and first group before checking the scroll boundary.
          const topName = `${language}-${theme}-${dark ? 'dark' : 'light'}-${mode}-top.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', topName),
            fullPage: true,
          });
          evidence.checks.push(topName);
          const last = links.last();
          await last.scrollIntoViewIfNeeded();
          await expect(last).toBeInViewport();
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          );
          expect(overflow).toBe(false);
          const name = `${language}-${theme}-${dark ? 'dark' : 'light'}-${mode}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', name),
            fullPage: true,
          });
          if (mode === 'collapsed') {
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).toHaveCount(0);
            await expect(
              page.getByRole('button', {
                name:
                  language === 'zh-CN' ? '系统管理' : 'System administration',
              }),
            ).toBeFocused();
          } else if (mode === 'mobile') {
            await last.click();
            await expect(page.getByRole('dialog')).toHaveCount(0);
          }
          evidence.checks.push(name);
        }
  expect(evidence.errors).toEqual([]);
} finally {
  await browser.close();
  server.close();
  await writeFile(
    path.join(output, 'evidence.json'),
    JSON.stringify(evidence, null, 2),
  );
}
console.log(JSON.stringify(evidence));

import console from 'node:console';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
/* global document */
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/menu-attention');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `const scenario=new URLSearchParams(location.search).get('scenario');globalThis.__menuReads=[];const api={async request({path,query}){globalThis.__menuReads.push(path);if(scenario==='error')throw new Error('synthetic');return {data:{pending:scenario==='zero'?0:scenario==='high'?30:query.sourceType==='approval.task'?3:1,completed:0,cancelled:0}}}};export function useApiClient(){return api}`,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'synthetic'}}}}`,
  '@nocobase/app-plugin-authorization/client': `const client={can:async()=>true};export function useAuthorizationRevision(){return 0};export function useAuthorizationClient(){return client};export function useCan(){return {can:true,isPending:false}}`,
  '@nocobase/app-plugin-notification-in-app/client/inbox': `export function useInboxRefresh(){};export function useInboxUnreadCount(){return {data:2}}`,
  theme: `export function ThemeSettings(){return null}`,
  user: `export function UserMenu(){return null}`,
};
await build({
  entryPoints: [
    path.join(root, 'tests/fixtures/personal-attention/menu-preview.tsx'),
  ],
  bundle: true,
  format: 'esm',
  outfile: path.join(output, 'preview.js'),
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'synthetic',
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@nocobase\/(app-client|app-plugin-authentication\/client|app-plugin-authorization\/client|app-plugin-notification-in-app\/client\/inbox)$/,
          },
          (args) => ({ path: args.path, namespace: 'synthetic' }),
        );
        builder.onResolve(
          { filter: /theme\/index\.js$|user-menu\.js$/ },
          (args) => ({
            path: args.path.includes('theme') ? 'theme' : 'user',
            namespace: 'synthetic',
          }),
        );
        builder.onLoad({ filter: /.*/, namespace: 'synthetic' }, (args) => ({
          contents: mocks[args.path],
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
  screenshots: [],
  errors: [],
  kind: 'Actual menu/header components; synthetic task and inbox data; no signed-in role acceptance',
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['zh-CN', 'en-US'])
    for (const dark of [false, true])
      for (const mode of ['expanded', 'collapsed', 'mobile']) {
        await page.setViewportSize({
          width: mode === 'mobile' ? 375 : 1365,
          height: 812,
        });
        await page.goto(
          `${origin}/?language=${language}${mode === 'collapsed' ? '&collapsed' : ''}`,
        );
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          dark,
        );
        await expect(
          page.locator('header a[href="/inbox"],header a[href="/taskCenter"]'),
        ).toHaveCount(0);
        if (mode === 'mobile') {
          await page
            .getByRole('button', { name: /Open navigation|打开导航/ })
            .click();
          await page.waitForTimeout(300);
        }
        const badge = page.getByRole('status', {
          name:
            language === 'zh-CN'
              ? '待办中心，6 项待处理'
              : 'Task center, 6 pending',
        });
        await expect(badge).toBeVisible();
        expect(await badge.textContent()).toBe(mode === 'collapsed' ? '' : '6');
        await expect(
          page.getByRole('link', {
            name: language === 'zh-CN' ? '待办中心' : 'Task center',
            exact: true,
          }),
        ).toHaveAttribute('href', '/taskCenter');
        const name = `${language}-${dark ? 'dark' : 'light'}-${mode}.png`;
        await page.screenshot({
          path: path.join(output, 'screenshots', name),
          fullPage: true,
        });
        evidence.screenshots.push(name);
      }
  for (const scenario of ['zero', 'high', 'error']) {
    await page.setViewportSize({ width: 1365, height: 812 });
    await page.goto(`${origin}/?language=en-US&scenario=${scenario}`);
    if (scenario === 'zero') {
      await expect
        .poll(() => page.evaluate(() => globalThis.__menuReads.length))
        .toBe(4);
      await expect(page.getByRole('status')).toHaveCount(1);
    } else
      await expect(
        page.getByRole('status', {
          name:
            scenario === 'error'
              ? 'Task center, pending count unavailable'
              : 'Task center, 120 pending',
        }),
      ).toHaveText(scenario === 'error' ? '—' : '99+');
    const name = `scenario-${scenario}.png`;
    await page.screenshot({
      path: path.join(output, 'screenshots', name),
      fullPage: true,
    });
    evidence.screenshots.push(name);
  }
  expect(evidence.errors).toEqual([]);
} finally {
  await browser.close();
  server.close();
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
}
console.log(JSON.stringify(evidence));

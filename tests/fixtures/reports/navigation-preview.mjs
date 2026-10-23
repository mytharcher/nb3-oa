import console from 'node:console';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
/* global document, innerWidth */
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/navigation-reports');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `
    export class ApiClientError extends Error {}
    export function useToaster(){return {toast:()=>{}}}
    const api = { async request({path}) {
      if(path==='reports/datasets') return {data:['budget-balances','contract-ledger','headcount-balances','leave-monthly','leave-approval-efficiency','expense-summary']};
      return {data:[],meta:{page:1,pageSize:20,total:0,generatedAt:'2026-10-22T00:00:00Z',filters:{year:2026}}};
    }};
    export function useApiClient(){return api;}
  `,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'synthetic-reviewer'}},refresh:async()=>{}}}`,
  '@nocobase/app-plugin-authorization/client': `export function useAuthorizationRevision(){return 0}`,
};
await build({
  entryPoints: [
    path.join(root, 'tests/fixtures/reports/navigation-preview.tsx'),
  ],
  bundle: true,
  format: 'iife',
  outfile: path.join(output, 'preview.js'),
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'synthetic-api',
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@nocobase\/(app-client|app-plugin-authentication\/client|app-plugin-authorization\/client)$/,
          },
          (args) => ({ path: args.path, namespace: 'synthetic-api' }),
        );
        builder.onLoad(
          { filter: /.*/, namespace: 'synthetic-api' },
          (args) => ({ contents: mocks[args.path], loader: 'js' }),
        );
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
  '<!doctype html><html lang="en" data-theme="default"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="preview.css"></head><body><div id="root"></div><script src="preview.js"></script></body></html>',
);
const browser = await chromium.launch({ headless: true });
const evidence = {
  kind: 'isolated actual report routes with synthetic API; no real-role or database acceptance',
  screenshots: [],
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['en-US', 'zh-CN'])
    for (const dark of [false, true])
      for (const width of [1365, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(
          `file://${path.join(output, 'standalone.html')}?language=${language}`,
        );
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          dark,
        );
        const links = page.locator('nav a');
        await expect(links).toHaveCount(6);
        for (let index = 0; index < 6; index++) {
          const link = links.nth(index),
            title = await link.textContent();
          await link.click();
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            title,
          );
          await expect(page.getByRole('tablist')).toHaveCount(0);
          await expect(
            page.getByRole('table', { name: 'Loading' }),
          ).toHaveCount(0);
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            )
          )
            throw new Error(`overflow ${language}/${width}/${index}`);
          const name = `${language}-${dark ? 'dark' : 'light'}-${width}-${index}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', name),
            fullPage: true,
          });
          evidence.screenshots.push(name);
        }
      }
  expect(evidence.errors).toEqual([]);
  evidence.checks.push(
    'six actual report menu routes, localized h1, no report tabs, no page errors or horizontal overflow in both languages, light/dark and desktop/375px',
  );
} finally {
  await browser.close();
  await writeFile(
    path.join(output, 'evidence.json'),
    JSON.stringify(evidence, null, 2),
  );
}
console.log(JSON.stringify(evidence));

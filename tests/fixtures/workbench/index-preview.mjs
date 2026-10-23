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
const output = path.join(root, 'storage/ui-workflow/workbench-index');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `
    export class ApiClientError extends Error {}
    globalThis.__workbenchReads = [];
    const row = {id:'request', kind:'oa.leave', title:'WK-2026-001', number:null, applicantId:'viewer',applicant:null,status:'manager',createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-22T00:00:00Z',dueAt:'2026-10-01T00:00:00Z',startDate:null,endDate:null,amount:null,unit:null};
    const api = { async request({path,query={}}) {
      globalThis.__workbenchReads.push(path);
      if (path === 'workbench/tasks') return {data:[row],meta:{total:query.view==='pending'?230:50,kinds:['oa.leave'],counts:{drafts:8,revisions:2,inProgress:37},attention:{drafts:[],revisions:[],submitted:[row]}}};
      if (path === 'workbench/announcementReceipts') return {data:{count:21,items:[{id:'notice',announcementId:'notice',title:'Confirm workplace notice'}]}};
      if (path === 'leaveBalances/me') return {data:[]};
      if (path === 'leaveRequests/options') return {data:{leaveTypes:[]}};
      if (path === 'workbench/meetings') return {data:{date:'2026-10-22',timeZone:'UTC',total:0,items:[]}};
      throw new Error('Unexpected endpoint: '+path);
    }};
    export function useApiClient(){return api;}
  `,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'viewer'}},refresh:async()=>{}}}`,
  '@nocobase/app-plugin-authorization/client': `export function useAuthorizationRevision(){return 0} export function useCan({action}){return {can:action==='view'||action==='access',isPending:false}}`,
};
await build({
  entryPoints: [path.join(root, 'tests/fixtures/workbench/index-preview.tsx')],
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
  kind: 'Synthetic API with actual HomePage; no business database or real-role acceptance',
  screenshots: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['en-US', 'zh-CN'])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width: dark ? 375 : 1365, height: 900 });
      await page.goto(
        `file://${path.join(output, 'standalone.html')}?language=${language}`,
      );
      await page.evaluate(
        (dark) => document.documentElement.classList.toggle('dark', dark),
        dark,
      );
      await expect(page.getByText('WK-2026-001').first()).toBeVisible();
      await expect(page.getByText('Confirm workplace notice')).toBeVisible();
      await expect(
        page.getByRole('link', {
          name:
            language === 'zh-CN' ? '待我处理 230' : 'Awaiting my action 230',
        }),
      ).toBeVisible();
      const refresh = page
        .getByRole('button', {
          name: language === 'zh-CN' ? '刷新' : 'Refresh',
        })
        .first();
      await refresh.click();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              globalThis.__workbenchReads.filter(
                (path) => path === 'workbench/tasks',
              ).length,
          ),
        )
        .toBe(4);
      const reads = await page.evaluate(() => globalThis.__workbenchReads);
      if (
        reads.includes('approvalCenter') ||
        reads.includes('announcements/pending')
      )
        throw new Error('Legacy workbench read');
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw new Error('Horizontal overflow');
      const name = `${language}-${dark ? 'dark-375' : 'light-1365'}.png`;
      await page.screenshot({
        path: path.join(output, 'screenshots', name),
        fullPage: true,
        animations: 'disabled',
      });
      evidence.screenshots.push(name);
    }
  if (evidence.errors.length) throw new Error(evidence.errors.join('\n'));
  console.log(
    'PASS: 4 synthetic workbench captures; counts, links, refresh and absence of legacy reads.',
  );
} finally {
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}

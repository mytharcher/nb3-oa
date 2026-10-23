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
const output = path.join(root, 'storage/ui-workflow/task-center');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `
    export class ApiClientError extends Error {}
    const facets = [{sourceType:'approval.task',subject:'oa.leave',pending:2},{sourceType:'approval.task',subject:'oa.reimbursement',pending:1},{sourceType:'approval.application',subject:'oa.leave',pending:1},{sourceType:'approval.cc',subject:'oa.contract',pending:1}];
    const api = { async request({path, query={}}) {
      if (path !== 'taskCenter') return {data:[]};
      const now = new Date().toISOString(), past = new Date(Date.now()-5*60000).toISOString();
      const tasks = [
        {id:'1',sourceType:'approval.task',sourceKey:'task-1',subject:'oa.leave',title:'LEAVE-2026-101',status:'pending',createdAt:now,updatedAt:now},
        {id:'2',sourceType:'approval.task',sourceKey:'task-2',subject:'oa.reimbursement',title:'EXPENSE-2026-203',status:'pending',createdAt:past,updatedAt:past},
        {id:'3',sourceType:'approval.task',sourceKey:'task-3',subject:'oa.leave',title:'LEAVE-2026-099',status:'completed',createdAt:now,updatedAt:now},
        {id:'draft:1',sourceType:'approval.application',sourceKey:'oa.leave:draft-record',recordId:'draft-record',subject:'oa.leave',title:'oa.leave',status:'pending',businessStatus:'draft',createdAt:past,updatedAt:past}
      ].filter(task => task.sourceType === query.source && (!query.subject || task.subject === query.subject) && (query.category !== 'drafts' || task.businessStatus === 'draft'));
      const pending = tasks.filter(task=>task.status==='pending').length, closed=tasks.length-pending;
      const matching = tasks.filter(task=>query.status==='all'||(query.status==='closed'?task.status!=='pending':task.status==='pending'));
      return {data:{tasks:matching,total:matching.length,counts:{pending,closed,all:tasks.length},facets}};
    }};
    export function useApiClient(){return api;}
  `,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'synthetic-reviewer'}},refresh:async()=>{}}}`,
  '@nocobase/app-plugin-authorization/client': `export function useAuthorizationRevision(){return 0}`,
};
await build({
  entryPoints: [path.join(root, 'tests/fixtures/task-center/preview.tsx')],
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
  kind: 'synthetic API fixture rendering actual TaskCenterPage; not real-role or database acceptance',
  screenshots: [],
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['en-US', 'zh-CN'])
    for (const preset of ['compact', 'default'])
      for (const dark of [false, true])
        for (const width of [1365, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(
            `file://${path.join(output, 'standalone.html')}?language=${language}`,
          );
          await page.evaluate(
            ({ preset, dark }) => {
              document.documentElement.dataset.theme = preset;
              document.documentElement.classList.toggle('dark', dark);
            },
            { preset, dark },
          );
          await expect(page.getByText('LEAVE-2026-101')).toBeVisible();
          await expect(page.getByRole('table')).toHaveCount(0);
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            )
          )
            throw new Error(`Horizontal overflow at ${width}/${language}`);
          const name = `${language}-${preset}-${dark ? 'dark' : 'light'}-${width}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', name),
            fullPage: true,
            animations: 'disabled',
          });
          evidence.screenshots.push(name);
          const contrast = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d');
            const luminance = (color) => {
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
              const rgb = context.getImageData(0, 0, 1, 1).data;
              const linear = Array.from(rgb)
                .slice(0, 3)
                .map((value) => {
                  const n = value / 255;
                  return n <= 0.04045
                    ? n / 12.92
                    : ((n + 0.055) / 1.055) ** 2.4;
                });
              return (
                linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
              );
            };
            const background = luminance(
              globalThis.getComputedStyle(document.body).backgroundColor,
            );
            return Math.min(
              ...Array.from(document.querySelectorAll('[role=tab]')).map(
                (tab) => {
                  const foreground = luminance(
                    globalThis.getComputedStyle(tab).color,
                  );
                  return (
                    (Math.max(foreground, background) + 0.05) /
                    (Math.min(foreground, background) + 0.05)
                  );
                },
              ),
            );
          });
          if (contrast < 4.5)
            throw new Error(`Tab contrast ${contrast} at ${name}`);
          if (language === 'zh-CN') {
            for (const text of await page.locator('time').allTextContents())
              if (/[a-z]/i.test(text))
                throw new Error(`Untranslated time: ${text}`);
            await expect(page.locator('time').first()).toHaveAttribute(
              'title',
              /年/,
            );
          }
        }
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto(
    `file://${path.join(output, 'standalone.html')}?language=en-US`,
  );
  await expect(page.getByText('LEAVE-2026-101')).toBeVisible();
  await page.getByRole('tab', { name: /Done/ }).click();
  await expect(page.getByText('LEAVE-2026-099')).toBeVisible();
  await expect(page.getByText('LEAVE-2026-101')).toHaveCount(0);
  const search = page.getByRole('searchbox', { name: 'Search task types' });
  await search.pressSequentially('Leave');
  await expect(search).toHaveValue('Leave');
  await search.press('Home');
  await search.pressSequentially('X');
  await expect(search).toHaveValue('XLeave');
  await search.fill('');
  const cdp = await page.context().newCDPSession(page);
  await search.focus();
  await cdp.send('Input.imeSetComposition', {
    text: 'qing',
    selectionStart: 4,
    selectionEnd: 4,
  });
  await cdp.send('Input.insertText', { text: '请假' });
  await expect(search).toHaveValue('请假');
  evidence.checks.push(
    '16 captures: both languages, both presets, light/dark, desktop/375px; actual page cards, closed filter, no tables, tab text contrast >= 4.5, Chinese immediate/nonzero relative times and absolute tooltips, character/mid-string/IME subject search',
  );
  for (const language of ['en-US', 'zh-CN'])
    for (const dark of [false, true]) {
      await page.setViewportSize({ width: dark ? 375 : 1365, height: 900 });
      await page.goto(
        `file://${path.join(output, 'standalone.html')}?language=${language}&drafts=1`,
      );
      await page.evaluate(
        (dark) => document.documentElement.classList.toggle('dark', dark),
        dark,
      );
      const filter = page.getByRole('button', {
        name: language === 'zh-CN' ? '草稿' : 'Drafts',
        exact: true,
      });
      await expect(filter).toHaveCount(0);
      await expect(
        page.getByRole('button', {
          name: language === 'zh-CN' ? '全部申请' : 'All applications',
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(page.locator('[data-slot=task-open]')).toHaveText(
        language === 'zh-CN' ? '请假' : 'Leave',
      );
      await expect(
        page
          .getByText(language === 'zh-CN' ? '草稿' : 'Draft', { exact: true })
          .last(),
      ).toBeVisible();
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw new Error('Draft filter horizontal overflow');
      const name = `drafts-${language}-${dark ? 'dark-375' : 'light-1365'}.png`;
      await page.screenshot({
        path: path.join(output, 'screenshots', name),
        fullPage: true,
        animations: 'disabled',
      });
      evidence.screenshots.push(name);
    }
  evidence.checks.push(
    'Personal pending applications include drafts with a draft badge and no separate draft switch, in both languages and light/dark at desktop/375px',
  );
  if (evidence.errors.length) throw new Error(evidence.errors.join('\n'));
  console.log(
    'PASS: 20 synthetic task-center captures and interaction checks, including drafts.',
  );
} finally {
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}

import console from 'node:console';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
/* global document, innerWidth */
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';

// Synthetic browser check of the workbench prototype: the actual page with a stand-in API.
// It is not a business database or real-role acceptance.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/workbench-prototype');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `
    export class ApiClientError extends Error {
      constructor(message, init = {}) { super(message); this.status = init.status; }
    }
    globalThis.__reads = [];
    const scenario = new URLSearchParams(location.search).get('scenario') ?? 'full';
    const at = (days) => new Date(Date.now() + days * 86400000).toISOString();
    const row = (id, kind, extra = {}) => ({id, kind, title: undefined, number: null, applicantId: 'bob',
      applicant: {id: 'bob', name: 'Bob Chen'}, status: 'manager', createdAt: at(-2), updatedAt: at(-1),
      startDate: null, endDate: null, amount: null, unit: null, ...extra});
    const facets = [
      {sourceType: 'approval.task', subject: 'oa.leave', pending: 5},
      {sourceType: 'approval.task', subject: 'oa.purchase', pending: 2},
      {sourceType: 'oa.workItem', subject: 'oa.workItem', pending: 3},
      {sourceType: 'oa.announcementReceipt', subject: 'oa.announcementReceipt', pending: 1},
      {sourceType: 'approval.cc', subject: 'oa.leave', pending: 2},
      {sourceType: 'approval.application', subject: 'oa.leave', pending: 4},
    ];
    const empty = scenario === 'empty';
    const pending = empty ? [] : [
      row('w1', 'oa.workItem', {title: 'Prepare the Q4 budget review deck', status: 'assigned', dueAt: at(-1)}),
      row('l1', 'oa.leave', {title: 'LEA-2026-0142', dueAt: at(0.1)}),
      row('p1', 'oa.purchase', {title: 'PUR-2026-0088', status: 'head'}),
      row('a1', 'oa.announcementReceipt', {title: 'Updated travel expense policy', status: 'pending'}),
      row('r1', 'oa.leave', {title: 'LEA-2026-0120', applicantId: 'viewer', applicant: {id: 'viewer', name: 'Viewer'}, status: 'revision'}),
    ];
    const submitted = empty ? [] : [
      row('m1', 'oa.leave', {title: 'LEA-2026-0139', applicantId: 'viewer', status: 'manager'}),
      row('m2', 'oa.travel', {title: 'TRV-2026-0021', applicantId: 'viewer', status: 'head'}),
      row('r1', 'oa.leave', {title: 'LEA-2026-0120', applicantId: 'viewer', status: 'revision'}),
    ];
    const api = { async request({path, query = {}}) {
      globalThis.__reads.push(path);
      if (path === 'taskCenter') {
        if (scenario === 'facetsFail') throw new ApiClientError('boom', {status: 500});
        return {data: {tasks: [], total: 7, counts: {pending: 7, closed: 0, all: 7}, facets: empty ? [] : facets}};
      }
      if (path === 'workbench/tasks')
        return query.view === 'mine'
          ? {data: submitted, meta: {page: 1, pageSize: 5, total: submitted.length, kinds: [],
              counts: empty ? {drafts: 0, revisions: 0, inProgress: 0} : {drafts: 2, revisions: 1, inProgress: 3},
              attention: {drafts: [], revisions: [], submitted}}}
          : {data: pending, meta: {page: 1, pageSize: 100, total: pending.length, kinds: [],
              counts: {drafts: 0, revisions: 0, inProgress: 0}}};
      if (path === 'leaveBalances/me')
        return {data: empty ? [] : [{leaveType: 'annual', availableUnits: 14, heldUnits: 2}, {leaveType: 'sick', availableUnits: 10, heldUnits: 0}]};
      if (path === 'leaveRequests/options')
        return {data: {leaveTypes: [{code: 'annual', label: {'en-US': 'Annual leave', 'zh-CN': '年假'}}, {code: 'sick', label: {'en-US': 'Sick leave', 'zh-CN': '病假'}}]}};
      if (path === 'workbench/meetings')
        return {data: {date: at(0).slice(0, 10), timeZone: 'UTC', total: empty ? 0 : 2, items: empty ? [] : [
          {id: 'b1', title: 'Weekly product sync', startAt: at(0.05), endAt: at(0.09), status: 'confirmed'},
          {id: 'b2', title: 'Vendor review with procurement', startAt: at(0.2), endAt: at(0.25), status: 'confirmed'}]}};
      if (path === 'announcements')
        return {data: empty ? [] : [
          {id: 'n1', title: 'Office closed for the national holiday', pinned: true, publishedAt: at(-3)},
          {id: 'n2', title: 'Updated travel expense policy', pinned: false, publishedAt: at(-5)}],
          meta: {page: 1, pageSize: 5, total: empty ? 0 : 2}};
      if (/options|capabilities|createOptions/i.test(path)) return {data: {}};
      throw new Error('Unexpected endpoint: ' + path);
    }};
    export function useApiClient() { return api; }
    export function useToaster() { return {success() {}, error() {}}; }
  `,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'viewer',name:'Viewer'}},refresh:async()=>{}}}`,
  // Leave, reimbursement, travel and purchase can be started; every page, view and work-item create is granted.
  '@nocobase/app-plugin-authorization/client': `
    const starts = ['oa.leave', 'oa.reimbursement', 'oa.travel', 'oa.purchase', 'oa.general', 'oa.overtime'];
    export function useAuthorizationRevision(){return 0}
    export function useCan({resource, action}){return {can: action === 'view' || action === 'access' ||
      (resource.id === 'oa.workItems' && action === 'create') || (action === 'submit' && starts.includes(resource.id)),
      isPending: false}}`,
};
await build({
  entryPoints: [
    path.join(root, 'tests/fixtures/workbench/prototype-preview.tsx'),
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
          (args) => ({
            contents: mocks[args.path],
            loader: 'js',
          }),
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
  kind: 'Synthetic API with actual WorkbenchPrototypePage; no business database or real-role acceptance',
  screenshots: [],
  errors: [],
};
const copy = {
  'en-US': {
    overview: 'Tasks by source',
    approval: 'Awaiting my approval 7',
    refresh: 'Refresh',
    todo: 'Tasks',
    quick: 'Quick start',
    mine: 'My requests',
    retry: 'Retry',
  },
  'zh-CN': {
    overview: '各来源待办',
    approval: '待我审批 7',
    refresh: '刷新',
    todo: '待办',
    quick: '快捷发起',
    mine: '我的申请',
    retry: '重试',
  },
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  const open = async (language, scenario, dark, width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      `file://${path.join(output, 'standalone.html')}?language=${language}&scenario=${scenario}`,
    );
    await page.evaluate(
      (dark) => document.documentElement.classList.toggle('dark', dark),
      dark,
    );
  };
  const shoot = async (name) => {
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw new Error(`Horizontal overflow: ${name}`);
    await page.screenshot({
      path: path.join(output, 'screenshots', name),
      fullPage: true,
      animations: 'disabled',
    });
    evidence.screenshots.push(name);
  };
  for (const language of ['en-US', 'zh-CN'])
    for (const dark of [false, true]) {
      const text = copy[language];
      await open(language, 'full', dark, dark ? 375 : 1365);
      const overview = page.getByRole('region', { name: text.overview });
      const tile = overview.getByRole('link', { name: text.approval });
      await expect(tile).toBeVisible();
      await expect(tile).toHaveAttribute(
        'href',
        '/taskCenter?source=approval.task',
      );
      await expect(
        page.getByText('Prepare the Q4 budget review deck'),
      ).toBeVisible();
      // Narrow screens: handle, then start, then follow.
      const top = async (name) =>
        (await page.getByRole('heading', { name, exact: true }).boundingBox())
          .y;
      const [todo, quick, mine] = [
        await top(text.todo),
        await top(text.quick),
        await top(text.mine),
      ];
      if (dark ? !(todo < quick && quick < mine) : !(todo < quick))
        throw new Error(`Unexpected card order in ${language}`);
      await shoot(`${language}-${dark ? 'dark-375' : 'light-1365'}.png`);
      const before = await page.evaluate(
        () => globalThis.__reads.filter((p) => p === 'taskCenter').length,
      );
      await page.getByRole('button', { name: text.refresh }).first().click();
      await expect
        .poll(() =>
          page.evaluate(
            () => globalThis.__reads.filter((p) => p === 'taskCenter').length,
          ),
        )
        .toBe(before + 1);
      // A row opens over the workbench rather than leaving it.
      await page.getByRole('link', { name: 'LEA-2026-0142' }).click();
      await expect(page.locator('[data-overlay]')).toBeVisible();
      await expect(page.locator('[data-left]')).toHaveCount(0);
    }
  await open('zh-CN', 'facetsFail', false, 1365);
  await expect(
    page
      .getByRole('region', { name: copy['zh-CN'].overview })
      .getByRole('button', { name: copy['zh-CN'].retry }),
  ).toBeVisible();
  await expect(
    page.getByText('Prepare the Q4 budget review deck'),
  ).toBeVisible();
  await shoot('zh-CN-facets-failed-1365.png');
  await open('zh-CN', 'empty', false, 1365);
  await expect(page.getByText('暂无公告')).toBeVisible();
  await shoot('zh-CN-empty-1365.png');
  if (evidence.errors.length) throw new Error(evidence.errors.join('\n'));
  console.log(
    `PASS: ${evidence.screenshots.length} synthetic workbench prototype captures; overview links, order, refresh, overlays, failure and empty states.`,
  );
} finally {
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}

import console from 'node:console';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
/* global document, innerWidth, window, getComputedStyle */
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/workbench-request-catalog');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
const mocks = {
  '@nocobase/app-client': `
    const scenario = new URLSearchParams(location.search).get('scenario');
    globalThis.__workbenchReads=[];
    export class ApiClientError extends Error { constructor(message,options={}){super(message); Object.assign(this,options);} }
    export function useToaster(){return {toast:()=>{},success:()=>{},error:()=>{}}}
    const base={kind:'oa.leave',title:'Annual leave',number:null,applicantId:'team',applicant:{id:'team',name:'Colleague'},status:'manager',createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-22T00:00:00Z',dueAt:'2026-10-01T00:00:00Z',startDate:null,endDate:null,amount:null,unit:null};
    const rows=[...Array.from({length:7},(_,i)=>({...base,id:'leave-'+i,title:'Leave request '+(i+1)})),{...base,id:'loan',kind:'oa.loan',title:'Loan for travel',unit:'cents',amount:300000},{...base,id:'shared',kind:'oa.departure',title:'Departure handover'}];
    rows.push(rows[8]);
    const api={async request({path,query={}}){
      globalThis.__workbenchReads.push(path);
      if(path==='workbench/roleContext') {
        if(scenario==='roleerror') throw new ApiClientError('synthetic role failure',{status:500});
        const ordinary=scenario==='ordinary'; const single=scenario==='single';
        return {data:{manager:!ordinary&&!single,hr:!ordinary&&!single,finance:!ordinary,administration:!ordinary&&!single,procurement:!ordinary&&!single,teamUserIds:['team']}};
      }
      if(path==='workbench/tasks') {
        if(scenario==='error'&&query.view==='pending')throw new ApiClientError('synthetic pending failure',{status:500});
        const empty=scenario==='empty';
        return {data:empty?[]:query.view==='pending'?rows:[],meta:{total:empty?0:query.view==='pending'?230:0,kinds:['oa.leave','oa.loan','oa.departure'],counts:{drafts:empty?0:8,revisions:0,inProgress:empty?0:37},attention:{drafts:[],revisions:[],submitted:[]}}};
      }
      if(path==='personalSchedules/team')return {data:[{id:'a',userId:'one',kind:'leave'},{id:'b',userId:'one',kind:'leave'},{id:'c',userId:'two',kind:'travel'}],meta:{date:'2026-10-25',timeZone:'Asia/Shanghai'}};
      if(path.startsWith('requestPreferences'))return {data:{favorites:null,recent:[]}};
      if(path==='workbench/announcementReceipts')return {data:{count:0,items:[]}};
      if(path==='personalSchedules'||path==='leaveBalances/me')return {data:[]};
      if(path==='leaveRequests/options')return {data:{leaveTypes:[]}};
      if(path==='workbench/meetings')return {data:{date:'2026-10-25',timeZone:'Asia/Shanghai',total:0,items:[]}};
      if(path.endsWith('/options')||path.endsWith('/createOptions')||path.endsWith('/capabilities'))return {data:{eligible:true,canCreate:true,canCreateAsHR:true,canCreateQualification:true,canCreateSelfDraft:true,canCreateManualDraft:true}};
      throw new Error('Unexpected endpoint: '+path);
    }};
    export function useApiClient(){return api;}
  `,
  '@nocobase/app-plugin-authentication/client': `export function useAuthentication(){return {session:{user:{id:'viewer',name:'Alex'}},refresh:async()=>{}}}`,
  '@nocobase/app-plugin-authorization/client': `
    const denied=new URLSearchParams(location.search).get('scenario')==='denied';
    const client={can:async()=>!denied};
    export function useAuthorizationClient(){return client;}
    export function useAuthorizationRevision(){return 0;}
    export function useCan({action,resource}){return {can:!denied||(resource.type==='page'&&resource.id==='oa.approvals')||action==='view',isPending:false};}
  `,
};
await build({
  entryPoints: [path.join(root, 'tests/fixtures/workbench/simple-preview.tsx')],
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
  kind: 'Actual HomePage with synthetic API, not real-role/database acceptance',
  screenshots: [],
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['zh-CN', 'en-US'])
    for (const theme of ['default', 'compact'])
      for (const dark of [false, true])
        for (const width of [1920, 1365, 768, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`${origin}/?language=${language}`);
          await page.evaluate(
            ({ theme, dark }) => {
              document.documentElement.dataset.theme = theme;
              document.documentElement.classList.toggle('dark', dark);
            },
            { theme, dark },
          );
          const heading = page.getByRole('heading', {
            name: language === 'zh-CN' ? '待处理' : 'Needs my attention',
            exact: true,
          });
          await expect(heading).toBeVisible();
          for (const target of [
            '/personal-schedules',
            '/leaveBalances',
            '/meeting-rooms',
            '/announcements?mode=pending',
          ]) {
            const link = page.locator(
              `[data-slot="card-header"] a[href="${target}"]`,
            );
            await expect(link).toHaveCount(1);
            await expect(link).toHaveText(
              language === 'zh-CN' ? '查看全部' : 'View all',
            );
            await expect(link.locator('svg')).toHaveCount(1);
          }
          const pending = heading.locator(
            'xpath=ancestor::*[@data-slot="card"]',
          );
          await expect(pending.getByRole('listitem')).toHaveCount(6);
          const header = pending.locator('[data-slot="card-header"]');
          await expect(
            header.getByRole('group', {
              name:
                language === 'zh-CN' ? '职责筛选' : 'Filter by responsibility',
            }),
          ).toHaveCount(1);

          const mine = page
            .getByRole('heading', {
              name: language === 'zh-CN' ? '我的申请' : 'My requests',
              exact: true,
            })
            .locator('xpath=ancestor::*[@data-slot="card"]');
          await expect(mine).toBeVisible();
          const pendingBox = await pending.boundingBox();
          const mineBox = await mine.boundingBox();
          if (width >= 1024) {
            expect(Math.abs(pendingBox.y - mineBox.y)).toBeLessThan(1);
            expect(mineBox.x).toBeGreaterThan(pendingBox.x);
            expect(Math.abs(pendingBox.width - mineBox.width)).toBeLessThan(1);
          } else {
            expect(mineBox.y).toBeGreaterThanOrEqual(
              pendingBox.y + pendingBox.height,
            );
          }

          await expect(
            page.getByRole('region', {
              name: language === 'zh-CN' ? '我的工作区' : 'My workspaces',
            }),
          ).toHaveCount(0);
          await expect(
            page.getByRole('group', {
              name:
                language === 'zh-CN' ? '职责筛选' : 'Filter by responsibility',
            }),
          ).toBeVisible();
          if (language === 'zh-CN' && theme === 'default' && !dark) {
            const initial = `zh-CN-all-initial-${width}.png`;
            await page.screenshot({
              path: path.join(output, 'screenshots', initial),
              fullPage: true,
            });
            evidence.screenshots.push(initial);
          }
          await page
            .getByRole('button', {
              name: language === 'zh-CN' ? '财务' : 'Finance',
              exact: true,
            })
            .click();
          await expect(
            pending.getByRole('link', { name: 'Loan for travel', exact: true }),
          ).toBeVisible();
          await expect(
            pending.getByRole('link', {
              name: 'Departure handover',
              exact: true,
            }),
          ).toHaveCount(1);
          await expect(pending.getByRole('listitem')).toHaveCount(2);
          const state = await page.evaluate(
            () => window.__router.state.location,
          );
          expect(state.search).toContain('search=kept');
          expect(state.search).toContain('workbenchRole=finance');
          expect(state.hash).toBe('#requests');
          await pending
            .getByRole('link', { name: 'Loan for travel', exact: true })
            .click();
          await expect(
            page.getByRole('complementary', {
              name: 'Synthetic record detail',
            }),
          ).toBeVisible();
          await page.getByRole('button', { name: 'Save and close' }).click();
          await expect(pending.getByRole('listitem')).toHaveCount(2);
          await expect(
            page.getByRole('region', {
              name:
                language === 'zh-CN' ? '今日团队状态' : 'Today’s team status',
              exact: true,
            }),
          ).toHaveCount(1);
          await expect(
            page.getByRole('heading', {
              name: language === 'zh-CN' ? '常用入口' : 'Common links',
              exact: true,
            }),
          ).toHaveCount(0);
          const requests = page
            .getByRole('heading', {
              name: language === 'zh-CN' ? '发起申请' : 'New request',
              exact: true,
            })
            .locator('xpath=ancestor::*[@data-slot="card"]');
          const cards = requests.locator(
            '[data-slot="request-action-card"][data-area]',
          );
          await expect(cards).toHaveCount(6);
          const allRequests = requests.getByRole('button', {
            name: language === 'zh-CN' ? '全部申请' : 'All requests',
            exact: true,
          });
          await expect(allRequests).toBeVisible();
          const actionBox = await cards.first().boundingBox();
          const allBox = await allRequests.boundingBox();
          expect(Math.abs(allBox.width - actionBox.width)).toBeLessThan(1);
          expect(Math.abs(allBox.height - actionBox.height)).toBeLessThan(1);
          expect(
            await allRequests.evaluate(
              (element) => getComputedStyle(element).borderTopStyle,
            ),
          ).toBe('dashed');

          const columns = await cards.evaluateAll((items) => {
            const top = items[0].getBoundingClientRect().top;
            return items.filter(
              (item) => Math.abs(item.getBoundingClientRect().top - top) < 1,
            ).length;
          });
          if (width === 375) expect(columns).toBe(1);
          if (width >= 1365) expect(columns).toBeGreaterThan(3);
          evidence.checks.push(
            `${language}/${theme}/${dark}/${width}: ${columns} request columns; no common links`,
          );
          await expect(
            page.getByRole('region', {
              name: language === 'zh-CN' ? '职能申请' : 'Functional requests',
            }),
          ).toHaveCount(0);
          await allRequests.click();
          const drawer = page.getByRole('dialog');
          for (const target of [
            'newRecruitment',
            'newExpensePlan',
            'newBudgetAdjustment',
          ]) {
            await expect(drawer.locator(`[href*="${target}"]`)).toHaveCount(1);
          }
          await page.keyboard.press('Escape');
          await expect(drawer).toBeHidden();
          const reads = await page.evaluate(() => globalThis.__workbenchReads);
          expect(reads.includes('reports/datasets')).toBe(false);
          expect(
            reads.filter((path) => path === 'workbench/roleContext').length,
          ).toBeGreaterThan(1);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
          ).toBe(false);
          await page.evaluate(() => window.scrollTo(0, 0));
          const name = `${language}-${theme}-${dark ? 'dark' : 'light'}-${width}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', name),
            fullPage: true,
          });
          evidence.screenshots.push(name);
        }
  for (const scenario of [
    'ordinary',
    'single',
    'empty',
    'error',
    'roleerror',
    'denied',
  ]) {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${origin}/?language=en-US&scenario=${scenario}`);
    await expect(
      page.getByRole('heading', { name: 'Needs my attention', exact: true }),
    ).toBeVisible();
    if (['ordinary', 'single', 'roleerror'].includes(scenario))
      await expect(
        page.getByRole('group', { name: 'Filter by responsibility' }),
      ).toHaveCount(0);
    if (scenario === 'ordinary')
      await expect(
        page.getByRole('region', { name: 'Functional requests' }),
      ).toHaveCount(0);
    if (scenario === 'empty') {
      await expect(page.getByText('You are all caught up')).toBeVisible();
      const mine = page
        .getByRole('heading', { name: 'My requests', exact: true })
        .locator('xpath=ancestor::*[@data-slot="card"]');
      await expect(
        mine.getByRole('link', { name: 'View all my requests' }),
      ).toBeVisible();
      await expect(mine.locator('[data-slot="card-footer"]')).toHaveCount(0);
      for (const width of [1365, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        const pending = page
          .getByRole('heading', { name: 'Needs my attention', exact: true })
          .locator('xpath=ancestor::*[@data-slot="card"]');
        const left = await pending.locator('[data-slot="empty"]').boundingBox();
        const right = await mine.locator('[data-slot="empty"]').boundingBox();
        expect(Math.abs(left.y - right.y)).toBeLessThan(1);
        expect(
          Math.abs(left.y + left.height - right.y - right.height),
        ).toBeLessThan(1);
        const name = `scenario-empty-aligned-${width}.png`;
        await page.screenshot({
          path: path.join(output, 'screenshots', name),
          fullPage: true,
        });
        evidence.screenshots.push(name);
      }
      await page.setViewportSize({ width: 375, height: 900 });
    }
    if (['error', 'roleerror'].includes(scenario))
      await expect(page.getByRole('alert').first()).toBeVisible();
    if (scenario === 'denied')
      await expect(
        page.getByRole('heading', { name: 'Common links' }),
      ).toHaveCount(0);
    const name = `scenario-${scenario}-375.png`;
    await page.screenshot({
      path: path.join(output, 'screenshots', name),
      fullPage: true,
    });
    evidence.screenshots.push(name);
  }
  expect(evidence.errors).toEqual([]);
  evidence.checks.push(
    '32 language/theme/density/viewport combinations; 6 edge states; dedup, role filter, retained URL, synthetic overlay save refresh, responsive request columns, capability gating, no homepage report reads/overflow',
  );
} finally {
  await browser.close();
  server.close();
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
}
console.log(JSON.stringify(evidence));

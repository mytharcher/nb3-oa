import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import tailwind from '@tailwindcss/postcss';
import postcss from 'postcss';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  DataTable,
  DataTableColumnHeader,
} from '../../../client/components/data-table/index.js';
import { ResponsiveTable } from '../../../client/components/responsive-table.js';
import { ApplicationToolbar } from '../../../client/components/application-toolbar.js';
import { ApplicationSearch } from '../../../client/components/application-search.js';
import { Input } from '../../../client/components/ui/input.js';
import { Label } from '../../../client/components/ui/label.js';
import { Button } from '../../../client/components/ui/button.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
} from '../../../client/components/ui/select.js';
import { DatePicker } from '../../../client/components/date-picker.js';
import { Plus, RefreshCw } from 'lucide-react';
import enUS from '../../../client/locales/en-US.js';

// Isolated CSS acceptance using actual components and compiled application CSS.
// No account, business API or server state participates in this check.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const cssFile = fileURLToPath(
  new URL('../../../client/styles.css', import.meta.url),
);
const css = await postcss([tailwind({ base: root, optimize: false })]).process(
  await readFile(cssFile, 'utf8'),
  { from: cssFile },
);
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const markup = renderToStaticMarkup(
  <TestI18nProvider runtime={runtime}>
    <main className='flex min-w-0 flex-col gap-6 p-4'>
      {['vehicles', 'reports', 'administration'].map((kind) => (
        <section id={kind} key={kind}>
          <h2>
            {kind === 'vehicles'
              ? '车辆申请 · Vehicle requests'
              : kind === 'reports'
                ? '报表 · Reports'
                : '系统管理 · Administration'}
          </h2>
          <ApplicationToolbar
            actions={
              <>
                <Button variant='outline' size='icon' aria-label='Refresh'>
                  <RefreshCw />
                </Button>
                <Button>
                  <Plus />
                  新建 · New record
                </Button>
              </>
            }
          >
            <div
              data-slot='application-filter'
              className='flex flex-1 flex-col gap-2'
            >
              <Label htmlFor={`${kind}-search`}>搜索 · Search</Label>
              <ApplicationSearch
                id={`${kind}-search`}
                aria-label='Search'
                placeholder='按编号、用途或目的地搜索'
                defaultValue='车辆'
              />
            </div>
            <div data-slot='application-filter' className='flex flex-col gap-1'>
              <Label htmlFor={`${kind}-status`}>状态 · Status</Label>
              <Select
                value='all'
                items={[{ value: 'all', label: '全部状态 · All statuses' }]}
              >
                <SelectTrigger id={`${kind}-status`}>
                  <SelectValue />
                </SelectTrigger>
              </Select>
            </div>
            {kind === 'reports' ? (
              <>
                <div
                  data-slot='application-filter'
                  data-context='true'
                  className='flex flex-col gap-2'
                >
                  <Label htmlFor='year'>年度 · Year</Label>
                  <Input id='year' type='number' defaultValue='2026' />
                </div>
                <div
                  data-slot='application-filter'
                  data-context='true'
                  className='flex flex-col gap-2'
                >
                  <Label htmlFor='month'>月份 · Month</Label>
                  <Input id='month' type='number' defaultValue='10' />
                </div>
                <div
                  data-slot='application-filter'
                  data-context='true'
                  className='flex flex-col gap-2'
                >
                  <Label htmlFor='ends-before'>截止 · Ends before</Label>
                  <DatePicker
                    id='ends-before'
                    value={new Date(2026, 9, 12)}
                    onChange={() => undefined}
                    displayFormat='yyyy-MM-dd'
                  />
                </div>
              </>
            ) : null}
          </ApplicationToolbar>
        </section>
      ))}
      <section id='records'>
        <h1>预算管理 · Budget table</h1>
        <DataTable
          columns={[
            { accessorKey: 'subject', header: '科目 · Subject' },
            {
              accessorKey: 'amount',
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title='金额 · Amount'
                  className='justify-end'
                />
              ),
              cell: ({ getValue }) => (
                <div className='text-right tabular-nums'>
                  {String(getValue())}
                </div>
              ),
            },
          ]}
          data={[{ subject: '办公费用 · Office expenses', amount: '100.01' }]}
          emptyMessage='No results'
          pagination={false}
        />
      </section>
      <section id='manual'>
        <h2>管理表格 · Manual administration table</h2>
        <ResponsiveTable className='min-w-[860px]'>
          <thead className='bg-muted/35 uppercase'>
            <tr>
              <th className='px-5 py-3 font-medium'>科目 · Subject</th>
              <th className='px-5 py-3 text-right'>金额 · Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className='px-4 py-3'>办公费用 · Office expenses</td>
              <td className='px-4 py-3 text-right tabular-nums'>100.01</td>
            </tr>
          </tbody>
        </ResponsiveTable>
      </section>
      <section id='inspector'>
        <h2>权限矩阵 · Sticky inspector table</h2>
        <div
          data-slot='responsive-table'
          className='max-h-[60vh] overflow-auto rounded-lg border bg-card'
        >
          <table className='w-full table-fixed text-sm'>
            <thead className='sticky top-0 z-10 bg-card'>
              <tr>
                <th className='p-3 text-left'>科目 · Subject</th>
                <th className='p-3 text-right'>金额 · Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className='p-2'>办公费用 · Office expenses</td>
                <td className='p-2 text-right tabular-nums'>100.01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </TestI18nProvider>,
);
const screenshots = `${root}storage/ui-workflow/list-presentation/screenshots`;
await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  // tsx emits this helper for named functions embedded in Playwright callbacks.
  await page.evaluate('globalThis.__name = (fn) => fn');
  for (const preset of ['compact', 'default']) {
    for (const mode of ['light', 'dark']) {
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.setContent(
          `<!doctype html><html data-theme='${preset}' class='${mode}'><head><style>${css.css}</style></head><body>${markup}</body></html>`,
        );
        const values = await page.evaluate(() => {
          const properties = [
            'height',
            'paddingLeft',
            'paddingRight',
            'paddingTop',
            'paddingBottom',
            'fontSize',
            'fontWeight',
            'color',
            'textTransform',
            'lineHeight',
            'verticalAlign',
          ];
          const styles = (element: Element | null) => {
            assertElement(element);
            const style = getComputedStyle(element);
            return Object.fromEntries(
              properties.map((key) => [
                key,
                style.getPropertyValue(
                  key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
                ),
              ]),
            );
          };
          function assertElement(
            element: Element | null,
          ): asserts element is Element {
            if (!element) throw new Error('Missing table fixture element');
          }
          return ['records', 'manual', 'inspector'].map((id) => {
            const cell = styles(document.querySelector(`#${id} td`));
            // The fixed-width inspector wraps long text on phones; row height
            // follows content, while typography and padding must still match.
            delete cell.height;
            return {
              header: styles(document.querySelector(`#${id} th`)),
              cell,
              background: getComputedStyle(
                document.querySelector(`#${id} thead`)!,
              ).backgroundColor,
              border: getComputedStyle(
                document.querySelector(`#${id} [data-slot=responsive-table]`)!,
              ).borderTopWidth,
            };
          });
        });
        assert.deepEqual(
          values[0],
          values[1],
          `${preset}/${mode}/${width}: DataTable vs native table`,
        );
        assert.deepEqual(
          values[0],
          values[2],
          `${preset}/${mode}/${width}: DataTable vs inspector`,
        );
        assert.equal(values[0].border, '1px');
        assert.equal(values[0].header.textTransform, 'none');
        const sortButton = await page
          .locator('#records th button')
          .evaluate((element) => ({
            fontSize: getComputedStyle(element).fontSize,
            fontWeight: getComputedStyle(element).fontWeight,
          }));
        assert.equal(sortButton.fontSize, values[0].header.fontSize);
        assert.equal(sortButton.fontWeight, values[0].header.fontWeight);
        assert.equal(
          await page
            .locator('#manual td')
            .last()
            .evaluate((el) => getComputedStyle(el).textAlign),
          'right',
        );
        assert.equal(
          await page
            .locator('#inspector thead')
            .evaluate((el) => getComputedStyle(el).position),
          'sticky',
        );
        assert.equal(
          await page
            .locator('#inspector [data-slot=responsive-table]')
            .evaluate((el) => getComputedStyle(el).overflow),
          'auto',
        );
        assert.equal(
          await page
            .locator('#records [data-slot=responsive-table]')
            .evaluate(
              (el) => getComputedStyle(el.parentElement!).borderTopWidth,
            ),
          '0px',
        );
        const controls = await page.evaluate(() => {
          const dims = (selector: string) => {
            const el = document.querySelector(selector)!;
            const box = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return {
              height: box.height,
              width: box.width,
              font: style.fontSize,
              border: style.borderColor,
              background: style.backgroundColor,
            };
          };
          return ['vehicles', 'reports', 'administration'].map((id) => ({
            search: dims(`#${id} [data-slot=application-search]`),
            select: dims(`#${id} [data-slot=select-trigger]`),
            refresh: dims(
              `#${id} [data-slot=application-actions] button:first-child`,
            ),
            create: dims(
              `#${id} [data-slot=application-actions] button:last-child`,
            ),
          }));
        });
        assert.deepEqual(controls[0].search, controls[1].search);
        assert.deepEqual(controls[0].search, controls[2].search);
        assert.deepEqual(controls[0].select, controls[1].select);
        assert.equal(controls[0].search.height, controls[0].select.height);
        assert.equal(controls[0].refresh.height, controls[0].select.height);
        assert.ok(
          controls[0].create.width > 100,
          'Text actions must not collapse to icon widths',
        );
        if (width === 1280) {
          const spacing = await page
            .locator('html')
            .evaluate(
              (el) =>
                parseFloat(getComputedStyle(el).getPropertyValue('--spacing')) *
                (getComputedStyle(el)
                  .getPropertyValue('--spacing')
                  .includes('rem')
                  ? parseFloat(getComputedStyle(el).fontSize)
                  : 1),
            );
          assert.ok(
            Math.abs(controls[0].search.width - spacing * 64) < 0.1,
            'Search uses the agreed desktop width',
          );
          assert.ok(
            Math.abs(controls[0].select.width - spacing * 40) < 0.1,
            'Select uses the agreed desktop width',
          );
        }
        const dateHeight = await page
          .locator('#ends-before')
          .evaluate((el) => el.getBoundingClientRect().height);
        assert.equal(
          dateHeight,
          controls[0].select.height,
          'Date controls use the same filter height',
        );
        const contextLabels = await page
          .locator('#reports [data-context] label')
          .evaluateAll((elements) =>
            elements.map((el) => ({
              width: el.getBoundingClientRect().width,
              position: getComputedStyle(el).position,
            })),
          );
        assert.ok(
          contextLabels.every(
            (label) => label.width > 1 && label.position !== 'absolute',
          ),
          'Year and month remain visibly labelled',
        );
        if (width === 375) assert.ok(controls[0].select.height >= 44);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        assert.equal(
          overflow,
          false,
          'The page must not overflow horizontally',
        );
        await page.screenshot({
          path: `${screenshots}/${preset}-${mode}-${width}.png`,
          fullPage: true,
        });
        console.log(`PASS ${preset}/${mode}/${width}`);
      }
    }
  }
} finally {
  await browser.close();
}

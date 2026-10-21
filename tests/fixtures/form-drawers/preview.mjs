import console from 'node:console';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/unified-form-drawers');
const appRequire = createRequire(path.join(root, 'package.json'));
const viteRequire = createRequire(appRequire.resolve('vite'));
const { build } = viteRequire('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
await build({
  entryPoints: [path.join(root, 'tests/fixtures/form-drawers/preview.tsx')],
  bundle: true,
  format: 'iife',
  outfile: path.join(output, 'preview.js'),
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
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
  kind: 'isolated synthetic component fixture, not real-role acceptance',
  screenshots: [],
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const mode of ['controlled', 'route']) {
    for (const preset of ['compact', 'default']) {
      for (const dark of [false, true]) {
        for (const width of [1365, 375]) {
          await page.setViewportSize({ width, height: 812 });
          await page.goto(
            `file://${path.join(output, 'standalone.html')}?mode=${mode}`,
          );
          const drawer = page.getByRole('dialog');
          await expect(drawer).toBeVisible();
          await page.evaluate(
            ({ preset, dark }) => {
              globalThis.document.documentElement.dataset.theme = preset;
              globalThis.document.documentElement.classList.toggle(
                'dark',
                dark,
              );
            },
            { preset, dark },
          );
          await expect
            .poll(
              async () => {
                const bounds = await drawer.boundingBox();
                return (
                  !!bounds &&
                  Math.abs(bounds.x + bounds.width - width) <= 1 &&
                  Math.abs(bounds.y) <= 1 &&
                  bounds.height >= 810
                );
              },
              {
                message: `${mode}: drawer must settle at the right edge with full height`,
              },
            )
            .toBe(true);
          const bounds = await drawer.boundingBox();
          if (
            !bounds ||
            Math.abs(bounds.x + bounds.width - width) > 1 ||
            bounds.y > 1 ||
            bounds.height < 810
          )
            throw new Error(`${mode}: drawer not docked/full height`);
          if (width === 375 && Math.abs(bounds.width - width) > 1)
            throw new Error('Mobile not full width');
          await expect(
            drawer.getByRole('heading', { name: 'Create employee fixture' }),
          ).toHaveCount(1);
          const body = drawer.locator(
            mode === 'route'
              ? '[data-slot=route-overlay-body]'
              : '[data-slot=form-drawer-body]',
          );
          const footer = drawer.locator(
            mode === 'route'
              ? '[data-slot=route-overlay-footer]'
              : '[data-slot=dialog-footer]',
          );
          const before = await footer.boundingBox();
          await body.evaluate((element) => {
            element.scrollTop = element.scrollHeight;
          });
          const after = await footer.boundingBox();
          if (
            !before ||
            !after ||
            Math.abs(before.y - after.y) > 1 ||
            after.y + after.height > 813
          )
            throw new Error('Footer not fixed/visible');
          if (
            await page.evaluate(
              () =>
                globalThis.document.documentElement.scrollWidth >
                globalThis.innerWidth,
            )
          )
            throw new Error('Horizontal viewport overflow');
          await body.evaluate((element) => {
            element.scrollTop = 0;
          });
          const filename = `${mode}-${preset}-${dark ? 'dark' : 'light'}-${width}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', filename),
          });
          evidence.screenshots.push(filename);
        }
      }
    }
  }
  await page.goto(
    `file://${path.join(output, 'standalone.html')}?mode=controlled`,
  );
  const input = page.getByRole('textbox', { name: 'Name', exact: true });
  await input.click();
  await page.keyboard.type('Test employee');
  await page.keyboard.press('Home');
  await page.keyboard.type('A ');
  await expect(input).toHaveValue('A Test employee');
  const cdp = await page.context().newCDPSession(page);
  await page.keyboard.press('End');
  await cdp.send('Input.imeSetComposition', {
    text: 'zhong',
    selectionStart: 5,
    selectionEnd: 5,
  });
  await cdp.send('Input.insertText', { text: '中' });
  await expect(input).toHaveValue('A Test employee中');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Continue editing' }).click();
  await expect(input).toHaveValue('A Test employee中');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Synthetic save failure');
  await expect(input).toHaveValue('A Test employee中');
  await page.goto(`file://${path.join(output, 'standalone.html')}?mode=route`);
  const routeInput = page.getByRole('textbox', { name: 'Name', exact: true });
  await routeInput.pressSequentially('Registered draft');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Continue editing' }).click();
  await expect(routeInput).toHaveValue('Registered draft');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('button', { name: 'Discard changes', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  evidence.checks.push(
    'Registered child form guard: Escape/continue retains input; close/discard returns to background without repeated confirmation.',
  );
  evidence.checks.push(
    '16 viewport/theme/preset/container captures; right docking/full height; fixed footer after body scroll; no viewport overflow; unique title; character and mid-string typing; Chinese IME; cancel/continue; busy close protection; failed save retains input',
  );
  if (evidence.errors.length) throw new Error(evidence.errors.join('\n'));
  console.log('PASS: 16 synthetic browser captures and interaction checks.');
} finally {
  await writeFile(
    path.join(output, 'screenshots/capture-log.json'),
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}

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
const output = path.join(root, 'storage/ui-workflow/draft-submit-confirmation');
const appRequire = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(appRequire.resolve('vite'))('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
await build({
  entryPoints: [
    path.join(root, 'tests/fixtures/form-drawers/submit-preview.tsx'),
  ],
  bundle: true,
  format: 'esm',
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
  kind: 'Actual nested overlay components, synthetic confirmation data; no business writes or signed-in role acceptance',
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const language of ['zh-CN', 'en-US'])
    for (const dark of [false, true])
      for (const theme of ['default', 'compact'])
        for (const width of [1365, 375]) {
          await page.setViewportSize({ width, height: 812 });
          await page.goto(`${origin}/?language=${language}`);
          await page.evaluate(
            ({ dark, theme }) => {
              document.documentElement.classList.toggle('dark', dark);
              document.documentElement.dataset.theme = theme;
            },
            { dark, theme },
          );
          const popup = page.getByRole('dialog', {
            name:
              language === 'zh-CN'
                ? '提交离职申请'
                : 'Submit departure request',
            exact: true,
          });
          await expect(popup).toHaveAttribute('data-presentation', 'dialog');
          await expect(
            page.locator('[data-presentation="drawer"]'),
          ).toHaveCount(1);
          const box = await popup.boundingBox();
          expect(box.width).toBeLessThanOrEqual(width === 375 ? 343 : 448);
          const confirm = popup.getByRole('button', {
              name: language === 'zh-CN' ? '确认提交' : 'Confirm submission',
              exact: true,
            }),
            cancel = popup.getByRole('button', {
              name: language === 'zh-CN' ? '取消' : 'Cancel',
              exact: true,
            });
          const c = await confirm.boundingBox(),
            b = await cancel.boundingBox();
          if (width === 375) expect(c.y).toBeLessThan(b.y);
          else expect(b.x).toBeLessThan(c.x);
          const note = popup.getByRole('textbox');
          await note.pressSequentially('abc');
          await note.press('ArrowLeft');
          await note.pressSequentially('X');
          const cdp = await page.context().newCDPSession(page);
          await cdp.send('Input.imeSetComposition', {
            text: 'zhong',
            selectionStart: 5,
            selectionEnd: 5,
          });
          await cdp.send('Input.insertText', { text: '中' });
          await cdp.detach();
          await expect(note).toHaveValue(/中/);
          const value = await note.inputValue();
          await confirm.click();
          await expect(popup.getByRole('alert')).toBeVisible();
          await expect(note).toHaveValue(value);
          const name = `${language}-${dark ? 'dark' : 'light'}-${theme}-${width}.png`;
          await page.screenshot({
            path: path.join(output, 'screenshots', name),
            fullPage: true,
          });
          evidence.screenshots.push(name);
          await cancel.click();
          await expect(popup).toHaveCount(0);
          await expect(
            page.getByRole('textbox', { name: 'Draft memo' }),
          ).toHaveValue('Keep this draft');
          await expect(
            page.getByRole('dialog', {
              name: language === 'zh-CN' ? '离职草稿' : 'Departure draft',
            }),
          ).toBeVisible();
        }
  for (const scenario of ['long', 'other']) {
    await page.setViewportSize({ width: 375, height: 640 });
    await page.goto(`${origin}/?language=en-US&${scenario}`);
    const popup = page.getByRole('dialog', {
      name: 'Submit departure request',
    });
    await expect(popup).toHaveAttribute(
      'data-presentation',
      scenario === 'other' ? 'drawer' : 'dialog',
    );
    if (scenario === 'long') {
      await popup
        .locator('[data-slot="route-overlay-body"]')
        .evaluate((node) => (node.scrollTop = node.scrollHeight));
      await expect(
        popup.getByRole('button', { name: 'Confirm submission' }),
      ).toBeInViewport();
    }
    const name = `scenario-${scenario}-375.png`;
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

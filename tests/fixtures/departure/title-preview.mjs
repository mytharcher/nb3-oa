import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/departure-title');
await mkdir(output, { recursive: true });
const require = createRequire(path.join(root, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
await build({
  entryPoints: [path.join(root, 'tests/fixtures/departure/title-preview.tsx')],
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
  path.join(output, 'index.html'),
  '<!doctype html><html data-theme="default"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="UTF-8"><link rel="stylesheet" href="preview.css"></head><body><div id="root"></div><script type="module" src="preview.js"></script></body></html>',
);
const server = createServer(async (req, res) => {
  const file =
    new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!['index.html', 'preview.js', 'preview.css'].includes(file)) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader(
    'Content-Type',
    file.endsWith('.js')
      ? 'text/javascript'
      : file.endsWith('.css')
        ? 'text/css'
        : 'text/html',
  );
  res.end(await readFile(path.join(output, file)));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
const evidence = {
  kind: 'isolated components; no live role or business record',
  checks: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => evidence.errors.push(error.message));
  for (const width of [1365, 375])
    for (const language of ['zh', 'en'])
      for (const dark of [false, true])
        for (const plain of [false, true]) {
          await page.setViewportSize({ width, height: 812 });
          await page.goto(
            `http://127.0.0.1:${server.address().port}/?language=${language}${plain ? '&plain' : ''}`,
          );
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.evaluate(
            (dark) =>
              globalThis.document.documentElement.classList.toggle(
                'dark',
                dark,
              ),
            dark,
          );
          await page.waitForTimeout(250);
          const drawerBounds = await page.getByRole('dialog').boundingBox();
          expect(
            Math.abs(drawerBounds.x + drawerBounds.width - width),
          ).toBeLessThan(2);
          const title = page.locator('[data-slot=dialog-title]');
          const bounds = await title.boundingBox();
          expect(bounds.width).toBeLessThanOrEqual(width);
          if (!plain) {
            const avatar = await title
              .locator('[data-slot=avatar]')
              .boundingBox();
            const suffix = await title
              .getByText('· LZ-20261025-000001', { exact: true })
              .boundingBox();
            if (Math.abs(avatar.y - suffix.y) < 15)
              expect(
                Math.abs(
                  avatar.y + avatar.height / 2 - suffix.y - suffix.height / 2,
                ),
              ).toBeLessThan(1);
          }
          const name = `${width}-${language}-${dark ? 'dark' : 'light'}-${plain ? 'plain' : 'identity'}`;
          await page.screenshot({ path: path.join(output, `${name}.png`) });
          evidence.checks.push(name);
        }
  expect(evidence.errors).toEqual([]);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(
    path.join(output, 'evidence.json'),
    JSON.stringify(evidence, null, 2),
  );
}
console.log(JSON.stringify(evidence));

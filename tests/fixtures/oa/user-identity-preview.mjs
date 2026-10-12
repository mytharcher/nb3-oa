import console from 'node:console';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { URL, fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { chromium } from '@playwright/test';

// This is a visual fixture with fictional names, separate from real-role application acceptance.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/ui-workflow/user-identity');
const appRequire = createRequire(path.join(root, 'package.json'));
const viteRequire = createRequire(appRequire.resolve('vite'));
const { build } = viteRequire('esbuild');
await mkdir(path.join(output, 'screenshots'), { recursive: true });
await build({
  entryPoints: [path.join(root, 'tests/fixtures/oa/user-identity-preview.tsx')],
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
  '<!doctype html><html lang="zh-CN" data-theme="compact"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="preview.css"></head><body><div id="root"></div><script src="preview.js"></script></body></html>',
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`file://${path.join(output, 'standalone.html')}`);
  await page.waitForSelector('[data-slot=avatar]');
  if ((await page.locator('[data-slot=avatar]').count()) !== 6)
    throw new Error('Missing fixture avatars');
  for (const preset of ['compact', 'default']) {
    for (const dark of [false, true]) {
      for (const width of [1000, 375]) {
        await page.setViewportSize({ width, height: 812 });
        await page.evaluate(
          ({ preset, dark }) => {
            globalThis.document.documentElement.dataset.theme = preset;
            globalThis.document.documentElement.classList.toggle('dark', dark);
          },
          { preset, dark },
        );
        await page.screenshot({
          path: path.join(
            output,
            `screenshots/${preset}-${dark ? 'dark' : 'light'}-${width}.png`,
          ),
        });
        if (
          await page.evaluate(
            () =>
              globalThis.document.documentElement.scrollWidth >
              globalThis.innerWidth,
          )
        )
          throw new Error('Viewport overflow');
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    '8 visual fixture captures passed; 6 avatars, no viewport overflow or page errors.',
  );
} finally {
  await browser.close();
}

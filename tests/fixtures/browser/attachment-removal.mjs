/* global console */
import tailwind from '@tailwindcss/vite';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const screenshots = 'storage/ui-workflow/attachment-removal/screenshots';
await mkdir(screenshots, { recursive: true });
const server = await createServer({
  configFile: false,
  cacheDir: '/tmp/oa-remove-browser-vite',
  plugins: [
    tailwind(),
    react(),
    {
      name: 'attachment-fixture',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/fixture')) return next();
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await server.transformIndexHtml(
              '/fixture',
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/tests/fixtures/browser/attachment-removal.tsx"></script></body></html>',
            ),
          );
        });
      },
    },
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      '@nocobase/i18n/testing',
      '@nocobase/app-plugin-file/client',
    ],
    exclude: ['@silurus/ooxml'],
  },
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1100, height: 700 },
  });
  await page.goto(`${server.resolvedUrls.local[0]}fixture`);
  const remove = page.getByRole('button', { name: 'Remove Proof.pdf' });
  await remove.waitFor();
  await expect(remove).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Preview Proof.pdf' }).hover();
  await expect(remove).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${screenshots}/desktop-hover.png` });
  await page.mouse.move(1000, 650);
  await remove.focus();
  await expect(remove).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  assert.equal(
    await page.getByRole('button', { name: 'Preview Proof.pdf' }).count(),
    0,
  );
  assert.equal(
    await page.getByRole('button', { name: 'Remove Photo.png' }).count(),
    1,
  );
  const mobile = await browser.newPage({
    viewport: { width: 375, height: 700 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(`${server.resolvedUrls.local[0]}fixture`);
  const touchRemove = mobile.getByRole('button', { name: 'Remove Photo.png' });
  await touchRemove.waitFor();
  await expect(touchRemove).toHaveCSS('opacity', '1');
  await touchRemove.tap();
  assert.equal(
    await mobile.getByRole('button', { name: 'Remove Photo.png' }).count(),
    0,
  );
  await mobile.screenshot({ path: `${screenshots}/mobile-removed.png` });
  console.log(
    'PASS: hover, keyboard removal, touch removal, correct attachment',
  );
} finally {
  await browser?.close();
  await server.close();
}

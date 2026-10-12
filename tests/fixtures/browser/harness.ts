import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { Browser } from '@playwright/test';
import type { ViteDevServer } from 'vite';
import { createTestApp } from '@nocobase/app-testing/server';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import { createServer as createViteServer, loadConfigFromFile } from 'vite';
import { chromium, type BrowserContextOptions } from '@playwright/test';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
  OA_TEST_DATABASE_ENV,
} from '../../logic/oa-test-origin.js';

/** Whole-app browser acceptance on disposable PostgreSQL schemas/storage, isolated Vite/cache and synthetic users. */
export async function startIsolatedBrowserApp({
  name,
  apiPort,
  vitePort,
}: {
  name: string;
  apiPort: number;
  vitePort: number;
}) {
  const apiOrigin = `http://127.0.0.1:${apiPort}`,
    origin = `http://127.0.0.1:${vitePort}`;
  const directory = await mkdtemp(path.join(tmpdir(), `oa-browser-${name}-`));
  const screenshotsDir = path.resolve(
    'storage/ui-workflow',
    `${name}-isolated-browser`,
    'screenshots',
  );
  await mkdir(screenshotsDir, { recursive: true });
  let testApp: Awaited<ReturnType<typeof createTestApp>> | undefined;
  let bridge: Server | undefined;
  let vite: ViteDevServer | undefined;
  let browser: Browser | undefined;
  const cleanup = async () => {
    await browser?.close();
    await vite?.close();
    if (bridge?.listening)
      await new Promise<void>((resolve, reject) =>
        bridge!.close((error) => (error ? reject(error) : resolve())),
      );
    await testApp?.close();
    await rm(directory, { recursive: true, force: true });
  };
  try {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      env: OA_TEST_DATABASE_ENV,
      server: OA_TEST_SERVER,
      config: {
        app: { publicOrigin: OA_TEST_ORIGIN },
        secrets: { keys: [{ version: 1, key: 'b'.repeat(64) }] },
      },
    });
    testApp = app;
    // The installed development proxy maps the browser origin to this isolated backend origin.
    bridge = createHttpServer(async (incoming, outgoing) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
        const headers = new Headers();
        for (const [key, value] of Object.entries(incoming.headers)) {
          if (key === 'host' || !value) continue;
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
        // Only the installed proxy's own isolated target is adapted; foreign Origin is never trusted.
        if (headers.get('origin') === apiOrigin)
          headers.set('origin', OA_TEST_ORIGIN);
        const referer = headers.get('referer');
        if (referer?.startsWith(apiOrigin + '/'))
          headers.set(
            'referer',
            OA_TEST_ORIGIN + referer.slice(apiOrigin.length),
          );
        const method = incoming.method ?? 'GET';
        const response = await app.fetch(
          new Request(`${OA_TEST_ORIGIN}${incoming.url ?? '/'}`, {
            method,
            headers,
            ...(!['GET', 'HEAD'].includes(method)
              ? { body: Buffer.concat(chunks) }
              : {}),
          }),
        );
        outgoing.statusCode = response.status;
        for (const [key, value] of response.headers)
          if (key !== 'set-cookie') outgoing.setHeader(key, value);
        const cookies = response.headers.getSetCookie();
        if (cookies.length) outgoing.setHeader('set-cookie', cookies);
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        outgoing.statusCode = 500;
        outgoing.end('Isolated browser bridge failed.');
      }
    });
    await new Promise<void>((resolve, reject) => {
      bridge!.once('error', reject);
      bridge!.listen(apiPort, '127.0.0.1', resolve);
    });
    const basePath = app.publicBasePath;
    const taskEnv = {
      APP_BASE_PATH: basePath,
      PROXY_TARGET_URL: `${apiOrigin}${basePath}/`,
      APP_VITE_DEV_PORT: String(vitePort),
      AGENT_ANNOTATIONS_ENABLED: 'false',
    };
    const prior = new Map(
      Object.keys(taskEnv).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, taskEnv);
    try {
      const loaded = await loadConfigFromFile(
        { command: 'serve', mode: 'development' },
        path.resolve('vite.config.ts'),
      );
      if (!loaded)
        throw new Error('Application Vite configuration was unavailable.');
      vite = await createViteServer({
        ...loaded.config,
        configFile: false,
        cacheDir: path.join(directory, 'vite-cache'),
        server: {
          ...loaded.config.server,
          port: vitePort,
          host: '127.0.0.1',
          strictPort: true,
          watch: null,
          hmr: false,
        },
      });
      await vite.listen();
    } finally {
      for (const [key, value] of prior)
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    const launched = await chromium.launch({ headless: true });
    browser = launched;
    return {
      testApp: app,
      browser: launched,
      origin,
      basePath,
      screenshotsDir,
      async pageFor(session: TestSession, options: BrowserContextOptions = {}) {
        const context = await launched.newContext({
          viewport: { width: 1365, height: 900 },
          ...options,
        });
        await context.addCookies(
          session.cookie
            .split(';')
            .filter(Boolean)
            .map((piece) => {
              const index = piece.indexOf('=');
              return {
                name: piece.slice(0, index).trim(),
                value: piece.slice(index + 1),
                url: `${origin}${basePath}/`,
                httpOnly: true,
                sameSite: 'Lax' as const,
              };
            }),
        );
        const page = await context.newPage();
        await page.addInitScript((locale) => {
          localStorage.setItem('nocobase.locale', locale);
        }, options.locale ?? 'en-US');
        return page;
      },
      close: cleanup,
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

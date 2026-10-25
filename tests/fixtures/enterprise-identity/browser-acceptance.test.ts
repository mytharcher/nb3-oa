// @vitest-environment node
import { it, vi } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createPerson } from '../../logic/employees/helpers.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'enterprise login and explicit linking are usable at 375px',
  async () => {
    const issuer = 'https://identity.example.test';
    vi.stubEnv('OA_OIDC_DISCOVERY_URL', issuer + '/discovery');
    vi.stubEnv('OA_OIDC_CLIENT_ID', 'synthetic-browser');
    vi.stubEnv('OA_OIDC_CLIENT_SECRET', 'synthetic-browser-secret');
    vi.stubEnv('OA_OIDC_LABEL', 'Company SSO');
    const originalFetch = globalThis.fetch;
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url === issuer + '/discovery')
        return Promise.resolve(
          Response.json({
            issuer,
            authorization_endpoint: issuer + '/authorize',
            token_endpoint: issuer + '/token',
            jwks_uri: issuer + '/keys',
            id_token_signing_alg_values_supported: ['RS256'],
          }),
        );
      return originalFetch(input, init);
    });
    let h: Awaited<ReturnType<typeof startIsolatedBrowserApp>> | undefined;
    try {
      h = await startIsolatedBrowserApp({
        name: 'enterprise-identity',
        apiPort: 14163,
        vitePort: 15163,
      });
      const base = h.origin + h.basePath;
      const context = await h.browser.newContext({
        viewport: { width: 375, height: 812 },
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await page.addInitScript(() => {
        if (!localStorage.getItem('nocobase.locale'))
          localStorage.setItem('nocobase.locale', 'en-US');
      });
      await context.route(issuer + '/authorize**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<main>Synthetic identity provider</main>',
        }),
      );
    await page.goto(base + '/taskCenter');
    await expect(page).toHaveURL(/\/login\?redirect=%2FtaskCenter/);
      const login = page.getByRole('button', {
        name: 'Continue with Company SSO',
      });
      await expect(login).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'login-en-375.png'),
        fullPage: true,
      });
      const start = page.waitForResponse((response) =>
        response.url().includes('/auth/sign-in/social'),
      );
      await login.click();
      expect((await start).status()).toBe(200);
      await expect(page).toHaveURL(
        new RegExp('^https://identity\\.example\\.test/authorize'),
      );
      const url = new URL(page.url());
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('nonce')).toBeTruthy();
      await page.goto(base + '/login?ssoError=1');
      await page.evaluate(() => {
        localStorage.setItem('nocobase.locale', 'zh-CN');
        localStorage.setItem('nocobase:main:theme:color-scheme', 'dark');
      });
      await page.reload();
      await expect(page.getByRole('alert')).toContainText(
        '企业登录或关联未完成',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'login-error-zh-375.png'),
        fullPage: true,
      });
      const person = await createPerson(h.testApp, 'Enterprise user');
      const signedIn = await h.pageFor(await person.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      signedIn.setDefaultTimeout(30000);
      await signedIn
        .context()
        .route(issuer + '/authorize**', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: '<main>Synthetic identity provider</main>',
          }),
        );
      await signedIn.goto(base + '/');
      await signedIn.getByRole('button', { name: 'Open account menu' }).click();
      const link = signedIn.getByRole('menuitem', {
        name: 'Link enterprise account',
      });
      await expect(link).toBeVisible();
      await signedIn.screenshot({
        path: path.join(h.screenshotsDir, 'account-link-en-375.png'),
        fullPage: true,
      });
      const linking = signedIn.waitForResponse((response) =>
        response.url().includes('/auth/link-social'),
      );
      await link.click();
      expect((await linking).status()).toBe(200);
      await expect(signedIn).toHaveURL(
        new RegExp('^https://identity\\.example\\.test/authorize'),
      );
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks: [
              '375px password and SSO entry',
              'real authentication redirect with PKCE/state/nonce',
              'Chinese dark error state',
              'authenticated explicit linking entry',
            ],
            limitation:
              'Synthetic discovery and IdP page; callback security covered by PostgreSQL protocol test, not customer IdP interoperability.',
          },
          null,
          2,
        ),
      );
    } finally {
      await h?.close();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  },
  180000,
);

// @vitest-environment node
import { generateKeyPairSync, sign } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { createStandaloneServer } from '../../../server/standalone.js';
import { enterpriseOidcOptions } from '../../../server/config/enterprise-oidc-options.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
  OA_TEST_ORIGIN,
} from '../oa-test-origin.js';

it('links only explicitly and validates OIDC credentials before creating an OA session', async () => {
  const issuer = 'https://oidc.example.test';
  const options = enterpriseOidcOptions({
    OA_OIDC_DISCOVERY_URL: issuer + '/.well-known/openid-configuration',
    OA_OIDC_CLIENT_ID: 'oa-test',
    OA_OIDC_CLIENT_SECRET: 'synthetic-secret',
  })!;
  vi.stubEnv('OA_OIDC_DISCOVERY_URL', options.discoveryUrl);
  vi.stubEnv('OA_OIDC_CLIENT_ID', options.clientId);
  vi.stubEnv('OA_OIDC_CLIENT_SECRET', options.clientSecret);
  const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = {
    ...key.publicKey.export({ format: 'jwk' }),
    kid: 'test-key',
    alg: 'RS256',
    use: 'sig',
  };
  const codes = new Map<string, Record<string, unknown>>();
  const originalFetch = globalThis.fetch;
  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url === options.discoveryUrl)
        return Response.json({
          issuer,
          authorization_endpoint: issuer + '/authorize',
          token_endpoint: issuer + '/token',
          jwks_uri: issuer + '/keys',
          id_token_signing_alg_values_supported: ['RS256'],
        });
      if (url === issuer + '/keys') return Response.json({ keys: [jwk] });
      if (url === issuer + '/token') {
        const body = new URLSearchParams(String(init?.body ?? ''));
        const claims = codes.get(body.get('code') ?? '');
        if (!claims)
          return Response.json({ error: 'invalid_grant' }, { status: 400 });
        codes.delete(body.get('code')!);
        const header = Buffer.from(
          JSON.stringify({ alg: 'RS256', kid: 'test-key' }),
        ).toString('base64url');
        const payload = Buffer.from(JSON.stringify(claims)).toString(
          'base64url',
        );
        const content = `${header}.${payload}`;
        let signature = sign(
          'RSA-SHA256',
          Buffer.from(content),
          key.privateKey,
        ).toString('base64url');
        if (claims.testInvalidSignature)
          signature = (signature[0] === 'A' ? 'B' : 'A') + signature.slice(1);
        return Response.json({
          access_token: 'synthetic-access',
          token_type: 'Bearer',
          expires_in: 300,
          id_token: `${content}.${signature}`,
        });
      }
      return originalFetch(input, init);
    },
  );
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;
  try {
    app = await createTestApp({
      createServer: createStandaloneServer,
      env: OA_TEST_DATABASE_ENV,
      server: OA_TEST_SERVER,
      config: {
        app: { publicOrigin: OA_TEST_ORIGIN },
        secrets: { keys: [{ version: 1, key: 'd'.repeat(64) }] },
      },
    });
    const base = OA_TEST_ORIGIN + app.publicBasePath;
    const users = app.application.container.resolve(
      userAdministrationServiceToken,
    );
    const user = await users.create({
      name: 'OIDC employee',
      email: 'employee@oidc.example.test',
      password: 'synthetic-password',
    });
    const cookies = (response: Response) =>
      response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
    const post = (path: string, body: object, cookie = '') =>
      app!.fetch(
        new Request(base + '/api/auth/' + path, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: OA_TEST_ORIGIN,
            cookie,
          },
          body: JSON.stringify(body),
        }),
      );
    let seq = 0;
    async function authorize({
      cookie = '',
      link = false,
      claims = {},
      stateOverride,
    }: {
      cookie?: string;
      link?: boolean;
      claims?: Record<string, unknown>;
      stateOverride?: string;
    } = {}) {
      const response = await post(
        link ? 'link-social' : 'sign-in/social',
        {
          provider: options.providerId,
          callbackURL: base + '/taskCenter',
          errorCallbackURL: base + '/login?ssoError=1',
          disableRedirect: true,
        },
        cookie,
      );
      expect({
        status: response.status,
        error: response.ok ? undefined : await response.clone().text(),
      }).toEqual({ status: 200, error: undefined });
      const url = new URL((await response.json()).url);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('redirect_uri')).toBe(
        base + '/api/auth/callback/' + options.providerId,
      );
      const code = `synthetic-code-${++seq}`;
      codes.set(code, {
        iss: issuer,
        aud: 'oa-test',
        sub: 'employee-subject',
        email: user.email,
        email_verified: true,
        name: 'Identity display must not replace OA',
        nonce: url.searchParams.get('nonce'),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
        ...claims,
      });
      const callback =
        base +
        '/api/auth/callback/' +
        options.providerId +
        '?code=' +
        code +
        '&state=' +
        encodeURIComponent(stateOverride ?? url.searchParams.get('state')!);
      const callbackCookie = [cookie, cookies(response)]
        .filter(Boolean)
        .join('; ');
      const result = await app!.fetch(
        new Request(callback, { headers: { cookie: callbackCookie } }),
      );
      return { result, callback, callbackCookie };
    }
    // Matching verified email must not silently bind an unlinked identity.
    const unlinked = await authorize();
    expect(unlinked.result.headers.get('location')).toContain('ssoError=1');
    expect(cookies(unlinked.result)).not.toContain('session_token=');
    const local = await post('sign-in/email', {
      email: user.email,
      password: 'synthetic-password',
    });
    expect(local.status).toBe(200);
    const mismatch = await authorize({
      link: true,
      cookie: cookies(local),
      claims: { email: 'different@oidc.example.test' },
    });
    expect(mismatch.result.headers.get('location')).not.toBe(
      base + '/taskCenter',
    );
    const linked = await authorize({ link: true, cookie: cookies(local) });
    expect(linked.result.headers.get('location')).toBe(base + '/taskCenter');
    const valid = await authorize();
    expect(valid.result.headers.get('location')).toBe(base + '/taskCenter');
    expect(cookies(valid.result)).toContain('session_token=');
    const session = await app.fetch(
      new Request(base + '/api/auth/get-session', {
        headers: { cookie: cookies(valid.result) },
      }),
    );
    expect((await session.json()).user).toMatchObject({
      id: user.id,
      name: 'OIDC employee',
    });
    const signOut = await post('sign-out', {}, cookies(valid.result));
    expect(signOut.status).toBe(200);
    const signedOut = await app.fetch(
      new Request(base + '/api/auth/get-session', {
        headers: { cookie: cookies(valid.result) },
      }),
    );
    expect(await signedOut.json()).toBeNull();
    const replay = await app.fetch(
      new Request(valid.callback, {
        headers: { cookie: valid.callbackCookie },
      }),
    );
    expect(replay.headers.get('location')).not.toBe(base + '/taskCenter');
    for (const claims of [
      { iss: 'https://wrong.example' },
      { aud: 'wrong-client' },
      { nonce: 'wrong-nonce' },
      { exp: 1 },
      { testInvalidSignature: true },
      { sub: 'unknown-subject', email: 'unknown@oidc.example.test' },
    ]) {
      const refused = await authorize({ claims });
      expect(refused.result.headers.get('location')).not.toBe(
        base + '/taskCenter',
      );
      expect(cookies(refused.result)).not.toContain('session_token=');
    }
    const badState = await authorize({ stateOverride: 'tampered-state' });
    expect(badState.result.headers.get('location')).not.toBe(
      base + '/taskCenter',
    );
    await users.disable(user.id);
    const disabled = await authorize();
    expect(disabled.result.headers.get('location')).not.toBe(
      base + '/taskCenter',
    );
    expect(cookies(disabled.result)).not.toContain('session_token=');
  } finally {
    await app?.close();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
}, 120000);

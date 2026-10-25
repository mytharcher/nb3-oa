import { expect, it } from 'vitest';
import {
  enterpriseAccountSubject,
  enterpriseOidcOptions,
} from '../../../server/config/enterprise-oidc-options.js';
const env = {
  OA_OIDC_DISCOVERY_URL:
    'https://identity.example/.well-known/openid-configuration',
  OA_OIDC_CLIENT_ID: 'oa-test',
  OA_OIDC_CLIENT_SECRET: 'synthetic-secret',
};
it('namespaces the external subject by issuer, even when a discovery URL is reused', () => {
  const identity = (iss: string, sub: string) =>
    enterpriseAccountSubject({
      tokens: {
        idToken: `header.${Buffer.from(JSON.stringify({ iss, sub })).toString('base64url')}.signature`,
      },
    });
  expect(identity('https://issuer-one', 'subject')).not.toBe(
    identity('https://issuer-two', 'subject'),
  );
  expect(identity('https://issuer-one', 'subject')).toBe(
    identity('https://issuer-one', 'subject'),
  );
  expect(() => enterpriseAccountSubject({ tokens: {} })).toThrow();
});
it('disables unconfigured SSO and rejects partial or unsafe configuration', () => {
  expect(enterpriseOidcOptions({})).toBeUndefined();
  expect(() => enterpriseOidcOptions({ OA_OIDC_CLIENT_ID: 'one' })).toThrow();
  for (const url of [
    'http://identity.example/discovery',
    'https://one:two@identity.example/discovery',
    'https://identity.example/discovery?secret=test',
    'https://identity.example/discovery#part',
  ])
    expect(() =>
      enterpriseOidcOptions({ ...env, OA_OIDC_DISCOVERY_URL: url }),
    ).toThrow();
});
it('binds provider identity to discovery location and rejects implicit account creation', () => {
  const options = enterpriseOidcOptions(env)!;
  expect(options).toMatchObject({
    pkce: true,
    requireIdTokenVerification: true,
    disableImplicitSignUp: true,
    disableSignUp: true,
    overrideUserInfo: false,
  });
  expect(options.providerId).toBe(
    enterpriseOidcOptions({ ...env, OA_OIDC_CLIENT_SECRET: 'rotated' })!
      .providerId,
  );
  expect(options.providerId).not.toBe(
    enterpriseOidcOptions({
      ...env,
      OA_OIDC_DISCOVERY_URL:
        'https://other.example/.well-known/openid-configuration',
    })!.providerId,
  );
  expect(options.providerId).not.toContain('synthetic');
});

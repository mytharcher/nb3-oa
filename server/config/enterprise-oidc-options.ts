import { createHash } from 'node:crypto';
import { genericOAuth } from 'better-auth/plugins';

/** genericOAuth calls this only after its required ID-token verification succeeds. */
export function enterpriseAccountSubject({
  tokens,
}: {
  tokens: { idToken?: string };
}): string {
  if (!tokens.idToken) throw new Error('Verified OIDC identity is required.');
  const claims = JSON.parse(
    Buffer.from(tokens.idToken.split('.')[1] ?? '', 'base64url').toString(
      'utf8',
    ),
  ) as { iss?: unknown; sub?: unknown };
  if (
    typeof claims.iss !== 'string' ||
    !claims.iss ||
    typeof claims.sub !== 'string' ||
    !claims.sub
  )
    throw new Error('OIDC issuer and subject are required.');
  return createHash('sha256')
    .update(JSON.stringify([claims.iss, claims.sub]))
    .digest('hex');
}

/** Environment-owned OIDC setup: never include its credentials in public config. */
export function enterpriseOidcOptions(
  env: Partial<NodeJS.ProcessEnv> = process.env,
) {
  const discoveryUrl = env.OA_OIDC_DISCOVERY_URL?.trim();
  const clientId = env.OA_OIDC_CLIENT_ID?.trim();
  const clientSecret = env.OA_OIDC_CLIENT_SECRET;
  if (!discoveryUrl && !clientId && !clientSecret) return undefined;
  if (!discoveryUrl || !clientId || !clientSecret)
    throw new Error(
      'OA_OIDC_DISCOVERY_URL, OA_OIDC_CLIENT_ID and OA_OIDC_CLIENT_SECRET must be configured together.',
    );
  let url: URL;
  try {
    url = new URL(discoveryUrl);
  } catch {
    throw new Error('OIDC discovery must use an absolute HTTPS URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'OIDC discovery must use HTTPS without credentials, query or fragment.',
    );
  const providerId = `oa-oidc-${createHash('sha256').update(url.href).digest('hex').slice(0, 24)}`;
  return {
    providerId,
    ...(env.OA_OIDC_LABEL?.trim() ? { name: env.OA_OIDC_LABEL.trim() } : {}),
    discoveryUrl: url.href,
    clientId,
    clientSecret,
    scopes: ['openid', 'profile', 'email'],
    pkce: true,
    requireIdTokenVerification: true,
    accountSubject: enterpriseAccountSubject,
    disableImplicitSignUp: true,
    disableSignUp: true,
    overrideUserInfo: false,
  };
}
export function enterpriseOidcPlugin() {
  const config = enterpriseOidcOptions();
  return config ? [genericOAuth({ config: [config] })] : [];
}

import { resolveAppUrl, useClientApplication } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { authReturnPath } from '#lib/auth-return-path';

export function useEnterpriseIdentity() {
  const config = useClientApplication().config.public;
  const { client } = useAuthentication();
  const { t } = useTranslation();
  const location = useLocation();
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(false);
  const enabled = config.get('enterpriseIdentity.enabled', false);
  const providerId = config.get('enterpriseIdentity.providerId', '');
  const label =
    config.get('enterpriseIdentity.label', '') ||
    t('enterpriseIdentity.provider');
  const failedCallback = new URLSearchParams(location.search).has('ssoError');

  async function start(link = false) {
    if (!enabled || !providerId || pendingRef.current) return;
    pendingRef.current = true;
    setIsPending(true);
    setError(false);
    try {
      const target = link
        ? location.pathname + location.search
        : new URLSearchParams(location.search).get('redirect');
      const callbackURL = resolveAppUrl(authReturnPath(target));
      const errorCallbackURL = resolveAppUrl(
        link
          ? '/?ssoError=1'
          : `/login?ssoError=1&redirect=${encodeURIComponent(authReturnPath(target))}`,
      );
      const result = link
        ? await client.linkSocial({
            provider: providerId,
            callbackURL,
            errorCallbackURL,
          })
        : await client.signIn.social({
            provider: providerId,
            callbackURL,
            errorCallbackURL,
          });
      if (result.error) setError(true);
    } catch {
      setError(true);
    } finally {
      pendingRef.current = false;
      setIsPending(false);
    }
  }
  return {
    enabled,
    providerId,
    label,
    isPending,
    error: error || failedCallback,
    start,
  };
}

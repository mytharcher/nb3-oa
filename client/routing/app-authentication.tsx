import {
  GuestAuthentication,
  RequiredAuthentication,
  useAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { authReturnPath } from '#lib/auth-return-path';

/** Preserve notification deep links around the plugin's session guard. */
export function AppRequiredAuthentication({
  children,
}: {
  children: ReactNode;
}) {
  const { session, isPending } = useAuthentication();
  const location = useLocation();
  if (!isPending && !session) {
    const redirect = authReturnPath(
      location.pathname + location.search + location.hash,
    );
    return (
      <Navigate
        replace
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
      />
    );
  }
  return <RequiredAuthentication>{children}</RequiredAuthentication>;
}

export function AppGuestAuthentication({ children }: { children: ReactNode }) {
  const { session, isPending } = useAuthentication();
  const { search } = useLocation();
  if (!isPending && session)
    return (
      <Navigate
        replace
        to={authReturnPath(new URLSearchParams(search).get('redirect'))}
      />
    );
  return <GuestAuthentication>{children}</GuestAuthentication>;
}

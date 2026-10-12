import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
export function Identity({ children }: { children: ReactNode }) {
  const { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  return (
    <Fragment key={`${session?.user.id}:${revision}`}>{children}</Fragment>
  );
}

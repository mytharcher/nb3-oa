import type { ReactNode } from 'react';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
export function KnowledgeIdentity({ children }: { children: ReactNode }) {
  const { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  return (
    <Identity key={`${session?.user.id}:${revision}`}>{children}</Identity>
  );
}
function Identity({ children }: { children: ReactNode }) {
  return children;
}

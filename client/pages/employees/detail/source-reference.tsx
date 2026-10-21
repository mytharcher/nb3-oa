import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation } from 'react-router';
import { employeeSourceKey } from './source-label.js';
const routes = {
  onboarding: 'sourceOnboarding',
  departure: 'sourceDeparture',
  transfer: 'sourceTransfer',
  probation: 'sourceProbation',
} as const;
/** Each source independently checks its business view capability; the source API still enforces record scopes. */
export function SourceReference({ source }: { source: string | null }) {
  const { t } = useTranslation();
  const location = useLocation();
  const match =
    /^oa\.(onboarding|departure|transfer|probation):([A-Za-z0-9_-]+)(?::cancel)?$/.exec(
      source ?? '',
    );
  const kind = match?.[1] as keyof typeof routes | undefined;
  const permission = useCan({
    resource: { type: 'composite', id: `oa.${kind ?? 'onboarding'}` },
    action: 'view',
  });
  const key = employeeSourceKey(source);
  if (!key) return <span className='text-muted-foreground'>—</span>;
  if (
    !kind ||
    !match ||
    !permission.can ||
    permission.isPending ||
    permission.error
  )
    return <span>{t(key)}</span>;
  return (
    <Link
      className='font-medium underline-offset-4 hover:underline'
      to={{
        pathname: `${routes[kind]}/${encodeURIComponent(match[2])}`,
        search: location.search,
        hash: location.hash,
      }}
    >
      {t(key)}
    </Link>
  );
}

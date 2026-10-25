import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link } from 'react-router';

const rules = [
  ['permission-sets', 'read', 'sets'],
  ['default-access', 'read', 'default'],
  ['sharing-rules', 'read', 'sharing'],
  ['restriction-rules', 'read', 'restriction'],
  ['inspector', 'inspect', 'inspect'],
] as const;

/** Advanced policy tools remain reachable from the role workspace, under their own grants. */
export function PermissionGuide() {
  const { t } = useTranslation();
  return (
    <details className='rounded-lg border p-3 text-sm'>
      <summary className='cursor-pointer font-medium'>
        {t('access.guide.title')}
      </summary>
      <p className='mt-3 text-muted-foreground'>{t('access.guide.roles')}</p>
      <ul className='mt-3 space-y-3'>
        {rules.map(([path, action, label]) => (
          <RuleLink key={path} path={path} action={action} label={label} />
        ))}
      </ul>
    </details>
  );
}
function RuleLink({
  path,
  action,
  label,
}: {
  path: string;
  action: string;
  label: string;
}) {
  const { t } = useTranslation();
  const grant = useCan({
    resource: { type: 'settings', id: `authorization.${path}` },
    action,
  });
  if (!grant.can || grant.isPending || grant.error) return null;
  return (
    <li>
      <Link
        className='font-medium text-primary underline underline-offset-4'
        to={`/${path}`}
      >
        {t(`access.guide.${label}Title`)}
      </Link>
      <p className='mt-1 text-muted-foreground'>{t(`access.guide.${label}`)}</p>
    </li>
  );
}

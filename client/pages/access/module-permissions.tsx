import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import type { AuthorizationOptions } from './types.js';
import { domainResources } from './domains.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';

/** Navigation filters only; every draft retains its complete permission definition. */
export function AccessModulePermissions({
  options,
  enabled,
  children,
  onNavigate = (navigate) => navigate(),
  defaultAll = false,
}: {
  options: AuthorizationOptions;
  defaultAll?: boolean;
  enabled: ReadonlySet<string>;
  children: (keys: ReadonlySet<string>) => ReactNode;
  onNavigate?: (navigate: () => void) => void;
}) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const domains = domainResources(options);
  const selected = domains.find(
    (domain) => domain.value === params.get('accessModule'),
  );
  const initial =
    domains.find((domain) =>
      domain.resources.some((item) =>
        enabled.has(resourceKey(item.type, item.value)),
      ),
    ) ?? domains[0];
  const active =
    selected?.value ??
    (defaultAll || params.get('accessModule') === 'all'
      ? 'all'
      : (initial?.value ?? 'all'));
  const choices = [
    { value: 'all', resources: domains.flatMap((domain) => domain.resources) },
    ...domains,
  ];
  const current = choices.find((domain) => domain.value === active)!;
  return (
    <div className='grid min-w-0 gap-4 md:grid-cols-[11rem_minmax(0,1fr)]'>
      <nav
        aria-label={t('access.businessModules')}
        className='flex flex-wrap content-start gap-1 md:flex-col'
      >
        {choices.map((domain) => (
          <Button
            key={domain.value}
            variant={active === domain.value ? 'secondary' : 'ghost'}
            className='justify-between whitespace-normal text-left'
            aria-current={active === domain.value ? 'page' : undefined}
            onClick={() =>
              onNavigate(() =>
                setParams(
                  (previous) => {
                    const next = new URLSearchParams(previous);
                    next.set('accessModule', domain.value);
                    return next;
                  },
                  { replace: true },
                ),
              )
            }
          >
            <span>
              {domain.value === 'all'
                ? t('access.allModules')
                : t(`oa.navigation.${domain.value}`)}
            </span>
            <span className='text-xs text-muted-foreground'>
              {
                domain.resources.filter((item) =>
                  enabled.has(resourceKey(item.type, item.value)),
                ).length
              }
            </span>
          </Button>
        ))}
      </nav>
      <div className='min-w-0'>
        {children(
          new Set(
            current.resources.map((item) => resourceKey(item.type, item.value)),
          ),
        )}
      </div>
    </div>
  );
}

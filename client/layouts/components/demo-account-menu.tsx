import { useApiClient, useToaster } from '@nocobase/app-client';
import { useDemoAccounts } from '@nocobase/app-plugin-demo-mode/client/accounts';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { useLocation } from 'react-router';
import { Badge } from '#components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';

const namespace = '@nocobase/app-plugin-demo-mode';

/** The plugin owns account loading and session switching; OA owns row presentation. */
export function DemoAccountMenu() {
  const api = useApiClient();
  const { data } = useQuery({
    queryKey: ['demoAccountMenu', 'status'],
    queryFn: async () =>
      (
        await api.request<{ data: { enabled: boolean } }>({
          path: 'demoMode/status',
        })
      ).data,
  });
  return data?.enabled ? <EnabledDemoAccountMenu /> : null;
}

function EnabledDemoAccountMenu() {
  const api = useApiClient();
  const { accounts, signIn } = useDemoAccounts();
  const { t } = useTranslation(namespace);
  const { t: appText } = useTranslation();
  const toaster = useToaster();
  const location = useLocation();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const {
    data: labels,
    isError,
    isPending,
  } = useQuery({
    queryKey: ['demoAccountMenu', 'roles'],
    enabled: open,
    retry: false,
    queryFn: async () =>
      (
        await api.request<{ data: { username: string; roles: string[] }[] }>({
          path: 'demoAccountRoles',
        })
      ).data,
    staleTime: 0,
  });
  const current = accounts?.find((account) => account.current);
  const enter = async (username: string) => {
    if (pending !== null || username === current?.username) return;
    setPending(username);
    try {
      await signIn(
        username,
        `${location.pathname}${location.search}${location.hash}`,
      );
    } catch {
      setPending(null);
      toaster.show({ type: 'error', title: t('accounts.failed') });
    }
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        openOnHover
        delay={0}
        aria-label={`${t('menu.label')} · ${t('menu.switchAccount')}`}
        className='inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary outline-none transition-colors hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <span
          aria-hidden
          className='size-1.5 shrink-0 rounded-full bg-primary'
        />
        <span>{t('menu.label')}</span>
        <span className='hidden font-normal sm:inline'>
          · {t('menu.switchAccount')}
        </span>
        <ChevronDown aria-hidden className='size-3.5 shrink-0 opacity-70' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        aria-describedby={descriptionId}
        className='w-80 max-w-[calc(100vw-2rem)] duration-0'
      >
        <div className='px-2 py-1.5'>
          <p className='text-sm font-medium'>{t('menu.title')}</p>
          <p
            id={descriptionId}
            className='mt-0.5 text-xs text-muted-foreground'
          >
            {t('menu.description')} {t('menu.accountsDescription')}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('menu.switchAccount')}</DropdownMenuLabel>
          {accounts?.length ? (
            <DropdownMenuRadioGroup
              value={current?.username ?? ''}
              aria-label={t('menu.switchAccount')}
              aria-busy={pending !== null}
              onValueChange={(username: string) => void enter(username)}
            >
              {accounts.map((account) => {
                const roles =
                  labels?.find((entry) => entry.username === account.username)
                    ?.roles ?? [];
                const tags = roles.length
                  ? roles.map((role) =>
                      role === 'administrator'
                        ? t('accounts.administrator')
                        : appText(`demoData.roles.${role}`),
                    )
                  : account.role
                    ? [account.role]
                    : [
                        t(
                          isError
                            ? 'accounts.rolesUnavailable'
                            : isPending
                              ? 'accounts.rolesLoading'
                              : 'accounts.noRole',
                        ),
                      ];
                return (
                  <DropdownMenuRadioItem
                    key={account.username}
                    value={account.username}
                    disabled={pending !== null}
                    closeOnClick={false}
                  >
                    <span className='flex min-w-0 flex-1 flex-col gap-1'>
                      <span className='flex min-w-0 flex-wrap items-center gap-1.5'>
                        <span className='min-w-0 truncate' title={account.name}>
                          {account.name}
                        </span>
                        {tags.map((tag) => (
                          <Badge key={tag} variant='secondary'>
                            {tag}
                          </Badge>
                        ))}
                      </span>
                      {pending === account.username && (
                        <span
                          role='status'
                          className='text-xs text-muted-foreground'
                        >
                          {t('accounts.entering')}
                        </span>
                      )}
                    </span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          ) : (
            <p
              role='status'
              className='px-2 py-1.5 text-xs text-muted-foreground'
            >
              {t(accounts === null ? 'menu.loading' : 'accounts.unavailable')}
            </p>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

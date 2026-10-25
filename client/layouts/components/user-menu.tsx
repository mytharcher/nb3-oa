import { UserName, UserAvatar } from '#components/user-name';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { IdCard, Link2, LogOut } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { useEnterpriseIdentity } from '#hooks/use-enterprise-identity';
import { Link } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';

import { LanguageSwitcher } from './language-switcher.js';

export function UserMenu(): ReactElement {
  const { client, session, refresh } = useAuthentication();
  const identity = session?.user
    ? {
        id: session.user.id,
        fullName: session.user.name,
        email: session.user.email,
        avatar: session.user.image ?? undefined,
      }
    : null;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t } = useTranslation();
  const toaster = useToaster();
  const enterprise = useEnterpriseIdentity();
  useEffect(() => {
    if (enterprise.error)
      toaster.show({ type: 'error', title: t('enterpriseIdentity.failed') });
  }, [enterprise.error, toaster, t]);

  const name =
    identity?.fullName ||
    identity?.email ||
    t('account.fallback', { defaultValue: 'Account' });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        openOnHover
        delay={0}
        aria-label={t('account.openMenu', {
          defaultValue: 'Open account menu',
        })}
        className='flex max-w-48 min-h-10 cursor-pointer items-center gap-2 rounded-full px-2 text-left text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <span className='sm:hidden'>
          <UserAvatar name={name} />
        </span>
        <span className='hidden min-w-0 sm:inline-flex'>
          <UserName name={name} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <div className='px-2 py-1.5'>
          <p className='text-sm font-medium'>
            <UserName name={name} />
          </p>
          {identity?.email ? (
            <p className='truncate text-xs text-muted-foreground'>
              {identity.email}
            </p>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {/* Personal reads have their own authenticated /me contract; the HR route requires separate grants. */}
        <DropdownMenuItem render={<Link to='/personal-archive' />}>
          <IdCard className='size-4' />
          {t('employees.personal.title')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LanguageSwitcher />
        {enterprise.enabled ? (
          <DropdownMenuItem
            disabled={enterprise.isPending}
            onClick={() => {
              void enterprise.start(true);
            }}
          >
            <Link2 className='size-4' />
            {t('enterpriseIdentity.link')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onClick={() => {
            void (async () => {
              setIsLoggingOut(true);
              try {
                // Better Auth returns API failures as data rather than throwing.
                const result = await client.signOut();
                if (result.error) {
                  toaster.show({
                    type: 'error',
                    title: t('account.signOutFailed', {
                      defaultValue: 'Unable to sign out. Please try again.',
                    }),
                  });
                  return;
                }
                await refresh();
              } catch {
                toaster.show({
                  type: 'error',
                  title: t('account.signOutFailed', {
                    defaultValue: 'Unable to sign out. Please try again.',
                  }),
                });
              } finally {
                setIsLoggingOut(false);
              }
            })();
          }}
          className='gap-2'
        >
          <LogOut className='size-4' />
          {isLoggingOut
            ? t('account.signingOut', { defaultValue: 'Signing out…' })
            : t('account.signOut', { defaultValue: 'Sign out' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

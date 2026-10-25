import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import {
  requestActionDefinitions,
  requestActionGroups,
  employeeRequestActions,
  requestCatalogGroups,
  requestCatalogGroup,
  defaultRequestActions,
  type RequestActionAvailability,
  type RequestActionKey,
} from './request-action-definitions.js';
import { useTranslation } from '@nocobase/i18n/client';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutGrid, Star } from 'lucide-react';
import { useRequestPreferences } from '#hooks/use-request-preferences';
import type { EmployeeRequestKey } from '../../shared/request-catalog.js';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '#components/ui/dialog';

type Props = { available: RequestActionAvailability; onSelect?: () => void };

function ActionLink({
  action,
  onSelect,
}: {
  action: (typeof requestActionDefinitions)[number];
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const Icon = action.icon;
  return (
    <Button
      data-slot='request-action-card'
      data-area={requestActionGroups[action.key]}
      variant='outline'
      size='lg'
      className='h-16 w-full min-w-0 justify-start gap-3 px-4 text-left whitespace-normal has-data-[icon=inline-start]:pl-4'
      render={
        <Link
          to={{
            pathname: action.to,
            search: location.search,
            hash: location.hash,
          }}
        />
      }
      nativeButton={false}
      onClick={onSelect}
    >
      <Icon data-icon='inline-start' aria-hidden='true' />
      <span className='min-w-0 break-words'>{t(action.label)}</span>
    </Button>
  );
}

/** Shared catalog: permissions are resolved by each caller before presentation. */
export function RequestActions({
  available,
  onSelect,
  favorites,
  onFavorite,
  saving = false,
  preferences: suppliedPreferences,
}: Props & {
  favorites?: RequestActionKey[];
  onFavorite?: (key: RequestActionKey) => void;
  saving?: boolean;
  preferences?: ReturnType<typeof useRequestPreferences>;
}) {
  const { t } = useTranslation();
  const ownPreferences = useRequestPreferences(!suppliedPreferences);
  const preferences = suppliedPreferences ?? ownPreferences;
  const [search, setSearch] = useState('');
  const select = (key: RequestActionKey) => {
    preferences.record(key as EmployeeRequestKey);
    onSelect?.();
  };
  const actions = employeeRequestActions.filter(
    ({ key, label }) =>
      available[key] &&
      t(label).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className='flex flex-col gap-4'>
      <Input
        aria-label={t('workbench.searchRequests')}
        placeholder={t('workbench.searchRequests')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {!actions.length ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('workbench.noMatchingRequests')}
        </p>
      ) : null}
      {!search.trim() && preferences.data?.recent.length ? (
        <section
          aria-label={t('workbench.recentRequests')}
          className='flex flex-col gap-2'
        >
          <h3 className='text-sm font-medium'>
            {t('workbench.recentRequests')}
          </h3>
          <div className='grid gap-3 sm:grid-cols-2'>
            {preferences.data.recent
              .map((key) =>
                employeeRequestActions.find(
                  (action) => action.key === key && available[key],
                ),
              )
              .filter((action) => !!action)
              .map((action) => (
                <ActionLink
                  key={action.key}
                  action={action}
                  onSelect={() => select(action.key)}
                />
              ))}
          </div>
        </section>
      ) : null}
      {requestCatalogGroups.map((group) => {
        const rows = actions.filter(
          ({ key }) => requestCatalogGroup[key] === group,
        );
        return rows.length ? (
          <section
            key={group}
            aria-label={t(`workbench.catalogGroups.${group}`)}
            className='flex flex-col gap-2'
          >
            <h3 className='text-sm font-medium'>
              {t(`workbench.catalogGroups.${group}`)}
            </h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              {rows.map((action) => (
                <div
                  key={action.key}
                  className='flex min-w-0 items-center gap-1'
                >
                  <div className='min-w-0 flex-1'>
                    <ActionLink
                      action={action}
                      onSelect={() => select(action.key)}
                    />
                  </div>
                  {onFavorite && favorites ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon'
                            className='shrink-0'
                            aria-label={t('workbench.favorite', {
                              name: t(action.label),
                            })}
                            aria-pressed={favorites.includes(action.key)}
                            disabled={
                              saving ||
                              (favorites.length >= 6 &&
                                !favorites.includes(action.key))
                            }
                            onClick={() => onFavorite(action.key)}
                          />
                        }
                      >
                        <Star
                          className={
                            favorites.includes(action.key)
                              ? 'fill-current'
                              : undefined
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('workbench.favorite', { name: t(action.label) })}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      })}
    </div>
  );
}

export function FavoriteRequestActions({ available }: Props) {
  const { t } = useTranslation();
  const preferences = useRequestPreferences();
  const [open, setOpen] = useState(false);
  const defaults = [
    ...defaultRequestActions,
    ...employeeRequestActions.map(({ key }) => key),
  ];
  const favorites = [...new Set(preferences.data?.favorites ?? defaults)]
    .filter(
      (key) =>
        available[key] &&
        employeeRequestActions.some((action) => action.key === key),
    )
    .slice(0, 6);
  return (
    <div className='flex flex-col gap-4'>
      {preferences.error ? (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-2 text-sm text-destructive'
        >
          {t('workbench.preferencesLoadFailed')}
          <Button variant='outline' onClick={preferences.retry}>
            {t('workbench.refresh')}
          </Button>
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className='grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-3'>
          {favorites.map((key) => (
            <ActionLink
              key={key}
              action={employeeRequestActions.find(
                (action) => action.key === key,
              )!}
              onSelect={() => preferences.record(key as EmployeeRequestKey)}
            />
          ))}
          <DialogTrigger
            data-slot='request-action-card'
            className='h-16 w-full min-w-0 justify-start gap-3 border-dashed bg-transparent px-4 text-left whitespace-normal text-muted-foreground has-data-[icon=inline-start]:pl-4'
            render={<Button variant='outline' size='lg' />}
          >
            <LayoutGrid data-icon='inline-start' aria-hidden='true' />
            <span className='min-w-0 break-words'>
              {t('workbench.allRequests')}
            </span>
          </DialogTrigger>
        </div>
        <FormDrawerContent>
          <FormDrawerHeader>
            <DialogTitle>{t('workbench.allRequests')}</DialogTitle>
            <DialogDescription>
              {t('workbench.favoritesHint')}
            </DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            <RequestActions
              available={available}
              onSelect={() => setOpen(false)}
              favorites={favorites}
              preferences={preferences}
              saving={preferences.saving || !preferences.data}
              onFavorite={(key) =>
                void preferences.save(
                  (favorites.includes(key)
                    ? favorites.filter((item) => item !== key)
                    : [...favorites, key].slice(0, 6)) as EmployeeRequestKey[],
                )
              }
            />
          </FormDrawerBody>
          <FormDrawerFooter>
            {preferences.saveError ? (
              <p role='alert' className='w-full text-sm text-destructive'>
                {t('workbench.saveFailed')}
              </p>
            ) : null}
            <Button
              variant='outline'
              disabled={preferences.saving || !preferences.data}
              onClick={() => void preferences.save(null)}
            >
              {t('workbench.resetFavorites')}
            </Button>
          </FormDrawerFooter>
        </FormDrawerContent>
      </Dialog>
    </div>
  );
}

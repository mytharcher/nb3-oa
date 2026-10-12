import { InputGroupAddon } from '#components/ui/input-group';
import { UserAvatar, UserName } from '#components/user-name';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { XIcon } from 'lucide-react';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '#components/ui/combobox';

/** An authentication user as the picker shows it. */
export interface UserOption {
  readonly id: string;
  readonly name: string;
  readonly username?: string | null;
  readonly email?: string | null;
}

interface UserPickerBaseProps {
  /** The input's id, for `FieldLabel htmlFor`. */
  readonly id?: string;
  readonly onBlur?: () => void;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
  /**
   * Users the current value names, with their names: the endpoint that returned the record should return them
   * (for example `head: { id, name }` beside `headUserId`). `GET /api/users` cannot look a user up by id, so an id
   * missing from here and from the search results shows as the bare id.
   */
  readonly knownUsers?: readonly UserOption[];
  /** Users that may not be picked, such as people already in the list. */
  readonly excludeIds?: readonly string[];
  /** Include disabled accounts in the results. Defaults to `false`. */
  readonly includeDisabled?: boolean;
}

export interface UserPickerProps extends UserPickerBaseProps {
  /** The selected user's id; an empty string when none is selected. */
  readonly value: string;
  readonly onChange: (value: string, user: UserOption | null) => void;
}

export interface UserMultiPickerProps extends UserPickerBaseProps {
  /** The selected users' ids, in selection order. */
  readonly value: readonly string[];
  readonly onChange: (value: string[], users: UserOption[]) => void;
}

/** Results per search; the endpoint caps a page at 100. */
const SEARCH_PAGE_SIZE = 20;
const SEARCH_DELAY = 300;

interface ManagedUserPage {
  readonly data: {
    readonly id: string;
    readonly name: string;
    readonly username?: string | null;
    readonly email: string;
  }[];
  readonly meta: { page: number; pageSize: number; total: number };
}

interface SearchResult {
  readonly key: string;
  readonly users?: UserOption[];
  readonly error?: unknown;
}

/**
 * Searches `GET /api/users` (Users plugin; needs the `read` action on the `user` record type) by name, username and
 * email, debounced like a list's search box. The empty query lists the first page.
 */
function useUserSearch(
  query: string,
  includeDisabled: boolean,
): {
  readonly users: UserOption[];
  readonly loading: boolean;
  readonly error: unknown;
  readonly retry: () => void;
} {
  const api = useApiClient();
  const [debounced, setDebounced] = useState(query.trim());
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<SearchResult>();

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(query.trim()),
      SEARCH_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  const key = JSON.stringify([debounced, includeDisabled, reloadCount]);
  useEffect(() => {
    const controller = new AbortController();
    const requestKey = JSON.stringify([
      debounced,
      includeDisabled,
      reloadCount,
    ]);
    api
      .request<ManagedUserPage>({
        path: 'users',
        query: {
          q: debounced || undefined,
          pageSize: SEARCH_PAGE_SIZE,
          status: includeDisabled ? undefined : 'enabled',
        },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (controller.signal.aborted) return;
          setResult({
            key: requestKey,
            users: data.map((user) => ({
              id: user.id,
              name: user.name,
              username: user.username ?? null,
              email: user.email,
            })),
          });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) {
            setResult((previous) => ({ ...previous, key: requestKey, error }));
          }
        },
      );
    return () => controller.abort();
  }, [api, debounced, includeDisabled, reloadCount]);

  const loading = result?.key !== key || query.trim() !== debounced;
  return {
    users: result?.users ?? [],
    loading,
    error: result?.key === key ? result.error : undefined,
    retry: () => setReloadCount((count) => count + 1),
  };
}

/** Keeps every user the picker has seen, so a selected user keeps its name when the next search no longer returns it. */
function useUserDirectory(
  knownUsers: readonly UserOption[] | undefined,
  found: readonly UserOption[],
): {
  readonly resolve: (id: string) => UserOption;
  readonly remember: (users: readonly UserOption[]) => void;
} {
  const [picked, setPicked] = useState<ReadonlyMap<string, UserOption>>(
    () => new Map(),
  );
  const directory = useMemo(() => {
    const map = new Map<string, UserOption>(picked);
    for (const user of found) map.set(user.id, user);
    for (const user of knownUsers ?? []) map.set(user.id, user);
    return map;
  }, [picked, found, knownUsers]);
  const resolve = useCallback(
    (id: string): UserOption => directory.get(id) ?? { id, name: id },
    [directory],
  );
  return {
    resolve,
    remember: (users) =>
      setPicked((previous) => {
        const next = new Map(previous);
        for (const user of users) next.set(user.id, user);
        return next;
      }),
  };
}

function itemLabel(user: UserOption): string {
  return user.name;
}

function isSameUser(item: UserOption, current: UserOption): boolean {
  return item.id === current.id;
}

function UserOptionContent({
  user,
}: {
  readonly user: UserOption;
}): ReactElement {
  const secondary = user.email || user.username;
  return (
    <span className='flex min-w-0 flex-col'>
      <span className='truncate'>
        <UserName name={user.name} />
      </span>
      {secondary ? (
        <span className='truncate text-xs text-muted-foreground'>
          {secondary}
        </span>
      ) : null}
    </span>
  );
}

/** Explains a failed search in place of the control (guideline S4), as `CustomerPicker` in the handbook does. */
function UserPickerError({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401) {
    return <SessionExpiredAlert />;
  }
  const forbidden = error instanceof ApiClientError && error.status === 403;
  return (
    <div
      role='alert'
      className='flex items-center gap-2 text-sm text-destructive'
    >
      <span>
        {forbidden ? t('userPicker.forbidden') : t('userPicker.loadFailed')}
      </span>
      {forbidden ? null : (
        <Button type='button' variant='outline' size='sm' onClick={onRetry}>
          {t('status.retry')}
        </Button>
      )}
    </div>
  );
}

function UserResults({ loading }: { readonly loading: boolean }): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <ComboboxEmpty>
        {loading ? t('userPicker.searching') : t('userPicker.empty')}
      </ComboboxEmpty>
      <ComboboxList>
        {(user: UserOption) => (
          <ComboboxItem key={user.id} value={user}>
            <UserOptionContent user={user} />
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}

/**
 * Picks one authentication user by name, username or email. The value is the user's id (a string, `''` for none).
 * Use inside react-hook-form's `Controller` with `value={field.value}`, `onChange={field.onChange}`,
 * `onBlur={field.onBlur}` and `invalid={fieldState.invalid}`.
 */
export function UserPicker({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  placeholder,
  className,
  knownUsers,
  excludeIds,
  includeDisabled = false,
}: UserPickerProps): ReactElement {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const search = useUserSearch(query, includeDisabled);
  const { resolve, remember } = useUserDirectory(knownUsers, search.users);
  const selected = value ? resolve(value) : null;
  const items = useMemo(() => {
    const excluded = new Set(excludeIds);
    const list = search.users.filter((user) => !excluded.has(user.id));
    // Keep the selected user among the items, so the combobox can show and mark it.
    if (selected && !list.some((user) => user.id === selected.id)) {
      list.unshift(selected);
    }
    return list;
  }, [search.users, excludeIds, selected]);

  if (search.error) {
    return <UserPickerError error={search.error} onRetry={search.retry} />;
  }

  return (
    <Combobox
      items={items}
      // The endpoint already filtered by the typed text.
      filter={null}
      value={selected}
      onValueChange={(user: UserOption | null) => {
        if (user) remember([user]);
        onChange(user?.id ?? '', user);
      }}
      onInputValueChange={(text, details) => {
        // Only typing searches; selecting an item writes its name into the input, which is not a new query.
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        ) {
          setQuery(text);
        }
      }}
      onOpenChange={(open) => {
        if (!open) setQuery('');
      }}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={isSameUser}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        className={className}
        disabled={disabled}
        placeholder={placeholder ?? t('userPicker.placeholder')}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        showClear={!!selected && !disabled}
      >
        {selected && !query ? (
          <InputGroupAddon align='inline-start'>
            <UserAvatar name={selected.name} />
          </InputGroupAddon>
        ) : null}
      </ComboboxInput>
      <ComboboxContent>
        <UserResults loading={search.loading} />
      </ComboboxContent>
    </Combobox>
  );
}

/** Picks several authentication users, shown as removable chips. The value is the list of user ids. */
export function UserMultiPicker({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  placeholder,
  className,
  knownUsers,
  excludeIds,
  includeDisabled = false,
}: UserMultiPickerProps): ReactElement {
  const { t } = useTranslation();
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState('');
  const search = useUserSearch(query, includeDisabled);
  const { resolve, remember } = useUserDirectory(knownUsers, search.users);
  const selected = useMemo(() => value.map(resolve), [value, resolve]);
  const items = useMemo(() => {
    const excluded = new Set(excludeIds);
    const list = search.users.filter((user) => !excluded.has(user.id));
    for (const user of selected) {
      if (!list.some((item) => item.id === user.id)) list.push(user);
    }
    return list;
  }, [search.users, excludeIds, selected]);

  if (search.error) {
    return <UserPickerError error={search.error} onRetry={search.retry} />;
  }

  return (
    <Combobox
      multiple
      items={items}
      filter={null}
      value={selected}
      onValueChange={(users: UserOption[]) => {
        remember(users);
        onChange(
          users.map((user) => user.id),
          users,
        );
      }}
      onInputValueChange={(text, details) => {
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        ) {
          setQuery(text);
        }
      }}
      onOpenChange={(open) => {
        if (!open) setQuery('');
      }}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={isSameUser}
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className={className}>
        <ComboboxValue>
          {(users: UserOption[]) => (
            <>
              {users.map((user) => (
                <ComboboxChip
                  key={user.id}
                  showRemove={false}
                  className='h-auto min-h-8'
                >
                  <UserName name={user.name} />
                  {disabled ? null : (
                    // The primitive's own remove button has no accessible name, so render it here with one.
                    <ComboboxPrimitive.ChipRemove
                      render={<Button variant='ghost' size='icon-xs' />}
                      className='-ml-1 opacity-50 hover:opacity-100'
                      aria-label={t('userPicker.remove', { name: user.name })}
                    >
                      <XIcon className='pointer-events-none' />
                    </ComboboxPrimitive.ChipRemove>
                  )}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                disabled={disabled}
                placeholder={
                  users.length === 0
                    ? (placeholder ?? t('userPicker.multiplePlaceholder'))
                    : undefined
                }
                aria-invalid={invalid || undefined}
                onBlur={onBlur}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <UserResults loading={search.loading} />
      </ComboboxContent>
    </Combobox>
  );
}

import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useMemo, useState } from 'react';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

import type { EmployeeList } from './types.js';

/** An employee as the manager picker shows it. */
export interface EmployeeOption {
  readonly id: string;
  readonly name: string;
  readonly code: string;
}

const SEARCH_DELAY = 300;
const SEARCH_PAGE_SIZE = 20;

function itemLabel(employee: EmployeeOption): string {
  return employee.name;
}

function isSame(item: EmployeeOption, current: EmployeeOption): boolean {
  return item.id === current.id;
}

/**
 * Picks an active employee (the direct manager) by name or code, searching `GET /api/employees` — the archive list
 * the HR page itself reads, so it offers exactly the archives the caller may see. The value is the employee id
 * (`''` for none); `known` names the current value, which a search may not return.
 */
export function EmployeePicker({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  known,
  excludeId,
}: {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur?: () => void;
  readonly invalid?: boolean;
  readonly known?: EmployeeOption | null;
  /** The employee being edited, who cannot be their own manager. */
  readonly excludeId?: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [reloadCount, setReloadCount] = useState(0);
  const [picked, setPicked] = useState<EmployeeOption | null>(known ?? null);
  const [result, setResult] = useState<{
    readonly key: string;
    readonly items?: EmployeeOption[];
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(query.trim()),
      SEARCH_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [query]);

  const key = JSON.stringify([debounced, reloadCount]);
  useEffect(() => {
    const controller = new AbortController();
    const requestKey = JSON.stringify([debounced, reloadCount]);
    api
      .request<EmployeeList>({
        path: 'employees',
        query: {
          q: debounced || undefined,
          active: 'true',
          pageSize: SEARCH_PAGE_SIZE,
        },
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (controller.signal.aborted) return;
          setResult({
            key: requestKey,
            items: data.map((employee) => ({
              id: employee.id,
              name: employee.name ?? employee.id,
              code: employee.code ?? '',
            })),
          });
        },
        (error: unknown) => {
          if (!controller.signal.aborted)
            setResult((previous) => ({ ...previous, key: requestKey, error }));
        },
      );
    return () => controller.abort();
  }, [api, debounced, reloadCount]);

  const loading = result?.key !== key || query.trim() !== debounced;
  const error = result?.key === key ? result.error : undefined;
  const selected = useMemo<EmployeeOption | null>(() => {
    if (value === '') return null;
    if (picked?.id === value) return picked;
    if (known?.id === value) return known;
    return { id: value, name: value, code: '' };
  }, [value, picked, known]);
  const items = useMemo(() => {
    const list = (result?.items ?? []).filter((item) => item.id !== excludeId);
    if (selected && !list.some((item) => item.id === selected.id))
      list.unshift(selected);
    return list;
  }, [result?.items, excludeId, selected]);

  if (error) {
    if (error instanceof ApiClientError && error.status === 401)
      return <SessionExpiredAlert />;
    return (
      <div
        role='alert'
        className='flex items-center gap-2 text-sm text-destructive'
      >
        <span>{t('employees.form.optionsFailed')}</span>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setReloadCount((count) => count + 1)}
        >
          {t('status.retry')}
        </Button>
      </div>
    );
  }

  return (
    <Combobox
      items={items}
      filter={null}
      value={selected}
      onValueChange={(employee: EmployeeOption | null) => {
        setPicked(employee);
        onChange(employee?.id ?? '');
      }}
      onInputValueChange={(text, details) => {
        if (
          details.reason === 'input-change' ||
          details.reason === 'input-clear'
        )
          setQuery(text);
      }}
      onOpenChange={(open) => {
        if (!open) setQuery('');
      }}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={isSame}
    >
      <ComboboxInput
        id={id}
        placeholder={t('employees.form.managerPlaceholder')}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        showClear={!!selected}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {loading ? t('status.loading') : t('employees.form.managerEmpty')}
        </ComboboxEmpty>
        <ComboboxList>
          {(employee: EmployeeOption) => (
            <ComboboxItem key={employee.id} value={employee}>
              <span className='flex min-w-0 flex-col'>
                <span className='truncate'>{employee.name}</span>
                {employee.code ? (
                  <span className='truncate text-xs text-muted-foreground'>
                    {employee.code}
                  </span>
                ) : null}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

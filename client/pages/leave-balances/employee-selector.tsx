import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '#components/ui/combobox';
import { useEffect, useMemo, useState } from 'react';
import { useBalanceResource } from './resource.js';
import { Button } from '#components/ui/button';
import { BalanceError } from './states.js';
import type { Page } from './types.js';
export interface EmployeeChoice {
  id: string;
  name: string | null;
  code: string | null;
}
export function EmployeeSelector({
  value,
  known,
  onChange,
}: {
  value: string;
  known?: EmployeeChoice;
  onChange: (employee: EmployeeChoice | null) => void;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [seenValue, setSeenValue] = useState(value);
  const [resetGeneration, setResetGeneration] = useState(0);
  if (value !== seenValue) {
    setSeenValue(value);
    setInput('');
  }
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<EmployeeChoice | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);
  const resource = useBalanceResource<Page<EmployeeChoice>>('employees', {
    q: query,
    pageSize: '20',
  });
  const selected = value
    ? picked?.id === value
      ? picked
      : known?.id === value
        ? known
        : null
    : null;
  const items = useMemo(() => {
    const rows = [...(resource.data?.data ?? [])];
    if (selected && !rows.some((row) => row.id === selected.id))
      rows.unshift(selected);
    return rows;
  }, [selected, resource.data]);
  if (resource.error)
    return <BalanceError error={resource.error} retry={resource.reload} />;
  return (
    <div className='flex flex-col gap-2'>
      <Combobox
        key={`${value}:${resetGeneration}`}
        items={items}
        filter={null}
        value={selected}
        itemToStringLabel={(item: EmployeeChoice) =>
          item.name ?? item.code ?? item.id
        }
        isItemEqualToValue={(a: EmployeeChoice, b: EmployeeChoice) =>
          a.id === b.id
        }
        onValueChange={(item: EmployeeChoice | null) => {
          setPicked(item);
          onChange(item);
        }}
        onInputValueChange={(text, details) => {
          if (['input-change', 'input-clear'].includes(details.reason))
            setInput(text);
        }}
        onOpenChange={(open) => {
          if (!open) setInput('');
        }}
      >
        <ComboboxInput
          id='balance-employee'
          placeholder={t('leaveBalances.employeePlaceholder')}
          aria-label={t('leaveBalances.employee')}
          showClear={!!selected || !!input}
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {resource.loading
              ? t('leaveBalances.loading')
              : t('leaveBalances.noResults')}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: EmployeeChoice) => (
              <ComboboxItem key={item.id} value={item}>
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate'>
                    <UserName name={item.name ?? item.id} />
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {item.code}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {input ? (
        <Button
          variant='outline'
          onClick={() => {
            setResetGeneration((generation) => generation + 1);
            setInput('');
            setQuery('');
            setPicked(null);
            onChange(null);
          }}
        >
          {t('leaveBalances.clearSearch')}
        </Button>
      ) : null}
      {(resource.data?.meta.total ?? 0) > 20 ? (
        <p className='text-sm text-muted-foreground'>
          {t('leaveBalances.searchCap')}
        </p>
      ) : null}
    </div>
  );
}

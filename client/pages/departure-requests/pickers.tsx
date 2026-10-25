import { useEffect, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '#components/ui/combobox';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { useDepartureResource } from './use-resource.js';
import { ErrorState } from './states.js';
import type { Person } from '../approvals/types.js';
interface EmployeeOption {
  id: string;
  name: string;
  userId: string;
  active: boolean;
  status: string;
}
interface PickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  focusRef: (node: HTMLButtonElement | null) => void;
  invalid: boolean;
  disabled: boolean;
  knownUser?: Person | null;
}
export function HandoverPicker({
  id,
  value,
  onChange,
  onBlur,
  focusRef,
  invalid,
  disabled,
  knownUser,
  employeeId,
}: Omit<PickerProps, 'focusRef'> & {
  employeeId?: string;
  focusRef: (node: HTMLInputElement | null) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [known, setKnown] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);
  const searchReady = Array.from(search.trim()).length >= 2;
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  // Keep the business eligibility endpoint; a general Users search does not enforce it.
  const resource = useDepartureResource<{ items: Person[]; total: number }>(
    open && searchReady && search.trim() === q && !disabled
      ? 'departureRequests/handoverCandidates'
      : null,
    {
      search: q,
      offset: '0',
      limit: '20',
      ...(employeeId ? { employeeId } : {}),
    },
  );
  const loading =
    open && searchReady && (search.trim() !== q || resource.loading);
  const items =
    open && searchReady && !loading && !resource.error
      ? (resource.data?.items ?? [])
      : [];
  const selected = value
    ? ([knownUser, known, ...items].find((person) => person?.id === value) ?? {
        id: value,
        name: value,
      })
    : null;
  return (
    <div className='flex flex-col gap-2'>
      <Combobox
        items={items}
        filter={null}
        value={selected}
        itemToStringLabel={(person: Person) => person.name}
        isItemEqualToValue={(person: Person, current: Person) =>
          person.id === current.id
        }
        disabled={disabled}
        open={open}
        onValueChange={(person: Person | null) => {
          setKnown(person);
          onChange(person?.id ?? '');
          setSearch('');
        }}
        onInputValueChange={(text, details) => {
          if (
            details.reason === 'input-change' ||
            details.reason === 'input-clear'
          )
            setSearch(text);
        }}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) setSearch('');
        }}
      >
        <ComboboxInput
          id={id}
          ref={focusRef}
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
          aria-required='true'
          placeholder={t('departureRequests.form.searchHandover')}
          showTrigger={false}
          showClear={!!selected && !disabled}
          disabled={disabled}
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {t(
              !searchReady
                ? 'departureRequests.form.handoverSearchMinimum'
                : loading
                  ? 'userPicker.searching'
                  : 'departureRequests.form.noHandoverCandidates',
            )}
          </ComboboxEmpty>
          <ComboboxList>
            {(person: Person) => (
              <ComboboxItem key={person.id} value={person}>
                {person.name}
              </ComboboxItem>
            )}
          </ComboboxList>
          {searchReady &&
          !loading &&
          !resource.error &&
          (resource.data?.total ?? 0) > 20 ? (
            <p className='px-2 py-1.5 text-sm text-muted-foreground'>
              {t('departureRequests.form.refineHandoverSearch')}
            </p>
          ) : null}
        </ComboboxContent>
      </Combobox>
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : null}
    </div>
  );
}
export function DepartureEmployeePicker({
  id,
  value,
  onChange,
  onBlur,
  focusRef,
  invalid,
  disabled,
}: PickerProps) {
  const { t } = useTranslation(),
    permission = useCan({
      resource: { type: 'composite', id: 'oa.employees.archive' },
      action: 'view',
    });
  const [search, setSearch] = useState(''),
    [q, setQ] = useState(''),
    [page, setPage] = useState(1),
    [known, setKnown] = useState<EmployeeOption>();
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const resource = useDepartureResource<EmployeeOption[]>(
    permission.can ? 'employees' : null,
    { q, page: String(page), pageSize: '20', active: 'true' },
  );
  const items = (resource.data ?? []).filter(
    (item) =>
      item.active &&
      ['probation', 'regular'].includes(item.status) &&
      item.userId,
  );
  if (
    known &&
    known.id === value &&
    !items.some((item) => item.id === known.id)
  )
    items.unshift(known);
  if (!permission.can)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('departureRequests.form.employeesDenied')}
      </p>
    );
  return (
    <div className='flex flex-col gap-2'>
      <Input
        value={search}
        disabled={disabled}
        aria-label={t('departureRequests.form.employeeSearch')}
        placeholder={t('departureRequests.form.employeeSearch')}
        onChange={(event) => setSearch(event.target.value)}
      />
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : null}
      <Select
        value={value || null}
        items={items.map((item) => ({ value: item.id, label: item.name }))}
        disabled={disabled || resource.loading || !!resource.error}
        onValueChange={(value) => {
          setKnown(items.find((item) => item.id === value));
          onChange(value ?? '');
        }}
      >
        <SelectTrigger
          id={id}
          ref={focusRef}
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
          className='w-full'
        >
          <SelectValue
            placeholder={t('departureRequests.form.chooseEmployee')}
          />
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={disabled || resource.loading || page === 1}
          onClick={() => setPage((value) => value - 1)}
        >
          {t('departureRequests.form.previous')}
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={
            disabled ||
            resource.loading ||
            !!resource.error ||
            (resource.data?.length ?? 0) < 20
          }
          onClick={() => setPage((value) => value + 1)}
        >
          {t('departureRequests.form.next')}
        </Button>
      </div>
    </div>
  );
}

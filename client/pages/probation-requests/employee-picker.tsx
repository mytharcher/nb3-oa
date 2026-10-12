import { UserName } from '#components/user-name';
import { useEffect, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from './states.js';
interface EmployeeOption {
  id: string;
  name?: string;
  userId?: string;
  status?: string;
  active?: boolean;
}
export function ProbationEmployeePicker({
  id,
  value,
  onChange,
  focusRef,
  invalid,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  focusRef: (node: HTMLButtonElement | null) => void;
  invalid: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const permission = useCan({
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
  const resource = useResource<EmployeeOption[]>(
    permission.can ? 'employees' : null,
    {
      q,
      page: String(page),
      pageSize: '20',
      status: 'probation',
      active: 'true',
    },
  );
  const rows = (resource.data ?? []).filter(
    (r) => r.status === 'probation' && r.active && r.userId && r.name,
  );
  const items = [...rows];
  if (known && value === known.id && !items.some((r) => r.id === value))
    items.unshift(known);
  if (!permission.can)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('probationRequests.form.employeesDenied')}
      </p>
    );
  return (
    <div className='flex flex-col gap-2'>
      <Input
        value={search}
        disabled={disabled}
        aria-label={t('probationRequests.form.employeeSearch')}
        placeholder={t('probationRequests.form.employeeSearch')}
        onChange={(event) => setSearch(event.target.value)}
      />
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : null}
      <Select
        value={value || null}
        items={items.map((r) => ({ value: r.id, label: r.name ?? '' }))}
        disabled={disabled || resource.loading || !!resource.error}
        onValueChange={(next) => {
          const selected = items.find((r) => r.id === next);
          setKnown(selected);
          onChange(next ?? '');
        }}
      >
        <SelectTrigger
          id={id}
          ref={focusRef}
          aria-invalid={invalid || undefined}
        >
          <SelectValue placeholder={t('probationRequests.form.chooseEmployee')}>
            {value ? (
              <UserName
                name={items.find((person) => person.id === value)?.name}
              />
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
          {items.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              <UserName name={r.name} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={disabled || page === 1 || resource.loading}
          onClick={() => setPage((v) => v - 1)}
        >
          {t('probationRequests.form.previousEmployees')}
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={
            disabled || (resource.data?.length ?? 0) < 20 || resource.loading
          }
          onClick={() => setPage((v) => v + 1)}
        >
          {t('probationRequests.form.nextEmployees')}
        </Button>
      </div>
    </div>
  );
}

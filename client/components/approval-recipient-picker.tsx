import { UserName } from '#components/user-name';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState } from 'react';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { ErrorState } from '../pages/approvals/states.js';
import type { Person } from '../pages/approvals/types.js';
export function ApprovalRecipientPicker({
  id,
  recordId,
  requestPath,
  taskId,
  target,
  action,
  value,
  onChange,
  disabled,
  focusRef,
  invalid,
  onBlur,
}: {
  focusRef?: (node: HTMLButtonElement | null) => void;
  invalid?: boolean;
  onBlur?: () => void;
  id: string;
  recordId: string;
  requestPath:
    | 'leaveRequests'
    | 'overtimeRequests'
    | 'attendanceChangeRequests'
    | 'outingRequests'
    | 'generalRequests'
    | 'budgetAdjustments'
    | 'expensePlans'
    | 'trainingRequests'
    | 'loanRequests'
    | 'paymentRequests'
    | 'probationRequests'
    | 'departureRequests'
    | 'purchaseRequests'
    | 'reimbursementRequests'
    | 'travelRequests'
    | 'travelCancellations'
    | 'leaveCancellations'
    | 'supplyRequests';
  taskId?: string;
  target?: { taskId: string } | { runId: string };
  action: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [offset, setOffset] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const targetTaskId =
    target && 'taskId' in target ? target.taskId : target ? undefined : taskId;
  const targetRunId = target && 'runId' in target ? target.runId : undefined;
  useEffect(() => {
    if (!targetTaskId && !targetRunId) return;
    let disposed = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void api
        .request<{ data: { people: Person[]; nextOffset: number | null } }>({
          path: `${requestPath}/${encodeURIComponent(recordId)}/candidates`,
          query: {
            ...(targetRunId
              ? { runId: targetRunId }
              : { taskId: targetTaskId! }),
            action,
            search,
            offset,
            limit: 20,
          },
        })
        .then(({ data }) => {
          if (disposed) return;
          setPeople((previous) =>
            offset ? [...previous, ...data.people] : data.people,
          );
          setNext(data.nextOffset);
          setError(undefined);
        })
        .catch((reason: unknown) => {
          if (!disposed) setError(reason);
        })
        .finally(() => {
          if (!disposed) setLoading(false);
        });
    }, 300);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [
    api,
    requestPath,
    recordId,
    targetTaskId,
    targetRunId,
    action,
    search,
    offset,
    retry,
  ]);
  return (
    <div className='flex flex-col gap-2'>
      <Input
        aria-label={t('approvals.recipientSearch')}
        value={search}
        disabled={disabled}
        onChange={(event) => {
          setSearch(event.target.value);
          setOffset(0);
        }}
      />
      <Select
        value={value || null}
        onValueChange={(person) => onChange(person ?? '')}
        disabled={disabled || loading}
        items={people.map((person) => ({
          value: person.id,
          label: person.name,
        }))}
      >
        <SelectTrigger
          id={id}
          ref={focusRef}
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
        >
          <SelectValue>
            {value ? (
              <UserName
                name={people.find((person) => person.id === value)?.name}
              />
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {people.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                <UserName name={person.name} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? (
        <ErrorState
          error={error}
          retry={() => setRetry((value) => value + 1)}
        />
      ) : null}
      {next !== null ? (
        <Button
          type='button'
          variant='outline'
          disabled={disabled || loading}
          onClick={() => setOffset(next)}
        >
          {t('approvals.moreRecipients')}
        </Button>
      ) : null}
    </div>
  );
}

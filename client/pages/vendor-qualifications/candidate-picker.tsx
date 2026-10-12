import { useEffect, useState, useEffectEvent } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Choice } from './shared.js';
import { ErrorState } from './states.js';
import type { Person } from './types.js';
/** Both endpoints return already eligible named identities; no broad users query. */
export function CandidatePicker({
  path,
  query,
  value,
  onChange,
  disabled,
  id,
  known = [],
}: {
  path: string;
  query: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  id: string;
  known?: Person[];
}) {
  const clearSelection = useEffectEvent(() => onChange(''));
  const api = useApiClient(),
    { t } = useTranslation();
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(0),
    [next, setNext] = useState<number | null>(null),
    [people, setPeople] = useState<Person[]>([]),
    [error, setError] = useState<unknown>(),
    [loading, setLoading] = useState(false),
    [retry, setRetry] = useState(0);
  const queryKey = JSON.stringify(query),
    source = JSON.stringify([path, queryKey]);
  const [identity, setIdentity] = useState(source);
  const current = identity === source ? people : [];
  useEffect(() => {
    if (disabled) return;
    let disposed = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void api
        .request<{ data: { people: Person[]; nextOffset: number | null } }>({
          path,
          query: {
            ...(JSON.parse(queryKey) as Record<string, string>),
            search,
            offset: String(page),
            limit: '20',
          },
        })
        .then(({ data }) => {
          if (disposed) return;
          setIdentity(source);
          setPeople((old) => (page ? [...old, ...data.people] : data.people));
          setNext(data.nextOffset);
          setError(undefined);
        })
        .catch((cause: unknown) => {
          if (!disposed) {
            setPeople([]);
            setNext(null);
            setError(cause);
            clearSelection();
          }
        })
        .finally(() => {
          if (!disposed) setLoading(false);
        });
    }, 300);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [api, path, queryKey, source, search, page, retry, disabled]);
  const selected = known.find((p) => p.id === value);
  const items = [
    { value: 'none', label: t('vendorQualifications.common.none') },
    ...(selected && !current.some((p) => p.id === value)
      ? [{ value: selected.id, label: selected.name }]
      : []),
    ...current.map((p) => ({ value: p.id, label: p.name })),
  ];
  return (
    <div className='flex flex-col gap-2'>
      <Input
        value={search}
        disabled={disabled}
        aria-label={t('vendorQualifications.common.searchPeople')}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
      />
      <Choice
        id={id}
        label={t('vendorQualifications.common.person')}
        value={value || 'none'}
        items={items}
        disabled={disabled || loading}
        onChange={(person) => onChange(person === 'none' ? '' : person)}
      />
      {!!error && (
        <ErrorState error={error} retry={() => setRetry((n) => n + 1)} />
      )}{' '}
      {next !== null && (
        <Button
          variant='outline'
          type='button'
          disabled={disabled || loading}
          onClick={() => setPage(next)}
        >
          {t('approvals.moreRecipients')}
        </Button>
      )}
    </div>
  );
}

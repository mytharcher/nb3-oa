import { UserName } from '#components/user-name';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
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
import { useResource } from './resource.js';
import { ErrorState } from './states.js';
import { statusOf } from './types.js';
import type { AssetOption, Page, Person } from './types.js';
function Search({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Input
      aria-label={t('assetRequests.searchCandidates')}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export function AssetPicker({
  id,
  value,
  onChange,
  disabled,
  requestId,
  onDenied,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  requestId?: string;
  onDenied?: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1);
  const r = useResource<Page<AssetOption>>('assetRequests/eligibleAssets', {
    purpose: 'scrap',
    page: String(page),
    pageSize: '20',
    search,
    ...(requestId ? { requestId } : {}),
  });
  const denialRef = useRef<unknown>(undefined);
  useEffect(() => {
    if (r.error !== denialRef.current) {
      denialRef.current = r.error;
      if ([401, 403].includes(statusOf(r.error) ?? 0)) onDenied?.();
    }
  }, [r.error, onDenied]);
  return (
    <div className='flex flex-col gap-2'>
      <Search
        disabled={disabled}
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v ?? '')}
        disabled={disabled || r.loading || !!r.error}
        items={r.data?.data.map((a) => ({
          value: a.id,
          label: `${a.code} · ${a.name ?? a.category}`,
        }))}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={t('assetRequests.selectAsset')} />
        </SelectTrigger>
        <SelectContent className='w-auto min-w-(--anchor-width)'>
          <SelectGroup>
            {r.data?.data.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.code} · {a.name ?? a.category}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {r.error ? <ErrorState error={r.error} retry={r.reload} /> : null}
      {r.data && !r.data.meta.total ? (
        <p className='text-sm text-muted-foreground'>
          {t('assetRequests.noEligibleAssets')}
        </p>
      ) : null}
      <div className='flex gap-2'>
        {page > 1 ? (
          <Button
            variant='outline'
            disabled={disabled || r.loading}
            onClick={() => setPage(page - 1)}
          >
            {t('assetRequests.previous')}
          </Button>
        ) : null}
        {r.data && page * r.data.meta.pageSize < r.data.meta.total ? (
          <Button
            variant='outline'
            disabled={disabled || r.loading}
            onClick={() => setPage(page + 1)}
          >
            {t('assetRequests.next')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
/** The asset request facade uses targetId, unlike older modules' taskId/runId candidate query. */
export function RecipientPicker({
  id,
  recordId,
  targetId,
  action,
  value,
  onChange,
  disabled,
  onDenied,
}: {
  onDenied?: () => void;
  id: string;
  recordId: string;
  targetId: string;
  action: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(''),
    [offset, setOffset] = useState(0);
  const r = useResource<{
    data: { people: Person[]; nextOffset: number | null };
  }>(`assetRequests/${encodeURIComponent(recordId)}/candidates`, {
    targetId,
    action,
    search,
    offset: String(offset),
    limit: '20',
  });
  const denialRef = useRef<unknown>(undefined);
  useEffect(() => {
    if (r.error !== denialRef.current) {
      denialRef.current = r.error;
      if ([401, 403].includes(statusOf(r.error) ?? 0)) onDenied?.();
    }
  }, [r.error, onDenied]);
  return (
    <div className='flex flex-col gap-2'>
      <Search
        disabled={disabled}
        value={search}
        onChange={(v) => {
          setSearch(v);
          setOffset(0);
        }}
      />
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v ?? '')}
        disabled={disabled || r.loading || !!r.error}
        items={r.data?.data.people.map((p) => ({ value: p.id, label: p.name }))}
      >
        <SelectTrigger id={id}>
          <SelectValue>
            {value ? (
              <UserName
                name={
                  r.data?.data.people.find((person) => person.id === value)
                    ?.name
                }
              />
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className='w-auto min-w-(--anchor-width)'>
          <SelectGroup>
            {r.data?.data.people.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <UserName name={p.name} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {r.error ? <ErrorState error={r.error} retry={r.reload} /> : null}
      <div className='flex gap-2'>
        {offset > 0 ? (
          <Button
            variant='outline'
            disabled={disabled || r.loading}
            onClick={() => setOffset(Math.max(0, offset - 20))}
          >
            {t('assetRequests.previous')}
          </Button>
        ) : null}
        {r.data?.data.nextOffset != null ? (
          <Button
            variant='outline'
            disabled={disabled || r.loading}
            onClick={() => setOffset(r.data!.data.nextOffset!)}
          >
            {t('assetRequests.next')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

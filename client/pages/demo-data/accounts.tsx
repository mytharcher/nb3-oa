import { UsersRound } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { TruncatedText } from '#components/truncated-text';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '#components/ui/empty';
import type { DemoAccount } from './types.js';

export function DemoAccounts({
  accounts,
  onReload,
}: {
  accounts: DemoAccount[];
  onReload?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [draft, setDraft] = useState(query);
  const composingRef = useRef(false);
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setDraft(query);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!composingRef.current && draft !== query)
        setParams(
          (p) => {
            p.set('q', draft);
            p.delete('page');
            return p;
          },
          { replace: true },
        );
    }, 300);
    return () => clearTimeout(handle);
  }, [draft, query, setParams]);
  const size = [10, 20, 50].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 10;
  const requestedPage =
    Math.max(0, Math.floor(Number(params.get('page') ?? 1)) - 1) || 0;
  const desc = params.get('order') === 'desc';
  const filtered = useMemo(
    () =>
      accounts
        .filter((a) =>
          [a.name, a.username, t(`demoData.roles.${a.role}`)].some((v) =>
            v.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          ),
        )
        .sort(
          (a, b) =>
            (desc ? -1 : 1) * a.name.localeCompare(b.name, i18n.language),
        ),
    [accounts, query, desc, t, i18n.language],
  );
  const page = Math.min(
    Number.isFinite(requestedPage) ? requestedPage : 0,
    Math.max(0, Math.ceil(filtered.length / size) - 1),
  );
  const columns = useMemo<ColumnDef<DemoAccount, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('demoData.name')} />
        ),
        cell: ({ row }) => <TruncatedText text={row.original.name} />,
      },
      {
        accessorKey: 'role',
        header: t('demoData.role'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant='outline'>
            {t(`demoData.roles.${row.original.role}`)}
          </Badge>
        ),
      },
      {
        accessorKey: 'username',
        header: t('demoData.username'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className='select-all'>{row.original.username}</span>
        ),
      },
    ],
    [t],
  );
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2 px-6'>
        <Input
          className='sm:max-w-xs'
          placeholder={t('demoData.search')}
          aria-label={t('demoData.search')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            setDraft(e.currentTarget.value);
          }}
        />
        {query && (
          <Button
            variant='ghost'
            onClick={() => {
              setDraft('');
              setParams(
                (p) => {
                  p.delete('q');
                  p.delete('page');
                  return p;
                },
                { replace: true },
              );
            }}
          >
            {t('demoData.clear')}
          </Button>
        )}
      </div>
      <DataTableServer
        columns={columns}
        rows={filtered.slice(page * size, (page + 1) * size)}
        total={filtered.length}
        getRowId={(a) => a.id}
        pagination={{ pageIndex: page, pageSize: size }}
        pageSizeOptions={[10, 20, 50]}
        onPaginationChange={(p) =>
          setParams(
            (v) => {
              v.set('page', String(p.pageIndex + 1));
              v.set('pageSize', String(p.pageSize));
              return v;
            },
            { replace: true },
          )
        }
        sorting={[{ id: 'name', desc }]}
        onSortingChange={(s) =>
          setParams(
            (v) => {
              v.set('order', s[0]?.desc ? 'desc' : 'asc');
              v.delete('page');
              return v;
            },
            { replace: true },
          )
        }
        emptyMessage={
          <Empty className='border-0'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <UsersRound />
              </EmptyMedia>
              <EmptyTitle>
                {t(query ? 'demoData.noResults' : 'demoData.noAccounts')}
              </EmptyTitle>
              <EmptyDescription>
                {t(query ? 'demoData.clear' : 'demoData.noAccountsDescription')}
              </EmptyDescription>
            </EmptyHeader>
            {!query && onReload && (
              <Button variant='outline' onClick={onReload}>
                {t('demoData.retry')}
              </Button>
            )}
          </Empty>
        }
      />
    </div>
  );
}

import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { HashIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';
import { type ReactElement, useMemo, useRef } from 'react';

import { DataTableServer } from '@/components/data-table';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUrlSearch } from '@/hooks/use-url-search';

import { LoadErrorAlert, TableSkeleton } from '../shared/states.js';
import type { PageMeta, SequenceCounter } from '../shared/types.js';
import {
  PAGE_SIZE_OPTIONS,
  paginationOf,
  writePagination,
} from '../shared/url-pagination.js';
import { useListResource } from '../shared/use-resource.js';

/** `LV-202610-0042`, as the sequence service formats numbers. */
function formatNumber(counter: SequenceCounter): string {
  return `${counter.prefix}-${counter.period}-${String(counter.next).padStart(4, '0')}`;
}

/**
 * Route /settings/sequences: the document number counters, read-only. Numbers are issued only inside a submission's
 * transaction, so nothing here changes them.
 */
export default function SequencesPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const searchRef = useRef<HTMLInputElement>(null);
  const { searchParams, search, text, inputProps, updateParams, clear } =
    useUrlSearch({
      param: 'prefix',
      resetParams: ['page'],
    });
  const pagination = paginationOf(searchParams);
  const prefix = search.toUpperCase();
  const counters = useListResource<SequenceCounter, PageMeta>('sequences', {
    prefix: prefix || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const body = counters.data;
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const columns = useMemo<ColumnDef<SequenceCounter>[]>(
    () => [
      {
        accessorKey: 'prefix',
        header: t('platform.sequences.fields.prefix'),
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.prefix}</span>
        ),
      },
      {
        accessorKey: 'period',
        header: t('platform.sequences.fields.period'),
        cell: ({ row }) =>
          `${row.original.period.slice(0, 4)}-${row.original.period.slice(4)}`,
      },
      {
        id: 'issued',
        header: () => (
          <div className='text-right'>
            {t('platform.sequences.fields.issued')}
          </div>
        ),
        cell: ({ row }) => (
          <div className='text-right tabular-nums'>
            {numberFormat.format(row.original.next - 1)}
          </div>
        ),
      },
      {
        id: 'next',
        header: t('platform.sequences.fields.next'),
        cell: ({ row }) => (
          <code className='text-xs'>{formatNumber(row.original)}</code>
        ),
      },
    ],
    [numberFormat, t],
  );

  function clearFilters(): void {
    clear();
    searchRef.current?.focus();
  }

  let content: ReactElement;
  if (counters.error) {
    content = (
      <LoadErrorAlert
        error={counters.error}
        title={t('platform.sequences.loadFailedTitle')}
        onRetry={counters.reload}
      />
    );
  } else if (!body) {
    content = <TableSkeleton columns={4} />;
  } else if (body.meta.total === 0 && !prefix) {
    content = (
      <Empty className='min-h-48 border border-dashed'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <HashIcon />
          </EmptyMedia>
          <EmptyTitle>{t('platform.sequences.empty.title')}</EmptyTitle>
          <EmptyDescription>
            {t('platform.sequences.empty.description')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    content = (
      <DataTableServer
        columns={columns}
        rows={body.data}
        total={body.meta.total}
        getRowId={(row) => `${row.prefix}:${row.period}`}
        pagination={pagination}
        onPaginationChange={(next) =>
          updateParams((params) => writePagination(params, next))
        }
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        emptyMessage={
          <div className='flex flex-col items-center gap-2'>
            <span>{t('platform.common.noResults')}</span>
            <Button variant='link' size='sm' onClick={clearFilters}>
              {t('platform.common.clearFilters')}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('platform.sequences.title')}
        description={t('platform.sequences.description')}
        actions={
          // Submissions issue numbers while the page is open, so it offers a refresh (guideline R4).
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='outline'
                  size='icon'
                  aria-label={t('platform.common.refresh')}
                  onClick={counters.reload}
                />
              }
            >
              <RefreshCwIcon
                className={
                  counters.loading && body ? 'animate-spin' : undefined
                }
              />
            </TooltipTrigger>
            <TooltipContent>{t('platform.common.refresh')}</TooltipContent>
          </Tooltip>
        }
      />
      <div className='flex flex-wrap items-center gap-2'>
        <InputGroup className='w-full sm:max-w-xs'>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            {...inputProps}
            placeholder={t('platform.sequences.searchPlaceholder')}
            aria-label={t('platform.sequences.searchLabel')}
          />
        </InputGroup>
        {text.trim() ? (
          <Button variant='ghost' onClick={clearFilters}>
            {t('platform.common.clearFilters')}
          </Button>
        ) : null}
        {counters.loading && body ? (
          <Spinner className='text-muted-foreground' />
        ) : null}
      </div>
      {content}
    </PageContainer>
  );
}

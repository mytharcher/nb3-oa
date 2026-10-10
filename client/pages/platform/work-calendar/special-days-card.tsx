import { useApiClient, useToaster } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  CalendarOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react';
import {
  type ReactElement,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';

import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

import { statusOf } from '../shared/errors.js';
import { LoadErrorAlert, TableSkeleton } from '../shared/states.js';
import { TruncatedText } from '../shared/truncated-text.js';
import type { CalendarDay } from '../shared/types.js';
import { useListResource } from '../shared/use-resource.js';
import { type SpecialDaysOutletContext, yearOf } from './constants.js';
import { DayKindBadge } from './day-kind-badge.js';

/** The explicit days of one year, with add, import, edit and remove for those who may update the calendar. */
export function SpecialDaysCard({
  canUpdate,
}: {
  readonly canUpdate: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = yearOf(searchParams);
  const days = useListResource<CalendarDay>('calendarDays', { year });
  const rows = days.data?.data;
  const yearLabelRef = useRef<HTMLSpanElement>(null);

  function changeYear(next: number): void {
    const params = new URLSearchParams(searchParams);
    params.set('year', String(next));
    setSearchParams(params, { replace: true });
  }

  const { reload } = days;
  const outletContext = useMemo<SpecialDaysOutletContext>(
    () => ({ year, reload }),
    [year, reload],
  );

  const [removal, setRemoval] = useState<{
    readonly open: boolean;
    readonly day: CalendarDay | null;
  }>({ open: false, day: null });

  const weekdayFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
    [locale],
  );
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }),
    [locale],
  );

  const columns = useMemo<ColumnDef<CalendarDay>[]>(() => {
    const list: ColumnDef<CalendarDay>[] = [
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('platform.calendar.days.date')}
          />
        ),
        cell: ({ row }) => (
          <span className='font-medium whitespace-nowrap'>
            {dateFormat.format(new Date(`${row.original.date}T00:00:00Z`))}
          </span>
        ),
      },
      {
        id: 'weekday',
        header: t('platform.calendar.days.weekday'),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {weekdayFormat.format(new Date(`${row.original.date}T00:00:00Z`))}
          </span>
        ),
      },
      {
        accessorKey: 'kind',
        header: t('platform.calendar.days.kind'),
        cell: ({ row }) => <DayKindBadge kind={row.original.kind} />,
      },
      {
        accessorKey: 'note',
        header: t('platform.calendar.days.note'),
        cell: ({ row }) =>
          row.original.note ? (
            <TruncatedText text={row.original.note} />
          ) : (
            <span className='text-muted-foreground'>—</span>
          ),
      },
    ];
    if (canUpdate)
      list.push({
        id: 'actions',
        header: () => (
          <span className='sr-only'>{t('platform.common.actions')}</span>
        ),
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('platform.common.actionsFor', {
                      name: row.original.date,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    render={
                      <Link
                        to={{
                          pathname: `days/${row.original.date}`,
                          search: location.search,
                        }}
                      />
                    }
                  >
                    <PencilIcon />
                    {t('platform.common.edit')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() =>
                      setRemoval({ open: true, day: row.original })
                    }
                  >
                    <Trash2Icon />
                    {t('platform.common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      });
    return list;
  }, [canUpdate, dateFormat, location.search, t, weekdayFormat]);

  const addLink = { pathname: 'days/new', search: location.search };
  const importLink = { pathname: 'import', search: location.search };

  let content: ReactElement;
  if (statusOf(days.error) === 401) {
    content = <SessionExpiredAlert />;
  } else if (days.error) {
    content = <LoadErrorAlert error={days.error} onRetry={days.reload} />;
  } else if (rows === undefined) {
    content = <TableSkeleton rows={4} columns={4} />;
  } else if (rows.length === 0) {
    content = (
      <Empty className='min-h-40 border border-dashed p-6 md:p-6'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <CalendarOffIcon />
          </EmptyMedia>
          <EmptyTitle>
            {t('platform.calendar.days.emptyTitle', { year })}
          </EmptyTitle>
          <EmptyDescription>
            {canUpdate
              ? t('platform.calendar.days.emptyDescription')
              : t('platform.calendar.days.emptyReadOnly')}
          </EmptyDescription>
        </EmptyHeader>
        {canUpdate ? (
          <EmptyContent>
            {/* While the year is empty the actions are only here (guideline L7). */}
            <div className='flex flex-wrap justify-center gap-2'>
              <Button render={<Link to={importLink} />} nativeButton={false}>
                <UploadIcon data-icon='inline-start' />
                {t('platform.calendar.days.import')}
              </Button>
              <Button
                variant='outline'
                render={<Link to={addLink} />}
                nativeButton={false}
              >
                <PlusIcon data-icon='inline-start' />
                {t('platform.calendar.days.add')}
              </Button>
            </div>
          </EmptyContent>
        ) : null}
      </Empty>
    );
  } else {
    content = (
      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.date}
        pagination={false}
        showSelectedCount={false}
        initialSorting={[{ id: 'date', desc: false }]}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('platform.calendar.days.title')}</CardTitle>
        <CardDescription>
          {t('platform.calendar.days.description')}
        </CardDescription>
        <CardAction>
          <div className='flex flex-wrap items-center justify-end gap-2'>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('platform.calendar.days.previousYear')}
                onClick={() => changeYear(year - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              <span
                ref={yearLabelRef}
                tabIndex={-1}
                className='min-w-12 text-center text-sm font-medium tabular-nums'
                aria-live='polite'
              >
                {year}
              </span>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('platform.calendar.days.nextYear')}
                onClick={() => changeYear(year + 1)}
              >
                <ChevronRightIcon />
              </Button>
              {days.loading && rows !== undefined ? (
                <Spinner className='text-muted-foreground' />
              ) : null}
            </div>
            {canUpdate && rows !== undefined && rows.length > 0 ? (
              <>
                <Button
                  variant='outline'
                  render={<Link to={importLink} />}
                  nativeButton={false}
                >
                  <UploadIcon data-icon='inline-start' />
                  {t('platform.calendar.days.import')}
                </Button>
                <Button render={<Link to={addLink} />} nativeButton={false}>
                  <PlusIcon data-icon='inline-start' />
                  {t('platform.calendar.days.add')}
                </Button>
              </>
            ) : null}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>{content}</CardContent>
      <RemoveDayDialog
        open={removal.open}
        day={removal.day}
        onOpenChange={(open) => setRemoval((current) => ({ ...current, open }))}
        onRemoved={() => {
          setRemoval((current) => ({ ...current, open: false }));
          days.reload();
        }}
        focusAfterRef={yearLabelRef}
      />
      <Outlet context={outletContext} />
    </Card>
  );
}

function RemoveDayDialog({
  open,
  day,
  onOpenChange,
  onRemoved,
  focusAfterRef,
}: {
  readonly open: boolean;
  readonly day: CalendarDay | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRemoved: () => void;
  readonly focusAfterRef: RefObject<HTMLElement | null>;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<
    'sessionExpired' | 'forbidden' | 'failed'
  >();
  const removedRef = useRef(false);

  async function remove(target: CalendarDay): Promise<void> {
    setPending(true);
    setError(undefined);
    try {
      await api.request({
        path: `calendarDays/${target.date}`,
        method: 'DELETE',
      });
    } catch (caught: unknown) {
      const status = statusOf(caught);
      if (status !== 404) {
        setError(
          status === 401
            ? 'sessionExpired'
            : status === 403
              ? 'forbidden'
              : 'failed',
        );
        setPending(false);
        return;
      }
      // Already removed by someone else: what the user wanted has happened (guideline R3).
    }
    setPending(false);
    toaster.show({
      type: 'success',
      title: t('platform.calendar.days.removed', { date: target.date }),
    });
    removedRef.current = true;
    onRemoved();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        finalFocus={() => {
          const target = removedRef.current ? focusAfterRef.current : null;
          removedRef.current = false;
          return target ?? true;
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('platform.calendar.days.removeTitle', { date: day?.date ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('platform.calendar.days.removeDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : error ? (
          <p role='alert' className='text-sm text-destructive'>
            {error === 'forbidden'
              ? t('platform.common.writeForbidden')
              : t('platform.common.saveFailed')}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={pending || (error !== undefined && error !== 'failed')}
            onClick={() => {
              if (day) void remove(day);
            }}
          >
            {pending ? <Spinner data-icon='inline-start' /> : null}
            {t('platform.common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

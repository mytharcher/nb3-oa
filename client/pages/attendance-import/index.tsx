import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiClientError,
  useApiClient,
  useNavigationGuard,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { LoaderCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Checkbox } from '#components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '#components/ui/alert-dialog';
import { WorkbookError, headers, type ImportRow } from './workbook.js';
const resource = { type: 'composite', id: 'oa.attendanceImport' } as const;
export default function AttendanceImportPage() {
  const { t } = useTranslation(),
    { session } = useAuthentication();
  const revision = useAuthorizationRevision(),
    permission = useCan({ resource, action: 'ingest' });
  const allowed =
    !!session?.user.id &&
    permission.can &&
    !permission.isPending &&
    !permission.error;
  const headingRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!allowed && !permission.isPending) headingRef.current?.focus();
  }, [allowed, permission.isPending]);
  return (
    <PageContainer>
      <PageHeader
        title={
          <span ref={headingRef} tabIndex={-1}>
            {t('attendanceImport.title')}
          </span>
        }
        description={t('attendanceImport.description')}
      />
      {permission.isPending ? (
        <p role='status'>{t('attendanceImport.parsing')}</p>
      ) : !allowed ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('attendanceImport.denied')}</AlertDescription>
        </Alert>
      ) : (
        <ImportForm key={`${session?.user.id}:${revision}`} />
      )}
    </PageContainer>
  );
}
function ImportForm() {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster();
  const [rows, setRows] = useState<ImportRow[]>([]),
    [parsing, setParsing] = useState(false),
    [busy, setBusy] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [receipt, setReceipt] = useState<number>(),
    [localError, setLocalError] = useState<WorkbookError>(),
    [error, setError] = useState<unknown>(),
    [discard, setDiscard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null),
    batchErrorRef = useRef<HTMLDivElement>(null),
    aliveRef = useRef(true),
    generationRef = useRef(0),
    busyRef = useRef(false);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  const terminal =
    error instanceof ApiClientError && [401, 403, 404].includes(error.status);
  useNavigationGuard(() => {
    if (busyRef.current) return false;
    if (rows.length && receipt === undefined) {
      setDiscard(true);
      return false;
    }
    return true;
  });
  useEffect(() => {
    if ((!rows.length || receipt !== undefined) && !busy) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [rows.length, receipt, busy]);
  useEffect(() => {
    if (error) batchErrorRef.current?.focus();
  }, [error]);
  const columns = useMemo<ColumnDef<ImportRow>[]>(
    () =>
      headers.map((key) => ({
        accessorKey: key,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(`attendanceImport.columns.${key}`)}
          />
        ),
        cell: ({ row }) =>
          key === 'sourceData' ? (
            <details className='max-w-sm whitespace-normal break-words'>
              <summary className='cursor-pointer'>
                {t('attendanceImport.evidence')}
              </summary>
              <pre className='whitespace-pre-wrap break-all text-xs'>
                {JSON.stringify(row.original.sourceData, null, 2)}
              </pre>
            </details>
          ) : (
            <span className='break-all whitespace-normal'>
              {row.original[key] ?? '—'}
            </span>
          ),
      })),
    [t],
  );
  async function select(selected: File | undefined) {
    if (busyRef.current) return;
    const current = ++generationRef.current;
    setRows([]);
    setReceipt(undefined);
    setError(undefined);
    setLocalError(undefined);
    setConfirmed(false);
    setParsing(!!selected);
    if (!selected) return;
    try {
      if (selected.size > 4 * 1024 * 1024 || !/\.xlsx$/i.test(selected.name))
        throw new WorkbookError('file');
      const { parseWorkbook } = await import('./workbook.js');
      const parsed = parseWorkbook(
        new Uint8Array(await selected.arrayBuffer()),
        selected.name,
      );
      if (aliveRef.current && current === generationRef.current)
        setRows(parsed);
    } catch (failure: unknown) {
      if (aliveRef.current && current === generationRef.current) {
        setLocalError(
          failure instanceof WorkbookError
            ? failure
            : new WorkbookError('file'),
        );
        fileRef.current?.focus();
      }
    } finally {
      if (aliveRef.current && current === generationRef.current)
        setParsing(false);
    }
  }
  async function submit() {
    if (
      busyRef.current ||
      parsing ||
      !rows.length ||
      !confirmed ||
      receipt !== undefined ||
      terminal
    )
      return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.request<{
        data: { recordIds: string[]; count: number };
      }>({
        path: 'attendanceManagement/ingestBatch',
        method: 'POST',
        json: { rows },
      });
      if (aliveRef.current) {
        setReceipt(result.data.count);
        toaster.show({
          title: t('attendanceImport.success', { count: result.data.count }),
          type: 'success',
        });
      }
    } catch (failure: unknown) {
      if (aliveRef.current) {
        setError(failure);
        if (
          failure instanceof ApiClientError &&
          [401, 403, 404].includes(failure.status)
        ) {
          setRows([]);
          setReceipt(undefined);
          setConfirmed(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      }
    } finally {
      busyRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  }
  async function download() {
    try {
      const { createTemplate } = await import('./workbook.js');
      if (!aliveRef.current) return;
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(createTemplate())], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'attendance-evidence.xlsx';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toaster.show({
        title: t('attendanceImport.downloadStarted'),
        type: 'success',
      });
    } catch {
      if (aliveRef.current)
        toaster.show({
          title: t('attendanceImport.downloadFailed'),
          type: 'error',
        });
    }
  }
  const errorKey =
    error instanceof ApiClientError
      ? error.status === 403 || error.status === 404
        ? 'denied'
        : error.status === 409
          ? 'conflict'
          : error.status === 400
            ? 'invalid'
            : 'failed'
      : 'failed';
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {!!error && (
        <div ref={batchErrorRef} tabIndex={-1}>
          {error instanceof ApiClientError && error.status === 401 ? (
            <SessionExpiredAlert />
          ) : (
            <Alert variant='destructive'>
              <AlertDescription>
                {t(`attendanceImport.${errorKey}`)}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      <div>
        <Button
          variant='outline'
          onClick={() => void download()}
          disabled={busy || terminal}
        >
          {t('attendanceImport.template')}
        </Button>
      </div>
      <p
        id='attendance-import-help'
        className='max-w-3xl text-sm text-muted-foreground'
      >
        {t('attendanceImport.help')}
      </p>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='attendance-import-file'>
          {t('attendanceImport.file')} <span aria-hidden='true'>*</span>
        </Label>
        <Input
          ref={fileRef}
          id='attendance-import-file'
          type='file'
          accept='.xlsx'
          required
          disabled={busy || terminal}
          aria-invalid={!!localError}
          aria-describedby={`attendance-import-help${localError ? ' attendance-import-file-error' : ''}`}
          onChange={(e) => void select(e.target.files?.[0])}
        />
        {localError && (
          <p
            id='attendance-import-file-error'
            role='alert'
            className='text-sm text-destructive'
          >
            {t(`attendanceImport.errors.${localError.reason}`, {
              row: localError.row,
            })}
          </p>
        )}
      </div>
      {parsing ? (
        <p role='status' aria-label={t('attendanceImport.parsing')}>
          {t('attendanceImport.parsing')}
        </p>
      ) : !rows.length && !localError && !terminal ? (
        <p className='text-sm text-muted-foreground'>
          {t('attendanceImport.empty')}
        </p>
      ) : null}
      {rows.length > 0 && (
        <>
          <p className='font-medium'>
            {t('attendanceImport.preview', { count: rows.length })}
          </p>
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(r) => JSON.stringify([r.source, r.sourceKey])}
            pageSize={20}
            pageSizeOptions={[20, 50, 100]}
            showSelectedCount={false}
          />
          <div className='flex items-start gap-2'>
            <Checkbox
              id='attendance-import-confirm'
              checked={confirmed}
              onCheckedChange={(value) => setConfirmed(!!value)}
              disabled={busy || receipt !== undefined}
              required
            />
            <Label htmlFor='attendance-import-confirm' className='leading-6'>
              {t('attendanceImport.confirm')} <span aria-hidden='true'>*</span>
            </Label>
          </div>
          <div>
            <Button
              onClick={() => void submit()}
              disabled={
                !confirmed ||
                busy ||
                parsing ||
                receipt !== undefined ||
                terminal
              }
            >
              {busy && (
                <LoaderCircle
                  data-icon='inline-start'
                  className='animate-spin'
                />
              )}
              {t(
                `attendanceImport.${busy ? 'submitting' : error ? 'retry' : 'submit'}`,
              )}
            </Button>
          </div>
        </>
      )}
      {receipt !== undefined && (
        <Alert>
          <AlertDescription>
            {t('attendanceImport.success', { count: receipt })}
          </AlertDescription>
        </Alert>
      )}
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('attendanceImport.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('attendanceImport.discardHelp')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' onClick={() => setDiscard(false)}>
              {t('attendanceImport.continue')}
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                setRows([]);
                setConfirmed(false);
                setDiscard(false);
                generationRef.current++;
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              {t('attendanceImport.discardConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

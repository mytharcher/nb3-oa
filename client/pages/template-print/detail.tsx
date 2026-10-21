import { UserName } from '#components/user-name';
import { ResponsiveTable as Table } from '#components/responsive-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  usePageBreadcrumb,
  useApiClient,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useOutletContext,
} from 'react-router';
import {
  RefreshCw,
  Pencil,
  Upload,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { RecordDetailDrawer } from '#components/record-detail-drawer';

import { Button } from '#components/ui/button';
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '#components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Spinner } from '#components/ui/spinner';
import { isDenied, useResource } from './resource.js';
import { useCommand } from './command.js';
import { downloadDocx, documentName } from './download.js';
import {
  writable,
  supported,
  type Detail,
  type Revision,
  type Template,
  type Context,
} from './types.js';
import { ErrorState, Loading } from './states.js';
export default function DetailPage() {
  const { templateId } = useParams();
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const location = useLocation();
  const navigate = useNavigate();
  const parent = useOutletContext<Context>();
  const r = useResource<{ data: Detail }>(
    templateId ? `printTemplates/${templateId}` : null,
    { mode: 'manage' },
  );
  const cmd = useCommand(`active:${templateId}`);
  const [confirm, setConfirm] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState<string>();
  const [downloadError, setDownloadError] = useState<unknown>();
  const [sort, setSort] = useState<'number' | 'createdAt'>('number');
  const [descending, setDescending] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const record = r.data?.data.record;
  const safe =
    !r.error && !isDenied(cmd.error) && !isDenied(downloadError) && !!record;
  const invalidate = r.invalidate;
  useEffect(() => {
    const denied = isDenied(cmd.error)
      ? cmd.error
      : isDenied(downloadError)
        ? downloadError
        : undefined;
    if (denied) invalidate(denied);
  }, [cmd.error, downloadError, invalidate]);
  const base = location.pathname.replace(/\/[^/]+$/, '');
  usePageBreadcrumb([
    {
      label: t('templatePrintUI.title'),
      to: { pathname: base, search: location.search },
    },
    {
      label: (safe && record.name) || t('templatePrintUI.title'),
    },
  ]);
  const context = useMemo(
    () => ({
      reload: r.reload,
      onSaved: (v: Template) => {
        if (r.data) r.update({ data: { ...r.data.data, record: v } });
        r.reload();
      },
    }),
    [r],
  );
  useEffect(() => {
    if (
      r.error instanceof Error &&
      'status' in r.error &&
      r.error.status === 404
    ) {
      toaster.show({ type: 'info', title: t('templatePrintUI.missing') });
      parent?.reload?.();
      void Promise.resolve(
        navigate(
          { pathname: base, search: location.search },
          { replace: true },
        ),
      ).then(() =>
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>('[data-print-management-focus]')
            ?.focus(),
        ),
      );
    }
  }, [r.error, navigate, base, location.search, t, toaster, parent]);
  async function active(next: boolean) {
    if (!writable(record)) return;
    const latest = await api
      .request<{ data: Detail }>({
        path: `printTemplates/${templateId}`,
        query: { mode: 'manage' },
      })
      .catch((e: unknown) => {
        setDownloadError(e);
        return undefined;
      });
    if (!latest || !writable(latest.data.record)) return;
    const result = await cmd.execute<{ data: { record: Template } }>({
      path: `printTemplates/${templateId}`,
      method: 'PATCH',
      json: {
        name: latest.data.record.name,
        active: next,
        version: latest.data.record.version,
      },
    });
    if (result) {
      r.update({ data: { ...r.data!.data, record: result.data.record } });
      r.reload();
      setConfirm(false);
      toaster.show({
        type: 'success',
        title: t('templatePrintUI.saved', { name: result.data.record.name }),
      });
    }
  }
  async function download(revision: Revision) {
    if (!safe || downloadBusy) return;
    setDownloadBusy(revision.id);
    setDownloadError(undefined);
    controllerRef.current = new AbortController();
    try {
      await downloadDocx(
        api,
        {
          path: `printTemplates/${templateId}/revisions/${revision.id}/content`,
          signal: controllerRef.current.signal,
        },
        documentName(
          record?.name ?? t('templatePrintUI.document'),
          revision.number,
        ),
      );
      toaster.show({
        type: 'success',
        title: t('templatePrintUI.downloaded', { name: record?.name }),
      });
    } catch (e) {
      setDownloadError(e);
    } finally {
      setDownloadBusy(undefined);
    }
  }
  const date = (value?: string) =>
    value && Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '—';
  const revisions = [...(r.data?.data.revisions ?? [])].sort((a, b) => {
    const n =
      sort === 'number'
        ? a.number - b.number
        : Date.parse(a.createdAt) - Date.parse(b.createdAt);
    return descending ? -n : n;
  });
  return (
    <RecordDetailDrawer
      beforeClose={() => !cmd.busy}
      title={safe ? record.name : t('templatePrintUI.title')}
      footer={
        <>
          {safe ? (
            <>
              <Button
                nativeButton={false}
                variant='outline'
                render={
                  <Link to={{ pathname: 'edit', search: location.search }} />
                }
              >
                <Pencil />
                {t('templatePrintUI.edit')}
              </Button>
              {r.data?.data.sourceReady && supported(record.source) ? (
                <Button
                  nativeButton={false}
                  variant='outline'
                  render={
                    <Link
                      to={{ pathname: 'upload', search: location.search }}
                    />
                  }
                >
                  <Upload />
                  {t('templatePrintUI.upload')}
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={t('templatePrintUI.actions', {
                        name: record.name,
                      })}
                    />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-auto min-w-40' align='end'>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      disabled={!writable(record) || cmd.busy}
                      onClick={() =>
                        record.active ? setConfirm(true) : void active(true)
                      }
                    >
                      {t(
                        `templatePrintUI.${record.active ? 'disable' : 'enable'}`,
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}
          <Button variant='outline' onClick={r.reload} disabled={r.loading}>
            <RefreshCw />
            {t('templatePrintUI.refresh')}
          </Button>
        </>
      }
    >
      <div className='flex flex-col gap-6'>
        {r.error ? <ErrorState error={r.error} retry={r.reload} /> : null}
        {!r.data && r.loading ? <Loading /> : null}
        {cmd.error ? <ErrorState error={cmd.error} retry={r.reload} /> : null}
        {cmd.pending ? (
          <p>
            {t('templatePrintUI.unknown')}
            <Button
              variant='outline'
              disabled={cmd.busy}
              onClick={() => void active(Boolean(cmd.pending?.json?.active))}
            >
              {t('templatePrintUI.retry')}
            </Button>
          </p>
        ) : null}
        {downloadError ? <ErrorState error={downloadError} /> : null}
        {safe ? (
          <>
            <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {[
                [
                  'source',
                  record.source
                    ? t(`templatePrintUI.sourceLabels.${record.source}`)
                    : t('templatePrintUI.unreadable'),
                ],
                [
                  'active',
                  typeof record.active === 'boolean'
                    ? t(
                        `templatePrintUI.${record.active ? 'active' : 'inactive'}`,
                      )
                    : t('templatePrintUI.unreadable'),
                ],
                [
                  'creator',
                  <UserName
                    key={'creator'}
                    name={record.createdBy?.name ?? '—'}
                  />,
                ] as const,
                ['createdAt', date(record.createdAt)],
                ['updatedAt', date(record.updatedAt)],
                [
                  'currentRevision',
                  record.currentRevisionId
                    ? new Intl.NumberFormat(i18n.language).format(
                        revisions.find((v) => v.id === record.currentRevisionId)
                          ?.number ??
                          record.version ??
                          0,
                      )
                    : '—',
                ],
              ].map(([key, value]) => (
                <div key={key} className='flex flex-col gap-1'>
                  <dt className='text-sm text-muted-foreground'>
                    {t(`templatePrintUI.${key}`)}
                  </dt>
                  <dd className='break-words text-sm'>{value}</dd>
                </div>
              ))}
            </dl>
            {!r.data!.data.sourceReady ? (
              <p className='text-sm text-muted-foreground'>
                {t('templatePrintUI.sourceUnavailable')}
              </p>
            ) : null}
            <h2 className='text-base font-medium'>
              {t('templatePrintUI.history')}
            </h2>
            {revisions.length >= 100 ? (
              <p className='text-sm text-muted-foreground'>
                {t('templatePrintUI.historyCap')}
              </p>
            ) : null}
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => {
                          setSort('number');
                          setDescending(sort === 'number' ? !descending : true);
                        }}
                      >
                        {t('templatePrintUI.version')}
                        {sort === 'number' ? (descending ? ' ↓' : ' ↑') : null}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant='ghost'
                        onClick={() => {
                          setSort('createdAt');
                          setDescending(
                            sort === 'createdAt' ? !descending : true,
                          );
                        }}
                      >
                        {t('templatePrintUI.createdAt')}
                        {sort === 'createdAt'
                          ? descending
                            ? ' ↓'
                            : ' ↑'
                          : null}
                      </Button>
                    </TableHead>
                    <TableHead>{t('templatePrintUI.creator')}</TableHead>
                    <TableHead>{t('templatePrintUI.paths')}</TableHead>
                    <TableHead>{t('templatePrintUI.download')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revisions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className='text-right tabular-nums'>
                        {new Intl.NumberFormat(i18n.language).format(v.number)}
                      </TableCell>
                      <TableCell>{date(v.createdAt)}</TableCell>
                      <TableCell>
                        <UserName name={v.createdBy?.name ?? '—'} />
                      </TableCell>
                      <TableCell>
                        <details>
                          <summary>{t('templatePrintUI.paths')}</summary>
                          <ul>
                            {v.paths.map((path) => (
                              <li className='break-all' key={path}>
                                {path}
                              </li>
                            ))}
                          </ul>
                          <p className='break-all text-xs text-muted-foreground'>
                            {v.contentHash}
                          </p>
                        </details>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          disabled={!!downloadBusy}
                          onClick={() => void download(v)}
                        >
                          {downloadBusy === v.id ? <Spinner /> : <Download />}
                          {t('templatePrintUI.download')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!revisions.length ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        {t('templatePrintUI.noHistory')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
        <AlertDialog
          open={confirm}
          onOpenChange={(v) => {
            if (!cmd.busy) setConfirm(v);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('templatePrintUI.disableTitle', { name: record?.name })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('templatePrintUI.disableDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {cmd.error ? <ErrorState error={cmd.error} /> : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cmd.busy}>
                {t('templatePrintUI.cancel')}
              </AlertDialogCancel>
              <Button
                variant='destructive'
                disabled={cmd.busy || !safe}
                onClick={() => void active(false)}
              >
                {cmd.busy ? <Spinner /> : null}
                {t('templatePrintUI.disable')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Outlet context={context} />
      </div>
    </RecordDetailDrawer>
  );
}

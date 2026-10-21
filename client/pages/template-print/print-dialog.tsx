import { useEffect, useRef, useState } from 'react';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useOutletContext } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
import { isDenied, useResource } from './resource.js';
import { downloadDocx, documentName } from './download.js';
import {
  RESOURCE,
  supported,
  selectWidth,
  type PrintContext,
  type Detail,
  type Page,
} from './types.js';
import { ErrorState, Loading, EmptyState } from './states.js';
/** Root supplies this context from the actual authorized business detail, including on direct URL loads. */
export default function PrintDialog() {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const context = useOutletContext<PrintContext>();
  const workingRef = useRef(false);
  const [state, setState] = useState({ ready: false, busy: false });
  return (
    <RouteDrawer
      className='sm:max-w-2xl'
      title={t('templatePrintUI.printTitle')}
      description={t('templatePrintUI.printHint')}
      beforeClose={() => !workingRef.current}
      footer={<PrintFooter {...state} />}
    >
      <Body
        key={`${session?.user.id ?? ''}:${context?.printSource}:${context?.printRecordId}`}
        workingRef={workingRef}
        onState={setState}
      />
    </RouteDrawer>
  );
}
function Body({
  workingRef,
  onState,
}: {
  workingRef: React.MutableRefObject<boolean>;
  onState: (state: { ready: boolean; busy: boolean }) => void;
}) {
  const context = useOutletContext<PrintContext>();
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const source = supported(context?.printSource)
    ? context.printSource
    : undefined;
  const use = useCan({
    resource: { type: 'composite', id: RESOURCE },
    action: 'use',
  });
  const print = useCan({
    resource: { type: 'composite', id: RESOURCE },
    action: source
      ? `print${source[0].toUpperCase()}${source.slice(1)}`
      : 'use',
  });
  const view = useCan({
    resource: {
      type: 'composite',
      id:
        source === 'sealRegistration'
          ? 'oa.sealLedger'
          : source === 'contracts'
            ? 'oa.contract'
            : source === 'leave'
              ? 'oa.leave'
              : source === 'reimbursement'
                ? 'oa.reimbursement'
                : 'oa.payment',
    },
    action: 'view',
  });
  const allowed =
    !!source &&
    !!context.printRecordId &&
    use.can &&
    print.can &&
    view.can &&
    !use.isPending &&
    !print.isPending &&
    !view.isPending &&
    !use.error &&
    !print.error &&
    !view.error;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const controllerRef = useRef<AbortController | null>(null);
  const r = useResource<Page>(allowed ? 'printTemplates' : null, {
    mode: 'use',
    source: source ?? 'leave',
    page: String(page),
    pageSize: '20',
  });
  const detail = useResource<{ data: Detail }>(
    allowed && selected ? `printTemplates/${selected}` : null,
    { mode: 'use' },
  );
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    workingRef.current = busy;
  }, [busy, workingRef]);
  const template = detail.data?.data.record;
  useEffect(() => {
    if (detail.error instanceof ApiClientError && detail.error.status === 404) {
      toaster.show({ type: 'info', title: t('templatePrintUI.missing') });
      context?.printRefresh?.();
      void close().then(() =>
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLElement>('[data-print-source-focus]')
            ?.focus(),
        ),
      );
    }
  }, [detail.error, context, close, toaster, t]);
  const ready =
    allowed &&
    !isDenied(error) &&
    !r.error &&
    !detail.error &&
    !detail.loading &&
    detail.data?.data.sourceReady === true &&
    template?.source === source &&
    template.active === true &&
    typeof template.name === 'string' &&
    !!template.currentRevisionId;
  useEffect(() => {
    onState({ ready, busy });
  }, [ready, busy, onState]);
  async function download() {
    if (!ready || busy) return;
    workingRef.current = true;
    setBusy(true);
    setError(undefined);
    controllerRef.current = new AbortController();
    const json = {
      recordId: context.printRecordId,
      revisionId: template.currentRevisionId!,
      locale: i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US',
    };
    try {
      await downloadDocx(
        api,
        {
          path: `printTemplates/${selected}/render`,
          method: 'POST',
          json,
          signal: controllerRef.current.signal,
        },
        documentName(template.name!),
      );
      toaster.show({
        type: 'success',
        title: t('templatePrintUI.downloaded', { name: template.name }),
      });
      workingRef.current = false;
      void close();
    } catch (e) {
      setError(e);
      if (isDenied(e)) {
        r.invalidate(e);
        detail.invalidate(e);
        setSelected('');
      }
    } finally {
      workingRef.current = false;
      setBusy(false);
    }
  }
  const waiting = use.isPending || print.isPending || view.isPending;
  return (
    <form
      id='print-business-form'
      onSubmit={(e) => {
        e.preventDefault();
        void download();
      }}
      className='flex flex-col gap-4'
    >
      <p className='break-words text-sm'>{context?.printRecordName ?? '—'}</p>
      {waiting || (r.loading && !r.data) ? <Loading /> : null}
      {!waiting && !allowed ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('templatePrintUI.forbidden')}</AlertDescription>
        </Alert>
      ) : null}
      {r.error ? <ErrorState error={r.error} retry={r.reload} /> : null}
      {detail.error ? (
        <ErrorState error={detail.error} retry={detail.reload} />
      ) : null}
      {error ? <ErrorState error={error} /> : null}
      {r.data && allowed ? (
        <>
          <Field>
            <FieldLabel htmlFor='print-template-choice'>
              {t('templatePrintUI.template')}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            <Select
              items={
                Object.fromEntries([
                  ...r.data.data
                    .filter((v) => typeof v.name === 'string')
                    .map((v) => [v.id, v.name!]),
                  ...(template && typeof template.name === 'string'
                    ? [[template.id, template.name]]
                    : []),
                ]) as Record<string, string>
              }
              value={selected || null}
              disabled={busy}
              onValueChange={(v) => {
                setSelected(v ?? '');
                setError(undefined);
              }}
            >
              <SelectTrigger id='print-template-choice'>
                <SelectValue
                  placeholder={t('templatePrintUI.chooseTemplate')}
                />
              </SelectTrigger>
              <SelectContent className={selectWidth}>
                <SelectGroup>
                  {r.data.data.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      disabled={
                        v.active !== true ||
                        !v.currentRevisionId ||
                        v.source !== source ||
                        typeof v.name !== 'string'
                      }
                    >
                      {v.name ?? t('templatePrintUI.unreadable')}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          {r.data.meta.total === 0 ? <EmptyState use /> : null}
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={busy || page === 1}
              onClick={() => setPage((v) => v - 1)}
            >
              {t('dataTable.previousPage')}
            </Button>
            <span className='text-sm'>
              {new Intl.NumberFormat(i18n.language).format(page)} /{' '}
              {new Intl.NumberFormat(i18n.language).format(
                Math.max(1, Math.ceil(r.data.meta.total / 20)),
              )}
            </span>
            <Button
              type='button'
              variant='outline'
              disabled={busy || page * 20 >= r.data.meta.total}
              onClick={() => setPage((v) => v + 1)}
            >
              {t('dataTable.nextPage')}
            </Button>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={() => {
                r.reload();
                detail.reload();
              }}
            >
              {t('templatePrintUI.refresh')}
            </Button>
          </div>
        </>
      ) : null}
      {detail.loading ? <Loading /> : null}
      {detail.data && !detail.error && !isDenied(error) ? (
        <p className='text-sm text-muted-foreground'>
          {ready
            ? t('templatePrintUI.currentRevision') +
              ': ' +
              new Intl.NumberFormat(i18n.language).format(
                detail.data.data.revisions.find(
                  (v) => v.id === template?.currentRevisionId,
                )?.number ?? 0,
              )
            : t('templatePrintUI.noUsable')}
        </p>
      ) : null}
    </form>
  );
}

function PrintFooter({ ready, busy }: { ready: boolean; busy: boolean }) {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy}
        onClick={() => void close()}
      >
        {t('templatePrintUI.cancel')}
      </Button>
      <Button
        form='print-business-form'
        type='submit'
        disabled={!ready || busy}
      >
        {busy ? <Spinner /> : null}
        {t('templatePrintUI.download')}
      </Button>
    </>
  );
}

import { LongText } from '#components/long-text';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApiClient, useToaster, ApiClientError } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Field, FieldGroup, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '#components/ui/dialog';
import { createRequestKey } from '#lib/request-key';
import { useResource } from '../platform/shared/use-resource.js';
import { DemoAccounts } from './accounts.js';
import type {
  DemoStatus,
  DemoLocale,
  DemoPreview,
  DemoAccount,
} from './types.js';

const permission = (action: string) => ({
  resource: { type: 'settings' as const, id: 'oa.demoData' },
  action,
});
export default function DemoDataPage() {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster();
  const status = useResource<DemoStatus>('demoData');
  const mayImport = useCan(permission('import')),
    mayRemove = useCan(permission('remove')),
    mayCredentials = useCan(permission('credentials'));
  const [locale, setLocale] = useState<DemoLocale>(
    i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US',
  );
  const [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DemoPreview | null>(null),
    [confirmError, setConfirmError] = useState<string | null>(null);
  const [credentialOpen, setCredentialOpen] = useState(false),
    [credentials, setCredentials] = useState<
      (DemoAccount & { password: string })[] | null
    >(null),
    [credentialError, setCredentialError] = useState<string | null>(null);
  const titleRef = useRef<HTMLSpanElement>(null),
    previousRef = useRef<string | undefined>(undefined);
  const terminalError =
    status.error instanceof ApiClientError &&
    [401, 403, 404].includes(status.error.status);
  const d = terminalError ? undefined : status.data,
    busy = d?.state === 'importing' || d?.state === 'removing';
  const credentialAbortRef = useRef<AbortController | null>(null);
  const company = t('demoData.company');
  const [failureStatus, setFailureStatus] = useState<number | null>(null);
  const [viewBatch, setViewBatch] = useState<string | undefined>(undefined);
  const batch = d?.datasetId ? `${d.datasetId}:${d.version}` : undefined;
  if (batch !== viewBatch) {
    setViewBatch(batch);
    setPreview(null);
    setCredentialOpen(false);
    setCredentials(null);
  }
  useEffect(() => () => credentialAbortRef.current?.abort(), [batch]);

  const message = (value: unknown) =>
    value instanceof ApiClientError
      ? t(
          value.status === 404
            ? 'demoData.notFound'
            : value.status === 401
              ? 'demoData.sessionExpired'
              : value.status === 403
                ? 'demoData.denied'
                : value.reason === 'DEMO_REFERENCE_CONFLICT'
                  ? 'demoData.blocked'
                  : value.status === 409
                    ? 'demoData.changed'
                    : 'demoData.failed',
        )
      : t('demoData.failed');
  const report = (value: unknown) => {
    setFailureStatus(value instanceof ApiClientError ? value.status : null);
    return message(value);
  };
  const recovery =
    failureStatus === 401 ? (
      <Link to='/login'>{t('demoData.signIn')}</Link>
    ) : failureStatus === 403 || failureStatus === 404 ? (
      <Link to='/'>{t('demoData.workbench')}</Link>
    ) : null;
  useEffect(() => {
    const timer = setInterval(status.reload, busy ? 2000 : 15000);
    return () => clearInterval(timer);
  }, [status.reload, busy]);
  useEffect(() => {
    if (!d) return;
    const last = previousRef.current;
    previousRef.current = d.state;
    if (last === 'importing' && d.state === 'ready')
      toaster.show({
        type: 'success',
        title: t('demoData.imported', { name: company }),
      });
    if (last === 'removing' && d.state === 'absent') {
      toaster.show({
        type: 'success',
        title: t('demoData.removed', { name: company }),
      });
      titleRef.current?.focus();
    }
    if (
      (last === 'importing' || last === 'removing') &&
      (d.state === 'importFailed' || d.state === 'removeFailed')
    )
      toaster.show({ type: 'error', title: t('demoData.failed') });
  }, [d, toaster, t, company]);
  useEffect(
    () => () => {
      credentials?.forEach((c) => {
        c.password = '';
      });
    },
    [credentials],
  );
  async function startImport() {
    if (!d) return;
    setPending('import');
    setError(null);
    try {
      const result = await api.request<{ data: DemoStatus }>({
        path: 'demoData/import',
        method: 'POST',
        json: {
          locale: d.locale ?? locale,
          expectedVersion: d.version,
          requestKey: createRequestKey(),
        },
      });
      status.replace(result.data);
    } catch (e) {
      setError(report(e));
    } finally {
      setPending(null);
    }
  }
  async function checkRemoval() {
    if (!d?.datasetId) return;
    setPending('preview');
    setError(null);
    setConfirmError(null);
    try {
      const r = await api.request<{ data: DemoPreview }>({
        path: 'demoData/removePreview',
        method: 'POST',
        json: { datasetId: d.datasetId, expectedVersion: d.version },
      });
      setPreview(r.data);
    } catch (e) {
      setError(report(e));
    } finally {
      setPending(null);
    }
  }
  async function remove() {
    if (!d?.datasetId || !preview) return;
    setPending('remove');
    setConfirmError(null);
    try {
      const r = await api.request<{ data: DemoStatus }>({
        path: 'demoData/remove',
        method: 'POST',
        json: {
          datasetId: d.datasetId,
          expectedVersion: preview.version,
          previewToken: preview.previewToken,
          requestKey: createRequestKey(),
        },
      });
      status.replace(r.data);
      setPreview(null);
    } catch (e) {
      if (
        e instanceof ApiClientError &&
        [401, 403, 404, 409].includes(e.status)
      ) {
        setPreview(null);
        setError(report(e));
        status.reload();
      } else setConfirmError(report(e));
    } finally {
      setPending(null);
    }
  }
  async function reveal() {
    if (!d?.datasetId) return;
    setCredentialOpen(true);
    setCredentialError(null);
    setCredentials(null);
    setPending('credentials');
    const controller = new AbortController();
    credentialAbortRef.current?.abort();
    credentialAbortRef.current = controller;
    try {
      const r = await api.request<{
        data: { accounts: (DemoAccount & { password: string })[] };
      }>({
        path: 'demoData/credentials',
        signal: controller.signal,
        method: 'POST',
        json: { datasetId: d.datasetId, expectedVersion: d.version },
      });
      if (!controller.signal.aborted) setCredentials(r.data.accounts);
    } catch (e) {
      if (!controller.signal.aborted) setCredentialError(report(e));
    } finally {
      setPending(null);
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toaster.show({ type: 'success', title: t('demoData.copied') });
    } catch {
      setCredentialError(t('demoData.copyFailed'));
    }
  }
  return (
    <PageContainer className='max-w-4xl'>
      <PageHeader
        title={
          <span ref={titleRef} tabIndex={-1}>
            {t('demoData.title')}
          </span>
        }
        description={t('demoData.description')}
      />
      {Boolean(status.error) && (
        <Alert variant='destructive'>
          <AlertDescription>
            {message(status.error)}{' '}
            {status.error instanceof ApiClientError &&
            status.error.status === 401 ? (
              <Link to='/login'>{t('demoData.signIn')}</Link>
            ) : status.error instanceof ApiClientError &&
              [403, 404].includes(status.error.status) ? (
              <Link to='/'>{t('demoData.workbench')}</Link>
            ) : (
              <Button variant='outline' onClick={status.reload}>
                {t('demoData.retry')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {!d && !status.error ? (
        <div aria-label={t('demoData.loading')} className='flex flex-col gap-4'>
          <Skeleton className='h-48' />
          <Skeleton className='h-36' />
        </div>
      ) : (
        d && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('demoData.dataset')}</CardTitle>
                <CardDescription>
                  {t('demoData.datasetDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                {d.state === 'absent' ? (
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor='demo-locale'>
                        {t('demoData.language')} *
                      </FieldLabel>
                      <Select
                        value={locale}
                        onValueChange={(v) => {
                          if (v === 'zh-CN' || v === 'en-US') setLocale(v);
                        }}
                        disabled={Boolean(pending)}
                      >
                        <SelectTrigger id='demo-locale'>
                          <SelectValue>
                            {locale === 'zh-CN' ? '简体中文' : 'English'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          <SelectGroup>
                            <SelectItem value='zh-CN'>简体中文</SelectItem>
                            <SelectItem value='en-US'>English</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                ) : (
                  <div className='flex flex-wrap gap-3'>
                    <Badge variant='outline'>
                      {t(`demoData.state.${d.state}`)}
                    </Badge>
                    <span>{d.locale === 'zh-CN' ? '简体中文' : 'English'}</span>
                    <span>
                      {d.baseDate &&
                        new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: 'medium',
                          timeZone: 'UTC',
                        }).format(new Date(`${d.baseDate}T00:00:00Z`))}{' '}
                      · {d.timeZone}
                    </span>
                  </div>
                )}
                <p className='text-sm text-muted-foreground'>
                  {t(
                    d.state === 'absent'
                      ? 'demoData.dateHint'
                      : 'demoData.changeLanguage',
                  )}
                </p>
                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription>
                      <LongText>{error}</LongText>
                      {recovery}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              {mayImport.can &&
                (d.state === 'absent' || d.state === 'importFailed') && (
                  <CardFooter className='justify-end'>
                    <Button
                      disabled={Boolean(pending) || busy}
                      onClick={() => void startImport()}
                    >
                      {pending === 'import' && <Spinner />}
                      {t(
                        d.state === 'importFailed'
                          ? 'demoData.retry'
                          : 'demoData.import',
                      )}
                    </Button>
                  </CardFooter>
                )}
            </Card>
            {d.state !== 'absent' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t('demoData.progress')}
                      {status.loading && (
                        <span className='ml-2 text-sm text-muted-foreground'>
                          {t('demoData.loading')}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {t('demoData.progressDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-4'>
                    <p role='status'>
                      {t('demoData.stepProgress', {
                        count: d.completedSteps,
                        total: d.totalSteps,
                      })}{' '}
                      · {t(`demoData.state.${d.state}`)}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {t(`demoData.stages.${d.stage ?? 'generating'}`)}
                    </p>
                    {d.moduleCoverage.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {d.moduleCoverage.map((module) => (
                          <Badge key={module.key} variant='outline'>
                            {t(`demoData.modules.${module.key.slice(1)}`)} ·{' '}
                            {module.count}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {busy && (
                      <p className='text-sm text-muted-foreground'>
                        {t('demoData.busy')}
                      </p>
                    )}
                    {d.safeFailures
                      .filter((f) => f.module)
                      .map((f) => (
                        <LongText
                          key={f.key}
                          className='text-sm text-destructive'
                        >
                          {t('demoData.moduleFailed', {
                            module: t(`demoData.modules.${f.module}`),
                          })}
                        </LongText>
                      ))}
                    {d.safeFailures.length > 0 && (
                      <Alert variant='destructive'>
                        <AlertDescription>
                          <LongText>
                            {t(
                              d.safeFailures.some(
                                (f) => f.reason === 'DEMO_REFERENCE_CONFLICT',
                              )
                                ? 'demoData.blocked'
                                : 'demoData.failed',
                            )}
                          </LongText>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>{t('demoData.accounts')}</CardTitle>
                    <CardDescription>
                      {t('demoData.accountDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='px-0'>
                    <DemoAccounts
                      accounts={d.accounts}
                      onReload={d.state === 'ready' ? status.reload : undefined}
                    />
                  </CardContent>
                  {mayCredentials.can && d.accounts.length > 0 && (
                    <CardFooter className='justify-end'>
                      <Button
                        variant='outline'
                        disabled={Boolean(pending) || busy}
                        onClick={() => void reveal()}
                      >
                        {pending === 'credentials' && <Spinner />}
                        {t('demoData.credentials')}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
                {mayRemove.can && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('demoData.remove')}</CardTitle>
                      <CardDescription>
                        {t('demoData.removeDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className='justify-end'>
                      <Button
                        variant='destructive'
                        disabled={Boolean(pending) || busy}
                        onClick={() => void checkRemoval()}
                      >
                        {pending === 'preview' && <Spinner />}
                        {t('demoData.remove')}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </>
            )}
          </>
        )
      )}
      <AlertDialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setPreview(null);
        }}
      >
        <AlertDialogContent className='max-h-[calc(100dvh-2rem)]'>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('demoData.removeTitle', { name: company })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('demoData.removeConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='min-h-0 overflow-y-auto'>
            {preview && (
              <p>
                {t('demoData.removeCounts', {
                  records: preview.records,
                  accounts: preview.accounts,
                })}
              </p>
            )}
            {preview?.blocked && (
              <LongText className='text-sm text-destructive'>
                {t('demoData.blocked')}
              </LongText>
            )}
            {confirmError && (
              <Alert variant='destructive'>
                <AlertDescription>
                  <LongText>{confirmError}</LongText>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pending)}>
              {t('demoData.cancel')}
            </AlertDialogCancel>
            {!preview?.blocked && (
              <Button
                variant='destructive'
                disabled={Boolean(pending)}
                onClick={() => void remove()}
              >
                {pending === 'remove' && <Spinner />}
                {t('demoData.remove')}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={credentialOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setCredentialOpen(open);
            if (!open) {
              setCredentials(null);
              setCredentialError(null);
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-md'
        >
          <DialogHeader>
            <DialogTitle>{t('demoData.credentialsTitle')}</DialogTitle>
            <DialogDescription>
              {t('demoData.credentialDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='flex min-h-0 flex-col gap-4 overflow-y-auto'>
            {pending === 'credentials' && (
              <Spinner aria-label={t('demoData.loading')} />
            )}{' '}
            {credentialError && (
              <Alert variant='destructive'>
                <AlertDescription>
                  {credentialError}
                  {recovery}
                </AlertDescription>
              </Alert>
            )}
            {credentials?.map((a) => (
              <div
                key={a.id}
                className='flex flex-col gap-2 rounded-lg border p-4'
              >
                <p className='font-medium'>
                  {a.name} · {t(`demoData.roles.${a.role}`)}
                </p>
                <p className='break-all select-all'>{a.email}</p>
                <p className='break-all select-all'>{a.password}</p>
                <Button
                  variant='outline'
                  onClick={() => void copy(`${a.email}\n${a.password}`)}
                  aria-label={`${t('demoData.copy')} ${a.name}`}
                >
                  {t('demoData.copy')}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={Boolean(pending)}
              onClick={() => {
                setCredentialOpen(false);
                setCredentials(null);
                setCredentialError(null);
              }}
            >
              {t('demoData.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

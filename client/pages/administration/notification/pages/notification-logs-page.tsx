import { useFormDiscardGuard } from '#hooks/use-form-discard-guard';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { IconAction } from '../../components/icon-action.js';
import { LoadFailure } from '../../components/load-failure.js';
import { responseStatus } from '../../components/response-status.js';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { TruncatedText } from '#components/truncated-text';
import { StatusBadge as ApplicationStatusBadge } from '#components/status-badge';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import { Button } from '#components/ui/button';
import { ChevronRight, ArrowUpDown } from 'lucide-react';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ResponsiveTable as Table } from '#components/responsive-table';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import type {
  NotificationDeliveryDetails,
  NotificationLogDetails,
  NotificationStatus,
  NotificationTestTarget,
} from '../notification-client.js';
import { getNotificationClient } from '../runtime.js';

const notification = getNotificationClient();

type Translate = (
  key: string,
  options?: Readonly<Record<string, unknown>>,
) => string;

export default function NotificationLogsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const [logs, setLogs] = useState<readonly NotificationLogDetails[]>([]);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [testOpen, setTestOpen] = useState(false);
  const [testTargets, setTestTargets] =
    useState<readonly NotificationTestTarget[]>();
  const [testTargetsError, setTestTargetsError] = useState<string>();

  const refresh = (): void => {
    setLoading(true);
    setError(undefined);
    setRevision((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    void notification
      .listLogs()
      .then(
        (nextLogs) => {
          if (active) setLogs(nextLogs);
        },
        (cause: unknown) => {
          if (!active) return;
          setError(cause);
          if ([401, 403, 404].includes(responseStatus(cause) ?? 0)) {
            setLogs([]);
            setTestTargets([]);
            setTestOpen(false);
          }
        },
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, t]);

  useEffect(() => {
    let active = true;
    void notification.listTestTargets().then(
      (targets) => {
        if (active) {
          setTestTargets(targets);
          setTestTargetsError(undefined);
        }
      },
      (cause: unknown) => {
        if (active) {
          setTestTargets([]);
          setTestTargetsError(
            errorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Notification request failed.',
              }),
            ),
          );
        }
      },
    );
    return () => {
      active = false;
    };
  }, [t, revision]);

  const totals = useMemo(
    () => ({
      deliveries: logs.reduce((sum, item) => sum + item.deliveries.length, 0),
      attention: logs.filter((item) =>
        ['failed', 'partial', 'unknown'].includes(item.log.status),
      ).length,
    }),
    [logs],
  );

  return (
    <PageContainer>
      <PageHeader
        title={t('logs.title', { defaultValue: 'Notification logs' })}
        actions={
          <ApplicationRefreshButton
            label={t('logs.refresh')}
            loading={loading}
            onClick={refresh}
          />
        }
        description={t('logs.description', {
          defaultValue:
            'Trace notification delivery and every provider attempt. Message bodies, recipients, and lease tokens are redacted.',
        })}
      />
      <ApplicationToolbar
        actions={
          <>
            <Button onClick={() => setTestOpen(true)} type='button'>
              {t('logs.sendTest', {
                defaultValue: 'Send test notification',
              })}
            </Button>
          </>
        }
      />

      <div className='flex flex-col gap-5'>
        <div className='grid max-w-md grid-cols-2 gap-3'>
          <Metric
            label={t('logs.deliveriesShown', {
              defaultValue: 'Deliveries shown',
            })}
            value={totals.deliveries}
          />
          <Metric
            attention
            label={t('logs.needAttention', { defaultValue: 'Need attention' })}
            value={totals.attention}
          />
        </div>

        {error ? (
          <LoadFailure
            error={error}
            message={t(
              responseStatus(error) === 403
                ? 'errors.forbidden'
                : responseStatus(error) === 404
                  ? 'errors.notFound'
                  : 'errors.requestFailed',
            )}
            retryLabel={t('logs.retry')}
            onRetry={refresh}
          />
        ) : null}

        {logs.length >= 100 ? (
          <p className='text-sm text-muted-foreground'>
            {t('logs.limitNotice', { count: 100 })}
          </p>
        ) : null}
        <section className='overflow-hidden rounded-xl border bg-card shadow-sm'>
          <div className='border-b bg-muted/20 px-5 py-4'>
            <h2 className='text-base font-medium'>
              {t('logs.recent', { defaultValue: 'Recent notifications' })}
            </h2>
          </div>
          {loading && logs.length === 0 ? (
            <ApplicationTableSkeleton columns={5} />
          ) : error && logs.length === 0 ? null : logs.length === 0 ? (
            <ApplicationTableEmpty
              title={t('logs.emptyTitle')}
              description={t('logs.emptyDescription')}
            />
          ) : (
            <NotificationLogsTable logs={logs} targets={testTargets} />
          )}
        </section>
      </div>
      {testOpen ? (
        <TestNotificationDialog
          targets={testTargets}
          targetsError={testTargetsError}
          onClose={() => setTestOpen(false)}
          onSent={refresh}
        />
      ) : null}
    </PageContainer>
  );
}

function TestNotificationDialog({
  targets,
  targetsError,
  onClose,
  onSent,
}: {
  readonly targets?: readonly NotificationTestTarget[];
  readonly targetsError?: string;
  readonly onClose: () => void;
  readonly onSent: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const [selected, setSelected] = useState<NotificationTestTarget>();
  const [values, setValues] = useState<Readonly<Record<string, string>>>({});
  const [sending, setSending] = useState(false);
  const [checked, setChecked] = useState(false);
  const fieldProblems = Object.fromEntries(
    (selected?.fields ?? []).flatMap<readonly [string, string]>((field) => {
      const value = values[field.name]?.trim() ?? '';
      const problem =
        field.required && !value
          ? t('test.fieldRequired', { name: field.label })
          : value &&
              field.type === 'email' &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? t('test.emailInvalid', { name: field.label })
            : undefined;
      return problem ? [[field.name, problem]] : [];
    }),
  );
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const guard = useFormDiscardGuard(
    !success && Object.values(values).some(Boolean),
    sending,
  );
  const close = () => {
    void guard.requestClose(onClose);
  };

  const send = (): void => {
    if (!selected) return;
    setChecked(true);
    const first = selected.fields.find((field) => fieldProblems[field.name]);
    if (first) {
      document.getElementById(`notification-test-${first.name}`)?.focus();
      return;
    }
    setSending(true);
    setError(undefined);
    setSuccess(undefined);
    void notification
      .sendTest({
        channel: selected.channel.name,
        values,
      })
      .then(
        (result) => {
          setSuccess(
            t('test.accepted', {
              defaultValue: `Test notification ${result.notificationId} accepted.`,
              id: result.notificationId,
            }),
          );
          onSent();
        },
        (cause: unknown) =>
          setError(
            errorMessage(
              cause,
              t('errors.requestFailed', {
                defaultValue: 'Notification request failed.',
              }),
            ),
          ),
      )
      .finally(() => setSending(false));
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <FormDrawerContent showCloseButton={!sending}>
        <FormDrawerHeader>
          <DialogTitle>
            {t('test.title', { defaultValue: 'Send test notification' })}
          </DialogTitle>
          <DialogDescription>
            {t('test.description', {
              defaultValue:
                'Select a Channel, then click Send. The message is sent to the recipient you provide and recorded below.',
            })}
          </DialogDescription>
        </FormDrawerHeader>
        <FormDrawerBody>
          {targetsError ? (
            <Alert variant='destructive'>
              <AlertDescription>{targetsError}</AlertDescription>
            </Alert>
          ) : targets === undefined ? (
            <span className='rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground'>
              {t('test.loadingProviders', {
                defaultValue: 'Loading configured Providers…',
              })}
            </span>
          ) : targets.length === 0 ? (
            <span className='rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground'>
              {t('test.noProviders', {
                defaultValue: 'No enabled Providers are configured.',
              })}
            </span>
          ) : (
            <label className='grid gap-1.5 text-sm font-medium'>
              {t('test.channelProvider', {
                defaultValue: 'Delivery method',
              })}
              <Select
                items={targets.map((item) => ({
                  value: providerKey(item),
                  label: item.channel.name,
                }))}
                disabled={sending}
                value={selected ? providerKey(selected) : null}
                onValueChange={(value) => {
                  const target = targets.find(
                    (item) => providerKey(item) === value,
                  );
                  setSelected(target);
                  setChecked(false);
                  setValues(
                    Object.fromEntries(
                      (target?.fields ?? []).map((field) => [
                        field.name,
                        field.defaultValue ?? '',
                      ]),
                    ),
                  );
                }}
              >
                <SelectTrigger
                  className='w-full'
                  aria-label={t('test.channelProvider', {
                    defaultValue: 'Delivery method',
                  })}
                >
                  <SelectValue
                    placeholder={t('test.selectProvider', {
                      defaultValue: 'Select a delivery method',
                    })}
                  />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {targets.map((item) => (
                    <SelectItem
                      key={providerKey(item)}
                      value={providerKey(item)}
                    >
                      {item.channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          )}

          {selected?.fields.map((field) => (
            <label
              className='grid gap-1.5 text-sm font-medium'
              key={field.name}
            >
              {field.label}
              {field.required ? (
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              ) : null}
              {field.type === 'textarea' ? (
                <Textarea
                  id={`notification-test-${field.name}`}
                  aria-label={field.label}
                  aria-invalid={checked && Boolean(fieldProblems[field.name])}
                  aria-describedby={
                    checked && fieldProblems[field.name]
                      ? `notification-test-${field.name}-error`
                      : undefined
                  }
                  disabled={sending}
                  maxLength={field.maxLength}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  aria-required={field.required}
                  value={values[field.name] ?? ''}
                />
              ) : (
                <Input
                  id={`notification-test-${field.name}`}
                  aria-label={field.label}
                  aria-invalid={checked && Boolean(fieldProblems[field.name])}
                  aria-describedby={
                    checked && fieldProblems[field.name]
                      ? `notification-test-${field.name}-error`
                      : undefined
                  }
                  disabled={sending}
                  maxLength={field.maxLength}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  aria-required={field.required}
                  type={field.type}
                  value={values[field.name] ?? ''}
                />
              )}
              {checked && fieldProblems[field.name] ? (
                <span
                  id={`notification-test-${field.name}-error`}
                  role='alert'
                  className='text-sm text-destructive'
                >
                  {fieldProblems[field.name]}
                </span>
              ) : null}
            </label>
          ))}

          {error ? (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {success ? (
            <div className='rounded-lg border border-(--status-success)/30 bg-(--status-success-background) p-3 text-sm text-(--status-success)'>
              {success}
            </div>
          ) : null}
        </FormDrawerBody>
        <FormDrawerFooter>
          <Button
            variant='outline'
            disabled={sending}
            onClick={close}
            type='button'
          >
            {t('test.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button disabled={sending || !selected} onClick={send} type='button'>
            {sending
              ? t('test.sending', { defaultValue: 'Sending…' })
              : t('test.send', { defaultValue: 'Send' })}
          </Button>
        </FormDrawerFooter>
      </FormDrawerContent>
      {guard.confirmation}
    </Dialog>
  );
}

function providerKey(item: NotificationTestTarget): string {
  return item.channel.name;
}

function Metric({
  label,
  value,
  attention = false,
}: {
  readonly label: string;
  readonly value: number;
  readonly attention?: boolean;
}): ReactElement {
  return (
    <div className='rounded-xl border bg-card px-4 py-3 shadow-sm'>
      <div
        className={`text-2xl font-semibold tabular-nums ${attention && value > 0 ? 'text-destructive' : ''}`}
      >
        {value}
      </div>
      <div className='text-xs text-muted-foreground'>{label}</div>
    </div>
  );
}

function NotificationLogsTable({
  logs,
  targets,
}: {
  readonly logs: readonly NotificationLogDetails[];
  readonly targets?: readonly NotificationTestTarget[];
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  const [sort, setSort] = useState<'createdAt' | 'deliveries'>('createdAt');
  const [descending, setDescending] = useState(true);
  const sorted = [...logs].sort(
    (a, b) =>
      (sort === 'createdAt'
        ? Date.parse(a.log.createdAt) - Date.parse(b.log.createdAt)
        : a.deliveries.length - b.deliveries.length) * (descending ? -1 : 1),
  );
  const sortBy = (field: 'createdAt' | 'deliveries') => {
    if (sort === field) setDescending((value) => !value);
    else {
      setSort(field);
      setDescending(true);
    }
  };

  return (
    <div className='min-w-0'>
      <Table className='w-full min-w-[860px] text-sm'>
        <thead className='bg-muted/35 text-left'>
          <tr className='border-b'>
            <th
              className='w-12 px-4 py-3'
              aria-label={t('logs.expand', {
                defaultValue: 'Expand notification',
              })}
            />
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.source', { defaultValue: 'Source' })}
            </th>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.notificationId', {
                defaultValue: 'Notification ID',
              })}
            </th>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.status', { defaultValue: 'Status' })}
            </th>
            <th
              className='px-4 py-3 text-right font-medium'
              aria-sort={
                sort === 'deliveries'
                  ? descending
                    ? 'descending'
                    : 'ascending'
                  : 'none'
              }
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={() => sortBy('deliveries')}
              >
                {t('logs.columns.deliveries')}
                <ArrowUpDown />
              </Button>
            </th>
            <th
              className='px-4 py-3 font-medium'
              aria-sort={
                sort === 'createdAt'
                  ? descending
                    ? 'descending'
                    : 'ascending'
                  : 'none'
              }
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={() => sortBy('createdAt')}
              >
                {t('logs.columns.created')}
                <ArrowUpDown />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((details) => (
            <NotificationTableRow
              key={details.log.id}
              details={details}
              targets={targets}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function NotificationTableRow({
  details,
  targets,
}: {
  readonly details: NotificationLogDetails;
  readonly targets?: readonly NotificationTestTarget[];
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-notification');
  const [open, setOpen] = useState(false);
  return (
    <Fragment>
      <tr className='border-b' aria-expanded={open}>
        <td className='px-4 py-3'>
          <IconAction label={t(open ? 'logs.collapse' : 'logs.expand')}>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={
                open
                  ? t('logs.collapse', {
                      defaultValue: 'Collapse notification',
                    })
                  : t('logs.expand', { defaultValue: 'Expand notification' })
              }
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              type='button'
            >
              <ChevronRight
                className={`transition-transform ${open ? 'rotate-90' : ''}`}
              />
            </Button>
          </IconAction>
        </td>
        <td className='px-4 py-3'>
          <div className='font-medium'>{details.log.sourceType}</div>
          {details.log.sourceReferenceId ? (
            <div className='mt-0.5 max-w-48 text-xs text-muted-foreground'>
              <TruncatedText text={details.log.sourceReferenceId} />
            </div>
          ) : null}
        </td>
        <td className='px-4 py-3'>
          <code
            className='text-xs text-muted-foreground'
            title={details.log.id}
          >
            {details.log.id}
          </code>
        </td>
        <td className='px-4 py-3'>
          <StatusBadge status={details.log.status} />
        </td>
        <td className='px-4 py-3 text-right tabular-nums'>
          {details.deliveries.length}
        </td>
        <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
          <time dateTime={details.log.createdAt}>
            {formatTime(details.log.createdAt, i18n.language)}
          </time>
        </td>
      </tr>
      {open ? (
        <tr className='border-b bg-muted/15'>
          <td colSpan={6} className='p-4 sm:px-12'>
            <DeliveryTable deliveries={details.deliveries} targets={targets} />
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function DeliveryTable({
  deliveries,
  targets,
}: {
  readonly deliveries: readonly NotificationDeliveryDetails[];
  readonly targets?: readonly NotificationTestTarget[];
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-notification');
  if (deliveries.length === 0) {
    return (
      <p className='py-4 text-center text-sm text-muted-foreground'>
        {t('logs.noDeliveries', {
          defaultValue: 'No deliveries recorded.',
        })}
      </p>
    );
  }

  return (
    <div className='min-w-0 rounded-lg border bg-card'>
      <Table className='w-full min-w-[760px] text-sm'>
        <thead className='bg-muted/35 text-left'>
          <tr className='border-b'>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.channel', { defaultValue: 'Channel' })}
            </th>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.provider', { defaultValue: 'Provider' })}
            </th>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.status', { defaultValue: 'Status' })}
            </th>
            <th className='px-4 py-3 text-right font-medium'>
              {t('logs.columns.attempts', { defaultValue: 'Attempts' })}
            </th>
            <th className='px-4 py-3 font-medium'>
              {t('logs.columns.updated', { defaultValue: 'Updated' })}
            </th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((details) => {
            const presentation = providerPresentation(
              details.delivery.channelName,
              details.delivery.providerType,
              targets,
            );
            return (
              <Fragment key={details.delivery.id}>
                <tr className='border-b'>
                  <td className='px-4 py-3'>{presentation.channel}</td>
                  <td className='px-4 py-3'>
                    <div className='font-medium'>{presentation.provider}</div>
                    {presentation.detail ? (
                      <div className='text-xs text-muted-foreground'>
                        {presentation.detail}
                      </div>
                    ) : null}
                  </td>
                  <td className='px-4 py-3'>
                    <StatusBadge status={details.delivery.status} />
                  </td>
                  <td className='px-4 py-3 text-right tabular-nums'>
                    {details.attempts.length}
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-muted-foreground'>
                    {formatTime(details.delivery.updatedAt, i18n.language)}
                  </td>
                </tr>
                <tr className='border-b bg-muted/10'>
                  <td colSpan={5} className='px-4 py-3'>
                    <AttemptList details={details} targets={targets} />
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function AttemptList({
  details,
  targets,
}: {
  readonly details: NotificationDeliveryDetails;
  readonly targets?: readonly NotificationTestTarget[];
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  if (details.attempts.length === 0) {
    return (
      <p className='text-xs text-muted-foreground'>
        {t('logs.noAttempts', { defaultValue: 'No attempts recorded.' })}
      </p>
    );
  }
  return (
    <div className='grid gap-1.5'>
      {details.attempts.map((attempt) => {
        const presentation = providerPresentation(
          details.delivery.channelName,
          attempt.providerType,
          targets,
        );
        return (
          <div
            key={attempt.id}
            className='grid grid-cols-[2.5rem_minmax(8rem,1fr)_auto] items-center gap-3 rounded-md bg-muted/35 px-3 py-2 text-xs'
          >
            <span className='font-mono text-muted-foreground'>
              #{attempt.sequence}
            </span>
            <span className='min-w-0'>
              <strong>{presentation.provider}</strong>
              {presentation.detail ? (
                <span className='ml-2 text-muted-foreground'>
                  {presentation.detail}
                </span>
              ) : null}
              {attempt.error ? (
                <span className='mt-1 block text-destructive'>
                  <TruncatedText
                    text={providerErrorMessage(t, attempt.error)}
                  />
                </span>
              ) : null}
            </span>
            <StatusBadge status={attempt.status} />
          </div>
        );
      })}
    </div>
  );
}

function providerPresentation(
  channel: string,
  providerType: string,
  targets?: readonly NotificationTestTarget[],
): {
  readonly channel: string;
  readonly provider: string;
  readonly detail?: string;
} {
  const target = targets?.find(
    (candidate) =>
      candidate.channel.name === channel &&
      candidate.provider.type === providerType,
  );
  return { channel, provider: target?.provider.label ?? providerType };
}

function StatusBadge({
  status,
}: {
  readonly status: NotificationStatus;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-notification');
  return (
    <ApplicationStatusBadge tone={statusTone(status)}>
      {t(`status.${status}`, { defaultValue: status.replace('_', ' ') })}
    </ApplicationStatusBadge>
  );
}

function statusTone(
  status: NotificationStatus,
): 'success' | 'destructive' | 'warning' {
  if (status === 'completed' || status === 'accepted') {
    return 'success';
  }
  if (status === 'failed' || status === 'unknown' || status === 'partial') {
    return 'destructive';
  }
  return 'warning';
}

function formatTime(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function errorMessage(_value: unknown, fallback: string): string {
  return fallback;
}

function providerErrorMessage(
  t: Translate,
  error: { readonly message: string; readonly code?: string },
): string {
  if (error.code === 'IN_APP_NOTIFICATION_RECIPIENT_NOT_FOUND')
    return t('errors.inAppRecipientNotFound', {
      defaultValue: 'In-app notification recipient does not exist.',
    });
  return t('errors.providerFailed');
}

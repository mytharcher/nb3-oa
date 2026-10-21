import { createRequestKey } from '#lib/request-key';
import { errorKey } from './errors.js';
import { useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  ApiClientError,
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useOutletContext,
  useParams,
  useLocation,
  useNavigate,
} from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Textarea } from '#components/ui/textarea';
import { Switch } from '#components/ui/switch';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { FutureList } from './availability.js';
import { useMeetingResource } from './resource.js';
import { Loading, MeetingError, FormError } from './states.js';
import type { Booking, Action, Context, Future, Options } from './types.js';
export default function BookingAction() {
  const { bookingId, action } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<Context>(),
    [busy, setBusy] = useState(false),
    workingRef = useRef(false);
  const r = useMeetingResource<{ data: Booking }>(
      `meetingBookings/${encodeURIComponent(bookingId!)}`,
    ),
    a = useMeetingResource<{ data: { actions: Action[] } }>(
      `meetingBookings/${encodeURIComponent(bookingId!)}/actions`,
    ),
    o = useMeetingResource<{ data: Options }>('meetingBookings/options');
  const valid = ['cancel', 'confirm', 'reject', 'checkIn'].includes(
      action ?? '',
    ),
    ready =
      valid &&
      !r.loading &&
      !a.loading &&
      !r.error &&
      !a.error &&
      !o.loading &&
      !o.error &&
      !!r.data &&
      !!a.data?.data.actions.includes(action as Action);
  const bind = (v: boolean) => {
    workingRef.current = v;
    setBusy(v);
  };
  if (action === 'confirm' || action === 'checkIn') {
    return (
      <BookingConfirmation
        action={action}
        ready={ready}
        booking={r.data?.data}
        loading={r.loading || a.loading || o.loading}
        error={r.error ?? a.error ?? o.error}
        reload={() => {
          r.reload();
          a.reload();
          o.reload();
        }}
        saved={parent.onSaved}
      />
    );
  }
  return (
    <RouteDrawer
      title={t(
        valid ? `meetingRooms.actions.${action}` : 'meetingRooms.bookingDetail',
      )}
      className='sm:max-w-2xl'
      beforeClose={() => !workingRef.current}
      footer={
        <ActionFooter
          action={valid ? action! : 'confirm'}
          ready={ready}
          busy={busy}
        />
      }
    >
      {r.error ? <MeetingError error={r.error} retry={r.reload} /> : null}
      {a.error ? <MeetingError error={a.error} retry={a.reload} /> : null}
      {o.error ? <MeetingError error={o.error} retry={o.reload} /> : null}
      {r.loading || a.loading || o.loading ? (
        <Loading />
      ) : ready ? (
        <ActionBody
          key={`${r.data!.data.id}:${r.data!.data.version}`}
          booking={r.data!.data}
          action={action!}
          actorId={o.data!.data.actor.id}
          busy={bind}
          saved={parent.onSaved}
        />
      ) : (
        <Alert>
          <AlertDescription>
            {t('meetingRooms.errors.unavailable')}
          </AlertDescription>
        </Alert>
      )}
    </RouteDrawer>
  );
}
function ActionFooter({
  action,
  ready,
  busy,
}: {
  action: string;
  ready: boolean;
  busy: boolean;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('meetingRooms.cancel')}
      </Button>
      <Button
        type='submit'
        form='meeting-action-form'
        variant={
          ['cancel', 'reject'].includes(action) ? 'destructive' : 'default'
        }
        disabled={busy || !ready}
      >
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t(`meetingRooms.actions.${action}`)}
      </Button>
    </>
  );
}
function ActionBody({
  booking,
  action,
  actorId,
  busy,
  saved,
}: {
  booking: Booking;
  action: string;
  actorId: string;
  busy: (v: boolean) => void;
  saved: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    [requestId] = useState(() => createRequestKey()),
    [future, setFuture] = useState(false),
    [confirm, setConfirm] = useState(false),
    [pending, setPending] = useState<{ reason: string }>();
  const f = useMeetingResource<{ data: Future }>(
    future ? `meetingBookings/${encodeURIComponent(booking.id)}/future` : null,
    { action: 'cancel' },
  );
  const required =
    action === 'reject' ||
    (action === 'cancel' && actorId !== booking.organizerUserId);
  const schema = useMemo(
      () =>
        z.object({
          reason: required
            ? z
                .string()
                .trim()
                .min(1, t('meetingRooms.validation.required'))
                .max(2000)
            : z.string().trim().max(2000),
        }),
      [t, required],
    ),
    form = useForm({
      resolver: zodResolver(schema),
      defaultValues: { reason: '' },
    });
  const execute = async (values: { reason: string }) => {
    busy(true);
    setConfirm(false);
    try {
      await api.request({
        path: `meetingBookings/${encodeURIComponent(booking.id)}/${future ? 'cancelFuture' : action}`,
        method: 'POST',
        json: {
          requestId,
          ...(future
            ? {
                expectedVersions: Object.fromEntries(
                  f.data!.data.items.map((row) => [row.id, row.version]),
                ),
              }
            : { expectedVersion: booking.version }),
          ...(values.reason ? { reason: values.reason } : {}),
        },
      });
      form.reset(values);
      busy(false);
      toaster.show({
        type: 'success',
        title: t('meetingRooms.actionSuccess', {
          name: booking.title,
          action: t(`meetingRooms.actions.${action}`),
        }),
      });
      saved();
      await close();
    } catch (error) {
      form.setError('root', {
        type:
          error instanceof ApiClientError && error.status === 401
            ? 'sessionExpired'
            : 'server',
        message: t(`meetingRooms.errors.${errorKey(error)}`),
      });
    } finally {
      busy(false);
    }
  };
  const submit = form.handleSubmit(async (values) => {
    if (future && (!f.data || f.error || f.loading)) {
      form.setError('root', { message: t('meetingRooms.errors.unavailable') });
      return;
    }
    if (['cancel', 'reject'].includes(action)) {
      setPending(values);
      setConfirm(true);
    } else await execute(values);
  });
  return (
    <>
      <form
        id='meeting-action-form'
        noValidate
        onSubmit={(e) => void submit(e)}
      >
        <FieldGroup>
          <p className='text-sm'>{booking.title}</p>
          <FormError error={form.formState.errors.root} />
          {['cancel', 'reject'].includes(action) ? (
            <Controller
              name='reason'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='meeting-action-reason'>
                    {t('meetingRooms.fields.reason')}
                    {required ? (
                      <span aria-hidden='true' className='text-destructive'>
                        *
                      </span>
                    ) : null}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id='meeting-action-reason'
                    aria-invalid={fieldState.invalid}
                    aria-required={required}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ) : null}
          {action === 'cancel' && booking.seriesId ? (
            <Field>
              <FieldLabel htmlFor='cancel-future'>
                {t('meetingRooms.series.future')}
              </FieldLabel>
              <Switch
                id='cancel-future'
                checked={future}
                onCheckedChange={setFuture}
                disabled={form.formState.isSubmitting}
              />
              {future && f.data ? (
                <p className='text-sm text-muted-foreground'>
                  {t('meetingRooms.series.affected', {
                    count: f.data.data.total,
                  })}
                </p>
              ) : null}
              {future && f.data ? (
                <FutureList
                  future={f.data.data}
                  zone={booking.companyTimeZone}
                />
              ) : null}
              {f.error ? (
                <MeetingError error={f.error} retry={f.reload} />
              ) : f.loading ? (
                <Loading />
              ) : null}
            </Field>
          ) : null}
        </FieldGroup>
      </form>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('meetingRooms.confirmAction', {
                action: t(`meetingRooms.actions.${action}`),
                name: booking.title,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('meetingRooms.confirmDescription', {
                name: booking.title,
                count: future ? (f.data?.data.total ?? 0) : 1,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('meetingRooms.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (pending) void execute(pending);
              }}
            >
              {t(`meetingRooms.actions.${action}`)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BookingConfirmation({
  action,
  ready,
  booking,
  loading,
  error,
  reload,
  saved,
}: {
  action: string;
  ready: boolean;
  booking?: Booking;
  loading: boolean;
  error: unknown;
  reload: () => void;
  saved: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toast = useToaster(),
    location = useLocation(),
    navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState<unknown>();
  const [requestId] = useState(() => createRequestKey());
  const busyRef = useRef(false);
  useNavigationGuard(() => !busyRef.current);
  const close = () =>
    navigate(
      { pathname: '..', search: location.search, hash: location.hash },
      { replace: true },
    );
  async function perform() {
    if (!ready || !booking || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      await api.request({
        path: `meetingBookings/${encodeURIComponent(booking.id)}/${action}`,
        method: 'POST',
        json: { requestId, expectedVersion: booking.version },
      });
      toast.show({
        type: 'success',
        title: t('meetingRooms.actionSuccess', {
          name: booking.title,
          action: t(`meetingRooms.actions.${action}`),
        }),
      });
      saved();
      busyRef.current = false;
      setBusy(false);
      await close();
    } catch (error) {
      setFailure(error);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busyRef.current) void close();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('meetingRooms.confirmAction', {
              action: t(`meetingRooms.actions.${action}`),
              name: booking?.title ?? t('meetingRooms.bookingDetail'),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('meetingRooms.confirmDescription', {
              name: booking?.title ?? t('meetingRooms.bookingDetail'),
              count: 1,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {loading ? (
          <Loading />
        ) : error || failure ? (
          <MeetingError
            error={error ?? failure}
            retry={() => {
              setFailure(undefined);
              reload();
            }}
          />
        ) : !ready ? (
          <Alert>
            <AlertDescription>
              {t('meetingRooms.errors.unavailable')}
            </AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => {
              void close();
            }}
          >
            {t('meetingRooms.cancel')}
          </Button>
          <AlertDialogAction
            disabled={!ready || busy}
            onClick={(event) => {
              event.preventDefault();
              void perform();
            }}
          >
            {busy ? <Spinner /> : null}
            {t(`meetingRooms.actions.${action}`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

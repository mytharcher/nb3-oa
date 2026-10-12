import { createRequestKey } from '#lib/request-key';
import { errorKey } from './errors.js';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useOutletContext, useParams } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Switch } from '#components/ui/switch';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useMeetingResource } from './resource.js';
import { Loading, MeetingError, FormError } from './states.js';
import type { Room, Context, Options } from './types.js';
export default function RoomForm() {
  const { roomId } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<Context>(),
    [busy, setBusy] = useState(false),
    workingRef = useRef(false);
  const r = useMeetingResource<{ data: Room }>(
      roomId ? `meetingRooms/${encodeURIComponent(roomId)}` : null,
    ),
    p = useMeetingResource<{ data: { actions: string[] } }>(
      roomId ? `meetingRooms/${encodeURIComponent(roomId)}/actions` : null,
    ),
    options = useMeetingResource<{ data: Options }>(
      roomId ? null : 'meetingBookings/options',
    );
  const ready = roomId
    ? !r.loading &&
      !r.error &&
      !!r.data &&
      !p.loading &&
      !p.error &&
      !!p.data?.data.actions.includes('edit')
    : !options.loading && !options.error && !!options.data?.data.canManage;
  const bind = (value: boolean) => {
    workingRef.current = value;
    setBusy(value);
  };
  return (
    <RouteDialog
      title={t(roomId ? 'meetingRooms.editRoom' : 'meetingRooms.newRoom')}
      beforeClose={() => !workingRef.current}
      footer={<RoomFooter busy={busy} ready={ready} />}
    >
      {r.error ? <MeetingError error={r.error} retry={r.reload} /> : null}
      {p.error ? <MeetingError error={p.error} retry={p.reload} /> : null}
      {options.error ? (
        <MeetingError error={options.error} retry={options.reload} />
      ) : null}
      {r.loading || p.loading || options.loading ? (
        <Loading />
      ) : ready ? (
        <Body
          key={r.data?.data.version ?? 'new'}
          room={r.data?.data}
          busy={bind}
          saved={parent.onSaved}
        />
      ) : (
        <Alert>
          <AlertDescription>
            {t('meetingRooms.errors.forbidden')}
          </AlertDescription>
        </Alert>
      )}
    </RouteDialog>
  );
}
function RoomFooter({ busy, ready }: { busy: boolean; ready: boolean }) {
  const { close } = useRouteOverlay(),
    { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('meetingRooms.cancel')}
      </Button>
      <Button type='submit' form='meeting-room-form' disabled={busy || !ready}>
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t('meetingRooms.save')}
      </Button>
    </>
  );
}
function Body({
  room,
  busy,
  saved,
}: {
  room?: Room;
  busy: (v: boolean) => void;
  saved: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    [requestId] = useState(() => createRequestKey());
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('meetingRooms.validation.required'))
          .max(200),
        location: z.string().max(2000),
        facilities: z.string().max(2000),
        capacity: z
          .number()
          .int()
          .min(1, t('meetingRooms.validation.capacity'))
          .max(10000, t('meetingRooms.validation.capacity')),
        active: z.boolean(),
        requiresAdminConfirmation: z.boolean(),
        reason: z
          .string()
          .trim()
          .min(1, t('meetingRooms.validation.required'))
          .max(2000),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: room?.name ?? '',
      location: room?.location ?? '',
      facilities: room?.facilities ?? '',
      capacity: room?.capacity ?? 1,
      active: room?.active ?? true,
      requiresAdminConfirmation: room?.requiresAdminConfirmation ?? false,
      reason: '',
    },
  });
  const submit = form.handleSubmit(async (values) => {
    busy(true);
    try {
      await api.request({
        path: room
          ? `meetingRooms/${encodeURIComponent(room.id)}`
          : 'meetingRooms',
        method: room ? 'PATCH' : 'POST',
        json: {
          ...values,
          location: values.location || null,
          facilities: values.facilities || null,
          requestId,
          ...(room ? { expectedVersion: room.version } : {}),
        },
      });
      form.reset(values);
      busy(false);
      toaster.show({
        type: 'success',
        title: t('meetingRooms.savedRoom', { name: values.name }),
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
  });
  return (
    <form id='meeting-room-form' noValidate onSubmit={(e) => void submit(e)}>
      <FieldGroup>
        <FormError error={form.formState.errors.root} />
        {(
          [
            'name',
            'location',
            'facilities',
            'capacity',
            'active',
            'requiresAdminConfirmation',
            'reason',
          ] as const
        ).map((name) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`room-${name}`}>
                  {t(`meetingRooms.fields.${name}`)}
                  {['name', 'capacity', 'reason'].includes(name) ? (
                    <span aria-hidden='true' className='text-destructive'>
                      *
                    </span>
                  ) : null}
                </FieldLabel>
                {name === 'active' || name === 'requiresAdminConfirmation' ? (
                  <Switch
                    id={`room-${name}`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  />
                ) : name === 'capacity' ? (
                  <Input
                    id={`room-${name}`}
                    type='number'
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={Number(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    aria-invalid={fieldState.invalid}
                    disabled={form.formState.isSubmitting}
                  />
                ) : (
                  <Textarea
                    id={`room-${name}`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                    disabled={form.formState.isSubmitting}
                    rows={name === 'reason' || name === 'facilities' ? 3 : 1}
                  />
                )}
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
      </FieldGroup>
    </form>
  );
}

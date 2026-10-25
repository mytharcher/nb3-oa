import { useState, useRef } from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteFormPage } from '#components/route-form-page';
import { FormActions } from '#components/form-actions';
import { DateTimePicker } from '#components/date-time-picker';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Field, FieldLabel } from '#components/ui/field';
import { Skeleton } from '#components/ui/skeleton';
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
import { useScheduleResource } from './resource';
import { ScheduleError } from './states';
import { type Schedule, scheduleZoneLabel } from './types';
export default function ScheduleForm() {
  const { scheduleId } = useParams(),
    { t } = useTranslation();
  const r = useScheduleResource<{ data: Schedule }>(
    scheduleId ? `personalSchedules/${encodeURIComponent(scheduleId)}` : null,
  );
  const [discard, setDiscard] = useState(false),
    closeAnswerRef = useRef<((answer: boolean) => void) | null>(null),
    dirtyRef = useRef(false),
    pendingRef = useRef(false);
  return (
    <RouteFormPage
      title={t(
        scheduleId ? 'personalSchedules.editTitle' : 'personalSchedules.create',
      )}
      beforeClose={() => {
        if (pendingRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          closeAnswerRef.current = resolve;
        });
      }}
    >
      {r.error ? (
        <ScheduleError error={r.error} retry={r.reload} />
      ) : r.loading ? (
        <Skeleton className='h-48' />
      ) : !scheduleId || r.data ? (
        r.data?.data.sourceBookingId ? (
          <Alert>
            <AlertDescription>
              {t('personalSchedules.managed')}
            </AlertDescription>
          </Alert>
        ) : (
          <FormBody
            key={r.data?.data.version ?? 'new'}
            row={r.data?.data}
            dirtyRef={dirtyRef}
            busyRef={pendingRef}
          />
        )
      ) : null}
      <AlertDialog
        open={discard}
        onOpenChange={(value) => {
          if (!value) {
            setDiscard(false);
            closeAnswerRef.current?.(false);
            closeAnswerRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('personalSchedules.discardTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('personalSchedules.discardHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('personalSchedules.keepEditing')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                closeAnswerRef.current?.(true);
                closeAnswerRef.current = null;
                setDiscard(false);
              }}
            >
              {t('personalSchedules.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteFormPage>
  );
}
function FormBody({
  row,
  dirtyRef,
  busyRef,
}: {
  row?: Schedule;
  dirtyRef: { current: boolean };
  busyRef: { current: boolean };
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    navigate = useNavigate(),
    location = useLocation(),
    parent = useOutletContext<{ reload?: () => void }>();
  const [title, setTitle] = useState(row?.title ?? ''),
    [description, setDescription] = useState(row?.description ?? ''),
    [startAt, setStartAt] = useState(row?.startAt ?? ''),
    [endAt, setEndAt] = useState(row?.endAt ?? ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [invalid, setInvalid] = useState(false);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <form
      id='schedule-form'
      className='space-y-5'
      onChange={() => {
        dirtyRef.current = true;
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          if (
            !title.trim() ||
            !startAt ||
            !endAt ||
            Date.parse(startAt) >= Date.parse(endAt)
          ) {
            setInvalid(true);
            return;
          }
          if (busyRef.current) return;
          busyRef.current = true;
          setBusy(true);
          setError(undefined);
          try {
            await api.request({
              path: row ? `personalSchedules/${row.id}` : 'personalSchedules',
              method: row ? 'PATCH' : 'POST',
              json: {
                title,
                description,
                startAt,
                endAt,
                ...(row ? { expectedVersion: row.version } : {}),
              },
            });
            dirtyRef.current = false;
            busyRef.current = false;
            parent?.reload?.();
            toaster.show({ title: t('personalSchedules.saved') });
            await navigate({
              pathname: '/personal-schedules',
              search: location.search,
            });
          } catch (err) {
            setError(err);
          } finally {
            busyRef.current = false;
            setBusy(false);
          }
        })();
      }}
    >
      <Field>
        <FieldLabel htmlFor='schedule-title'>
          {t('personalSchedules.fields.title')} *
        </FieldLabel>
        <Input
          id='schedule-title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          disabled={busy}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor='schedule-description'>
          {t('personalSchedules.fields.description')}
        </FieldLabel>
        <Textarea
          id='schedule-description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={10000}
          disabled={busy}
        />
      </Field>
      <p className='text-sm text-muted-foreground'>
        {t('personalSchedules.timeZone', {
          zone: scheduleZoneLabel(i18n.language),
        })}
      </p>
      <Field>
        <FieldLabel htmlFor='schedule-start'>
          {t('personalSchedules.fields.start')} *
        </FieldLabel>
        <DateTimePicker
          id='schedule-start'
          value={startAt}
          onChange={(value) => {
            setStartAt(value);
            dirtyRef.current = true;
          }}
          timeZone={zone}
          timeLabel={t('personalSchedules.fields.start')}
          disabled={busy}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor='schedule-end'>
          {t('personalSchedules.fields.end')} *
        </FieldLabel>
        <DateTimePicker
          id='schedule-end'
          value={endAt}
          onChange={(value) => {
            setEndAt(value);
            dirtyRef.current = true;
          }}
          timeZone={zone}
          timeLabel={t('personalSchedules.fields.end')}
          disabled={busy}
        />
      </Field>
      {invalid ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('personalSchedules.invalid')}</AlertDescription>
        </Alert>
      ) : null}
      {error ? <ScheduleError error={error} /> : null}
      <FormActions>
        <Button type='submit' form='schedule-form' disabled={busy}>
          {t(busy ? 'personalSchedules.saving' : 'personalSchedules.save')}
        </Button>
      </FormActions>
    </form>
  );
}

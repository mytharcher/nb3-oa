import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';

import { DatePicker } from '#components/date-picker';
import { RouteDialog } from '#components/route-dialog';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Textarea } from '#components/ui/textarea';
import { useRouteOverlay } from '#components/use-route-overlay';

import {
  OverlayCloseButton,
  OverlayFormFooter,
} from '../shared/overlay-buttons.js';
import { statusOf } from '../shared/errors.js';
import { FieldsSkeleton, LoadErrorAlert } from '../shared/states.js';
import { CALENDAR_DAY_KINDS, type CalendarDay } from '../shared/types.js';
import { useListResource } from '../shared/use-resource.js';
import type { SpecialDaysOutletContext } from './constants.js';

const FORM_ID = 'platform-calendar-day';

/**
 * `days/new` adds a day; `days/:date` edits one. There is no single-day endpoint, so editing loads the date's year
 * fresh and takes the day from it (guideline T3.8).
 */
export default function CalendarDayDialog(): ReactElement {
  const { date } = useParams();
  return <DayDialog key={date ?? 'new'} date={date} />;
}

function DayDialog({
  date,
}: {
  readonly date: string | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmitting = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  const editing = date !== undefined;
  const year =
    editing && /^\d{4}-/.test(date) ? Number(date.slice(0, 4)) : null;
  const days = useListResource<CalendarDay>(
    editing ? 'calendarDays' : null,
    year ? { year } : undefined,
  );
  const day = days.data?.data.find((item) => item.date === date);

  let body: ReactElement;
  let footer: ReactElement;
  if (editing && days.error) {
    body = <LoadErrorAlert error={days.error} onRetry={days.reload} />;
    footer = <OverlayCloseButton label={t('actions.close')} />;
  } else if (editing && !days.data) {
    body = <FieldsSkeleton fields={2} />;
    footer = <OverlayCloseButton label={t('actions.cancel')} />;
  } else if (editing && !day) {
    // The day is no longer listed: nothing to edit (guideline R3).
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {t('platform.calendar.days.notFound')}
        </AlertDescription>
      </Alert>
    );
    footer = <OverlayCloseButton label={t('actions.close')} />;
  } else {
    body = <DayForm day={day} onSubmittingChange={handleSubmitting} />;
    footer = (
      <OverlayFormFooter
        formId={FORM_ID}
        submitting={submitting}
        submitLabel={
          editing ? t('actions.save') : t('platform.calendar.days.addSubmit')
        }
      />
    );
  }

  return (
    <RouteDialog
      title={
        editing
          ? t('platform.calendar.days.editTitle', { date })
          : t('platform.calendar.days.addTitle')
      }
      description={
        editing ? undefined : t('platform.calendar.days.addDescription')
      }
      className='sm:max-w-md'
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDialog>
  );
}

function DayForm({
  day,
  onSubmittingChange,
}: {
  readonly day: CalendarDay | undefined;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { year, reload } = useOutletContext<SpecialDaysOutletContext>();

  const schema = useMemo(
    () =>
      z.object({
        date: z
          .date()
          .optional()
          .refine((value) => value !== undefined, {
            message: t('platform.calendar.days.dateRequired'),
          }),
        kind: z.enum(CALENDAR_DAY_KINDS),
        note: z
          .string()
          .trim()
          .max(255, t('platform.calendar.days.noteTooLong', { max: 255 })),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: day ? new Date(`${day.date}T00:00:00`) : undefined,
      kind: day?.kind ?? 'holiday',
      note: day?.note ?? '',
    },
  });
  const kindItems = CALENDAR_DAY_KINDS.map((value) => ({
    value,
    label: t(`platform.calendar.kinds.${value}`),
  }));

  const submit = form.handleSubmit(async (values) => {
    // The schema refused an empty date; editing keeps the day's own date.
    const date = format(values.date ?? new Date(), 'yyyy-MM-dd');
    onSubmittingChange(true);
    try {
      await api.request({
        path: `calendarDays/${date}`,
        method: 'PUT',
        json: { kind: values.kind, note: values.note || null },
      });
    } catch (error: unknown) {
      const status = statusOf(error);
      if (status === 401) form.setError('root', { type: 'sessionExpired' });
      else
        form.setError('root', {
          message:
            status === 403
              ? t('platform.common.writeForbidden')
              : t('platform.common.saveFailed'),
        });
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: t('platform.calendar.days.saved', { date }),
    });
    reload();
    void close();
  });

  const rootError = form.formState.errors.root;

  return (
    <form id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
      <FieldGroup>
        {rootError?.type === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        ) : null}
        {day ? null : (
          <Controller
            control={form.control}
            name='date'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${FORM_ID}-date`}>
                  {t('platform.calendar.days.date')}
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <DatePicker
                  id={`${FORM_ID}-date`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                  className='w-full'
                  disabledDays={[
                    { before: new Date(year - 1, 0, 1) },
                    { after: new Date(year + 1, 11, 31) },
                  ]}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        )}
        <Controller
          control={form.control}
          name='kind'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-kind`}>
                {t('platform.calendar.days.kind')}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Select
                items={kindItems}
                value={field.value}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  id={`${FORM_ID}-kind`}
                  className='w-full'
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    {kindItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='note'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-note`}>
                {t('platform.calendar.days.note')}
              </FieldLabel>
              <Textarea
                {...field}
                id={`${FORM_ID}-note`}
                rows={2}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}

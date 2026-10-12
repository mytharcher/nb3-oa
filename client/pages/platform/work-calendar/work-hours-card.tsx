import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Spinner } from '#components/ui/spinner';

import {
  effectiveFromOf,
  type EffectiveMode,
} from '../shared/effective-from-value.js';
import { EffectiveFromFields } from '../shared/effective-from.js';
import { fieldViolationsOf, reasonOf, statusOf } from '../shared/errors.js';
import type { RuleSummary, RuleVersion, WorkHours } from '../shared/types.js';

const FORM_ID = 'platform-work-hours';
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function hoursOf(version: RuleVersion | null | undefined): WorkHours {
  const value = version?.value as Partial<WorkHours> | undefined;
  return {
    start: typeof value?.start === 'string' ? value.start : '09:00',
    end: typeof value?.end === 'string' ? value.end : '18:00',
  };
}

export interface WorkHoursCardProps {
  readonly rule: RuleSummary;
  readonly canUpdate: boolean;
  readonly onSaved: () => void;
}

/** The daily working window (rule `calendar.workHours`); a change is a new version, now or from a later date. */
export function WorkHoursCard({
  rule,
  canUpdate,
  onSaved,
}: WorkHoursCardProps): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const api = useApiClient();
  const toaster = useToaster();
  const current = hoursOf(rule.current);
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  );

  const schema = useMemo(
    () =>
      z
        .object({
          start: z
            .string()
            .regex(TIME, t('platform.calendar.workHours.invalidTime')),
          end: z
            .string()
            .regex(TIME, t('platform.calendar.workHours.invalidTime')),
          mode: z.enum(['now', 'date']),
          date: z.date().optional(),
        })
        .refine((values) => values.start < values.end, {
          path: ['end'],
          message: t('platform.calendar.workHours.endBeforeStart'),
        })
        .refine(
          (values) => values.mode === 'now' || values.date !== undefined,
          {
            path: ['date'],
            message: t('platform.rules.effective.dateRequired'),
          },
        ),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      start: current.start,
      end: current.end,
      mode: 'now' as EffectiveMode,
      date: undefined as Date | undefined,
    },
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.request({
        path: 'approvalRules/calendar.workHours/versions',
        method: 'POST',
        json: {
          value: { start: values.start, end: values.end },
          effectiveFrom: effectiveFromOf(values.mode, values.date),
        },
      });
    } catch (error: unknown) {
      const status = statusOf(error);
      const fields = fieldViolationsOf(error);
      if (status === 401) form.setError('root', { type: 'sessionExpired' });
      else if (status === 400 && fields.includes('effectiveFrom'))
        form.setError(
          'date',
          { message: t('platform.rules.effective.pastError') },
          { shouldFocus: true },
        );
      else if (status === 400 && fields.includes('value'))
        form.setError(
          'end',
          { message: t('platform.calendar.workHours.endBeforeStart') },
          { shouldFocus: true },
        );
      else
        form.setError('root', {
          message:
            status === 403
              ? t('platform.common.writeForbidden')
              : reasonOf(error) === 'RULE_VERSION_EXISTS'
                ? t('platform.rules.errors.versionExists')
                : t('platform.common.saveFailed'),
        });
      return;
    } finally {
      setSubmitting(false);
    }
    toaster.show({
      type: 'success',
      title: t('platform.calendar.workHours.saved'),
    });
    onSaved();
  });

  const rootError = form.formState.errors.root;
  const mode = useWatch({ control: form.control, name: 'mode' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('platform.calendar.workHours.title')}</CardTitle>
        <CardDescription>
          {t('platform.calendar.workHours.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {canUpdate ? (
          <form
            id={FORM_ID}
            noValidate
            onSubmit={(event) => void submit(event)}
          >
            <FieldGroup>
              {rootError?.type === 'sessionExpired' ? (
                <SessionExpiredAlert />
              ) : rootError ? (
                <Alert variant='destructive'>
                  <AlertCircleIcon />
                  <AlertDescription>{rootError.message}</AlertDescription>
                </Alert>
              ) : null}
              <div className='grid gap-4 sm:grid-cols-2'>
                {(['start', 'end'] as const).map((name) => (
                  <Controller
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`${FORM_ID}-${name}`}>
                          {t(`platform.calendar.workHours.${name}`)}
                          <span aria-hidden='true' className='text-destructive'>
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id={`${FORM_ID}-${name}`}
                          type='time'
                          aria-required='true'
                          aria-invalid={fieldState.invalid}
                          disabled={submitting}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                ))}
              </div>
              <Controller
                control={form.control}
                name='date'
                render={({ field, fieldState }) => (
                  <EffectiveFromFields
                    formId={FORM_ID}
                    mode={mode}
                    date={field.value}
                    onModeChange={(next) => form.setValue('mode', next)}
                    onDateChange={field.onChange}
                    dateError={fieldState.error?.message}
                    disabled={submitting}
                  />
                )}
              />
            </FieldGroup>
          </form>
        ) : (
          <p className='text-sm'>
            {t('platform.calendar.workHours.range', { ...current })}
          </p>
        )}
        {rule.scheduled.length > 0 ? (
          <ul className='flex flex-col gap-1 text-sm text-muted-foreground'>
            {rule.scheduled.map((version) => (
              <li key={version.id}>
                {t('platform.calendar.workHours.scheduled', {
                  date: dateFormat.format(new Date(version.effectiveFrom)),
                  ...hoursOf(version),
                })}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      {canUpdate ? (
        <CardFooter className='justify-end'>
          <Button type='submit' form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner data-icon='inline-start' /> : null}
            {submitting ? t('actions.saving') : t('actions.save')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

import { fieldViolationsOf, statusOf } from '../shared/errors.js';
import type { RuleSummary } from '../shared/types.js';

const FORM_ID = 'platform-time-zone';

export interface TimeZoneCardProps {
  readonly rule: RuleSummary;
  readonly canUpdate: boolean;
  readonly onSaved: () => void;
}

/**
 * The calendar's IANA time zone (rule `calendar.timeZone`). It takes effect immediately; the server refuses to schedule
 * it, because every instant is converted with one zone.
 */
export function TimeZoneCard({
  rule,
  canUpdate,
  onSaved,
}: TimeZoneCardProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const current =
    typeof rule.current?.value === 'string'
      ? rule.current.value
      : 'Asia/Shanghai';

  const schema = useMemo(
    () =>
      z.object({
        timeZone: z
          .string()
          .trim()
          .min(1, t('platform.calendar.timeZone.required'))
          .max(64, t('platform.calendar.timeZone.invalid')),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { timeZone: current },
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.request({
        path: 'approvalRules/calendar.timeZone/versions',
        method: 'POST',
        json: { value: values.timeZone },
      });
    } catch (error: unknown) {
      const status = statusOf(error);
      if (status === 401) form.setError('root', { type: 'sessionExpired' });
      else if (status === 400 && fieldViolationsOf(error).includes('value'))
        form.setError(
          'timeZone',
          { message: t('platform.calendar.timeZone.invalid') },
          { shouldFocus: true },
        );
      else
        form.setError('root', {
          message:
            status === 403
              ? t('platform.common.writeForbidden')
              : t('platform.common.saveFailed'),
        });
      return;
    } finally {
      setSubmitting(false);
    }
    toaster.show({
      type: 'success',
      title: t('platform.calendar.timeZone.saved'),
    });
    onSaved();
  });

  const rootError = form.formState.errors.root;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('platform.calendar.timeZone.title')}</CardTitle>
        <CardDescription>
          {t('platform.calendar.timeZone.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <Controller
                control={form.control}
                name='timeZone'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${FORM_ID}-zone`}>
                      {t('platform.calendar.timeZone.label')}
                      <span aria-hidden='true' className='text-destructive'>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${FORM_ID}-zone`}
                      autoComplete='off'
                      spellCheck={false}
                      aria-required='true'
                      aria-invalid={fieldState.invalid}
                      disabled={submitting}
                    />
                    <FieldDescription>
                      {t('platform.calendar.timeZone.hint')}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        ) : (
          <p className='text-sm'>{current}</p>
        )}
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

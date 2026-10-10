import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useRouteOverlay } from '@/components/use-route-overlay';

import { OverlayFormFooter } from '../shared/overlay-buttons.js';
import { statusOf } from '../shared/errors.js';
import type { SpecialDaysOutletContext } from './constants.js';
import { parseDays, type ParseDaysResult } from './parse-days.js';

const FORM_ID = 'platform-calendar-import';

interface ImportResult {
  readonly created: number;
  readonly updated: number;
  readonly unchanged: number;
  readonly removed: number;
}

/** `import`: paste a year's holidays and make-up working days, one per line. */
export default function CalendarImportDialog(): ReactElement {
  const { t } = useTranslation();
  const { year } = useOutletContext<SpecialDaysOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmitting = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('platform.calendar.import.title', { year })}
      description={t('platform.calendar.import.description')}
      beforeClose={() => !submittingRef.current}
      footer={
        <OverlayFormFooter
          formId={FORM_ID}
          submitting={submitting}
          submitLabel={t('platform.calendar.import.submit')}
        />
      }
    >
      <ImportForm year={year} onSubmittingChange={handleSubmitting} />
    </RouteDialog>
  );
}

function ImportForm({
  year,
  onSubmittingChange,
}: {
  readonly year: number;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<SpecialDaysOutletContext>();
  const [text, setText] = useState('');
  const [replace, setReplace] = useState(false);
  // Validation runs on submit (guideline T3.3); after a failed submit, it follows the text as it changes.
  const [checked, setChecked] = useState<ParseDaysResult>();
  const [failure, setFailure] = useState<string>(); // 'sessionExpired' or a message;
  const textRef = useRef<HTMLTextAreaElement>(null);
  const live = checked ? parseDays(text, year) : undefined;
  const textError = live
    ? live.problems.length > 0
      ? live.problems
          .slice(0, 5)
          .map(({ line, problem }) =>
            t(`platform.calendar.import.problems.${problem}`, { line, year }),
          )
          .join(' ')
      : live.days.length === 0
        ? t('platform.calendar.import.emptyText')
        : undefined
    : undefined;

  async function submit(): Promise<void> {
    const parsed = parseDays(text, year);
    setChecked(parsed);
    if (parsed.problems.length > 0 || parsed.days.length === 0) {
      textRef.current?.focus();
      return;
    }
    setFailure(undefined);
    onSubmittingChange(true);
    let result: ImportResult;
    try {
      ({ data: result } = await api.request<{ data: ImportResult }>({
        path: 'calendarDays/import',
        method: 'POST',
        json: { year, entries: parsed.days, replace },
      }));
    } catch (error: unknown) {
      const status = statusOf(error);
      setFailure(
        status === 401
          ? 'sessionExpired'
          : status === 403
            ? t('platform.common.writeForbidden')
            : t('platform.common.saveFailed'),
      );
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: t('platform.calendar.import.success', { ...result }),
    });
    reload();
    void close();
  }

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <FieldGroup>
        {failure === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : failure ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={textError ? true : undefined}>
          <FieldLabel htmlFor={`${FORM_ID}-text`}>
            {t('platform.calendar.import.lines')}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <Textarea
            ref={textRef}
            id={`${FORM_ID}-text`}
            rows={10}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('platform.calendar.import.placeholder', { year })}
            aria-required='true'
            aria-invalid={textError ? true : undefined}
            className='font-mono'
          />
          <FieldDescription>
            {t('platform.calendar.import.hint')}
          </FieldDescription>
          <FieldError errors={textError ? [{ message: textError }] : []} />
        </Field>
        <Field orientation='horizontal'>
          <FieldContent>
            <FieldLabel htmlFor={`${FORM_ID}-replace`}>
              {t('platform.calendar.import.replace')}
            </FieldLabel>
            <FieldDescription>
              {t('platform.calendar.import.replaceHint', { year })}
            </FieldDescription>
          </FieldContent>
          <Switch
            id={`${FORM_ID}-replace`}
            checked={replace}
            onCheckedChange={(next) => setReplace(next)}
          />
        </Field>
      </FieldGroup>
    </form>
  );
}

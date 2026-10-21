import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDrawer } from '#components/route-drawer';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { ConfirmDialog } from '../../administration/authorization/components/confirm-dialog.js';
import { Switch } from '#components/ui/switch';
import { Textarea } from '#components/ui/textarea';
import { useRouteOverlay } from '#components/use-route-overlay';

import { OverlayFormFooter } from '../shared/overlay-buttons.js';
import { statusOf } from '../shared/errors.js';
import type { CalendarDay } from '../shared/types.js';
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
  const { year } = useOutletContext<SpecialDaysOutletContext>();
  return <CalendarImportYearDialog key={year} year={year} />;
}

function CalendarImportYearDialog({
  year,
}: {
  readonly year: number;
}): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmitting = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDrawer
      className='sm:max-w-2xl'
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
      <ImportForm
        key={year}
        year={year}
        onSubmittingChange={handleSubmitting}
      />
    </RouteDrawer>
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
  const activeRef = useRef(true);
  const previewControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    activeRef.current = true;
    const controller = new AbortController();
    previewControllerRef.current = controller;
    return () => {
      activeRef.current = false;
      controller.abort();
    };
  }, []);
  const [text, setText] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const [previewInput, setPreviewInput] = useState<string>();
  const [busy, setBusy] = useState(false);
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

  const drawerGuard = useDrawerFormGuard(!!text || replace, busy);

  async function submit(confirmed = false): Promise<void> {
    if (busy || (confirmed && previewInput !== text)) return;
    const parsed = parseDays(text, year);
    setChecked(parsed);
    if (parsed.problems.length > 0 || parsed.days.length === 0) {
      textRef.current?.focus();
      return;
    }
    if (replace && !confirmed) {
      setFailure(undefined);
      setBusy(true);
      onSubmittingChange(true);
      try {
        // This independently authorized endpoint returns the whole year (at most 366 days), not a capped page.
        const existing = await api.request<{
          data: CalendarDay[];
          meta: { total: number };
        }>({
          path: 'calendarDays',
          query: { year },
          signal: previewControllerRef.current?.signal,
        });
        if (!activeRef.current) return;
        if (
          existing.meta.total !== existing.data.length ||
          existing.data.some((day) => !day.date.startsWith(`${year}-`))
        )
          throw new Error('Incomplete calendar year');
        const incoming = new Set(parsed.days.map((day) => day.date));
        setRemovedCount(
          existing.data.filter((day) => !incoming.has(day.date)).length,
        );
        setPreviewInput(text);
        setConfirmReplace(true);
      } catch (error: unknown) {
        if (!activeRef.current) return;
        const status = statusOf(error);
        setFailure(
          status === 401
            ? 'sessionExpired'
            : status === 403
              ? t('platform.common.forbidden')
              : t('platform.calendar.import.previewFailed'),
        );
      } finally {
        if (activeRef.current) {
          setBusy(false);
          onSubmittingChange(false);
        }
      }
      return;
    }
    setFailure(undefined);
    setBusy(true);
    onSubmittingChange(true);
    let result: ImportResult;
    try {
      ({ data: result } = await api.request<{ data: ImportResult }>({
        path: 'calendarDays/import',
        method: 'POST',
        json: { year, entries: parsed.days, replace },
      }));
    } catch (error: unknown) {
      if (!activeRef.current) return;
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
      if (activeRef.current) {
        setBusy(false);
        onSubmittingChange(false);
      }
    }
    if (!activeRef.current) return;
    setConfirmReplace(false);
    toaster.show({
      type: 'success',
      title: t('platform.calendar.import.success', { ...result }),
    });
    reload();
    drawerGuard.markSaved();
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
      {drawerGuard.confirmation}
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
            disabled={busy}
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
            disabled={busy}
            onCheckedChange={(next) => setReplace(next)}
          />
        </Field>
      </FieldGroup>
      <ConfirmDialog
        open={confirmReplace}
        busy={busy}
        title={t('platform.calendar.import.confirmReplaceTitle', { year })}
        confirmLabel={t('platform.calendar.import.submit')}
        error={
          failure ? (
            failure === 'sessionExpired' ? (
              <SessionExpiredAlert />
            ) : (
              failure
            )
          ) : undefined
        }
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => void submit(true)}
      >
        {t('platform.calendar.import.replacePreview', {
          year,
          count: removedCount,
        })}
      </ConfirmDialog>
    </form>
  );
}

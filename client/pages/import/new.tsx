import { FileUploadInput } from '#components/file-upload-input';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertCircleIcon,
  CircleCheckIcon,
  DownloadIcon,
  InfoIcon,
} from 'lucide-react';
import { type ReactElement, useId, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDrawer } from '#components/route-drawer';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldDescription,
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
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

import { useTemplateDownload } from './download.js';
import { ProblemTable } from './problems.js';
import { statusOf } from './errors.js';
import {
  IMPORT_KINDS,
  MAX_FILE_BYTES,
  type ImportKind,
  type ImportOutletContext,
  type ImportReport,
  type ImportRunDetail,
} from './types.js';

const FORM_ID = 'import-new';
const SELECT_CONTENT_CLASS =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';

type Step = 'select' | 'report';
/** `sessionExpired`, or a translated message. */
type Failure = string | undefined;

/** The file problems the dialog itself can tell before sending (the server checks the same). */
function fileProblem(file: File | undefined): string | undefined {
  if (!file) return 'fileRequired';
  if (!/\.xlsx$/iu.test(file.name)) return 'fileType';
  if (file.size > MAX_FILE_BYTES) return 'fileSize';
  return undefined;
}

/**
 * `new`: a two-step import. "Check" sends the file to `POST /imports/preview`, which validates every row and dry-runs
 * the writes, and shows the problems or the counts; only a clean report offers "Import", which sends the same file to
 * `POST /imports`. Changing the kind or the file returns to the first step, so a report never describes another file.
 */
export default function NewImportDialog(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { reload } = useOutletContext<ImportOutletContext>();
  const downloadTemplate = useTemplateDownload();
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<HTMLButtonElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);

  const [step, setStep] = useState<Step>('select');
  const [kind, setKind] = useState<ImportKind>();
  const [file, setFile] = useState<File>();
  const [attempted, setAttempted] = useState(false);
  const [report, setReport] = useState<ImportReport>();
  const [failure, setFailure] = useState<Failure>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Validation runs on submit (guideline T3.3), then follows the fields as they change.
  const kindError =
    attempted && !kind ? t('import.validation.kindRequired') : undefined;
  const fileErrorKey = attempted ? fileProblem(file) : undefined;
  const fileError = fileErrorKey
    ? t(`import.validation.${fileErrorKey}`)
    : undefined;

  function busy(value: boolean): void {
    submittingRef.current = value;
    setSubmitting(value);
  }

  function failureOf(error: unknown): Failure {
    switch (statusOf(error)) {
      case 401:
        return 'sessionExpired';
      case 403:
        return t('import.failure.forbidden');
      case 413:
        return t('import.failure.tooLarge');
      case 400:
      case 415:
        return t('import.failure.invalidFile');
      default:
        return t('import.failure.generic');
    }
  }

  function upload(): FormData {
    const body = new FormData();
    body.set('kind', kind!);
    body.set('file', file!);
    return body;
  }

  function backToSelect(clearFile: boolean): void {
    setStep('select');
    setReport(undefined);
    setFailure(undefined);
    if (clearFile) {
      setFile(undefined);
      setAttempted(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function check(): Promise<void> {
    setAttempted(true);
    if (!kind) {
      kindRef.current?.focus();
      return;
    }
    if (fileProblem(file)) {
      chooseRef.current?.focus();
      return;
    }
    setFailure(undefined);
    busy(true);
    try {
      const { data } = await api.request<{ data: ImportReport }>({
        path: 'imports/preview',
        method: 'POST',
        body: upload(),
      });
      setReport(data);
      setStep('report');
    } catch (error: unknown) {
      setFailure(failureOf(error));
    } finally {
      busy(false);
    }
  }

  async function confirm(close: () => Promise<void>): Promise<void> {
    setFailure(undefined);
    busy(true);
    let run: ImportRunDetail;
    try {
      ({ data: run } = await api.request<{ data: ImportRunDetail }>({
        path: 'imports',
        method: 'POST',
        body: upload(),
      }));
    } catch (error: unknown) {
      setFailure(failureOf(error));
      busy(false);
      return;
    }
    busy(false);
    // A failed attempt is recorded too, so the history changes either way.
    reload();
    if (run.status === 'succeeded') {
      toaster.show({
        type: 'success',
        title: t('import.toast.imported', { name: run.filename }),
      });
      void close();
      return;
    }
    // The data changed between the check and the import: show what the import found.
    setReport({
      kind: run.kind,
      result: 'invalid',
      rowCount: run.rowCount,
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      errorCount: run.errorCount,
      errors: run.errors,
    });
  }

  const kindItems = IMPORT_KINDS.map((value) => ({
    value,
    label: t(`import.kinds.${value}`),
  }));

  let body: ReactElement;
  if (step === 'report' && report) {
    body =
      report.result === 'invalid' ? (
        <div className='flex flex-col gap-4'>
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertTitle>
              {t('import.report.invalidTitle', { count: report.errorCount })}
            </AlertTitle>
            <AlertDescription>
              {t('import.report.invalidDescription')}
            </AlertDescription>
          </Alert>
          <ProblemTable errors={report.errors} total={report.errorCount} />
        </div>
      ) : (
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>{t('import.report.okTitle')}</AlertTitle>
          <AlertDescription>
            {t('import.report.okDescription', {
              rows: report.rowCount,
              created: report.createdCount,
              updated: report.updatedCount,
              unchanged: report.unchangedCount,
            })}
          </AlertDescription>
        </Alert>
      );
  } else {
    body = (
      <FieldGroup>
        <Alert>
          <InfoIcon />
          <AlertTitle>{t('import.notice.title')}</AlertTitle>
          <AlertDescription>
            <p>{t('import.notice.accounts')}</p>
            <p>{t('import.notice.atomic')}</p>
          </AlertDescription>
        </Alert>
        <Field data-invalid={kindError ? true : undefined}>
          <FieldLabel htmlFor={`${id}-kind`}>
            {t('import.fields.kind')}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <Select
            items={kindItems}
            value={kind ?? null}
            onValueChange={(value) => {
              setKind(value ?? undefined);
              backToSelect(false);
            }}
          >
            <SelectTrigger
              ref={kindRef}
              id={`${id}-kind`}
              className='w-full'
              aria-required='true'
              aria-invalid={kindError ? true : undefined}
            >
              <SelectValue placeholder={t('import.fields.kind')} />
            </SelectTrigger>
            <SelectContent className={SELECT_CONTENT_CLASS}>
              <SelectGroup>
                {kindItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {kind ? (
            <FieldDescription className='flex flex-wrap items-center gap-x-2'>
              <span>{t(`import.kindHints.${kind}`)}</span>
              <Button
                type='button'
                variant='link'
                size='sm'
                className='h-auto px-0'
                onClick={() => void downloadTemplate(kind)}
              >
                <DownloadIcon data-icon='inline-start' />
                {t('import.actions.templateFor', {
                  kind: t(`import.kinds.${kind}`),
                })}
              </Button>
            </FieldDescription>
          ) : null}
          <FieldError errors={kindError ? [{ message: kindError }] : []} />
        </Field>
        <Field data-invalid={fileError ? true : undefined}>
          <FieldLabel htmlFor={`${id}-file`}>
            {t('import.fields.file')}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <FileUploadInput
            buttonRef={chooseRef}
            chooseLabel={t('import.actions.chooseFile')}
            selectedFile={file}
            emptyLabel={t('import.noFile')}
            ref={fileInputRef}
            id={`${id}-file`}
            accept='.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            aria-required='true'
            aria-invalid={fileError ? true : undefined}
            onFileChange={(selectedFile) => {
              setFile(selectedFile);
              backToSelect(false);
            }}
          />
          <FieldDescription>{t('import.fileHint')}</FieldDescription>
          <FieldError errors={fileError ? [{ message: fileError }] : []} />
        </Field>
      </FieldGroup>
    );
  }

  return (
    <RouteDrawer
      className='sm:max-w-2xl'
      title={t('import.actions.new')}
      description={t('import.description')}
      beforeClose={() => !submittingRef.current}
      footer={
        <Footer
          step={step}
          report={report}
          submitting={submitting}
          onBack={() => backToSelect(report?.result === 'invalid')}
          onConfirm={confirm}
        />
      }
    >
      <form
        id={FORM_ID}
        noValidate
        className='flex flex-col gap-4'
        onSubmit={(event) => {
          event.preventDefault();
          if (step === 'select') void check();
        }}
      >
        {failure === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : failure ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        ) : null}
        {body}
      </form>
    </RouteDrawer>
  );
}

/** The buttons of each step; rendered inside the overlay, where `useRouteOverlay` works. */
function Footer({
  step,
  report,
  submitting,
  onBack,
  onConfirm,
}: {
  readonly step: Step;
  readonly report: ImportReport | undefined;
  readonly submitting: boolean;
  readonly onBack: () => void;
  readonly onConfirm: (close: () => Promise<void>) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  const cancel = (
    <Button
      type='button'
      variant='outline'
      disabled={submitting || isClosing}
      onClick={() => void close()}
    >
      {t('actions.cancel')}
    </Button>
  );
  if (step === 'report' && report?.result === 'invalid')
    return (
      <>
        {cancel}
        <Button type='button' onClick={onBack}>
          {t('import.actions.chooseAgain')}
        </Button>
      </>
    );
  if (step === 'report')
    return (
      <>
        <Button
          type='button'
          variant='outline'
          disabled={submitting}
          onClick={onBack}
        >
          {t('import.actions.back')}
        </Button>
        <Button
          type='button'
          disabled={submitting}
          onClick={() => void onConfirm(close)}
        >
          {submitting ? <Spinner data-icon='inline-start' /> : null}
          {submitting
            ? t('import.actions.importing')
            : t('import.actions.confirm')}
        </Button>
      </>
    );
  return (
    <>
      {cancel}
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('import.actions.checking') : t('import.actions.check')}
      </Button>
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { format } from 'date-fns';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { DatePicker } from '#components/date-picker';
import { Field, FieldGroup, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
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
import { Spinner } from '#components/ui/spinner';
import { isDenied, useCertificateResource } from './resource.js';
import { useCertificateCommand } from './command.js';
import { CertificateError, CertificateSkeleton } from './states.js';
import {
  selectWidth,
  type Detail,
  type Context,
  type Preparation,
} from './types.js';
interface Template {
  id: string;
  name: string;
  active: boolean;
  currentRevisionId: string | null;
}
export default function CertificateIssue() {
  const { t } = useTranslation(),
    { certificateId } = useParams(),
    { session } = useAuthentication(),
    revision = useAuthorizationRevision(),
    [state, setState] = useState({
      busy: false,
      step: 'prepare',
      ready: false,
    }),
    busyRef = useRef(false),
    dirtyRef = useRef(false),
    pendingCloseRef = useRef<((v: boolean) => void) | null>(null),
    [confirm, setConfirm] = useState(false);
  const report = useCallback(
    (value: {
      busy: boolean;
      step: string;
      ready: boolean;
      dirty?: boolean;
    }) => {
      busyRef.current = value.busy;
      dirtyRef.current = value.dirty ?? false;
      setState(value);
    },
    [],
  );
  return (
    <RouteDrawer
      title={t('certificates.issue')}
      className='sm:max-w-2xl'
      beforeClose={() =>
        busyRef.current
          ? false
          : dirtyRef.current
            ? new Promise<boolean>((resolve) => {
                pendingCloseRef.current = resolve;
                setConfirm(true);
              })
            : true
      }
      footer={<Footer {...state} />}
    >
      <Body
        key={`${revision}:${session?.user.id}:${certificateId}`}
        report={report}
      />
      <AlertDialog
        open={confirm}
        onOpenChange={(value) => {
          setConfirm(value);
          if (!value) {
            pendingCloseRef.current?.(false);
            pendingCloseRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('certificates.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('certificates.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('certificates.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dirtyRef.current = false;
                pendingCloseRef.current?.(true);
                pendingCloseRef.current = null;
                setConfirm(false);
              }}
            >
              {t('certificates.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function Footer({
  busy,
  step,
  ready,
}: {
  busy: boolean;
  step: string;
  ready: boolean;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('certificates.cancel')}
      </Button>
      <Button form='certificate-issue' type='submit' disabled={busy || !ready}>
        {busy ? <Spinner /> : null}
        {t(`certificates.${step}`)}
      </Button>
    </>
  );
}
function Body({
  report,
}: {
  report: (state: {
    busy: boolean;
    step: string;
    ready: boolean;
    dirty?: boolean;
  }) => void;
}) {
  const { certificateId } = useParams(),
    r = useCertificateResource<{ data: Detail }>(
      `certificateRequests/${encodeURIComponent(certificateId!)}`,
    );
  useEffect(
    () => () => report({ busy: false, step: 'prepare', ready: false }),
    [report],
  );
  return r.error ? (
    <CertificateError error={r.error} retry={r.reload} />
  ) : r.loading ? (
    <CertificateSkeleton />
  ) : r.data?.data.capabilities.canIssue ? (
    <Fields detail={r.data.data} refresh={r.reload} report={report} />
  ) : (
    <CertificateError error={{}} />
  );
}
function Fields({
  detail,
  refresh,
  report,
}: {
  detail: Detail;
  refresh: () => void;
  report: (state: {
    busy: boolean;
    step: string;
    ready: boolean;
    dirty?: boolean;
  }) => void;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay(),
    parent = useOutletContext<Context>(),
    toast = useToaster(),
    cmd = useCertificateCommand();
  const [templateId, setTemplateId] = useState(
      detail.capabilities.preparation?.templateId ?? '',
    ),
    [date, setDate] = useState<Date>(),
    [income, setIncome] = useState(''),
    [preparation, setPreparation] = useState<Preparation | null>(
      detail.capabilities.preparation,
    ),
    [validation, setValidation] = useState(false),
    [page, setPage] = useState(1);
  const templates = useCertificateResource<{
    data: Template[];
    meta: { total: number };
  }>('printTemplates', {
    mode: 'use',
    source: 'certificates',
    page: String(page),
    pageSize: '20',
  });
  const selected = useCertificateResource<{
    data: { record: Template; sourceReady: boolean };
  }>(templateId ? `printTemplates/${encodeURIComponent(templateId)}` : null, {
    mode: 'use',
  });
  const fatal =
    isDenied(cmd.error) ||
    isDenied(templates.error) ||
    isDenied(selected.error);
  const step = !preparation
    ? 'prepare'
    : preparation.status === 'generated'
      ? 'confirmIssue'
      : 'generate';
  const completeOffer = detail.capabilities.taskActions.some((o) =>
    o.actions.some((a) => a.name === 'complete'),
  );
  const ready =
    completeOffer &&
    (!!preparation ||
      (!!selected.data?.data.record.currentRevisionId &&
        selected.data.data.sourceReady));
  // Income is never persisted; leaving or losing current record access unmounts this form.
  useEffect(() => {
    report({
      busy: cmd.busy,
      step,
      ready: ready && !templates.error && !selected.error && !fatal,
      dirty: !fatal && !preparation && !!(templateId || date || income),
    });
  }, [
    cmd.busy,
    step,
    ready,
    templates.error,
    selected.error,
    report,
    fatal,
    preparation,
    templateId,
    date,
    income,
  ]);
  useEffect(() => {
    if (isDenied(cmd.error)) refresh();
  }, [cmd.error, refresh]);
  async function submit() {
    if (!ready || cmd.busy) return;
    let result: unknown;
    if (!preparation) {
      const cents = /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(income)
        ? Number(income.split('.')[0]) * 100 +
          Number((income.split('.')[1] ?? '').padEnd(2, '0'))
        : NaN;
      if (
        !date ||
        (detail.record.certificateType === 'income' &&
          !Number.isSafeInteger(cents))
      ) {
        setValidation(true);
        document
          .getElementById(!date ? 'certificate-date' : 'certificate-income')
          ?.focus();
        return;
      }
      result = await cmd.execute<{ data: Preparation }>(
        `certificateRequests/${encodeURIComponent(detail.record.id)}/prepare`,
        'POST',
        {
          templateId,
          revisionId: selected.data!.data.record.currentRevisionId,
          issueDate: format(date, 'yyyy-MM-dd'),
          ...(detail.record.certificateType === 'income'
            ? { monthlyCents: cents }
            : {}),
        },
      );
      if (result) {
        const p = (result as { data: Preparation }).data;
        setPreparation({
          ...p,
          templateId,
          revisionId: selected.data!.data.record.currentRevisionId!,
        });
      }
    } else if (step === 'generate') {
      result = await cmd.execute(
        `certificatePreparations/${encodeURIComponent(preparation.id)}/generate`,
        'POST',
        {},
        '',
      );
      if (result) setPreparation({ ...preparation, status: 'generated' });
    } else {
      const offer = detail.capabilities.taskActions.find((o) =>
        o.actions.some((a) => a.name === 'complete'),
      );
      if (!offer) return;
      result = await cmd.execute(
        `certificateRequests/${encodeURIComponent(detail.record.id)}/actions`,
        'POST',
        {
          action: 'complete',
          target: { taskId: offer.taskId },
          contentHash: offer.contentHash,
          input: { preparationId: preparation.id },
        },
        'requestId',
      );
      if (result) {
        report({ busy: false, step, ready: false });
        parent.reload();
        toast.show({
          type: 'success',
          title: t('certificates.issuedRecord', {
            name: detail.record.applicant.name,
          }),
        });
        await close();
      }
    }
    if (result) refresh();
  }
  if (fatal)
    return (
      <CertificateError
        error={cmd.error ?? templates.error ?? selected.error}
      />
    );
  return (
    <form
      id='certificate-issue'
      className='flex flex-col gap-5'
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className='text-sm text-muted-foreground'>
        {t('certificates.issueDescription')}
      </p>
      {templates.error ? (
        <CertificateError error={templates.error} retry={templates.reload} />
      ) : null}
      {selected.error ? (
        <CertificateError error={selected.error} retry={selected.reload} />
      ) : null}
      {!completeOffer ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('certificates.unavailable')}
        </p>
      ) : null}
      {!preparation ? (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='certificate-template'>
              {t('certificates.template')} *
            </FieldLabel>
            <Select
              value={templateId}
              onValueChange={(v) => setTemplateId(v ?? '')}
              disabled={cmd.busy}
            >
              <SelectTrigger id='certificate-template'>
                <SelectValue placeholder={t('certificates.selectTemplate')}>
                  {selected.data?.data.record.name ??
                    templates.data?.data.find((v) => v.id === templateId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={selectWidth}>
                <SelectGroup>
                  {templates.data?.data
                    .filter((v) => v.active && v.currentRevisionId)
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div
              className='flex items-center gap-2'
              data-slot='table-pagination'
            >
              <Button
                type='button'
                variant='outline'
                disabled={page === 1 || cmd.busy}
                onClick={() => setPage((v) => v - 1)}
              >
                {t('certificates.previous')}
              </Button>
              <Button
                type='button'
                variant='outline'
                disabled={
                  page * 20 >= (templates.data?.meta.total ?? 0) || cmd.busy
                }
                onClick={() => setPage((v) => v + 1)}
              >
                {t('certificates.next')}
              </Button>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor='certificate-date'>
              {t('certificates.issueDate')} *
            </FieldLabel>
            <DatePicker
              id='certificate-date'
              value={date}
              onChange={setDate}
              disabled={cmd.busy}
              invalid={validation && !date}
            />
          </Field>
          {detail.record.certificateType === 'income' ? (
            <Field>
              <FieldLabel htmlFor='certificate-income'>
                {t('certificates.income')} *
              </FieldLabel>
              <Input
                id='certificate-income'
                inputMode='decimal'
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                disabled={cmd.busy}
                autoComplete='off'
              />
            </Field>
          ) : null}
          {validation ? (
            <p role='alert' className='text-sm text-destructive'>
              {t('certificates.invalidIssue')}
            </p>
          ) : null}
        </FieldGroup>
      ) : (
        <section className='flex flex-col gap-2 rounded-lg border p-4'>
          <h3 className='text-base font-medium'>{t(`certificates.${step}`)}</h3>
          <p className='text-sm'>
            {preparation.number} · {preparation.issueDate}
          </p>
          <p className='break-all text-sm text-muted-foreground'>
            {t('certificates.revision')}: {preparation.revisionId}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t(
              `certificates.${step === 'generate' ? 'generateDescription' : 'confirmIssueDescription'}`,
            )}
          </p>
        </section>
      )}
      {cmd.error ? <CertificateError error={cmd.error} /> : null}
    </form>
  );
}

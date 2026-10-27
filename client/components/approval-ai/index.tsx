import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useScheduleResource } from '../../pages/personal-schedules/resource.js';
import type { ReviewView, Finding } from '../../../shared/approval-ai.js';
import { createRequestKey } from '#lib/request-key';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '#components/ui/card';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { FieldGroup, Field, FieldLabel } from '#components/ui/field';
import { Textarea } from '#components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { ApprovalAiError } from './error.js';
export function ApprovalAiReviewPanel(props: {
  lifecycle: string;
  recordId: string;
  refreshKey?: unknown;
  evidenceHref?: (e: Finding['evidence'][number]) => string | undefined;
  evidenceLabel?: (e: Finding['evidence'][number]) => string | undefined;
}) {
  return (
    <ReviewPanel key={props.lifecycle + ':' + props.recordId} {...props} />
  );
}
function ReviewPanel({
  lifecycle,
  recordId,
  refreshKey,
  evidenceHref,
  evidenceLabel,
}: {
  lifecycle: string;
  recordId: string;
  refreshKey?: unknown;
  evidenceHref?: (e: Finding['evidence'][number]) => string | undefined;
  evidenceLabel?: (e: Finding['evidence'][number]) => string | undefined;
}) {
  const { t, i18n } = useTranslation();
  const resource = useScheduleResource<{ data: ReviewView[] }>(
    'approvalAi/reviews',
    { lifecycle, recordId, locale: i18n.language },
  );
  const [paused, setPaused] = useState(false);
  const startedRef = useRef<number | null>(null);

  const reload = resource.reload;
  const refresh = useCallback(() => {
    startedRef.current = null;
    setPaused(false);
    reload();
  }, [reload]);
  const busy =
    resource.data?.data?.some((r) =>
      ['queued', 'running'].includes(r.status),
    ) ?? false;
  const previousRefreshRef = useRef(refreshKey);
  useEffect(() => {
    if (previousRefreshRef.current !== refreshKey) {
      previousRefreshRef.current = refreshKey;
      reload();
    }
  }, [refreshKey, reload]);
  useEffect(() => {
    if (!busy || resource.error || paused) {
      if (!busy) startedRef.current = null;
      return;
    }
    startedRef.current ??= Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedRef.current! >= 300_000) setPaused(true);
      else reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [busy, paused, resource.error, reload]);
  if (resource.error)
    return <ApprovalAiError error={resource.error} retry={reload} />;
  if (!resource.data?.data?.length) return null;
  return (
    <section
      className='flex min-w-0 flex-col gap-4'
      aria-label={t('approvalAi.title')}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-base font-medium'>{t('approvalAi.title')}</h2>
        <Button
          variant='outline'
          size='sm'
          disabled={resource.loading}
          onClick={() => {
            startedRef.current = null;
            setPaused(false);
            reload();
          }}
        >
          {t('approvalAi.refresh')}
        </Button>
      </div>
      {paused && (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('approvalAi.pollPaused')}
        </p>
      )}
      {resource.data.data.map((review) =>
        review.taskOpen ? (
          <Review
            key={review.taskId}
            review={review}
            reload={refresh}
            evidenceHref={evidenceHref}
            evidenceLabel={evidenceLabel}
          />
        ) : (
          <details key={review.taskId} className='min-w-0'>
            <summary className='cursor-pointer text-sm'>
              {t('approvalAi.history')} · {review.title}
            </summary>
            <Review
              review={review}
              reload={refresh}
              evidenceHref={evidenceHref}
              evidenceLabel={evidenceLabel}
            />
          </details>
        ),
      )}
    </section>
  );
}
function Review({
  review,
  reload,
  evidenceHref,
  evidenceLabel,
}: {
  review: ReviewView;
  reload: () => void;
  evidenceHref?: (e: Finding['evidence'][number]) => string | undefined;
  evidenceLabel?: (e: Finding['evidence'][number]) => string | undefined;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster();
  const [pending, setPending] = useState(false),
    [error, setError] = useState<unknown>(),
    [feedback, setFeedback] = useState(false),
    [rating, setRating] = useState(review.feedback?.rating ?? 'useful'),
    [note, setNote] = useState(review.feedback?.note ?? '');
  const requestKeyRef = useRef<string | null>(null);
  async function generate() {
    if (pending) return;
    setPending(true);
    setError(undefined);
    requestKeyRef.current ??= createRequestKey();
    try {
      await api.request({
        method: 'POST',
        path:
          'approvalAi/reviews/' +
          encodeURIComponent(review.taskId) +
          '/generate',
        json: { requestKey: requestKeyRef.current },
      });
      requestKeyRef.current = null;
      reload();
    } catch (e) {
      setError(e);
      reload();
    } finally {
      setPending(false);
    }
  }
  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await api.request({
        method: 'PUT',
        path:
          'approvalAi/reviews/' +
          encodeURIComponent(review.taskId) +
          '/feedback',
        json: { rating, note },
      });
      setFeedback(false);
      toaster.show({ type: 'success', title: t('approvalAi.feedbackSaved') });
      reload();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center justify-between gap-2'>
          <span className='min-w-0 wrap-anywhere'>{review.title}</span>
          <Badge variant='outline'>
            {t('approvalAi.statuses.' + review.status)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t('approvalAi.advisory')} · {t('approvalAi.stage')}{' '}
          {t('contracts.statuses.' + review.stage)} ·{' '}
          {t('approvalAi.' + review.via)}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex min-w-0 flex-col gap-4 wrap-anywhere'>
        {!!error && !feedback && (
          <ApprovalAiError error={error} retry={reload} />
        )}
        {review.errorCode && (
          <Alert>
            <AlertDescription>
              {t('approvalAi.errors.' + review.errorCode)}
            </AlertDescription>
          </Alert>
        )}
        {review.findings?.map((finding) => (
          <details
            key={finding.checkId}
            open={finding.verdict !== 'conforms'}
            className='min-w-0'
          >
            <summary className='cursor-pointer'>
              <span>{finding.title}</span>{' '}
              <Badge
                variant={
                  finding.verdict === 'nonconforming'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {t('approvalAi.verdicts.' + finding.verdict)}
              </Badge>
            </summary>
            <p className='mt-2 whitespace-pre-wrap text-sm'>
              {finding.summary}
            </p>
            {finding.evidence.map((e) => (
              <div
                key={JSON.stringify(e)}
                className='mt-2 text-sm text-muted-foreground'
              >
                {e.kind === 'knowledge' || evidenceHref?.(e) ? (
                  <Link
                    className='underline'
                    to={
                      e.kind === 'knowledge'
                        ? '/knowledge/' + encodeURIComponent(e.ref)
                        : evidenceHref!(e)!
                    }
                  >
                    {evidenceLabel?.(e) ??
                      review.coverage.find((m) => m.ref === e.ref)?.label ??
                      e.ref}
                  </Link>
                ) : (
                  <span>
                    {t('approvalAi.evidence')}:{' '}
                    {evidenceLabel?.(e) ??
                      review.coverage.find((m) => m.ref === e.ref)?.label ??
                      e.ref}
                  </span>
                )}
                {e.location && <span> · {e.location}</span>}
                {e.quote && (
                  <blockquote className='mt-1 border-l-2 pl-3 whitespace-pre-wrap'>
                    {e.quote}
                  </blockquote>
                )}
              </div>
            ))}
          </details>
        ))}
        {review.basis && <p className='text-sm'>{review.basis}</p>}
        {!!review.coverage.length && (
          <details>
            <summary className='cursor-pointer text-sm'>
              {t('approvalAi.coverage')}
            </summary>
            <ul className='mt-2 flex flex-col gap-2 text-sm'>
              {review.coverage.map((m) => (
                <li key={m.kind + ':' + m.ref + ':' + (m.slot ?? '')}>
                  {m.label}
                  {m.version !== undefined ? ' · v' + m.version : ''} ·{' '}
                  {t('approvalAi.materialStatuses.' + m.status)}
                </li>
              ))}
            </ul>
          </details>
        )}
        {review.generatedAt && (
          <p className='text-xs text-muted-foreground'>
            {new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(review.generatedAt))}{' '}
            · {review.model?.modelService} / {review.model?.model}
          </p>
        )}
        <div className='flex flex-wrap gap-2'>
          {review.canGenerate && (
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => void generate()}
            >
              {t(
                'approvalAi.' +
                  (pending
                    ? 'saving'
                    : review.status === 'succeeded'
                      ? 'regenerate'
                      : review.status === 'none'
                        ? 'generate'
                        : 'retry'),
              )}
            </Button>
          )}
          {review.taskOpen && review.status === 'succeeded' && (
            <Button
              variant='outline'
              disabled={pending}
              onClick={() => setFeedback(true)}
            >
              {t('approvalAi.feedback')}
              {review.feedback
                ? ' · ' + t('approvalAi.ratings.' + review.feedback.rating)
                : ''}
            </Button>
          )}
        </div>
        <Dialog
          open={feedback}
          onOpenChange={(open) => {
            if (!pending) setFeedback(open);
          }}
        >
          <FormDrawerContent showCloseButton={!pending}>
            <form onSubmit={(event) => void submitFeedback(event)}>
              <FormDrawerHeader>
                <DialogTitle>{t('approvalAi.feedback')}</DialogTitle>
                <DialogDescription>
                  {t('approvalAi.feedbackDescription')}
                </DialogDescription>
              </FormDrawerHeader>
              <FormDrawerBody>
                {!!error && <ApprovalAiError error={error} />}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={'rating-' + review.taskId}>
                      {t('approvalAi.rating')}
                    </FieldLabel>
                    <Select
                      value={rating}
                      disabled={pending}
                      onValueChange={(v) => setRating(v ?? 'useful')}
                    >
                      <SelectTrigger
                        id={'rating-' + review.taskId}
                        className='w-full'
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
                        <SelectGroup>
                          {['useful', 'false_positive', 'missed'].map(
                            (value) => (
                              <SelectItem
                                className='whitespace-normal wrap-anywhere'
                                key={value}
                                value={value}
                              >
                                {t('approvalAi.ratings.' + value)}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={'note-' + review.taskId}>
                      {t('approvalAi.note')}
                    </FieldLabel>
                    <Textarea
                      id={'note-' + review.taskId}
                      value={note}
                      maxLength={1000}
                      disabled={pending}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </FormDrawerBody>
              <FormDrawerFooter>
                <Button
                  type='button'
                  variant='outline'
                  disabled={pending}
                  onClick={() => setFeedback(false)}
                >
                  {t('approvalAi.cancel')}
                </Button>
                <Button type='submit' disabled={pending}>
                  {t('approvalAi.' + (pending ? 'saving' : 'save'))}
                </Button>
              </FormDrawerFooter>
            </form>
          </FormDrawerContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

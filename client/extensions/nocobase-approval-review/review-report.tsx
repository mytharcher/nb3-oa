import type { ReactElement } from 'react';
import { useReviewTranslation } from './translations.js';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  FileText,
  Paperclip,
  ScanText,
  Info,
} from 'lucide-react';
import type { ReviewFinding, ReviewReportProps } from './types.js';
import { LongText } from '#components/long-text';
import { Badge } from '#components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '#components/ui/collapsible';

const verdictOrder = [
  'nonconforming',
  'needs_verification',
  'not_covered',
  'conforms',
] as const;
const verdictIcons = {
  nonconforming: CircleAlert,
  needs_verification: CircleHelp,
  not_covered: ScanText,
  conforms: CheckCircle2,
};
const verdictClasses: Record<ReviewFinding['verdict'], string> = {
  nonconforming:
    'border-destructive/25 bg-destructive/10 text-destructive dark:bg-destructive/20',
  needs_verification:
    'border-(--status-warning)/25 bg-(--status-warning-background) text-(--status-warning)',
  not_covered: 'border-dashed border-border bg-muted text-muted-foreground',
  conforms:
    'border-(--status-success)/25 bg-(--status-success-background) text-(--status-success)',
};
const materialStatuses = [
  'read',
  'partial_read',
  'not_supported',
  'missing',
] as const;
const materialIcons = {
  field: ScanText,
  text: FileText,
  attachment: Paperclip,
  knowledge: BookOpen,
  record: FileText,
  aggregate: FileText,
};

export function ReviewVerdictBadge({
  verdict,
  count,
}: {
  verdict: ReviewFinding['verdict'];
  count?: number;
}): ReactElement {
  const { t } = useReviewTranslation();
  const Icon = verdictIcons[verdict];
  return (
    <Badge variant='outline' className={verdictClasses[verdict]}>
      <Icon aria-hidden='true' />
      {t('approvalAi.verdicts.' + verdict)}
      {count !== undefined && <span className='tabular-nums'>{count}</span>}
    </Badge>
  );
}

export function ApprovalReviewReport({
  review,
  renderEvidence,
  evidenceLabel,
  notice,
  children,
}: ReviewReportProps): ReactElement {
  const { t } = useReviewTranslation();
  if (review.status !== 'succeeded') return <>{children}</>;
  const findings = [...(review.findings ?? [])].sort(
    (a, b) => verdictOrder.indexOf(a.verdict) - verdictOrder.indexOf(b.verdict),
  );
  return (
    <div className='flex min-w-0 flex-col gap-3'>
      {review.nextStep && (
        <p className='text-sm whitespace-pre-wrap wrap-anywhere'>
          <span>{review.nextStep}</span>
        </p>
      )}
      <Collapsible className='group/report min-w-0'>
        <CollapsibleTrigger className='w-full text-start flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-sm py-1 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden'>
          <span className='flex flex-wrap gap-2'>
            {verdictOrder.map((verdict) => {
              const count = findings.filter(
                (f) => f.verdict === verdict,
              ).length;
              return count ? (
                <ReviewVerdictBadge
                  key={verdict}
                  verdict={verdict}
                  count={count}
                />
              ) : null;
            })}
            {!findings.length && (
              <span className='text-sm text-muted-foreground'>
                {t('approvalAi.noFindings')}
              </span>
            )}
          </span>
          <span className='flex items-center gap-1 text-sm text-muted-foreground'>
            <span className='group-data-open/report:hidden'>
              {t('approvalAi.expandReport')}
            </span>
            <span className='hidden group-data-open/report:inline'>
              {t('approvalAi.collapseReport')}
            </span>
            <ChevronDown
              aria-hidden='true'
              className='size-4 transition-transform group-data-open/report:rotate-180'
            />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent
          keepMounted
          className='flex min-w-0 flex-col gap-4 pt-4'
        >
          <p className='flex items-start gap-2 text-xs text-muted-foreground'>
            <Info aria-hidden='true' className='size-4 shrink-0' />
            {notice ?? t('approvalAi.reviewPrivacy')}
          </p>
          <ul
            className='flex min-w-0 flex-col gap-3'
            aria-label={t('approvalAi.findings')}
          >
            {findings.map((finding) => (
              <li
                key={finding.checkId}
                className='min-w-0 rounded-lg border p-4'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <ReviewVerdictBadge verdict={finding.verdict} />
                  <h3 className='min-w-0 text-sm font-medium wrap-anywhere'>
                    {finding.title}
                  </h3>
                </div>
                <LongText className='mt-3 text-sm wrap-anywhere'>
                  {finding.summary}
                </LongText>
                {!!finding.evidence.length && (
                  <ul
                    className='mt-3 flex min-w-0 flex-col gap-2'
                    aria-label={t('approvalAi.evidence')}
                  >
                    {finding.evidence.map((e) => {
                      const Icon = materialIcons[e.kind];
                      const label =
                        evidenceLabel?.(e) ??
                        review.coverage.find(
                          (m) => m.ref === e.ref && m.kind === e.kind,
                        )?.label ??
                        e.ref;
                      return (
                        <li
                          key={JSON.stringify(e)}
                          className='min-w-0 rounded-md bg-muted/40 p-3 text-xs'
                        >
                          <div className='flex items-start gap-2 text-muted-foreground'>
                            <Icon
                              aria-hidden='true'
                              className='size-3.5 shrink-0'
                            />
                            <div className='min-w-0 wrap-anywhere'>
                              <span>
                                {t('approvalAi.materialKinds.' + e.kind)} ·{' '}
                              </span>
                              {renderEvidence?.(e, label) ?? (
                                <span>{label}</span>
                              )}
                              {e.location && <span> · {e.location}</span>}
                            </div>
                          </div>
                          {e.quote && (
                            <blockquote className='mt-2 border-l-2 border-border pl-3 text-sm whitespace-pre-wrap wrap-anywhere'>
                              <LongText className='wrap-anywhere'>
                                {e.quote}
                              </LongText>
                            </blockquote>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <section className='rounded-lg border p-3'>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <h3 className='font-medium'>{t('approvalAi.coverage')}</h3>
              <span className='text-xs text-muted-foreground'>
                {t('approvalAi.coverageCounts', {
                  read: review.coverage.filter((m) => m.status === 'read')
                    .length,
                  unsupported: review.coverage.filter(
                    (m) => m.status === 'not_supported',
                  ).length,
                  missing: review.coverage.filter((m) => m.status === 'missing')
                    .length,
                })}
                {review.coverage.some((m) => m.status === 'partial_read') && (
                  <>
                    {' '}
                    · {t('approvalAi.materialStatuses.partial_read')}{' '}
                    {
                      review.coverage.filter((m) => m.status === 'partial_read')
                        .length
                    }
                  </>
                )}
              </span>
            </div>
            <ul className='mt-3 flex flex-col gap-3 text-sm'>
              {materialStatuses
                .flatMap((status) =>
                  review.coverage.filter((m) => m.status === status),
                )
                .map((m) => {
                  const Icon = materialIcons[m.kind];
                  return (
                    <li
                      key={m.kind + ':' + m.ref + ':' + (m.slot ?? '')}
                      className='flex flex-wrap items-start gap-2'
                    >
                      <Badge
                        variant={
                          m.status === 'missing'
                            ? 'destructive'
                            : m.status === 'read'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {t('approvalAi.materialStatuses.' + m.status)}
                      </Badge>
                      <span className='flex min-w-0 flex-1 items-start gap-2 wrap-anywhere'>
                        <Icon
                          aria-hidden='true'
                          className='mt-0.5 size-4 shrink-0 text-muted-foreground'
                        />
                        <span>
                          {t('approvalAi.materialKinds.' + m.kind)} · {m.label}
                          {m.version !== undefined && (
                            <span className='text-muted-foreground'>
                              {' '}
                              · v{m.version}
                            </span>
                          )}
                        </span>
                      </span>
                    </li>
                  );
                })}
            </ul>
            {!review.coverage.length && (
              <p className='mt-3 text-sm text-muted-foreground'>
                {t('approvalAi.noMaterials')}
              </p>
            )}
            {review.basis && (
              <LongText className='mt-3 border-t pt-3 text-xs text-muted-foreground'>
                {review.basis}
              </LongText>
            )}
          </section>
          {children && <div className='border-t pt-4'>{children}</div>}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

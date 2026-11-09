import { useState, type ReactElement } from 'react';
import {
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Square,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '#components/ui/popover';
import { RelativeReviewTime } from './review-time.js';
import { useReviewTranslation } from './translations.js';
import type { ReviewAttempt, ReviewVersion } from './types.js';

export function ReviewAttemptSummary({
  attempts,
}: {
  attempts: readonly ReviewAttempt[];
}): ReactElement {
  const { t } = useReviewTranslation();
  return (
    <p className='text-xs text-muted-foreground'>
      {t('approvalAi.history.total', { count: attempts.length })}
      {(
        [
          'succeeded',
          'failed',
          'cancelled',
          'generating',
          'unavailable',
        ] as const
      ).map((status) => {
        const count = attempts.filter((a) => a.status === status).length;
        return count ? (
          <span key={status}>
            {' '}
            · {t('approvalAi.history.' + status)} {count}
          </span>
        ) : null;
      })}
    </p>
  );
}

export function ReviewHistory({
  attempts,
  versions,
  selectedVersionId,
  onSelectVersion,
}: {
  attempts: readonly ReviewAttempt[];
  versions: readonly ReviewVersion[];
  selectedVersionId?: string;
  onSelectVersion?: (id: string) => void;
}): ReactElement {
  const { t, i18n } = useReviewTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='font-normal text-muted-foreground'
            aria-label={t('approvalAi.history.title')}
          />
        }
      >
        {selectedVersionId && versions.some((v) => v.id === selectedVersionId)
          ? t('approvalAi.history.viewing', {
              count: versions.findIndex((v) => v.id === selectedVersionId) + 1,
            })
          : t('approvalAi.history.title')}
        <ChevronDown aria-hidden='true' />
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80 max-w-[calc(100vw-2rem)]'>
        <PopoverTitle>{t('approvalAi.history.title')}</PopoverTitle>
        <ReviewAttemptSummary attempts={attempts} />
        <ol
          className='mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto'
          aria-label={t('approvalAi.history.title')}
        >
          {[...attempts].reverse().map((attempt) => {
            const index = versions.findIndex((v) => v.id === attempt.id);
            const version = versions[index];
            const Icon =
              attempt.status === 'generating'
                ? LoaderCircle
                : attempt.status === 'succeeded'
                  ? Check
                  : attempt.status === 'cancelled'
                    ? Square
                    : CircleAlert;
            const content = (
              <>
                <span className='flex items-center gap-2 text-sm'>
                  <Icon
                    aria-hidden='true'
                    className={
                      'size-4 shrink-0 ' +
                      (attempt.status === 'generating'
                        ? 'animate-spin text-primary'
                        : attempt.status === 'failed'
                          ? 'text-(--status-warning)'
                          : attempt.status === 'succeeded'
                            ? 'text-primary'
                            : 'text-muted-foreground')
                    }
                  />
                  {t('approvalAi.history.' + attempt.status)}
                  {version && <span>V{index + 1}</span>}
                  {selectedVersionId === attempt.id && (
                    <span className='text-xs text-muted-foreground'>
                      {t('approvalAi.history.current')}
                    </span>
                  )}
                </span>
                {version?.model && (
                  <span className='text-xs text-muted-foreground wrap-anywhere'>
                    {t('approvalAi.model')} · {version.model.modelService} /{' '}
                    {version.model.model}
                  </span>
                )}
                {attempt.startedAt && (
                  <span className='text-xs text-muted-foreground'>
                    {t('approvalAi.history.started', {
                      time: new Date(attempt.startedAt).toLocaleString(
                        i18n.language,
                      ),
                    })}
                  </span>
                )}
                {attempt.status === 'generating' && attempt.deadlineAt && (
                  <span className='text-xs text-muted-foreground'>
                    {t('approvalAi.history.deadline', {
                      time: new Date(attempt.deadlineAt).toLocaleString(
                        i18n.language,
                      ),
                    })}
                  </span>
                )}
                {attempt.diagnostics?.outputTokens !== undefined && (
                  <span className='text-xs text-muted-foreground'>
                    {t('approvalAi.history.tokens', {
                      input: attempt.diagnostics.inputTokens ?? 0,
                      output: attempt.diagnostics.outputTokens,
                      reasoning: attempt.diagnostics.reasoningTokens ?? 0,
                    })}
                  </span>
                )}
                {attempt.diagnostics?.durationMs !== undefined && (
                  <span className='text-xs text-muted-foreground'>
                    {t('approvalAi.history.duration', {
                      seconds: Math.round(
                        attempt.diagnostics.durationMs / 1000,
                      ),
                    })}
                  </span>
                )}
                {attempt.createdAt && (
                  <span className='text-xs text-muted-foreground'>
                    <RelativeReviewTime
                      value={
                        version?.generatedAt ??
                        attempt.finishedAt ??
                        attempt.createdAt
                      }
                      locale={i18n.language}
                    />
                  </span>
                )}
              </>
            );
            return (
              <li key={attempt.id}>
                {version ? (
                  <Button
                    variant={
                      selectedVersionId === attempt.id ? 'secondary' : 'ghost'
                    }
                    className='h-auto w-full flex-col items-start gap-1 whitespace-normal px-2 py-2 text-start font-normal'
                    aria-label={t('approvalAi.version', { count: index + 1 })}
                    aria-pressed={selectedVersionId === attempt.id}
                    disabled={!onSelectVersion}
                    onClick={() => {
                      onSelectVersion?.(attempt.id);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </Button>
                ) : (
                  <div className='flex flex-col gap-1 rounded-md border px-2 py-2'>
                    {content}
                    {attempt.status === 'failed' && (
                      <p className='text-xs text-muted-foreground'>
                        {t(
                          'approvalAi.history.' +
                            (attempt.errorCode === 'network'
                              ? 'network'
                              : attempt.errorCode === 'rate_limited'
                                ? 'rateLimited'
                                : [
                                      'model_auth',
                                      'model_configuration',
                                    ].includes(attempt.errorCode ?? '')
                                  ? 'configuration'
                                  : attempt.errorCode === 'model_quota'
                                    ? 'quota'
                                    : attempt.errorCode === 'context_overflow'
                                      ? 'contextLimit'
                                      : [
                                            'model_filtered',
                                            'model_rejected',
                                          ].includes(attempt.errorCode ?? '')
                                        ? 'providerRejected'
                                        : attempt.errorCode === 'output_limit'
                                          ? 'outputLimit'
                                          : attempt.errorCode === 'interrupted'
                                            ? 'interrupted'
                                            : attempt.errorCode ===
                                                'model_incomplete'
                                              ? 'incomplete'
                                              : attempt.errorCode ===
                                                  'invalid_report'
                                                ? attempt.diagnostics
                                                    ?.validationCode ===
                                                  'invalid_json'
                                                  ? 'invalidJson'
                                                  : attempt.diagnostics
                                                        ?.validationCode ===
                                                      'unverified_evidence'
                                                    ? 'unverifiedEvidence'
                                                    : 'invalidReport'
                                                : attempt.errorCode ===
                                                    'timeout'
                                                  ? 'timeout'
                                                  : 'unknownFailure'),
                        )}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </PopoverContent>
    </Popover>
  );
}

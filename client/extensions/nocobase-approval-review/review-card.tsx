import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Sparkles,
  RefreshCw,
  LoaderCircle,
  Shuffle,
  Check,
  X,
  Square,
  ChevronDown,
  CircleAlert,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { useReviewTranslation } from './translations.js';
import { ApprovalReviewReport } from './review-report.js';
import { ReviewHistory } from './review-history.js';
import { RelativeReviewTime } from './review-time.js';
import type {
  ReviewReportProps,
  ReviewSnapshot,
  ReviewVersion,
  ReviewStatus,
  ReviewAttempt,
} from './types.js';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '#components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '#components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '#components/ui/card';
import { Alert, AlertDescription } from '#components/ui/alert';

export interface ApprovalReviewCardProps extends Omit<
  ReviewReportProps,
  'review'
> {
  review: ReviewSnapshot;
  versions?: readonly ReviewVersion[];
  attempts?: readonly ReviewAttempt[];
  selectedVersionId?: string;
  onSelectVersion?: (id: string) => void;
  status: ReviewStatus;
  statusLabel?: string;
  pending?: boolean;
  cancelling?: boolean;
  refreshing?: boolean;
  historical?: boolean;
  canGenerate?: boolean;
  /** Host-provided prerequisite or authorization explanation. */
  disabledReason?: string;
  /** Disables mutations; refresh and version inspection remain available. */
  readOnly?: boolean;
  canCancel?: boolean;
  onGenerate?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  error?: ReactNode;
  failure?: ReactNode;
  onActionError?: (error: unknown) => void;
}
export function ApprovalReviewCard({
  review,
  versions = [],
  attempts,
  selectedVersionId,
  onSelectVersion,
  status,
  statusLabel: statusLabelOverride,
  pending = false,
  cancelling = false,
  refreshing = false,
  historical = false,
  canGenerate = false,
  disabledReason,
  readOnly = false,
  canCancel = false,
  onGenerate,
  onCancel,
  onRefresh,
  error,
  failure,
  onActionError,
  renderEvidence,
  evidenceLabel,
  notice,
  children,
}: ApprovalReviewCardProps): ReactElement {
  const { t, i18n } = useReviewTranslation();
  const locale = i18n.language;
  const [actionsOpen, setActionsOpen] = useState(false);
  const active = status === 'queued' || status === 'running';
  const reasonId = useId();
  const mutationRef = useRef<symbol | null>(null);
  const refreshRef = useRef<symbol | null>(null);
  const mutationKey = [status, pending, cancelling].join(':');
  const [mutationState, setMutationState] = useState({
    key: mutationKey,
    busy: false,
  });
  if (mutationState.key !== mutationKey)
    setMutationState({ key: mutationKey, busy: false });
  const localMutation = mutationState.key === mutationKey && mutationState.busy;
  const refreshKey = String(refreshing);
  const [refreshState, setRefreshState] = useState({
    key: refreshKey,
    busy: false,
  });
  if (refreshState.key !== refreshKey)
    setRefreshState({ key: refreshKey, busy: false });
  const localRefresh = refreshState.key === refreshKey && refreshState.busy;
  const [actionFailed, setActionFailed] = useState(false);
  // Void callbacks acknowledge through controlled run props; promises acknowledge on settlement.
  useEffect(() => {
    mutationRef.current = null;
  }, [status, pending, cancelling]);
  useEffect(() => {
    refreshRef.current = null;
  }, [refreshing]);
  const mutable = review.taskOpen && !readOnly;
  const generationDisabled =
    !mutable ||
    !canGenerate ||
    !onGenerate ||
    !!disabledReason ||
    active ||
    pending ||
    cancelling ||
    refreshing ||
    localMutation ||
    localRefresh;
  const cancelDisabled =
    !mutable ||
    !canCancel ||
    !onCancel ||
    !active ||
    cancelling ||
    localMutation;
  function invoke(
    action: (() => void | Promise<void>) | undefined,
    refresh = false,
  ): void {
    const lock = refresh ? refreshRef : mutationRef;
    if (!action || lock.current) return;
    const token = Symbol();
    lock.current = token;
    const setBusy = (busy: boolean): void => {
      if (refresh) setRefreshState({ key: refreshKey, busy });
      else setMutationState({ key: mutationKey, busy });
    };
    setBusy(true);
    setActionFailed(false);
    const release = (): void => {
      if (lock.current !== token) return;
      lock.current = null;
      setBusy(false);
    };
    const failed = (error: unknown): void => {
      release();
      setActionFailed(true);
      onActionError?.(error);
    };
    try {
      const result = action();
      if (result) void result.then(release, failed);
    } catch (error) {
      failed(error);
    }
  }
  const foundIndex = versions.findIndex((v) => v.id === selectedVersionId);
  const selectedIndex = foundIndex < 0 ? versions.length - 1 : foundIndex;
  const currentReview = {
    taskOpen: review.taskOpen,
    canCancel: canCancel && !!onCancel,
  };
  const statusLabel =
    statusLabelOverride ??
    t(
      'approvalAi.' + (pending ? 'submittingGeneration' : 'statuses.' + status),
    );
  const StatusIcon = active
    ? LoaderCircle
    : status === 'succeeded'
      ? Check
      : status === 'failed'
        ? review.status === 'succeeded'
          ? CircleAlert
          : X
        : Sparkles;
  const reload = (): void => {
    if (!refreshing) invoke(onRefresh, true);
  };
  const selectVersion = (id: string): void => onSelectVersion?.(id);
  const cancel = (): void => {
    if (cancelDisabled) return;
    invoke(onCancel);
    setActionsOpen(false);
  };
  const generate = (): void => {
    if (generationDisabled) return;
    invoke(onGenerate);
    setActionsOpen(false);
  };
  return (
    <Card
      className='min-w-0 overflow-hidden'
      aria-busy={
        active || pending || localMutation || refreshing || localRefresh
      }
    >
      <CardHeader>
        <CardTitle
          role='heading'
          aria-level={2}
          className='flex flex-wrap items-center justify-between gap-2'
        >
          <span className='flex min-w-0 items-center gap-2'>
            <Sparkles
              aria-hidden='true'
              className='size-4 shrink-0 text-primary'
            />
            {t('approvalAi.title')}
            {onRefresh && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      className='text-muted-foreground'
                      aria-label={t('approvalAi.refresh')}
                      disabled={refreshing || localRefresh || !onRefresh}
                      onClick={reload}
                    />
                  }
                >
                  <RefreshCw
                    aria-hidden='true'
                    className={refreshing ? 'animate-spin' : undefined}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('approvalAi.refresh')}</TooltipContent>
              </Tooltip>
            )}
          </span>
          <span className='flex flex-wrap items-center gap-2'>
            {attempts && attempts.length > 0 && (
              <ReviewHistory
                attempts={attempts}
                versions={versions}
                selectedVersionId={versions[selectedIndex]?.id}
                onSelectVersion={onSelectVersion}
              />
            )}
            {!attempts && versions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={!onSelectVersion}
                      className='font-normal text-muted-foreground'
                    />
                  }
                >
                  {t('approvalAi.versionCount', {
                    current: selectedIndex + 1,
                    count: versions.length,
                  })}{' '}
                  <ChevronDown aria-hidden='true' />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='max-h-72 w-max max-w-[calc(100vw-2rem)] overflow-y-auto'
                >
                  <DropdownMenuRadioGroup
                    value={versions[selectedIndex]?.id ?? ''}
                    onValueChange={selectVersion}
                  >
                    {[...versions].reverse().map((version, reverseIndex) => (
                      <DropdownMenuRadioItem
                        key={version.id}
                        value={version.id}
                      >
                        <span
                          aria-hidden='true'
                          className='inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-xs tabular-nums text-muted-foreground'
                        >
                          {versions.length - reverseIndex}
                        </span>
                        <span className='sr-only'>
                          {t('approvalAi.version', {
                            count: versions.length - reverseIndex,
                          })}
                        </span>
                        {version.generatedAt && (
                          <RelativeReviewTime
                            value={version.generatedAt}
                            locale={locale}
                          />
                        )}
                        {reverseIndex === 0 && t('approvalAi.latestVersion')}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={statusLabel}
                  />
                }
              >
                <StatusIcon
                  aria-hidden='true'
                  className={
                    active
                      ? 'animate-spin text-primary'
                      : status === 'succeeded'
                        ? 'text-primary'
                        : status === 'failed'
                          ? review.status === 'succeeded'
                            ? 'text-(--status-warning)'
                            : 'text-destructive'
                          : 'text-muted-foreground'
                  }
                />
              </PopoverTrigger>
              <PopoverContent
                align='end'
                className='w-max max-w-[calc(100vw-2rem)]'
              >
                <PopoverTitle>{statusLabel}</PopoverTitle>
                {historical && !readOnly && (
                  <p className='text-xs text-muted-foreground'>
                    {t('approvalAi.latestRunActions')}
                  </p>
                )}
                {mutable && active && currentReview.canCancel ? (
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={cancelDisabled}
                    onClick={() => void cancel()}
                  >
                    {cancelling ? (
                      <LoaderCircle
                        aria-hidden='true'
                        className='animate-spin'
                      />
                    ) : (
                      <Square aria-hidden='true' />
                    )}
                    {t(
                      'approvalAi.' +
                        (cancelling ? 'cancelling' : 'cancelGeneration'),
                    )}
                  </Button>
                ) : (
                  mutable &&
                  !active && (
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={generationDisabled}
                      aria-describedby={disabledReason ? reasonId : undefined}
                      onClick={() => void generate()}
                    >
                      <Shuffle aria-hidden='true' />
                      {t(
                        'approvalAi.' +
                          (status === 'failed'
                            ? 'retry'
                            : status === 'none'
                              ? 'generate'
                              : 'regenerate'),
                      )}
                    </Button>
                  )
                )}
              </PopoverContent>
            </Popover>
          </span>
        </CardTitle>
        {!review.taskOpen && (
          <CardDescription>{t('approvalAi.historyReadOnly')}</CardDescription>
        )}
      </CardHeader>
      <CardContent className='flex min-w-0 flex-col gap-4 wrap-anywhere'>
        <span role='status' className='sr-only'>
          {statusLabel}
        </span>
        {review.status === 'succeeded' &&
          !active &&
          !pending &&
          !cancelling &&
          (status === 'failed' || status === 'cancelled') && (
            <Alert
              role={status === 'failed' ? 'alert' : 'status'}
              className={
                status === 'failed'
                  ? 'border-(--status-warning)/40 bg-(--status-warning-background)'
                  : 'bg-muted/50'
              }
            >
              <CircleAlert aria-hidden='true' />
              <AlertDescription className='flex flex-wrap items-center justify-between gap-2'>
                <span>
                  {t(
                    'approvalAi.history.' +
                      (status === 'failed'
                        ? 'failedReport'
                        : 'cancelledReport'),
                    { count: selectedIndex + 1 },
                  )}
                </span>
                {status === 'failed' && mutable && (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={generationDisabled}
                    onClick={generate}
                  >
                    {t('approvalAi.retry')}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        {error}
        {actionFailed && (
          <p role='alert' className='text-sm text-destructive'>
            {t('approvalAi.actionFailed')}
          </p>
        )}
        {disabledReason && (
          <p
            id={reasonId}
            role='status'
            className='text-sm text-muted-foreground'
          >
            {disabledReason}
          </p>
        )}
        {readOnly && review.taskOpen && (
          <p className='text-sm text-muted-foreground'>
            {t('approvalAi.readOnly')}
          </p>
        )}
        {mutable && !active && review.status !== 'succeeded' && (
          <Button
            className='self-start'
            size='sm'
            disabled={generationDisabled}
            aria-describedby={disabledReason ? reasonId : undefined}
            onClick={generate}
          >
            {t('approvalAi.' + (status === 'failed' ? 'retry' : 'generate'))}
          </Button>
        )}
        {failure && (
          <Alert>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        )}
        {review.status !== 'succeeded' && (
          <div
            role='status'
            className={
              'flex items-start gap-3 rounded-lg p-4 ' +
              (review.status === 'failed' ? 'bg-destructive/10' : 'bg-muted/50')
            }
          >
            {review.status === 'failed' ? (
              <CircleAlert
                aria-hidden='true'
                className='size-5 shrink-0 text-destructive'
              />
            ) : ['queued', 'running'].includes(review.status) ? (
              <LoaderCircle
                aria-hidden='true'
                className='size-5 shrink-0 animate-spin text-primary'
              />
            ) : (
              <Sparkles
                aria-hidden='true'
                className='size-5 shrink-0 text-muted-foreground'
              />
            )}
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>
                {t('approvalAi.statuses.' + review.status)}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('approvalAi.stateHints.' + review.status)}
              </p>
            </div>
          </div>
        )}
        <ApprovalReviewReport
          key={review.generatedAt ?? review.status}
          review={review}
          renderEvidence={renderEvidence}
          evidenceLabel={evidenceLabel}
          notice={notice}
        >
          {children}
        </ApprovalReviewReport>
      </CardContent>
    </Card>
  );
}

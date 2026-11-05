import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useApiClient,
  useRealtimeRefresh,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import { Link } from 'react-router';
import type { ApprovalSuggestionView } from '../../../shared/approval-ai.js';
import { createRequestKey } from '#lib/request-key';
import { Skeleton } from '#components/ui/skeleton';
import {
  ApprovalReviewCard,
  type ReviewEvidence,
  type ReviewStatus,
} from '#extensions/nocobase-approval-review/index';
import { ApprovalAiError } from './error.js';

interface PanelProps {
  lifecycle: string;
  recordId: string;
  refreshKey?: unknown;
  evidenceHref?: (evidence: ReviewEvidence) => string | undefined;
  evidenceLabel?: (evidence: ReviewEvidence) => string | undefined;
}

/** One authorized adapter for every business source; the Registry block owns presentation. */
export function ApprovalAiReviewPanel(props: PanelProps) {
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const { i18n } = useTranslation();
  return (
    <ReviewPanel
      key={JSON.stringify([
        props.lifecycle,
        props.recordId,
        session?.user.id,
        revision,
        i18n.language,
      ])}
      {...props}
    />
  );
}

function ReviewPanel({
  lifecycle,
  recordId,
  refreshKey,
  ...evidence
}: PanelProps) {
  const api = useApiClient();
  const { t } = useTranslation();
  const [items, setItems] = useState<ApprovalSuggestionView[]>();
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [error, setError] = useState<unknown>();
  const [refreshing, setRefreshing] = useState(false);
  const readSequenceRef = useRef(0);
  const mountedRef = useRef(false);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const sequence = ++readSequenceRef.current;
      setRefreshing(true);
      try {
        const result = await api.request<{ data: ApprovalSuggestionView[] }>({
          path: 'approvalAi/reviews',
          query: { lifecycle, recordId },
          signal,
        });
        if (
          mountedRef.current &&
          !signal?.aborted &&
          sequence === readSequenceRef.current
        ) {
          setItems(result.data);
          setTaskIds(result.data.map((item) => item.taskId));
          setError(undefined);
        }
      } catch (cause) {
        if (
          mountedRef.current &&
          !signal?.aborted &&
          sequence === readSequenceRef.current
        ) {
          // Any failed revalidation removes all controlled report/version content.
          setItems((old) =>
            old?.map((item) => ({
              ...item,
              advice: null,
              versions: [],
              attempts: [],
              canGenerate: false,
              canRegenerate: false,
              canCancel: false,
              state: 'ready' as const,
            })),
          );

          setError(cause);
        }
        throw cause;
      } finally {
        if (mountedRef.current && sequence === readSequenceRef.current)
          setRefreshing(false);
      }
    },
    [api, lifecycle, recordId],
  );
  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void load(controller.signal).catch(() => {});
    }, 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, refreshKey]);
  const refresh = useCallback(() => load(), [load]);
  const accept = async (item: ApprovalSuggestionView, epoch: number) => {
    if (!mountedRef.current) return;
    // A newer status read is an authorization boundary. An older mutation
    // acknowledgement must never restore a report cleared by revalidation.
    if (readSequenceRef.current !== epoch) {
      await load();
      return;
    }
    // A mutation acknowledgement supersedes any older status read still in flight.
    readSequenceRef.current += 1;
    setRefreshing(false);
    setItems((old) =>
      old?.map((value) => (value.taskId === item.taskId ? item : value)),
    );
  };
  const visible = items?.filter(
    (item) => !['not_found', 'not_actionable'].includes(item.state),
  );
  return (
    <>
      {taskIds.map((taskId) => (
        <SuggestionRefresh key={taskId} taskId={taskId} refresh={load} />
      ))}
      {error ? (
        <ApprovalAiError
          error={error}
          retry={() => {
            void refresh().catch(() => {});
          }}
        />
      ) : null}
      {!items && !error ? (
        <div
          role='status'
          aria-label={t('approvalAi.loading')}
          className='flex flex-col gap-3 rounded-xl border p-4'
        >
          <Skeleton className='h-5 w-1/3' />
          <Skeleton className='h-12 w-full' />
        </div>
      ) : visible?.length ? (
        <section
          aria-label={t('approvalAi.title')}
          className='flex min-w-0 flex-col gap-4'
        >
          {visible.map((item) => (
            <Review
              key={item.taskId}
              item={item}
              lifecycle={lifecycle}
              recordId={recordId}
              refreshing={refreshing}
              readFailed={!!error}
              refresh={refresh}
              accept={accept}
              mutationEpoch={() => readSequenceRef.current}
              {...evidence}
            />
          ))}
        </section>
      ) : null}
    </>
  );
}

function SuggestionRefresh({
  taskId,
  refresh,
}: {
  taskId: string;
  refresh: (signal?: AbortSignal) => Promise<void>;
}) {
  useRealtimeRefresh(`oa:approval-suggestions:${taskId}`, refresh);
  return null;
}

function statusOf(item: ApprovalSuggestionView): ReviewStatus {
  if (item.state === 'generating')
    return item.attempts?.at(-1)?.phase === 'queued' ? 'queued' : 'running';
  if (item.state === 'generated') return 'succeeded';
  if (item.state === 'failed' || item.state === 'cancelled') return item.state;
  return 'none';
}

function Review({
  item,
  lifecycle,
  recordId,
  refreshing,
  readFailed,
  refresh,
  accept,
  mutationEpoch,
  evidenceHref,
  evidenceLabel,
}: Omit<PanelProps, 'refreshKey'> & {
  item: ApprovalSuggestionView;
  refreshing: boolean;
  readFailed: boolean;
  refresh: () => Promise<void>;
  accept: (item: ApprovalSuggestionView, epoch: number) => Promise<void>;
  mutationEpoch: () => number;
}) {
  const api = useApiClient();
  const toaster = useToaster();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string>();
  const [action, setAction] = useState<'generate' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<unknown>();
  const operationRef = useRef<{
    requestKey: string;
    previousId: string | null;
  } | null>(null);
  const lockedRef = useRef(false);
  const currentId = item.currentGenerationId ?? null;
  useEffect(() => {
    if (operationRef.current && currentId !== operationRef.current.previousId)
      operationRef.current = null;
  }, [currentId]);
  const versions = item.versions ?? [];
  const version =
    versions.find((value) => value.id === selected) ?? versions.at(-1);
  const report = version?.report ?? item.advice?.report;
  const prerequisite =
    item.state === 'model_unconfigured' ||
    item.state === 'services_unavailable';
  const disabledReason = prerequisite
    ? t('approvalAi.prerequisites.' + item.state)
    : undefined;
  async function mutate(kind: 'generate' | 'cancel') {
    if (lockedRef.current || refreshing || readFailed) return;
    lockedRef.current = true;
    setAction(kind);
    setActionError(undefined);
    const epoch = mutationEpoch();
    try {
      const generation =
        kind === 'generate'
          ? (operationRef.current ??= {
              requestKey: createRequestKey(),
              previousId: currentId,
            })
          : null;
      const result = await api.request<{ data: ApprovalSuggestionView }>({
        method: 'POST',
        path: `approvalAi/reviews/${encodeURIComponent(item.taskId)}/${kind}`,
        json: {
          lifecycle,
          recordId,
          ...(generation ?? { generationId: currentId }),
        },
      });
      await accept(result.data, epoch);
      if (kind === 'generate') {
        operationRef.current = null;
        setSelected(undefined);
        toaster.show({
          type: 'success',
          title: t('approvalAi.generationRequested'),
        });
      }
    } catch (cause) {
      // Preserve the complete operationRef identity after an uncertain enqueue response.
      setActionError(cause);
      await refresh().catch(() => {});
    } finally {
      lockedRef.current = false;
      setAction(null);
    }
  }
  return (
    <ApprovalReviewCard
      review={{
        status: report ? 'succeeded' : 'none',
        taskOpen: !['not_found', 'not_actionable'].includes(item.state),
        nextStep: report?.nextStep ?? null,
        findings: report?.findings ?? null,
        coverage: (report?.coverage ?? []).map((material) => ({
          ...material,
          status: material.truncated
            ? ('partial_read' as const)
            : material.status,
          label:
            material.truncated && material.range
              ? `${material.label} (${material.range.start}–${material.range.end}/${material.range.total})`
              : material.label,
        })),
        basis: report?.basis ?? null,
        model: report?.model ?? null,
        generatedAt: report?.generatedAt ?? null,
      }}
      status={statusOf(item)}
      pending={action === 'generate'}
      cancelling={action === 'cancel'}
      refreshing={refreshing}
      readOnly={readFailed}
      canGenerate={item.canGenerate || !!item.canRegenerate}
      canCancel={!!item.canCancel && !!currentId}
      disabledReason={disabledReason}
      versions={versions.map((value) => ({
        id: value.id,
        generatedAt: value.report.generatedAt,
        model: value.report.model,
      }))}
      attempts={item.attempts}
      selectedVersionId={version?.id}
      onSelectVersion={setSelected}
      historical={!!version && version.id !== currentId}
      onGenerate={() => mutate('generate')}
      onCancel={() => mutate('cancel')}
      onRefresh={refresh}
      error={
        actionError ? (
          <ApprovalAiError
            error={actionError}
            retry={() => {
              void refresh().catch(() => {});
            }}
          />
        ) : undefined
      }
      failure={
        item.state === 'failed' ? t('approvalAi.generationFailed') : undefined
      }
      notice={t('approvalAi.reviewPrivacy')}
      evidenceLabel={evidenceLabel}
      renderEvidence={(entry, label) => {
        const href = evidenceHref?.(entry);
        return href ? (
          <Link
            className='text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring'
            to={href}
          >
            {label}
          </Link>
        ) : (
          label
        );
      }}
    />
  );
}

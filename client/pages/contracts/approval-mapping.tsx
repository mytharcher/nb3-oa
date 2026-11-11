import { ApprovalDetailSection } from '#components/approval-detail-section';
import { ApprovalProgress } from '#components/approval-progress';
import {
  ApprovalTimeline,
  ApprovalUiProvider,
  type ApprovalTimelineLine,
} from '#extensions/nocobase-approval-ui';
import {
  renderTimelineEntry,
  approvalStepsOf,
  approvalCopiesOf,
  approvalWord,
  type ApprovalText,
} from '@nocobase/app-plugin-approval/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ContractDetail } from './types.js';
import { dateLabel } from './model.js';
import type { Ref } from 'react';
export function ContractHistory({
  detail,
  timelineRef,
}: {
  detail: ContractDetail;
  timelineRef?: Ref<HTMLElement>;
}) {
  const { t, i18n } = useTranslation();
  const text: ApprovalText = {
    t: (key, values) => t(key, values),
    name: (id) =>
      detail.knownUsers.find((p) => p.id === id)?.name ??
      t('approvals.unknownPerson'),
    stage: (key) =>
      t(`contracts.statuses.${key}`, { defaultValue: t('contracts.progress') }),
  };
  const steps = approvalStepsOf(detail.runs, detail.upcoming);
  const entries: ApprovalTimelineLine[] = detail.timeline.runs
    .flatMap((run) => [
      ...run.entries,
      ...run.stages.flatMap((stage) => stage.entries),
    ])
    .map((entry) => {
      const line = renderTimelineEntry(entry, text);
      return {
        ...line,
        kind: line.kind === 'system' ? 'event' : 'action',
        emphasis: line.kind === 'system' ? 'muted' : 'default',
      };
    });
  return (
    <ApprovalUiProvider
      personName={text.name}
      formatDateTime={(value) =>
        dateLabel(value, i18n.language, detail.timeZone)
      }
    >
      <ApprovalDetailSection title={t('contracts.progress')}>
        <ApprovalProgress
          steps={steps.map((step) => ({
            key: step.key,
            title: text.stage(step.stage, step.title),
            state: step.state,
            at: step.at,
            policy: step.policy
              ? approvalWord(text, `policies.${step.policy}`, step.policy)
              : null,
            because: step.because,
            tasks: step.tasks.map((task) => ({
              key: task.id,
              personId: task.assigneeId ?? '',
              badges: [
                {
                  label: approvalWord(
                    text,
                    `taskStatus.${task.status}`,
                    task.status,
                  ),
                },
              ],
              comment: task.comment,
              due: task.dueAt
                ? {
                    label: dateLabel(
                      task.dueAt,
                      i18n.language,
                      detail.timeZone,
                    ),
                    overdue: Date.parse(task.dueAt) < Date.now(),
                  }
                : null,
            })),
          }))}
          copies={approvalCopiesOf(detail.runs).map((task) => ({
            key: task.id,
            personId: task.assigneeId ?? '',
            read: task.status === 'completed',
          }))}
        />
      </ApprovalDetailSection>
      <section
        ref={timelineRef}
        tabIndex={-1}
        aria-label={t('contracts.timeline')}
        className='scroll-mt-4 outline-none'
      >
        <ApprovalDetailSection title={t('contracts.timeline')}>
          <ApprovalTimeline lines={entries} />
        </ApprovalDetailSection>
      </section>
    </ApprovalUiProvider>
  );
}

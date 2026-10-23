import { createElement, type ComponentType, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { TaskSummaryFields } from '#extensions/nocobase-task-center-ui/index';
import type { PrototypeTask } from './prototype-data.js';

export interface TaskSummaryProps {
  readonly task: PrototypeTask;
}

/**
 * Summary renderers contributed by task types. A task whose subject has no renderer shows no
 * summary at all; the card never falls back to a generic field dump.
 * Lookup order: `<sourceType>:<subject>`, then `<subject>` shared by every source.
 */
const renderers: Readonly<Record<string, ComponentType<TaskSummaryProps>>> = {
  leave: LeaveSummary,
  reimbursement: ReimbursementSummary,
  purchase: PurchaseSummary,
};

/** Renders the summary contributed for the task's type, or nothing when none is registered. */
export function TaskSummary({ task }: TaskSummaryProps): ReactElement | null {
  const renderer =
    renderers[`${task.sourceType}:${task.subject}`] ?? renderers[task.subject];
  return renderer ? createElement(renderer, { task }) : null;
}

function useAmount(): (value: number) => string {
  const { i18n } = useTranslation();
  return (value) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'CNY',
    }).format(value);
}

function LeaveSummary({ task }: TaskSummaryProps): ReactElement | null {
  const { t } = useTranslation();
  const summary = task.summary;
  if (!summary) return null;
  return (
    <TaskSummaryFields
      items={[
        [t('taskCenter.summary.leaveType'), summary.type],
        [
          t('taskCenter.summary.period'),
          summary.from === summary.to
            ? summary.from
            : t('taskCenter.summary.range', {
                from: summary.from,
                to: summary.to,
              }),
        ],
        [
          t('taskCenter.summary.duration'),
          t('taskCenter.summary.days', { count: Number(summary.days) }),
        ],
      ]}
    />
  );
}

function ReimbursementSummary({ task }: TaskSummaryProps): ReactElement | null {
  const { t } = useTranslation();
  const amount = useAmount();
  const summary = task.summary;
  if (!summary) return null;
  return (
    <TaskSummaryFields
      items={[
        [t('taskCenter.summary.amount'), amount(Number(summary.amount))],
        [t('taskCenter.summary.category'), summary.category],
        [t('taskCenter.summary.reason'), summary.reason],
      ]}
    />
  );
}

function PurchaseSummary({ task }: TaskSummaryProps): ReactElement | null {
  const { t } = useTranslation();
  const amount = useAmount();
  const summary = task.summary;
  if (!summary) return null;
  return (
    <TaskSummaryFields
      items={[
        [t('taskCenter.summary.item'), summary.item],
        [t('taskCenter.summary.quantity'), summary.quantity],
        [t('taskCenter.summary.budget'), amount(Number(summary.budget))],
      ]}
    />
  );
}

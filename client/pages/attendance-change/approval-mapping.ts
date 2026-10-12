import {
  approvalStepsOf,
  approvalCopiesOf,
  renderTimelineEntry,
  approvalWord,
  type ApprovalText,
  type RoutePreview,
} from '@nocobase/app-plugin-approval/client';
import type {
  ApprovalStep,
  ApprovalTimelineLine,
  ApprovalRoute,
} from '#extensions/nocobase-approval-ui/types';
import type { AttendanceChangeDetail } from './types.js';
export function progressOf(
  detail: AttendanceChangeDetail,
  text: ApprovalText,
  locale: string,
): ApprovalStep[] {
  return approvalStepsOf(detail.runs, detail.upcoming).map((step) => ({
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
        { label: approvalWord(text, `taskStatus.${task.status}`, task.status) },
      ],
      comment: task.comment,
      due: task.dueAt
        ? {
            label: new Intl.DateTimeFormat(locale, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(task.dueAt)),
            overdue: Date.parse(task.dueAt) < Date.now(),
          }
        : null,
    })),
  }));
}
export function copiesOf(detail: AttendanceChangeDetail) {
  return approvalCopiesOf(detail.runs).map((task) => ({
    key: task.id,
    personId: task.assigneeId ?? '',
    read: task.status === 'completed',
  }));
}
export function timelineOf(
  detail: AttendanceChangeDetail,
  text: ApprovalText,
): ApprovalTimelineLine[] {
  return detail.timeline.runs
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
}
export function routeOf(
  route: RoutePreview,
  text: ApprovalText,
): ApprovalRoute {
  return {
    ...route,
    problems: route.problems.map(() => text.t('approvals.unavailable')),
    notes: [],
    stops: route.steps.map((step) => ({
      ...step,
      title: text.stage(step.key, step.title),
      policy: approvalWord(text, `policies.${step.rule}`, step.rule),
    })),
  };
}

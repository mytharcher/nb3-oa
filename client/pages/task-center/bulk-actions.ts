import type { LucideIcon } from 'lucide-react';
import { BellRing, Check, MailCheck } from 'lucide-react';
import type { PrototypeTask, TaskStatus } from './prototype-data.js';

/**
 * A batch operation contributed by a task type. The task center only offers selection and a
 * confirmation; the owning business validates and executes each item on its own server, so an
 * action never applies outside the source and subjects it declares.
 */
export interface TaskBulkAction {
  readonly key: string;
  readonly sourceType: string;
  /** Subjects the action supports; omitted means every subject of the source. */
  readonly subjects?: readonly string[];
  /** Translation keys; `label` and `done` receive `count`. */
  readonly label: string;
  readonly confirmTitle: string;
  readonly confirmDescription: string;
  readonly done: string;
  readonly icon: LucideIcon;
  /** At most one primary action per scope (guideline L2). */
  readonly primary?: boolean;
  /** Prototype only: the status the item moves to; omitted leaves it unchanged. */
  readonly result?: TaskStatus;
}

const actions: readonly TaskBulkAction[] = [
  {
    key: 'approve',
    sourceType: 'approval.task',
    // Contracts need an individual review, so they do not contribute batch approval.
    subjects: ['leave', 'reimbursement', 'purchase'],
    label: 'taskCenter.bulk.approve',
    confirmTitle: 'taskCenter.bulk.approveTitle',
    confirmDescription: 'taskCenter.bulk.approveDescription',
    done: 'taskCenter.bulk.approveDone',
    icon: Check,
    primary: true,
    result: 'completed',
  },
  {
    key: 'remind',
    sourceType: 'approval.mine',
    label: 'taskCenter.bulk.remind',
    confirmTitle: 'taskCenter.bulk.remindTitle',
    confirmDescription: 'taskCenter.bulk.remindDescription',
    done: 'taskCenter.bulk.remindDone',
    icon: BellRing,
  },
  {
    key: 'markRead',
    sourceType: 'approval.cc',
    label: 'taskCenter.bulk.markRead',
    confirmTitle: 'taskCenter.bulk.markReadTitle',
    confirmDescription: 'taskCenter.bulk.markReadDescription',
    done: 'taskCenter.bulk.markReadDone',
    icon: MailCheck,
    primary: true,
    result: 'completed',
  },
];

/** Actions available in a scope: the source, narrowed to one subject when one is selected. */
export function bulkActionsFor(
  sourceType: string,
  subject?: string,
): readonly TaskBulkAction[] {
  return actions.filter(
    (action) =>
      action.sourceType === sourceType &&
      (!subject || !action.subjects || action.subjects.includes(subject)),
  );
}

/** Only open tasks are processed in a batch. */
export function bulkActionApplies(
  action: TaskBulkAction,
  task: PrototypeTask,
): boolean {
  return (
    task.status === 'pending' &&
    task.sourceType === action.sourceType &&
    (!action.subjects || action.subjects.includes(task.subject))
  );
}

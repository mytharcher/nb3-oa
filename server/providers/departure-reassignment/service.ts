import { createHash } from 'node:crypto';
import {
  OPEN,
  isOpenRun,
  type ApprovalService,
  type PerformInput,
  type TaskRow,
} from '@nocobase/app-plugin-approval/server';
import type { DepartureApprovalReassignment } from '../departure/contract.js';
import type { ReassignmentJournal } from './journal.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';

/** Business action entry preserves that owner's fresh directory, audit hooks and SDK transaction. */
export interface ReassignmentOwner {
  lifecycle: string;
  approvals: Pick<ApprovalService, 'tasksFor' | 'runsFor' | 'actionsOf'>;
  action(
    recordId: string,
    input: Omit<PerformInput, 'actor'>,
    actorId: string,
  ): Promise<unknown>;
}
export interface ReassignmentCandidate {
  lifecycle: string;
  recordId: string;
  /** Projection identities must resolve to real facts, including cancelled history. */
  taskIds: readonly string[];
}
export class DepartureReassignmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export function taskRequestId(requestKey: string, taskId: string): string {
  return `departure-reassign:${createHash('sha256')
    .update(JSON.stringify([requestKey, taskId]))
    .digest('hex')}`;
}
/** No outer transaction: each public business action commits independently and is durably deduplicated by the SDK. */
export function createDepartureReassignment(dependencies: {
  directory: Pick<ApprovalDirectoryService, 'snapshot'>;
  journal: ReassignmentJournal;
  owners(): readonly ReassignmentOwner[];
  discover(
    from: string,
    owners: readonly ReassignmentOwner[],
  ): Promise<readonly ReassignmentCandidate[]>;
  /** Ordinary work responsibilities remain in their owner's lifecycle, outside approval SDK tasks. */
  handoverWorkItems?: (
    input: Parameters<DepartureApprovalReassignment['reassign']>[0],
    actorId: string,
  ) => Promise<{ remaining: number }>;
}): DepartureApprovalReassignment {
  async function scan(from: string, owners: readonly ReassignmentOwner[]) {
    const byLifecycle = new Map(
      owners.map((owner) => [owner.lifecycle, owner]),
    );
    if (byLifecycle.size !== owners.length || !owners.length)
      throw new DepartureReassignmentError(
        'REASSIGNMENT_REGISTRY_INVALID',
        'Every registered approval lifecycle needs exactly one owner.',
      );
    const tasks = new Map<
      string,
      { task: TaskRow; owner?: ReassignmentOwner; current: boolean }
    >();
    // Discover every page before performing any action. Read each record once per scan.
    const candidates = await dependencies.discover(from, owners);
    const records = new Map<string, ReassignmentCandidate>();
    for (const candidate of candidates) {
      const key = JSON.stringify([candidate.lifecycle, candidate.recordId]);
      const previous = records.get(key);
      records.set(key, {
        ...candidate,
        taskIds: [
          ...new Set([...(previous?.taskIds ?? []), ...candidate.taskIds]),
        ],
      });
    }
    for (const candidate of records.values()) {
      const owner = byLifecycle.get(candidate.lifecycle);
      if (!owner)
        throw new DepartureReassignmentError(
          'REASSIGNMENT_OWNER_MISSING',
          'A task candidate has no registered business owner.',
        );
      const facts = await owner.approvals.tasksFor(
        candidate.lifecycle,
        candidate.recordId,
      );
      if (candidate.taskIds.some((id) => !facts.some((task) => task.id === id)))
        throw new DepartureReassignmentError(
          'REASSIGNMENT_FACT_MISSING',
          'A projected task has no authoritative record fact.',
        );
      const relevant = facts.filter(
        (task) =>
          task.assigneeId === from &&
          OPEN.includes(task.status) &&
          task.role !== 'info' &&
          task.kind !== 'copy',
      );
      if (!relevant.length) continue;
      const runs = await owner.approvals.runsFor(
        candidate.lifecycle,
        candidate.recordId,
      );
      for (const task of relevant) {
        if (tasks.has(task.id)) continue;
        const run = runs.find((r) => r.id === task.runId);
        if (run && !isOpenRun(run)) continue;
        const current =
          !!run &&
          task.lifecycle === candidate.lifecycle &&
          task.recordId === candidate.recordId &&
          run.lifecycle === task.lifecycle &&
          run.recordId === task.recordId &&
          run.source === task.source &&
          run.status === task.stage &&
          run.lifecycleVersion === task.enteredVersion;
        tasks.set(task.id, { task, owner, current });
      }
    }
    return [...tasks.values()];
  }
  return {
    async reassign(input) {
      if (
        !input.from ||
        input.from.length > 64 ||
        input.to.length > 64 ||
        input.reason.length > 4000 ||
        input.requestKey.length > 128 ||
        !input.to ||
        input.from === input.to ||
        !input.reason.trim() ||
        !input.requestKey
      )
        throw new DepartureReassignmentError(
          'REASSIGNMENT_INPUT_INVALID',
          'A distinct successor, reason and durable departure key are required.',
        );
      const directory = await dependencies.directory.snapshot();
      if (!directory.isActive(input.to))
        throw new DepartureReassignmentError(
          'REASSIGNMENT_RECIPIENT_INACTIVE',
          'The handover recipient must have an active employee and enabled account.',
        );
      const owners = dependencies.owners();
      const before = await scan(input.from, owners);
      // Explicit system maintenance authorization uses an actual approval.admin employee.
      // Notification recipients and the unrelated administrative duty role grant no approval authority.
      const candidateActor = [...directory.roleMembers('approval.admin')]
        .filter(
          (id) =>
            id !== input.from &&
            id !== input.to &&
            directory.isActive(id) &&
            directory.hasRole(id, 'approval.admin'),
        )
        .sort()[0];
      if (!candidateActor)
        throw new DepartureReassignmentError(
          'REASSIGNMENT_ADMIN_REQUIRED',
          'An active independent approval administrator is required.',
        );
      const { actorId } = await dependencies.journal.reserve(
        input,
        candidateActor,
      );
      if (
        !directory.isActive(actorId) ||
        !directory.hasRole(actorId, 'approval.admin') ||
        actorId === input.from ||
        actorId === input.to
      )
        throw new DepartureReassignmentError(
          'REASSIGNMENT_ADMIN_REQUIRED',
          'The administrator bound to this durable handover is no longer eligible.',
        );
      const attempted: {
        task: TaskRow;
        owner: ReassignmentOwner;
        accepted: boolean;
      }[] = [];
      for (const { task, owner, current } of before) {
        if (!owner || !current) continue;
        let accepted = false;
        try {
          await owner.action(
            task.recordId,
            {
              action: 'reassign',
              target: { taskId: task.id },
              input: { to: input.to, override: false },
              comment: input.reason,
              requestId: taskRequestId(input.requestKey, task.id),
            },
            actorId,
          );
          accepted = true;
        } catch {
          // Each successful task is already committed. Failed qualifications stay assigned and block departure.
        }
        attempted.push({ task, owner, accepted });
      }
      // Batch public receipt reads by record after the independent task commits.
      const histories = new Map<
        string,
        Awaited<ReturnType<ApprovalService['actionsOf']>>
      >();
      for (const { task, owner, accepted } of attempted) {
        const key = JSON.stringify([task.lifecycle, task.recordId]);
        let history = histories.get(key);
        if (!history) {
          history = await owner.approvals.actionsOf(
            task.lifecycle,
            task.recordId,
          );
          histories.set(key, history);
        }
        const receipt = history.find(
          (action) =>
            action.requestId === taskRequestId(input.requestKey, task.id),
        );
        if (
          receipt &&
          (receipt.name !== 'reassign' ||
            receipt.taskId !== task.id ||
            receipt.actorId !== actorId ||
            receipt.input.to !== input.to ||
            receipt.input.override !== false ||
            receipt.comment !== input.reason.trim())
        )
          throw new DepartureReassignmentError(
            'REASSIGNMENT_RECEIPT_MISMATCH',
            'The durable approval receipt does not match the frozen handover command.',
          );
        if (accepted && !receipt)
          throw new DepartureReassignmentError(
            'REASSIGNMENT_RECEIPT_MISSING',
            'The public approval history has not confirmed this migration.',
          );
      }
      const work = await dependencies.handoverWorkItems?.(input, actorId);
      return {
        remaining:
          (await scan(input.from, owners)).length + (work?.remaining ?? 0),
      };
    },
  };
}

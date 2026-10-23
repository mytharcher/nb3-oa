import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';

export type ApprovalPhase =
  | 'transactionBody'
  | 'businessWrite'
  | 'headcountLock'
  | 'taskDependencies'
  | 'afterCommit';
export interface ApprovalTiming {
  totalMs: number;
  phases: Partial<Record<ApprovalPhase, { count: number; durationMs: number }>>;
}
const timings = new AsyncLocalStorage<ApprovalTiming>();
const activePhases = new AsyncLocalStorage<ReadonlySet<ApprovalPhase>>();

/** Opt-in request/fixture measurement; values are inclusive and may nest.
 * Nothing is logged or retained when no collector is active. */
export async function withApprovalTimings<T>(
  work: () => Promise<T>,
  report: (timing: ApprovalTiming) => void,
): Promise<T> {
  const timing: ApprovalTiming = { totalMs: 0, phases: {} };
  const start = performance.now();
  try {
    return await timings.run(timing, work);
  } finally {
    timing.totalMs = performance.now() - start;
    report(timing);
  }
}

export async function measureApprovalPhase<T>(
  phase: ApprovalPhase,
  work: () => Promise<T>,
): Promise<T> {
  const timing = timings.getStore();
  if (!timing || activePhases.getStore()?.has(phase)) return work();
  const start = performance.now();
  try {
    return await activePhases.run(
      new Set([...(activePhases.getStore() ?? []), phase]),
      work,
    );
  } finally {
    const value = (timing.phases[phase] ??= { count: 0, durationMs: 0 });
    value.count++;
    value.durationMs += performance.now() - start;
  }
}

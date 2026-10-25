import type { RunView } from '@nocobase/app-plugin-approval/server';
export interface ProcessFact {
  kind: string;
  recordId: string;
  number: string | null;
  departmentId: string | null;
  runs: readonly RunView[];
}
export interface ProcessSummary {
  kind: string;
  submitted: number;
  completed: number;
  averageElapsedMs: number | null;
  returned: number;
  returnRate: number;
}
export interface StageSummary {
  kind: string;
  stage: string;
  completed: number;
  averageElapsedMs: number | null;
  waiting: number;
  oldestWaitingMs: number;
}
export interface OverdueItem {
  kind: string;
  recordId: string;
  number: string | null;
  stage: string;
  taskId: string;
  dueAt: string;
  overdueMs: number;
}
const closed = new Set(['completed', 'transferred', 'voided']);
/** Natural elapsed approval time, never working-calendar SLA time. */
export function processMetrics(facts: readonly ProcessFact[], now: Date) {
  const processes = new Map<string, ProcessSummary & { sum: number }>(),
    stages = new Map<string, StageSummary & { sum: number }>(),
    overdue: OverdueItem[] = [];
  for (const fact of facts) {
    const runs = [...fact.runs].sort((a, b) =>
      a.run.startedAt.localeCompare(b.run.startedAt),
    );
    if (!runs.length) continue;
    const process = processes.get(fact.kind) ?? {
      kind: fact.kind,
      submitted: 0,
      completed: 0,
      averageElapsedMs: null,
      returned: 0,
      returnRate: 0,
      sum: 0,
    };
    process.submitted++;
    if (
      runs.some(
        (view) =>
          view.run.outcome === 'returned' ||
          view.tasks.some((task) => task.answer === 'return'),
      )
    )
      process.returned++;
    const last = runs.at(-1)!.run;
    if (
      runs.every((view) => view.run.endedAt) &&
      ['approved', 'rejected', 'concluded'].includes(last.outcome ?? '')
    ) {
      process.completed++;
      process.sum += Math.max(
        0,
        Date.parse(last.endedAt!) - Date.parse(runs[0].run.startedAt),
      );
    }
    processes.set(fact.kind, process);
    for (const view of runs) {
      const stays = new Map<string, (typeof view.tasks)[number][]>();
      for (const task of view.tasks) {
        if (task.role === 'info') continue;
        const key = `${task.stage}:${task.enteredVersion}`;
        stays.set(key, [...(stays.get(key) ?? []), task]);
        if (
          !closed.has(task.status) &&
          !task.closedAt &&
          task.dueAt &&
          Date.parse(task.dueAt) < +now
        )
          overdue.push({
            kind: fact.kind,
            recordId: fact.recordId,
            number: fact.number,
            stage: task.stage,
            taskId: task.id,
            dueAt: task.dueAt,
            overdueMs: +now - Date.parse(task.dueAt),
          });
      }
      for (const tasks of stays.values()) {
        const stage = tasks[0].stage,
          key = `${fact.kind}:${stage}`;
        const value = stages.get(key) ?? {
          kind: fact.kind,
          stage,
          completed: 0,
          averageElapsedMs: null,
          waiting: 0,
          oldestWaitingMs: 0,
          sum: 0,
        };
        const start = Math.min(
          ...tasks.map((task) => Date.parse(task.createdAt)),
        );
        if (tasks.every((task) => task.closedAt && closed.has(task.status))) {
          value.completed++;
          value.sum += Math.max(
            0,
            Math.max(...tasks.map((task) => Date.parse(task.closedAt!))) -
              start,
          );
        } else {
          value.waiting++;
          value.oldestWaitingMs = Math.max(value.oldestWaitingMs, +now - start);
        }
        stages.set(key, value);
      }
    }
  }
  return {
    processes: [...processes.values()].map(({ sum, ...p }) => ({
      ...p,
      averageElapsedMs: p.completed ? Math.round(sum / p.completed) : null,
      returnRate: p.submitted ? p.returned / p.submitted : 0,
    })),
    stages: [...stages.values()].map(({ sum, ...s }) => ({
      ...s,
      averageElapsedMs: s.completed ? Math.round(sum / s.completed) : null,
    })),
    overdue: overdue.sort(
      (a, b) => b.overdueMs - a.overdueMs || a.taskId.localeCompare(b.taskId),
    ),
  };
}

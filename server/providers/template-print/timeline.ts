import type {
  ApprovalTimeline,
  RunView,
} from '@nocobase/app-plugin-approval/client';
import { TemplatePrintError } from './validation.js';

/** Project only public facts; SDK input, effects, summary, event data and snapshots never leave this adapter. */
export function projectPrintTimeline(input: {
  timeline: ApprovalTimeline;
  runs: readonly RunView[];
  person: (id: unknown) => string;
  label: (kind: 'stage' | 'action' | 'event', value: string) => string;
  formatDate: (at: string) => string;
}) {
  const tasks = new Map(
    input.runs.flatMap((run) =>
      run.tasks.map((task) => [task.id, task] as const),
    ),
  );
  const seen = new Set<string>();
  const facts = input.timeline.runs
    .flatMap((run) =>
      [...run.entries, ...run.stages.flatMap((stay) => stay.entries)]
        .flatMap((entry) =>
          entry.type === 'action'
            ? [
                entry,
                ...entry.events.map((event) => ({
                  type: 'system' as const,
                  event,
                })),
              ]
            : [entry],
        )
        .map((entry) => ({ entry, runId: run.run.id })),
    )
    .map((fact, order) => ({ ...fact, order }));
  if (facts.length > 2000 || tasks.size > 2000)
    throw new TemplatePrintError('PRINT_DATA_LIMIT');
  return facts
    .filter(({ entry, runId }) => {
      const id = entry.type === 'action' ? entry.action.id : entry.event.id;
      const key = JSON.stringify([runId, entry.type, id]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(({ entry, runId, order }) => {
      const action = entry.type === 'action' ? entry.action : undefined;
      const event = entry.type === 'system' ? entry.event : undefined;
      const task = action?.taskId ? tasks.get(action.taskId) : undefined;
      const value = action?.name ?? event!.kind;
      const stage = action?.stage ?? event?.stage ?? '';
      const at = action?.at ?? event!.at;
      return {
        entryId: action?.id ?? event!.id,
        runId,
        type: entry.type,
        parentActionId: event?.actionId ?? '',
        actorRole: action?.role ?? '',
        onBehalfOf: input.person(action?.onBehalfOf),
        actor: input.person(action?.actorId ?? event?.actorId),
        assignee: input.person(action?.onBehalfOf ?? task?.assigneeId),
        stage: input.label('stage', stage),
        action: input.label(action ? 'action' : 'event', value),
        actionValue: value,
        opinion: action?.comment ?? '',
        at: input.formatDate(at),
        sortAt: at,
        order,
      };
    })
    .sort((a, b) => a.sortAt.localeCompare(b.sortAt) || a.order - b.order)
    .map(({ sortAt: _sortAt, order: _order, ...fact }) => fact);
}

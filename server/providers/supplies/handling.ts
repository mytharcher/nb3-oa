import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';

export const issuingPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.supplyIssuing',
  outcomes: () => [{ exit: 'issued' }, { exit: 'unavailable' }],
  answers: () => ['issued', 'unavailable'],
  plan: ({ places }) =>
    places.map((place) => ({ placeKey: place.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const result = tasks.find(
      (task) =>
        task.status === 'completed' &&
        ['issued', 'unavailable'].includes(task.answer ?? ''),
    );
    return result
      ? { kind: 'closed', result: { exit: result.answer! } }
      : { kind: 'open' };
  },
};
const answer = (name: string, value: string, required: boolean) =>
  defineApprovalAction<Record<string, never>, Record<string, never>>({
    name,
    scope: 'task',
    actors: ['assignee', 'delegate'],
    guards: [
      'runOpen',
      'stayCurrent',
      'taskOpen',
      'actionable',
      'contentCurrent',
      'activeActor',
    ],
    presentation: {
      primary: name === 'complete',
      tone: name === 'unable' ? 'danger' : 'default',
    },
    reason: required,
    defaults: {},
    available: () => offered(),
    plan: (_input, { task }) => [
      { type: 'answer', task: task!.id, answer: value },
    ],
  });
export const handlingActions = {
  complete: answer('complete', 'issued', false),
  unable: answer('unable', 'unavailable', true),
  forceComplete: defineApprovalAction<
    Record<string, never>,
    Record<string, never>
  >({
    name: 'forceComplete',
    scope: 'run',
    actors: ['admin'],
    // Root administrators can intervene without an employee archive; the fresh directory checks their enabled account and protected unrestricted assignment.
    guards: ['runOpen', 'contentCurrent'],
    presentation: { tone: 'danger' },
    reason: true,
    defaults: {},
    available: () => offered(),
    plan: (_input, { comment }) => [
      {
        type: 'conclude',
        result: { exit: 'forcedClosed' },
        input: { reason: comment! },
      },
    ],
  }),
};

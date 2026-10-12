import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';
export const dispatchPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.vehicleDispatch',
  outcomes: () => [{ exit: 'dispatched' }, { exit: 'unavailable' }],
  answers: () => ['dispatched', 'unavailable'],
  plan: ({ places }) =>
    places.map((p) => ({ placeKey: p.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const t = tasks.find(
      (t) =>
        t.status === 'completed' &&
        ['dispatched', 'unavailable'].includes(t.answer ?? ''),
    );
    return t
      ? { kind: 'closed', result: { exit: t.answer! } }
      : { kind: 'open' };
  },
};
export const usagePolicy: StagePolicy<Record<string, never>> = {
  ...dispatchPolicy,
  kind: 'oa.vehicleUsage',
  outcomes: () => [{ exit: 'registered' }],
  answers: () => ['registered'],
  decide: ({ tasks }) =>
    tasks.some((t) => t.status === 'completed' && t.answer === 'registered')
      ? { kind: 'closed', result: { exit: 'registered' } }
      : { kind: 'open' },
};
const action = (name: string, answer: string, reason: boolean) =>
  defineApprovalAction<Record<string, never>, Record<string, never>>({
    name,
    scope: 'task',
    actors: ['assignee'],
    guards: [
      'runOpen',
      'stayCurrent',
      'taskOpen',
      'actionable',
      'contentCurrent',
      'activeActor',
    ],
    reason,
    defaults: {},
    available: () => offered(),
    plan: (_, { task }) => [{ type: 'answer', task: task!.id, answer }],
  });
export const dispatchComplete = action('complete', 'dispatched', false),
  dispatchUnable = action('unable', 'unavailable', true),
  usageComplete = action('registerUsage', 'registered', false);

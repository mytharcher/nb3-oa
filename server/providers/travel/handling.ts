import type { JsonObject } from '@nocobase/lifecycle';
import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';

export const bookingPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.travelBooking',
  outcomes: () => [{ exit: 'booked' }, { exit: 'unavailable' }],
  answers: () => ['booked', 'unavailable'],
  plan: ({ places }) =>
    places.map((place) => ({ placeKey: place.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const result = tasks.find(
      (task) =>
        task.status === 'completed' &&
        ['booked', 'unavailable'].includes(task.answer ?? ''),
    );
    return result
      ? {
          kind: 'closed',
          result: { exit: result.answer! },
          data: {
            reason:
              result.answer === 'unavailable' &&
              typeof result.data?.bookingFailureReason === 'string'
                ? result.data.bookingFailureReason
                : '',
          },
        }
      : { kind: 'open' };
  },
};
const answer = (name: string, value: string, required: boolean) =>
  defineApprovalAction<{ bookingInformation?: string }, Record<string, never>>({
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
    validate: (input) =>
      name === 'complete' &&
      (!input.bookingInformation?.trim() ||
        input.bookingInformation.length > 10000)
        ? 'Order information is required.'
        : null,
    record: ['bookingInformation'],
    plan: (input, { task, comment }) => {
      const data: JsonObject =
        name === 'complete'
          ? { bookingInformation: input.bookingInformation! }
          : { bookingFailureReason: comment! };
      return [{ type: 'answer', task: task!.id, answer: value, data }];
    },
  });
export const bookingActions = {
  complete: answer('complete', 'booked', false),
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
        input: { bookingFailureReason: comment! },
      },
    ],
  }),
};

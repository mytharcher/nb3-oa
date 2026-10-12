import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';
import type { AssetUnit } from '../assets/contract.js';

/** Execution is a claimed administrator task, with no fabricated forced issue or return exit. */
export const assetExecutionPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.assetExecution',
  outcomes: () => [{ exit: 'completed' }, { exit: 'unavailable' }],
  answers: () => ['completed', 'unavailable'],
  plan: ({ places }) =>
    places.map((place) => ({ placeKey: place.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const completed = tasks.find(
      (task) =>
        task.status === 'completed' &&
        ['completed', 'unavailable'].includes(task.answer ?? ''),
    );
    return completed
      ? { kind: 'closed', result: { exit: completed.answer! } }
      : { kind: 'open' };
  },
};
const complete = defineApprovalAction<
  { units: AssetUnit[] },
  Record<string, never>
>({
  name: 'complete',
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
  presentation: { primary: true },
  defaults: {},
  reason: (_input, context) => context.record.status === 'returning',
  record: ['units'],
  available: () => offered(),
  validate: (input) =>
    !Array.isArray(input.units) ||
    !input.units.length ||
    input.units.length > 100 ||
    input.units.some(
      (u) =>
        !u ||
        typeof u.assetId !== 'string' ||
        !u.assetId ||
        typeof u.serialNumber !== 'string' ||
        !u.serialNumber.trim() ||
        u.serialNumber.length > 200,
    ) ||
    new Set(input.units.map((u) => u.assetId)).size !== input.units.length
      ? 'Confirm the actual assets and serial numbers.'
      : null,
  plan: (input, { task, comment }) => [
    {
      type: 'answer',
      task: task!.id,
      answer: 'completed',
      data: {
        receiptReason: comment,
        units: input.units.map((u) => ({
          assetId: u.assetId,
          serialNumber: u.serialNumber.trim(),
        })),
      },
    },
  ],
});
const unable = defineApprovalAction<
  Record<string, never>,
  Record<string, never>
>({
  name: 'unable',
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
  presentation: { tone: 'danger' },
  defaults: {},
  reason: true,
  available: () => offered(),
  plan: (_input, { task }) => [
    { type: 'answer', task: task!.id, answer: 'unavailable' },
  ],
});
export const assetExecutionActions = { complete, unable };

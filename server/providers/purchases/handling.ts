import {
  defineApprovalAction,
  offered,
  type StagePolicy,
  type StageOutputs,
} from '@nocobase/app-plugin-approval/server';
import { z } from 'zod';
export const PricedInput = z
  .object({
    actualCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    selectedVendorId: z.string().min(1).max(64),
    quotes: z
      .array(
        z
          .object({
            vendorId: z.string().min(1).max(64),
            attachmentIds: z.array(z.string().min(1).max(64)).min(1).max(10),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();
export const purchaseHandlingOutputs: StageOutputs = {
  fields: {
    ...PricedInput.shape,
    handlingFailureReason: z.string().trim().min(1).max(5000),
  },
  writes: {
    actualCents: 'actualCents',
    selectedVendorId: 'selectedVendorId',
    quotes: 'quotes',
    handlingFailureReason: 'handlingFailureReason',
  },
};
export const purchaseHandlingPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.purchasePricing',
  outcomes: () => [{ exit: 'priced' }, { exit: 'unavailable' }],
  answers: () => ['priced', 'unavailable'],
  plan: ({ places }) =>
    places.map((p) => ({ placeKey: p.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const result = tasks.find(
      (t) =>
        t.status === 'completed' &&
        ['priced', 'unavailable'].includes(t.answer ?? ''),
    );
    return result
      ? { kind: 'closed', result: { exit: result.answer! } }
      : { kind: 'open' };
  },
};
const guards = [
  'runOpen',
  'stayCurrent',
  'taskOpen',
  'actionable',
  'contentCurrent',
  'activeActor',
] as const;
export const purchaseHandlingActions = {
  complete: defineApprovalAction<
    z.infer<typeof PricedInput>,
    Record<string, never>
  >({
    name: 'complete',
    scope: 'task',
    actors: ['assignee', 'delegate'],
    guards,
    defaults: {},
    presentation: { primary: true },
    record: ['actualCents', 'selectedVendorId', 'quotes'],
    available: () => offered(),
    validate: (input) =>
      PricedInput.safeParse(input).success
        ? null
        : 'Provide a positive exact price, active vendor and quote evidence.',
    plan: (input, { task }) => [
      {
        type: 'answer',
        task: task!.id,
        answer: 'priced',
        data: { ...input },
      },
    ],
  }),
  unable: defineApprovalAction<Record<string, never>, Record<string, never>>({
    name: 'unable',
    scope: 'task',
    actors: ['assignee', 'delegate'],
    guards,
    defaults: {},
    reason: true,
    presentation: { tone: 'danger' },
    available: () => offered(),
    plan: (_input, { task, comment }) => [
      {
        type: 'answer',
        task: task!.id,
        answer: 'unavailable',
        data: { handlingFailureReason: comment! },
      },
    ],
  }),
  forceComplete: defineApprovalAction<
    Partial<z.infer<typeof PricedInput>>,
    Record<string, never>
  >({
    name: 'forceComplete',
    scope: 'run',
    actors: ['admin'],
    guards: ['runOpen', 'contentCurrent'],
    defaults: {},
    reason: true,
    presentation: { tone: 'danger' },
    record: ['actualCents', 'selectedVendorId', 'quotes'],
    outcomes: () => [{ exit: 'forcedPriced' }, { exit: 'forcedClosed' }],
    available: () => offered(),
    validate: (input) =>
      Object.keys(input).length && !PricedInput.safeParse(input).success
        ? 'Provide the complete price/vendor/evidence result, or leave every result field empty to close without an order.'
        : null,
    plan: (input, { comment }) => [
      {
        type: 'conclude',
        result: {
          exit: Object.keys(input).length ? 'forcedPriced' : 'forcedClosed',
        },
        input: { ...input, reason: comment! },
      },
    ],
  }),
};

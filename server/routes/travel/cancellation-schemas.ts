import { z } from 'zod';
export const TravelCancellationInput = z.strictObject({
  sourceId: z.string().min(1).max(64),
  reason: z.string().trim().min(1).max(10000),
});
export const CreateTravelCancellation = TravelCancellationInput.safeExtend({
  applicantId: z.string().min(1).optional(),
});
export const TravelCancellationParams = z.strictObject({
  id: z.string().min(1).max(64),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const TransitionInput = z.strictObject({
  transition: z.enum([
    'edit',
    'submit',
    'withdraw',
    'terminate',
    'retryUnbooking',
  ]),
  version: z.number().int().nonnegative(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
export const ActionInput = z.strictObject({
  target: z.union([
    z.strictObject({ taskId: z.string().min(1) }),
    z.strictObject({ runId: z.string().min(1) }),
  ]),
  action: z.string().min(1),
  input: z.record(z.string(), z.json()).optional(),
  comment: z.string().max(10000).optional(),
  contentHash: z.string().optional(),
  requestId: z.string().min(1).max(128),
});
export const CandidatesQuery = z.strictObject({
  taskId: z.string().min(1),
  action: z.enum(['transfer', 'addSigner']),
  search: z.string().max(255).default(''),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const User = z.strictObject({ id: z.string(), name: z.string() });
export const CandidatesResult = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});
export const TravelCancellationRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  sourceId: z.string(),
  needsUnbooking: z.boolean(),
  unbookingInformation: z.string().nullable(),
  exceptionReason: z.string().nullable(),
  baseline: z.string().nullable(),
  reason: z.string(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  managerApproverId: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  record: TravelCancellationRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  TravelCancellationRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    managerApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: TravelCancellationRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});
export const ActionResult = z.json();

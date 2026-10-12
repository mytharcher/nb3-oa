import { z } from 'zod';
const subject = z.string().trim().min(1).max(128);
export const ExpensePlanInput = z.strictObject({
  matterType: z.string().min(1).max(128),
  reason: z.string().trim().min(1).max(10000),
  amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  subject,
  participants: z.number().int().min(1).max(100000),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const CreateExpensePlan = ExpensePlanInput.safeExtend({
  applicantId: z.string().min(1).max(64).optional(),
});
export const ExpensePlanParams = z.strictObject({
  id: z.string().min(1).max(64),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const TransitionInput = z.strictObject({
  transition: z.enum(['edit', 'submit', 'withdraw', 'terminate']),
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

export const ExpensePlanRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  departmentId: z.string().nullable(),
  year: z.number().int().nullable(),
  subject: z.string(),
  matterType: z.string(),
  participants: z.number().int(),
  eventDate: z.string(),
  executiveApproverId: z.string().nullable(),
  gmApproverId: z.string().nullable(),
  gmMerged: z.json().nullable(),
  authorizationId: z.string().nullable(),
  amountCents: z.number().int().safe(),
  heldCents: z.number().int().nonnegative().safe(),
  reason: z.string(),
  heldAccount: z
    .strictObject({
      departmentId: z.string(),
      year: z.number(),
      subject: z.string(),
    })
    .nullable(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  headApproverId: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  timeZone: z.string(),
  department: z.strictObject({ id: z.string(), title: z.string() }).nullable(),
  authorization: z.json().nullable(),
  record: ExpensePlanRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  ExpensePlanRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    headApprover: User.nullable(),
    executiveApprover: User.nullable(),
    gmApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: ExpensePlanRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});

export const ActionResult = z.json();

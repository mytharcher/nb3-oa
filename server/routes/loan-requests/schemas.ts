import { z } from 'zod';
export const LoanRequestInput = z.strictObject({
  reason: z.string().trim().min(1).max(10000),
  amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelId: z.string().min(1).max(64).nullable().default(null),
});
export const CreateLoanRequest = LoanRequestInput.safeExtend({
  requestId: z.string().min(1).max(128).optional(),
  applicantId: z.string().min(1).max(64).optional(),
});
export const LoanRequestParams = z.strictObject({
  id: z.string().min(1).max(64),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
  page: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).default(''),
  status: z.string().max(32).optional(),
  sort: z
    .enum(['createdAt', 'number', 'amountCents', 'dueDate'])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export const TransitionInput = z.strictObject({
  transition: z.enum(['edit', 'submit', 'withdraw', 'terminate', 'retryCash']),
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
export const CandidatesQuery = z
  .strictObject({
    taskId: z.string().min(1).optional(),
    runId: z.string().min(1).optional(),
    action: z.enum(['transfer', 'addSigner', 'cc', 'appoint', 'reassign']),
    search: z.string().max(255).default(''),
    offset: z.coerce.number().int().nonnegative().default(0),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((value) => Boolean(value.taskId) !== Boolean(value.runId), {
    message: 'Choose exactly one approval target.',
  })
  .refine(
    (value) =>
      ['cc', 'appoint'].includes(value.action)
        ? Boolean(value.runId)
        : Boolean(value.taskId),
    { message: 'This action requires its matching task or run target.' },
  );
const User = z.strictObject({ id: z.string(), name: z.string() });
export const CandidatesResult = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});

export const LoanRequestRecord = z.object({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  reason: z.string(),
  amountCents: z.number().int().safe(),
  dueDate: z.string(),
  travelId: z.string().nullable(),
  departmentId: z.string().nullable(),
  ruleSnapshot: z.json().nullable(),
  quotaSnapshot: z.json().nullable(),
  managerApproverId: z.string().nullable(),
  headApproverId: z.string().nullable(),
  executiveApproverId: z.string().nullable(),
  gmApproverId: z.string().nullable(),
  gmMerged: z.json().nullable(),
  heldCents: z.number().int().safe(),
  paymentAccount: z.null(),
  paymentVoucher: z.string().nullable(),
  approvalGrantedAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  returnDueDate: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  travelName: z.string().nullable(),
  timeZone: z.string(),
  department: z.strictObject({ id: z.string(), title: z.string() }).nullable(),
  loan: z.json().nullable(),
  record: LoanRequestRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  LoanRequestRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    headApprover: User.nullable(),
    executiveApprover: User.nullable(),
    gmApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: LoanRequestRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});

export const ActionResult = z.json();

export const RepaymentInput = z
  .strictObject({
    operation: z.enum(['record', 'confirm', 'cancel']),
    receiptId: z.string().trim().min(1).max(128),
    cents: z.number().int().positive().safe().optional(),
    reason: z.string().trim().min(1).max(10000),
    requestKey: z.string().min(1).max(128),
  })
  .superRefine((v, ctx) => {
    if (v.operation === 'record' && v.cents === undefined)
      ctx.addIssue({
        code: 'custom',
        path: ['cents'],
        message: 'Amount is required.',
      });
  });

import { z } from 'zod';
import { isLocalDate } from '../../providers/platform/time-zone.js';
export const ReimbursementInput = z.strictObject({
  reason: z.string().max(10000),
  authorizationId: z.string().min(1).max(64).nullable(),
  loanId: z.string().min(1).max(64).nullable(),
  offsetCents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  overrunReason: z.string().max(10000),
  lines: z
    .array(
      z.strictObject({
        id: z.string().min(1).max(64),
        category: z.string().min(1).max(64),
        date: z.string().refine(isLocalDate),
        amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        invoiceNumber: z.string().trim().min(1).max(128),
        attachmentIds: z.array(z.string().min(1).max(64)).min(1),
        standardExceptionReason: z.string().max(10000),
      }),
    )
    .max(200),
});
export const CreateReimbursement = ReimbursementInput.safeExtend({
  requestId: z.string().min(1).max(128).optional(),
  applicantId: z.string().min(1).max(64).optional(),
});
export const ReimbursementParams = z.strictObject({
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
    'retryCash',
    'retryCashAsAdmin',
    'forcePayException',
    'reviseBusiness',
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

export const ReimbursementRecord = ReimbursementInput.extend({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  bindingCaptured: z.boolean(),
  boundAuthorizationId: z.string().nullable(),
  boundLoanId: z.string().nullable(),
  debtHeldCents: z.number().int().safe(),
  debtHoldRecorded: z.boolean(),
  totalCents: z.number().int().safe(),
  lastSubmittedTotalCents: z.number().int().safe().nullable(),
  departmentId: z.string().nullable(),
  managerId: z.string().nullable(),
  headId: z.string().nullable(),
  accountantId: z.string().nullable(),
  executiveId: z.string().nullable(),
  gmId: z.string().nullable(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  standardSnapshot: z.record(z.string(), z.json()).nullable(),
  managerReviewBasis: z.json().nullable(),
  headReviewBasis: z.json().nullable(),
  financeLineFacts: z.record(z.string(), z.json()),
  financeCorrectionLines: ReimbursementInput.shape.lines,
  exceptionContentHash: z.string().nullable(),
  handlingFailureReason: z.string().nullable(),
  voucherNumber: z.string().nullable(),
  paymentId: z.string().nullable(),
  forcedReason: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  timeZone: z.string(),
  record: ReimbursementRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  ReimbursementRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    headApprover: User.nullable(),
    executiveApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: ReimbursementRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});

export const ActionResult = z.json();

export const PaymentAccount = z
  .strictObject({
    requestId: z.string(),
    bankName: z.string().nullable(),
    bankAccount: z.string().nullable(),
    bankAccountName: z.string().nullable(),
    version: z.number().int(),
  })
  .nullable();
export const CorrectPaymentAccount = z.strictObject({
  version: z.number().int().nonnegative(),
  payeeVersion: z.number().int().nonnegative(),
  account: z.strictObject({
    bankName: z.string().trim().min(1).max(128),
    bankAccount: z.string().trim().min(1).max(64),
    bankAccountName: z.string().trim().min(1).max(128),
  }),
});

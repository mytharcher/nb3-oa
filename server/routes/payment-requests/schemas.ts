import { z } from 'zod';
import { paymentRequestInputSchema } from '../../providers/payment-requests/service.js';
export const PaymentRequestInput = paymentRequestInputSchema;
export const CreatePaymentRequest = PaymentRequestInput.safeExtend({
  applicantId: z.string().min(1).max(64).optional(),
  requestId: z.string().min(1).max(128).optional(),
});
export const Params = z.strictObject({ id: z.string().min(1).max(64) });
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const OptionsQuery = z.strictObject({
  applicantId: z.string().min(1).max(64).optional(),
  recordId: z.string().min(1).max(64).optional(),
});
export const TransitionInput = z.strictObject({
  transition: z.enum([
    'edit',
    'submit',
    'withdraw',
    'terminate',
    'retryCash',
    'reviseBusiness',
    'retryCashAsAdmin',
    'forcePayException',
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
  .refine((v) => Boolean(v.taskId) !== Boolean(v.runId), {
    message: 'Choose exactly one approval target.',
  })
  .refine(
    (v) =>
      ['cc', 'appoint'].includes(v.action)
        ? Boolean(v.runId)
        : Boolean(v.taskId),
    {
      message: 'Choose the matching task or run target.',
    },
  );
export const Payee = z.strictObject({
  requestId: z.string(),
  bankName: z.string(),
  bankAccount: z.string(),
  bankAccountName: z.string(),
  version: z.number().int(),
});
export const CorrectPayee = z.strictObject({
  lifecycleVersion: z.number().int().nonnegative(),
  payeeVersion: z.number().int().positive(),
  reason: z.string().trim().min(1).max(4000),
  account: z.strictObject({
    bankName: z.string().trim().min(1).max(255),
    bankAccount: z.string().trim().min(1).max(255),
    bankAccountName: z.string().trim().min(1).max(255),
  }),
});
export const Record = PaymentRequestInput.safeExtend({
  id: z.string(),
  applicantId: z.string(),
  applicant: z.strictObject({ id: z.string(), name: z.string() }).optional(),
  creator: z.strictObject({ id: z.string(), name: z.string() }).optional(),
  createdById: z.string(),
  number: z.string().nullable(),
  departmentId: z.string().nullable(),
  sourceOrderId: z.string().nullable(),
  sourceContractId: z.string().nullable(),
  sourceContractVersion: z.number().int().nullable(),
  sourceHeldCents: z.number().int(),
  sourceApprovedCents: z.number().int().nullable(),
  sourceCumulativeCents: z.number().int().nullable(),
  vendorSnapshot: z.json().nullable(),
  fullApprovalRequired: z.boolean(),
  ruleSnapshot: z.json().nullable(),
  headApproverId: z.string().nullable(),
  executiveApproverId: z.string().nullable(),
  gmApproverId: z.string().nullable(),
  headApprovedAt: z.string().nullable(),
  financeApprovedAt: z.string().nullable(),
  executiveApprovedAt: z.string().nullable(),
  gmApprovedAt: z.string().nullable(),
  gmMerged: z.json().nullable(),
  approvalGrantedAt: z.string().nullable(),
  voucherNumber: z.string().nullable(),
  voucherAttachments: z.array(z.string()),
  paidAt: z.string().nullable(),
  paymentId: z.string().nullable(),
  exceptionContentHash: z.string().nullable(),
  handlingFailureReason: z.string().nullable(),
  forcedReason: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
}).meta({ ref: 'PaymentRequestRecord' });
export const Result = z.object({
  record: Record,
  entry: z.json().nullable(),
  effectRuns: z.array(z.json()),
});
export const Detail = z.object({
  contractName: z.string().nullable(),
  record: Record,
  users: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.array(z.json()),
  upcoming: z.array(z.json()),
  timeline: z.array(z.json()),
});
export const CandidatesResult = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nullable(),
});

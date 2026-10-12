import { quantityText } from '../../providers/purchases/money.js';
import { z } from 'zod';
const subject = z.string().trim().min(1).max(128);
const PurchaseItem = z.strictObject({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(255),
  specification: z.string().max(2000),
  quantity: z
    .string()
    .min(1)
    .max(64)
    .refine(
      (value) => quantityText(value) === value,
      'Use a positive canonical decimal quantity.',
    ),
  unit: z.string().trim().min(1).max(64),
});
export const PurchaseInput = z.strictObject({
  items: z.array(PurchaseItem).min(1).max(100),
  subject,
  estimatedCents: z.number().int().positive().safe(),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  suggestedVendorId: z.string().min(1).max(64).nullable(),
  purpose: z.string().trim().min(1).max(10000),
});
export const CreatePurchase = PurchaseInput;
export const PurchaseParams = z.strictObject({
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
const CandidatePaging = {
  search: z.string().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
export const CandidatesQuery = z.union([
  z.strictObject({
    taskId: z.string().min(1),
    action: z.enum(['transfer', 'addSigner']),
    ...CandidatePaging,
  }),
  z.strictObject({
    runId: z.string().min(1),
    action: z.literal('cc'),
    ...CandidatePaging,
  }),
]);
const User = z.strictObject({ id: z.string(), name: z.string() });
export const CandidatesResult = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});

export const PurchaseRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  items: z.array(PurchaseItem),
  subject: z.string(),
  estimatedCents: z.number().int().safe(),
  expectedDate: z.string(),
  suggestedVendorId: z.string().nullable(),
  purpose: z.string(),
  actualCents: z.number().int().safe().nullable(),
  selectedVendorId: z.string().nullable(),
  quotes: z.array(
    z.strictObject({
      vendorId: z.string(),
      attachmentIds: z.array(z.string()),
    }),
  ),
  departmentId: z.string().nullable(),
  year: z.number().int().nullable(),
  heldAccount: z
    .strictObject({
      departmentId: z.string(),
      year: z.number().int(),
      subject: z.string(),
    })
    .nullable(),
  heldCents: z.number().int().nonnegative().safe(),
  headApproverId: z.string().nullable(),
  executiveApproverId: z.string().nullable(),
  gmApproverId: z.string().nullable(),
  gmMerged: z.json().nullable(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  handlingFailureReason: z.string().nullable(),
  approvedFingerprint: z.string().nullable(),
  financeEntered: z.boolean(),
  priceConfirmationRequired: z.boolean(),
  handlingForced: z.boolean(),
  handlingActorId: z.string().nullable(),
  orderId: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  quoteBasisHash: z.string(),
  timeZone: z.string(),
  department: z.strictObject({ id: z.string(), title: z.string() }).nullable(),
  order: z.json().nullable(),
  record: PurchaseRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  PurchaseRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    handlingActor: User.nullable(),
    headApprover: User.nullable(),
    executiveApprover: User.nullable(),
    gmApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: PurchaseRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});

export const ActionResult = z.json();

import { z } from 'zod';
import { vendorQualificationInputSchema } from '../../providers/vendor-qualification/validation.js';
export const Params = z.object({ id: z.uuid() });
export const Create = z.strictObject({
  requestId: z.string().min(1).max(128),
  input: vendorQualificationInputSchema,
});
export const ListQuery = z.object({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.string().max(64).optional(),
  sort: z.enum(['createdAt', 'number', 'name']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export const Transition = z.strictObject({
  name: z.enum(['edit', 'submit', 'withdraw', 'terminate', 'restartReview']),
  version: z.number().int().positive(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
export const Target = z.union([
  z.strictObject({ runId: z.string().min(1) }),
  z.strictObject({ taskId: z.string().min(1) }),
]);
export const Action = z.strictObject({
  target: Target,
  action: z.enum([
    'approve',
    'reject',
    'return',
    'comment',
    'read',
    'abstain',
    'appoint',
    'reassign',
  ]),
  contentHash: z.string().optional(),
  input: z.record(z.string(), z.json()).optional(),
  comment: z.string().max(4000).optional(),
  requestId: z.string().min(1).max(128).optional(),
});
export const CandidatesQuery = z
  .object({
    action: z.enum(['appoint', 'reassign']),
    runId: z.string().optional(),
    taskId: z.string().optional(),
    search: z.string().max(255).optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (v) => !!v.runId !== !!v.taskId,
    'Choose exactly one approval target.',
  )
  .refine(
    (v) => (v.action === 'appoint' ? !!v.runId : !!v.taskId),
    'Choose the action’s native target scope.',
  );
export const BankUpdate = z.strictObject({
  lifecycleVersion: z.number().int().positive(),
  bankVersion: z.number().int().positive(),
  reason: z.string().trim().min(1).max(4000),
  account: z.strictObject({
    bankName: z.string().max(255),
    bankAccount: z.string().max(255),
    bankAccountName: z.string().max(255),
  }),
});
const Seat = z.strictObject({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/),
  source: z.enum([
    'purchasing',
    'finance',
    'applicantHead',
    'technical',
    'legal',
  ]),
  veto: z.boolean(),
});
export const Publish = z.strictObject({
  version: z.number().int().positive(),
  min: z.number().int().positive().max(32),
  settle: z.literal('veto'),
  seats: z.array(Seat).min(3).max(32),
  reason: z.string().trim().min(1).max(4000),
});
export const Assignment = z.strictObject({
  committeeVersion: z.number().int().positive(),
  seatKey: z.string().max(64),
  personId: z.uuid().nullable(),
  expectedVersion: z.number().int().min(0),
  reason: z.string().trim().min(1).max(4000),
});
export const RemovalHead = Assignment.omit({
  committeeVersion: true,
  seatKey: true,
});
export const Record = vendorQualificationInputSchema.extend({
  id: z.uuid(),
  applicantId: z.string(),
  createdById: z.string(),
  departmentId: z.string().nullable(),
  number: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  sourceVendorVersion: z.number().int().nullable(),
  committeeVersion: z.number().int().nullable(),
  committeeSnapshot: z.json().nullable(),
  ruleSnapshot: z.record(z.string(), z.json()),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const ListMeta = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  timeZone: z.string(),
});

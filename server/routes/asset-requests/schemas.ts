import { z } from 'zod';
import {
  assetRequestInputSchema,
  assetUnitsSchema,
} from '../../providers/asset-requests/validation.js';
export const Params = z.strictObject({ id: z.string().min(1).max(64) });
const requestId = z.string().min(1).max(128);
export const CreateInput = assetRequestInputSchema
  .extend({ requestId })
  .strict();
export const EditInput = assetRequestInputSchema
  .extend({ requestId, lifecycleVersion: z.number().int().nonnegative() })
  .strict();
export const LifecycleInput = z.strictObject({
  action: z.enum(['submit', 'withdraw', 'terminate']),
  requestId,
  lifecycleVersion: z.number().int().nonnegative(),
  comment: z.string().max(5000).optional(),
});
export const ActionInput = z.strictObject({
  target: z.union([
    z.strictObject({ taskId: z.string().min(1).max(128) }),
    z.strictObject({ runId: z.string().min(1).max(128) }),
  ]),
  action: z.string().min(1).max(64),
  input: z.record(z.string(), z.json()).optional(),
  comment: z.string().max(5000).optional(),
  contentHash: z.string().max(256).optional(),
  requestId,
});
export const ReturnInput = z.strictObject({
  units: assetUnitsSchema,
  reason: z.string().trim().min(1).max(5000),
  requestId,
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  operation: z.enum(['use', 'borrow', 'scrap']).optional(),
  status: z.string().max(64).optional(),
  sortBy: z
    .enum(['number', 'quantity', 'borrowDueDate', 'updatedAt'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export const CandidatesQuery = z.strictObject({
  targetId: z.string().min(1).max(128),
  action: z.enum([
    'transfer',
    'addSigner',
    'assign',
    'appoint',
    'cc',
    'reassign',
  ]),
  search: z.string().max(255).default(''),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const User = z.strictObject({ id: z.string(), name: z.string() });
const timestamp = z.union([z.string(), z.date()]);
export const RecordSchema = assetRequestInputSchema
  .extend({
    id: z.string(),
    applicantId: z.string(),
    createdById: z.string(),
    employeeId: z.string().nullable(),
    departmentId: z.string().nullable(),
    headApproverId: z.string().nullable(),
    issuedById: z.string().nullable(),
    number: z.string().nullable(),
    allocation: z
      .array(
        z.strictObject({
          id: z.string(),
          code: z.string(),
          category: z.string(),
          serialNumber: z.string().nullable(),
          status: z.string(),
          holderEmployeeId: z.string().nullable(),
          version: z.number().int(),
        }),
      )
      .nullable(),
    originalValueCents: z.number().int().nonnegative().nullable(),
    needsGm: z.boolean(),
    appraisalOpinion: z.string().nullable(),
    handlingUnits: assetUnitsSchema.nullable(),
    handlingReason: z.string().nullable(),
    exceptionReason: z.string().nullable(),
    status: z.string(),
    lifecycleVersion: z.number().int(),
    statusChangedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    applicant: User,
    createdBy: User,
  })
  .partial();
export const DetailSchema = z.strictObject({
  record: RecordSchema,
  users: z.array(User),
  timeZone: z.string(),
  view: z.json(),
  runs: z.json(),
  taskActions: z.json(),
  runActions: z.json(),
  upcoming: z.json(),
  timeline: z.json(),
});
export const CandidatesSchema = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});
export const ValueSchema = z.strictObject({
  originalValueCents: z.number().int().nonnegative().nullable(),
});
export const ListMeta = z.strictObject({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export const OptionsSchema = z.strictObject({
  employee: z
    .strictObject({ id: z.string(), name: z.string(), status: z.string() })
    .nullable(),
  department: z.strictObject({ id: z.string(), name: z.string() }).nullable(),
  head: User.nullable(),
  administrative: z.boolean(),
  eligible: z.boolean(),
  eligibleReason: z.enum(['employeeMissing', 'inactive', 'status']).nullable(),
  categories: z.array(z.strictObject({ code: z.string(), title: z.string() })),
  timeZone: z.string(),
});

export const EligibleAssetsQuery = z
  .strictObject({
    purpose: z.enum(['scrap', 'issue', 'receive']),
    mode: z.enum(['task', 'returnIssued']).default('task'),
    requestId: z.string().min(1).max(64).optional(),
    targetId: z.string().min(1).max(128).optional(),
    search: z.string().max(255).default(''),
    category: z.string().min(1).max(64).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((q) =>
    q.purpose === 'scrap'
      ? q.mode === 'task' && !q.targetId
      : !!q.requestId &&
        (q.mode === 'returnIssued'
          ? q.purpose === 'receive' && !q.targetId
          : !!q.targetId),
  );
export const EligibleAssetSchema = z.strictObject({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  category: z.string(),
  serialNumber: z.string().nullable(),
  status: z.enum(['available', 'assigned', 'borrowed', 'scrapped']),
  version: z.number().int(),
});

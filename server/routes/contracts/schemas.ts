import { z } from 'zod';
import { createContractSchema } from '../../providers/contracts/validation.js';
export const Params = z.object({ id: z.string().uuid() });
export const Create = z.strictObject({
  requestId: z.string().min(1).max(128),
  input: createContractSchema,
});
export const ListQuery = z.object({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z
    .enum([
      'draft',
      'revision',
      'head',
      'legalFinance',
      'standardFinance',
      'executive',
      'gm',
      'approved',
      'rejected',
      'withdrawn',
      'terminated',
    ])
    .optional(),
  sort: z.enum(['createdAt', 'number', 'amountCents']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export const LedgerQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(['activePendingSeal', 'active', 'terminated']).optional(),
  sort: z.enum(['updatedAt', 'number', 'amountCents']).default('updatedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export const Transition = z.strictObject({
  name: z.enum(['edit', 'submit', 'withdraw', 'terminate']),
  version: z.number().int().positive(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
export const Target = z.union([
  z.strictObject({ taskId: z.string().min(1) }),
  z.strictObject({ runId: z.string().min(1) }),
]);
export const Action = z.strictObject({
  target: Target,
  action: z.enum([
    'approve',
    'reject',
    'return',
    'claim',
    'comment',
    'read',
    'transfer',
    'addSigner',
    'urge',
    'appoint',
    'reassign',
  ]),
  contentHash: z.string().min(1),
  input: z.record(z.string(), z.json()).default({}),
  comment: z.string().max(5000).optional(),
  requestId: z.string().min(1).max(128),
});
export const Candidates = z
  .object({
    action: z.enum(['transfer', 'addSigner', 'appoint', 'reassign']),
    taskId: z.string().optional(),
    runId: z.string().optional(),
    search: z.string().max(255).optional(),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((v) => !!v.taskId !== !!v.runId)
  .refine((v) => (v.action === 'appoint' ? !!v.runId : !!v.taskId));
export const AppendText = z.strictObject({
  fileId: z.string().uuid(),
  requestId: z.string().min(1).max(128),
});
export const Rebase = z.strictObject({
  version: z.number().int().positive(),
  requestId: z.string().min(1).max(128),
});
export const Record = z
  .object({
    id: z.string(),
    applicantId: z.string(),
    creatorId: z.string(),
    operation: z.enum(['new', 'change', 'renew', 'terminate']),
    contractId: z.string(),
    baseVersion: z.number().int(),
    amountCents: z.number().int(),
    status: z.string(),
    lifecycleVersion: z.number().int(),
  })
  .passthrough();
export const ListMeta = z.object({
  timeZone: z.string().optional(),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export const Data = z.record(z.string(), z.json());

export const SelectedText = z.strictObject({
  textVersion: z
    .strictObject({
      id: z.string().uuid(),
      requestId: z.string(),
      fileId: z.string().uuid(),
      version: z.number().int().positive(),
    })
    .nullable(),
});

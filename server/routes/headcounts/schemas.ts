import { z } from 'zod';
import { headcountSortFields } from '../../providers/headcounts/contract.js';
const Id = z.string().min(1).max(64),
  Count = z.number().int().min(0).max(1000000),
  DateTime = z
    .union([z.string(), z.date()])
    .transform((v) => new Date(v).toISOString());
export const Params = z.object({ accountId: Id });
export const Command = z.object({
  requestKey: z.string().min(1).max(128),
  reason: z.string().trim().min(1).max(5000),
});
export const CreateInput = Command.extend({
  departmentId: Id,
  positionId: Id,
  year: z.number().int().min(1900).max(9999),
  limit: Count,
}).strict();
export const ReconcileInput = Command.extend({
  expectedVersion: z.number().int().min(1),
  employeeIds: z.array(Id).max(1000000),
}).strict();
export const AdjustInput = Command.extend({
  expectedVersion: z.number().int().min(1),
  limit: Count,
}).strict();
export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(headcountSortFields).default('updatedAt'),
  desc: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  departmentId: Id.optional(),
  positionId: Id.optional(),
  year: z.coerce.number().int().min(1900).max(9999).optional(),
});
export const Identity = z.object({ id: Id, name: z.string() });
export const CreateOptionsQuery = z.object({
  year: z.coerce.number().int().min(1900).max(9999).optional(),
  limit: z.coerce.number().int().min(0).max(1000000).default(0),
});
export const CreateOptions = z.object({
  year: z.number(),
  targets: z.array(z.object({ department: Identity, position: Identity })),
});
export const RosterPreview = z.object({
  version: z.number(),
  initialized: z.boolean(),
  employees: z.array(
    z.object({
      id: Id,
      name: z.string(),
      status: z.enum(['probation', 'regular', 'leaving']),
    }),
  ),
});
export const BalanceSchema = z.object({
  id: Id,
  departmentId: Id,
  positionId: Id,
  year: z.number(),
  limit: Count,
  initialized: z.boolean(),
  version: z.number(),
  used: Count,
  pending: Count,
  allocated: Count,
  replacementPending: Count,
  replacementAllocated: Count,
  replacementBlocked: Count,
  available: z.number().int(),
  createdAt: DateTime,
  updatedAt: DateTime,
});
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const JournalSchema = z.object({
  id: Id,
  accountId: Id,
  departmentId: Id,
  action: z.string(),
  sourceReference: z.string().nullable(),
  actorId: Id,
  actor: z.object({ id: Id, name: z.string() }),
  reason: z.string(),
  evidence: z.unknown(),
  sourceLink: z
    .object({ kind: z.string(), id: Id, path: z.string() })
    .nullable(),
  at: DateTime,
});

export const BalanceView = BalanceSchema.extend({
  department: Identity.nullable(),
  position: Identity.nullable(),
});

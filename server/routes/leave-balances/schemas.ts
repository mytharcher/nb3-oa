import { z } from 'zod';
export const BalanceSchema = z.object({
  employeeId: z.string(),
  leaveType: z.string(),
  availableUnits: z.number().int(),
  heldUnits: z.number().int(),
});
export const LedgerSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  leaveType: z.string(),
  kind: z.enum(['grant', 'hold', 'deduct', 'release', 'expire', 'refund']),
  requestKey: z.string(),
  reference: z.string(),
  lotId: z.string(),
  availableDelta: z.number().int(),
  heldDelta: z.number().int(),
  expiresAt: z.iso.datetime().nullable(),
  at: z.iso.datetime(),
  actorId: z.string().nullable(),
  actor: z.object({ id: z.string(), name: z.string() }).nullable(),
  reason: z.string().nullable(),
});
export const EmployeeParams = z.object({
  employeeId: z.string().min(1).max(64),
});
export const LedgerQuery = z.object({
  leaveType: z.string().min(1).max(64),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['at', 'availableDelta', 'heldDelta']).default('at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});
export const AdjustmentInput = z.object({
  leaveType: z.string().min(1).max(64),
  units: z
    .number()
    .int()
    .min(-2_000_000_000)
    .max(2_000_000_000)
    .refine((n) => n !== 0),
  requestKey: z.string().min(1).max(255),
  reference: z.string().min(1).max(255),
  reason: z.string().trim().min(1).max(2000),
  expiresAt: z.iso.datetime().nullable().optional(),
});

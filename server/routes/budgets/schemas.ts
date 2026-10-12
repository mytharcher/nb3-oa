import { z } from 'zod';
import { parseBudgetAmount } from '../../providers/budgets/money.js';
export const BudgetSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  year: z.number().int(),
  subject: z.string(),
  allocatedCents: z.number().int(),
  heldCents: z.number().int(),
  usedCents: z.number().int(),
  availableCents: z.number().int(),
  department: z.object({ id: z.string(), title: z.string() }),
  subjectLabel: z.record(z.string(), z.string()),
});
export const LedgerSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  kind: z.string(),
  reference: z.string(),
  requestKey: z.string(),
  allocatedDelta: z.number().int(),
  heldDelta: z.number().int(),
  usedDelta: z.number().int(),
  actorId: z.string(),
  actor: z.object({ id: z.string(), name: z.string() }),
  reason: z.string(),
  at: z.iso.datetime(),
});
export const Meta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export const Params = z.strictObject({ budgetId: z.string().min(1).max(64) });
const paging = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const ListQuery = z.strictObject({
  ...paging,
  departmentId: z.string().min(1).max(64).optional(),
  year: z.coerce.number().int().min(1900).max(9999).optional(),
  subject: z.string().min(1).max(64).optional(),
  orderBy: z
    .enum([
      'year',
      'allocatedCents',
      'heldCents',
      'usedCents',
      'availableCents',
    ])
    .default('year'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export const LedgerQuery = z.strictObject({
  ...paging,
  orderBy: z
    .enum(['at', 'allocatedDelta', 'heldDelta', 'usedDelta'])
    .default('at'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
const change = {
  deltaAmount: z
    .string()
    .max(40)
    .refine((v) => {
      const n = parseBudgetAmount(v);
      return n !== undefined && n !== 0;
    }, 'budgets.invalidAmount'),
  reason: z.string().trim().min(1).max(4000),
  requestKey: z.string().min(1).max(128),
};
export const AdjustmentInput = z.strictObject(change);
export const AllocationInput = z
  .strictObject({
    ...change,
    departmentId: z.string().min(1).max(64),
    year: z.number().int().min(1900).max(9999),
    subject: z.string().min(1).max(64),
  })
  .refine((v) => (parseBudgetAmount(v.deltaAmount) ?? 0) > 0, {
    path: ['deltaAmount'],
    message: 'budgets.positiveAmount',
  });

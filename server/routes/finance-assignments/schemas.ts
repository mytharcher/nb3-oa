import { z } from 'zod';
export const Params = z.object({ assignmentId: z.string().min(1).max(64) });
export const ListQuery = z.object({
  departmentId: z.string().min(1).max(64).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const AssignmentSchema = z.object({
  id: z.string(),
  departmentId: z.string(),
  accountantId: z.string(),
  active: z.boolean(),
  version: z.number(),
  updatedAt: z.union([z.string(), z.date()]),
  department: z.object({ id: z.string(), title: z.string() }),
  accountant: z.object({ id: z.string(), name: z.string() }),
});
export const NewInput = z.object({
  departmentId: z.string().min(1).max(64),
  accountantId: z.string().min(1).max(64),
  reason: z.string().trim().min(1).max(4000),
});
export const EditInput = z
  .object({
    accountantId: z.string().min(1).max(64).optional(),
    active: z.boolean().optional(),
    version: z.number().int().min(1),
    reason: z.string().trim().min(1).max(4000),
  })
  .refine((v) => v.accountantId !== undefined || v.active !== undefined);
export const UserSchema = z.object({ id: z.string(), name: z.string() });

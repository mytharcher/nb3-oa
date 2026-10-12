import { z } from 'zod';
export const Params = z.object({ vendorId: z.string().min(1).max(64) });
export const ListQuery = z.object({
  search: z.string().max(255).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'code', 'updatedAt']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});
export const VendorInput = z
  .object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(255),
    category: z.string().trim().min(1).max(255),
    contactName: z.string().trim().max(255),
    contactPhone: z.string().trim().max(64),
    contactEmail: z.string().trim().max(255),
    bankName: z.string().trim().max(255),
    bankAccount: z.string().trim().max(128),
    bankAccountName: z.string().trim().max(255),
  })
  .strict();
export const CreateInput = VendorInput.extend({
  reason: z.string().trim().min(1).max(5000),
}).strict();
export const UpdateInput = VendorInput.partial()
  .extend({
    active: z.boolean().optional(),
    version: z.number().int().min(1),
    reason: z.string().trim().min(1).max(5000),
  })
  .strict()
  .refine(
    (v) => Object.keys(v).some((k) => !['version', 'reason'].includes(k)),
    { message: 'Change at least one field.' },
  );
export const VendorSchema = VendorInput.extend({
  id: z.string(),
  status: z.enum(['manual', 'qualified', 'disabled']),
  active: z.boolean(),
  version: z.number(),
  createdById: z.string(),
  createdBy: z.object({ id: z.string(), name: z.string() }).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
}).partial();
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

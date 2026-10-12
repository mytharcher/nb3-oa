import { z } from 'zod';
export const Params = z.object({ assetId: z.string().min(1).max(64) });
export const ListQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const AssetInput = z
  .object({
    code: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/),
    category: z.string().min(1).max(64),
    name: z.string().trim().min(1).max(200),
    serialNumber: z.string().trim().max(200).nullable(),
    originalValueCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export const CreateInput = AssetInput.extend({
  reason: z.string().trim().min(1).max(5000),
}).strict();
export const UpdateInput = AssetInput.partial()
  .extend({
    reason: z.string().trim().min(1).max(5000),
    version: z
      .number()
      .int()
      .min(1)
      .max(Number.MAX_SAFE_INTEGER - 1),
  })
  .strict()
  .refine(
    (input) =>
      Object.keys(input).some((key) => !['reason', 'version'].includes(key)),
    { message: 'Change at least one asset field.' },
  );
export const AssetSchema = AssetInput.extend({
  id: z.string(),
  status: z.enum(['available', 'assigned', 'borrowed', 'scrapped']),
  holderEmployeeId: z.string().nullable(),
  borrowDueDate: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
}).partial();
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export const ReturnHeldInput = z
  .object({
    assetId: z.string().min(1).max(64),
    holderEmployeeId: z.string().min(1).max(64),
    serialNumber: z.string().trim().min(1).max(200),
    version: z
      .number()
      .int()
      .min(1)
      .max(Number.MAX_SAFE_INTEGER - 1),
    reason: z.string().trim().min(1).max(5000),
    requestKey: z.string().min(1).max(128),
  })
  .strict();
export const ReturnHeldReceipt = z.object({ receiptId: z.string() });

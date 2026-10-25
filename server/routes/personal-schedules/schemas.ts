import { z } from 'zod';
export const Params = z.object({ id: z.uuid() }).strict();
export const Input = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(10000),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const Edit = Input.extend({
  expectedVersion: z.int().positive(),
}).strict();
export const Remove = z
  .object({ expectedVersion: z.int().positive() })
  .strict();
export const Schedule = z
  .object({
    id: z.uuid(),
    ownerUserId: z.string(),
    owner: z.object({ id: z.string(), name: z.string() }),
    title: z.string(),
    description: z.string(),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime(),
    version: z.int().positive(),
    sourceBookingId: z.string().nullable(),
  })
  .strict();

export const Interval = z
  .object({
    startAt: z.iso.datetime({ offset: true }).optional(),
    endAt: z.iso.datetime({ offset: true }).optional(),
  })
  .refine(
    (v) =>
      (!v.startAt && !v.endAt) ||
      (!!v.startAt &&
        !!v.endAt &&
        Date.parse(v.startAt) < Date.parse(v.endAt) &&
        Date.parse(v.endAt) - Date.parse(v.startAt) <= 366 * 86400000),
    { message: 'Invalid interval' },
  );

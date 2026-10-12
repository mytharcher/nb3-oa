import { z } from 'zod';
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Invalid calendar date');
export const departureCreateSchema = z
  .object({
    employeeId: z.string().min(1).optional(),
    departureType: z.string().min(1).max(64),
    reason: z.string().trim().min(1).max(10000),
    expectedLastWorkingDay: date.nullable().optional(),
    handoverUserId: z.string().min(1).nullable().optional(),
  })
  .strict();
export const departureEditSchema = departureCreateSchema.omit({
  employeeId: true,
});
export const departureHrOutputsSchema = z
  .object({ lastWorkingDay: date })
  .strict();

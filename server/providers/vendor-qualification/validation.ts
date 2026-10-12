import { z } from 'zod';
import { refuse } from './errors.js';
export const vendorQualificationInputSchema = z
  .object({
    operation: z.enum(['qualify', 'remove']),
    vendorId: z.string().uuid(),
    name: z.string().trim().max(255),
    category: z.string().trim().max(64),
    reason: z.string().trim().max(4000),
    quoteCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    cases: z.string().trim().max(10000),
    contactName: z.string().trim().max(255),
    contactPhone: z.string().trim().max(64),
    contactEmail: z.string().trim().max(255),
    attachments: z.array(z.string().uuid()).max(10),
    qualificationExpiry: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return (
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        );
      })
      .nullable(),
  })
  .strict();
export function validateQualificationSubmission(
  input: z.infer<typeof vendorQualificationInputSchema>,
  companyDate: string,
) {
  if (!input.reason)
    refuse('REASON_REQUIRED', 'A qualification or removal reason is required.');
  if (input.operation === 'remove') return;
  if (
    !input.name ||
    !input.category ||
    !input.attachments.length ||
    !input.qualificationExpiry ||
    input.qualificationExpiry <= companyDate
  )
    refuse(
      'QUALIFICATION_FACTS_REQUIRED',
      'Name, active category, linked qualification evidence and a future company-local expiry date are required.',
    );
  if (
    input.contactEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)
  )
    refuse('CONTACT_EMAIL_INVALID', 'Enter a valid contact email.');
}
export function qualificationExpiryReminderDue(
  expiry: string,
  today: string,
  thirtyDaysBefore: string,
): boolean {
  return today >= thirtyDaysBefore && today <= expiry;
}

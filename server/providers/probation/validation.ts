import { z } from 'zod';
import { isLocalDate } from '../platform/time-zone.js';
import { PROBATION_CONCLUSIONS } from './contract.js';
import type { ProbationManagerOutputs } from './contract.js';

const date = z.string().refine(isLocalDate);
export const probationManagerOutputsSchema = z
  .object({
    evaluation: z.string().trim().min(1).max(10000),
    conclusion: z.enum(PROBATION_CONCLUSIONS),
    deferredTo: date.nullable(),
  })
  .strict();
export const probationCompensationInputSchema = z
  .object({
    gradeId: z.string().min(1).max(64),
    baseSalary: z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/),
  })
  .strict();

/** Date arithmetic operates on calendar dates already resolved by CalendarService.localDate(). */
export function probationReminderDate(endDate: string): string {
  if (!isLocalDate(endDate)) throw new Error('Invalid probation end date.');
  const instant = new Date(`${endDate}T00:00:00.000Z`);
  instant.setUTCDate(instant.getUTCDate() - 14);
  return instant.toISOString().slice(0, 10);
}

/** Catch-up is deliberate: an outage must not lose the reminder. End date is exclusive. */
export function isProbationReminderDue(
  localToday: string,
  endDate: string,
): boolean {
  if (!isLocalDate(localToday)) throw new Error('Invalid company-local date.');
  return localToday >= probationReminderDate(endDate) && localToday < endDate;
}

export function validateProbationManagerOutputs(
  input: unknown,
  baselineEndDate: string,
): ProbationManagerOutputs {
  if (!isLocalDate(baselineEndDate))
    throw new Error('Invalid probation end date.');
  const outputs = probationManagerOutputsSchema.parse(input);
  if (outputs.conclusion === 'deferred') {
    if (!outputs.deferredTo || outputs.deferredTo <= baselineEndDate)
      throw new Error('Deferral must extend the submitted probation end date.');
  } else if (outputs.deferredTo !== null) {
    throw new Error('Only a deferred conclusion may specify a deferral date.');
  }
  return outputs;
}

/** Reference strings, not compensation amounts, may cross the approval SDK boundary. */
export function probationPrivateReference(proposalId: string): string {
  if (!/^[-\w]{16,64}$/.test(proposalId))
    throw new Error('Invalid private proposal id.');
  return `probation-compensation:${proposalId}`;
}

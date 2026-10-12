import { createHash } from 'node:crypto';
import type { BusinessReviewBasis } from './contract.js';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, child]) => [key, canonical(child)]),
    );
  return value;
}
/**
 * The rule expressly permits a smaller corrected expense to retain business-line opinions. A predicate alone
 * cannot override the plugin's covered-content equality check. Declare this persistent basis as that stage's
 * covers, retaining it only within the same identity and reviewed amount ceiling, without increasing the previous
 * submission. A reduction followed by an increase requires a fresh opinion even below the original ceiling.
 * Pass a previous basis only after checking its original self-made approval; an unapproved draft basis is not evidence.
 * The full frozen claim remains
 * the content used by current offered decisions. The plugin independently requires an original self-made opinion.
 */
export function reviewBasis(
  previous: BusinessReviewBasis | null,
  identity: {
    applicantId: string;
    departmentId: string;
    authorizationId: string | null;
    loanId: string | null;
    reason: string;
    ruleSnapshot: Record<string, unknown>;
  },
  totalCents: number,
  previousSubmittedTotalCents: number | null,
): BusinessReviewBasis {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0)
    throw new Error('A business review requires a positive safe claim total.');
  const identityHash = createHash('sha256')
    .update(JSON.stringify(canonical(identity)))
    .digest('hex');
  if (
    previous &&
    previous.identityHash === identityHash &&
    Number.isSafeInteger(previous.limitCents) &&
    previous.limitCents >= totalCents &&
    previousSubmittedTotalCents !== null &&
    Number.isSafeInteger(previousSubmittedTotalCents) &&
    previousSubmittedTotalCents >= totalCents
  )
    return previous;
  return { identityHash, limitCents: totalCents };
}

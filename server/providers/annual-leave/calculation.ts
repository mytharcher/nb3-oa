import {
  dayNumberOf,
  instantOfLocal,
  isLocalDate,
} from '../platform/time-zone.js';

export interface AnnualLeaveTier {
  code: string;
  minYears: number;
  days: number;
}
export interface AnnualLeavePolicy {
  enabled: boolean;
  /** Explicit business choice; hireDate alone does not establish social seniority. */
  seniorityBasis: 'companyHireDate' | 'careerStartDate';
  hireMonth: 'includeHireMonth' | 'followingMonth';
  rounding: 'floorHalfDay';
  expiryMonth: number;
  expiryDay: number;
}
export class AnnualLeaveError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function invalid(message: string): never {
  throw new AnnualLeaveError('ANNUAL_LEAVE_CONFIGURATION_INVALID', message);
}
export function validateAnnualLeavePolicy(policy: AnnualLeavePolicy): void {
  if (
    !['companyHireDate', 'careerStartDate'].includes(policy.seniorityBasis) ||
    !['includeHireMonth', 'followingMonth'].includes(policy.hireMonth) ||
    policy.rounding !== 'floorHalfDay' ||
    !Number.isInteger(policy.expiryMonth) ||
    policy.expiryMonth < 1 ||
    policy.expiryMonth > 12 ||
    !Number.isInteger(policy.expiryDay) ||
    policy.expiryDay < 1 ||
    policy.expiryDay > 31
  )
    invalid(
      'Annual leave requires an explicit seniority basis, hire month policy and valid carryover date.',
    );
}
export interface AnnualLeaveCalculation {
  year: number;
  entitlementDate: string;
  serviceYears: number;
  tierCode: string | null;
  months: number;
  units: number;
  expiresAt: Date;
}
/** The configured expiry day is inclusive; ledger expiration occurs at next local midnight. */
export function annualLeaveExpiry(
  year: number,
  policy: AnnualLeavePolicy,
  timeZone: string,
): Date {
  validateAnnualLeavePolicy(policy);
  const lastDay = new Date(
    Date.UTC(year + 1, policy.expiryMonth, 0),
  ).getUTCDate();
  const date = `${year + 1}-${String(policy.expiryMonth).padStart(2, '0')}-${String(Math.min(policy.expiryDay, lastDay)).padStart(2, '0')}`;
  return new Date(instantOfLocal(timeZone, dayNumberOf(date) + 1, 0));
}
/** As-of January 1, or hire date for a first-year grant; no implicit anniversary top-ups. */
export function calculateAnnualLeave(input: {
  year: number;
  hireDate: string;
  seniorityStartDate: string;
  tiers: readonly AnnualLeaveTier[];
  policy: AnnualLeavePolicy;
  timeZone: string;
}): AnnualLeaveCalculation {
  const { year, hireDate, seniorityStartDate, tiers, policy, timeZone } = input;
  validateAnnualLeavePolicy(policy);
  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9998 ||
    !isLocalDate(hireDate) ||
    !isLocalDate(seniorityStartDate)
  )
    invalid('Real employment and seniority dates are required.');
  if (seniorityStartDate > hireDate)
    invalid('Seniority cannot start after this employment starts.');
  if (
    policy.seniorityBasis === 'companyHireDate' &&
    seniorityStartDate !== hireDate
  )
    invalid('Company seniority must use the company hire date.');
  const january = `${year}-01-01`;
  const entitlementDate = hireDate > january ? hireDate : january;
  if (hireDate.slice(0, 4) > String(year))
    invalid('The employee has not joined in the entitlement year.');
  let serviceYears =
    Number(entitlementDate.slice(0, 4)) -
    Number(seniorityStartDate.slice(0, 4));
  if (entitlementDate.slice(5) < seniorityStartDate.slice(5)) serviceYears -= 1;
  const thresholds = new Set<number>();
  for (const tier of tiers) {
    if (
      !Number.isInteger(tier.minYears) ||
      tier.minYears < 0 ||
      !Number.isSafeInteger(tier.days * 2) ||
      tier.days < 0 ||
      thresholds.has(tier.minYears)
    )
      invalid(
        'Annual leave tiers must have distinct whole-year thresholds and half-day amounts.',
      );
    thresholds.add(tier.minYears);
  }
  if (!tiers.length)
    invalid('At least one active annual leave tier is required.');
  const tier = [...tiers]
    .sort((a, b) => b.minYears - a.minYears)
    .find((t) => t.minYears <= serviceYears);
  const firstYear = Number(hireDate.slice(0, 4)) === year;
  const months = firstYear
    ? Math.max(
        0,
        12 -
          Number(hireDate.slice(5, 7)) +
          (policy.hireMonth === 'includeHireMonth' ? 1 : 0),
      )
    : 12;
  const units = Math.floor(((tier?.days ?? 0) * 2 * months) / 12);
  if (!Number.isSafeInteger(units))
    invalid('Annual leave exceeds the supported integer range.');
  return {
    year,
    entitlementDate,
    serviceYears,
    tierCode: tier?.code ?? null,
    months,
    units,
    expiresAt: annualLeaveExpiry(year, policy, timeZone),
  };
}
export function annualLeaveLocalGrantInstant(
  date: string,
  timeZone: string,
): Date {
  if (!isLocalDate(date)) invalid('A valid entitlement date is required.');
  return new Date(instantOfLocal(timeZone, dayNumberOf(date), 0));
}

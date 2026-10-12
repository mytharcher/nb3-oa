// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  annualLeaveExpiry,
  calculateAnnualLeave,
  type AnnualLeavePolicy,
} from '../../../server/providers/annual-leave/calculation.js';
const policy: AnnualLeavePolicy = {
  enabled: true,
  seniorityBasis: 'careerStartDate',
  hireMonth: 'includeHireMonth',
  rounding: 'floorHalfDay',
  expiryMonth: 3,
  expiryDay: 31,
};
const tiers = [
  { code: 'y1', minYears: 1, days: 5 },
  { code: 'y10', minYears: 10, days: 10 },
  { code: 'y20', minYears: 20, days: 15 },
];
const input = {
  year: 2026,
  hireDate: '2020-05-01',
  seniorityStartDate: '2010-06-01',
  tiers,
  policy,
  timeZone: 'Asia/Shanghai',
};
describe('annual leave explicit seniority and monthly proration', () => {
  it('uses social seniority rather than the company hire date', () => {
    expect(calculateAnnualLeave(input)).toMatchObject({
      serviceYears: 15,
      units: 20,
      months: 12,
      tierCode: 'y10',
    });
  });
  it('includes the entire hire month and floors the result to integer half-days', () => {
    expect(
      calculateAnnualLeave({ ...input, hireDate: '2026-08-31' }),
    ).toMatchObject({ units: 8, months: 5 });
  });
  it('grants zero below the first tier instead of inventing a one-year entitlement', () => {
    expect(
      calculateAnnualLeave({
        ...input,
        hireDate: '2026-06-01',
        seniorityStartDate: '2026-01-01',
      }),
    ).toMatchObject({ units: 0, tierCode: null });
  });
  it('evaluates service thresholds on January 1 and never rounds service up', () => {
    expect(
      calculateAnnualLeave({ ...input, seniorityStartDate: '2016-01-02' }),
    ).toMatchObject({ serviceYears: 9, units: 10 });
    expect(
      calculateAnnualLeave({ ...input, seniorityStartDate: '2016-01-01' }),
    ).toMatchObject({ serviceYears: 10, units: 20 });
  });
  it('keeps March 31 usable until the next midnight in platform timezone', () => {
    expect(annualLeaveExpiry(2026, policy, 'Asia/Shanghai').toISOString()).toBe(
      '2027-03-31T16:00:00.000Z',
    );
    expect(
      annualLeaveExpiry(2026, policy, 'America/New_York').toISOString(),
    ).toBe('2027-04-01T04:00:00.000Z');
  });
  it('clamps a short month carryover day to its last real day', () => {
    expect(
      annualLeaveExpiry(
        2026,
        { ...policy, expiryMonth: 2 },
        'UTC',
      ).toISOString(),
    ).toBe('2027-03-01T00:00:00.000Z');
    expect(
      annualLeaveExpiry(
        2027,
        { ...policy, expiryMonth: 2 },
        'UTC',
      ).toISOString(),
    ).toBe('2028-03-01T00:00:00.000Z');
  });
  it('fails closed for invalid dates, tiers and unresolved policy', () => {
    expect(() =>
      calculateAnnualLeave({ ...input, seniorityStartDate: '2026-02-30' }),
    ).toThrow();
    expect(() =>
      calculateAnnualLeave({ ...input, tiers: [...tiers, tiers[0]] }),
    ).toThrow();
    expect(() =>
      calculateAnnualLeave({
        ...input,
        policy: { ...policy, seniorityBasis: 'companyHireDate' },
      }),
    ).toThrow();
    expect(() =>
      calculateAnnualLeave({ ...input, hireDate: '2027-01-01' }),
    ).toThrow();
  });
});

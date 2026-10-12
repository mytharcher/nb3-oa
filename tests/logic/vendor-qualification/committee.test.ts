import { expect, it } from 'vitest';
import {
  committeeCandidates,
  validateCommittee,
  type CommitteeVersion,
} from '../../../server/providers/vendor-qualification/committee.js';
const version: CommitteeVersion = {
  version: 1,
  min: 2,
  settle: 'veto',
  seats: [
    { key: 'purchasing', source: 'purchasing', veto: false },
    { key: 'finance', source: 'finance', veto: true },
    { key: 'department', source: 'applicantHead', veto: false },
  ],
};
it('retains missing, duplicate and applicant seats without reducing the threshold', () => {
  expect(
    committeeCandidates(
      version,
      'applicant',
      { purchasing: 'alice', finance: 'alice', department: 'applicant' },
      () => true,
    ),
  ).toEqual({ purchasing: ['alice'], finance: [], department: [] });
  expect(version.min).toBe(2);
});
it('retains an ineligible fixed seat instead of picking another role member', () => {
  expect(
    committeeCandidates(
      version,
      'applicant',
      { purchasing: 'inactive', finance: 'bob', department: 'head' },
      (id) => id !== 'inactive',
    ),
  ).toEqual({ purchasing: [], finance: ['bob'], department: ['head'] });
});
it('rejects unsupported settlement and missing finance veto, keeping the immutable source untouched', () => {
  expect(() =>
    validateCommittee({
      ...version,
      settle: 'quorum',
    } as unknown as CommitteeVersion),
  ).toThrow();
  expect(() =>
    validateCommittee({
      ...version,
      seats: version.seats.map((s) => ({ ...s, veto: false })),
    }),
  ).toThrow();
  const validated = validateCommittee(version);
  validated.seats[0].key = 'changed';
  expect(version.seats[0].key).toBe('purchasing');
});

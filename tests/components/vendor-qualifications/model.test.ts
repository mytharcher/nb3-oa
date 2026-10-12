import { decimalOf } from '../../../client/pages/vendor-qualifications/create-journal.js';
import { beforeEach, it, expect } from 'vitest';
import {
  centsOf,
  startCreate,
  loadCreate,
  clearCreate,
} from '../../../client/pages/vendor-qualifications/create-journal.js';
import { validCommittee } from '../../../client/pages/vendor-qualifications/configuration-model.js';
import {
  emptyInput,
  type Committee,
} from '../../../client/pages/vendor-qualifications/types.js';
beforeEach(() => localStorage.clear());
it('keeps cent conversion exact at the safe integer boundary and refuses rounded or exponential input', () => {
  expect(centsOf('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  for (const value of ['90071992547409.92', '1.005', '-1', '1e4', 'NaN'])
    expect(centsOf(value)).toBeNull();
  expect(centsOf('12.3')).toBe(1230);
});
it('binds persisted creation to its actor and freezes the original payload independently of live form edits', () => {
  const input = { ...emptyInput, vendorId: 'vendor', name: 'Original' };
  const first = startCreate('actor-a', input);
  input.name = 'Changed';
  expect(loadCreate('actor-a')?.input.name).toBe('Original');
  expect(loadCreate('actor-b')).toBeNull();
  expect(loadCreate('actor-a')?.requestId).toBe(first.requestId);
  clearCreate('actor-a');
  expect(loadCreate('actor-a')).toBeNull();
});
it('prevalidates immutable voting structures without lowering the threshold or removing mandatory seats', () => {
  const committee: Committee = {
    version: 2,
    min: 2,
    settle: 'veto',
    seats: [
      { key: 'purchasing', source: 'purchasing', veto: false },
      { key: 'finance', source: 'finance', veto: true },
      { key: 'department', source: 'applicantHead', veto: false },
    ],
  };
  expect(validCommittee(committee)).toBe(true);
  expect(validCommittee({ ...committee, min: 4 })).toBe(false);
  expect(
    validCommittee({
      ...committee,
      seats: committee.seats.map((s) => ({ ...s, veto: false })),
    }),
  ).toBe(false);
  expect(
    validCommittee({
      ...committee,
      seats: committee.seats.map((s) => ({ ...s, key: 'duplicate' })),
    }),
  ).toBe(false);
  expect(
    validCommittee({
      ...committee,
      seats: committee.seats.map((s) => ({
        ...s,
        key: s.key === 'finance' ? 'UpperCase' : s.key,
      })),
    }),
  ).toBe(false);
});

it('preserves all safe-integer cents when prefilling decimal input', () => {
  expect(decimalOf(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
  expect(centsOf(decimalOf(Number.MAX_SAFE_INTEGER))).toBe(
    Number.MAX_SAFE_INTEGER,
  );
});

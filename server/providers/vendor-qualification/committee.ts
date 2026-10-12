/** Immutable startup committee structure. Assignment changes do not rewrite live SDK tasks. */
export interface CommitteeSeat {
  key: string;
  source: 'purchasing' | 'finance' | 'applicantHead' | 'technical' | 'legal';
  veto: boolean;
}
export interface CommitteeVersion {
  version: number;
  min: number;
  settle: 'veto';
  seats: readonly CommitteeSeat[];
}
export function validateCommittee(value: CommitteeVersion): CommitteeVersion {
  const seats: readonly CommitteeSeat[] = value.seats;
  if (
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !Number.isSafeInteger(value.min) ||
    value.min < 1 ||
    value.settle !== 'veto' ||
    !Array.isArray(seats) ||
    seats.length < value.min ||
    seats.length > 32
  )
    throw new Error(
      'Invalid committee structure; only veto settlement is supported.',
    );
  const configuredSeats: readonly CommitteeSeat[] = value.seats;
  const keys = new Set<string>();
  const sources = new Set<string>();
  for (const seat of configuredSeats) {
    if (
      !/^[a-z][a-zA-Z0-9_-]{0,47}$/.test(seat.key) ||
      keys.has(seat.key) ||
      ![
        'purchasing',
        'finance',
        'applicantHead',
        'technical',
        'legal',
      ].includes(seat.source) ||
      typeof seat.veto !== 'boolean'
    )
      throw new Error('Invalid or duplicate committee seat.');
    keys.add(seat.key);
    sources.add(seat.source);
  }
  if (
    !['purchasing', 'finance', 'applicantHead'].every((s) => sources.has(s)) ||
    !configuredSeats.some((s) => s.source === 'finance' && s.veto)
  )
    throw new Error(
      'The purchasing, finance veto and applicant department seats are required.',
    );
  return {
    version: value.version,
    min: value.min,
    settle: value.settle,
    seats: configuredSeats.map(({ key, source, veto }) => ({
      key,
      source,
      veto,
    })),
  };
}
/** Retain every configured place, even when there is no eligible distinct person. */
export function committeeCandidates(
  version: CommitteeVersion,
  applicantId: string,
  assigned: Readonly<Record<string, string | null | undefined>>,
  eligible: (person: string, seat: CommitteeSeat) => boolean,
): Readonly<Record<string, readonly string[]>> {
  validateCommittee(version);
  const held = new Set<string>();
  return Object.fromEntries(
    version.seats.map((seat) => {
      const person = assigned[seat.key];
      if (
        !person ||
        person === applicantId ||
        held.has(person) ||
        !eligible(person, seat)
      )
        return [seat.key, []];
      held.add(person);
      return [seat.key, [person]];
    }),
  );
}

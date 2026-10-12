import { exceedsMoneyThreshold } from '../exact-money.js';

export type TravelStandardKind = 'none' | 'lodging' | 'allowance';
export interface ReimbursementTravelStandardSnapshot {
  code: string;
  gradeRank: number;
  lodgingPerNight: number;
  allowancePerDay: number;
}
export class ReimbursementTravelStandardError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly lineIds: readonly string[] = [],
  ) {
    super(message);
    this.name = 'ReimbursementTravelStandardError';
  }
}
/** Resolve active dictionary facts; missing legacy extra is explicitly non-standard, never inferred from category text. */
export function expenseCategoryStandardKinds(
  entries: readonly {
    code: string;
    active: boolean;
    extra?: Record<string, unknown> | null;
  }[],
): { code: string; standardKind: TravelStandardKind }[] {
  const seen = new Set<string>();
  return entries
    .filter((entry) => entry.active)
    .map((entry) => {
      const kind = entry.extra?.travelStandardKind ?? 'none';
      if (
        !entry.code.trim() ||
        seen.has(entry.code) ||
        typeof kind !== 'string' ||
        !['none', 'lodging', 'allowance'].includes(kind)
      )
        throw new ReimbursementTravelStandardError(
          'REIMBURSEMENT_STANDARD_CONFIGURATION',
          'Active expense category classifications must be unique and valid.',
        );
      seen.add(entry.code);
      return { code: entry.code, standardKind: kind as TravelStandardKind };
    });
}
/** Trusted category classifications and approved employee-standard facts, never browser-selected limits. */
export function validateReimbursementTravelStandards(input: {
  linkedKind: string | null;
  standard: ReimbursementTravelStandardSnapshot | null;
  categories: readonly { code: string; standardKind: TravelStandardKind }[];
  lines: readonly {
    id: string;
    category: string;
    date: string;
    amountCents: number;
    standardExceptionReason: string;
  }[];
}) {
  if (input.linkedKind !== 'oa.travel') return [];
  const categories = new Map<string, TravelStandardKind>();
  for (const category of input.categories) {
    if (
      categories.has(category.code) ||
      !['none', 'lodging', 'allowance'].includes(category.standardKind)
    )
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_STANDARD_CONFIGURATION',
        'Expense category standard classifications are invalid or ambiguous.',
      );
    categories.set(category.code, category.standardKind);
  }
  const groups = new Map<
    string,
    {
      date: string;
      kind: 'lodging' | 'allowance';
      cents: bigint;
      lines: (typeof input.lines)[number][];
    }
  >();
  for (const line of input.lines) {
    const kind = categories.get(line.category);
    if (!kind)
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_STANDARD_CATEGORY_CHANGED',
        'This category was not part of the submitted policy. Create a new request to use the current expense policy.',
        [line.id],
      );
    if (!Number.isSafeInteger(line.amountCents) || line.amountCents <= 0)
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_INVALID_LINE_AMOUNT',
        'Expense amounts require positive safe integer cents.',
        [line.id],
      );
    if (kind === 'none') continue;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(line.date) ||
      !Number.isFinite(Date.parse(line.date + 'T00:00:00Z')) ||
      new Date(line.date + 'T00:00:00Z').toISOString().slice(0, 10) !==
        line.date
    )
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_INVALID_LINE_DATE',
        'Expense dates require valid company calendar dates.',
        [line.id],
      );
    const key = `${line.date}:${kind}`;
    const group = groups.get(key) ?? {
      date: line.date,
      kind,
      cents: 0n,
      lines: [],
    };
    group.cents += BigInt(line.amountCents);
    group.lines.push(line);
    groups.set(key, group);
  }
  if (!groups.size) return [];
  const standard = input.standard;
  if (
    !standard ||
    typeof standard.code !== 'string' ||
    !standard.code.trim() ||
    !Number.isSafeInteger(standard.gradeRank) ||
    standard.gradeRank < 0 ||
    [standard.lodgingPerNight, standard.allowancePerDay].some(
      (value) =>
        typeof value !== 'number' || !Number.isFinite(value) || value < 0,
    )
  )
    throw new ReimbursementTravelStandardError(
      'REIMBURSEMENT_STANDARD_CONFIGURATION',
      'Approved employee grade and travel standard facts are required.',
    );
  return [...groups.values()].map((group) => {
    if (group.cents > BigInt(Number.MAX_SAFE_INTEGER))
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_TOTAL_TOO_LARGE',
        'The expense group exceeds the exact monetary limit.',
        group.lines.map((line) => line.id),
      );
    const amountCents = Number(group.cents);
    const threshold =
      group.kind === 'lodging'
        ? standard.lodgingPerNight
        : standard.allowancePerDay;
    const exceeded = exceedsMoneyThreshold(amountCents, threshold);
    const missing = exceeded
      ? group.lines
          .filter((line) => !line.standardExceptionReason.trim())
          .map((line) => line.id)
      : [];
    if (missing.length)
      throw new ReimbursementTravelStandardError(
        'REIMBURSEMENT_STANDARD_REASON_REQUIRED',
        'Each line in an over-standard day and expense type requires an explanation.',
        missing,
      );
    return {
      date: group.date,
      kind: group.kind,
      amountCents,
      threshold,
      exceeded,
      lineIds: group.lines.map((line) => line.id),
    };
  });
}

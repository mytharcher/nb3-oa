import type { CalendarDayKind } from '../shared/types.js';

/** Words accepted for each kind in a pasted line, besides the kind's own code. */
const KIND_ALIASES: Readonly<Record<string, CalendarDayKind>> = {
  holiday: 'holiday',
  节假日: 'holiday',
  假日: 'holiday',
  法定假日: 'holiday',
  休: 'holiday',
  adjustedworkday: 'adjustedWorkday',
  调休: 'adjustedWorkday',
  调休上班: 'adjustedWorkday',
  班: 'adjustedWorkday',
  上班: 'adjustedWorkday',
  workday: 'workday',
  工作日: 'workday',
  weekend: 'weekend',
  休息日: 'weekend',
};

export interface ParsedDay {
  readonly date: string;
  readonly kind: CalendarDayKind;
  readonly note: string | null;
}

export type DayLineProblem = 'format' | 'date' | 'kind' | 'year' | 'duplicate';

export interface ParseDaysResult {
  readonly days: ParsedDay[];
  /** 1-based line numbers with what is wrong with them. */
  readonly problems: {
    readonly line: number;
    readonly problem: DayLineProblem;
  }[];
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/**
 * Parses pasted lines `YYYY-MM-DD,kind,note` (comma, tab or Chinese comma separated, as copied from a spreadsheet).
 * Blank lines are skipped; a date may also be written `YYYY/M/D`.
 */
export function parseDays(text: string, year: number): ParseDaysResult {
  const days: ParsedDay[] = [];
  const problems: { line: number; problem: DayLineProblem }[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    if (!raw.trim()) return;
    const [rawDate = '', rawKind = '', ...rest] = raw
      .split(/[,\t，]/)
      .map((part) => part.trim());
    if (!rawDate || !rawKind) {
      problems.push({ line, problem: 'format' });
      return;
    }
    const parts = rawDate.split(/[-/.]/);
    const date =
      parts.length === 3
        ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
        : rawDate;
    if (!isRealDate(date)) {
      problems.push({ line, problem: 'date' });
      return;
    }
    if (!date.startsWith(`${year}-`)) {
      problems.push({ line, problem: 'year' });
      return;
    }
    const kind = KIND_ALIASES[rawKind] ?? KIND_ALIASES[rawKind.toLowerCase()];
    if (!kind) {
      problems.push({ line, problem: 'kind' });
      return;
    }
    if (seen.has(date)) {
      problems.push({ line, problem: 'duplicate' });
      return;
    }
    seen.add(date);
    const note = rest.join(',').trim();
    days.push({ date, kind, note: note ? note.slice(0, 255) : null });
  });
  return { days, problems };
}

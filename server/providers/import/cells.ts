import type {
  AdministratedUser,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';

import type { ColumnSpec } from './columns.js';
import {
  EMPLOYEE_STATUSES,
  type EmployeeStatus,
} from '../employees/contract.js';
import type { ImportErrorCode, ImportRowError } from './types.js';
import type { RawCell, SheetRow } from './workbook.js';

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;
const DATE = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/u;

const TRUE_WORDS = new Set(['是', 'y', 'yes', 'true', '1', '启用', '有效']);
const FALSE_WORDS = new Set(['否', 'n', 'no', 'false', '0', '停用', '无效']);

const STATUS_WORDS: Readonly<Record<string, EmployeeStatus>> = {
  试用: 'probation',
  试用期: 'probation',
  正式: 'regular',
  在职: 'regular',
  转正: 'regular',
  离职中: 'leaving',
  待离职: 'leaving',
  已离职: 'left',
  离职: 'left',
};

function cellText(value: RawCell): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/**
 * Reads one row's cells by column key and collects the row's errors. Every reader answers `undefined` when the header
 * leaves the column out (the record keeps its value), `null` for an empty or invalid cell (an invalid one also records
 * an error), and the value otherwise. A required column that is empty records `REQUIRED`.
 */
export class RowReader {
  public readonly row: number;
  private readonly cells: ReadonlyMap<string, RawCell>;
  private readonly columns: ReadonlyMap<string, ColumnSpec>;
  private readonly errors: ImportRowError[];
  private failures = 0;

  public constructor(
    row: SheetRow,
    columns: ReadonlyMap<string, ColumnSpec>,
    errors: ImportRowError[],
  ) {
    this.row = row.row;
    this.cells = row.cells;
    this.columns = columns;
    this.errors = errors;
  }

  /** Whether any error was recorded for this row. */
  public get failed(): boolean {
    return this.failures > 0;
  }

  public has(key: string): boolean {
    return this.columns.has(key);
  }

  public error(
    key: string | null,
    code: ImportErrorCode,
    value?: string | null,
    params?: Readonly<Record<string, string | number>>,
  ): void {
    this.failures += 1;
    this.errors.push({
      row: this.row,
      column: key,
      header: key === null ? null : (this.columns.get(key)?.header ?? null),
      code,
      ...(value === undefined || value === null ? {} : { value }),
      ...(params ? { params } : {}),
    });
  }

  private raw(key: string): RawCell | undefined {
    const column = this.columns.get(key);
    if (!column) return undefined;
    const value = this.cells.get(key) ?? null;
    if (value === null && column.required) this.error(key, 'REQUIRED');
    return value;
  }

  public text(key: string): string | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    const text = cellText(value);
    const max = this.columns.get(key)?.max;
    if (max !== undefined && text.length > max) {
      this.error(key, 'TOO_LONG', text, { max });
      return null;
    }
    return text;
  }

  public code(key: string): string | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    // A code typed into a number cell comes back as a number; integers read back exactly.
    const text =
      typeof value === 'number' && Number.isInteger(value)
        ? String(value)
        : cellText(value);
    if (!CODE.test(text)) {
      this.error(key, 'INVALID_CODE', text);
      return null;
    }
    return text;
  }

  public integer(key: string): number | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    const number = typeof value === 'number' ? value : Number(cellText(value));
    if (
      !Number.isInteger(number) ||
      Math.abs(number) > 2_147_483_647 ||
      typeof value === 'boolean'
    ) {
      this.error(key, 'INVALID_INTEGER', cellText(value));
      return null;
    }
    return number;
  }

  public boolean(key: string): boolean | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    if (typeof value === 'boolean') return value;
    const word = cellText(value).toLowerCase();
    if (TRUE_WORDS.has(word)) return true;
    if (FALSE_WORDS.has(word)) return false;
    this.error(key, 'INVALID_BOOLEAN', cellText(value));
    return null;
  }

  /** `YYYY-MM-DD`. An Excel date cell is read as the calendar day it shows. */
  public date(key: string): string | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        this.error(key, 'INVALID_DATE');
        return null;
      }
      // ExcelJS reads a date cell as midnight UTC of the day it shows.
      return value.toISOString().slice(0, 10);
    }
    const text = cellText(value);
    const match = DATE.exec(text);
    if (match) {
      const [, year, month, day] = match;
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const parsed = new Date(`${iso}T00:00:00Z`);
      if (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === iso
      )
        return iso;
    }
    this.error(key, 'INVALID_DATE', text);
    return null;
  }

  public status(key: string): EmployeeStatus | null | undefined {
    const value = this.raw(key);
    if (value === undefined || value === null) return value;
    const text = cellText(value);
    const status =
      STATUS_WORDS[text] ??
      EMPLOYEE_STATUSES.find((entry) => entry === text.toLowerCase());
    if (!status) {
      this.error(key, 'INVALID_STATUS', text);
      return null;
    }
    return status;
  }

  /** The account a username or email names, which must exist and be enabled. */
  public user(key: string, users: UserIndex): string | null | undefined {
    const text = this.text(key);
    if (text === undefined || text === null) return text;
    const user = users.find(text);
    if (!user) {
      this.error(key, 'USER_NOT_FOUND', text);
      return null;
    }
    if (user.disabledAt) {
      this.error(key, 'USER_DISABLED', text);
      return null;
    }
    return user.id;
  }
}

/** Accounts by lower-cased email and username. */
export interface UserIndex {
  find(text: string): AdministratedUser | undefined;
}

/** Loads every person account once; an import names a few hundred people and the directory pages at 100. */
export async function loadUserIndex(
  users: UserAdministrationService,
): Promise<UserIndex> {
  const byEmail = new Map<string, AdministratedUser>();
  const byUsername = new Map<string, AdministratedUser>();
  for (let page = 1; ; page += 1) {
    const result = await users.list({ page, pageSize: 100 });
    for (const user of result.items) {
      byEmail.set(user.email.toLowerCase(), user);
      if (user.username) byUsername.set(user.username.toLowerCase(), user);
    }
    if (page * 100 >= result.total || !result.items.length) break;
  }
  return {
    find(text) {
      const key = text.trim().toLowerCase();
      return byUsername.get(key) ?? byEmail.get(key);
    },
  };
}

/** Records `DUPLICATE_IN_FILE` on every row after the first with the same key. */
export class DuplicateTracker {
  private readonly first = new Map<string, number>();

  /** Whether the key was seen before; reports it on the row when so. */
  public check(
    reader: RowReader,
    column: string,
    key: string,
    value: string,
  ): boolean {
    const earlier = this.first.get(key);
    if (earlier !== undefined) {
      reader.error(column, 'DUPLICATE_IN_FILE', value, { firstRow: earlier });
      return true;
    }
    this.first.set(key, reader.row);
    return false;
  }
}

/**
 * Whether following `parent` from `start` comes back to `start`, or runs into a node already known to loop. Used on
 * the tree (or reporting line) as it will be once the whole file is applied.
 */
export function closesLoop(
  parent: ReadonlyMap<string, string | null>,
  start: string,
): boolean {
  const seen = new Set<string>();
  let current = parent.get(start) ?? null;
  while (current !== null) {
    if (current === start || seen.has(current)) return true;
    seen.add(current);
    current = parent.get(current) ?? null;
  }
  return false;
}

/**
 * The order of parent changes that reaches the target tree without ever passing through a loop, which the services
 * refuse even when the final tree has none (two departments swapping places, say). `current` is the tree now, `moves`
 * the parents that change; the final tree must be acyclic. Changes run ancestors first; when one would put a node
 * below its own current descendant, the node on that path still hanging from its old parent is detached first
 * (moved to the top), and it reaches its own target later. Such a path always has one: otherwise the final tree
 * would hold the loop.
 */
export function orderMoves(
  current: ReadonlyMap<string, string | null>,
  moves: ReadonlyMap<string, string | null>,
): { id: string; parent: string | null }[] {
  const state = new Map(current);
  const target = new Map(current);
  for (const [id, parent] of moves) target.set(id, parent);
  const depth = (id: string): number => {
    let count = 0;
    for (
      let at = target.get(id) ?? null;
      at !== null;
      at = target.get(at) ?? null
    )
      count += 1;
    return count;
  };
  const order = [...moves.keys()].sort(
    (left, right) => depth(left) - depth(right),
  );
  const steps: { id: string; parent: string | null }[] = [];
  for (const id of order) {
    const parent = moves.get(id) ?? null;
    if (state.get(id) === parent) continue;
    while (parent !== null) {
      // The current chain from the new parent up; stop when it reaches the moving node.
      const chain: string[] = [];
      let at: string | null = parent;
      while (at !== null && at !== id) {
        chain.push(at);
        at = state.get(at) ?? null;
      }
      if (at === null) break;
      const loose = chain.find(
        (node) => moves.has(node) && state.get(node) !== moves.get(node),
      );
      if (!loose) break;
      steps.push({ id: loose, parent: null });
      state.set(loose, null);
    }
    steps.push({ id, parent });
    state.set(id, parent);
  }
  return steps;
}

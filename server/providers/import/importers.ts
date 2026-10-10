import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';

import type { Employee, EmployeeStatus } from '../employees/contract.js';
import type {
  EmployeeInput,
  EmployeeModuleService,
} from '../employees/service.js';
import type { OrganizationService, OrgWriteContext } from '../org/service.js';
import {
  closesLoop,
  DuplicateTracker,
  orderMoves,
  RowReader,
  type UserIndex,
} from './cells.js';
import type { ColumnSpec } from './columns.js';
import type { ImportKind } from './constants.js';
import type { ImportRowError } from './types.js';
import type { ParsedSheet } from './workbook.js';

/** Everything an importer reads and writes through, all bound to the import's one transaction. */
export interface ImportContext {
  readonly connection: DatabaseConnection;
  readonly organization: OrganizationService;
  readonly employees: EmployeeModuleService;
  readonly users: UserIndex;
  /** Actor, transaction and audit reason for the organisation service. */
  readonly write: OrgWriteContext & { readonly connection: DatabaseConnection };
  readonly actorId: string | null;
  readonly reason: string;
}

export interface Outcome {
  created: number;
  updated: number;
  unchanged: number;
}

/** A validated file: its errors, and when there are none, the writes that apply it. */
export interface ImportPlan {
  readonly errors: readonly ImportRowError[];
  execute(): Promise<Outcome>;
}

/** A service refused a write that validation let through; the import stops and its transaction rolls back. */
export class ImportWriteError extends Error {
  public readonly detail: ImportRowError;

  public constructor(detail: ImportRowError, cause: unknown) {
    super(`Row ${detail.row ?? '-'} could not be written.`, { cause });
    this.name = 'ImportWriteError';
    this.detail = detail;
  }
}

/** Runs one service write for a row, turning its refusal into the row's `WRITE_FAILED`. */
async function guard<T>(row: number, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const reason =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : 'UNKNOWN';
    const message = error instanceof Error ? error.message : String(error);
    throw new ImportWriteError(
      {
        row,
        column: null,
        header: null,
        code: 'WRITE_FAILED',
        params: { reason, message },
      },
      error,
    );
  }
}

function readers(
  sheet: ParsedSheet,
  errors: ImportRowError[],
): readonly RowReader[] {
  const columns = new Map<string, ColumnSpec>(
    sheet.columns.map((column) => [column.key, column]),
  );
  return sheet.rows.map((row) => new RowReader(row, columns, errors));
}

/** Rows record their errors in row order; the file's own come first. */
function sorted(errors: readonly ImportRowError[]): ImportRowError[] {
  return [...errors].sort((left, right) => (left.row ?? 0) - (right.row ?? 0));
}

const nothing = async (): Promise<Outcome> => ({
  created: 0,
  updated: 0,
  unchanged: 0,
});

// ---- Departments ------------------------------------------------------------------------------------------------

interface DepartmentRow {
  readonly reader: RowReader;
  readonly code: string;
  readonly title: string;
  /** `undefined`: column absent, keep; `null`: top level. */
  readonly parentCode: string | null | undefined;
  readonly managerId: string | null | undefined;
  readonly executiveId: string | null | undefined;
  readonly sortOrder: number | undefined;
  readonly active: boolean | undefined;
}

async function planDepartments(
  sheet: ParsedSheet,
  ctx: ImportContext,
): Promise<ImportPlan> {
  const errors: ImportRowError[] = [];
  const { organization, write } = ctx;
  const tree = await organization.listTree(ctx.connection);
  const byCode = new Map(
    tree.flatMap((node) => (node.code ? [[node.code, node] as const] : [])),
  );
  const duplicates = new DuplicateTracker();
  const rows: DepartmentRow[] = [];
  for (const reader of readers(sheet, errors)) {
    const code = reader.code('code');
    const title = reader.text('title');
    const parentCode = reader.code('parentCode');
    const managerId = reader.user('manager', ctx.users);
    const executiveId = reader.user('executive', ctx.users);
    const sortOrder = reader.integer('sortOrder');
    const active = reader.boolean('active');
    if (code && duplicates.check(reader, 'code', code, code)) continue;
    if (reader.failed || !code || !title) continue;
    if (parentCode === code) {
      reader.error('parentCode', 'PARENT_CYCLE', parentCode);
      continue;
    }
    rows.push({
      reader,
      code,
      title,
      parentCode,
      managerId,
      executiveId,
      // A present but empty cell means the default.
      sortOrder: reader.has('sortOrder') ? (sortOrder ?? 0) : undefined,
      active: reader.has('active') ? (active ?? true) : undefined,
    });
  }

  // The tree as it will be, keyed by code (departments without a code cannot be named, but can be ancestors).
  const inFile = new Map(rows.map((row) => [row.code, row]));
  const key = (id: string): string => {
    const node = tree.find((entry) => entry.id === id);
    return node?.code ?? `#${id}`;
  };
  const finalParent = new Map<string, string | null>();
  for (const node of tree)
    finalParent.set(
      key(node.id),
      node.parentId === null ? null : key(node.parentId),
    );
  for (const row of rows) {
    if (row.parentCode === undefined) {
      if (!finalParent.has(row.code)) finalParent.set(row.code, null);
      continue;
    }
    if (
      row.parentCode !== null &&
      !inFile.has(row.parentCode) &&
      !byCode.has(row.parentCode)
    ) {
      row.reader.error('parentCode', 'PARENT_NOT_FOUND', row.parentCode);
      continue;
    }
    finalParent.set(row.code, row.parentCode);
  }
  for (const row of rows)
    if (!row.reader.failed && closesLoop(finalParent, row.code))
      row.reader.error('parentCode', 'PARENT_CYCLE', row.parentCode);
  for (const row of rows) {
    const executive =
      row.executiveId === undefined
        ? byCode.get(row.code)?.executiveId
        : row.executiveId;
    if (
      !row.reader.failed &&
      finalParent.get(row.code) != null &&
      executive != null
    )
      row.reader.error('executive', 'EXECUTIVE_TOP_LEVEL_ONLY');
  }
  if (errors.length) return { errors: sorted(errors), execute: nothing };

  return {
    errors: [],
    async execute() {
      const outcome: Outcome = { created: 0, updated: 0, unchanged: 0 };
      const ids = new Map(
        [...byCode].map(([code, node]) => [code, node.id] as const),
      );
      const changed = new Set<DepartmentRow>();

      // New departments, parents first: a new department has no descendants yet, so placing it cannot loop.
      const created = rows.filter((row) => !byCode.has(row.code));
      const depth = (row: DepartmentRow): number => {
        let count = 0;
        for (
          let at = finalParent.get(row.code) ?? null;
          at !== null;
          at = finalParent.get(at) ?? null
        )
          count += 1;
        return count;
      };
      created.sort((left, right) => depth(left) - depth(right));
      for (const row of created) {
        const parentCode = row.parentCode ?? null;
        const department = await guard(row.reader.row, () =>
          organization.createDepartment(
            {
              title: row.title,
              code: row.code,
              parentId: parentCode === null ? null : ids.get(parentCode)!,
              managerId: row.managerId ?? null,
              executiveId: row.executiveId ?? null,
              sortOrder: row.sortOrder ?? 0,
            },
            write,
          ),
        );
        ids.set(row.code, department.id);
        if (row.active === false)
          await guard(row.reader.row, () =>
            organization.setDepartmentActive(department.id, false, write),
          );
        outcome.created += 1;
      }

      // Existing departments: fields first, then moves in an order that never loops, then enabling.
      const existing = rows.filter((row) => byCode.has(row.code));
      const moves = new Map<string, string | null>();
      for (const row of existing) {
        const current = byCode.get(row.code)!;
        const input: Record<string, unknown> = {};
        if (row.title !== current.title) input.title = row.title;
        if (row.managerId !== undefined && row.managerId !== current.managerId)
          input.managerId = row.managerId;
        // Clear before a move; new appointments wait until the final parent has been written.
        if (row.executiveId === null && current.executiveId !== null)
          input.executiveId = null;
        if (row.sortOrder !== undefined && row.sortOrder !== current.sortOrder)
          input.sortOrder = row.sortOrder;
        if (Object.keys(input).length) {
          await guard(row.reader.row, () =>
            organization.updateDepartment(current.id, input, write),
          );
          changed.add(row);
        }
        if (row.parentCode !== undefined) {
          const parentId =
            row.parentCode === null ? null : ids.get(row.parentCode)!;
          if (parentId !== current.parentId) moves.set(current.id, parentId);
        }
      }
      const rowById = new Map(
        existing.map((row) => [byCode.get(row.code)!.id, row]),
      );
      const currentParents = new Map(
        tree.map((node) => [node.id, node.parentId] as const),
      );
      for (const step of orderMoves(currentParents, moves)) {
        const row = rowById.get(step.id)!;
        await guard(row.reader.row, () =>
          organization.updateDepartment(
            step.id,
            { parentId: step.parent },
            write,
          ),
        );
        changed.add(row);
      }
      for (const row of existing) {
        const current = byCode.get(row.code)!;
        if (
          row.executiveId != null &&
          row.executiveId !== current.executiveId
        ) {
          await guard(row.reader.row, () =>
            organization.updateDepartment(
              current.id,
              { executiveId: row.executiveId },
              write,
            ),
          );
          changed.add(row);
        }
        if (row.active !== undefined && row.active !== current.active) {
          await guard(row.reader.row, () =>
            organization.setDepartmentActive(current.id, row.active!, write),
          );
          changed.add(row);
        }
      }
      outcome.updated += changed.size;
      outcome.unchanged += existing.length - changed.size;
      return outcome;
    },
  };
}

// ---- Positions and grades ---------------------------------------------------------------------------------------

interface CatalogRow {
  readonly reader: RowReader;
  readonly code: string;
  readonly title: string;
  readonly sortOrder?: number | undefined;
  readonly rank?: number | undefined;
  readonly active: boolean | undefined;
}

async function planCatalog(
  kind: 'positions' | 'grades',
  sheet: ParsedSheet,
  ctx: ImportContext,
): Promise<ImportPlan> {
  const errors: ImportRowError[] = [];
  const { organization, write } = ctx;
  const current =
    kind === 'positions'
      ? await organization.listPositions(ctx.connection)
      : await organization.listGrades(ctx.connection);
  const byCode = new Map(current.map((entry) => [entry.code, entry] as const));
  const duplicates = new DuplicateTracker();
  const rows: CatalogRow[] = [];
  for (const reader of readers(sheet, errors)) {
    const code = reader.code('code');
    const title = reader.text('title');
    const sortOrder =
      kind === 'positions' ? reader.integer('sortOrder') : undefined;
    const rank = kind === 'grades' ? reader.integer('rank') : undefined;
    const active = reader.boolean('active');
    if (code && duplicates.check(reader, 'code', code, code)) continue;
    if (reader.failed || !code || !title) continue;
    rows.push({
      reader,
      code,
      title,
      sortOrder: reader.has('sortOrder') ? (sortOrder ?? 0) : undefined,
      rank: rank ?? undefined,
      active: reader.has('active') ? (active ?? true) : undefined,
    });
  }
  if (errors.length) return { errors: sorted(errors), execute: nothing };

  return {
    errors: [],
    async execute() {
      const outcome: Outcome = { created: 0, updated: 0, unchanged: 0 };
      for (const row of rows) {
        const existing = byCode.get(row.code);
        if (!existing) {
          const created = await guard<{ id: string }>(row.reader.row, () =>
            kind === 'positions'
              ? organization.createPosition(
                  {
                    code: row.code,
                    title: row.title,
                    sortOrder: row.sortOrder ?? 0,
                  },
                  write,
                )
              : organization.createGrade(
                  { code: row.code, title: row.title, rank: row.rank! },
                  write,
                ),
          );
          if (row.active === false)
            await guard<unknown>(row.reader.row, () =>
              kind === 'positions'
                ? organization.setPositionActive(created.id, false, write)
                : organization.setGradeActive(created.id, false, write),
            );
          outcome.created += 1;
          continue;
        }
        let changed = false;
        const input: { title?: string; sortOrder?: number; rank?: number } = {};
        if (row.title !== existing.title) input.title = row.title;
        if (
          kind === 'positions' &&
          row.sortOrder !== undefined &&
          'sortOrder' in existing &&
          row.sortOrder !== existing.sortOrder
        )
          input.sortOrder = row.sortOrder;
        if (
          kind === 'grades' &&
          row.rank !== undefined &&
          'rank' in existing &&
          row.rank !== existing.rank
        )
          input.rank = row.rank;
        if (Object.keys(input).length) {
          await guard<unknown>(row.reader.row, () =>
            kind === 'positions'
              ? organization.updatePosition(existing.id, input, write)
              : organization.updateGrade(existing.id, input, write),
          );
          changed = true;
        }
        if (row.active !== undefined && row.active !== existing.active) {
          await guard<unknown>(row.reader.row, () =>
            kind === 'positions'
              ? organization.setPositionActive(existing.id, row.active!, write)
              : organization.setGradeActive(existing.id, row.active!, write),
          );
          changed = true;
        }
        if (changed) outcome.updated += 1;
        else outcome.unchanged += 1;
      }
      return outcome;
    },
  };
}

// ---- Employees --------------------------------------------------------------------------------------------------

/** The import is a trusted caller: the settings item it requires already grants writing every archive. */
const TRUSTED_POLICY: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: false,
};

/** Archive fields the import maintains besides the manager, which is set once every row exists. */
const EMPLOYEE_COLUMNS = [
  'name',
  'hireDate',
  'probationEndDate',
  'phone',
  'email',
  'workLocation',
  'emergencyContact',
] as const;

interface EmployeeRow {
  readonly reader: RowReader;
  readonly code: string;
  readonly userId: string;
  readonly status: EmployeeStatus;
  readonly fields: EmployeeInput;
  readonly departmentId: string | null | undefined;
  readonly managerCode: string | null | undefined;
}

async function planEmployees(
  sheet: ParsedSheet,
  ctx: ImportContext,
): Promise<ImportPlan> {
  const errors: ImportRowError[] = [];
  const { organization, employees, connection } = ctx;
  // Reads go straight to the archive table for codes; every write below goes through the employee service.
  const stored = (
    await connection.query
      .selectFrom('employees')
      .select(['id', 'code', 'userId'])
      .execute()
  ).map((row) => ({
    id: String(row.id),
    code: String(row.code),
    userId: String(row.userId),
  }));
  const archives = await employees.getByUserIds(
    stored.map((row) => row.userId),
    connection,
  );
  const byCode = new Map<string, Employee>();
  for (const row of stored) {
    const archive = archives.get(row.userId);
    if (archive) byCode.set(row.code, archive);
  }
  const byUser = new Map(
    [...byCode.values()].map((archive) => [archive.userId, archive] as const),
  );
  const tree = await organization.listTree(connection);
  const departmentsByCode = new Map(
    tree.flatMap((node) => (node.code ? [[node.code, node] as const] : [])),
  );
  const activeDepartments = new Set(
    await organization.filterActive(
      tree.map((node) => node.id),
      connection,
    ),
  );
  const positions = new Map(
    (await organization.listPositions(connection)).map(
      (entry) => [entry.code, entry] as const,
    ),
  );
  const grades = new Map(
    (await organization.listGrades(connection)).map(
      (entry) => [entry.code, entry] as const,
    ),
  );

  const codes = new DuplicateTracker();
  const accounts = new DuplicateTracker();
  const rows: EmployeeRow[] = [];
  for (const reader of readers(sheet, errors)) {
    const code = reader.code('code');
    const name = reader.text('name');
    const userText = reader.text('user');
    const userId = reader.user('user', ctx.users);
    const departmentCode = reader.code('departmentCode');
    const managerCode = reader.code('managerCode');
    const positionCode = reader.code('positionCode');
    const gradeCode = reader.code('gradeCode');
    const hireDate = reader.date('hireDate');
    const probationEndDate = reader.date('probationEndDate');
    const status = reader.status('status');
    const phone = reader.text('phone');
    const email = reader.text('email');
    const workLocation = reader.text('workLocation');
    const emergencyContact = reader.text('emergencyContact');
    if (email && !/^[^\s@]+@[^\s@]+$/u.test(email))
      reader.error('email', 'INVALID_EMAIL', email);
    if (code && codes.check(reader, 'code', code, code)) continue;
    if (userId && accounts.check(reader, 'user', userId, userText ?? userId))
      continue;

    const fields: EmployeeInput = {};
    if (name) fields.name = name;
    if (hireDate !== undefined) fields.hireDate = hireDate;
    if (probationEndDate !== undefined)
      fields.probationEndDate = probationEndDate;
    if (phone !== undefined) fields.phone = phone;
    if (email !== undefined) fields.email = email;
    if (workLocation !== undefined) fields.workLocation = workLocation;
    if (emergencyContact !== undefined)
      fields.emergencyContact = emergencyContact;
    if (positionCode !== undefined) {
      const position =
        positionCode === null ? undefined : positions.get(positionCode);
      if (positionCode !== null && !position)
        reader.error('positionCode', 'POSITION_NOT_FOUND', positionCode);
      else if (position && !position.active)
        reader.error('positionCode', 'POSITION_INACTIVE', positionCode);
      fields.positionId = position?.id ?? null;
    }
    if (gradeCode !== undefined) {
      const grade = gradeCode === null ? undefined : grades.get(gradeCode);
      if (gradeCode !== null && !grade)
        reader.error('gradeCode', 'GRADE_NOT_FOUND', gradeCode);
      else if (grade && !grade.active)
        reader.error('gradeCode', 'GRADE_INACTIVE', gradeCode);
      fields.gradeId = grade?.id ?? null;
    }
    let departmentId: string | null | undefined = departmentCode;
    if (departmentCode) {
      const department = departmentsByCode.get(departmentCode);
      if (!department)
        reader.error('departmentCode', 'DEPARTMENT_NOT_FOUND', departmentCode);
      else if (!activeDepartments.has(department.id))
        reader.error('departmentCode', 'DEPARTMENT_INACTIVE', departmentCode);
      departmentId = department?.id;
    }
    if (code && userId) {
      const existing = byCode.get(code);
      const owner = byUser.get(userId);
      if (existing && existing.userId !== userId)
        reader.error('user', 'USER_MISMATCH', userText);
      else if (!existing && owner)
        reader.error('user', 'USER_TAKEN', userText, { code: owner.code });
    }
    if (managerCode && managerCode === code)
      reader.error('managerCode', 'MANAGER_SELF', managerCode);
    if (reader.failed || !code || !userId || !status) continue;
    rows.push({
      reader,
      code,
      userId,
      status,
      fields,
      departmentId,
      managerCode,
    });
  }

  // The reporting line as it will be, keyed by code.
  const inFile = new Map(rows.map((row) => [row.code, row]));
  const finalManager = new Map<string, string | null>();
  const codeOf = new Map(
    [...byCode.values()].map((archive) => [archive.id, archive.code] as const),
  );
  for (const archive of byCode.values())
    finalManager.set(
      archive.code,
      archive.managerId === null
        ? null
        : (codeOf.get(archive.managerId) ?? null),
    );
  for (const row of rows) {
    if (row.managerCode === undefined) {
      if (!finalManager.has(row.code)) finalManager.set(row.code, null);
      continue;
    }
    if (row.managerCode !== null) {
      const manager = inFile.get(row.managerCode);
      const stored = byCode.get(row.managerCode);
      if (!manager && !stored) {
        row.reader.error('managerCode', 'MANAGER_NOT_FOUND', row.managerCode);
        continue;
      }
      // The manager's status as the file leaves it; a former employee cannot be anyone's manager.
      const leftAfter = manager ? manager.status === 'left' : !stored!.active;
      if (leftAfter) {
        row.reader.error('managerCode', 'MANAGER_INACTIVE', row.managerCode);
        continue;
      }
    }
    finalManager.set(row.code, row.managerCode);
  }
  for (const row of rows)
    if (!row.reader.failed && closesLoop(finalManager, row.code))
      row.reader.error('managerCode', 'MANAGER_CYCLE', row.managerCode);
  if (errors.length) return { errors: sorted(errors), execute: nothing };

  return {
    errors: [],
    async execute() {
      const outcome: Outcome = { created: 0, updated: 0, unchanged: 0 };
      const options = { connection, reason: ctx.reason };
      const actor = ctx.actorId ?? '';
      const ids = new Map(
        [...byCode].map(([code, archive]) => [code, archive.id] as const),
      );
      const changed = new Set<EmployeeRow>();

      // 1. Archives, without managers: a manager may be a row further down.
      for (const row of rows) {
        const existing = byCode.get(row.code);
        if (!existing) {
          const created = await guard(row.reader.row, () =>
            employees.createEmployee(
              {
                ...row.fields,
                userId: row.userId,
                code: row.code,
                name: row.fields.name!,
                status: row.status,
              },
              TRUSTED_POLICY,
              actor,
              options,
            ),
          );
          ids.set(row.code, created.id);
          // A former employee is imported as such: the correction sets the archive inactive.
          if (row.status === 'left')
            await guard(row.reader.row, () =>
              employees.correctStatus(
                created.id,
                { status: 'left', active: false, reason: ctx.reason },
                TRUSTED_POLICY,
                actor,
                { connection },
              ),
            );
          continue;
        }
        const input: EmployeeInput = {};
        for (const field of [
          ...EMPLOYEE_COLUMNS,
          'positionId',
          'gradeId',
        ] as const) {
          const value = row.fields[field];
          if (value !== undefined && value !== (existing[field] ?? null))
            Object.assign(input, { [field]: value });
        }
        if (Object.keys(input).length) {
          await guard(row.reader.row, () =>
            employees.updateEmployee(
              existing.id,
              input,
              TRUSTED_POLICY,
              actor,
              options,
            ),
          );
          changed.add(row);
        }
        // Status changes outside a flow only as the administrator's correction, which writes the history row.
        if (row.status !== existing.status) {
          await guard(row.reader.row, () =>
            employees.correctStatus(
              existing.id,
              {
                status: row.status,
                active: row.status !== 'left',
                reason: ctx.reason,
              },
              TRUSTED_POLICY,
              actor,
              { connection },
            ),
          );
          changed.add(row);
        }
      }

      // 2. Managers, in an order that never closes a loop on the way.
      const rowById = new Map(rows.map((row) => [ids.get(row.code)!, row]));
      const currentManagers = new Map<string, string | null>();
      for (const archive of byCode.values())
        currentManagers.set(archive.id, archive.managerId);
      const moves = new Map<string, string | null>();
      for (const row of rows) {
        if (row.managerCode === undefined) continue;
        const id = ids.get(row.code)!;
        const managerId =
          row.managerCode === null ? null : ids.get(row.managerCode)!;
        if ((currentManagers.get(id) ?? null) !== managerId)
          moves.set(id, managerId);
      }
      for (const step of orderMoves(currentManagers, moves)) {
        const row = rowById.get(step.id)!;
        await guard(row.reader.row, () =>
          employees.updateEmployee(
            step.id,
            { managerId: step.parent },
            TRUSTED_POLICY,
            actor,
            options,
          ),
        );
        if (byCode.has(row.code)) changed.add(row);
      }

      // 3. Primary departments, through the organisation: the new one becomes primary, the previous one is left.
      for (const row of rows) {
        if (!row.departmentId) continue;
        const departmentId = row.departmentId;
        const memberships = await organization.membershipsOf(
          row.userId,
          connection,
        );
        const primary = memberships.find((entry) => entry.primary);
        if (primary?.departmentId === departmentId) continue;
        await guard(row.reader.row, () =>
          organization.addMember(
            { departmentId, userId: row.userId, primary: true },
            ctx.write,
          ),
        );
        if (primary)
          await guard(row.reader.row, () =>
            organization.removeMember(
              primary.departmentId,
              row.userId,
              ctx.write,
            ),
          );
        if (byCode.has(row.code)) changed.add(row);
      }

      const existingRows = rows.filter((row) => byCode.has(row.code));
      outcome.created = rows.length - existingRows.length;
      outcome.updated = changed.size;
      outcome.unchanged = existingRows.length - changed.size;
      return outcome;
    },
  };
}

// ---- Duty-role members ------------------------------------------------------------------------------------------

interface MemberRow {
  readonly reader: RowReader;
  readonly roleCode: string;
  readonly userId: string;
  readonly active: boolean;
}

async function planDutyRoleMembers(
  sheet: ParsedSheet,
  ctx: ImportContext,
): Promise<ImportPlan> {
  const errors: ImportRowError[] = [];
  const { organization, connection, write } = ctx;
  const roles = new Set(
    (await organization.listDutyRoles(connection)).map((role) => role.code),
  );
  const duplicates = new DuplicateTracker();
  const rows: MemberRow[] = [];
  for (const reader of readers(sheet, errors)) {
    const roleCode = reader.code('roleCode');
    const userText = reader.text('user');
    const userId = reader.user('user', ctx.users);
    const active = reader.boolean('active');
    if (roleCode && !roles.has(roleCode))
      reader.error('roleCode', 'DUTY_ROLE_NOT_FOUND', roleCode);
    if (
      roleCode &&
      userId &&
      duplicates.check(reader, 'user', `${roleCode}\u0000${userId}`, userText!)
    )
      continue;
    if (reader.failed || !roleCode || !userId) continue;
    rows.push({ reader, roleCode, userId, active: active ?? true });
  }
  if (errors.length) return { errors: sorted(errors), execute: nothing };

  return {
    errors: [],
    async execute() {
      const outcome: Outcome = { created: 0, updated: 0, unchanged: 0 };
      const members = new Map<string, Set<string>>();
      for (const code of new Set(rows.map((row) => row.roleCode)))
        members.set(
          code,
          new Set(await organization.listDutyRoleMembers(code, connection)),
        );
      for (const row of rows) {
        const isMember = members.get(row.roleCode)!.has(row.userId);
        if (row.active && !isMember) {
          await guard(row.reader.row, () =>
            organization.addDutyRoleMember(row.roleCode, row.userId, write),
          );
          outcome.created += 1;
        } else if (!row.active && isMember) {
          await guard(row.reader.row, () =>
            organization.removeDutyRoleMember(row.roleCode, row.userId, write),
          );
          outcome.updated += 1;
        } else outcome.unchanged += 1;
      }
      return outcome;
    },
  };
}

/** Validates a parsed sheet of the kind inside the import's transaction and returns its plan. */
export async function planImport(
  kind: ImportKind,
  sheet: ParsedSheet,
  ctx: ImportContext,
): Promise<ImportPlan> {
  if (sheet.errors.length)
    return { errors: sorted(sheet.errors), execute: nothing };
  switch (kind) {
    case 'departments':
      return planDepartments(sheet, ctx);
    case 'positions':
    case 'grades':
      return planCatalog(kind, sheet, ctx);
    case 'employees':
      return planEmployees(sheet, ctx);
    case 'dutyRoleMembers':
      return planDutyRoleMembers(sheet, ctx);
  }
}

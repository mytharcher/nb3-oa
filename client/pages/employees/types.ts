/** Mirrors the `/api/employees` and `/api/directory` responses (`server/routes/employees/schemas.ts`). */

export const EMPLOYEE_STATUSES = [
  'probation',
  'regular',
  'leaving',
  'left',
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const HISTORY_KINDS = [
  'hire',
  'regularization',
  'transfer',
  'salaryChange',
  'departure',
  'correction',
] as const;
export type HistoryKind = (typeof HISTORY_KINDS)[number];

export interface NamedRef {
  readonly id: string;
  readonly title: string;
}

export interface Employee {
  readonly id: string;
  readonly userId?: string;
  readonly code?: string;
  readonly name?: string;
  readonly managerId?: string | null;
  readonly positionId?: string | null;
  readonly gradeId?: string | null;
  readonly hireDate?: string | null;
  readonly careerStartDate?: string | null;
  readonly probationEndDate?: string | null;
  readonly status?: EmployeeStatus;
  readonly lastWorkingDay?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly workLocation?: string | null;
  readonly emergencyContact?: string | null;
  readonly active?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string | null;
  } | null;
  readonly manager: {
    readonly id: string;
    readonly name: string;
    readonly userId: string;
  } | null;
  readonly primaryDepartment: NamedRef | null;
  readonly position: NamedRef | null;
  readonly grade: NamedRef | null;
}

export interface EmployeeList {
  readonly data: Employee[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export interface EmployeeProfile {
  readonly employeeId?: string;
  /** `full` with every controlled field; `bank` with the bank account fields only. */
  readonly access: 'full' | 'bank';
  readonly idType?: string | null;
  readonly idNumber?: string | null;
  readonly birthDate?: string | null;
  readonly address?: string | null;
  readonly education?: string | null;
  readonly school?: string | null;
  readonly major?: string | null;
  readonly bankName?: string | null;
  readonly bankAccount?: string | null;
  readonly bankAccountName?: string | null;
  readonly updatedAt?: string | null;
}

export interface EmployeeCompensation {
  readonly id: string;
  readonly employeeId: string;
  readonly gradeId: string | null;
  readonly baseSalary: string;
  readonly effectiveFrom: string;
  readonly sourceApplication: string | null;
  readonly note: string | null;
  readonly createdAt: string;
}

export interface EmployeeHistory {
  readonly id: string;
  readonly kind: HistoryKind;
  readonly before: Record<string, unknown> | null;
  readonly after: Record<string, unknown> | null;
  readonly effectiveAt: string;
  readonly sourceApplication: string | null;
  readonly note: string | null;
  readonly createdAt: string;
}

export interface DirectoryEntry {
  readonly id: string;
  readonly userId: string;
  readonly code: string;
  readonly name: string;
  readonly manager: { readonly id: string; readonly name: string } | null;
  readonly primaryDepartment: NamedRef | null;
  readonly position: NamedRef | null;
  readonly workLocation: string | null;
  /** Absent when the viewer may not see this person's contact details. */
  readonly phone?: string | null;
  readonly email?: string | null;
}

/** The query parameters the employee page and its tabs write; everything else belongs to the list it covers. */
export const EMPLOYEE_PAGE_PARAMS: readonly string[] = [];

/** What the list passes to the pages and overlays it opens. */
export interface EmployeesOutletContext {
  readonly reload: () => void;
}

/** What the employee page passes to its tabs, and each tab on to the overlays over it. */
export interface EmployeePageOutletContext {
  readonly employee: Employee;
  /** Shows the returned archive at once and refreshes the list behind (guideline R2). */
  readonly onSaved: (employee: Employee) => void;
  readonly onNotFound: () => void;
}

/** Composite resources the page checks with `useCan`; the server enforces them on every endpoint. */
export const ARCHIVE = { type: 'composite', id: 'oa.employees.archive' };
export const PROFILE = { type: 'composite', id: 'oa.employees.profile' };
export const COMPENSATION = {
  type: 'composite',
  id: 'oa.employees.compensation',
};

/** What the controlled-information tab passes to the overlays over it, its own edit drawer included. */
export interface EmployeeProfileOutletContext extends EmployeePageOutletContext {
  readonly onProfileSaved: (profile: EmployeeProfile) => void;
}

import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { RecordAccessReference } from '@nocobase/authorization/core';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

/**
 * The employee contract other OA modules code against: the approval directory (`managerOf`), leave, attendance,
 * expenses and every document that needs the reporting line.
 *
 * The `employees` module owns the implementation in `server/providers/employees/`. Every read takes an optional
 * connection so it can run inside the caller's transaction.
 */

export const EMPLOYEE_STATUSES = [
  'probation',
  'regular',
  'leaving',
  'left',
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

/** Kinds of `employeeHistory` rows. Flows write the first five; `correction` is the administrator's data fix. */
export const EMPLOYEE_HISTORY_KINDS = [
  'hire',
  'regularization',
  'transfer',
  'salaryChange',
  'departure',
  'correction',
] as const;
export type EmployeeHistoryKind = (typeof EMPLOYEE_HISTORY_KINDS)[number];

/** The basic archive. Dates are `YYYY-MM-DD`; times are RFC 3339. There is no department here: see `OrgService`. */
export interface Employee {
  id: string;
  userId: string;
  code: string;
  name: string;
  /** Employee id of the direct manager. */
  managerId: string | null;
  positionId: string | null;
  gradeId: string | null;
  hireDate: string | null;
  /** First date of employment across employers; null means unknown and never falls back to hireDate. */
  careerStartDate: string | null;
  probationEndDate: string | null;
  status: EmployeeStatus;
  lastWorkingDay: string | null;
  phone: string | null;
  email: string | null;
  workLocation: string | null;
  emergencyContact: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfile {
  employeeId: string;
  idType: string | null;
  idNumber: string | null;
  birthDate: string | null;
  address: string | null;
  education: string | null;
  school: string | null;
  major: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  updatedAt: string | null;
}

/** A private payment snapshot, never part of the ordinary employee archive or approval run. */
export interface EmployeePaymentAccount {
  bankName: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
}

export interface EmployeeCompensation {
  id: string;
  employeeId: string;
  gradeId: string | null;
  /** Decimal string, such as `12000.00`, so amounts never pass through a float. */
  baseSalary: string;
  effectiveFrom: string;
  sourceApplication: string | null;
  note: string | null;
  createdById: string | null;
  createdAt: string;
}

export interface EmployeeHistoryEntry {
  id: string;
  employeeId: string;
  kind: EmployeeHistoryKind;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  effectiveAt: string;
  sourceApplication: string | null;
  note: string | null;
  createdById: string | null;
  createdAt: string;
}

/** Who triggered an internal write, and from which approval (e.g. `REG-202610-0001`), for audit and history. */
export interface EmployeeWriteOrigin {
  actorId: string | null;
  sourceApplication?: string | null;
}

export interface AppendCompensationInput {
  employeeId: string;
  gradeId?: string | null;
  baseSalary: string;
  effectiveFrom: string;
  note?: string | null;
}

export interface AppendHistoryInput {
  employeeId: string;
  kind: EmployeeHistoryKind;
  /** Snapshot of the fields that changed. Salary amounts belong in compensation rows, never here. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  effectiveAt: string;
  note?: string | null;
}

/** A status change a flow's exit applies: regularization, departure, a rehire. */
export interface ApplyStatusInput {
  employeeId: string;
  status: EmployeeStatus;
  kind: EmployeeHistoryKind;
  effectiveAt: string;
  lastWorkingDay?: string | null;
  /** Trusted regularization/deferral lifecycle writes, included in the same audited history. */
  probationEndDate?: string | null;
  gradeId?: string | null;
  active?: boolean;
  note?: string | null;
}

export interface OnboardingEmployeeInput {
  userId: string;
  code: string;
  name: string;
  managerId: string | null;
  positionId: string;
  gradeId: string;
  hireDate: string;
  careerStartDate: string | null;
  probationEndDate: string;
}

/** Trusted effective personnel change; salary is written separately through compensation. */
export interface ApplyAssignmentInput {
  employeeId: string;
  expected: Pick<Employee, 'positionId' | 'gradeId' | 'managerId' | 'status'>;
  positionId: string;
  gradeId: string;
  managerId: string | null;
  effectiveAt: string;
  note?: string | null;
}

export interface EmployeeService {
  /** Scoped snapshot for master-data reconciliation, within the caller transaction. */
  masterDataSnapshot(
    id: string,
    policy: RepositoryPolicy,
    connection: DatabaseConnection,
  ): Promise<Partial<Employee> | undefined>;

  /** Public administrative import/synchronization boundary; always enforces the supplied archive policy. */
  createEmployee(
    input: import('./service.js').CreateEmployeeInput,
    policy: RepositoryPolicy,
    actorId: string,
    options?: import('./service.js').EmployeeWriteOptions,
  ): Promise<import('./service.js').EmployeeView>;
  updateEmployee(
    id: string,
    input: import('./service.js').EmployeeInput,
    policy: RepositoryPolicy,
    actorId: string,
    options?: import('./service.js').EmployeeWriteOptions,
  ): Promise<import('./service.js').EmployeeView>;
  correctStatus(
    id: string,
    input: import('./service.js').CorrectStatusInput,
    policy: RepositoryPolicy,
    actorId: string,
    options?: Pick<import('./service.js').EmployeeWriteOptions, 'connection'>,
  ): Promise<import('./service.js').EmployeeView>;

  /** Bulk effective position and reporting-manager members for access administration. */
  accessMemberships(
    connection?: DatabaseConnection,
  ): Promise<ReadonlyMap<string, readonly string[]>>;
  /** Trusted onboarding only: disabled account, fixed probation/active archive, unique immutable source. Caller holds the headcount guard and consumes its requisition in this same transaction. */
  createForOnboarding(
    input: OnboardingEmployeeInput,
    origin: EmployeeWriteOrigin & { sourceApplication: string },
    connection: DatabaseConnection,
  ): Promise<Employee>;

  /**
   * Trusted cash/expense lifecycle callers only. Joins their transaction and returns just bank fields.
   * An HTTP caller must independently enforce payment-record and bank-field access before exposing this snapshot.
   */
  paymentAccountOf(
    userId: string,
    connection: DatabaseConnection,
  ): Promise<EmployeePaymentAccount | undefined>;
  /** Trusted private personnel logic only; HTTP owners must enforce their own ordinary and salary policies. */
  currentCompensationOf(
    employeeId: string,
    effectiveDate: string,
    connection: DatabaseConnection,
  ): Promise<EmployeeCompensation | undefined>;
  /** Scoped identity search only; these identities do not certify an occupied replacement source. */
  recruitmentReplacementCandidates(
    query: { departmentId: string; positionId: string; search?: string },
    policy: RepositoryPolicy,
    connection: DatabaseConnection,
  ): Promise<readonly { id: string; name: string; status: EmployeeStatus }[]>;
  getById(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<Employee | undefined>;
  getByUserId(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<Employee | undefined>;
  /** Batch form of `getByUserId`, keyed by user id. */
  getByUserIds(
    userIds: readonly string[],
    connection?: DatabaseConnection,
  ): Promise<ReadonlyMap<string, Employee>>;
  /**
   * The user's managers, nearest first, following `managerId` and skipping inactive employees (an inactive manager's
   * own manager takes their place). Stops at a cycle. Empty when the user has no archive or no active manager above.
   */
  managerChainOf(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<readonly Employee[]>;
  /** Batch equivalent of managerChainOf; one fresh graph in the caller connection. */
  managerChainsOf(
    userIds: readonly string[],
    connection?: DatabaseConnection,
  ): Promise<ReadonlyMap<string, readonly Employee[]>>;
  /** First element of `managerChainOf`: the effective direct manager. */
  managerOf(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<Employee | undefined>;
  /**
   * Active employees whose effective direct manager is the user (reports of an inactive intermediate move up).
   * Empty when the user is not an active employee.
   */
  directReportsOf(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<readonly Employee[]>;
  /**
   * Every employee below the user in the reporting line, any depth, active or not (a former employee's records stay
   * with the managers they reported to). Empty when the user is not an active employee. Cycle-safe; never the user.
   */
  reportsOf(
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<readonly Employee[]>;
  /** Whether `managerUserId` is an active manager anywhere above `userId` in the reporting line. */
  isAboveInReportingLine(
    managerUserId: string,
    userId: string,
    connection?: DatabaseConnection,
  ): Promise<boolean>;

  /**
   * Applies a status change from a flow's exit (the only way status changes outside the administrator's correction),
   * appends the history row and audits it, all on the given connection. Run it inside the flow's transaction.
   */
  applyStatusChange(
    input: ApplyStatusInput,
    origin: EmployeeWriteOrigin,
    connection: DatabaseConnection,
  ): Promise<Employee>;
  applyAssignmentChange(
    input: ApplyAssignmentInput,
    origin: { actorId: string; sourceApplication: string },
    connection: DatabaseConnection,
  ): Promise<Employee>;
  /** Appends a compensation row (regularization, salary change) and audits it. */
  appendCompensation(
    input: AppendCompensationInput,
    origin: EmployeeWriteOrigin,
    connection?: DatabaseConnection,
  ): Promise<EmployeeCompensation>;
  /** Appends a history row and audits it. Rejects salary amounts in `before`/`after`. */
  appendHistory(
    input: AppendHistoryInput,
    origin: EmployeeWriteOrigin,
    connection?: DatabaseConnection,
  ): Promise<EmployeeHistoryEntry>;
}

export const employeeServiceToken: ServiceToken<EmployeeService> =
  createServiceToken<EmployeeService>('oa/employee-service');

/** Record access key: 下属（含多级）. Every employee below the viewer in the reporting line. */
export const REPORTS_ACCESS = 'oa.reports';
/** Record access key: 本人及下属. The viewer and every employee below them. */
export const SELF_AND_REPORTS_ACCESS = 'oa.selfAndReports';

/** How a collection names the person a record belongs to. */
export interface ReportingScopeTarget {
  /** Column on the collection itself. */
  readonly field: string;
  /** Whether that column holds an authentication user id (an applicant) or an employee id. */
  readonly identifies: 'user' | 'employee';
}

/**
 * Makes the reporting-line record access (`oa.reports`, `oa.selfAndReports`) available on more collections.
 *
 * Call `use()` from a provider's `register()`: the employees provider defines the record access in its `boot()`, and
 * the authorization registry fixes a record access's collections when it is defined, so a later call throws.
 * ```ts
 * public override register(): void {
 *   this.app.container.resolve(reportingScopesToken).use('leaveRequests', { field: 'applicantId', identifies: 'user' });
 * }
 * ```
 * Then offer it on a composite grant with `.options(reportingScope.reports('leaveRequests'))`.
 */
export interface ReportingScopes {
  use(collection: string, target: ReportingScopeTarget): void;
  /** The collections and how each is matched. */
  targets(): ReadonlyMap<string, ReportingScopeTarget>;
}

export const reportingScopesToken: ServiceToken<ReportingScopes> =
  createServiceToken<ReportingScopes>('oa/reporting-scopes');

/** Typed references for `.options(...)` and `.default(...)` on a grant of `collection`. */
export const reportingScope = {
  reports(collection: string): RecordAccessReference<typeof REPORTS_ACCESS> {
    return { key: REPORTS_ACCESS, collections: [collection] };
  },
  selfAndReports(
    collection: string,
  ): RecordAccessReference<typeof SELF_AND_REPORTS_ACCESS> {
    return { key: SELF_AND_REPORTS_ACCESS, collections: [collection] };
  },
};

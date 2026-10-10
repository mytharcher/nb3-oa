/** Domain errors of the `employees` module; `server/routes/employees/` maps each code to an `ApiError`. */
export type EmployeeErrorCode =
  | 'EMPLOYEE_NOT_FOUND'
  | 'EMPLOYEE_USER_NOT_FOUND'
  | 'EMPLOYEE_USER_DISABLED'
  | 'EMPLOYEE_USER_TAKEN'
  | 'EMPLOYEE_CODE_TAKEN'
  | 'EMPLOYEE_MANAGER_NOT_FOUND'
  | 'EMPLOYEE_MANAGER_INACTIVE'
  | 'EMPLOYEE_MANAGER_CYCLE'
  | 'EMPLOYEE_POSITION_NOT_FOUND'
  | 'EMPLOYEE_GRADE_NOT_FOUND'
  | 'EMPLOYEE_STATUS_UNCHANGED'
  | 'EMPLOYEE_HISTORY_SALARY'
  | 'EMPLOYEE_INVALID_AMOUNT';

/** The input field each code is about, for an `INVALID_ARGUMENT` field violation. */
export const EMPLOYEE_ERROR_FIELDS: Partial<Record<EmployeeErrorCode, string>> =
  {
    EMPLOYEE_USER_NOT_FOUND: 'userId',
    EMPLOYEE_USER_DISABLED: 'userId',
    EMPLOYEE_USER_TAKEN: 'userId',
    EMPLOYEE_CODE_TAKEN: 'code',
    EMPLOYEE_MANAGER_NOT_FOUND: 'managerId',
    EMPLOYEE_MANAGER_INACTIVE: 'managerId',
    EMPLOYEE_MANAGER_CYCLE: 'managerId',
    EMPLOYEE_POSITION_NOT_FOUND: 'positionId',
    EMPLOYEE_GRADE_NOT_FOUND: 'gradeId',
    EMPLOYEE_INVALID_AMOUNT: 'baseSalary',
  };

export class EmployeeError extends Error {
  public readonly code: EmployeeErrorCode;

  public constructor(code: EmployeeErrorCode, message: string) {
    super(message);
    this.name = 'EmployeeError';
    this.code = code;
  }
}

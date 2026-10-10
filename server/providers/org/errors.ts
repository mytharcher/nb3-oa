export type OrgErrorCode =
  | 'INVALID_INPUT'
  | 'DEPARTMENT_NOT_FOUND'
  | 'DEPARTMENT_CODE_EXISTS'
  | 'PARENT_NOT_FOUND'
  | 'PARENT_CYCLE'
  | 'EXECUTIVE_TOP_LEVEL_ONLY'
  | 'USER_NOT_FOUND'
  | 'MEMBER_NOT_FOUND'
  | 'POSITION_NOT_FOUND'
  | 'POSITION_CODE_EXISTS'
  | 'GRADE_NOT_FOUND'
  | 'GRADE_CODE_EXISTS'
  | 'DUTY_ROLE_NOT_FOUND';

/**
 * A rule of the organisation refused the operation. The service knows nothing about HTTP; the routes turn each code
 * into an `ApiError` whose `reason` is the code, and `field` names the input the error is about, when there is one.
 */
export class OrgError extends Error {
  public readonly code: OrgErrorCode;
  public readonly field: string | undefined;

  public constructor(code: OrgErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'OrgError';
    this.code = code;
    this.field = field;
  }
}

export class AuthorizationFormError extends Error {
  constructor(
    readonly key:
      | 'errors.completePermissions'
      | 'errors.completeRule'
      | 'databasePolicy.conditionRequired',
  ) {
    super(key);
  }
}

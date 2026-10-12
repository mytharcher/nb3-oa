export default {
  authz: {
    ownedScope: 'Own asset applications',
    resource: 'Asset applications',
    view: 'Read asset applications',
    viewValue: 'Read asset original values',
    create: 'Create own asset applications',
    edit: 'Edit own asset applications',
    operate: 'Perform authorized asset approval and handling actions',
    returnIssued: 'Confirm physical return of issued use assets',
  },
  errors: {
    ASSET_RETURN_REASON_REQUIRED: 'Enter the physical receipt reason.',
    ASSET_ACCESS_DENIED: 'You cannot access this asset request.',
    ASSET_ACTION_INVALID: 'This action is not available for the request.',
    ASSET_REQUEST_NOT_FOUND: 'Asset request not found.',
    ASSET_INVALID_COMMAND:
      'Enter a stable request identifier and the required reason.',
    ASSET_REQUEST_REUSED:
      'This request identifier is bound to another operation.',
    ASSET_REQUIRED_FIELDS:
      'Complete the purpose, quantity and asset selection.',
    ASSET_CATEGORY_INACTIVE: 'Choose an active asset category.',
    ASSET_EMPLOYEE_INACTIVE:
      'The applicant must have an active employee record.',
    ASSET_DEPARTMENT_MISSING:
      'The applicant needs an active primary department.',
    ASSET_HEAD_MISSING: 'The department needs an active head approver.',
    ASSET_BORROW_DATE_INVALID:
      'Choose a valid future company-local return date.',
    ASSET_SCRAP_REQUIRED: 'Select one asset, enter the scrap reason and attach a photo.',
    ASSET_SCRAP_INELIGIBLE:
      'Only an eligible held asset or administrator-controlled stock item can be scrapped.',
    ASSET_PHOTO_DENIED: 'The request or its photo field is not accessible.',
    ASSET_PHOTO_INVALID:
      'Choose at most ten valid photos linked to this request.',
    ASSET_PHOTO_SIZE: 'Each photo must be no larger than 5 MiB.',
    ASSET_PHOTO_TYPE: 'Upload a valid JPEG, PNG or WebP image.',
    ASSET_STOCK_SHORTAGE:
      'There are not enough available units for this complete request.',
    ASSET_INVALID_QUANTITY: 'Confirm a whole quantity between 1 and 100.',
    ASSET_INVALID_AMOUNT:
      'The stored asset value is outside the supported exact range.',
    ASSET_NOT_FOUND: 'An asset in this request was not found.',
    ASSET_INVALID_VERSION: 'Load the current asset version.',
    ASSET_VERSION_CONFLICT: 'The asset changed. Reload it before confirming.',
    ASSET_ALREADY_RESERVED: 'An asset is reserved by another application.',
    ASSET_EXISTING_HOLD:
      'Resolve the existing reservation before changing stock.',
    ASSET_HOLD_MISMATCH: 'The actual reservation does not match this request.',
    ASSET_BASELINE_CONFLICT:
      'Asset facts changed after approval. Return for review before execution.',
    ASSET_UNITS_INCOMPLETE:
      'Confirm every allocated unit and its actual serial number.',
    ASSET_SERIAL_MISMATCH: 'The serial number differs from the actual asset.',
    ASSET_RETURN_MISMATCH:
      'The returned items do not match the actual issued custody.',
    ASSET_ALREADY_RETURNED: 'This asset has already been returned.',
    ASSET_RETURN_FORBIDDEN:
      'An active asset administrator must confirm physical return.',
    ASSET_RETURN_INELIGIBLE:
      'This request is not an eligible issued use request.',
    ASSET_ALLOCATION_MISSING: 'The complete real allocation is missing.',
    ASSET_SOURCE_UNAVAILABLE: 'The asset application source is unavailable.',
    ASSET_SOURCE_MISSING: 'The owning asset application no longer exists.',
    ASSET_SOURCE_FORBIDDEN:
      'The source has not authorized this stock operation.',
    ASSET_SOURCE_MISMATCH:
      'The stock source does not match the actual application.',
    ASSET_TARGET_MISMATCH: 'The approval target belongs to another request.',
    ASSET_DIRECTORY_UNAVAILABLE: 'A fresh approval directory is required.',
    ASSET_SLA_UNSUPPORTED:
      'This release supports only the default 24/48 working-hour approval clocks.',
  },
  schedule: {
    title: 'Borrowed asset return reminders',
    description:
      'Daily company-local due-date and weekly overdue reminders. Pending delivery is reported as a failed occurrence.',
  },
  reminders: {
    before:
      'Asset application {{number}}: {{quantity}} borrowed item(s) are due on {{date}}. Please arrange physical return.',
    overdue:
      'Asset application {{number}}: {{quantity}} borrowed item(s) were due on {{date}} and remain unreturned.',
  },
};

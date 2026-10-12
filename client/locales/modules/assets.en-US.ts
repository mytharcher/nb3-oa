export default {
  authz: {
    returnHeld: 'Confirm physical return of legacy held assets',
    resource: 'Asset register',
    view: 'Read asset register and original value',
    viewHeld: 'Read assets held by me',
    manage: 'Record and correct asset descriptions',
    heldScope: 'Assets held by me',
  },
  errors: {
    ASSET_RETURN_FORBIDDEN:
      'An active asset administrator must confirm the physical return.',
    ASSET_REQUEST_REUSED:
      'This return request key already identifies a different receipt.',
    ASSET_RETURN_INELIGIBLE:
      'Confirm the actual held item, employee and serial number.',
    ASSET_RETURN_FLOW_REQUIRED:
      'Resolve this asset through its actual application before confirming return.',

    ASSET_ACCESS_DENIED: 'You do not have permission for this asset operation.',
    ASSET_NOT_FOUND: 'Asset not found.',
    ASSET_INVALID_INPUT:
      'Enter an asset code, name and a nonnegative exact value in cents.',
    ASSET_CATEGORY_INACTIVE: 'Choose an active asset category.',
    ASSET_INVALID_COMMAND: 'An actor and correction reason are required.',
    ASSET_INVALID_VERSION: 'Enter the current asset version.',
    ASSET_VERSION_CONFLICT: 'This asset has changed. Load its latest version.',
    ASSET_CODE_EXISTS: 'This asset code already exists.',
    ASSET_INVALID_STORED_AMOUNT:
      'The stored asset value is outside the supported exact range.',
    ASSET_WRITE_UNCONFIRMED: 'The asset write could not be confirmed.',
    ASSET_DEPARTURE_NOT_CLEARED:
      'Assigned, borrowed or reserved assets must be returned before departure clearance.',
  },
};

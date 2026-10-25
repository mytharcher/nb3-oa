export default {
  access: {
    permissionColumn: 'Permission',
    personalGranted: 'Personally granted',
    personalTarget: 'Choose personal grant destination',
    rowSaving: 'Saving…',
    rowSaved: 'Saved',
    rowFailed:
      'Change not saved. Current configuration has been restored; review and try again.',
    rowUncertain:
      'Save result could not be confirmed. Refresh before making further changes.',
    inlinePermissionsHelp:
      'Changes save immediately. Personal grants add to inherited access; switching them off does not remove inherited permissions.',
    configuredOnly: 'Configured permissions only',

    personalGrantEnabled: 'Grant this operation personally',
    systemScope: 'Use system rules',
    systemScopeHelp:
      'Unspecified scopes follow default access and sharing rules. This does not mean all records.',
    grantSources: 'Granted by',
    scopeForAction: '{{action}}: {{scope}} scope',
    personalGrantAction: 'Personally grant “{{action}}”',
    personalGrantScope: 'Personally grant “{{action}}”. Data scope: {{scope}}',
    personalGrantOff: 'No personal grant; inherited permissions remain.',
    personalGrantPending: 'Unsaved change. Takes effect after saving.',
    editPersonalCard: 'Edit personal permissions for {{name}}',
    userPermissions: 'Permissions',
    inheritedPermissions: 'Inherited permissions',
    inheritedUnavailable: 'You do not have access to inherited permissions.',
    personalOnly: 'Personal exceptions only',
    notGranted: 'Not granted',
    notSet: 'Not set',
    adjustPersonalPermissions: 'Adjust personal permissions',
    unifiedPermissionsHelp:
      'Configured permissions by source. Personal changes do not remove inherited grants; actual access also follows applicable restrictions.',
    sourceGroups: {
      baseline: 'Everyone baseline',
      duties: 'Functional roles',
      organization: 'Organization relationships',
      direct: 'Personal grants',
      system: 'System administrator',
    },
    noPersonalExceptions: 'No personal exceptions',
    membershipChanged:
      'Membership changed in another operation. The current state has been reloaded; confirm the remaining changes.',
    username: 'Username',
    personalExceptions: 'Personal exceptions',
    adjustExceptions: 'Adjust personal exceptions',
    exceptionsHelp:
      'Only permissions granted directly to this person are changed. Role or organization permissions may still apply after removal.',
    editDenied:
      'You cannot edit this configuration. Showing the read-only view.',
    permissionSources: 'Permission sources',
    frozenConfiguration:
      'This account is frozen. Authorization configuration is retained and applies under the rules in effect when activated.',
    frozenRoles:
      'This account is frozen. Activate it before adding functional roles; existing roles can be removed.',
    roleInactive: 'Inactive',
    roleAdditionBlocked:
      'The account is frozen or a selected role is inactive or unavailable. Cancel these additions, or reload the state before confirming.',
    membershipUnverified:
      'The outcome is unverified. Reload memberships before continuing; do not repeat the submission.',
    dutyRolesHelp:
      'Functional roles directly assigned to this person appear here.',
    noPrimaryDepartment: 'No current primary department',
    primaryDepartment: 'Primary department',
    departmentPath: 'Department path',
    organizationHelp:
      'Organization membership is maintained by organization administrators.',
    roleFilterInvalid:
      'This functional role is unavailable. The role filter was cleared.',
    roleFilterTooLarge:
      'This role has more than 500 members. Filtering by this role is not supported; clear the role filter.',
    organizationState: {
      'inactive-chain':
        'The primary department or an ancestor is inactive. This organization relationship does not currently apply.',
      'invalid-chain':
        'This organization relationship is invalid. Contact an organization administrator.',
    },

    scopeNumber: 'Record scope {{number}}',
    scopeLabels: {
      paymentRequests: 'Payment requests',
      reimbursementRequests: 'Reimbursement requests',
      leaveRequests: 'Leave requests',
      contractRequests: 'Contract approval requests',
      certificateRequests: 'Certificate requests',
      sealRequests: 'Seal requests',
      printTemplates: 'Templates',
      printTemplateRevisions: 'Template versions',
      knowledgeDocuments: 'Documents',
      knowledgeVersions: 'Document versions',
      knowledgeFolders: 'Folders',
      sealLedger: 'Seal registrations',
      sealReceipts: 'Seal receipts',
      contracts: 'Contracts',
      contractVersions: 'Contract versions',
      contractChanges: 'Contract changes',
      contractPayments: 'Contract payments',
    },
    sourceNumber: 'Source {{number}}',
    more: 'More',
    userRoles: 'Roles',
    permissionOverview: 'Permissions overview',
    noRoles: 'None',
    organization: 'Organization',
    moreFor: 'More · {{name}}',
    addModules: 'Add modules',
    userDetails: 'User details',
    information: 'Information',
    email: 'Email',
    accountStatus: 'Account status',
    enabled: 'Active',
    disabled: 'Frozen',
    organizationReadOnly:
      'Departments, positions and reporting relationships are maintained in Organization.',
    advancedExceptions: 'Advanced: exception grants',
    partialSave:
      '{{count}} changes saved. Remaining changes are retained; retry to continue.',
    addedRoles: 'Add: {{names}}',
    removedRoles: 'Remove: {{names}}',
    compareRole: 'Compare role',
    copyRole: 'Copy from comparison',
    copyHelp:
      'Copy ordinary grants into this draft. Special policies stay unchanged. Review all changes before saving.',
    advanced: 'Advanced',
    addRoles: 'Add roles to comparison',

    directAudience: 'Individual assignments',
    dutyAudience: 'Duty role members',

    targetSet: 'Destination permission set',
    chooseTarget: 'Choose a permission set for this operation',
    targetRequired:
      'Choose a destination for this new operation before saving.',
    roleGrantTitle: '{{module}} ({{role}} · independent grant {{number}})',

    assignmentSearch: 'Search permissions, actions or record scopes',
    assignmentOnlySelected: 'Selected only',
    assignmentCount:
      'Showing {{visible}} of {{total}} · {{selected}} selected across all modules',
    assignmentChoicesHelp:
      'Filter by module, then compare actions and record scopes. Sets with the same name remain independent. Filters preserve selections in other modules.',
    assignmentBusiness: 'Business operations',
    assignmentOther: 'Administration / other',
    pageAccess: 'Page access',
    configuredGrant: 'Granted',
    dutyMembershipTitle: '{{action}} duty role "{{role}}" for "{{name}}"?',
    exceptionSummary: 'Exception grants: {{names}}',
    noExceptions: 'None',
    baseOnlyDepartment:
      'Department access reaches descendant members. Prefer duty roles for specialist operations.',

    adminMembersHelp:
      'Manage administrators in user accounts. Keep at least one active administrator.',
    openUsers: 'View user accounts',
    ruleLinks: 'Access rules',
    rulesHelp:
      'Default access, sharing and restriction rules still affect effective access.',
    defaultRules: 'Default access',
    sharingRules: 'Sharing rules',
    restrictionRules: 'Restriction rules',

    modules: 'Browse by module',
    onlyConfigured: 'Configured only',
    baselineValue: 'Everyone has baseline access: {{value}}',
    advancedEdit: 'Advanced editor',
    changedCount: '{{count}} changes',
    roleImpact: 'Affected members of "{{name}}": {{count}}',
    sharedObjects: 'Permission sets are also assigned to: {{names}}',
    changeShared: 'Change all these subjects',
    splitDefault:
      'By default, split shared sets into independent copies for this role.',
    userPermissionsTitle: 'Permissions for {{name}}',
    unionHelp:
      'Record scopes from multiple sources are combined; access rules still apply.',
    assignedRoles: 'Assigned roles',
    preferRoles: 'Prefer duty roles; direct grants are for exceptions.',
    exceptionGrant: 'Manage exception grants',
    configurationDenied:
      'Permission-set read access is required to view configuration details. Contact an administrator.',
    checkOperation: 'Check an operation',
    notConfigured: 'Not configured',
    applicable: 'Applies to',
    modulesCount: 'Configured modules',
    personalAudience: 'Direct assignment · {{count}} people',
    maintainedAudience: 'Managed members · {{count}} people',
    automaticAudience: 'Calculated from organization relationships',
    departmentAudience: 'Department and descendant members',
    positionAudience: 'People holding this position',
    allAuthenticated: 'All signed-in people',
    organizationMembersHelp:
      'Members are maintained in the organization and calculated from active relationships.',
    openOrganization: 'View organization',
    adjustDutyRoles: 'Adjust duty roles',
    membersUnknown: 'Member count unavailable',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Clear filters',
    noModuleMatches: 'No permissions match in this module',

    businessModules: 'Business modules',
    allModules: 'All',
    otherModules: 'Other',
    noModulePermissions: 'No permissions configured in this module',
    moduleCount: '{{module}}: {{configured}} configured / {{total}} resources',

    actionsFor: 'Actions for "{{name}}"',
    configuredScopes: 'Configured scopes',

    lastAdmin:
      'At least one active system administrator must remain. Assign a replacement first.',
    subjectNotAllowed:
      'This access cannot be assigned to this type of subject. Choose different business access.',

    title: 'Access management',
    description: 'Configure business operations and record scopes by role.',
    roles: 'Role access',
    baseline: 'Signed-in baseline access',
    baselineHelp:
      'Baseline access applies to signed-in accounts. Duty membership also affects approval candidates.',
    name: 'Name',
    type: 'Type',
    all: 'All types',
    dutyRoles: 'Functional roles',
    positions: 'Positions',
    departments: 'Departments',
    automatic: 'Automatic access',
    members: 'Members',
    permissions: 'Business permissions',
    missingMembers: 'No members assigned',
    memberDenied: 'Member access unavailable',
    membersFailed: 'Could not load members',
    byMembership: 'Applied by membership',
    none: 'No business access assigned',
    noneHelp:
      'Assign existing business access after confirming responsibilities. Inherited access remains in effect.',
    searchRoles: 'Search roles, positions or departments…',
    clear: 'Clear filters',
    noResults: 'No matching results',
    clearHelp: 'Change your search or clear the filters.',
    loading: 'Loading',
    refresh: 'Refresh',
    denied:
      'You do not have access to this operation. Contact an access administrator.',
    missing: 'This item no longer exists. Return to the list.',
    conflict: 'Access configuration changed. Reload and review before saving.',
    failed:
      'Could not complete this operation. Try again or contact an administrator.',
    reload: 'Reload',
    retry: 'Retry',
    roleHelp:
      "Review this responsibility's members, business operations and record scopes.",
    rules:
      "Additional access rules may apply. Check the person's access and the actual business operation.",
    actions: 'Actions',
    addMember: 'Add member',
    remove: 'Remove',
    memberImpact:
      'Duty membership affects inherited access and approval candidates. Other access sources remain after removal.',
    assign: 'Assign business access',
    usedBy:
      'This access is assigned to {{count}} subjects. Editing affects all of them.',
    edit: 'Edit',
    special: 'Existing custom configuration',
    specialReadOnly:
      'Custom configuration is read-only and will be preserved on save.',
    noScope: 'No record scope configured',
    systemAdmin: 'System administrator',
    unrestricted: 'System administrator: unrestricted access',
    removeTitle: 'Remove member "{{name}}"?',
    cancel: 'Cancel',
    removed: 'Removed "{{name}}"',
    added: 'Added "{{name}}"',
    addMemberTitle: 'Add {{name}} member',
    add: 'Add',
    person: 'Person',
    selectPerson: 'Select the person who will hold this responsibility.',
    userDenied: 'You cannot view the user directory. Contact an administrator.',
    direct: 'Assigned directly',
    inherited: 'Inherited access',
    personUnknown: 'Person (name unavailable)',
    back: 'Return to list',
    pageActionHelp:
      'Page access controls the menu and entry. Grant each business operation and its record scopes separately; opening a page alone does not grant its actions.',
    emptyDirectory: 'No subjects available',
    emptyHelp: 'No records are currently available in this directory.',
    deniedAction: 'Not authorized',
    sensitive: 'Sensitive access',
    impactUnavailable:
      'The complete impact cannot be verified. Check the affected subjects and their visibility before changing this shared access.',
    conditional: 'Conditional access',
    permitted: 'Unconditional access',
    assignTitle: 'Change access for "{{name}}"',
    assignHelp:
      "Select this subject's direct business access. Other sources are preserved.",
    noAssignable: 'No assignable business access',
    preserveInherited:
      'Only direct assignments change here. Access inherited from departments, positions, duties and the baseline remains.',
    save: 'Save',
    saved: 'Saved access for "{{name}}"',
    confirmTitle: 'Save access changes for "{{name}}"?',
    assignmentImpact:
      'Review added and removed access. Other sources remain; a system administrator must remain active.',
    discardTitle: 'Discard unsaved changes?',
    discard: 'Discard',
    discardHelp: 'Your changes have not been saved. Discarding removes them.',
    editTitle: 'Edit business access for "{{name}}"',
    editorHelp:
      'Select operations and scopes individually. Sensitive operations are separate; review the impact before saving.',
    impact: 'Affected subjects',
    searchActions: 'Search business features or operations…',
    multipleScopes: 'Configure each of the scopes below for this operation.',
    levelFor: 'Record scope for "{{name}}"',
    protected: 'This access is protected',
    protectedHelp:
      'System protection remains. Manage administrator membership through user accounts.',
    sharedHelp:
      'This change affects every subject listed above. Review the operations and scopes.',
    system: 'System responsibilities',
  },
};

/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Departments',
      positions: 'Positions',
      grades: 'Grades',
      dutyRoles: 'Duty roles',
    },
    authz: {
      section: 'Organization and people',
      departments: 'Departments',
      positions: 'Positions',
      grades: 'Grades',
      dutyRoles: 'Duty roles',
      read: 'View',
      update: 'Manage',
    },
    subjects: {
      departments: 'Departments',
      heads: 'Department heads',
      dutyRoles: 'Duty roles',
      disabled: 'Disabled',
    },
    scopes: {
      mine: 'My departments',
      mineHint:
        'Records owned by members of the departments I belong to or head.',
      mineAndBelow: 'My departments and below',
      mineAndBelowHint:
        'Records owned by members of my departments and of every department below them.',
      headed: 'Departments I head and below',
      headedHint:
        'Records owned by members of the departments I head and of every department below them.',
    },
    dutyRoleTitles: {
      gm: 'General manager',
      cfo: 'CFO',
      hr: 'HR specialist',
      hrbp: 'HRBP',
      hrDirector: 'HR director',
      admin: 'Administration',
      sealKeeper: 'Seal keeper',
      finance: 'Accountant',
      financeManager: 'Finance manager',
      cashier: 'Cashier',
      legal: 'Legal',
      purchasing: 'Purchasing',
      it: 'IT',
      committeeTech: 'Review committee (technical seat)',
    },
    common: {
      active: 'Enabled',
      inactive: 'Disabled',
      allStatuses: 'All statuses',
      noResults: 'Nothing matches your filters.',
      clearFilters: 'Clear filters',
      clearSearch: 'Clear search',
      searchByTitleOrCode: 'Search by name or code',
      askAdministrator: 'Ask an administrator to set this up.',
      fields: {
        title: 'Name',
        code: 'Code',
        status: 'Status',
        name: 'Name',
        email: 'Email',
        user: 'Person',
      },
      actions: {
        label: 'Actions',
        more: 'Actions for {{name}}',
        edit: 'Edit',
        enable: 'Enable',
        disable: 'Disable',
      },
      form: {
        titleRequired: 'Enter a name.',
        titleTooLong: 'Use at most {{max}} characters.',
        codeRequired: 'Enter a code.',
        codeFormat:
          'Use letters, digits, ".", "_" and "-", starting with a letter or digit, up to 64 characters.',
        codeHint: 'A stable identifier used by imports and other systems.',
        integer: 'Enter a whole number.',
        userRequired: 'Choose a person.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Only top-level departments may appoint an executive; child departments inherit it.',
      codeTaken: 'This code is already used. Choose another one.',
      parentCycle:
        'A department cannot be moved below itself or one of its sub-departments.',
      parentNotFound:
        'The parent department no longer exists. Choose another one.',
      userNotFound: 'This person does not exist or is disabled.',
      notFound: 'This record does not exist or has been deleted.',
      forbidden: 'You do not have permission to do this.',
      requestFailed: 'The request failed. Please try again.',
    },
    departmentPicker: {
      placeholder: 'Search departments',
      empty: 'No matching departments',
      loadFailed: 'Unable to load departments.',
      inactivePath: '{{path}} (disabled)',
    },
    departments: {
      title: 'Departments',
      description:
        'Maintain the department tree, heads and members. Disabling a department disables everything below it.',
      create: 'New department',
      createChild: 'New sub-department',
      editTitle: 'Edit department',
      formDescription:
        'Changing the parent moves the department together with everything below it.',
      created: 'Created department "{{name}}"',
      saved: 'Saved department "{{name}}"',
      enabled: 'Enabled department "{{name}}"',
      disabled: 'Disabled department "{{name}}"',
      disableTitle: 'Disable department "{{name}}"?',
      disableDescription:
        'Its sub-departments stop counting too, and members no longer inherit its permissions. Nothing is deleted; you can enable it again at any time.',
      loadFailed: 'Unable to load departments',
      emptyTitle: 'No departments yet',
      emptyDescription:
        'Create the top of your organization, then add departments below it.',
      noResults: 'No departments match your search.',
      searchPlaceholder: 'Search by department name or code',
      treeLabel: 'Department tree',
      choose: 'Choose a department on the left to see its details.',
      notFound: 'This department does not exist or has been deleted.',
      backToTree: 'Back to the tree',
      topLevel: 'Top-level department',
      inheritedFrom: '(inherited from "{{name}}")',
      inactiveByAncestor: 'Disabled with "{{name}}"',
      fields: {
        parent: 'Parent department',
        manager: 'Department head',
        executive: 'Executive in charge',
        sortOrder: 'Sort order',
      },
      form: {
        codeHint: 'Optional. Imports update departments by code.',
        parentPlaceholder: 'Top level (no parent)',
        parentHint: 'Leave empty for a top-level department.',
        managerHint:
          'Approvals go to this person; they need not be a member. Empty: the head of the parent department.',
        executiveHint:
          'Set on top-level departments only. Selecting a parent clears this field; child departments inherit it.',
        sortOrderHint: 'Smaller numbers come first among siblings.',
      },
      members: {
        title: 'Members ({{count}})',
        description:
          'Direct members. Each person has one primary department, which approvals and budgets use.',
        add: 'Add member',
        addTitle: 'Add member to "{{name}}"',
        added: 'Added "{{name}}" to "{{department}}"',
        primary: 'Department type',
        primaryBadge: 'Primary',
        secondaryBadge: 'Secondary',
        makePrimary: 'Make primary department',
        primarySet: '"{{name}}" now has this as their primary department',
        makePrimaryField: 'Make this their primary department',
        makePrimaryHint:
          'Replaces their current primary department. Left unchecked, it becomes primary only if they have none.',
        remove: 'Remove from department',
        removeTitle: 'Remove "{{name}}" from "{{department}}"?',
        removeDescription:
          "They stop inheriting this department's permissions. If it was their primary department, they will have none until you set another.",
        removed: 'Removed "{{name}}" from "{{department}}"',
        loadFailed: 'Unable to load members',
        emptyTitle: 'No members yet',
        emptyDescription: 'Add the people who work in this department.',
      },
    },
    positions: {
      title: 'Positions',
      description:
        'Job positions employee archives refer to. Disable a position instead of deleting it.',
      create: 'New position',
      editTitle: 'Edit position',
      formDescription: 'The code stays stable when the name changes.',
      created: 'Created position "{{name}}"',
      saved: 'Saved position "{{name}}"',
      enabled: 'Enabled position "{{name}}"',
      disabled: 'Disabled position "{{name}}"',
      disableTitle: 'Disable position "{{name}}"?',
      disableDescription:
        'It is no longer offered for new assignments. Employees who hold it keep it.',
      loadFailed: 'Unable to load positions',
      notFound: 'This position does not exist or has been deleted.',
      emptyTitle: 'No positions yet',
      emptyDescription:
        'Add the positions employees are hired into, such as "Buyer".',
      fields: { number: 'Sort order' },
      form: {
        numberRequired: 'Enter a sort order.',
        numberHint: 'Optional. Smaller numbers come first.',
      },
    },
    grades: {
      title: 'Grades',
      description:
        'Job grades such as P5 or M2. The rank decides seniority in travel standards and approval tiers.',
      create: 'New grade',
      editTitle: 'Edit grade',
      formDescription: 'The code stays stable when the name changes.',
      created: 'Created grade "{{name}}"',
      saved: 'Saved grade "{{name}}"',
      enabled: 'Enabled grade "{{name}}"',
      disabled: 'Disabled grade "{{name}}"',
      disableTitle: 'Disable grade "{{name}}"?',
      disableDescription:
        'It is no longer offered for new assignments. Employees who hold it keep it.',
      loadFailed: 'Unable to load grades',
      notFound: 'This grade does not exist or has been deleted.',
      emptyTitle: 'No grades yet',
      emptyDescription:
        'Add your grades with a rank; higher ranks are more senior.',
      fields: { number: 'Rank' },
      form: {
        numberRequired: 'Enter a rank.',
        numberHint: 'A whole number; higher is more senior.',
      },
    },
    dutyRoles: {
      title: 'Duty roles',
      description:
        'Approvals and handling steps find people through these roles. Assign what each role may do in the authorization settings.',
      viewMembers: 'View members',
      drawerDescription:
        'People who hold this duty. Approval steps assigned to the role go to them.',
      enabled: 'Enabled duty role "{{name}}"',
      disabled: 'Disabled duty role "{{name}}"',
      disableTitle: 'Disable duty role "{{name}}"?',
      disableDescription:
        'Its members stop holding the role: approval steps find nobody in it and permissions assigned to it stop applying. Members are kept.',
      loadFailed: 'Unable to load duty roles',
      detailFailed: 'Unable to load the duty role',
      notFound:
        'This duty role does not exist. Close this panel to return to the list.',
      emptyTitle: 'No duty roles',
      emptyDescription:
        'Duty roles are installed with the application. Ask an administrator to check the installation.',
      fields: {
        code: 'Code',
        memberCount: 'Members',
        description: 'Description',
      },
      members: {
        title: 'Members ({{count}})',
        add: 'Add member',
        addTitle: 'Add member to "{{role}}"',
        added: 'Added "{{name}}" to "{{role}}"',
        remove: 'Remove',
        removeTitle: 'Remove "{{name}}" from "{{role}}"?',
        removeDescription:
          'They no longer receive approvals for this role or the permissions assigned to it.',
        removed: 'Removed "{{name}}" from "{{role}}"',
        alreadyRemoved: 'This person had already been removed.',
        emptyTitle: 'No members yet',
        emptyDescription:
          'Add the people who hold this duty. Approval steps for it wait until someone is added.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;

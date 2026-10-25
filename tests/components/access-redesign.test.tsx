import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { UserPermissionTable } from '../../client/pages/access/user-permission-table.js';
import { RoleMatrix } from '../../client/pages/access/role-matrix.js';
import UnifiedUserPermissions from '../../client/pages/access/user-permissions-unified.js';
import { resourceKey } from '../../client/pages/administration/authorization/pages/permission-sets/drafts.js';
import { legacyUserLink } from '../../client/pages/access/user-url.js';
import UserPermissions from '../../client/pages/access/user-permissions.js';
import { roleRows, sensitiveSummary } from '../../client/pages/access/model.js';
import type {
  AccessSnapshot,
  AuthorizationOptions,
} from '../../client/pages/access/types.js';
const { api, client, read, saved } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  client: {
    loadOptions: vi.fn(),
    resolveSubjects: vi.fn(),
    inspectConfigured: vi.fn(),
    inspect: vi.fn(),
    inspectBatch: vi.fn(),
  },
  read: { value: true },
  saved: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
  useNavigationGuard: () => undefined,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can: resource?.id === 'authorization.permission-sets' ? read.value : true,
  }),
}));
vi.mock(
  '../../client/pages/administration/authorization/use-authorization-client.js',
  () => ({ useAuthorizationClient: () => client }),
);
vi.mock(
  '../../client/pages/administration/authorization/components/use-resource-options.js',
  () => ({ useResourceOptions: (options: unknown) => options }),
);
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const options: AuthorizationOptions = {
  sections: [
    {
      value: 'business',
      label: 'Business',
      subsections: [
        {
          value: 'org',
          label: 'Organization',
          actions: [],
          groups: [],
          resources: [
            {
              type: 'settings',
              value: 'oa.org.positions',
              label: 'Positions',
              actions: [
                { value: 'read', label: 'Read' },
                { value: 'update', label: 'Update' },
              ],
            },
          ],
        },
      ],
    },
  ],
  subjectTypes: [],
  collections: [],
  recordAccess: [],
};
const snapshot: AccessSnapshot = {
  revision: 'a'.repeat(64),
  sets: [
    {
      key: 'source',
      grants: [
        {
          resource: { type: 'settings', id: 'oa.org.positions' },
          actions: [{ action: 'read' }],
        },
      ],
    },
  ],
  assignments: [
    {
      id: 'assignment',
      permissionSet: 'source',
      subject: { type: 'org.dutyRole', id: 'hr' },
    },
  ],
};
function mount(
  element: React.ReactElement,
  path = '/access/roles/:type/:id/permissions',
  url = '/access/roles/org.dutyRole/hr/permissions',
) {
  const router = createMemoryRouter([{ path, element }], {
    initialEntries: [url],
  });
  render(
    <TestI18nProvider runtime={runtime} namespace='nb3-oa'>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  read.value = true;
  api.request.mockResolvedValue({ data: snapshot });
  client.resolveSubjects.mockResolvedValue([
    { id: 'user', title: 'Test user' },
  ]);
  client.loadOptions.mockResolvedValue({
    sections: [
      {
        name: 'business',
        title: 'Business',
        subsections: [
          {
            name: 'org',
            title: 'Organization',
            resources: [
              {
                type: 'settings',
                id: 'oa.org.positions',
                title: 'Positions',
                actions: [{ name: 'read', title: 'Read' }],
              },
            ],
          },
        ],
      },
    ],
    subjectTypes: [],
    recordAccess: [],
    collections: [],
  });
  client.inspectConfigured.mockResolvedValue({
    unrestricted: false,
    identity: { subjects: [] },
    sets: [{ key: 'source', sources: [{ type: 'user', id: 'user' }] }],
  });
});
it('saves role changes only after confirmation with the snapshot revision', async () => {
  mount(
    <RoleMatrix
      snapshot={snapshot}
      options={options}
      name='HR'
      canEdit
      saved={saved}
      reload={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole('switch', { name: /Update/ }));
  await userEvent.click(await screen.findByRole('button', { name: 'Save' }));
  expect(api.request).not.toHaveBeenCalled();
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
    }),
  );
  await waitFor(() => expect(saved).toHaveBeenCalledWith(snapshot));
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PUT',
      json: {
        expectedRevision: snapshot.revision,
        sharedSets: 'split',
        changes: [
          {
            resource: { type: 'settings', id: 'oa.org.positions' },
            action: 'update',
            value: { scopes: {} },
          },
        ],
      },
    }),
  );
});
it('keeps equal duplicates and disjoint module operations editable while isolating wildcards', () => {
  const duplicate = { ...snapshot.sets[0], key: 'other' };
  expect(
    roleRows(options, [snapshot.sets[0], duplicate]).every(
      (row) => !row.custom,
    ),
  ).toBe(true);
  const split = {
    ...duplicate,
    grants: [
      {
        resource: { type: 'settings', id: 'oa.org.positions' },
        actions: [{ action: 'update' }],
      },
    ],
  };
  expect(
    roleRows(options, [snapshot.sets[0], split]).every((row) => !row.custom),
  ).toBe(true);
  const wildcard = {
    key: 'wild',
    grants: [
      {
        resource: { type: 'settings', id: '*' },
        actions: [{ action: 'read' }],
      },
    ],
  };
  const rows = roleRows(options, [wildcard]);
  expect(rows.find((row) => row.action === 'read')?.custom).toBe(true);
  expect(rows.find((row) => row.action === 'update')?.custom).toBe(false);
});
it('shows configured permissions without an operation inspection form or decision requests', async () => {
  mount(
    <UserPermissions />,
    '/users/:userId/permissions',
    '/users/user/permissions',
  );
  await screen.findByText('Permissions for Test user');
  await screen.findByText(enUS.access.permissionSources);
  expect(
    screen.queryByRole('button', { name: 'Check an operation' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'Check an operation' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: enUS.access.searchActions }),
  ).not.toBeInTheDocument();
  expect(client.inspectConfigured).toHaveBeenCalledTimes(1);
  expect(client.inspectBatch).not.toHaveBeenCalled();
  expect(client.inspect).not.toHaveBeenCalled();
});
it('does not request permission-set configuration when inspect is the only capability', async () => {
  read.value = false;
  mount(
    <UserPermissions />,
    '/users/:userId/permissions',
    '/users/user/permissions',
  );
  await screen.findByText(enUS.access.configurationDenied);
  expect(api.request).not.toHaveBeenCalled();
  expect(client.inspectBatch).not.toHaveBeenCalled();
});

it('marks sensitive wildcard operations in the role summary', () => {
  const catalog: AuthorizationOptions = {
    ...options,
    sections: [
      {
        value: 'business',
        label: 'Business',
        subsections: [
          {
            value: 'finance',
            label: 'Finance',
            actions: [],
            groups: [],
            resources: [
              {
                type: 'composite',
                value: 'oa.bank',
                label: 'Bank',
                actions: [{ value: 'viewBank', label: 'Read bank' }],
              },
            ],
          },
        ],
      },
    ],
  };
  expect(
    sensitiveSummary(catalog, {
      key: 'wild',
      grants: [
        {
          resource: { type: 'composite', id: '*' },
          actions: [{ action: 'viewBank' }],
        },
      ],
    }),
  ).toEqual(['Bank · Read bank']);
});

it('keeps the matrix read-only without both update and assign', async () => {
  mount(
    <RoleMatrix
      snapshot={snapshot}
      options={options}
      name='HR'
      canEdit={false}
      saved={saved}
      reload={vi.fn()}
    />,
  );
  expect(screen.getByRole('switch', { name: /Update/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await userEvent.click(screen.getByRole('switch', { name: /Update/ }));
  expect(screen.getByRole('switch', { name: /Update/ })).not.toBeChecked();
  expect(
    screen.queryByRole('button', { name: 'Save' }),
  ).not.toBeInTheDocument();
});

it('defaults shared changes to splitting and confirms an explicit all-subject update', async () => {
  const shared = {
    ...snapshot,
    assignments: [
      ...snapshot.assignments,
      {
        id: 'shared',
        permissionSet: 'source',
        subject: { type: 'user', id: 'user' },
      },
    ],
  };
  mount(
    <RoleMatrix
      snapshot={shared}
      options={options}
      name='HR'
      canEdit
      saved={saved}
      reload={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole('switch', { name: /Update/ }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const confirmation = within(screen.getByRole('alertdialog'));
  const all = confirmation.getByRole('checkbox', {
    name: 'Change all these subjects',
  });
  expect(all).not.toBeChecked();
  await userEvent.click(all);
  await userEvent.click(confirmation.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({ sharedSets: 'all' }),
      }),
    ),
  );
});

it('requires a target when a new operation has multiple writable module sets', async () => {
  const other = {
    ...snapshot.sets[0],
    key: 'alternative',
    title: 'Alternative',
  };
  const shared = {
    ...snapshot,
    sets: [...snapshot.sets, other],
    assignments: [
      ...snapshot.assignments,
      {
        id: 'other-assignment',
        permissionSet: other.key,
        subject: { type: 'org.dutyRole', id: 'hr' },
      },
    ],
  };
  mount(
    <RoleMatrix
      snapshot={shared}
      options={options}
      name='HR'
      canEdit
      saved={saved}
      reload={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole('switch', { name: /Update/ }));
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  await userEvent.click(
    screen.getByRole('combobox', {
      name: /Update · Destination permission set/,
    }),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: /Alternative/ }),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
    }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          changes: [expect.objectContaining({ permissionSet: 'alternative' })],
        }),
      }),
    ),
  );
});

it('starts the snapshot read before configured access resolves', async () => {
  let finish!: (value: unknown) => void;
  client.inspectConfigured.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  mount(
    <UserPermissions />,
    '/users/:userId/permissions',
    '/users/user/permissions',
  );
  await waitFor(() =>
    expect(client.inspectConfigured).toHaveBeenCalledTimes(1),
  );
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'access/snapshot' }),
  );
  finish({ unrestricted: false, identity: { subjects: [] }, sets: [] });
  await screen.findByText('Permissions for Test user');
});

it('stages duty role choices and retries only unfinished membership writes', async () => {
  const { default: UserDutyRoles } =
    await import('../../client/pages/access/user-duty-roles.js');
  let rejected = false;
  const assigned = new Set<string>();
  api.request.mockImplementation(
    async ({ path, method }: { path: string; method?: string }) => {
      if (path === 'org/users/user/duty-roles')
        return {
          data: {
            userId: 'user',
            disabledAt: null,
            roles: [
              {
                code: 'hr',
                title: 'HR',
                active: true,
                assigned: assigned.has('hr'),
              },
              {
                code: 'finance',
                title: 'Finance',
                active: true,
                assigned: assigned.has('finance'),
              },
            ],
          },
        };
      if (path.includes('/finance/') && !rejected) {
        rejected = true;
        throw new Error('failed');
      }
      if (method) assigned.add(path.includes('/hr/') ? 'hr' : 'finance');
      return {};
    },
  );
  mount(
    <UserDutyRoles
      userId='user'
      name='Test user'
      saved={saved}
      editing
      canEdit
    />,
  );
  const picker = await screen.findByRole('combobox', {
    name: 'Adjust duty roles',
  });
  await userEvent.click(picker);
  await userEvent.click(
    await screen.findByRole('option', { name: 'HR', exact: true }),
  );
  await userEvent.click(picker);
  await userEvent.click(
    await screen.findByRole('option', { name: 'Finance', exact: true }),
  );
  await userEvent.keyboard('{Escape}');
  expect(api.request.mock.calls.filter(([input]) => input.method)).toHaveLength(
    0,
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
      exact: true,
    }),
  );
  await screen.findByText(
    '1 changes saved. Remaining changes are retained; retry to continue.',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
      exact: true,
    }),
  );
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  expect(
    api.request.mock.calls.filter(
      ([input]) => input.method && input.path === 'dutyRoles/hr/members',
    ),
  ).toHaveLength(1);
  expect(
    api.request.mock.calls.filter(
      ([input]) => input.method && input.path === 'dutyRoles/finance/members',
    ),
  ).toHaveLength(2);
});

it('loads role comparison on demand and copies into an unsaved draft', async () => {
  const other = {
    ...snapshot,
    assignments: [
      {
        id: 'other',
        permissionSet: 'source',
        subject: { type: 'org.dutyRole', id: 'finance' },
      },
    ],
    sets: [
      {
        key: 'source',
        grants: [
          {
            resource: { type: 'settings', id: 'oa.org.positions' },
            actions: [{ action: 'update' }],
          },
        ],
      },
    ],
  };
  api.request.mockImplementation(async ({ path }: { path: string }) => ({
    data:
      path === 'access/roles'
        ? [{ type: 'org.dutyRole', id: 'finance', title: 'Accountant' }]
        : other,
  }));
  mount(
    <RoleMatrix
      snapshot={snapshot}
      options={options}
      name='HR'
      canEdit
      saved={saved}
      reload={vi.fn()}
    />,
  );
  expect(api.request).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('combobox', { name: 'Compare role' }));
  await userEvent.click(
    await screen.findByRole('option', { name: 'Accountant' }),
  );
  const copy = screen.getByRole('button', { name: 'Copy from comparison' });
  await waitFor(() => expect(copy).toBeEnabled());
  await userEvent.click(copy);
  expect(screen.getByRole('switch', { name: /Update/ })).toBeChecked();
  expect(screen.getByRole('switch', { name: /Read/ })).not.toBeChecked();
  expect(api.request.mock.calls.filter(([input]) => input.method)).toHaveLength(
    0,
  );
});

it('requires explicit discard before reloading a failed permission draft', async () => {
  const reload = vi.fn();
  api.request.mockRejectedValue(new Error('temporary failure'));
  mount(
    <RoleMatrix
      snapshot={snapshot}
      options={options}
      name='HR'
      canEdit
      saved={saved}
      reload={reload}
    />,
  );
  await userEvent.click(screen.getByRole('switch', { name: /Update/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
    }),
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(reload).not.toHaveBeenCalled();
  const discardDialog = screen.getAllByRole('alertdialog').at(-1)!;
  await userEvent.click(
    within(discardDialog).getByRole('button', { name: 'Cancel' }),
  );
  expect(reload).not.toHaveBeenCalled();
  await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await userEvent.click(
    within(screen.getAllByRole('alertdialog').at(-1)!).getByRole('button', {
      name: 'Discard',
    }),
  );
  expect(reload).toHaveBeenCalledTimes(1);
});

it('reads assigned inactive roles without update permission and without member-list requests', async () => {
  const { default: UserDutyRoles } =
    await import('../../client/pages/access/user-duty-roles.js');
  api.request.mockResolvedValue({
    data: {
      userId: 'user',
      disabledAt: '2026-10-23T00:00:00Z',
      roles: [{ code: 'hr', title: 'HR', active: false, assigned: true }],
    },
  });
  mount(<UserDutyRoles userId='user' name='Frozen user' saved={saved} />);
  await screen.findByText('HR · Inactive');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Adjust duty roles' }),
  ).not.toBeInTheDocument();
  expect(api.request).toHaveBeenCalledTimes(1);
  expect(api.request).toHaveBeenCalledWith({
    path: 'org/users/user/duty-roles',
  });
});
it('allows removing and restoring an assigned role while preventing additions to a frozen account', async () => {
  const { default: UserDutyRoles } =
    await import('../../client/pages/access/user-duty-roles.js');
  api.request.mockResolvedValue({
    data: {
      userId: 'user',
      disabledAt: '2026-10-23T00:00:00Z',
      roles: [
        { code: 'hr', title: 'HR', active: true, assigned: true },
        { code: 'finance', title: 'Finance', active: true, assigned: false },
      ],
    },
  });
  mount(
    <UserDutyRoles
      userId='user'
      name='Frozen user'
      saved={saved}
      editing
      canEdit
    />,
  );
  const picker = await screen.findByRole('combobox', {
    name: 'Adjust duty roles',
  });
  await userEvent.click(picker);
  expect(
    await screen.findByRole('option', { name: 'Finance', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(
    screen.getByRole('option', { name: 'HR', exact: true }),
  );
  await userEvent.keyboard('{Escape}');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeEnabled();
  await userEvent.click(picker);
  await userEvent.click(
    await screen.findByRole('option', { name: 'HR', exact: true }),
  );
  await userEvent.keyboard('{Escape}');
  expect(
    screen.getByRole('button', { name: 'Save', exact: true }),
  ).toBeDisabled();
  expect(api.request.mock.calls.filter(([input]) => input.method)).toHaveLength(
    0,
  );
});

function unifiedProps() {
  return {
    userId: 'user',
    name: 'User',
    canInspect: true,
    canReadPersonal: true,
    canEdit: true,
  };
}
function mockUnified() {
  const personal = {
    ...snapshot,
    assignments: [
      ...snapshot.assignments,
      {
        id: 'direct',
        permissionSet: 'source',
        subject: { type: 'user', id: 'user' },
      },
    ],
  };
  api.request.mockImplementation(async ({ path }: { path: string }) => ({
    data: path === 'access/options' ? await client.loadOptions() : personal,
  }));
  client.resolveSubjects.mockResolvedValue([{ id: 'hr', title: 'HR team' }]);
  client.inspectConfigured.mockResolvedValue({
    unrestricted: false,
    sets: [
      {
        key: 'source',
        sources: [
          { type: 'user', id: 'user' },
          { type: 'org.dutyRole', id: 'hr' },
        ],
      },
    ],
  });
}
it('shows shared direct and inherited configuration together without editable controls', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} canEdit={false} />);
  expect(await screen.findByText(/HR team/)).toBeVisible();
  expect(
    screen.getByRole('columnheader', { name: 'Inherited permissions' }),
  ).toBeVisible();
  expect(
    screen.getByRole('columnheader', { name: 'Personal exceptions' }),
  ).toBeVisible();
  expect(screen.queryByRole('switch')).toBeNull();
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Personal exceptions only' }),
  );
  expect(screen.getByText(/HR team/)).toBeVisible();
});
it('does not load inspector data without inspect and labels inheritance unavailable', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} canInspect={false} />);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      'You do not have access to inherited permissions.',
    ),
  );
  expect(await screen.findByText('Read')).toBeVisible();
  expect(client.inspectConfigured).not.toHaveBeenCalled();
  expect(client.resolveSubjects).not.toHaveBeenCalled();
  expect(api.request).not.toHaveBeenCalledWith(
    expect.objectContaining({ path: 'access/snapshot' }),
  );
});
it('does not fetch direct grants when only inherited configuration is readable', async () => {
  mockUnified();
  mount(
    <UnifiedUserPermissions
      {...unifiedProps()}
      canReadPersonal={false}
      canEdit={false}
    />,
  );
  expect(await screen.findByText(/HR team/)).toBeVisible();
  expect(api.request).not.toHaveBeenCalledWith(
    expect.objectContaining({ path: 'access/subjects/user/user' }),
  );
  expect(
    screen.queryByRole('button', { name: 'Adjust personal permissions' }),
  ).toBeNull();
});
it('removes only the direct grant through the existing revision and split protocol', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} />);
  await userEvent.click(
    await screen.findByRole('switch', { name: /Personally grant.*Read/ }),
  );
  expect(screen.getByText(/HR team/)).toBeVisible();
  await screen.findByText('Saved');
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'access/subjects/user/user/grants',
      method: 'PUT',
      json: expect.objectContaining({
        expectedRevision: snapshot.revision,
        sharedSets: 'split',
        changes: [
          {
            resource: { type: 'settings', id: 'oa.org.positions' },
            action: 'read',
            value: null,
          },
        ],
      }),
    }),
  );
});
it('normalizes old personal links into the single permissions tab', () => {
  expect(
    legacyUserLink(
      '/users/user/personal',
      new URLSearchParams('search=User&page=2'),
      'user',
    ),
  ).toBe('/users/user?search=User&page=2&tab=permissions');
});

it('hides unset personal exceptions in view but keeps the edit controls available', async () => {
  const inherited = new Map(
    roleRows(options, snapshot.sets)
      .filter((row) => row.enabled)
      .map((row) => [row.id, ['HR team · All records']]),
  );
  mount(
    <RoleMatrix
      snapshot={{ ...snapshot, assignments: [] }}
      subject={{ type: 'user', id: 'user' }}
      options={options}
      name='User'
      canEdit={false}
      saved={saved}
      reload={vi.fn()}
      inheritedPermissions={{ lines: inherited }}
    />,
  );
  expect(screen.getByText('HR team · All records')).toBeVisible();
  expect(screen.queryByText('Personal exceptions')).toBeNull();
  expect(screen.queryByText('Not set')).toBeNull();
  expect(screen.queryByRole('switch')).toBeNull();
});

it('offers edit on each card and only enables controls in the selected card', async () => {
  const moreOptions: AuthorizationOptions = {
    ...options,
    sections: options.sections.map((section) => ({
      ...section,
      subsections: section.subsections.map((subsection) => ({
        ...subsection,
        resources: [
          ...subsection.resources,
          {
            ...subsection.resources[0],
            value: 'oa.org.departments',
            label: 'Departments',
          },
        ],
      })),
    })),
  };
  const inherited = new Map(
    roleRows(moreOptions, [
      {
        key: 'both',
        grants: [
          {
            resource: { type: 'settings', id: '*' },
            actions: [{ action: 'read' }],
          },
        ],
      },
    ])
      .filter((row) => row.enabled)
      .map((row) => [row.id, ['HR team']]),
  );
  mount(
    <RoleMatrix
      snapshot={{ ...snapshot, assignments: [] }}
      subject={{ type: 'user', id: 'user' }}
      options={moreOptions}
      name='User'
      canEdit
      saved={saved}
      reload={vi.fn()}
      inheritedPermissions={{ lines: inherited }}
      editingResource={resourceKey('settings', 'oa.org.positions')}
    />,
  );
  const switches = screen.getAllByRole('switch');
  expect(switches).toHaveLength(2);
  expect(
    screen
      .getByText('Departments')
      .closest('[data-slot=collapsible]')
      ?.querySelector('[role=switch]'),
  ).toBeNull();
  expect(screen.getAllByText('Personal exceptions')).toHaveLength(2);
});

it('autosaves without replacing controls or clearing search', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} />);
  const toggle = await screen.findByRole('switch', {
    name: /Personally grant.*Read/,
  });
  const search = screen.getByRole('textbox', {
    name: 'Search business features or operations…',
  });
  await userEvent.type(search, 'Positions');
  await userEvent.click(toggle);
  await screen.findByText('Saved');
  expect(screen.getByRole('textbox')).toBe(search);
  expect(screen.getByRole('switch')).toBe(toggle);
  expect(search).toHaveValue('Positions');
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
});
it('restores authoritative grants after a rejected autosave', async () => {
  mockUnified();
  const readRequest = api.request.getMockImplementation()!;
  api.request.mockImplementation((request) =>
    request.method === 'PUT'
      ? Promise.reject(new Error('conflict'))
      : readRequest(request),
  );
  mount(<UnifiedUserPermissions {...unifiedProps()} />);
  const toggle = await screen.findByRole('switch', {
    name: /Personally grant.*Read/,
  });
  await userEvent.click(toggle);
  await screen.findByText(/Change not saved/);
  expect(toggle).toBeChecked();
  expect(toggle).toBeEnabled();
  expect(screen.getByText(/HR team/)).toBeVisible();
});
it('blocks further changes if save and recovery both fail', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} />);
  const toggle = await screen.findByRole('switch', {
    name: /Personally grant.*Read/,
  });
  api.request.mockRejectedValue(new Error('offline'));
  await userEvent.click(toggle);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Save result could not be confirmed/,
    ),
  );
  expect(toggle).toHaveAttribute('aria-disabled', 'true');
});

it('edits each print data scope beside its operation and submits distinct scope values', async () => {
  const scopes = [
    { key: 'printTemplates', label: 'Templates' },
    { key: 'printTemplateRevisions', label: 'Template versions' },
    { key: 'paymentRequests', label: 'Payment requests' },
  ].map((scope) => ({
    ...scope,
    collection: scope.key,
    collectionFields: [],
    defaultValue: '',
    options: [
      { value: '', label: 'Default' },
      { value: 'all', label: 'All records' },
    ],
  }));
  const printOptions: AuthorizationOptions = {
    ...options,
    sections: options.sections.map((section) => ({
      ...section,
      subsections: section.subsections.map((subsection) => ({
        ...subsection,
        resources: [
          {
            type: 'composite',
            value: 'oa.templatePrint',
            label: 'Document templates',
            actions: [
              { value: 'printPayment', label: 'Print payment requests' },
            ],
            dataScopes: { printPayment: scopes },
          },
        ],
      })),
    })),
  };
  mount(
    <RoleMatrix
      snapshot={{ ...snapshot, sets: [], assignments: [] }}
      options={printOptions}
      subject={{ type: 'user', id: 'user' }}
      name='User'
      canEdit
      saved={saved}
      reload={vi.fn()}
      inheritedPermissions={{ lines: new Map() }}
      editingResource={resourceKey('composite', 'oa.templatePrint')}
    />,
  );
  await userEvent.click(
    screen.getByRole('switch', { name: 'Print payment requests' }),
  );
  const row = screen
    .getByRole('switch', { name: 'Print payment requests' })
    .closest('[data-slot=permission-row]') as HTMLElement;
  expect(within(row).getAllByRole('combobox')).toHaveLength(3);
  expect(
    within(row).getByText(
      'Unspecified scopes follow default access and sharing rules. This does not mean all records.',
    ),
  ).toBeVisible();
  await userEvent.click(
    within(row).getByRole('combobox', {
      name: 'Print payment requests: Payment requests scope',
    }),
  );
  await userEvent.click(screen.getByRole('option', { name: 'All records' }));
  expect(
    within(row).getByRole('combobox', {
      name: 'Print payment requests: Templates scope',
    }),
  ).toHaveTextContent('Use system rules');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await userEvent.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Save',
      exact: true,
    }),
  );
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PUT',
      json: expect.objectContaining({
        changes: [
          {
            resource: { type: 'composite', id: 'oa.templatePrint' },
            action: 'printPayment',
            value: {
              scopes: {
                printTemplates: '',
                printTemplateRevisions: '',
                paymentRequests: 'all',
              },
            },
          },
        ],
      }),
    }),
  );
});

it('serializes immediate changes and uses the returned revision for the next action', async () => {
  const personal = {
    ...snapshot,
    assignments: [
      {
        id: 'direct',
        permissionSet: 'source',
        subject: { type: 'user', id: 'user' },
      },
    ],
  };
  let complete: (result: { data: AccessSnapshot }) => void = () => undefined;
  api.request.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  function Table() {
    const [current, setCurrent] = useState(personal);
    return (
      <UserPermissionTable
        snapshot={current}
        options={options}
        userId='user'
        canEdit
        canReadPersonal
        canInspect
        inherited={new Map()}
        saved={setCurrent}
        refresh={async () => current}
      />
    );
  }
  mount(<Table />);
  const toggle = screen.getByRole('switch');
  await userEvent.click(toggle);
  expect(screen.getByText('Saving…')).toBeVisible();
  expect(toggle).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  await userEvent.click(toggle);
  expect(api.request).toHaveBeenCalledTimes(1);
  complete({ data: { ...personal, revision: 'next-revision', sets: [] } });
  await screen.findByText('Saved');
  expect(screen.getByRole('switch')).toBe(toggle);
  expect(toggle).not.toBeChecked();
  await userEvent.click(toggle);
  expect(api.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      json: expect.objectContaining({
        expectedRevision: 'next-revision',
        sharedSets: 'split',
      }),
    }),
  );
  complete({ data: personal });
  await screen.findByText('Saved');
});

it('clears a destination that is no longer assigned after a snapshot change', async () => {
  const initial = {
    ...snapshot,
    sets: [
      { ...snapshot.sets[0], title: 'First' },
      { ...snapshot.sets[0], key: 'second', title: 'Second' },
    ],
    assignments: ['source', 'second'].map((key) => ({
      id: key,
      permissionSet: key,
      subject: { type: 'user', id: 'user' },
    })),
  };
  function Table() {
    const [current, setCurrent] = useState(initial);
    return (
      <>
        <button
          onClick={() =>
            setCurrent({
              ...initial,
              revision: 'split',
              sets: initial.sets.map((set) => ({
                ...set,
                key: `${set.key}-copy`,
              })),
              assignments: initial.assignments.map((assignment) => ({
                ...assignment,
                permissionSet: `${assignment.permissionSet}-copy`,
              })),
            })
          }
        >
          Replace snapshot
        </button>
        <UserPermissionTable
          snapshot={current}
          options={options}
          userId='user'
          canEdit
          canReadPersonal
          canInspect
          inherited={new Map()}
          saved={vi.fn()}
          refresh={async () => current}
        />
      </>
    );
  }
  mount(<Table />);
  await userEvent.click(
    screen.getByRole('checkbox', { name: 'Configured permissions only' }),
  );
  const toggle = screen.getByRole('switch', {
    name: /Personally grant.*Update/,
  });
  expect(toggle).toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(
    screen.getByRole('combobox', { name: 'Choose personal grant destination' }),
  );
  await userEvent.click(await screen.findByRole('option', { name: 'First' }));
  expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
  await userEvent.click(
    screen.getByRole('button', { name: 'Replace snapshot' }),
  );
  expect(toggle).toHaveAttribute('aria-disabled', 'true');
});

it('uses the existing denied surface when inline writes are forbidden', async () => {
  mockUnified();
  mount(<UnifiedUserPermissions {...unifiedProps()} />);
  const toggle = await screen.findByRole('switch', {
    name: /Personally grant.*Read/,
  });
  const { ApiClientError } = await import('@nocobase/app-client');
  api.request.mockRejectedValue(
    new ApiClientError('private', {
      status: 403,
      method: 'PUT',
      url: '/api/access',
    }),
  );
  await userEvent.click(toggle);
  await waitFor(() => expect(screen.queryByRole('switch')).toBeNull());
  expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
  expect(screen.queryByText('private')).toBeNull();
  expect(screen.getByRole('alert')).toBeVisible();
});

it.each([1, 2])(
  'aligns %i scope rows without repeating scope names in value columns',
  async (count) => {
    const scopes = [
      { key: 'registrations', label: 'Registration' },
      { key: 'receipts', label: 'Receipt' },
    ]
      .slice(0, count)
      .map((scope) => ({
        ...scope,
        collection: scope.key,
        collectionFields: [],
        defaultValue: '',
        options: [
          { value: '', label: 'Default' },
          { value: 'own', label: 'Own records' },
          { value: 'all', label: 'All records' },
        ],
      }));
    const scopeValues = Object.fromEntries(
      scopes.map((scope) => [scope.key, 'own']),
    );
    const tableOptions: AuthorizationOptions = {
      ...options,
      sections: options.sections.map((section) => ({
        ...section,
        subsections: section.subsections.map((subsection) => ({
          ...subsection,
          resources: [
            {
              type: 'composite',
              value: 'oa.sealLedger',
              label: count === 1 ? 'Registration' : 'Seal ledger',
              actions: [{ value: 'view', label: 'View' }],
              dataScopes: { view: scopes },
            },
          ],
        })),
      })),
    };
    const currentSnapshot = (
      values: Record<string, string>,
    ): AccessSnapshot => ({
      revision: JSON.stringify(values),
      sets: [
        {
          key: 'personal',
          grants: [
            {
              resource: { type: 'composite', id: 'oa.sealLedger' },
              actions: [
                {
                  action: 'view',
                  policy: { type: 'composite', scopes: values },
                },
              ],
            },
          ],
        },
      ],
      assignments: [
        {
          id: 'personal',
          permissionSet: 'personal',
          subject: { type: 'user', id: 'user' },
        },
      ],
    });
    const personal = currentSnapshot(scopeValues);
    const inherited = new Map([
      [
        JSON.stringify(['composite', 'oa.sealLedger', 'view']),
        [
          {
            sources: ['Role A'],
            scopes: scopes.map((scope) => ({ ...scope, value: 'Own records' })),
          },
          {
            sources: ['Role B'],
            scopes: scopes.map((scope) => ({ ...scope, value: 'All records' })),
          },
        ],
      ],
    ]);
    function Table() {
      const [current, setCurrent] = useState(personal);
      return (
        <UserPermissionTable
          snapshot={current}
          options={tableOptions}
          userId='user'
          canEdit
          canReadPersonal
          canInspect
          inherited={inherited}
          saved={setCurrent}
          refresh={async () => current}
        />
      );
    }
    mount(<Table />);
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    const dataRows = screen.getAllByRole('row').slice(1);
    expect(dataRows).toHaveLength(count === 1 ? 1 : 3);
    for (const [index, scope] of scopes.entries()) {
      const row = dataRows[count === 1 ? 0 : index + 1];
      const cells = within(row).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(scope.label);
      expect(cells[1]).not.toHaveTextContent(scope.label);
      expect(cells[2]).not.toHaveTextContent(scope.label);
      expect(within(cells[1]).getByText('Own records')).toBeVisible();
      expect(within(cells[1]).getByText('All records')).toBeVisible();
      expect(within(cells[1]).getByText('Role A')).toBeVisible();
      expect(within(cells[1]).getByText('Role B')).toBeVisible();
      expect(within(cells[2]).getByRole('combobox')).toHaveAccessibleName(
        `View: ${scope.label} scope`,
      );
      if (count > 1) expect(within(row).queryByRole('switch')).toBeNull();
    }
    const scope = scopes.at(-1)!;
    const updated = { ...scopeValues, [scope.key]: 'all' };
    api.request.mockResolvedValueOnce({ data: currentSnapshot(updated) });
    await userEvent.click(
      screen.getByRole('combobox', { name: `View: ${scope.label} scope` }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'All records' }),
    );
    await screen.findByText('Saved');
    expect(api.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PUT',
        json: expect.objectContaining({
          sharedSets: 'split',
          changes: [
            {
              resource: { type: 'composite', id: 'oa.sealLedger' },
              action: 'view',
              value: { scopes: updated },
            },
          ],
        }),
      }),
    );
    api.request.mockResolvedValueOnce({
      data: { ...personal, sets: [], assignments: [] },
    });
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull());
    expect(screen.getAllByText('Role A')).toHaveLength(count);
  },
);

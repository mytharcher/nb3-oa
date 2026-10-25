import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import RolesPage from '../../client/pages/access/roles.js';
import EditPage from '../../client/pages/access/edit.js';
import SubjectDetail from '../../client/pages/access/detail.js';
import AssignPage from '../../client/pages/access/assign.js';
import { ErrorState } from '../../client/pages/access/ui.js';

const { api, client, can, toaster, reload } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  client: {
    loadOptions: vi.fn(),
    listSubjects: vi.fn(),
    resolveSubjects: vi.fn(),
    inspectConfigured: vi.fn(),
    inspectBatch: vi.fn(),
    getEffective: vi.fn(),
  },
  can: { value: true },
  toaster: { show: vi.fn() },
  reload: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
  useNavigationGuard: () => undefined,
  usePageBreadcrumb: () => undefined,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: can.value, isPending: false }),
}));
vi.mock(
  '../../client/pages/administration/authorization/use-authorization-client.js',
  () => ({ useAuthorizationClient: () => client }),
);
vi.mock(
  '../../client/pages/administration/authorization/components/use-resource-options.js',
  () => ({ useResourceOptions: (value: unknown) => value }),
);
const catalog = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      order: 1,
      subsections: [
        {
          name: 'budget',
          title: 'Budget',
          resources: [
            {
              type: 'settings',
              id: 'budget',
              title: 'Budget administration',
              actions: [
                { name: 'read', title: 'Read budget' },
                { name: 'update', title: 'Adjust allocation' },
              ],
            },
          ],
        },
      ],
    },
  ],
  subjectTypes: [
    {
      type: 'org.dutyRole',
      title: 'Duty roles',
      selection: { type: 'collection' },
    },
    {
      type: 'authenticated',
      title: 'All signed-in',
      selection: { type: 'fixed', id: '*' },
    },
  ],
  recordAccess: [],
  collections: [],
};
const definition = {
  key: 'finance',
  title: 'Finance responsibilities',
  grants: [
    {
      resource: { type: 'settings', id: 'budget' },
      actions: [{ action: 'read' }],
    },
  ],
};
const assignment = {
  id: 'a',
  permissionSet: 'finance',
  subject: { type: 'org.dutyRole', id: 'hr' },
};
const snapshot = {
  revision: 'a'.repeat(64),
  sets: [definition],
  assignments: [assignment],
};
const setSnapshot = {
  revision: 'a'.repeat(64),
  definition,
  assignments: [assignment],
};
const runtimes = {
  en: await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: enUS },
  }),
  zh: await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: 'nb3-oa', resources: zhCN },
  }),
};
function Parent() {
  return <Outlet context={{ name: 'HR specialist', reload }} />;
}
function mount(page: 'roles' | 'edit' | 'assign', locale: 'en' | 'zh' = 'en') {
  const path =
    page === 'roles'
      ? '/access/roles'
      : page === 'edit'
        ? '/access/roles/org.dutyRole/hr/permissions/finance/edit'
        : '/access/roles/org.dutyRole/hr/permissions/assign';
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Parent />,
        children: [
          { path: '/access/roles', element: <RolesPage /> },
          {
            path: '/access/roles/:type/:id/permissions/:permissionSetKey/edit',
            element: <EditPage />,
          },
          {
            path: '/access/roles/:type/:id/permissions/assign',
            element: <AssignPage />,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={runtimes[locale]} namespace='nb3-oa'>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  can.value = true;
  client.loadOptions.mockResolvedValue(catalog);
  client.listSubjects.mockResolvedValue({
    items: [{ id: 'hr', title: 'HR specialist' }],
    total: 1,
  });
  client.resolveSubjects.mockResolvedValue([
    { id: 'hr', title: 'HR specialist' },
  ]);
  api.request.mockImplementation(
    async ({ path, method }: { path: string; method?: string }) => {
      if (method === 'PUT') return { data: snapshot };
      if (path === 'access/snapshot') return { data: snapshot };
      if (path === 'access/options')
        return { data: await client.loadOptions('permissionSets') };
      if (/^access\/subjects\/[^/]+\/[^/]+$/.test(path))
        return {
          data: {
            ...snapshot,
            revisionScope: 'subject',
            role: { title: 'HR specialist', memberCount: 0 },
          },
        };
      if (path === 'access/roles')
        return {
          data: [
            {
              type: 'org.dutyRole',
              id: 'hr',
              title: 'HR specialist',
              memberCount: 0,
            },
            { type: 'authenticated', id: '*', title: 'All signed-in' },
          ],
        };
      if (path === 'dutyRoles')
        return { data: [{ code: 'hr', memberCount: 0, active: true }] };
      if (path === 'access/permissionSets/finance')
        return { data: setSnapshot };
      throw new Error(`unexpected request ${path}`);
    },
  );
});
describe('OA access pages', () => {
  it('shows real role access, automatic baseline and an unconfigured duty pool', async () => {
    mount('roles');
    expect(
      await screen.findByRole('link', { name: 'HR specialist' }),
    ).toHaveAttribute('href', '/access/roles/org.dutyRole/hr/permissions');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(
      screen.queryByRole('columnheader', { name: 'Applies to' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Configured modules' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Sensitive access' }),
    ).not.toBeInTheDocument();
    expect(
      api.request.mock.calls.every(([input]) => input.path === 'access/roles'),
    ).toBe(true);
    expect(client.loadOptions).not.toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Signed-in baseline access' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: enUS.access.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: enUS.access.modules }),
    ).not.toBeInTheDocument();
  });
  it('fetches a scoped detail only after opening a role and keeps the list mounted', async () => {
    const router = createMemoryRouter(
      [
        {
          path: '/access/roles',
          element: <RolesPage />,
          children: [
            { path: ':type/:id/permissions', element: <SubjectDetail /> },
          ],
        },
      ],
      { initialEntries: ['/access/roles'] },
    );
    render(
      <TestI18nProvider runtime={runtimes.en} namespace='nb3-oa'>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    const link = await screen.findByRole('link', { name: 'HR specialist' });
    expect(api.request.mock.calls.map(([input]) => input.path)).toEqual([
      'access/roles',
    ]);
    await userEvent.click(link);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      await screen.findByRole('switch', {
        name: /Adjust allocation/,
      }),
    ).toBeInTheDocument();
    expect(api.request.mock.calls.map(([input]) => input.path)).toEqual(
      expect.arrayContaining([
        'access/subjects/org.dutyRole/hr',
        'access/options',
      ]),
    );
    expect(
      api.request.mock.calls.some(
        ([input]) => input.path === 'access/snapshot',
      ),
    ).toBe(false);
    expect(
      screen.getByRole('link', { name: 'HR specialist', hidden: true }),
    ).toBeInTheDocument();
  });
  it('renders Chinese and supports search without changing saved access', async () => {
    mount('roles', 'zh');
    await screen.findByText('HR specialist');
    expect(
      screen.getByRole('heading', { name: '权限管理' }),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByPlaceholderText('搜索角色、岗位或部门…'),
      'unknown',
    );
    await waitFor(() =>
      expect(screen.queryByText('HR specialist')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('没有匹配结果')).toBeInTheDocument();
    expect(
      api.request.mock.calls.some(([input]) => input.method === 'PUT'),
    ).toBe(false);
  });
  it('shows role identities without loading counts or member maintenance permission', async () => {
    can.value = false;
    mount('roles');
    await screen.findByText('HR specialist');
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(
      screen.queryByRole('columnheader', { name: 'Applies to' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('No members assigned')).not.toBeInTheDocument();
  });
  it('labels every dynamic scope as required and localizes label punctuation', async () => {
    client.loadOptions.mockResolvedValue({
      ...catalog,
      sections: catalog.sections.map((section) => ({
        ...section,
        subsections: section.subsections.map((subsection) => ({
          ...subsection,
          resources: subsection.resources.map((resource) => ({
            ...resource,
            dataScopes: {
              update: [
                {
                  key: 'region',
                  title: 'Region',
                  collection: 'budgets',
                  fields: [],
                  recordAccess: [],
                },
                {
                  key: 'department',
                  title: 'Department',
                  collection: 'budgets',
                  fields: [],
                  recordAccess: [],
                },
              ],
            },
          })),
        })),
      })),
    });
    mount('edit', 'zh');
    await userEvent.click(
      await screen.findByRole('switch', { name: /Adjust allocation/ }),
    );
    for (const scope of ['Region', 'Department']) {
      expect(
        screen.getByRole('combobox', { name: `Adjust allocation · ${scope}` }),
      ).toHaveAttribute('aria-required', 'true');
    }
    expect(
      screen.getByText(`${zhCN.access.impact}：HR specialist`),
    ).toBeInTheDocument();
    expect(
      api.request.mock.calls.some(([input]) => input.method === 'PUT'),
    ).toBe(false);
  });

  it('requires a change confirmation and submits only the selected business operation', async () => {
    mount('edit');
    const user = userEvent.setup();
    const toggle = await screen.findByRole('switch', {
      name: 'Adjust allocation',
    });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByText(/Budget administration · Adjust allocation/),
    ).toBeInTheDocument();
    expect(
      api.request.mock.calls.some(([input]) => input.method === 'PUT'),
    ).toBe(false);
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          json: {
            expectedRevision: setSnapshot.revision,
            changes: [
              {
                resource: { type: 'settings', id: 'budget' },
                action: 'update',
                enabled: true,
                scopes: {},
              },
            ],
          },
        }),
      ),
    );
    expect(reload).toHaveBeenCalled();
  });
  it('shows conflict feedback and preserves the unsaved choice', async () => {
    api.request.mockImplementation(
      async ({ path, method }: { path: string; method?: string }) => {
        if (path === 'access/options')
          return { data: await client.loadOptions('permissionSets') };
        if (method === 'PUT')
          throw new ApiClientError('private', {
            status: 409,
            method: 'PUT',
            url: '/api/access',
            reason: 'VERSION_CONFLICT',
          });
        return { data: setSnapshot };
      },
    );
    mount('edit');
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('switch', { name: 'Adjust allocation' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Save',
      }),
    );
    expect(
      await screen.findByText(
        'Access configuration changed. Reload and review before saving.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Adjust allocation' }),
    ).toBeChecked();
    expect(screen.queryByText('private')).not.toBeInTheDocument();
  });
  it('keeps personal and inherited authorization distinct while replacing only its managed direct subset', async () => {
    mount('assign');
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('checkbox', { name: /Finance responsibilities/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Save',
      }),
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          json: {
            expectedRevision: snapshot.revision,
            managedPermissionSets: ['finance'],
            permissionSets: [],
          },
        }),
      ),
    );
  });
  it('does not offer retry after a permission denial', () => {
    render(
      <TestI18nProvider runtime={runtimes.en} namespace='nb3-oa'>
        <ErrorState
          error={
            new ApiClientError('secret', {
              status: 403,
              method: 'GET',
              url: '/api/access',
            })
          }
          retry={reload}
        />
      </TestI18nProvider>,
    );
    expect(
      screen.getByText(
        'You do not have access to this operation. Contact an access administrator.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
  });
});

function mountAt(element: React.ReactElement, path: string, initial: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Parent />, children: [{ path, element }] }],
    { initialEntries: [initial] },
  );
  render(
    <TestI18nProvider runtime={runtimes.en} namespace='nb3-oa'>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
describe('Independent loading blocks', () => {
  it('isolates role identities even when the previous request finishes last', async () => {
    let finishFirst!: (value: unknown) => void;
    const first = new Promise((resolve) => {
      finishFirst = resolve;
    });
    api.request.mockImplementation(async ({ path }) => {
      if (path === 'access/options') return { data: catalog };
      if (path.endsWith('/first')) return first;
      return { data: { ...snapshot, role: { title: 'Second role' } } };
    });
    const router = mountAt(
      <SubjectDetail />,
      'access/roles/:type/:id/permissions',
      '/access/roles/org.position/first/permissions',
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith({
        path: 'access/subjects/org.position/first',
      }),
    );
    await act(() =>
      router.navigate('/access/roles/org.position/second/permissions'),
    );
    expect(
      await screen.findByRole('heading', { name: 'Second role' }),
    ).toBeInTheDocument();
    await act(async () => {
      finishFirst({ data: { ...snapshot, role: { title: 'First role' } } });
      await first;
    });
    expect(
      screen.getByRole('heading', { name: 'Second role' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'First role' }),
    ).not.toBeInTheDocument();
  });
  it('reloads detail counts after changing role members', async () => {
    const member = {
      userId: 'member-1',
      user: { id: 'member-1', name: 'Member One' },
    };
    let removed = false;
    api.request.mockImplementation(async ({ path, method }) => {
      if (method === 'DELETE') {
        removed = true;
        return {};
      }
      if (path === 'dutyRoles/hr/members')
        return { data: removed ? [] : [member] };
      if (path === 'access/subjects/org.dutyRole/hr')
        return {
          data: {
            ...snapshot,
            role: { title: 'HR specialist', memberCount: removed ? 0 : 1 },
          },
        };
      throw new Error(`unexpected request ${path}`);
    });
    mountAt(
      <SubjectDetail />,
      'access/roles/:type/:id/members',
      '/access/roles/org.dutyRole/hr/members',
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Actions for "Member One"' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Remove',
      }),
    );
    await waitFor(() =>
      expect(
        api.request.mock.calls.filter(
          ([input]) => input.path === 'access/subjects/org.dutyRole/hr',
        ),
      ).toHaveLength(2),
    );
    expect(
      api.request.mock.calls.some(([input]) => input.path === 'access/options'),
    ).toBe(false);
  });
  it('shows a retryable catalog error in the subject detail', async () => {
    client.loadOptions.mockRejectedValue(new Error('Options unavailable'));
    api.request.mockImplementation(async ({ path }) => {
      if (path === 'access/options') throw new Error('Options unavailable');
      return { data: { ...snapshot, role: { title: 'HR specialist' } } };
    });
    mountAt(
      <SubjectDetail />,
      'access/roles/:type/:id/permissions',
      '/access/roles/org.position/hr/permissions',
    );
    expect(
      await screen.findByRole('button', { name: enUS.access.retry }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(enUS.access.loading),
    ).not.toBeInTheDocument();
  });
});

describe('Role permission module grouping', () => {
  it.each(['en', 'zh'] as const)(
    'filters assignment choices without losing hidden selections (%s)',
    async (locale) => {
      const copy = locale === 'zh' ? zhCN.access : enUS.access;
      const other = {
        key: 'other',
        title: definition.title,
        grants: [
          {
            resource: { type: 'settings', id: 'hr' },
            actions: [{ action: 'read' }],
          },
        ],
      };
      client.loadOptions.mockResolvedValue({
        ...catalog,
        sections: [
          {
            ...catalog.sections[0],
            subsections: [
              ...catalog.sections[0].subsections,
              {
                name: 'hr',
                title: 'HR',
                resources: [
                  {
                    type: 'settings',
                    id: 'hr',
                    title: 'HR administration',
                    actions: [{ name: 'read', title: 'Read HR' }],
                  },
                ],
              },
            ],
          },
        ],
      });
      api.request.mockImplementation(async ({ path }) => ({
        data:
          path === 'access/options'
            ? await client.loadOptions('permissionSets')
            : { ...snapshot, sets: [definition, other] },
      }));
      mount('assign', locale);
      const search = await screen.findByRole('textbox', {
        name: copy.assignmentSearch,
      });
      expect(
        screen.getAllByRole('checkbox', { name: /Finance responsibilities/ }),
      ).toHaveLength(2);
      const user = userEvent.setup();
      await user.type(search, 'Read HR');
      const remaining = screen.getByRole('checkbox', {
        name: /Finance responsibilities/,
      });
      expect(remaining).not.toBeChecked();
      await user.click(remaining);
      await user.click(
        screen.getByRole('combobox', { name: copy.businessModules }),
      );
      await user.click(
        await screen.findByRole('option', { name: 'Budget', exact: true }),
      );
      expect(
        screen.queryByRole('checkbox', { name: /Finance responsibilities/ }),
      ).toBeNull();
      expect(screen.getByText(copy.noResults)).toBeVisible();
      await user.clear(search);
      expect(
        screen.getByRole('checkbox', { name: /Finance responsibilities/ }),
      ).toBeChecked();
      await user.click(
        screen.getByRole('checkbox', { name: /Finance responsibilities/ }),
      );
      await user.click(
        screen.getByRole('checkbox', { name: copy.assignmentOnlySelected }),
      );
      expect(
        screen.queryByRole('checkbox', { name: /Finance responsibilities/ }),
      ).toBeNull();
      await user.click(screen.getByRole('button', { name: copy.clear }));
      const choices = screen.getAllByRole('checkbox', {
        name: /Finance responsibilities/,
      });
      expect(choices[0]).not.toBeChecked();
      expect(choices[1]).toBeChecked();
      await user.click(screen.getByRole('button', { name: copy.save }));
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: copy.save,
        }),
      );
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'PUT',
            json: {
              expectedRevision: snapshot.revision,
              managedPermissionSets: ['finance', 'other'],
              permissionSets: ['other'],
            },
          }),
        ),
      );
    },
  );
  it('shows one module at a time in role details', async () => {
    client.loadOptions.mockResolvedValue({
      ...catalog,
      sections: [
        {
          ...catalog.sections[0],
          subsections: [
            ...catalog.sections[0].subsections,
            {
              name: 'hr',
              title: 'HR',
              resources: [
                {
                  type: 'settings',
                  id: 'hr',
                  title: 'HR administration',
                  actions: [{ name: 'read', title: 'Read HR' }],
                },
              ],
            },
          ],
        },
      ],
    });
    const groupedDefinition = {
      ...definition,
      grants: [
        ...definition.grants,
        {
          resource: { type: 'settings', id: 'hr' },
          actions: [{ action: 'read' }],
        },
      ],
    };
    api.request.mockImplementation(async ({ path }: { path: string }) => ({
      data:
        path === 'access/options'
          ? await client.loadOptions('permissionSets')
          : path.includes('/members')
            ? []
            : { ...snapshot, sets: [groupedDefinition] },
    }));
    mountAt(
      <SubjectDetail />,
      'access/roles/:type/:id/permissions',
      '/access/roles/org.dutyRole/hr/permissions',
    );
    const hr = await screen.findByRole('button', {
      name: /System administration/,
    });
    expect(screen.getByText('Read budget')).toBeVisible();
    expect(screen.getByText('Read HR')).toBeVisible();
    await userEvent.click(hr);
    expect(screen.getByText('Read HR')).toBeVisible();
    expect(screen.queryByText('Read budget')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /^All/ }));
    expect(screen.getByText('Read budget')).toBeVisible();
    expect(screen.getByText('Read HR')).toBeVisible();
  });
});

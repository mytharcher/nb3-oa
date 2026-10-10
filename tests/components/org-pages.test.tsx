import { DepartmentForm } from '../../client/pages/org/departments/department-form.js';
// Component tests of the organisation settings pages (positions and grades share one implementation; departments and
// duty roles have their own). The setup follows tests/components/page-harness.test.tsx: the real strict i18n runtime
// with the application's locales, and mocks only for what the pages reach outside themselves for.
import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import DepartmentPage from '../../client/pages/org/departments/department.js';
import EditDepartmentPage from '../../client/pages/org/departments/edit.js';
import DepartmentsPage from '../../client/pages/org/departments/index.js';
import DutyRolesPage from '../../client/pages/org/duty-roles/index.js';
import DutyRolePage from '../../client/pages/org/duty-roles/role.js';
import PositionEditPage from '../../client/pages/org/positions/edit.js';
import PositionsPage from '../../client/pages/org/positions/index.js';
import PositionNewPage from '../../client/pages/org/positions/new.js';

const { api, toaster, permission, refresh } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn(), close: vi.fn() },
  permission: { can: true, isPending: false },
  refresh: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({
    can: permission.can,
    isPending: permission.isPending,
    error: undefined,
    retry: vi.fn(),
  }),
}));

const org = enUS.org;

const runtime = await createTestI18nRuntime({
  application: { namespace: packageMetadata.name, resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <TestI18nProvider runtime={runtime} namespace={packageMetadata.name}>
      {children}
    </TestI18nProvider>
  );
}

type Handler = (options: {
  path: string;
  method?: string;
  json?: unknown;
}) => unknown;

/** Answers each request by method and path; anything unexpected fails loudly. */
function answer(routes: Record<string, Handler | unknown>): void {
  api.request.mockImplementation(
    async (options: { path: string; method?: string; json?: unknown }) => {
      const key = `${options.method ?? 'GET'} ${options.path}`;
      if (!(key in routes)) throw new Error(`Unexpected request ${key}`);
      const route = routes[key];
      return typeof route === 'function' ? (route as Handler)(options) : route;
    },
  );
}

function apiError(
  status: number,
  reason?: string,
  field?: string,
): ApiClientError {
  return new ApiClientError('Request failed', {
    status,
    method: 'POST',
    url: '/api/x',
    ...(reason ? { reason } : {}),
    payload: {
      error: {
        reason,
        ...(field ? { fieldViolations: [{ field, description: 'x' }] } : {}),
      },
    },
  });
}

function renderRoutes(
  routes: Parameters<typeof createMemoryRouter>[0],
  url: string,
) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

const POSITIONS = [
  { id: 'p1', code: 'BUYER', title: 'Buyer', active: true, sortOrder: 2 },
  { id: 'p2', code: 'CLERK', title: 'Clerk', active: false, sortOrder: 1 },
];

function renderPositions(url: string) {
  return renderRoutes(
    [
      {
        path: '/positions',
        element: <PositionsPage />,
        children: [
          { path: 'new', element: <PositionNewPage /> },
          { path: 'edit/:positionId', element: <PositionEditPage /> },
        ],
      },
    ],
    url,
  );
}

beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  refresh.mockReset();
  permission.can = true;
  permission.isPending = false;
});

describe('positions (catalogue) page', () => {
  it('lists every position in sort order with status text', async () => {
    answer({ 'GET positions': { data: POSITIONS, meta: { total: 2 } } });
    renderPositions('/positions');

    const rows = await screen.findAllByRole('row');
    // Header, then Clerk (sort 1) before Buyer (sort 2).
    expect(rows[1]).toHaveTextContent('Clerk');
    expect(rows[1]).toHaveTextContent(org.common.inactive);
    expect(rows[2]).toHaveTextContent('Buyer');
    expect(
      screen.getByRole('button', { name: org.positions.create }),
    ).toHaveAttribute('href', '/positions/new');
  });

  it('filters by search text and offers to clear it', async () => {
    answer({ 'GET positions': { data: POSITIONS, meta: { total: 2 } } });
    renderPositions('/positions?q=zzz');

    expect(await screen.findByText(org.common.noResults)).toBeInTheDocument();
    await userEvent.click(
      screen.getAllByRole('button', { name: org.common.clearFilters })[0],
    );
    expect(await screen.findByText('Buyer')).toBeInTheDocument();
  });

  it('puts the only create action in the empty state', async () => {
    answer({ 'GET positions': { data: [], meta: { total: 0 } } });
    renderPositions('/positions');

    expect(
      await screen.findByText(org.positions.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: org.positions.create }),
    ).toHaveLength(1);
  });

  it('shows no write controls without the update action', async () => {
    permission.can = false;
    answer({ 'GET positions': { data: POSITIONS, meta: { total: 2 } } });
    renderPositions('/positions');

    expect(await screen.findByText('Buyer')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: org.positions.create }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: org.common.actions.more.replace('{{name}}', 'Buyer'),
      }),
    ).not.toBeInTheDocument();
  });

  it('explains a 403 without offering a retry', async () => {
    api.request.mockRejectedValue(apiError(403));
    renderPositions('/positions');

    expect(await screen.findByText(org.errors.forbidden)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: enUS['status.retry'] }),
    ).not.toBeInTheDocument();
  });

  it('validates on submit, shows a code conflict below the code, then creates', async () => {
    let attempts = 0;
    answer({
      'GET positions': { data: POSITIONS, meta: { total: 2 } },
      'POST positions': ({ json }: { json?: unknown }) => {
        attempts += 1;
        if (attempts === 1) throw apiError(409, 'POSITION_CODE_EXISTS', 'code');
        return {
          data: { id: 'p3', active: true, sortOrder: 0, ...(json as object) },
        };
      },
    });
    const router = renderPositions('/positions/new');

    const dialog = await screen.findByRole('dialog', {
      name: org.positions.create,
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: enUS.actions.create }),
    );
    expect(
      await within(dialog).findByText(org.common.form.titleRequired),
    ).toBeInTheDocument();
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );

    await userEvent.type(
      within(dialog).getByLabelText(new RegExp(org.common.fields.title)),
      'Driver',
    );
    await userEvent.type(
      within(dialog).getByLabelText(new RegExp(`^${org.common.fields.code}`)),
      'BUYER',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: enUS.actions.create }),
    );
    expect(
      await within(dialog).findByText(org.errors.codeTaken),
    ).toBeInTheDocument();

    const code = within(dialog).getByLabelText(
      new RegExp(`^${org.common.fields.code}`),
    );
    await userEvent.clear(code);
    await userEvent.type(code, 'DRIVER');
    await userEvent.click(
      within(dialog).getByRole('button', { name: enUS.actions.create }),
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/positions'),
    );
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'positions',
        method: 'POST',
        json: { code: 'DRIVER', title: 'Driver' },
      }),
    );
    expect(toaster.show).toHaveBeenCalledWith({
      type: 'success',
      title: 'Created position "Driver"',
    });
  });

  it('loads the latest record before editing', async () => {
    answer({
      'GET positions': { data: POSITIONS, meta: { total: 2 } },
      'GET positions/p1': {
        data: { ...POSITIONS[0], title: 'Senior buyer' },
      },
    });
    renderPositions('/positions/edit/p1');

    const dialog = await screen.findByRole('dialog', {
      name: org.positions.editTitle,
    });
    expect(
      await within(dialog).findByDisplayValue('Senior buyer'),
    ).toBeInTheDocument();
  });
});

const DEPARTMENTS = [
  {
    id: 'hq',
    title: 'Head office',
    code: 'HQ',
    parentId: null,
    managerId: 'u1',
    manager: { id: 'u1', name: 'Alice' },
    executiveId: 'u2',
    executive: { id: 'u2', name: 'Bob' },
    active: true,
    sortOrder: 0,
    memberCount: 0,
  },
  {
    id: 'rd',
    title: 'R&D',
    code: null,
    parentId: 'hq',
    managerId: null,
    manager: null,
    executiveId: null,
    executive: null,
    active: true,
    sortOrder: 0,
    memberCount: 1,
  },
];

function renderDepartments(url: string) {
  return renderRoutes(
    [
      {
        path: '/departments',
        element: <DepartmentsPage />,
        children: [
          {
            path: ':departmentId',
            element: <DepartmentPage />,
            children: [{ path: 'edit', element: <EditDepartmentPage /> }],
          },
        ],
      },
    ],
    url,
  );
}

describe('departments page', () => {
  it('shows the tree and the selected department with its inherited executive and members', async () => {
    answer({
      'GET departments': { data: DEPARTMENTS, meta: { total: 2 } },
      'GET departments/rd/members': {
        data: [
          {
            userId: 'u3',
            user: { id: 'u3', name: 'Carol', email: 'c@x' },
            primary: true,
          },
        ],
        meta: { total: 1 },
      },
    });
    renderDepartments('/departments/rd');

    const tree = await screen.findByRole('navigation', {
      name: org.departments.treeLabel,
    });
    expect(within(tree).getByRole('link', { name: 'R&D' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(await screen.findByText('Carol')).toBeInTheDocument();
    expect(
      screen.getByText(org.departments.members.primaryBadge),
    ).toBeInTheDocument();
    // R&D names no executive, so the head office's shows as inherited.
    expect(
      screen.getByText('(inherited from "Head office")'),
    ).toBeInTheDocument();
  });

  it('filters the tree, keeping the ancestors of a match', async () => {
    answer({ 'GET departments': { data: DEPARTMENTS, meta: { total: 2 } } });
    renderDepartments('/departments?q=r%26d');

    const tree = await screen.findByRole('navigation', {
      name: org.departments.treeLabel,
    });
    expect(
      within(tree).getByRole('link', { name: 'Head office' }),
    ).toBeInTheDocument();
    expect(within(tree).getByRole('link', { name: 'R&D' })).toBeInTheDocument();
  });

  it('shows a cycle refused by the server below the parent field', async () => {
    answer({
      'GET departments': { data: DEPARTMENTS, meta: { total: 2 } },
      'GET departments/hq/members': { data: [], meta: { total: 0 } },
      'GET departments/hq': { data: DEPARTMENTS[0] },
      'GET departments/options': {
        data: DEPARTMENTS.map(({ id, title, code, parentId, active }) => ({
          id,
          title,
          code,
          parentId,
          active,
        })),
      },
      'PATCH departments/hq': () => {
        throw apiError(400, 'PARENT_CYCLE', 'parentId');
      },
    });
    renderDepartments('/departments/hq/edit');

    const dialog = await screen.findByRole('dialog', {
      name: org.departments.editTitle,
    });
    const title = await within(dialog).findByDisplayValue('Head office');
    await userEvent.type(title, '!');
    await userEvent.click(
      within(dialog).getByRole('button', { name: enUS.actions.save }),
    );
    expect(
      await within(dialog).findByText(org.errors.parentCycle),
    ).toBeInTheDocument();
    // Only the changed field is sent.
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'departments/hq',
        method: 'PATCH',
        json: { title: 'Head office!' },
      }),
    );
  });

  it('disables the executive picker on child departments', async () => {
    answer({
      'GET departments': { data: DEPARTMENTS, meta: { total: 2 } },
      'GET departments/rd': { data: DEPARTMENTS[1] },
      'GET departments/rd/members': { data: [], meta: { total: 0 } },
      'GET departments/options': { data: DEPARTMENTS },
    });
    renderDepartments('/departments/rd/edit');
    const dialog = await screen.findByRole('dialog', {
      name: org.departments.editTitle,
    });
    expect(
      await within(dialog).findByLabelText(org.departments.fields.executive),
    ).toBeDisabled();
  });

  it('clears the local executive when choosing a parent and submits the change together', async () => {
    const other = {
      ...DEPARTMENTS[0]!,
      id: 'other',
      title: 'Other department',
      code: 'OTHER',
      executiveId: null,
      executive: null,
    };
    answer({
      'GET departments/options': { data: [...DEPARTMENTS, other] },
      'GET users': { data: [], meta: { page: 1, pageSize: 20, total: 0 } },
      'PATCH departments/hq': ({ json }) => ({
        data: { ...DEPARTMENTS[0], ...(json as object) },
      }),
    });
    render(
      <I18n>
        <DepartmentForm
          formId='move-department'
          department={DEPARTMENTS[0]!}
          onSubmitted={vi.fn()}
          onSubmittingChange={vi.fn()}
        />
      </I18n>,
    );
    expect(screen.getByLabelText(org.departments.fields.executive)).toHaveValue(
      'Bob',
    );
    const parent = screen.getByLabelText(org.departments.fields.parent);
    await waitFor(() => expect(parent).toBeEnabled());
    await userEvent.type(parent, 'Other');
    await userEvent.click(
      await screen.findByRole('option', { name: /Other department/ }),
    );
    expect(
      screen.getByLabelText(org.departments.fields.executive),
    ).toBeDisabled();
    expect(screen.getByLabelText(org.departments.fields.executive)).toHaveValue(
      '',
    );
    fireEvent.submit(document.getElementById('move-department')!);
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'departments/hq',
          method: 'PATCH',
          json: { parentId: 'other', executiveId: null },
        }),
      ),
    );
  });

  it('confirms before disabling a department', async () => {
    answer({
      'GET departments': { data: DEPARTMENTS, meta: { total: 2 } },
      'GET departments/rd/members': { data: [], meta: { total: 0 } },
      'POST departments/rd/disable': {
        data: { ...DEPARTMENTS[1], active: false },
      },
    });
    renderDepartments('/departments/rd');

    await userEvent.click(
      await screen.findByRole('button', {
        name: org.common.actions.more.replace('{{name}}', 'R&D'),
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: org.common.actions.disable }),
    );
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('Disable department "R&D"?');
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );
    await userEvent.click(
      within(confirm).getByRole('button', { name: org.common.actions.disable }),
    );
    await waitFor(() =>
      expect(toaster.show).toHaveBeenCalledWith({
        type: 'success',
        title: 'Disabled department "R&D"',
      }),
    );
  });
});

describe('duty roles page', () => {
  const ROLES = [
    {
      code: 'cashier',
      title: { key: 'org.dutyRoleTitles.cashier', ns: packageMetadata.name },
      description: null,
      active: true,
      sortOrder: 10,
      memberCount: 1,
    },
  ];

  it('renders seeded titles in the reader language and opens the members drawer', async () => {
    answer({
      'GET dutyRoles': { data: ROLES, meta: { total: 1 } },
      'GET dutyRoles/cashier': { data: ROLES[0] },
      'GET dutyRoles/cashier/members': {
        data: [{ userId: 'u9', user: { id: 'u9', name: 'Dora' } }],
        meta: { total: 1 },
      },
    });
    renderRoutes(
      [
        {
          path: '/duty-roles',
          element: <DutyRolesPage />,
          children: [{ path: ':code', element: <DutyRolePage /> }],
        },
      ],
      '/duty-roles',
    );

    await userEvent.click(await screen.findByRole('link', { name: 'Cashier' }));
    const drawer = await screen.findByRole('dialog', { name: 'Cashier' });
    expect(await within(drawer).findByText('Dora')).toBeInTheDocument();
    expect(within(drawer).getByText('cashier')).toBeInTheDocument();
  });
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import {
  createMemoryRouter,
  RouterProvider,
  useOutletContext,
} from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import authorization from '../../client/locales/administration/authorization/en-US.js';
import {
  PermissionSetsPanel,
  type PermissionWorkspaceContext,
} from '../../client/pages/administration/authorization/pages/permission-sets/panel.js';

const client = vi.hoisted(() => ({
  listPermissionSets: vi.fn().mockResolvedValue([]),
  createPermissionSet: vi.fn().mockImplementation(async (value) => value),
  invalidate: vi.fn(),
}));
vi.mock(
  '../../client/pages/administration/authorization/use-authorization-client.js',
  () => ({
    useAuthorizationClient: () => client,
  }),
);
vi.mock(
  '../../client/pages/administration/authorization/components/use-settings-actions.js',
  () => ({
    useSettingsActions: () => ({
      create: true,
      update: true,
      delete: true,
      assign: true,
    }),
  }),
);
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: vi.fn() }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { '@nocobase/app-plugin-authorization': authorization },
});
function Content() {
  return useOutletContext<PermissionWorkspaceContext>().content;
}

it('saves a permission set in a right drawer, preserves workspace URL state and allows reopening after close', async () => {
  const router = createMemoryRouter(
    [
      {
        path: '/sets',
        element: (
          <PermissionSetsPanel
            options={{
              sections: [],
              subjectTypes: [],
              collections: [],
              recordAccess: [],
            }}
          />
        ),
        children: [
          { path: 'new', element: <Content /> },
          { path: 'edit/:permissionSetKey', element: <Content /> },
        ],
      },
    ],
    { initialEntries: ['/sets/new?section=business#tree'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  const drawer = await screen.findByRole('dialog');
  expect(drawer).toHaveAttribute('data-presentation', 'drawer');
  await userEvent.type(
    within(drawer).getByRole('textbox', { name: /Name/ }),
    'Fixture role',
  );
  await userEvent.type(
    within(drawer).getByRole('textbox', { name: /Key/ }),
    'fixture',
  );
  await userEvent.click(
    within(drawer).getByRole('button', {
      name: authorization.permissionSets.editor.save,
    }),
  );
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/sets/edit/fixture'),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(router.state.location.search).toBe('?section=business');
  expect(router.state.location.hash).toBe('#tree');
  expect(client.createPermissionSet).toHaveBeenCalledExactlyOnceWith({
    key: 'fixture',
    title: 'Fixture role',
    grants: [],
  });
  await userEvent.click(
    screen.getByRole('button', {
      name: authorization.common.edit,
      exact: true,
    }),
  );
  await screen.findByRole('dialog', { name: 'Fixture role' });
  await userEvent.click(
    screen.getByRole('button', { name: 'Close', exact: true }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(router.state.location.pathname).toBe('/sets/edit/fixture');
});

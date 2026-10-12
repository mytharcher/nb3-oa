import { ApiClientError, NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router';
import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/vendor-qualification.en-US.js';
import Action from '../../../client/pages/vendor-qualifications/action-dialog.js';
const { api, reload, toast, grant } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  toast: vi.fn(),
  grant: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'reviewer' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: grant.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
});
const detail = {
  record: { id: 'request-1', name: 'Named supplier', lifecycleVersion: 7 },
  view: { available: [] },
  runs: [{ run: { id: 'run-1', contentHash: 'actual-frozen-hash' } }],
  actions: [
    {
      task: {
        id: 'task-1',
        runId: 'run-1',
        stage: 'committee_v1',
        assigneeId: 'reviewer',
      },
      actions: [{ name: 'abstain', contentHash: true, tone: 'danger' }],
    },
  ],
  runActions: [],
};
function show(name = 'abstain', target = 'task-1') {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter
        initialEntries={[`/source/request-1/action/${name}/${target}`]}
      >
        <NavigationGuardProvider>
          <Routes>
            <Route
              path='/source/:requestId'
              element={
                <Outlet
                  context={{
                    detail,
                    writable: true,
                    reload,
                    reloadDetail: reload,
                  }}
                />
              }
            >
              <Route path='action/:actionName/:targetId' element={<Action />} />
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  grant.can = true;
});
afterEach(cleanup);
it('submits from the action dialog without a second confirmation', async () => {
  const current = {
    ...detail,
    view: { available: [{ name: 'submit', allowed: true }] },
  };
  api.request.mockResolvedValue({ data: current });
  show('submit', 'request-1');
  await screen.findByLabelText('Comment');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'vendorQualifications/request-1/transition',
        json: expect.objectContaining({ name: 'submit', version: 7 }),
      }),
    ),
  );
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(
    api.request.mock.calls.filter(([call]) => call.method === 'POST'),
  ).toHaveLength(1);
});
it('confirms abstention by supplier name and veto consequence, then posts the real target/hash', async () => {
  api.request.mockResolvedValue({ data: detail });
  show();
  await screen.findByLabelText('Comment');
  await waitFor(() => expect(screen.queryByText('Unavailable')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  const confirm = await screen.findByRole('alertdialog');
  expect(
    within(confirm).getByText('Abstaining waives this seat’s veto.'),
  ).toBeTruthy();
  expect(within(confirm).getByRole('heading').textContent).toContain(
    'Named supplier',
  );
  fireEvent.click(within(confirm).getByRole('button', { name: 'Abstain' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'vendorQualifications/request-1/action',
        json: expect.objectContaining({
          target: { taskId: 'task-1' },
          action: 'abstain',
          contentHash: 'actual-frozen-hash',
          input: {},
        }),
      }),
    ),
  );
});
it('will not fabricate a committee return offer or use another target id', async () => {
  api.request.mockResolvedValue({ data: detail });
  show('return', 'unrelated-task');
  await screen.findByLabelText('Comment');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(api.request.mock.calls.some(([call]) => call.method === 'POST')).toBe(
    false,
  );
});
it('does not offer Retry after a 403, clears old input and blocks a second write', async () => {
  api.request.mockImplementation(({ method }: { method?: string }) =>
    method === 'POST'
      ? Promise.reject(
          new ApiClientError('Forbidden', {
            status: 403,
            method: 'POST',
            url: 'action',
          }),
        )
      : Promise.resolve({ data: detail }),
  );
  show();
  await screen.findByLabelText('Comment');
  fireEvent.change(screen.getByLabelText('Comment'), {
    target: { value: 'My vote' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Abstain',
    }),
  );
  await screen.findByText('Access unavailable. Contact an administrator.');
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  expect(screen.queryByLabelText('Comment')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(
    api.request.mock.calls.filter(([call]) => call.method === 'POST'),
  ).toHaveLength(1);
});

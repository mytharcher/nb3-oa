import { NavigationGuardProvider } from '@nocobase/app-client';
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
  localStorage.clear();
  grant.can = true;
});
afterEach(cleanup);
it('acceptance: an uncertain action cannot reuse its key with a changed payload', async () => {
  const posted: Record<string, unknown>[] = [];
  api.request.mockImplementation(
    ({ method, json }: { method?: string; json?: Record<string, unknown> }) => {
      if (method === 'POST') {
        posted.push(structuredClone(json!));
        return Promise.reject(new Error('connection lost after send'));
      }
      return Promise.resolve({ data: detail });
    },
  );
  show();
  await screen.findByLabelText('Comment');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled(),
  );
  fireEvent.change(screen.getByLabelText('Comment'), {
    target: { value: 'Original vote' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: 'Abstain',
    }),
  );
  expect(screen.getByLabelText('Comment')).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Comment'), {
    target: { value: 'Changed vote' },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(posted).toHaveLength(2));
  expect(posted[1]).toEqual(posted[0]);
  cleanup();
  show();
  const restoredComment = await screen.findByLabelText('Comment');
  expect(restoredComment).toBeDisabled();
  expect(restoredComment).toHaveValue('Original vote');
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(posted).toHaveLength(3));
  expect(posted[2]).toEqual(posted[0]);
});

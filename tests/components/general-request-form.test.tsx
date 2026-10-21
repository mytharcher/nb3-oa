import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import general from '../../client/locales/modules/general.en-US.js';
import Form from '../../client/pages/general-requests/form-dialog.js';
const { api, reload } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: true }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
vi.mock('../../client/components/user-picker.js', () => ({
  UserPicker: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
  }) => (
    <input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...general } },
});
function open() {
  const router = createMemoryRouter(
    [
      {
        path: '/mine',
        element: <Outlet context={{ reload, basePath: '/mine' }} />,
        children: [{ path: 'newGeneral', element: <Form /> }],
      },
    ],
    { initialEntries: ['/mine/newGeneral'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Title/), 'Equipment exception');
  await user.type(
    screen.getByLabelText(/Request details/),
    'A business justification',
  );
  await user.type(screen.getByLabelText(/Additional approver 1/), 'reviewer');
  return user;
}
beforeEach(() => {
  api.request.mockReset();
  reload.mockReset();
});
it('saves ordered reviewers and closes a successfully saved form', async () => {
  api.request.mockResolvedValue({
    data: { record: { id: 'g1', lifecycleVersion: 0, status: 'draft' } },
  });
  const router = open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: /Add approver/ }));
  await user.type(screen.getByLabelText(/Additional approver 2/), 'reviewer2');
  await user.click(screen.getByRole('button', { name: /Save draft/ }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      json: expect.objectContaining({
        extraApproverIds: ['reviewer', 'reviewer2'],
        attachments: [],
      }),
    }),
  );
});
it('locks creation when the response is uncertain', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('lost', {
      status: 500,
      method: 'POST',
      url: '/api/generalRequests',
    } as ConstructorParameters<typeof ApiClientError>[1]),
  );
  open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: /Save draft/ }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Save draft/ })).toBeDisabled(),
  );
  expect(api.request).toHaveBeenCalledTimes(1);
});
it('rejects the applicant as an extra reviewer before writing', async () => {
  open();
  const user = await fill();
  const approver = screen.getByLabelText(/Additional approver 1/);
  await user.clear(approver);
  await user.type(approver, 'alice');
  await user.click(screen.getByRole('button', { name: /Save draft/ }));
  await waitFor(() =>
    expect(
      screen.getByText(/Choose one to three distinct/),
    ).toBeInTheDocument(),
  );
  expect(api.request).not.toHaveBeenCalled();
});

it('creates and submits from one form using the saved lifecycle version', async () => {
  api.request.mockImplementation(
    async ({
      path,
      json,
    }: {
      path: string;
      json?: Record<string, unknown>;
    }) => {
      if (path === 'generalRequests')
        return {
          data: { record: { id: 'g1', lifecycleVersion: 7, status: 'draft' } },
        };
      if (path === 'generalRequests/g1/transition') {
        expect(json).toMatchObject({
          transition: 'submit',
          version: 7,
          input: {},
        });
        return {
          data: { record: { id: 'g1', lifecycleVersion: 8, status: 'head' } },
        };
      }
      throw new Error('Unexpected endpoint');
    },
  );
  const router = open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(api.request).toHaveBeenCalledTimes(2);
});
it('retains a committed draft and retries only submission after a business rejection', async () => {
  let attempts = 0;
  api.request.mockImplementation(async ({ path }: { path: string }) => {
    if (path === 'generalRequests')
      return {
        data: { record: { id: 'g1', lifecycleVersion: 7, status: 'draft' } },
      };
    if (++attempts === 1)
      throw new ApiClientError('Approval directory unavailable', {
        status: 422,
        method: 'POST',
        url: '/api/generalRequests/g1/transition',
      } as ConstructorParameters<typeof ApiClientError>[1]);
    return {
      data: { record: { id: 'g1', lifecycleVersion: 8, status: 'head' } },
    };
  });
  const router = open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await screen.findByText(enUS.approvals.draftSavedSubmitFailed);
  expect(router.state.location.pathname).toBe('/mine/newGeneral');
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(
    api.request.mock.calls.filter(
      ([request]) => request.path === 'generalRequests',
    ),
  ).toHaveLength(1);
});

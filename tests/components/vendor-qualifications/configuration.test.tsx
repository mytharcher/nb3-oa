import { ApiClientError } from '@nocobase/app-client';
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
} from '@testing-library/react';
import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/vendor-qualification.en-US.js';
import ConfigurationPage from '../../../client/pages/vendor-qualifications/configuration.js';
const { api, toast, grant } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toast: vi.fn(),
  grant: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'protected-admin' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: grant.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
});
const configuration = {
  versions: [
    {
      version: 1,
      min: 2,
      settle: 'veto',
      seats: [
        { key: 'purchase', source: 'purchasing', veto: false },
        { key: 'finance', source: 'finance', veto: true },
        { key: 'head', source: 'applicantHead', veto: false },
      ],
    },
  ],
  activeCommitteeVersion: 1,
  assignments: [
    [
      {
        committeeVersion: 1,
        seatKey: 'purchase',
        personId: 'fixed-purchaser',
        version: 6,
      },
      { committeeVersion: 1, seatKey: 'finance', personId: null, version: 2 },
    ],
  ],
  removalHead: { personId: 'fixed-purchaser', version: 3 },
  knownUsers: [{ id: 'fixed-purchaser', name: 'Named purchaser' }],
};
function show() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <ConfigurationPage />
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  grant.can = true;
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('candidates')
        ? {
            people: [{ id: 'fixed-purchaser', name: 'Named purchaser' }],
            nextOffset: null,
          }
        : configuration,
    }),
  );
});
afterEach(cleanup);
it('shows named fixed people, uses bounded eligible candidates and never adds a fixed department-head picker', async () => {
  show();
  await screen.findByText('Uses the applicant’s main department head');
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'vendorQualifications/configuration/candidates',
        query: expect.objectContaining({ source: 'purchasing', limit: '20' }),
      }),
    ),
  );
  expect(screen.getAllByText('Named purchaser').length).toBeGreaterThan(0);
  expect(screen.queryByText('fixed-purchaser')).toBeNull();
  expect(screen.queryByLabelText('Applicant department head')).toBeNull();
  expect(api.request.mock.calls.some(([call]) => call.path === 'users')).toBe(
    false,
  );
});
it('publishes a new immutable structure with preserved default threshold and an audit reason, retaining restart guidance', async () => {
  show();
  await screen.findByLabelText('Version *');
  fireEvent.change(
    screen.getByLabelText('Reason for change *', {
      selector: '#committee-reason',
    }),
    { target: { value: 'New review structure' } },
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Publish review version' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'vendorQualifications/configuration/versions',
        json: {
          ...configuration.versions[0],
          version: 2,
          reason: 'New review structure',
        },
      }),
    ),
  );
  expect(
    screen.getByText(
      'Restart the application after publishing. Existing requests retain their version.',
    ),
  ).toBeTruthy();
});
it('does not query configuration candidates or expose configuration when the protected endpoint refuses access', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('Forbidden', {
      status: 403,
      method: 'GET',
      url: 'configuration',
    }),
  );
  show();
  await screen.findByText('Access unavailable. Contact an administrator.');
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  expect(
    api.request.mock.calls.some(([call]) => call.path.endsWith('candidates')),
  ).toBe(false);
});
it('saves a fixed seat with its actual independent expectedVersion rather than rewriting current tasks', async () => {
  show();
  const reason = await screen.findByLabelText('Reason for change *', {
    selector: '#config-reason-purchase',
  });
  fireEvent.change(reason, { target: { value: 'Future review coverage' } });
  fireEvent.submit(reason.closest('form')!);
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        path: 'vendorQualifications/configuration/assignments',
        json: {
          committeeVersion: 1,
          seatKey: 'purchase',
          personId: 'fixed-purchaser',
          expectedVersion: 6,
          reason: 'Future review coverage',
        },
      }),
    ),
  );
  expect(
    api.request.mock.calls.some(([call]) => call.path.endsWith('/action')),
  ).toBe(false);
});

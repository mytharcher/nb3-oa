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
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/vendor-qualification.en-US.js';
import Form from '../../../client/pages/vendor-qualifications/form-page.js';
import type { QualificationRecord } from '../../../client/pages/vendor-qualifications/types.js';
const { api, permission, actor, toast, reload } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: {
    submit: true,
    view: true,
    paymentAccount: true,
    updatePaymentAccount: true,
    isPending: false,
  },
  actor: { id: 'owner' },
  toast: vi.fn(),
  reload: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: actor.id } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: ({ action }: { action: keyof typeof permission }) => ({
    can: permission[action],
    isPending: permission.isPending,
  }),
}));
vi.mock(
  '../../../client/pages/vendor-qualifications/shared.js',
  async (original) => ({
    ...(await original<
      typeof import('../../../client/pages/vendor-qualifications/shared.js')
    >()),
    Choice: ({
      id,
      label,
      value,
      items,
      onChange,
      disabled,
    }: {
      id: string;
      label: string;
      value: string;
      items: { value: string; label: string }[];
      onChange: (value: string) => void;
      disabled: boolean;
    }) => (
      <select
        id={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value='' />
        {items.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
    ),
  }),
);
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
});
const vendor = '11111111-1111-4111-8111-111111111111';
const options = {
  applicant: { id: 'owner', name: 'Owner' },
  timeZone: 'Asia/Shanghai',
  canCreateQualification: true,
  canCreateRemoval: false,
  vendors: [
    {
      id: vendor,
      name: 'Named supplier',
      category: 'services',
      status: 'manual',
      eligibleOperations: ['qualify'],
    },
  ],
  categories: [{ code: 'services', label: { 'en-US': 'Services' } }],
  committeeVersions: [],
  activeCommitteeVersion: 1,
};
const record = {
  id: 'request-1',
  operation: 'qualify',
  vendorId: vendor,
  name: 'Named supplier',
  category: 'services',
  reason: '',
  quoteCents: 0,
  cases: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  attachments: [],
  qualificationExpiry: null,
  applicantId: 'owner',
  createdById: 'owner',
  applicant: { id: 'owner', name: 'Owner' },
  createdBy: { id: 'owner', name: 'Owner' },
  number: 'SQ-1',
  status: 'draft',
  lifecycleVersion: 1,
  sourceVendorVersion: null,
  committeeVersion: null,
  committeeSnapshot: null,
  createdAt: '2026-10-10T17:00:00Z',
} satisfies QualificationRecord;
const detail = {
  record,
  view: { available: [{ name: 'edit', allowed: true }] },
  runs: [],
  actions: [],
  runActions: [],
  timeline: { runs: [] },
  upcoming: [],
  knownUsers: [],
  timeZone: 'Asia/Shanghai',
};
function show(element: React.ReactNode, path = '/source') {
  const router = createMemoryRouter(
    [
      {
        path: '/source',
        element: (
          <NavigationGuardProvider>
            <Outlet
              context={{ reload, detail, writable: true, reloadDetail: reload }}
            />
          </NavigationGuardProvider>
        ),
        children: [
          { index: true, element: <div>Original source</div> },
          { path: 'new', element },
          { path: ':requestId', element },
        ],
      },
      {
        path: '/vendorQualifications',
        element: <NavigationGuardProvider>{element}</NavigationGuardProvider>,
        children: [{ path: ':requestId', element: <div>Opened request</div> }],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  actor.id = 'owner';
  Object.assign(permission, {
    submit: true,
    view: true,
    paymentAccount: true,
    updatePaymentAccount: true,
    isPending: false,
  });
});
afterEach(cleanup);
it('acceptance: final refusal removes the old record fields from an edit form', async () => {
  let recordRead = 0;
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) => {
      if (method === 'POST')
        return Promise.reject(
          new ApiClientError('Conflict', {
            status: 409,
            method: 'POST',
            url: path,
          }),
        );
      if (!path.endsWith('/options') && recordRead++ > 0)
        return Promise.reject(
          new ApiClientError('Forbidden', {
            status: 403,
            method: 'GET',
            url: path,
          }),
        );
      return Promise.resolve({
        data: path.endsWith('/options')
          ? options
          : {
              ...detail,
              record: {
                ...record,
                reason: 'Confidential old proposal',
                contactPhone: '55512345',
                quoteCents: 9876500,
              },
            },
      });
    },
  );
  show(<Form />, '/source/request-1');
  await screen.findByDisplayValue('Confidential old proposal');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText('Access unavailable. Contact an administrator.');
  expect(screen.queryByDisplayValue('Confidential old proposal')).toBeNull();
  expect(screen.queryByDisplayValue('55512345')).toBeNull();
});

import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import locale from '../../../client/locales/modules/seals.en-US.js';
import List from '../../../client/pages/seals/index.js';
import Detail from '../../../client/pages/seals/detail.js';
import Ledger from '../../../client/pages/seals/ledger.js';
import Action from '../../../client/pages/seals/action.js';
import Form from '../../../client/pages/seals/form.js';
import InstanceForm from '../../../client/pages/seals/instance-form.js';
import { ApiClientError } from '@nocobase/app-client';
const { api, reload } = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  reload: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authentication/client')
  >()),
  useAuthentication: () => ({ session: { user: { id: 'keeper' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authorization/client')
  >()),
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: true, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...locale } },
});
function Shell() {
  return <Outlet context={{ reload }} />;
}
function mount(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/seal-ledger', element: <Ledger /> },
      {
        path: '/seal-instances',
        element: <Shell />,
        children: [
          { path: 'new', element: <InstanceForm /> },
          { path: 'edit/:sealInstanceId', element: <InstanceForm /> },
        ],
      },
      {
        path: '/seal-requests',
        element: <Shell />,
        children: [
          { index: true, element: <List /> },
          { path: ':sealRequestId/edit', element: <Form /> },
          { path: ':sealRequestId', element: <Detail /> },
          {
            path: ':sealRequestId/actions/:operation/:taskId',
            element: <Action />,
          },
        ],
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
  api.request.mockReset();
  api.stream.mockReset();
  reload.mockReset();
});
it('formats ledger instants in the company timezone rather than the browser timezone', async () => {
  const instant = '2026-10-11T23:00:00.000Z';
  api.request.mockResolvedValue({
    data: [
      {
        id: 'timezone-ledger',
        sealId: 'timezone-seal',
        applicant: { id: 'owner', name: 'Timezone owner' },
        registeredBy: { id: 'keeper', name: 'Timezone keeper' },
        approvedCopies: 2,
        actualCopies: 2,
        borrowedAt: instant,
        sealedAt: instant,
      },
    ],
    meta: { total: 1, page: 1, pageSize: 20, timeZone: 'Pacific/Honolulu' },
  });
  mount('/seal-ledger');
  const companyTime = new Date(instant).toLocaleString('en-US', {
    timeZone: 'Pacific/Honolulu',
  });
  expect(await screen.findAllByText(companyTime)).toHaveLength(2);
  const utcTime = new Date(instant).toLocaleString('en-US', {
    timeZone: 'UTC',
  });
  expect(screen.queryByText(utcTime)).not.toBeInTheDocument();
});
it('keeps initiation visible during loading and in the loaded empty table', async () => {
  let resolve!: (v: unknown) => void;
  api.request.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  mount('/seal-requests');
  expect(
    screen
      .getByRole('button', { name: 'New seal request' })
      .closest('[data-slot="application-actions"]'),
  ).not.toBeNull();
  resolve({ data: [] });
  expect(await screen.findByText('No seal requests yet')).toBeInTheDocument();
  expect(
    screen.getByRole('columnheader', { name: 'Purpose' }),
  ).toBeInTheDocument();
});
it('refuses an action URL whose task is absent from the real current offers', async () => {
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve(
      path.includes('capabilities')
        ? {
            data: {
              timeZone: 'Asia/Shanghai',
              transitions: [],
              taskActions: [],
              canActualReturn: false,
            },
          }
        : {
            data: {
              record: {
                id: 'r1',
                status: 'stamping',
                number: 'SEAL-1',
                lifecycleVersion: 4,
              },
              tasks: [],
              actions: [],
            },
          },
    ),
  );
  mount('/seal-requests/r1/actions/complete/forged');
  await screen.findByText(
    'This record or action is unavailable. Return to the list and refresh.',
  );
  expect(
    screen.getByRole('button', { name: 'Complete actual handling' }),
  ).toBeDisabled();
  expect(api.request.mock.calls.every(([v]) => v.method !== 'POST')).toBe(true);
});
it('claim sends the exact offered task and content hash to the guarded owner action', async () => {
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) =>
      Promise.resolve(
        method === 'POST'
          ? { data: { actionId: 'a1' } }
          : path.includes('capabilities')
            ? {
                data: {
                  timeZone: 'Asia/Shanghai',
                  transitions: [],
                  taskActions: [
                    {
                      taskId: 't1',
                      contentHash: 'hash1',
                      actions: [{ name: 'claim' }],
                    },
                  ],
                  canActualReturn: false,
                },
              }
            : {
                data: {
                  record: {
                    id: 'r1',
                    applicant: { id: 'owner', name: 'Owner' },
                    number: 'SEAL-1',
                    status: 'stamping',
                    lifecycleVersion: 4,
                  },
                  tasks: [],
                  actions: [],
                },
              },
      ),
  );
  mount('/seal-requests/r1/actions/claim/t1');
  await screen.findByText('SEAL-1');
  fireEvent.click(screen.getByRole('button', { name: 'Claim' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'sealRequests/r1/actions',
        json: expect.objectContaining({
          action: 'claim',
          target: { taskId: 't1' },
          contentHash: 'hash1',
          requestId: expect.any(String),
        }),
      }),
    ),
  );
});

it('retries a failed submit on the saved draft without writing it again', async () => {
  const record = {
    id: 'r1',
    number: null,
    applicant: { id: 'owner', name: 'Owner' },
    status: 'draft',
    lifecycleVersion: 1,
    contractId: null,
    fileIds: ['f1'],
    sealType: 'official',
    copies: 1,
    external: false,
    returnDueAt: null,
    purpose: 'Approved document',
    contact: '',
  };
  let attempts = 0;
  let finish!: (v: unknown) => void;
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) => {
      if (path.endsWith('/files')) return Promise.resolve({ data: [] });
      if (path === 'sealRequests') return Promise.resolve({ data: [] });
      if (path === 'sealBrowser/options')
        return Promise.resolve({
          data: {
            timeZone: 'Asia/Shanghai',
            sealTypes: [{ code: 'official', label: { 'en-US': 'Official' } }],
            contracts: [],
            actorId: 'owner',
          },
        });
      if (path.includes('capabilities'))
        return Promise.resolve({
          data: {
            timeZone: 'Asia/Shanghai',
            transitions: ['edit', 'submit'],
            taskActions: [],
            canActualReturn: false,
          },
        });
      if (path.endsWith('/submit')) {
        attempts++;
        return attempts === 1
          ? Promise.reject(
              new ApiClientError('conflict', {
                status: 409,
                code: 'CONFLICT',
                details: {},
              }),
            )
          : new Promise((resolve) => {
              finish = resolve;
            });
      }
      return Promise.resolve({
        data:
          method === 'PUT'
            ? { ...record, lifecycleVersion: 2 }
            : { record, tasks: [], actions: [] },
      });
    },
  );
  const router = mount('/seal-requests/r1/edit');
  const navigation = vi.fn();
  router.subscribe((state) => {
    if (state.location.pathname === '/seal-requests') navigation();
  });
  await screen.findByDisplayValue('Approved document');
  fireEvent.click(screen.getByRole('button', { name: 'Save and submit' }));
  await screen.findByText(
    'The operation failed. Check the input or refresh and try again.',
  );
  expect(router.state.location.pathname).toBe('/seal-requests/r1/edit');
  fireEvent.click(screen.getByRole('button', { name: 'Save and submit' }));
  await waitFor(() => expect(attempts).toBe(2));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  });
  expect(router.state.location.pathname).toBe('/seal-requests/r1/edit');
  expect(navigation).not.toHaveBeenCalled();
  finish({ data: { ...record, status: 'head', lifecycleVersion: 3 } });
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/seal-requests'),
  );
  expect(navigation).toHaveBeenCalledTimes(1);
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'PUT'),
  ).toHaveLength(1);
  const submits = api.request.mock.calls.filter(([v]) =>
    v.path.endsWith('/submit'),
  );
  expect(submits[0][0].json.requestKey).toBe(submits[1][0].json.requestKey);
});

it('a 409 action response removes editable input and blocks another command until fresh preview', async () => {
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) =>
      method === 'POST'
        ? Promise.reject(
            new ApiClientError('conflict', {
              status: 409,
              code: 'VERSION_CONFLICT',
              details: {},
            }),
          )
        : Promise.resolve(
            path.includes('capabilities')
              ? {
                  data: {
                    timeZone: 'Asia/Shanghai',
                    transitions: [],
                    taskActions: [
                      {
                        taskId: 't1',
                        contentHash: 'hash1',
                        actions: [{ name: 'comment' }],
                      },
                    ],
                    canActualReturn: false,
                  },
                }
              : {
                  data: {
                    record: {
                      id: 'r1',
                      applicant: { id: 'owner', name: 'Owner' },
                      number: 'SEAL-1',
                      status: 'stamping',
                      lifecycleVersion: 4,
                    },
                    tasks: [],
                    actions: [],
                  },
                },
          ),
  );
  mount('/seal-requests/r1/actions/comment/t1');
  await screen.findByText('SEAL-1');
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'confidential draft comment' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
  await screen.findByText(
    'The operation failed. Check the input or refresh and try again.',
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Comment' }));
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'POST'),
  ).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
});

vi.mock('../../../client/components/date-time-picker.js', () => ({
  DateTimePicker: ({
    timeLabel,
    value,
    onChange,
  }: {
    timeLabel: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={timeLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

it.each(['2026-10-11T00:01:00+00:00', 'invalid historical timestamp'])(
  'return handling canonicalizes the original custody instant and refuses invalid history: %s',
  async (borrowedAt) => {
    api.request.mockImplementation(
      ({ path, method }: { path: string; method?: string }) =>
        Promise.resolve(
          method === 'POST'
            ? { data: { actionId: 'return-action' } }
            : path.includes('capabilities')
              ? {
                  data: {
                    timeZone: 'UTC',
                    transitions: [],
                    taskActions: [
                      {
                        taskId: 't1',
                        contentHash: 'h1',
                        actions: [{ name: 'complete' }],
                      },
                    ],
                    canActualReturn: false,
                  },
                }
              : {
                  data: {
                    record: {
                      id: 'r1',
                      applicant: { id: 'owner', name: 'Owner' },
                      number: 'SEAL-1',
                      status: 'returning',
                      lifecycleVersion: 4,
                      sealId: 'seal1',
                      copies: 2,
                      borrowedAt,
                      external: true,
                    },
                    tasks: [],
                    actions: [],
                  },
                },
        ),
    );
    mount('/seal-requests/r1/actions/complete/t1');
    await screen.findByText('SEAL-1');
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Actual sealing time' }),
      { target: { value: '2026-10-11T00:02:00.000Z' } },
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Actual return time' }),
      { target: { value: '2026-10-11T00:03:00.000Z' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete actual handling' }),
    );
    if (borrowedAt.startsWith('invalid')) {
      await screen.findByText(
        'Complete required fields and check actual quantities and times.',
      );
      expect(api.request.mock.calls.some(([v]) => v.method === 'POST')).toBe(
        false,
      );
    } else {
      await waitFor(() =>
        expect(api.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'POST',
            path: 'sealRequests/r1/actions',
            json: expect.objectContaining({
              input: expect.objectContaining({
                borrowedAt: '2026-10-11T00:01:00.000Z',
                sealId: 'seal1',
              }),
            }),
          }),
        ),
      );
    }
  },
);

it('seal metadata retries the same unknown command while protecting input and pending closure', async () => {
  let resolve!: (v: unknown) => void;
  const writes: Record<string, unknown>[] = [];
  api.request.mockImplementation(
    ({
      path,
      method,
      json,
    }: {
      path: string;
      method?: string;
      json?: Record<string, unknown>;
    }) => {
      if (method === 'POST') {
        writes.push(json!);
        if (writes.length === 1)
          return Promise.reject(new Error('Network unavailable'));
        return new Promise((r) => {
          resolve = r;
        });
      }
      if (path === 'seals')
        return Promise.resolve({
          data: [
            {
              id: 'physical',
              code: 'PHYS',
              name: 'Real seal',
              sealType: 'official',
              active: true,
              version: 2,
            },
          ],
        });
      return Promise.resolve({
        data: [{ code: 'official', label: { 'en-US': 'Company seal' } }],
      });
    },
  );
  const router = mount('/seal-instances/edit/physical');
  const reason = await screen.findByLabelText('Reason or comment *');
  fireEvent.change(reason, { target: { value: 'Audited change' } });
  const save = screen.getByRole('button', { name: 'Save seal', exact: true });
  fireEvent.click(save);
  await waitFor(() => expect(writes).toHaveLength(1));
  await waitFor(() => expect(reason).toBeDisabled());
  fireEvent.click(save);
  await waitFor(() => expect(writes).toHaveLength(2));
  expect(writes[1]).toEqual(writes[0]);
  expect(save).toBeDisabled();
  expect(router.state.location.pathname).toBe('/seal-instances/edit/physical');
  await act(async () => resolve({ data: { id: 'physical' } }));
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/seal-instances'),
  );
});
it('stale seal metadata keeps input until the user confirms reload and denial removes it', async () => {
  let version = 1;
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) => {
      if (method === 'POST')
        return Promise.reject(
          new ApiClientError('Stale', {
            status: 409,
            code: 'CONFLICT',
            details: {},
          }),
        );
      if (path === 'seals')
        return Promise.resolve({
          data: [
            {
              id: 'physical',
              code: 'PHYS',
              name: 'Real seal',
              sealType: 'official',
              active: true,
              version,
            },
          ],
        });
      return Promise.resolve({
        data: [{ code: 'official', label: { 'en-US': 'Company seal' } }],
      });
    },
  );
  mount('/seal-instances/edit/physical');
  const reason = await screen.findByLabelText('Reason or comment *');
  fireEvent.change(reason, { target: { value: 'Keep my reason' } });
  fireEvent.click(
    screen.getByRole('button', { name: 'Save seal', exact: true }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save seal', exact: true }),
    ).toBeDisabled(),
  );
  expect(reason).toHaveValue('Keep my reason');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh', exact: true }));
  expect(
    screen.getByRole('heading', { name: 'Reload seal metadata?' }),
  ).toBeInTheDocument();
  expect(reason).toHaveValue('Keep my reason');
  version = 2;
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Refresh', exact: true }).at(-1)!,
  );
  await waitFor(() => expect(reason).toHaveValue(''));
  api.request.mockImplementation(() =>
    Promise.reject(
      new ApiClientError('Denied', {
        status: 403,
        code: 'DENIED',
        details: {},
      }),
    ),
  );
  fireEvent.change(reason, { target: { value: 'Denied write' } });
  fireEvent.click(
    screen.getByRole('button', { name: 'Save seal', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByLabelText('Reason or comment *')).toBeNull(),
  );
  expect(
    screen.getByRole('button', { name: 'Save seal', exact: true }),
  ).toBeDisabled();
});
it('seal metadata temporary load failure retries in place before enabling save', async () => {
  let reads = 0;
  api.request.mockImplementation(({ path }: { path: string }) => {
    if (path === 'seals') {
      reads++;
      return reads === 1
        ? Promise.reject(new Error('Temporary read failure'))
        : Promise.resolve({
            data: [
              {
                id: 'physical',
                code: 'PHYS',
                name: 'Real seal',
                sealType: 'official',
                active: true,
                version: 1,
              },
            ],
          });
    }
    return Promise.resolve({
      data: [{ code: 'official', label: { 'en-US': 'Company seal' } }],
    });
  });
  mount('/seal-instances/edit/physical');
  const retry = await screen.findByRole('button', {
    name: 'Retry',
    exact: true,
  });
  expect(
    screen.getByRole('button', { name: 'Save seal', exact: true }),
  ).toBeDisabled();
  fireEvent.click(retry);
  expect(await screen.findByLabelText('Seal name *')).toHaveValue('Real seal');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save seal', exact: true }),
    ).toBeEnabled(),
  );
  expect(reads).toBe(2);
});
it('disabling an active seal requires a named confirmation before the metadata command', async () => {
  let writes = 0;
  api.request.mockImplementation(
    ({ path, method }: { path: string; method?: string }) => {
      if (method === 'POST') {
        writes++;
        return Promise.resolve({ data: { id: 'physical' } });
      }
      if (path === 'seals')
        return Promise.resolve({
          data: [
            {
              id: 'physical',
              code: 'PHYS',
              name: 'Real seal',
              sealType: 'official',
              active: true,
              version: 1,
            },
          ],
        });
      return Promise.resolve({
        data: [{ code: 'official', label: { 'en-US': 'Company seal' } }],
      });
    },
  );
  mount('/seal-instances/edit/physical');
  fireEvent.change(await screen.findByLabelText('Reason or comment *'), {
    target: { value: 'Retire this unused seal' },
  });
  fireEvent.click(screen.getByRole('switch'));
  fireEvent.click(
    screen.getByRole('button', { name: 'Save seal', exact: true }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Disable seal "Real seal"?' }),
  ).toBeInTheDocument();
  expect(writes).toBe(0);
  fireEvent.click(
    screen.getByRole('button', { name: 'Disable seal', exact: true }),
  );
  await waitFor(() => expect(writes).toBe(1));
});

it('labels guarded attachments with original filenames and downloads with their MIME type', async () => {
  api.request.mockImplementation(async ({ path }: { path: string }) => {
    if (path.endsWith('/files'))
      return {
        data: [
          {
            id: 'file-private',
            filename: '合同.pdf',
            mimeType: 'application/pdf',
            ext: 'pdf',
            size: 3,
          },
        ],
      };
    if (path.endsWith('/capabilities'))
      return {
        data: {
          transitions: [],
          taskActions: [],
          canActualReturn: false,
          timeZone: 'UTC',
        },
      };
    return {
      data: {
        record: {
          id: 'r1',
          number: 'SEAL-1',
          status: 'draft',
          applicant: { id: 'owner', name: 'Owner' },
          fileIds: ['file-private'],
        },
        actions: [],
        tasks: [],
        runs: [],
      },
    };
  });
  api.stream.mockResolvedValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    }),
  );
  const createUrl = vi.fn((_blob: Blob) => 'blob:private');
  const revokeUrl = vi.fn();
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createUrl;
  URL.revokeObjectURL = revokeUrl;
  let downloaded = '';
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function () {
      downloaded = this.download;
    });
  try {
    mount('/seal-requests/r1');
    const download = await screen.findByRole('button', {
      name: 'Download · 合同.pdf',
    });
    expect(screen.queryByText('file-private')).not.toBeInTheDocument();
    fireEvent.click(download);
    await waitFor(() => expect(downloaded).toBe('合同.pdf'));
    expect(createUrl.mock.calls[0]?.[0]).toHaveProperty(
      'type',
      'application/pdf',
    );
    expect(api.stream).toHaveBeenCalledWith({
      path: 'sealRequests/r1/files/file-private/content',
    });
  } finally {
    click.mockRestore();
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});

it('renders the server second page directly and sends validated sorting and pagination parameters', async () => {
  api.request.mockResolvedValue({
    data: [
      {
        id: 'second-page',
        number: 'PAGE-2-1',
        purpose: 'Page two',
        applicant: { id: 'owner', name: 'Owner' },
        sealType: 'official',
        copies: 3,
        status: 'draft',
        createdAt: '2026-10-20T00:00:00Z',
      },
    ],
    meta: { total: 21, page: 2, pageSize: 10 },
  });
  mount('/seal-requests?page=2&pageSize=10&sort=copies&direction=asc');
  expect(
    await screen.findByRole('link', { name: 'PAGE-2-1' }),
  ).toBeInTheDocument();
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'sealRequests',
      query: expect.objectContaining({
        page: '2',
        pageSize: '10',
        sort: 'copies',
        direction: 'asc',
      }),
    }),
  );
});

it('renders permitted related business names and keeps internal identifiers out of facts', async () => {
  api.request.mockImplementation(async ({ path }: { path: string }) => {
    if (path.endsWith('/files')) return { data: [] };
    if (path.endsWith('/capabilities'))
      return {
        data: {
          transitions: [],
          taskActions: [],
          canActualReturn: false,
          timeZone: 'UTC',
        },
      };
    return {
      data: {
        record: {
          id: 'r1',
          number: 'SEAL-42',
          status: 'draft',
          applicant: { id: 'owner', name: 'Owner' },
          contractId: 'contract-private',
          sealId: 'seal-private',
          ledgerId: 'ledger-private',
          fileIds: [],
        },
        relatedNames: {
          contractName: 'CON-42',
          sealName: 'Company seal',
          registrationSourceNumber: 'SEAL-42',
        },
        actions: [],
        tasks: [],
        runs: [],
      },
    };
  });
  mount('/seal-requests/r1');
  expect(await screen.findByText('CON-42')).toBeInTheDocument();
  expect(screen.getByText('Company seal')).toBeInTheDocument();
  expect(
    screen.getByText('Registration for request SEAL-42'),
  ).toBeInTheDocument();
  for (const id of ['contract-private', 'seal-private', 'ledger-private'])
    expect(screen.queryByText(id)).not.toBeInTheDocument();
});

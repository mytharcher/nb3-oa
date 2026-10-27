import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import { ApiClientError } from '@nocobase/app-client';
import {
  CreateInput,
  EditInput,
} from '../../../server/routes/asset-requests/schemas.js';
import { actionField } from '../../../client/pages/asset-requests/errors.js';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';
import locale from '../../../client/locales/modules/asset-requests.en-US.js';
import { Photos } from '../../../client/pages/asset-requests/photos.js';
import Action from '../../../client/pages/asset-requests/action-dialog.js';
import Form from '../../../client/pages/asset-requests/form-page.js';
import List from '../../../client/pages/asset-requests/index.js';
import { RecipientPicker } from '../../../client/pages/asset-requests/pickers.js';
import { editableRecord } from '../../../client/pages/asset-requests/types.js';
const { api, reload, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useNavigationGuard: () => undefined,
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: permission.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: { ...enUS, assetRequests: locale },
  },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
const record = {
  id: 'r1',
  operation: 'use',
  category: 'laptop',
  assetIds: [],
  quantity: 1,
  purpose: 'Work laptop',
  borrowDueDate: null,
  scrapReason: '',
  photos: [],
  lifecycleVersion: 3,
  status: 'draft',
  number: null,
};
const detail = (r: Record<string, unknown> = record) => ({
  record: r,
  timeZone: 'Asia/Shanghai',
  users: [],
  view: {
    available: [
      { name: 'edit', allowed: true },
      { name: 'submit', allowed: true },
    ],
  },
  runs: [],
  taskActions: [],
  runActions: [],
  upcoming: [],
  timeline: { runs: [] },
});
interface Request {
  method?: string;
  path: string;
  json?: Record<string, unknown>;
  query?: Record<string, unknown>;
}
function serve(
  write?: (r: Request) => unknown,
  r: Record<string, unknown> = record,
) {
  api.request.mockImplementation(async (req: Request) => {
    if (req.path === 'assetRequests/eligibleAssets')
      return { data: [], meta: { page: 1, pageSize: 20, total: 0 } };
    if (req.path === 'assetRequests/options')
      return {
        data: {
          employee: { id: 'e1', name: 'Alice', status: 'regular' },
          department: { id: 'd1', name: 'Engineering' },
          head: { id: 'h1', name: 'Head' },
          eligible: true,
          eligibleReason: null,
          administrative: false,
          categories: [{ code: 'laptop', title: 'Laptop' }],
          timeZone: 'Asia/Shanghai',
        },
      };
    if (req.method === 'PATCH' || req.method === 'POST')
      return write?.(req) ?? { data: record };
    if (req.path === 'assetRequests')
      return { data: [record], meta: { page: 1, pageSize: 20, total: 1 } };
    return { data: detail(r) };
  });
}
function open(path = '/mine/newAssetRequest', i18nRuntime = runtime) {
  const router = createMemoryRouter(
    [
      {
        path: '/mine',
        element: <Outlet context={{ reload }} />,
        children: [
          { path: 'newAssetRequest', element: <Form /> },
          { path: 'editAssetRequest/:requestId', element: <Form /> },
          {
            path: 'assetRequest/:requestId',
            element: <Outlet context={{ reload }} />,
            children: [
              { path: 'action/:actionName/:targetId', element: <Action /> },
              { path: 'return', element: <Action /> },
            ],
          },
        ],
      },
      { path: '/assetRequests', element: <List /> },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={i18nRuntime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  permission.can = true;
});
it('refuses whole-record editing when photos or another read dependency is withheld', async () => {
  const { photos: _, ...hidden } = record;
  serve(undefined, hidden);
  open('/mine/editAssetRequest/r1');
  expect(await screen.findByText(locale.missingFields)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Submit for approval' }),
  ).toBeDisabled();
  expect(editableRecord(hidden)).toBe(false);
});
it('saves an incomplete draft without requiring submission-only fields', async () => {
  serve();
  open('/mine/newAssetRequest');
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(
      api.request.mock.calls.some(
        ([r]) => r.method === 'POST' && r.path === 'assetRequests',
      ),
    ).toBe(true),
  );
  const write = api.request.mock.calls.find(
    ([r]) => r.method === 'POST' && r.path === 'assetRequests',
  )![0];
  expect(CreateInput.safeParse(write.json).success).toBe(true);
  expect(write.json.purpose).toBe('');
  expect(write.json.photos).toEqual([]);
  expect(write.json.requestId).toEqual(expect.any(String));
});
it('freezes the original create body after an unknown outcome, including across route remount', async () => {
  serve(() => {
    throw new TypeError('network');
  });
  const router = open();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.type(screen.getByLabelText('Purpose *'), 'Original body');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByText(locale.unknownResult)).toBeVisible();
  expect(screen.getByLabelText('Purpose *')).toBeDisabled();
  const first = api.request.mock.calls.find(([r]) => r.method === 'POST')![0];
  await router.navigate('/mine');
  await router.navigate('/mine/newAssetRequest');
  expect(await screen.findByText(locale.unknownResult)).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Retry original operation' }),
  );
  await waitFor(() =>
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(2),
  );
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST')[1][0].json,
  ).toEqual(first.json);
});
it('a withdrawn edit permission clears the private form and does not offer retry', async () => {
  serve(() => {
    throw { status: 403 };
  });
  open('/mine/editAssetRequest/r1');
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByText(locale.noAccess)).toBeVisible();
  expect(screen.queryByLabelText('Purpose *')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
  expect(sessionStorage.length).toBe(0);
});
it('lists with URL-backed real server filters, sorting, and paging', async () => {
  serve();
  open(
    '/assetRequests?view=done&search=laptop&operation=borrow&page=3&sortBy=quantity&sortOrder=asc',
  );
  await screen.findByText('Asset application draft');
  expect(
    api.request.mock.calls.find(([r]) => r.path === 'assetRequests')![0].query,
  ).toMatchObject({
    view: 'done',
    search: 'laptop',
    operation: 'borrow',
    page: '3',
    sortBy: 'quantity',
    sortOrder: 'asc',
  });
  expect(screen.getByRole('button', { name: 'Clear filters' })).toBeVisible();
});
it('shows translated filter labels before opening the dropdown and after clearing', async () => {
  serve();
  const router = open('/assetRequests');
  await screen.findByText('Asset application draft');
  expect(screen.getByLabelText(locale.operationLabel)).toHaveTextContent(
    locale.all,
  );
  expect(screen.getByLabelText(locale.statusLabel)).toHaveTextContent(
    locale.all,
  );
  expect(screen.queryByText('__all')).not.toBeInTheDocument();

  await router.navigate('/assetRequests?operation=borrow&status=draft');
  await waitFor(() => {
    expect(screen.getByLabelText(locale.operationLabel)).toHaveTextContent(
      locale.operations.borrow,
    );
    expect(screen.getByLabelText(locale.statusLabel)).toHaveTextContent(
      locale.statuses.draft,
    );
  });
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: locale.clearFilters }));
  await waitFor(() => {
    expect(screen.getByLabelText(locale.operationLabel)).toHaveTextContent(
      locale.all,
    );
    expect(screen.getByLabelText(locale.statusLabel)).toHaveTextContent(
      locale.all,
    );
  });
  expect(router.state.location.search).toBe('');
});
it('uses the actual candidate targetId protocol rather than taskId or runId', async () => {
  api.request.mockResolvedValue({
    data: { people: [{ id: 'p1', name: 'Pat' }], nextOffset: null },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <RecipientPicker
        id='recipient'
        recordId='r1'
        targetId='actual-task'
        action='transfer'
        value=''
        onChange={vi.fn()}
        disabled={false}
      />
    </TestI18nProvider>,
  );
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(api.request.mock.calls[0][0].query).toMatchObject({
    targetId: 'actual-task',
    action: 'transfer',
  });
  expect(api.request.mock.calls[0][0].query).not.toHaveProperty('taskId');
});

it('uploads a real scrap photo only after a successful draft create', async () => {
  let created = false;
  api.request.mockImplementation(
    async (
      req: Request & { headers?: Record<string, string>; body?: FormData },
    ) => {
      if (req.path === 'assetRequests/options')
        return {
          data: {
            employee: { id: 'e1', name: 'Alice', status: 'regular' },
            department: { id: 'd1', name: 'Eng' },
            head: { id: 'h1', name: 'Head' },
            eligible: true,
            categories: [],
            timeZone: 'Asia/Shanghai',
          },
        };
      if (req.path === 'assetRequests/eligibleAssets')
        return {
          data: [
            {
              id: 'a1',
              code: 'A1',
              category: 'laptop',
              name: 'Laptop',
              serialNumber: 'SER1',
              status: 'assigned',
              version: 1,
            },
          ],
          meta: { page: 1, pageSize: 20, total: 1 },
        };
      if (req.path === 'assetRequests' && req.method === 'POST') {
        created = true;
        return { data: { ...record, ...req.json, id: 'draft-real' } };
      }
      if (req.path === 'assetRequestPhotos/uploadOne') {
        expect(created).toBe(true);
        expect(req.headers?.['x-asset-request-id']).toBe('draft-real');
        expect(req.body?.get('file')).toBeInstanceOf(File);
        return {
          data: {
            record: {
              id: 'photo-real',
              filename: 'damage',
              ext: 'png',
              contentUrl: '/guarded',
            },
          },
        };
      }
      if (req.path === 'assetRequestPhotos/findMany') return { data: [] };
      return {
        data: detail({ ...record, id: 'draft-real', operation: 'scrap' }),
      };
    },
  );
  open();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByLabelText('Operation *'));
  await user.click(await screen.findByRole('option', { name: 'Disposal' }));
  await user.upload(
    screen.getByLabelText('Evidence photos *'),
    new File(['real-image'], 'damage.png', { type: 'image/png' }),
  );
  await waitFor(() =>
    expect(
      api.request.mock.calls.some(
        ([r]) => r.path === 'assetRequestPhotos/uploadOne',
      ),
    ).toBe(true),
  );
  const create = api.request.mock.calls.find(
    ([r]) => r.path === 'assetRequests' && r.method === 'POST',
  )![0];
  expect(create.json.photos).toEqual([]);
  expect(create.json.operation).toBe('scrap');
});

function execution(status = 'issuing', name = 'complete') {
  const d = detail({
    ...record,
    quantity: 2,
    status,
    allocation: [
      {
        id: 'a1',
        code: 'A1',
        category: 'laptop',
        serialNumber: 'SER1',
        version: 1,
      },
      {
        id: 'a2',
        code: 'A2',
        category: 'laptop',
        serialNumber: 'SER2',
        version: 1,
      },
    ],
  });
  return {
    ...d,
    view: { available: [] },
    taskActions: [
      {
        task: { id: 'real-task', runId: 'real-run' },
        onBehalfOf: null,
        actions: [
          {
            name,
            primary: true,
            tone: 'default',
            contentHash: true,
            options: { reasonRequired: status === 'returning' },
          },
        ],
      },
    ],
    runs: [{ run: { id: 'real-run', contentHash: 'frozen-content' } }],
  };
}
it('physical issue requires every actual serial and freezes the real offer and content hash', async () => {
  const d = execution();
  api.request.mockImplementation(async (req: Request) => {
    if (req.path === 'assetRequests/eligibleAssets')
      return {
        data: d.record.allocation,
        meta: { page: 1, pageSize: 50, total: 2 },
      };
    if (req.method === 'POST')
      return { data: { ...d, record: { ...d.record, status: 'issued' } } };
    return { data: d };
  });
  open('/mine/assetRequest/r1/action/complete/real-task');
  const user = userEvent.setup();
  const first = await screen.findByLabelText('Actual serial number for A1 *');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Confirm physical handling' }),
    ).toBeEnabled(),
  );
  await user.type(first, 'SER1');
  await user.click(
    screen.getByRole('button', { name: 'Confirm physical handling' }),
  );
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST'),
  ).toHaveLength(0);
  await user.type(
    screen.getByLabelText('Actual serial number for A2 *'),
    'SER2',
  );
  await user.click(
    screen.getByRole('button', { name: 'Confirm physical handling' }),
  );
  await waitFor(() =>
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1),
  );
  expect(
    api.request.mock.calls.find(([r]) => r.method === 'POST')![0].json,
  ).toMatchObject({
    target: { taskId: 'real-task' },
    action: 'complete',
    contentHash: 'frozen-content',
    input: {
      units: [
        { assetId: 'a1', serialNumber: 'SER1' },
        { assetId: 'a2', serialNumber: 'SER2' },
      ],
    },
  });
  expect(
    api.request.mock.calls.some(([r]) => r.path === 'assetRequests/options'),
  ).toBe(false);
});
it('inspection sends required actual stage output in input.data rather than guessing a finance branch', async () => {
  const d = execution('appraisal', 'approve');
  api.request.mockImplementation(async (req: Request) =>
    req.method === 'POST' ? { data: d } : { data: d },
  );
  open('/mine/assetRequest/r1/action/approve/real-task');
  const user = userEvent.setup();
  await screen.findByLabelText('Inspection opinion *');
  await user.click(screen.getByRole('button', { name: 'Approve' }));
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST'),
  ).toHaveLength(0);
  await user.type(
    screen.getByLabelText('Inspection opinion *'),
    'Irreparable physical damage',
  );
  await user.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1),
  );
  expect(
    api.request.mock.calls.find(([r]) => r.method === 'POST')![0].json.input,
  ).toEqual({ data: { appraisalOpinion: 'Irreparable physical damage' } });
});
it('a 409 refresh followed by a withdrawn read policy removes the old editable private fields', async () => {
  let revoked = false;
  serve((_req) => {
    revoked = true;
    throw { status: 409 };
  });
  const base = api.request.getMockImplementation()!;
  api.request.mockImplementation(async (req: Request) => {
    if (revoked && req.path === 'assetRequests/r1' && !req.method)
      throw { status: 403 };
    return base(req);
  });
  open('/mine/editAssetRequest/r1');
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await user.click(await screen.findByRole('button', { name: 'Load latest' }));
  expect(await screen.findByText(locale.noAccess)).toBeVisible();
  expect(screen.queryByLabelText('Purpose *')).not.toBeInTheDocument();
});

it('keeps unknown upload metadata across remount and reconciles by selecting guarded existing evidence', async () => {
  let uploaded = false;
  const change = vi.fn();
  api.request.mockImplementation(async (req: Request) => {
    if (req.path === 'assetRequestPhotos/uploadOne') {
      uploaded = true;
      throw new TypeError('network');
    }
    return {
      data: uploaded
        ? [
            {
              id: 'photo-stored',
              filename: 'damage',
              ext: 'png',
              contentUrl: '/guarded',
            },
          ]
        : [],
    };
  });
  const element = (
    <TestI18nProvider runtime={runtime}>
      <Photos requestId='r1' ids={[]} onChange={change} />
    </TestI18nProvider>
  );
  const first = render(element);
  const user = userEvent.setup();
  await user.upload(
    first.container.querySelector('input[type=file]')!,
    new File(['proof'], 'damage.png', { type: 'image/png' }),
  );
  expect(
    await screen.findByText(
      locale.uploadUnknown.replace('{{name}}', 'damage.png'),
    ),
  ).toBeVisible();
  first.unmount();
  const second = render(element);
  expect(
    await screen.findByText(
      locale.uploadUnknown.replace('{{name}}', 'damage.png'),
    ),
  ).toBeVisible();
  expect(second.container.querySelector('input[type=file]')).toBeDisabled();
  await user.click(
    await screen.findByRole('button', { name: 'Select existing evidence' }),
  );
  expect(change).toHaveBeenCalledWith(['photo-stored']);
  expect(sessionStorage.getItem('oa:assetRequests:upload:alice:r1')).toBeNull();
  expect(
    api.request.mock.calls.filter(
      ([r]) => r.path === 'assetRequestPhotos/uploadOne',
    ),
  ).toHaveLength(1);
});
it('submits only after saving current edits and uses the returned lifecycle version', async () => {
  serve((req) =>
    req.path.endsWith('/lifecycle')
      ? { data: detail({ ...record, lifecycleVersion: 13, status: 'head' }) }
      : { data: { ...record, ...req.json, lifecycleVersion: 12 } },
  );
  const router = open(
    '/mine/editAssetRequest/r1?view=done&search=laptop&page=4',
  );
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Submit for approval' }),
    ).toBeEnabled(),
  );
  await user.clear(screen.getByLabelText('Purpose *'));
  await user.type(screen.getByLabelText('Purpose *'), 'Updated purpose');
  await user.click(screen.getByRole('button', { name: 'Submit for approval' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  const writes = api.request.mock.calls
    .filter(([r]) => r.method === 'POST' || r.method === 'PATCH')
    .map(([r]) => r);
  expect(writes.map((r) => r.path)).toEqual([
    'assetRequests/r1',
    'assetRequests/r1/lifecycle',
  ]);
  expect(writes[0].json.purpose).toBe('Updated purpose');
  expect(writes[1].json.lifecycleVersion).toBe(12);
  expect(router.state.location.search).toBe('?view=done&search=laptop&page=4');
});

it('asks before discarding edits and returns to the exact source query', async () => {
  serve();
  const router = open('/mine/editAssetRequest/r1?view=done&search=laptop');
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.type(screen.getByLabelText('Purpose *'), ' modified');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(await screen.findByText(locale.discardDescription)).toBeVisible();
  expect(router.state.location.pathname).toBe('/mine/editAssetRequest/r1');
  await user.click(screen.getByRole('button', { name: 'Discard changes' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(router.state.location.search).toBe('?view=done&search=laptop');
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'PATCH'),
  ).toHaveLength(0);
});

it('projects readonly detail into the actual strict edit HTTP schema', async () => {
  serve(
    (request) => {
      if (request.method === 'PATCH') EditInput.parse(request.json);
      return { data: record };
    },
    {
      ...record,
      applicantId: 'alice',
      employeeId: 'e1',
      createdAt: '2026-10-10',
      ruleSnapshot: {},
      allocation: [],
      version: 7,
    },
  );
  open('/mine/editAssetRequest/r1');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(api.request.mock.calls.some(([r]) => r.method === 'PATCH')).toBe(
      true,
    ),
  );
  const body = api.request.mock.calls.find(([r]) => r.method === 'PATCH')![0]
    .json;
  expect(EditInput.safeParse(body).success).toBe(true);
  expect(body).not.toHaveProperty('id');
  expect(body).not.toHaveProperty('allocation');
});

it('retains submit validation for invalid changes and clears it for valid text', async () => {
  serve();
  open();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Submit for approval' }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Submit for approval' }));
  await user.type(screen.getByLabelText('Purpose *'), ' ');
  await waitFor(() =>
    expect(
      screen.getByLabelText('Purpose *').closest('[data-slot="field"]'),
    ).toHaveAttribute('data-invalid', 'true'),
  );
  await user.type(screen.getByLabelText('Purpose *'), 'Work');
  await waitFor(() =>
    expect(
      screen.getByLabelText('Purpose *').closest('[data-slot="field"]'),
    ).toHaveAttribute('data-invalid', 'false'),
  );
  expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(false);
});

it('maps nested physical, appraisal and recipient validation paths without swallowing record errors', () => {
  expect(actionField('input.units[1].serialNumber')).toBe('serials.1');
  expect(actionField('input.data.appraisalOpinion')).toBe('appraisalOpinion');
  expect(actionField('input.to')).toBe('person');
  expect(actionField('reason')).toBe('comment');
  expect(actionField('lifecycleVersion')).toBeUndefined();
});

it('shows server appraisal validation inline and focuses the actual field', async () => {
  const d = execution('appraisal', 'approve');
  api.request.mockImplementation(async (req: Request) => {
    if (req.method === 'POST')
      throw new ApiClientError('private validation', {
        status: 400,
        method: 'POST',
        url: '/api/assetRequests/r1/actions',
        payload: {
          error: {
            fieldViolations: [{ field: 'input.data.appraisalOpinion' }],
          },
        },
      });
    return { data: d };
  });
  open('/mine/assetRequest/r1/action/approve/real-task');
  const user = userEvent.setup();
  await user.type(
    await screen.findByLabelText('Inspection opinion *'),
    'Inspection',
  );
  await user.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Inspection opinion *')).toHaveFocus(),
  );
  expect(screen.getByText(locale.required)).toBeVisible();
  expect(screen.queryByText('private validation')).not.toBeInTheDocument();
});

it('shows translated busy feedback on the initiating draft save and prevents a second write', async () => {
  let resolve!: (value: unknown) => void;
  serve(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  open();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  const saving = await screen.findByRole('button', { name: /Saving/ });
  expect(saving).toBeDisabled();
  expect(saving.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
  await user.click(saving);
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST'),
  ).toHaveLength(1);
  resolve({ data: record });
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: /Saving/ }),
    ).not.toBeInTheDocument(),
  );
});

it.each(['/mine/newAssetRequest', '/mine/editAssetRequest/r1'])(
  'keeps asset form actions in the drawer footer and associated with the form at %s',
  async (path) => {
    serve();
    open(path);
    const save = await screen.findByRole('button', { name: 'Save draft' });
    await waitFor(() => expect(save).toBeEnabled());
    const submit = screen.getByRole('button', { name: 'Submit for approval' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const footer = save.closest('[data-slot="route-overlay-footer"]');
    expect(footer).not.toBeNull();
    expect(footer).toContainElement(submit);
    expect(footer).toContainElement(cancel);
    const form = document.getElementById('asset-request-form');
    expect((save as HTMLButtonElement).form).toBe(form);
    expect((submit as HTMLButtonElement).form).toBe(form);
    expect(form).not.toContainElement(save);
    expect(form).not.toContainElement(submit);
    expect(footer?.previousElementSibling).toHaveAttribute(
      'data-slot',
      'route-overlay-body',
    );
  },
);

it.each([
  { locale: 'en-US', resources: enUS },
  { locale: 'zh-CN', resources: zhCN },
])(
  'translates selected asset request types in $locale',
  async ({ resources }) => {
    const translatedRuntime = await createTestI18nRuntime({
      application: { namespace: 'nb3-oa', resources },
    });
    serve();
    open('/mine/newAssetRequest', translatedRuntime);
    const trigger = await screen.findByRole('combobox', {
      name: resources.assetRequests.operationLabel,
    });
    expect(trigger).toHaveTextContent(resources.assetRequests.operations.use);
    const user = userEvent.setup();
    for (const operation of ['borrow', 'scrap', 'use'] as const) {
      await user.click(trigger);
      await user.click(
        await screen.findByRole('option', {
          name: resources.assetRequests.operations[operation],
        }),
      );
      expect(trigger).toHaveTextContent(
        resources.assetRequests.operations[operation],
      );
    }
  },
);

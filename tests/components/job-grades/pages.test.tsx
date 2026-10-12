import { ApiClientError, NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';
import History from '../../../client/pages/job-grades/index.js';
import Detail from '../../../client/pages/job-grades/detail.js';
import Publish from '../../../client/pages/job-grades/publish.js';
import {
  cents,
  decimal,
  money,
  pendingStorageKey,
  type PublishInput,
} from '../../../client/pages/job-grades/types.js';
const { api, toaster, permission, actor } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { view: true, viewSalary: true, manage: true, isPending: false },
  actor: { id: 'hr-one' },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: { user: { id: actor.id, name: 'HR' } },
    refresh: vi.fn(),
  }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: ({ action }: { action: keyof typeof permission }) => ({
    can: permission[action],
    isPending: permission.isPending,
    retry: vi.fn(),
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const zhRuntime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: zhCN },
  locale: 'zh-CN',
});
const revision = {
  id: 'r1',
  version: 1,
  createdBy: { id: 'hr-one', name: 'Human Resources' },
  createdAt: '2026-10-10T23:30:00.000Z',
  timeZone: 'Asia/Shanghai',
  reason: 'Initial\npublication',
  bands: [
    {
      gradeId: 'g1',
      gradeCode: 'G1',
      gradeTitle: 'Associate',
      rank: 1,
      minimumCents: 100001,
      maximumCents: 200002,
    },
  ],
};
const grades = [
  { id: 'g1', code: 'G1', title: 'Associate', rank: 1, active: true },
  { id: 'g2', code: 'G2', title: 'Senior', rank: 2, active: true },
];
interface Request {
  path: string;
  method?: string;
  json?: PublishInput;
  query?: Record<string, string>;
}
function reads(request: Request): Promise<unknown> {
  if (request.path === 'grades/options')
    return Promise.resolve({ data: grades });
  if (request.path === 'salaryGradeTables/current')
    return Promise.resolve({ data: { version: 1, revision } });
  if (request.path === 'salaryGradeTables/r1')
    return Promise.resolve({ data: revision });
  if (request.method === 'POST')
    return Promise.resolve({ data: { ...revision, id: 'r2', version: 2 } });
  return Promise.resolve({
    data: [revision],
    meta: { total: 1, page: 1, pageSize: 20, timeZone: 'Asia/Shanghai' },
  });
}
function show(path = '/salaryGradeTables', chinese = false) {
  const router = createMemoryRouter(
    [
      {
        path: '/salaryGradeTables',
        element: (
          <NavigationGuardProvider>
            <History />
          </NavigationGuardProvider>
        ),
        children: [
          { path: 'publish', element: <Publish /> },
          { path: ':revisionId', element: <Detail /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const view = render(
    <TestI18nProvider runtime={chinese ? zhRuntime : runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return { router, ...view };
}
function layer() {
  const element =
    document.querySelector(
      '[data-slot="route-overlay-content"][data-presentation="drawer"]',
    ) ?? document.querySelector('[data-slot="route-child-page"]');
  if (!element) throw new Error('No covering page');
  return within(element as HTMLElement);
}
async function publishFilled() {
  await layer().findByLabelText('Publication reason *');
  await userEvent.type(
    layer().getByLabelText('Publication reason *'),
    'Annual publication',
  );
  await userEvent.click(
    layer().getByRole('button', { name: 'Publish new version' }),
  );
}
function posts(): Request[] {
  return api.request.mock.calls
    .map((call) => call[0] as Request)
    .filter((request) => request.method === 'POST');
}
function failure(status: number, payload?: unknown) {
  return new ApiClientError('Raw server secrets should never render', {
    status,
    method: 'POST',
    url: 'salaryGradeTables',
    payload,
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  Object.assign(permission, {
    view: true,
    viewSalary: true,
    manage: true,
    isPending: false,
  });
  actor.id = 'hr-one';
  api.request.mockImplementation(reads);
});
describe('salary grade pages', () => {
  it('sends global exact-version search, sorting and pagination while metadata readers fetch no private content', async () => {
    permission.viewSalary = false;
    permission.manage = false;
    show(
      '/salaryGradeTables?search=12&page=2&pageSize=10&sort=createdAt&direction=asc',
    );
    await screen.findByText('Human Resources');
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'salaryGradeTables',
        query: {
          search: '12',
          page: '2',
          pageSize: '10',
          sort: 'createdAt',
          direction: 'asc',
        },
      }),
    );
    expect(
      api.request.mock.calls.some((call) =>
        (call[0] as Request).path.includes('/current'),
      ),
    ).toBe(false);
    expect(
      screen.queryByRole('button', { name: 'Publish new version' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Version 1' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Initial\npublication')).not.toBeInTheDocument();
  });
  it('shows exactly one eligible primary action in the true empty state', async () => {
    api.request.mockImplementation((request: Request) =>
      request.path === 'salaryGradeTables'
        ? Promise.resolve({
            data: [],
            meta: {
              total: 0,
              page: 1,
              pageSize: 20,
              timeZone: 'Asia/Shanghai',
            },
          })
        : reads(request),
    );
    show();
    await screen.findByText('No salary table published');
    expect(
      await screen.findAllByRole('button', { name: 'Publish new version' }),
    ).toHaveLength(1);
  });
  it('shows no-matches and clear rather than a false first-publication state', async () => {
    permission.manage = false;
    api.request.mockImplementation((_request: Request) =>
      Promise.resolve({
        data: [],
        meta: { total: 0, page: 1, pageSize: 20, timeZone: 'Asia/Shanghai' },
      }),
    );
    show('/salaryGradeTables?search=hello');
    await screen.findByText('No matching version');
    expect(
      screen.queryByText('No salary table published'),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Clear filters' }).length,
    ).toBeGreaterThan(0);
  });
  it('gates a direct private child before any salary GET and renders Chinese denial', async () => {
    permission.viewSalary = false;
    show('/salaryGradeTables/r1', true);
    await layer().findByText('无薪资区间查看权限，请联系管理员。');
    expect(
      api.request.mock.calls.some(
        (call) => (call[0] as Request).path !== 'salaryGradeTables',
      ),
    ).toBe(false);
    expect(
      screen
        .getByRole('heading', { name: '薪级表', hidden: true })
        .closest('[inert], [aria-hidden="true"]'),
    ).not.toBeNull();
  });
  it('loads immutable detail at the direct URL with company-clock date and exact source query', async () => {
    show('/salaryGradeTables/r1?search=1&page=2');
    await layer().findByText('Associate');
    expect(layer().getByText(/Oct 11, 2026/)).toBeInTheDocument();
    expect(layer().getByText('1,000.01')).toBeInTheDocument();
    expect(
      layer().queryByRole('button', { name: /Delete|Edit/ }),
    ).not.toBeInTheDocument();
  });
  it('returns a missing revision to exact query, refreshes and focuses history', async () => {
    api.request.mockImplementation((request: Request) =>
      request.path === 'salaryGradeTables/r1'
        ? Promise.reject(failure(404))
        : reads(request),
    );
    const { router } = show('/salaryGradeTables/r1?search=1&page=2');
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/salaryGradeTables'),
    );
    expect(router.state.location.search).toBe('?search=1&page=2');
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    );
    await waitFor(() => expect(document.activeElement?.tagName).toBe('H1'));
  });
  it('validates inclusive exact decimal cents, reason and bound correction, then projects only actual API input', async () => {
    const { router } = show('/salaryGradeTables/publish?search=1');
    await layer().findByLabelText('Publication reason *');
    await userEvent.clear(layer().getByLabelText('Minimum *'));
    await userEvent.type(layer().getByLabelText('Minimum *'), '2000.03');
    await userEvent.click(
      layer().getByRole('button', { name: 'Publish new version' }),
    );
    await layer().findByText(
      'Maximum must be greater than or equal to minimum.',
    );
    expect(posts()).toHaveLength(0);
    await userEvent.clear(layer().getByLabelText('Maximum *'));
    await userEvent.type(layer().getByLabelText('Maximum *'), '2000.03');
    await userEvent.type(
      layer().getByLabelText('Publication reason *'),
      'Annual publication',
    );
    expect(
      layer().queryByText('Maximum must be greater than or equal to minimum.'),
    ).not.toBeInTheDocument();
    await userEvent.click(
      layer().getByRole('button', { name: 'Publish new version' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/salaryGradeTables'),
    );
    expect(posts()).toHaveLength(1);
    expect(posts()[0]!.json).toEqual({
      requestKey: expect.any(String),
      expectedVersion: 1,
      reason: 'Annual publication',
      bands: [{ gradeId: 'g1', minimumCents: 200003, maximumCents: 200003 }],
    });
    expect(router.state.location.search).toBe('?search=1');
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
    expect(toaster.show).toHaveBeenCalledWith({
      type: 'success',
      title: 'Published salary table “Version 2”',
    });
  });
  it('retains inactive frozen grades and rejects rather than silently dropping them', async () => {
    api.request.mockImplementation((request: Request) =>
      request.path === 'grades/options'
        ? Promise.resolve({ data: [grades[1]] })
        : reads(request),
    );
    show('/salaryGradeTables/publish');
    await layer().findByText(
      'This grade is unavailable. Remove it or choose an active grade.',
    );
    expect(layer().getByLabelText('Minimum *')).toHaveValue('1000.01');
    await userEvent.type(
      layer().getByLabelText('Publication reason *'),
      'Review',
    );
    await userEvent.click(
      layer().getByRole('button', { name: 'Publish new version' }),
    );
    expect(posts()).toHaveLength(0);
  });
  it('persists unknown outcome and retries original actor/key/body after remount without another publication', async () => {
    let count = 0;
    api.request.mockImplementation((request: Request) =>
      request.method === 'POST' && ++count === 1
        ? Promise.reject(new TypeError('offline'))
        : reads(request),
    );
    show('/salaryGradeTables/publish');
    await publishFilled();
    await layer().findByText(
      'Publication result is unconfirmed. Retry the original publication.',
    );
    const first = posts()[0]!.json;
    expect(layer().getByLabelText('Publication reason *')).toBeDisabled();
    cleanup();
    const { router } = show('/salaryGradeTables/publish');
    await layer().findByRole('button', { name: 'Retry original publication' });
    await userEvent.click(
      layer().getByRole('button', { name: 'Retry original publication' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/salaryGradeTables'),
    );
    expect(posts()[1]!.json).toEqual(first);
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
  });
  it('requires explicit proposal replacement after conflict before loading a new version', async () => {
    let conflict = true;
    api.request.mockImplementation((request: Request) =>
      request.method === 'POST'
        ? Promise.reject(failure(409))
        : request.path === 'salaryGradeTables/current' && !conflict
          ? Promise.resolve({
              data: {
                version: 3,
                revision: {
                  ...revision,
                  version: 3,
                  bands: [{ ...revision.bands[0], minimumCents: 50000 }],
                },
              },
            })
          : reads(request),
    );
    show('/salaryGradeTables/publish');
    await publishFilled();
    await layer().findByText(
      'Current table changed. Load the latest table before publishing.',
    );
    expect(layer().getByLabelText('Minimum *')).toHaveValue('1000.01');
    conflict = false;
    await userEvent.click(
      layer().getByRole('button', { name: 'Load latest table' }),
    );
    await screen.findByRole('alertdialog');
    await userEvent.click(
      screen.getByRole('button', { name: 'Replace and load latest' }),
    );
    await layer().findByText('Source version: 3');
    expect(layer().getByLabelText('Minimum *')).toHaveValue('500.00');
    expect(layer().getByLabelText('Publication reason *')).toHaveValue('');
    expect(posts()).toHaveLength(1);
  });
  it('maps nested 400 violations to inline safe copy and first-field focus, then uses a new key', async () => {
    let count = 0;
    api.request.mockImplementation((request: Request) =>
      request.method === 'POST' && ++count === 1
        ? Promise.reject(
            failure(400, {
              error: { fieldViolations: [{ field: 'bands[0].maximumCents' }] },
            }),
          )
        : reads(request),
    );
    show('/salaryGradeTables/publish');
    await publishFilled();
    await layer().findByText('Check this field and try again.');
    await waitFor(() =>
      expect(layer().getByLabelText('Maximum *')).toHaveFocus(),
    );
    expect(layer().getByLabelText('Publication reason *')).not.toBeDisabled();
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
    await userEvent.clear(layer().getByLabelText('Maximum *'));
    await userEvent.type(layer().getByLabelText('Maximum *'), '2000.03');
    await userEvent.click(
      layer().getByRole('button', { name: 'Publish new version' }),
    );
    await waitFor(() => expect(posts()).toHaveLength(2));
    expect(posts()[1]!.json!.requestKey).not.toBe(posts()[0]!.json!.requestKey);
    expect(
      screen.queryByText('Raw server secrets should never render'),
    ).not.toBeInTheDocument();
  });
  it('clears private form and durable body on publication denial without retry', async () => {
    api.request.mockImplementation((request: Request) =>
      request.method === 'POST' ? Promise.reject(failure(403)) : reads(request),
    );
    show('/salaryGradeTables/publish');
    await publishFilled();
    await layer().findByText(
      'You cannot read salary intervals. Ask an administrator for access.',
    );
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
    expect(
      layer().queryByLabelText('Publication reason *'),
    ).not.toBeInTheDocument();
    expect(
      layer().queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
  });
  it('blocks POST when tab storage cannot safely persist command', async () => {
    const mock = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('blocked');
      });
    try {
      show('/salaryGradeTables/publish');
      await publishFilled();
      await layer().findByText(
        'The original publication cannot be saved safely in this tab. Publication is blocked; check browser storage and reload.',
      );
      expect(posts()).toHaveLength(0);
    } finally {
      mock.mockRestore();
    }
  });
  it('clears a previous actor pending body and starts a fresh form', async () => {
    sessionStorage.setItem(
      pendingStorageKey,
      JSON.stringify({
        actorId: 'someone-else',
        body: {
          requestKey: 'old-key',
          expectedVersion: 7,
          reason: 'Private other user reason',
          bands: [{ gradeId: 'g1', minimumCents: 9, maximumCents: 9 }],
        },
      }),
    );
    show('/salaryGradeTables/publish');
    await layer().findByLabelText('Publication reason *');
    expect(layer().getByLabelText('Publication reason *')).toHaveValue('');
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
  });
  it('locks busy cancel and blocks back, then does not repeat acknowledged write when history refresh fails', async () => {
    let resolvePost: ((value: unknown) => void) | undefined,
      published = false;
    api.request.mockImplementation((request: Request) =>
      request.method === 'POST'
        ? new Promise((resolve) => {
            resolvePost = resolve;
          })
        : published && request.path === 'salaryGradeTables'
          ? Promise.reject(new TypeError('read offline'))
          : reads(request),
    );
    const { router } = show('/salaryGradeTables/publish?search=1');
    await publishFilled();
    expect(layer().getByRole('button', { name: 'Cancel' })).toBeDisabled();
    published = true;
    await act(async () => resolvePost!({ data: { ...revision, version: 2 } }));
    await screen.findByText(
      'Could not load salary grade tables. Please retry.',
    );
    expect(router.state.location.pathname).toBe('/salaryGradeTables');
    expect(posts()).toHaveLength(1);
    expect(sessionStorage.getItem(pendingStorageKey)).toBeNull();
  });
});
describe('salary amount conversion', () => {
  it('preserves inclusive zero and exact safe-integer cents without floating point loss', () => {
    expect(cents('0')).toBe(0);
    expect(cents('0.01')).toBe(1);
    expect(cents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    expect(cents('90071992547409.92')).toBeUndefined();
    expect(cents('1.001')).toBeUndefined();
    expect(cents('1e3')).toBeUndefined();
    expect(cents('-1')).toBeUndefined();
    expect(cents('')).toBeUndefined();
    expect(decimal(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
    expect(money(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
      '90,071,992,547,409.91',
    );
  });
});

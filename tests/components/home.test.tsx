import { ApiClientError, NavigationGuardProvider } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
  createMemoryRouter,
  MemoryRouter,
  Routes,
  Route,
  RouterProvider,
  useOutletContext,
} from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { approvalStateLabel } from '../../client/pages/approvals/business-metadata.js';
import HomePage from '../../client/pages/home/index.js';
import { ClientRoute } from '../../client/routing/client-route.js';
import type {
  AppClientRouteComponentLoader,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import OutingForm from '../../client/pages/outings/form-dialog.js';
import type { LeaveRecord } from '../../client/pages/approvals/types.js';
const { api, permission, auth, client } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: {
    page: true,
    view: true,
    submit: true,
    pending: false,
    nonapproval: false,
  },
  auth: { refresh: vi.fn() },
  client: { can: async () => true },
}));
// Banner behavior is covered by demo-data.test.tsx.
vi.mock('../../client/pages/demo-data/banner.js', () => ({
  DemoBanner: () => null,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useAuthorizationClient: () => client,
  useCan: ({
    resource,
    action,
  }: {
    resource: { type: string; id?: string };
    action: string;
  }) => ({
    can:
      resource.type === 'page'
        ? permission.page
        : action === 'view'
          ? permission.view ||
            (permission.nonapproval &&
              ['oa.workItems', 'oa.announcements'].includes(resource.id ?? ''))
          : permission.submit,
    isPending: permission.pending,
  }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    refresh: auth.refresh,
    session: { user: { id: 'alice' } },
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
function record(
  id: string,
  status: string,
  applicantId = 'alice',
): LeaveRecord & { title: string } {
  return {
    id,
    status,
    applicantId,
    applicant: { id: applicantId, name: applicantId },
    createdById: 'alice',
    number: `LEA-${id}`,
    title: `LEA-${id}`,
    leaveType: 'personal',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    startHalf: 'am',
    endHalf: 'pm',
    days: 2,
    reason: '',
    attachments: [],
    handoverUserId: null,
    enableDelegation: false,
    lifecycleVersion: 1,
    createdAt: `2026-10-10T10:00:00Z`,
  };
}
function serve(mine: LeaveRecord[] = [], pending: LeaveRecord[] = []) {
  api.request.mockImplementation(
    ({
      path,
      query = {},
      json,
    }: {
      path: string;
      json?: { favorites?: string[] };
      query?: { view?: string; status?: string; pageSize?: string };
    }) => {
      if (path.startsWith('requestPreferences'))
        return Promise.resolve({
          data: { favorites: json?.favorites ?? null, recent: [] },
        });
      if (path === 'workbench/roleContext')
        return Promise.resolve({
          data: {
            manager: false,
            hr: false,
            finance: false,
            administration: false,
            procurement: false,
            teamUserIds: [],
          },
        });
      if (path === 'personalSchedules') return Promise.resolve({ data: [] });
      if (path === 'leaveBalances/me') return Promise.resolve({ data: [] });
      if (path === 'leaveRequests/options')
        return Promise.resolve({ data: { leaveTypes: [] } });
      if (path === 'workbench/meetings')
        return Promise.resolve({
          data: {
            date: '2026-10-11',
            timeZone: 'Asia/Shanghai',
            total: 0,
            items: [],
          },
        });
      if (path === 'workbench/announcementReceipts')
        return Promise.resolve({ data: { count: 0, items: [] } });
      const capabilities: Record<string, unknown> = {
        'assetRequests/options': {
          eligible: false,
          department: null,
          head: null,
        },
        'contractRequests/options': { eligible: false },
        'vendorQualifications/options': {
          canCreateQualification: false,
          canCreateRemoval: false,
        },
        'departureRequests/options': {
          canCreateSelfDraft: false,
          canCreateManualDraft: false,
        },
        'probationRequests/options': { canCreateManualDraft: false },
        'transferRequests/capabilities': { canCreateAsHR: false },
        'recruitmentRequests/createOptions': { canCreate: false },
        'vehicleBrowser/options': { canCreate: false },
      };
      if (path in capabilities)
        return Promise.resolve({ data: capabilities[path] });
      if (path !== 'workbench/tasks')
        throw new Error(`Unexpected fixture endpoint: ${path}`);
      const original = query.view === 'mine' ? mine : pending;
      const selected = original.filter(
        (r) => !query.status || query.status.split(',').includes(r.status),
      );
      return Promise.resolve({
        data: selected.slice(0, Number(query.pageSize ?? 20)).map((r) => ({
          ...r,
          kind: (r as LeaveRecord & { kind?: string }).kind ?? 'oa.leave',
          amount: r.days,
          unit: 'days',
        })),
        meta: {
          total: selected.length,
          kinds: ['oa.leave'],
          page: 1,
          pageSize: Number(query.pageSize ?? 20),
          attention: {
            submitted: selected
              .filter((r) => r.status !== 'draft')
              .slice(0, 5)
              .map((r) => ({
                ...r,
                kind: (r as LeaveRecord & { kind?: string }).kind ?? 'oa.leave',
                amount: r.days,
                unit: 'days',
              })),
            drafts: selected
              .filter((r) => r.applicantId === 'alice' && r.status === 'draft')
              .slice(0, 6)
              .map((r) => ({
                ...r,
                kind: 'oa.leave',
                amount: r.days,
                unit: 'days',
              })),
            revisions: selected
              .filter(
                (r) =>
                  r.applicantId === 'alice' &&
                  ['revision', 'exception'].includes(r.status),
              )
              .slice(0, 6)
              .map((r) => ({
                ...r,
                kind: 'oa.leave',
                amount: r.days,
                unit: 'days',
              })),
          },
          counts: {
            drafts: selected.filter(
              (r) => r.applicantId === 'alice' && r.status === 'draft',
            ).length,
            revisions: selected.filter(
              (r) => r.applicantId === 'alice' && r.status === 'revision',
            ).length,
            inProgress: selected.filter(
              (r) =>
                r.applicantId === 'alice' &&
                ['manager', 'head', 'hr'].includes(r.status),
            ).length,
          },
        },
      });
    },
  );
}

function Child() {
  const { reload } = useOutletContext<{ reload: () => void }>();
  return <button onClick={reload}>Saved request</button>;
}
function open(
  path = '/',
  outingLoader: AppClientRouteComponentLoader = async () => ({
    default: OutingForm,
  }),
) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <HomePage />,
        children: [
          { path: 'leave/:requestId', element: <Child /> },
          { path: 'booking/:bookingId', element: <Child /> },
          { path: 'announcement/:announcementId', element: <Child /> },
          { path: 'newLeave', element: <Child /> },
          {
            path: 'newOuting',
            element: (
              <ClientRoute
                route={{
                  id: 'home-outings-new',
                  name: 'home-outings-new',
                  path: '/newOuting',
                  auth: 'required',
                  authz: {
                    resource: { type: 'page', id: 'oa.approvals' },
                    action: 'access',
                  },
                  packageName: 'nb3-oa',
                  source: 'application',
                  componentLoader: outingLoader,
                }}
              />
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}
function card(title: string) {
  return screen
    .getByRole('heading', { name: title })
    .closest('[data-slot="card"]') as HTMLElement;
}
async function catalog() {
  await userEvent.click(
    screen.getByRole('button', { name: enUS.workbench.allRequests }),
  );
  return within(
    await screen.findByRole('dialog', { name: enUS.workbench.allRequests }),
  );
}

beforeEach(() => {
  localStorage.clear();
  api.request.mockReset();
  auth.refresh.mockReset();
  Object.assign(permission, {
    page: true,
    view: true,
    submit: true,
    pending: false,
    nonapproval: false,
  });
  serve();
});
describe('personal workbench', () => {
  it('localizes completed travel records in both supported languages', async () => {
    for (const [locale, resources] of [
      ['en-US', enUS],
      ['zh-CN', zhCN],
    ] as const) {
      const translated = await createTestI18nRuntime({
        locale,
        application: { namespace: 'nb3-oa', resources },
      });
      expect(
        approvalStateLabel(
          'completed',
          translated.getFixedT('nb3-oa', locale),
          'oa.travel',
        ),
      ).toBe(resources.travel.stages.completed);
    }
  });
  it('restores entry placement and groups eligible actions with preserved overlay location', async () => {
    const router = open('/?search=mine#requests');
    await screen.findByText(enUS.workbench.allClear);
    const entries = card(enUS.workbench.newRequest);
    expect(
      screen
        .getByText(enUS.workbench.allClear)
        .closest('[data-slot=card]')!
        .compareDocumentPosition(entries) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const actions = await catalog();
    for (const group of Object.values(enUS.workbench.catalogGroups)) {
      expect(actions.getByRole('region', { name: group })).toBeInTheDocument();
    }
    const finance = actions.getByRole('region', {
      name: enUS.workbench.catalogGroups.expenses,
    });
    await userEvent.click(
      within(finance).getByRole('button', {
        name: enUS.approvalCenter.kinds.loan,
      }),
    );
    expect(router.state.location.pathname).toBe('/newLoan');
    expect(router.state.location.search).toBe('?search=mine');
    expect(router.state.location.hash).toBe('#requests');
  });
  it('uses readable summaries and safe draft fallback while keeping a single title link', async () => {
    serve([
      {
        ...record('summary', 'manager'),
        title: 'Conference travel reimbursement',
      },
    ]);
    open();
    const title = await screen.findByRole('link', {
      name: 'Conference travel reimbursement',
    });
    expect(title).toHaveAttribute('href', '/leave/summary');
    expect(screen.queryByRole('link', { name: 'LEA-summary' })).toBeNull();
    expect(
      within(card(enUS.workbench.mine)).queryByText('LEA-summary'),
    ).toBeNull();
    expect(screen.getByText(/In progress 1/)).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Overdue 0' })).toBeNull();
    expect(
      screen.getByRole('link', { name: enUS.workbench.viewPending }),
    ).toHaveAttribute('href', '/approvals/todo');
  });
  it('keeps the draft shortcut available when the response omits drafts from its preview', async () => {
    serve([{ ...record('no-summary', 'draft'), title: '', number: null }]);
    open();
    await screen.findByText(enUS.workbench.allClear);
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /without a summary/ }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: enUS.workbench.viewMine }),
    ).toHaveAttribute('href', '/approvals/mine');
    expect(screen.getByRole('button', { name: 'Drafts (1)' })).toHaveAttribute(
      'href',
      '/approvals/mine?category=drafts',
    );
  });

  it('keeps saved favorites while the full catalog includes other eligible types', async () => {
    localStorage.setItem(
      'nb3-oa:request-favorites:alice',
      JSON.stringify(['loan', 'transfer']),
    );
    open();
    await screen.findByText(enUS.workbench.allClear);
    expect(
      within(card(enUS.workbench.newRequest)).getByRole('button', {
        name: enUS.approvalCenter.kinds.loan,
      }),
    ).toHaveAttribute('href', '/newLoan');
    const entries = await catalog();
    expect(
      entries.getByRole('button', { name: enUS.approvalCenter.kinds.loan }),
    ).toHaveAttribute('href', '/newLoan');
    expect(
      entries.getByRole('button', { name: enUS.approvalCenter.kinds.leave }),
    ).toHaveAttribute('href', '/newLeave');
    expect(
      entries.queryByRole('button', {
        name: enUS.approvalCenter.kinds.transfer,
      }),
    ).toBeNull();
  });

  it('bounds creation metadata to two groups and releases the second after a first-group failure', async () => {
    const original = api.request.getMockImplementation()!;
    const first = [
      'assetRequests/options',
      'contractRequests/options',
      'vendorQualifications/options',
      'departureRequests/options',
    ];
    const second = [
      'probationRequests/options',
      'transferRequests/capabilities',
      'recruitmentRequests/createOptions',
      'vehicleBrowser/options',
    ];
    const complete = new Map<string, () => void>();
    api.request.mockImplementation(
      (input: { path: string; query?: Record<string, string> }) => {
        if (!first.includes(input.path)) return original(input);
        return new Promise((resolve, reject) =>
          complete.set(input.path, () =>
            input.path === first[0]
              ? reject(new Error('Metadata failed'))
              : resolve(original(input)),
          ),
        );
      },
    );
    open();
    await waitFor(() => expect(complete.size).toBe(4));
    const secondCalls = () =>
      api.request.mock.calls.filter(([input]) => second.includes(input.path));
    expect(secondCalls()).toHaveLength(0);
    await act(async () => {
      for (const path of first.slice(0, 3)) complete.get(path)?.();
    });
    expect(secondCalls()).toHaveLength(0);
    await act(async () => complete.get(first[3])?.());
    await waitFor(() => expect(secondCalls()).toHaveLength(4));
  });
  it.each([false, true])(
    'loads creation metadata after both primary reads settle (failure=%s)',
    async (fail) => {
      const original = api.request.getMockImplementation();
      if (!original) throw new Error('Missing workbench response fixture');
      const complete = new Map<string, () => void>();
      api.request.mockImplementation(
        (input: { path: string; query?: Record<string, string> }) => {
          if (input.path !== 'workbench/tasks') return original(input);
          return new Promise((resolve, reject) => {
            complete.set(input.query?.view ?? '', () => {
              if (fail && input.query?.view === 'mine')
                reject(new Error('Summary failed'));
              else resolve(original(input));
            });
          });
        },
      );
      open();
      await waitFor(() => expect(complete.size).toBe(2));
      const metadataPaths = [
        'assetRequests/options',
        'contractRequests/options',
        'vendorQualifications/options',
        'departureRequests/options',
        'probationRequests/options',
        'transferRequests/capabilities',
        'recruitmentRequests/createOptions',
        'vehicleBrowser/options',
      ];
      const metadataCalls = () =>
        api.request.mock.calls.filter(([input]) =>
          metadataPaths.includes(input.path),
        );
      expect(metadataCalls()).toHaveLength(0);
      await act(async () => complete.get('pending')?.());
      expect(metadataCalls()).toHaveLength(0);
      await act(async () => complete.get('mine')?.());
      await waitFor(() =>
        expect(metadataCalls()).toHaveLength(metadataPaths.length),
      );
    },
  );

  it('shows request loading and module failure in a closeable drawer above the workbench', async () => {
    let reject!: (error: Error) => void;
    const pending = new Promise<AppClientRouteComponentModule>(
      (_resolve, rejectLoad) => {
        reject = rejectLoad;
      },
    );
    const router = open('/?search=mine#requests', () => pending);
    await userEvent.click(
      await screen.findByRole('button', {
        name: enUS.approvalCenter.kinds.outing,
      }),
    );
    const drawer = await screen.findByRole('dialog', {
      name: enUS.approvalCenter.kinds.outing,
    });
    expect(within(drawer).getByRole('status')).toBeVisible();
    await act(async () => {
      reject(new Error('Unavailable module'));
      await pending.catch(() => undefined);
    });
    expect(
      await within(drawer).findByText('Unable to load page'),
    ).toBeVisible();
    await userEvent.click(
      within(drawer).getByRole('button', { name: 'Close' }),
    );
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('?search=mine');
    expect(router.state.location.hash).toBe('#requests');
  });

  it('opens outings with the application declarative navigation guard', async () => {
    const fallback = api.request.getMockImplementation()!;
    api.request.mockImplementation((request) =>
      request.path === 'outingRequests/options'
        ? Promise.resolve({ data: { timeZone: 'Asia/Shanghai' } })
        : fallback(request),
    );
    render(
      <MemoryRouter>
        <NavigationGuardProvider>
          <Routes>
            <Route path='/' element={<HomePage />}>
              <Route path='newOuting' element={<OutingForm />} />
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    await userEvent.click(
      await screen.findByRole('button', {
        name: enUS.approvalCenter.kinds.outing,
      }),
    );
    expect(
      await screen.findByRole('dialog', { name: enUS.outings.new }),
    ).toHaveAttribute('data-presentation', 'drawer');
  });
  it('opens the actual outing form from the workbench creation button', async () => {
    const fallback = api.request.getMockImplementation()!;
    api.request.mockImplementation((request) =>
      request.path === 'outingRequests/options'
        ? Promise.resolve({ data: { timeZone: 'Asia/Shanghai' } })
        : fallback(request),
    );
    const router = open('/?search=mine#requests');
    const button = await screen.findByRole('button', {
      name: enUS.approvalCenter.kinds.outing,
    });
    await userEvent.click(button);
    expect(router.state.location.pathname).toBe('/newOuting');
    const drawer = await screen.findByRole('dialog', {
      name: enUS.outings.new,
    });
    expect(drawer).toHaveAttribute('data-presentation', 'drawer');
    expect(await within(drawer).findByLabelText(/Location/)).toBeVisible();
  });

  it.each([false, true])(
    'requires actual vehicle create capability (%s)',
    async (eligible) => {
      const previous = api.request.getMockImplementation()!;
      api.request.mockImplementation((input) =>
        input.path === 'vehicleBrowser/options'
          ? Promise.resolve({ data: { canCreate: eligible } })
          : previous(input),
      );
      open();
      await screen.findByText(enUS.workbench.allClear);
      await catalog();
      await waitFor(() => {
        const entry = screen.queryByRole('button', {
          name: enUS.vehicles.title,
        });
        if (eligible)
          expect(entry).toHaveAttribute('href', '/newVehicleRequest');
        else expect(entry).toBeNull();
      });
    },
  );

  it.each([false, true])(
    'requires contract employee eligibility before creation (%s)',
    async (eligible) => {
      const fallback = api.request.getMockImplementation()!;
      api.request.mockImplementation((request) =>
        request.path === 'contractRequests/options'
          ? Promise.resolve({ data: { eligible } })
          : fallback(request),
      );
      open();
      await screen.findByText(enUS.workbench.allClear);
      await catalog();
      await waitFor(() => {
        const entry = screen.queryByRole('button', {
          name: enUS.approvalCenter.kinds.contract,
        });
        if (eligible) expect(entry).toBeVisible();
        else expect(entry).not.toBeInTheDocument();
      });
    },
  );

  it.each([false, true])(
    'requires asset employee eligibility before offering creation (%s)',
    async (eligible) => {
      const fallback = api.request.getMockImplementation()!;
      api.request.mockImplementation((request) =>
        request.path === 'assetRequests/options'
          ? Promise.resolve({
              data: {
                eligible,
                department: null,
                head: null,
              },
            })
          : fallback(request),
      );
      open();
      await screen.findByText(enUS.workbench.allClear);
      await catalog();
      await waitFor(() => {
        const creator = screen.queryByRole('button', {
          name: enUS.approvalCenter.kinds.assetRequest,
        });
        if (eligible) expect(creator).toBeVisible();
        else expect(creator).not.toBeInTheDocument();
      });
    },
  );

  it.each([false, true])(
    'requires vendor domain eligibility before offering creation (%s)',
    async (eligible) => {
      const fallback = api.request.getMockImplementation()!;
      api.request.mockImplementation((request) =>
        request.path === 'vendorQualifications/options'
          ? Promise.resolve({
              data: {
                canCreateQualification: eligible,
                canCreateRemoval: false,
              },
            })
          : fallback(request),
      );
      open();
      await screen.findByText(enUS.workbench.allClear);
      await catalog();
      await waitFor(() => {
        const creator = screen.queryByRole('button', {
          name: enUS.approvalCenter.kinds.vendorQualification,
        });
        if (eligible) expect(creator).toBeVisible();
        else expect(creator).not.toBeInTheDocument();
      });
    },
  );

  it.each([false, true])(
    'uses departure domain eligibility before showing its creator (%s)',
    async (eligible) => {
      const fallback = api.request.getMockImplementation()!;
      api.request.mockImplementation((request) =>
        request.path === 'departureRequests/options'
          ? Promise.resolve({
              data: {
                canCreateSelfDraft: eligible,
                canCreateManualDraft: false,
              },
            })
          : fallback(request),
      );
      open();
      await screen.findByText(enUS.workbench.allClear);
      await catalog();
      await waitFor(() => {
        const creator = screen.queryByRole('button', {
          name: enUS.approvalCenter.kinds.departure,
        });
        if (eligible) expect(creator).toBeVisible();
        else expect(creator).not.toBeInTheDocument();
      });
    },
  );
  it('shows empty work with one new-request entry and personal endpoint queries', async () => {
    open();
    expect(await screen.findByText(enUS.workbench.allClear)).toBeVisible();
    expect(screen.queryByText(enUS.workbench.emptyMine)).toBeNull();
    expect(screen.queryByText(enUS.workbench.emptyAttention)).toBeNull();
    expect(
      screen.getAllByRole('button', { name: enUS.approvalCenter.kinds.leave }),
    ).toHaveLength(1);
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'workbench/tasks',
        query: expect.objectContaining({ view: 'pending' }),
      }),
    );
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'workbench/tasks',
        query: expect.objectContaining({ view: 'mine' }),
      }),
    );
    expect(screen.queryByText(enUS.home.title)).not.toBeInTheDocument();
    expect(
      api.request.mock.calls.some(
        ([request]) =>
          request.path === 'approvalCenter' ||
          request.path === 'announcements/pending',
      ),
    ).toBe(false);
  });
  it('offers manual probation creation only after the server confirms HR identity', async () => {
    const defaultReply = api.request.getMockImplementation()!;
    api.request.mockImplementation((input) =>
      input.path === 'probationRequests/options'
        ? Promise.resolve({
            data: {
              actorId: 'alice',
              actor: { id: 'alice', name: 'Alice' },
              timeZone: 'Asia/Shanghai',
              canCreateManualDraft: true,
            },
          })
        : defaultReply(input),
    );
    open();
    await screen.findByText(enUS.workbench.allClear);
    await catalog();
    const create = await screen.findByRole('button', {
      name: enUS.approvalCenter.kinds.probation,
    });
    expect(create.getAttribute('href')).toBe('/newProbation');
  });
  it('keeps request creation separate from work and has only one full request-list entry', async () => {
    open();
    await screen.findByText(enUS.workbench.allClear);
    expect(
      screen.getAllByRole('button', { name: enUS.workbench.viewMine }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: enUS.workbench.viewMine }),
    ).toHaveAttribute('href', '/approvals/mine');
    const creation = await catalog();
    expect(
      creation.getByRole('button', { name: enUS.seals.title }),
    ).toHaveAttribute('href', '/newSeal');
    expect(
      creation.getByRole('button', {
        name: enUS.approvalCenter.kinds.certificate,
      }),
    ).toHaveAttribute('href', '/newCertificate');
    expect(
      creation.queryByRole('button', {
        name: enUS.approvalCenter.kinds.transfer,
      }),
    ).toBeNull();
    expect(
      creation
        .getByRole('button', { name: enUS.approvalCenter.kinds.payment })
        .getAttribute('href'),
    ).toBe('/newPayment');
    expect(
      creation
        .getByRole('button', { name: enUS.approvalCenter.kinds.loan })
        .getAttribute('href'),
    ).toBe('/newLoan');
    expect(
      creation.getByRole('button', {
        name: enUS.approvalCenter.kinds.purchase,
      }),
    ).toHaveAttribute('href', '/newPurchase');
    expect(
      creation.getByRole('button', {
        name: enUS.approvalCenter.kinds.reimbursement,
      }),
    ).toHaveAttribute('href', '/newReimbursement');
    expect(
      creation.getByRole('button', { name: enUS.approvalCenter.kinds.leave }),
    ).toHaveAttribute('href', '/newLeave');
    expect(
      creation.queryByRole('button', { name: enUS.workbench.viewMine }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Approval center' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View messages' }),
    ).not.toBeInTheDocument();
  });
  it('counts own work, excludes delegated drafts, prioritizes and deduplicates attention', async () => {
    serve(
      [
        record('draft', 'draft'),
        record('revision', 'revision'),
        record('waiting', 'hr'),
        record('final', 'approved'),
        record('delegate', 'draft', 'bob'),
      ],
      [
        record('approval', 'manager', 'bob'),
        {
          ...record('revision', 'revision'),
          dueAt: '2030-01-01T10:00:00Z',
        } as LeaveRecord,
      ],
    );
    open();
    await screen.findAllByText('LEA-revision');
    expect(screen.getByText(/2 items to handle/)).toBeVisible();
    expect(screen.getByText(/In progress 1/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Drafts (1)' })).toHaveAttribute(
      'href',
      '/approvals/mine?category=drafts',
    );
    expect(
      screen.getByRole('button', { name: enUS.workbench.reviewRevisions }),
    ).toHaveAttribute('href', '/approvals/mine?category=revisions');
    expect(
      screen.getByText('1 of your requests was returned or needs attention.'),
    ).toBeVisible();
    const list = within(card(enUS.workbench.attention));
    expect(
      list
        .getAllByRole('listitem')
        .map((row) => within(row).getAllByRole('link')[0].textContent),
    ).toEqual(['LEA-revision', 'LEA-approval']);
    expect(
      list
        .getAllByRole('listitem')
        .every((row) => within(row).getAllByRole('link').length === 1),
    ).toBe(true);
    expect(list.getByText('alice')).toBeVisible();
    expect(
      within(card(enUS.workbench.mine)).queryByText('bob'),
    ).not.toBeInTheDocument();
    expect(list.queryByText('LEA-delegate')).not.toBeInTheDocument();
    expect(
      within(card(enUS.workbench.mine)).queryByText('LEA-delegate'),
    ).toBeNull();
    expect(
      within(card(enUS.workbench.mine)).queryByRole('link', {
        name: 'LEA-draft',
      }),
    ).not.toBeInTheDocument();
  });
  it('opens titled non-approval responsibilities from the workbench', async () => {
    const task = {
      ...record('task-one', 'assigned', 'bob'),
      kind: 'oa.workItem',
      title: 'Prepare workstation',
      number: null,
    };
    const receipt = {
      ...record('notice-one', 'pending', 'bob'),
      kind: 'oa.announcementReceipt',
      title: 'Updated workplace policy',
      number: null,
    };
    serve([], [task, receipt]);
    permission.view = false;
    permission.submit = false;
    permission.nonapproval = true;
    open('/?source=nonapproval#work');
    const list = within(card(enUS.workbench.attention));
    expect(await list.findByRole('link', { name: task.title })).toHaveAttribute(
      'href',
      '/workItem/task-one?source=nonapproval#work',
    );
    expect(list.getByRole('link', { name: receipt.title })).toHaveAttribute(
      'href',
      '/announcement/notice-one?source=nonapproval#work',
    );

    expect(list.getAllByText('bob')).toHaveLength(2);
    expect(list.queryByText('alice')).not.toBeInTheDocument();
    expect(list.queryByText(enUS.approvals.draft)).not.toBeInTheDocument();
    expect(
      list.queryByText(enUS.workbench.nextApproval),
    ).not.toBeInTheDocument();
  });
  it('shows approval applicants even when self and dates without inventing submission times', async () => {
    serve(
      [record('mine-date', 'hr')],
      [
        record('self-pending', 'manager'),
        {
          ...record('other-pending', 'manager', 'bob'),
          dueAt: '2026-10-20T10:00:00Z',
        } as LeaveRecord,
      ],
    );
    open();
    await screen.findByRole('link', { name: 'LEA-self-pending' });
    const attention = within(card(enUS.workbench.attention));
    expect(attention.getByText('alice')).toBeVisible();
    expect(attention.getByText('bob')).toBeVisible();
    expect(attention.getAllByText('Applicant:')).toHaveLength(2);
    expect(attention.getByText(/^Due:/)).toBeVisible();
    expect(attention.getByText(/^Created:/)).toBeVisible();
    const mine = within(card(enUS.workbench.mine));
    expect(mine.queryByText('alice')).toBeNull();
    expect(mine.getByText(/^Created:/)).toBeVisible();
  });

  it('keeps eight drafts out of attention and shows submitted work beyond the first page', async () => {
    serve([
      ...Array.from({ length: 8 }, (_, i) => record(String(i), 'draft')),
      record('waiting', 'manager'),
    ]);
    open();
    await screen.findByText(enUS.workbench.emptyAttention);
    expect(
      within(card(enUS.workbench.attention)).queryAllByRole('listitem'),
    ).toHaveLength(0);
    expect(
      within(card(enUS.workbench.mine)).getByRole('link', {
        name: 'LEA-waiting',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Drafts (8)' })).toHaveAttribute(
      'href',
      '/approvals/mine?category=drafts',
    );
    const mine = within(card(enUS.workbench.mine));
    expect(mine.queryByRole('tab')).not.toBeInTheDocument();
    expect(mine.getAllByRole('listitem')).toHaveLength(1);
    expect(
      mine.getByRole('link', { name: enUS.workbench.viewMine }),
    ).toHaveAttribute('href', '/approvals/mine');
    expect(
      mine
        .getByRole('link', { name: enUS.workbench.viewMine })
        .closest('[data-slot="card-header"]'),
    ).not.toBeNull();
    expect(
      mine.queryByRole('button', { name: enUS.workbench.viewMine }),
    ).not.toBeInTheDocument();
  });
  it.each(['page', 'view'] as const)(
    'does not mount business requests without %s permission',
    async (key) => {
      permission[key] = false;
      open();
      expect(screen.getByText(enUS.workbench.noAccess)).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: enUS.workbench.newRequest }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: enUS.approvalCenter.kinds.leave }),
      ).not.toBeInTheDocument();
      expect(
        api.request.mock.calls.some(([r]) => r.path === 'workbench/tasks'),
      ).toBe(false);
    },
  );
  it('waits for grants without requests and hides create when submit is absent', async () => {
    permission.pending = true;
    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
      { wrapper: I18n },
    );
    expect(
      api.request.mock.calls.some(([r]) => r.path === 'workbench/tasks'),
    ).toBe(false);
    unmount();
    permission.pending = false;
    permission.submit = false;
    open();
    await screen.findByText(enUS.workbench.emptyMineRestricted);
    expect(
      screen.queryByRole('heading', { name: enUS.workbench.newRequest }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: enUS.approvalCenter.kinds.leave }),
    ).not.toBeInTheDocument();
  });
  it('opens records over the workbench and refreshes all blocks after a child write', async () => {
    serve([record('one', 'manager')]);
    const router = open();
    const row = within(card(enUS.workbench.mine));
    await waitFor(() =>
      expect(row.getByRole('link', { name: 'LEA-one' })).toBeVisible(),
    );
    await userEvent.click(row.getByRole('link', { name: 'LEA-one' }));
    expect(router.state.location.pathname).toBe('/leave/one');
    const before = api.request.mock.calls.length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Saved request' }),
    );
    await waitFor(() => expect(api.request.mock.calls.length).toBe(before + 8));
    expect(
      screen.getByRole('heading', { name: enUS.workbench.title }),
    ).toBeVisible();
    await act(async () => {
      await router.navigate(-1);
    });
    await waitFor(() =>
      expect(screen.getByText(enUS.workbench.title)).toHaveFocus(),
    );
  });
  it('retains cards and record navigation while refreshing', async () => {
    serve([record('one', 'manager')]);
    open();
    await screen.findAllByText('LEA-one');
    let resolve!: (value: unknown) => void;
    const delayed = new Promise((done) => {
      resolve = done;
    });
    api.request.mockReturnValue(delayed);
    await userEvent.click(
      screen.getAllByRole('button', { name: enUS.approvals.refresh })[0],
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      enUS.workbench.refreshing,
    );
    expect(screen.getByText(/In progress 1/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'LEA-one' })).toBeVisible();
    resolve({
      data: [],
      meta: { total: 0, counts: { drafts: 0, revisions: 0, inProgress: 0 } },
    });
  });
  it.each([400, 422, 403, 404, 500, 401])(
    'handles %s without treating missing data as zero',
    async (status) => {
      api.request.mockImplementation(
        ({ path, query }: { path: string; query?: { view: string } }) =>
          path === 'personalSchedules' || path === 'leaveBalances/me'
            ? Promise.resolve({ data: [] })
            : path === 'leaveRequests/options'
              ? Promise.resolve({ data: { leaveTypes: [] } })
              : path === 'workbench/meetings'
                ? Promise.resolve({
                    data: {
                      date: '2026-10-11',
                      timeZone: 'Asia/Shanghai',
                      total: 0,
                      items: [],
                    },
                  })
                : path === 'workbench/announcementReceipts'
                  ? Promise.resolve({ data: { count: 0, items: [] } })
                  : query?.view === 'pending'
                    ? Promise.reject(
                        new ApiClientError('private failure', {
                          status,
                          method: 'GET',
                          url: '/api/leaveRequests',
                        }),
                      )
                    : Promise.resolve({
                        data: [
                          {
                            ...record('one', 'draft'),
                            kind: 'oa.leave',
                            amount: 1,
                            unit: 'days',
                          },
                        ],
                        meta: {
                          total: 1,
                          kinds: ['oa.leave'],
                          counts: { drafts: 1, revisions: 0, inProgress: 0 },
                        },
                      }),
      );
      open();
      await screen.findAllByRole('alert');
      expect(screen.getByRole('button', { name: 'Drafts (1)' })).toBeVisible();
      expect(screen.queryByText('private failure')).not.toBeInTheDocument();
      expect(
        screen.queryByText(enUS.approvals.domainInvalid),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: enUS.approvals.retry }) !== null,
      ).toBe([400, 422, 500].includes(status));
      if (status === 401) {
        await userEvent.click(
          screen.getByRole('button', { name: enUS.actions.signInAgain }),
        );
        expect(auth.refresh).toHaveBeenCalledOnce();
      }
    },
  );
  it('renders the workbench and next steps in Chinese', async () => {
    serve([record('cn', 'revision')]);
    const chinese = await createTestI18nRuntime({
      locale: 'zh-CN',
      application: { namespace: 'nb3-oa', resources: zhCN },
    });
    const router = createMemoryRouter([{ path: '/', element: <HomePage /> }]);
    render(
      <TestI18nProvider runtime={chinese}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('heading', { name: '工作台' })).toBeVisible();
    await screen.findAllByText('LEA-cn');
    expect(
      screen.getByRole('button', { name: zhCN.workbench.reviewRevisions }),
    ).toHaveAttribute('href', '/approvals/mine?category=revisions');
    expect(
      screen.getByText('你有 1 项申请被退回或出现异常，需要处理。'),
    ).toBeVisible();
    expect(
      screen.queryByText('Review requested revisions'),
    ).not.toBeInTheDocument();
  });
  it('keeps the same workbench key set in Chinese and English', () => {
    expect(Object.keys(zhCN.workbench).sort()).toEqual(
      Object.keys(enUS.workbench).sort(),
    );
    expect(zhCN.navigation.home).toBe('工作台');
    expect(enUS.navigation.home).toBe('Workbench');
  });
});

it('renders personal record children without approval-center page access and supplies reload', async () => {
  permission.page = false;
  serve();
  const router = open('/booking/booking-one?mode=mine');
  const saved = await screen.findByRole('button', { name: 'Saved request' });
  await userEvent.click(saved);
  expect(router.state.location.pathname).toBe('/booking/booking-one');
  await act(async () => {
    await router.navigate('/announcement/notice-one?mode=mine');
  });
  expect(
    await screen.findByRole('button', { name: 'Saved request' }),
  ).toBeVisible();
});

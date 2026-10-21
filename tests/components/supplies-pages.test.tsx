import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import supplies from '../../client/locales/modules/supplies.en-US.js';
import Form from '../../client/pages/supplies/form-dialog.js';
import Detail from '../../client/pages/supplies/detail.js';
import Action from '../../client/pages/supplies/action-dialog.js';
import Ledger from '../../client/pages/supplies/ledger.js';
import Entry from '../../client/pages/supplies/ledger-entry.js';
const { api, toaster, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: permission.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'u1' } } }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...supplies } },
});
const record = {
  id: 's1',
  applicantId: 'alice',
  createdById: 'alice',
  number: null,
  items: [{ code: 'stationery', quantity: 2 }],
  purpose: 'Starter desk',
  status: 'draft',
  lifecycleVersion: 3,
  itemSnapshot: null,
  approvedAt: null,
  approvedFingerprint: null,
  issuedById: null,
  forcedClosed: false,
  ruleSnapshot: null,
  managerApproverId: null,
  createdAt: '2026-10-10T10:00:00Z',
};
const detail = () => ({
  record,
  users: [{ id: 'alice', name: 'Alice' }],
  view: {
    state: 'draft',
    record,
    version: 3,
    available: [{ name: 'edit', allowed: true, blockers: [] }],
    history: { transitions: [], effectRuns: [] },
  },
  runs: [],
  taskActions: [],
  runActions: [],
  upcoming: [],
  timeline: { runs: [] },
});
const options = {
  officeItems: [
    {
      code: 'stationery',
      label: { 'en-US': 'Office supplies' },
      active: true,
      extra: { requiresPrintInfo: false },
    },
    {
      code: 'businessCards',
      label: { 'en-US': 'Business cards' },
      active: true,
      extra: { requiresPrintInfo: true },
    },
  ],
};
type Request = {
  path: string;
  method?: string;
  json?: Record<string, unknown>;
};
function serve(write?: (request: Request) => unknown) {
  api.request.mockImplementation(async (request: Request) =>
    request.method === 'POST'
      ? (write?.(request) ?? { data: { record } })
      : request.path === 'supplyRequests/options'
        ? { data: options }
        : { data: detail() },
  );
}
function open(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/approvals/mine',
        element: <Outlet context={{ reload: vi.fn() }} />,
        children: [
          { path: 'newSupply', element: <Form /> },
          { path: 'editSupply/:requestId', element: <Form /> },
          {
            path: 'supply/:requestId',
            element: <Detail />,
            children: [
              { path: 'action/:actionName/:targetId', element: <Action /> },
            ],
          },
        ],
      },
      {
        path: '/supplyLedger',
        element: <Ledger />,
        children: [{ path: 'entry/:entryId', element: <Entry /> }],
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
  permission.can = true;
});
describe('supplies form and independent ledger', () => {
  it('edits integer item quantities on the originating tab and preserves version and request identity', async () => {
    serve();
    const router = open('/approvals/mine/editSupply/s1?q=Alice'),
      dialog = await screen.findByRole('dialog');
    const quantity = await within(dialog).findByLabelText(/^Quantity/);
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '4');
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/mine'),
    );
    const write = api.request.mock.calls.find(
      ([request]) => request.method === 'POST',
    )?.[0] as Request;
    expect(write.json).toMatchObject({
      transition: 'edit',
      version: 3,
      input: {
        purpose: 'Starter desk',
        items: [{ code: 'stationery', quantity: 4 }],
      },
    });
    expect(write.json?.requestId).toBeTruthy();
    expect(router.state.location.search).toContain('q=Alice');
  });
  it('binds business card print errors to the line and focuses the first missing field', async () => {
    api.request.mockImplementation(async (request: Request) =>
      request.path === 'supplyRequests/options'
        ? { data: options }
        : {
            data: {
              ...detail(),
              record: {
                ...record,
                items: [{ code: 'businessCards', quantity: 100 }],
              },
            },
          },
    );
    open('/approvals/mine/editSupply/s1');
    const dialog = await screen.findByRole('dialog');
    const name = await within(dialog).findByLabelText(/^Name/);
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await waitFor(() => expect(name).toHaveFocus());
    expect(
      within(dialog).getAllByText(enUS.approvals.required).length,
    ).toBeGreaterThan(0);
    expect(
      api.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(0);
  });
  it('locks an uncertain create instead of issuing a duplicate request', async () => {
    serve(() => {
      throw new Error('Lost response');
    });
    open('/approvals/mine/newSupply');
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByLabelText(/^Purpose/);
    await userEvent.type(within(dialog).getByLabelText(/^Purpose/), 'New desk');
    await userEvent.click(
      within(dialog).getByRole('combobox', { name: 'Item' }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'Office supplies' }),
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save draft' }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    );
    await within(dialog).findByText(supplies.supplies.uncertainCreate);
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    ).toBeDisabled();
    expect(within(dialog).getByDisplayValue('New desk')).toBeInTheDocument();
    expect(
      api.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(1);
  });
  it('labels forced closure separately from physical issuance in the request detail', async () => {
    api.request.mockResolvedValue({
      data: {
        ...detail(),
        record: {
          ...record,
          status: 'forcedClosed',
          forcedClosed: true,
          approvedAt: '2026-10-10T10:00:00Z',
        },
        view: { ...detail().view, available: [] },
      },
    });
    open('/approvals/mine/supply/s1');
    expect(
      await screen.findByText('Administratively closed'),
    ).toBeInTheDocument();
    expect(screen.getByText(supplies.supplies.forcedHint)).toBeInTheDocument();
    expect(screen.queryByText('Issued')).toBeNull();
  });
  it('requires a forced closure reason and submits the reviewed run hash after explicit confirmation', async () => {
    const offered = {
      ...detail(),
      record: { ...record, status: 'issuing' },
      view: { ...detail().view, available: [] },
      runActions: [
        {
          run: { id: 'run-1', contentHash: 'approved-content' },
          onBehalfOf: null,
          actions: [
            {
              name: 'forceComplete',
              options: { reasonRequired: true },
              batch: false,
              contentHash: true,
              tone: 'danger',
              primary: false,
            },
          ],
        },
      ],
    };
    api.request.mockImplementation(async (request: Request) =>
      request.method === 'POST' ? { data: {} } : { data: offered },
    );
    const router = open(
      '/approvals/mine/supply/s1/action/forceComplete/run-1?q=Alice',
    );
    const dialog = await screen.findByRole('dialog', { name: /^Force close/ });
    await within(dialog).findByText(
      supplies.supplies.actionHints.forceComplete,
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Force close', exact: true }),
    );
    await waitFor(() =>
      expect(within(dialog).getByLabelText('Reason *')).toHaveFocus(),
    );
    expect(
      api.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(0);
    await userEvent.type(
      within(dialog).getByLabelText('Reason *'),
      'Unable to establish actual delivery',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Force close', exact: true }),
    );
    const confirmation = await screen.findByRole('alertdialog');
    await userEvent.click(
      within(confirmation).getByRole('button', {
        name: 'Force close',
        exact: true,
      }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/mine/supply/s1'),
    );
    const write = api.request.mock.calls.find(
      ([request]) => request.method === 'POST',
    )?.[0] as Request;
    expect(write.json).toMatchObject({
      action: 'forceComplete',
      target: { runId: 'run-1' },
      contentHash: 'approved-content',
      comment: 'Unable to establish actual delivery',
    });
    expect(router.state.location.search).toContain('q=Alice');
  });
  it('uses backend total and sorting and displays forced closure as unconfirmed issuance', async () => {
    const entry = {
      id: 'e1',
      applicationId: 's1',
      number: 'SUPPLY001',
      itemCode: 'stationery',
      itemLabel: { 'en-US': 'Office supplies' },
      requestedQuantity: 3,
      actualQuantity: null,
      recipient: { id: 'alice', name: 'Alice' },
      issuer: { id: 'admin', name: 'Administrator' },
      outcome: 'forcedClosed',
      reason: 'Delivery was not verified',
      createdAt: '2026-10-10T10:00:00Z',
      printInfo: null,
    };
    api.request.mockResolvedValue({
      data: { items: [entry], nextOffset: 10 },
      meta: { total: 21, page: 1, pageSize: 10 },
    });
    open('/supplyLedger?pageSize=10&sortBy=number&direction=asc');
    await screen.findByText('SUPPLY001');
    expect(screen.getByText('Unconfirmed')).toBeInTheDocument();
    expect(screen.getByText('Administratively closed')).toBeInTheDocument();
    expect(api.request.mock.calls[0]?.[0].path).toContain(
      'page=1&pageSize=10&sortBy=number&direction=asc',
    );
  });
});

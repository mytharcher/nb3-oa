import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import { ProcessParameters } from '../../client/pages/process-management/parameters.js';
import { useNodeSettings } from '../../client/pages/process-management/use-node-settings.js';

const { api, toast, grants, saved } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toast: vi.fn(),
  saved: vi.fn(),
  grants: { read: true, update: true, manage: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'administrator' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 1,
  useCan: ({ action }: { action: keyof typeof grants }) => ({
    can: grants[action],
    isPending: false,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const rule = (key: string, type: string, value: number) => ({
  key,
  type,
  domain: 'spend',
  area: 'rules',
  allowFuture: true,
  defaultValue: value,
  min: 0,
  current: null,
  scheduled: [],
});
const rules = [
  rule('expense.head', 'money', 5000),
  rule('spend.vp', 'money', 50000),
  rule('spend.gm', 'money', 200000),
];

function Harness({ kind, states }: { kind: string; states: string[] }) {
  const settings = useNodeSettings(kind, true);
  return (
    <ProcessParameters
      kind={kind}
      states={states}
      settings={settings}
      onSaved={saved}
    />
  );
}
function show(
  kind = 'oa.reimbursement',
  states = ['draft', 'manager', 'finance', 'executive', 'approved'],
) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <Harness kind={kind} states={states} />
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  grants.read = grants.update = grants.manage = true;
  api.request.mockImplementation(({ method }: { method?: string }) =>
    Promise.resolve(method ? { data: [] } : { data: rules }),
  );
});
afterEach(cleanup);

it('lists each parameter once with every step that reads it', async () => {
  show();
  const gm = await screen.findByLabelText('General manager threshold');
  expect(gm).toHaveValue('200000');
  expect(screen.getAllByLabelText('General manager threshold')).toHaveLength(1);
  const field = gm.closest('[data-slot=field]')!;
  expect(field).toHaveTextContent('Finance');
  expect(field).toHaveTextContent('Executive');
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
});

it('saves every changed parameter in one request', async () => {
  show();
  const vp = await screen.findByLabelText('Vice president threshold');
  await userEvent.clear(vp);
  await userEvent.type(vp, '300000');
  const gm = screen.getByLabelText('General manager threshold');
  await userEvent.clear(gm);
  await userEvent.type(gm, '500000');
  await userEvent.type(screen.getByLabelText('Note'), 'Raise both');
  await userEvent.click(screen.getByRole('button', { name: 'Save 2 changes' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(api.request).toHaveBeenCalledWith({
    path: 'approvalRules/versions',
    method: 'POST',
    json: {
      changes: [
        { key: 'spend.vp', value: 300000 },
        { key: 'spend.gm', value: 500000 },
      ],
      effectiveFrom: undefined,
      note: 'Raise both',
    },
  });
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({ title: '2 parameters saved' }),
  );
});

it('marks both sides of a broken ordering and keeps the drafts', async () => {
  api.request.mockImplementation(({ method }: { method?: string }) =>
    method
      ? Promise.reject(
          new ApiClientError('order', {
            status: 400,
            reason: 'RULE_ORDER_VIOLATED',
            payload: {
              error: { metadata: { lower: 'spend.vp', upper: 'spend.gm' } },
            },
            method: 'POST',
            url: '/api/approvalRules/versions',
          }),
        )
      : Promise.resolve({ data: rules }),
  );
  show();
  const vp = await screen.findByLabelText('Vice president threshold');
  await userEvent.clear(vp);
  await userEvent.type(vp, '300000');
  await userEvent.click(screen.getByRole('button', { name: 'Save 1 change' }));
  expect(
    await screen.findAllByText(/Out of order with a related parameter/),
  ).toHaveLength(2);
  expect(vp).toHaveValue('300000');
  expect(saved).not.toHaveBeenCalled();
});

it('shows values read-only without the update permission', async () => {
  grants.update = false;
  show();
  expect(
    await screen.findByLabelText('Vice president threshold'),
  ).toHaveAttribute('readonly');
  expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  expect(
    screen.getByText('You can view these parameters but not change them.'),
  ).toBeInTheDocument();
});

it('points processes configured on their steps to the diagram', () => {
  show('oa.vendorQualification', ['draft', 'committee_v1', 'removalReview']);
  expect(
    screen.getByText(/Use the settings button on a step in the diagram/),
  ).toBeInTheDocument();
  expect(api.request).not.toHaveBeenCalledWith(
    expect.objectContaining({ path: 'approvalRules' }),
  );
});

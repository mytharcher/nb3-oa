import type { RoleContext } from '../../client/pages/home/role-workspace-data.js';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import {
  CommonWorkLinks,
  FunctionalRequestLinks,
  PendingWork,
} from '../../client/pages/home/role-workspaces.js';
import type { CenterRecord } from '../../client/pages/approvals/use-center-resource.js';
const { denied, client, auth, revision } = vi.hoisted(() => {
  const denied = new Set<string>();
  return {
    denied,
    client: {
      can: async ({ resource }: { resource: { id: string } }) =>
        !denied.has(resource.id),
    },
    auth: { user: { id: 'viewer' } },
    revision: { value: 0 },
  };
});
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationClient: () => client,
  useAuthorizationRevision: () => revision.value,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: auth }),
}));
vi.mock('../../client/pages/home/work-row.js', () => ({
  WorkRow: ({ record }: { record: CenterRecord }) => (
    <li>
      <a href={`/${record.id}`}>{record.id}</a>
    </li>
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const role: RoleContext = {
  manager: false,
  hr: false,
  finance: false,
  administration: false,
  procurement: false,
  teamUserIds: [],
};
function context() {
  return {
    data: { ...role },
    error: undefined,
    loading: false,
    settled: true,
    reload: vi.fn(),
    update: vi.fn(),
  };
}
function row(
  id: string,
  kind: CenterRecord['kind'] = 'oa.leave',
  applicantId = 'team-user',
): CenterRecord {
  return {
    id,
    kind,
    applicantId,
    applicant: null,
    number: null,
    title: id,
    status: 'manager',
    createdAt: null,
    startDate: null,
    endDate: null,
    amount: null,
    unit: null,
  };
}
function Location() {
  const location = useLocation();
  return (
    <output>
      {location.search}
      {location.hash}
    </output>
  );
}
function open(pending: CenterRecord[] = [], path = '/') {
  const r = context();
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <PendingWork
          context={r}
          pending={pending}
          loading={false}
          error={undefined}
          total={pending.length}
          now={new Date()}
          retry={vi.fn()}
          allClear={!pending.length}
          canSubmit
        />
        <CommonWorkLinks context={r} />
        <FunctionalRequestLinks
          context={r}
          available={{ budget: true, expensePlan: false, recruitment: true }}
        />
        <Location />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  Object.assign(role, {
    manager: false,
    hr: false,
    finance: false,
    administration: false,
    procurement: false,
    teamUserIds: [],
  });
  denied.clear();
  revision.value = 0;
  auth.user.id = 'viewer';
});
it('keeps ordinary and single-duty users in a single unfiltered list', () => {
  role.hr = true;
  open([row('ordinary')]);
  expect(
    screen.queryByRole('group', { name: enUS.workbench.roleFilter }),
  ).toBeNull();
  expect(screen.getByText('ordinary')).toBeVisible();
  expect(screen.queryByText(enUS.workbench.roleWorkspaces)).toBeNull();
});
it('deduplicates shared tasks and filters the full preview before taking six rows, preserving query/hash', async () => {
  Object.assign(role, { hr: true, finance: true });
  open(
    [
      ...Array.from({ length: 7 }, (_, i) => row(`leave-${i}`)),
      row('loan', 'oa.loan'),
      row('shared', 'oa.departure'),
      row('shared', 'oa.departure'),
    ],
    '/?search=mine#requests',
  );
  expect(
    within(
      screen
        .getByRole('heading', { name: enUS.workbench.attention })
        .closest('[data-slot=card]') as HTMLElement,
    ).getAllByRole('listitem'),
  ).toHaveLength(6);
  await userEvent.click(
    screen.getByRole('button', { name: 'Finance', exact: true }),
  );
  expect(screen.queryByText('leave-0')).toBeNull();
  expect(screen.getByText('loan')).toBeVisible();
  expect(screen.getAllByText('shared')).toHaveLength(1);
  expect(screen.getByRole('status')).toHaveTextContent(
    '?search=mine&workbenchRole=finance#requests',
  );
  expect(
    screen.getByRole('button', { name: 'Finance', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});
it('restores responsibility from the URL and restricts the team preview to own authorized team requests', () => {
  Object.assign(role, { manager: true, hr: true, teamUserIds: ['team-user'] });
  open(
    [row('team-request'), row('outsider', 'oa.leave', 'outsider')],
    '/?workbenchRole=manager',
  );
  expect(screen.getByText('team-request')).toBeVisible();
  expect(screen.queryByText('outsider')).toBeNull();
});
it('offers a truthful preview empty state and can return to all work', async () => {
  Object.assign(role, { hr: true, finance: true });
  open([row('leave')], '/?workbenchRole=finance');
  expect(screen.getByText(enUS.workbench.filteredEmpty)).toBeVisible();
  await userEvent.click(
    screen.getAllByRole('button', { name: 'All', exact: true }).at(-1)!,
  );
  expect(screen.getByText('leave')).toBeVisible();
});
it('gates functional requests by role and capability, deduplicates recruitment and keeps overlay parameters', async () => {
  Object.assign(role, { manager: true, hr: true, finance: true });
  denied.add('oa.employees');
  open([], '/?x=1#requests');
  expect(
    screen.getByRole('link', {
      name: enUS.approvalCenter.kinds.budgetAdjustment,
    }),
  ).toHaveAttribute('href', '/newBudgetAdjustment?x=1#requests');
  expect(
    screen.queryByRole('link', { name: enUS.approvalCenter.kinds.expensePlan }),
  ).toBeNull();
  expect(
    screen.getAllByRole('link', { name: enUS.recruitment.title }),
  ).toHaveLength(1);
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: enUS.workbench.commonLinks }),
    ).toBeVisible(),
  );
  expect(screen.queryByRole('link', { name: enUS.employees.title })).toBeNull();
});
it('limits shortcuts to six visible links, reveals more by keyboard and can collapse while retaining focus', async () => {
  Object.assign(role, {
    manager: true,
    hr: true,
    finance: true,
    administration: true,
    procurement: true,
  });
  open();
  const card = (
    await screen.findByRole('heading', { name: enUS.workbench.commonLinks })
  ).closest('[data-slot=card]')!;
  expect(within(card as HTMLElement).getAllByRole('link')).toHaveLength(6);
  const more = within(card as HTMLElement).getByRole('button', {
    name: 'More links',
  });
  more.focus();
  await userEvent.keyboard('{Enter}');
  expect(more).toHaveAttribute('aria-expanded', 'true');
  expect(within(card as HTMLElement).getAllByRole('link')).toHaveLength(11);
  await userEvent.keyboard('{Enter}');
  expect(more).toHaveFocus();
  expect(more).toHaveAttribute('aria-expanded', 'false');
});
it('does not create an empty shortcuts card when every destination is denied', async () => {
  role.hr = true;
  denied.add('oa.employees');
  denied.add('oa.requisitions');
  open();
  await waitFor(() =>
    expect(
      screen.queryByRole('heading', { name: enUS.workbench.commonLinks }),
    ).toBeNull(),
  );
  expect(
    screen.queryByRole('region', { name: enUS.workbench.functionalRequests }),
  ).toBeVisible();
});
it('treats an invalid or no-longer-assigned URL responsibility as all work', () => {
  Object.assign(role, { hr: true, finance: true });
  open(
    [row('visible-leave'), row('visible-loan', 'oa.loan')],
    '/?workbenchRole=procurement',
  );
  expect(
    screen.getByRole('button', { name: 'All', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('visible-leave')).toBeVisible();
  expect(screen.getByText('visible-loan')).toBeVisible();
});

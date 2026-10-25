import { useEffect } from 'react';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { ApiClientError, NavigationGuardProvider } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US.js';
import moduleEN from '../../../client/locales/modules/announcements.en-US.js';
import Page from '../../../client/pages/announcements/index.js';
import Detail from '../../../client/pages/announcements/detail.js';
import Form from '../../../client/pages/announcements/form.js';
import Action from '../../../client/pages/announcements/action.js';
import Receipts from '../../../client/pages/announcements/receipts.js';
import { Attachments } from '../../../client/pages/announcements/files.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  revision: 0,
  actor: 'publisher',
  can: true,
}));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.actor } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => state.revision,
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can: state.can && resource.id !== 'oa.knowledgeDocuments',
    isPending: false,
  }),
}));
vi.mock('#components/department-picker', () => ({
  DepartmentPicker: () => <input aria-label='Department picker' />,
}));
vi.mock('#components/date-time-picker', () => ({
  DateTimePicker: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...moduleEN } },
});
let row = {
  id: 'a1',
  title: 'Security policy',
  body: 'Read the current policy',
  publisher: { id: 'publisher', name: 'Alice' },
  status: 'draft',
  audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
  requiresConfirmation: true,
  pinned: false,
  attachments: [] as string[],
  knowledgeLink: null,
  hasNewVersion: false,
  validFrom: '2020-01-01T00:00:00Z',
  validUntil: '2035-01-01T00:00:00Z',
  publishedAt: null,
  version: 1,
  capabilities: {
    actions: ['edit', 'publish'] as string[],
    ownReceipt: null as null | { status: string; confirmedAt: string | null },
  },
};
let observed = { pathname: '', search: '', hash: '' };
function Probe() {
  const l = useLocation();
  useEffect(() => {
    observed = l;
  }, [l]);
  return null;
}
function tree(path: string) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <NavigationGuardProvider>
          <Probe />
          <Routes>
            <Route path='/announcements' element={<Page />}>
              <Route path='new' element={<Form />} />
              <Route path=':announcementId' element={<Detail />}>
                <Route path='edit' element={<Form />} />
                <Route path='actions/:action' element={<Action />} />
                <Route path='receipts' element={<Receipts />} />
              </Route>
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function show(path: string) {
  return render(tree(path));
}
function response({ path, method }: { path: string; method?: string }) {
  if (path === 'announcements/context')
    return { data: { timeZone: 'Asia/Singapore', dutyRoles: null } };
  if (path === 'announcements')
    return method === 'POST'
      ? { data: row }
      : { data: [row], meta: { total: 1, page: 1, pageSize: 20 } };
  if (path === 'announcementAttachments/findMany') return { data: [] };
  if (path.endsWith('/receipts'))
    return {
      data: [
        {
          id: 'r1',
          name: 'Bob',
          user: { id: 'reader', name: 'Bob' },
          status: 'pending',
          confirmedAt: null,
        },
      ],
      meta: { total: 1, pending: 1, confirmed: 0, page: 1, pageSize: 20 },
    };
  return { data: row };
}
beforeEach(() => {
  state.revision = 0;
  state.actor = 'publisher';
  state.can = true;
  row = {
    ...row,
    status: 'draft',
    attachments: [],
    version: 1,
    capabilities: { actions: ['edit', 'publish'], ownReceipt: null },
  };
  state.request.mockReset();
  state.request.mockImplementation(async (input) => response(input));
});
afterEach(cleanup);
it('sends URL search/status/pagination and keeps one toolbar initiation', async () => {
  show('/announcements?mode=mine&q=Security&status=draft&page=2#source');
  await screen.findByText('Security policy');
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'announcements',
      query: expect.objectContaining({
        mode: 'mine',
        q: 'Security',
        status: 'draft',
        page: '2',
      }),
    }),
  );
  expect(
    screen.getAllByRole('button', { name: 'New announcement' }),
  ).toHaveLength(1);
  expect(
    screen.getByRole('link', { name: 'Security policy' }).getAttribute('href'),
  ).toBe('/announcements/a1?mode=mine&q=Security&status=draft&page=2#source');
});
it('validates draft, guards dirty cancellation and saves latest version preserving query/hash', async () => {
  const u = userEvent.setup();
  show('/announcements/a1/edit?mode=mine&q=Security#source');
  const input = await screen.findByLabelText(/^Title/);
  await u.clear(input);
  await u.type(input, 'Updated policy');
  await u.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByText('Discard changes to announcement "Updated policy"?');
  await u.click(screen.getByRole('button', { name: 'Cancel' }));
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(observed.pathname).toBe('/announcements/a1'));
  expect(observed.search).toBe('?mode=mine&q=Security');
  expect(observed.hash).toBe('#source');
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'PATCH',
      json: expect.objectContaining({
        title: 'Updated policy',
        expectedVersion: 1,
        requestId: expect.any(String),
      }),
    }),
  );
  const patch = state.request.mock.calls.find(([v]) => v.method === 'PATCH');
  expect(patch?.[0].json).not.toHaveProperty('knowledgeDocumentId');
});
it('requires explicit audience and a nonblank body before creating', async () => {
  const u = userEvent.setup();
  show('/announcements/new');
  await u.type(await screen.findByLabelText(/^Title/), 'New policy');
  await u.type(screen.getByLabelText(/^Body/), '   ');
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByText('This field is required')).toBeTruthy();
  expect(
    screen.getByText('Choose everyone, a department or a duty role'),
  ).toBeTruthy();
  expect(
    state.request.mock.calls.some(
      ([v]) => v.path === 'announcements' && v.method === 'POST',
    ),
  ).toBe(false);
});
it('uses frozen roster filters only after independent server capability', async () => {
  row.capabilities = { actions: ['receipts'], ownReceipt: null };
  show(
    '/announcements/a1/receipts?mode=mine&receiptQ=Bob&receiptStatus=pending&receiptPage=2#source',
  );
  await screen.findByText('Bob');
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'announcements/a1/receipts',
      query: expect.objectContaining({
        q: 'Bob',
        status: 'pending',
        page: '2',
      }),
    }),
  );
  expect(screen.getByText('Pending: 1 · Confirmed: 0')).toBeTruthy();
});
it('does not fetch roster or expose counts without current record capability', async () => {
  show('/announcements/a1/receipts');
  await screen.findByText(
    'This operation is unavailable; close it and refresh the details',
  );
  expect(
    state.request.mock.calls.some(
      ([v]) => v.path === 'announcements/a1/receipts',
    ),
  ).toBe(false);
  expect(screen.queryByText(/Pending: 1/)).toBeNull();
});
it('hides confirmation on scheduled or expired records despite a stale server offer', async () => {
  row = {
    ...row,
    status: 'scheduled',
    capabilities: {
      actions: ['confirm', 'remind'],
      ownReceipt: { status: 'pending', confirmedAt: null },
    },
  };
  show('/announcements/a1');
  await screen.findByText(
    'This announcement is scheduled; confirmation and reminders start after activation.',
  );
  expect(screen.queryByRole('button', { name: 'Confirm receipt' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Remind' })).toBeNull();
});
it('confirms only own effective receipt and sends no actor or version input', async () => {
  row = {
    ...row,
    status: 'published',
    capabilities: {
      actions: ['confirm'],
      ownReceipt: { status: 'pending', confirmedAt: null },
    },
  };
  const u = userEvent.setup();
  show('/announcements/a1/actions/confirm?mode=received#source');
  await u.click(await screen.findByRole('button', { name: 'Confirm receipt' }));
  await waitFor(() => expect(observed.pathname).toBe('/announcements/a1'));
  const call = state.request.mock.calls.find(
    ([v]) => v.path === 'announcements/a1/confirm',
  );
  expect(call?.[0].json).toEqual({ requestId: expect.any(String) });
  expect(observed.hash).toBe('#source');
});
it.each(['pending', 'confirmed'])(
  'distinguishes the %s personal receipt from the publication status',
  async (status) => {
    row.status = 'published';
    row.capabilities = {
      actions: [],
      ownReceipt: {
        status,
        confirmedAt: status === 'confirmed' ? '2026-10-25T00:00:00Z' : null,
      },
    };
    show('/announcements/a1');
    const dialog = await screen.findByRole('dialog', {
      name: 'Security policy',
    });
    const stateLabel =
      status === 'pending' ? 'Pending confirmation' : 'Confirmed';
    await waitFor(() =>
      expect(
        within(dialog).getAllByText(stateLabel, { exact: true }),
      ).toHaveLength(1),
    );
    const badge = within(dialog).getByText(stateLabel, { exact: true });
    expect(badge.closest('[data-slot=route-overlay-header]')).toBeTruthy();
    const publicationLabel = screen.getByText('Announcement status');
    expect(publicationLabel.tagName).toBe('DT');
    expect(publicationLabel.nextElementSibling?.textContent).toBe('Published');
    expect(badge.closest('[data-slot=route-overlay-body]')).toBeNull();
    if (status === 'confirmed') {
      expect(await screen.findByText('Confirmed at')).toBeTruthy();
    }
  },
);
it('does not imply a personal pending task without a required own receipt', async () => {
  show('/announcements/a1');
  const label = await screen.findByText('Announcement status');
  expect(label.nextElementSibling?.textContent).toBe('Draft');
  const dialog = screen.getByRole('dialog', { name: 'Security policy' });
  expect(
    dialog.querySelector('[data-slot=route-overlay-header] [data-slot=badge]'),
  ).toBeNull();
});
it('CAS conflict preserves draft and blocks another write until an explicit replacement reload', async () => {
  const u = userEvent.setup();
  show('/announcements/a1/edit');
  const title = await screen.findByLabelText(/^Title/);
  await u.clear(title);
  await u.type(title, 'Unsaved input');
  state.request.mockImplementation(async (input) => {
    if (input.method === 'PATCH')
      throw new ApiClientError('private diagnostics', {
        status: 409,
        method: 'PATCH',
        url: '/api/announcements/a1',
      });
    return response(input);
  });
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText(
    'The record changed; load the latest content before retrying',
  );
  expect((screen.getByLabelText(/^Title/) as HTMLInputElement).value).toBe(
    'Unsaved input',
  );
  expect(
    (screen.getByRole('button', { name: 'Save draft' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.queryByText('private diagnostics')).toBeNull();
});
it('authorization changes abort pending writes and cannot restore private input', async () => {
  const u = userEvent.setup(),
    view = show('/announcements/a1/edit?mode=mine#source');
  const title = await screen.findByLabelText(/^Title/);
  await u.clear(title);
  await u.type(title, 'Private draft');
  let resolve!: (v: unknown) => void;
  state.request.mockImplementation((input) =>
    input.method === 'PATCH'
      ? new Promise((r) => {
          resolve = r;
        })
      : Promise.resolve(response(input)),
  );
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(state.request.mock.calls.some(([v]) => v.method === 'PATCH')).toBe(
      true,
    ),
  );
  const signal = state.request.mock.calls.find(
    ([v]) => v.method === 'PATCH',
  )?.[0].signal as AbortSignal;
  state.revision++;
  state.can = false;
  view.rerender(tree('/announcements/a1/edit?mode=mine#source'));
  await waitFor(() => expect(screen.queryByLabelText(/^Title/)).toBeNull());
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ data: row }));
  expect(observed.pathname).toBe('/announcements/a1/edit');
  expect(screen.queryByDisplayValue('Private draft')).toBeNull();
});
it('attachment metadata and upload use protected parent header, then reload owner version', async () => {
  const u = userEvent.setup(),
    change = vi.fn(),
    uploaded = vi.fn().mockResolvedValue(undefined);
  state.request.mockImplementation(async (input) =>
    input.path === 'announcementAttachments/uploadOne'
      ? {
          data: {
            record: {
              id: 'f1',
              filename: 'note.txt',
              contentUrl: '/uploads/announcements/f1.txt',
              size: 4,
            },
          },
        }
      : response(input),
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <Attachments
          announcementId='a1'
          selected={[]}
          change={change}
          uploaded={uploaded}
        />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  await waitFor(() =>
    expect(state.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'announcementAttachments/findMany',
        method: 'POST',
        headers: { 'x-announcement-id': 'a1' },
      }),
    ),
  );
  await u.upload(
    screen.getByLabelText('Upload attachment'),
    new File(['note'], 'note.txt', { type: 'text/plain' }),
  );
  await waitFor(() => expect(change).toHaveBeenCalledWith(['f1']));
  expect(uploaded).toHaveBeenCalledOnce();
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'announcementAttachments/uploadOne',
      headers: { 'x-announcement-id': 'a1' },
      body: expect.any(FormData),
    }),
  );
});

it('denied writes clear private draft input and never expose raw diagnostics', async () => {
  const u = userEvent.setup();
  show('/announcements/a1/edit');
  const title = await screen.findByLabelText(/^Title/);
  await u.clear(title);
  await u.type(title, 'Secret input');
  state.request.mockImplementation(async (input) => {
    if (input.method === 'PATCH')
      throw new ApiClientError('private database detail', {
        status: 403,
        method: 'PATCH',
        url: '/api/announcements/a1',
      });
    return response(input);
  });
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText('Access is restricted; return to the source page');
  expect(screen.queryByDisplayValue('Secret input')).toBeNull();
  expect(screen.queryByText('private database detail')).toBeNull();
});
it('expired sessions replace the form with sign-in recovery', async () => {
  const u = userEvent.setup();
  show('/announcements/a1/edit');
  await screen.findByLabelText(/^Title/);
  state.request.mockImplementation(async (input) => {
    if (input.method === 'PATCH')
      throw new ApiClientError('private session detail', {
        status: 401,
        method: 'PATCH',
        url: '/api/announcements/a1',
      });
    return response(input);
  });
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(screen.queryByLabelText(/^Title/)).toBeNull());
  expect(screen.queryByText('private session detail')).toBeNull();
});
it('same-payload network retry preserves requestId and a changed payload gets a new key', async () => {
  const u = userEvent.setup();
  show('/announcements/a1/edit');
  await screen.findByLabelText(/^Title/);
  state.request.mockImplementation(async (input) => {
    if (input.method === 'PATCH') throw new Error('offline');
    return response(input);
  });
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText('The request failed; try again later');
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(
      state.request.mock.calls.filter(([v]) => v.method === 'PATCH'),
    ).toHaveLength(2),
  );
  const calls = state.request.mock.calls.filter(([v]) => v.method === 'PATCH');
  expect(calls[0][0].json.requestId).toBe(calls[1][0].json.requestId);
  await u.type(screen.getByLabelText(/^Body/), ' changed');
  await u.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(
      state.request.mock.calls.filter(([v]) => v.method === 'PATCH'),
    ).toHaveLength(3),
  );
  expect(
    state.request.mock.calls.filter(([v]) => v.method === 'PATCH')[2][0].json
      .requestId,
  ).not.toBe(calls[0][0].json.requestId);
});
it('pending tab reads only own pending contract and retains the source link', async () => {
  state.request.mockImplementation(async (input) =>
    input.path === 'announcements/pending'
      ? {
          data: {
            items: [
              {
                id: 'r1',
                announcementId: 'a1',
                title: 'Security policy',
                dueAt: '2035-01-01T00:00:00Z',
              },
            ],
            count: 1,
          },
        }
      : response(input),
  );
  show('/announcements?mode=pending#source');
  await screen.findByText('1 announcements awaiting your confirmation');
  expect(
    screen.getByRole('link', { name: 'Security policy' }).getAttribute('href'),
  ).toBe('/announcements/a1?mode=pending#source');
  expect(
    state.request.mock.calls.some(([v]) => v.path === 'announcements'),
  ).toBe(false);
});

it('publishes from one routed confirmation and keeps the source detail URL', async () => {
  show('/announcements/a1/actions/publish?mode=mine#source');
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  const user = userEvent.setup();
  const button = await screen.findByRole('button', {
    name: 'Publish',
    exact: true,
  });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
  await waitFor(() => expect(observed.pathname).toBe('/announcements/a1'));
  expect(
    state.request.mock.calls.filter(
      ([request]) =>
        request.method === 'POST' &&
        request.path === 'announcements/a1/publish',
    ),
  ).toHaveLength(1);
  expect(observed.search).toBe('?mode=mine');
  expect(observed.hash).toBe('#source');
});

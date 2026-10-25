import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import GlobalSearchPage from '../../client/pages/global-search/index.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  user: 'employee',
  denied: new Set<string>(),
}));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.user } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can: !state.denied.has(resource.id),
    isPending: false,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
afterEach(cleanup);
beforeEach(() => {
  state.user = 'employee';
  state.denied.clear();
  state.request.mockReset();
  state.request.mockImplementation(async ({ path, query }) => ({
    data:
      path === 'requestSearch'
        ? [
            {
              id: 'one',
              kind: 'oa.leave',
              number: 'LEAVE-001',
              title: 'Leave request',
              applicant: { name: 'Jane' },
            },
          ]
        : path === 'directory'
          ? [
              {
                id: 'person',
                name: 'Jane',
                code: 'E001',
                primaryDepartment: { name: 'Finance' },
              },
            ]
          : [
              {
                id: `${path}-id`,
                title:
                  path === 'announcements'
                    ? 'Staff announcement'
                    : 'Knowledge handbook',
              },
            ],
    meta: {
      total: path === 'knowledge/documents' ? 21 : 1,
      page: Number(query.page),
      pageSize: 10,
    },
  }));
});
function mount(entry = '/search?q=Jane') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: '/search', element: <GlobalSearchPage /> }],
    { initialEntries: [entry] },
  );
  const renderPage = () => (
    <QueryClientProvider client={client}>
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>
    </QueryClientProvider>
  );
  const view = render(renderPage());
  return { router, rerender: () => view.rerender(renderPage()) };
}
it('searches all authorized search sources with the keyword and real detail links', async () => {
  mount();
  expect(
    await screen.findByRole('link', { name: 'LEAVE-001 · Leave request' }),
  ).toHaveAttribute('href', '/approvals/mine/leave/one');
  expect(
    await screen.findByRole('link', { name: 'Jane · E001' }),
  ).toHaveAttribute('href', '/directory?q=E001');
  expect(
    screen.getByRole('link', { name: 'Staff announcement' }),
  ).toHaveAttribute('href', '/announcements/announcements-id');
  expect(
    screen.getByRole('link', { name: 'Knowledge handbook' }),
  ).toHaveAttribute('href', '/knowledge/knowledge%2Fdocuments-id');
  expect(state.request).toHaveBeenCalledTimes(4);
  expect(
    state.request.mock.calls.every(
      ([request]) => (request.query.q ?? request.query.search) === 'Jane',
    ),
  ).toBe(true);
});
it('does not query before submitting or query sources without grants', async () => {
  state.denied.add('oa.employees.directory');
  mount('/search');
  expect(state.request).not.toHaveBeenCalled();
  await userEvent.type(screen.getByRole('textbox'), 'Jane');
  expect(state.request).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Search', exact: true }),
  );
  await screen.findByRole('link', { name: 'Staff announcement' });
  expect(
    state.request.mock.calls.some(([request]) => request.path === 'directory'),
  ).toBe(false);
});
it('paginates a source on the server while retaining the keyword and other sections', async () => {
  const { router } = mount();
  await screen.findByRole('link', { name: 'Knowledge handbook' });
  await userEvent.click(
    screen.getByRole('button', { name: 'Next', exact: true }),
  );
  await waitFor(() =>
    expect(state.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'knowledge/documents',
        query: { q: 'Jane', page: '2', pageSize: '10' },
      }),
    ),
  );
  expect(router.state.location.search).toContain('q=Jane');
  expect(router.state.location.search).toContain('knowledgePage=2');
  expect(screen.getByRole('link', { name: 'Jane · E001' })).toBeVisible();
});
it('clears a previous identity result immediately while a new identity is loading', async () => {
  const page = mount();
  await screen.findByRole('link', { name: 'Jane · E001' });
  state.user = 'other';
  state.request.mockImplementation(() => new Promise(() => {}));
  await act(() => page.router.navigate('/search?q=Jane&refresh=1'));
  expect(screen.queryByRole('link', { name: 'Jane · E001' })).toBeNull();
});

it('loads more authorized requests by cursor and does not invent a total', async () => {
  const original = state.request.getMockImplementation()!;
  state.request.mockImplementation(async (request) =>
    request.path !== 'requestSearch'
      ? original(request)
      : {
          data: [
            {
              id: request.query.cursor ? 'second' : 'first',
              kind: 'oa.leave',
              title: request.query.cursor ? 'Later request' : 'First request',
              number: null,
              applicant: null,
            },
          ],
          meta: {
            nextCursor: request.query.cursor ? null : 'server-cursor',
            hasMore: !request.query.cursor,
          },
        },
  );
  mount();
  await screen.findByRole('link', { name: 'First request' });
  await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
  expect(
    await screen.findByRole('link', { name: 'Later request' }),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: 'First request' })).toBeVisible();
  expect(screen.getByText('Results shown: 2')).toBeVisible();
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'requestSearch',
      query: { q: 'Jane', pageSize: '10', cursor: 'server-cursor' },
    }),
  );
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});

function requestPages(
  pages: {
    rows: string[];
    skipped?: ('applicant' | 'relatedNumber')[];
  }[],
) {
  const original = state.request.getMockImplementation()!;
  state.request.mockImplementation(async (request) => {
    if (request.path !== 'requestSearch') return original(request);
    const index = request.query.cursor ? Number(request.query.cursor) : 0;
    const next = index + 1 < pages.length ? String(index + 1) : null;
    return {
      data: pages[index].rows.map((title) => ({
        id: title,
        kind: 'oa.leave',
        title,
        number: null,
        applicant: null,
      })),
      meta: {
        nextCursor: next,
        hasMore: next !== null,
        skippedMatches: pages[index].skipped ?? [],
      },
    };
  });
}
const requestCalls = () =>
  state.request.mock.calls.filter(
    ([request]) => request.path === 'requestSearch',
  ).length;

it('keeps scanning past empty windows instead of reporting no results', async () => {
  requestPages([{ rows: [] }, { rows: [] }, { rows: ['Found later'] }]);
  mount();
  expect(
    await screen.findByRole('link', { name: 'Found later' }),
  ).toBeVisible();
  expect(screen.queryByText('No matching results')).toBeNull();
  expect(requestCalls()).toBe(3);
});

it('stops auto scanning after a few empty windows and lets the viewer continue', async () => {
  requestPages([
    ...Array.from({ length: 6 }, () => ({ rows: [] })),
    { rows: ['Deep match'] },
  ]);
  mount();
  expect(
    await screen.findByText(
      'Part of the requests have been checked with no match yet. You can keep searching.',
    ),
  ).toBeVisible();
  expect(screen.queryByText('No matching results')).toBeNull();
  expect(requestCalls()).toBe(6);
  await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
  expect(await screen.findByRole('link', { name: 'Deep match' })).toBeVisible();
});

it('shows no results only when the search is exhausted, and explains skipped applicant matching', async () => {
  requestPages([
    { rows: [], skipped: ['applicant'] },
    { rows: [], skipped: ['applicant', 'relatedNumber'] },
  ]);
  mount();
  expect(await screen.findByText('No matching results')).toBeVisible();
  expect(
    screen.getByText(
      'Too many people match, so applicants were not searched. Enter a fuller name to search by applicant.',
    ),
  ).toBeVisible();
  expect(
    screen.getByText(
      'Too many related numbers match, so related numbers were not searched. Enter a fuller number to search by related number.',
    ),
  ).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});

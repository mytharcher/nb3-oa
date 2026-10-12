import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import copy from '../../../client/locales/modules/departure.en-US.js';
import { Missing } from '../../../client/pages/departure-requests/missing.js';
const { toast } = vi.hoisted(() => ({ toast: { show: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => toast,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { departureRequests: copy } },
});
afterEach(cleanup);
it.each([
  '/approvals/pending/departure/r1/action/reject/t1',
  '/approvals/pending/editDeparture/r1',
])(
  'missing secondary record %s returns to the source query with durable feedback and focus',
  async (path) => {
    const refresh = vi.fn();
    const router = createMemoryRouter(
      [
        {
          path: '/approvals/pending',
          element: (
            <input aria-label='Source search' data-departure-list-focus />
          ),
        },
        { path, element: <Missing onMissing={refresh} name='Employee A' /> },
      ],
      { initialEntries: [path + '?status=hr&search=Employee'] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    await screen.findByLabelText('Source search');
    await waitFor(() =>
      expect(screen.getByLabelText('Source search')).toHaveFocus(),
    );
    expect(router.state.location.search).toBe('?status=hr&search=Employee');
    expect(refresh).toHaveBeenCalledOnce();
    expect(toast.show).toHaveBeenCalledWith({
      type: 'error',
      title:
        '"Employee A" is no longer available. Returned to the source list.',
    });
  },
);

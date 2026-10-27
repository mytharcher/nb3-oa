import { resolveLocalesContribution } from '@nocobase/i18n';
import filePlugin from '@nocobase/app-plugin-file/client';
import { NavigationGuardProvider } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import enUS from '../../client/locales/en-US.js';
import LeaveForm from '../../client/pages/approvals/form-page.js';
const { api, toaster, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { can: true, only: null as string | null },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: (request: { resource: { id: string } }) => ({
    can:
      permission.can &&
      (!permission.only || request.resource.id === permission.only),
    isPending: false,
  }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    refresh: vi.fn(),
    session: { user: { id: 'alice' } },
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: {
    '@nocobase/app-plugin-file': await resolveLocalesContribution(
      filePlugin().locales!,
    ),
  },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
const record = {
  id: 'l1',
  applicantId: 'alice',
  applicant: { id: 'alice', name: 'Alice' },
  createdById: 'alice',
  number: 'LEA-1',
  leaveType: 'personal',
  startDate: '2026-10-12',
  endDate: '2026-10-12',
  startHalf: 'am',
  endHalf: 'pm',
  days: 1,
  reason: 'Family appointment',
  attachments: [],
  handoverUserId: null,
  enableDelegation: false,
  status: 'draft',
  lifecycleVersion: 3,
  createdAt: '2026-10-10T10:00:00Z',
};
const options = {
  leaveTypes: [
    {
      code: 'personal',
      label: { 'en-US': 'Personal leave' },
      active: true,
      extra: {},
    },
  ],
  balanceAvailable: false,
  timeZone: 'Asia/Shanghai',
};
type Request = {
  path: string;
  method?: string;
  json?: Record<string, unknown>;
  query?: Record<string, string>;
};
function serve(handler: (request: Request) => unknown) {
  api.request.mockImplementation(async (r: Request) =>
    r.path === 'leaveRequests/options'
      ? { data: options }
      : r.path === 'users'
        ? { data: [], meta: { total: 0 } }
        : handler(r),
  );
}
function open(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/approvals/mine',
        element: (
          <NavigationGuardProvider>
            <Outlet context={{ reload: () => {} }} />
          </NavigationGuardProvider>
        ),
        children: [{ path: 'newLeave', element: <LeaveForm /> }],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
}
beforeEach(() => {
  api.request.mockReset();
});
afterEach(() => vi.unstubAllGlobals());
describe('leave attachment upload', () => {
  it('uploads from an empty form without validating unrelated fields and reuses its draft', async () => {
    const file = {
      id: 'file1',
      filename: 'proof.pdf',
      ext: 'pdf',
      contentUrl: '/uploads/leave/file1.pdf',
    };
    serve((r) => {
      if (r.path === 'leaveRequests' && r.method === 'POST')
        return {
          data: {
            record: { ...record, startDate: null, endDate: null, reason: '' },
          },
        };
      if (r.path === 'leaveAttachments/uploadOne')
        return { data: { record: file } };
      if (r.path === 'leaveAttachments/findMany') return { data: [file] };
      return { data: [] };
    });
    open('/approvals/mine/newLeave');
    await screen.findByRole('button', { name: 'Save draft' });
    const input = document.getElementById('leave-file') as HTMLInputElement;
    await userEvent.upload(
      input,
      new File(['%PDF-1.7'], 'proof.pdf', { type: 'application/pdf' }),
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'leaveAttachments/uploadOne',
          headers: { 'x-leave-request-id': 'l1' },
          body: expect.any(FormData),
        }),
      ),
    );
    expect(screen.queryByText('Enter a value.')).toBeNull();
    expect(screen.queryByText(enUS.approvals.attachmentFailed)).toBeNull();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'leaveRequests',
        json: expect.objectContaining({
          startDate: null,
          endDate: null,
          reason: '',
          attachments: [],
        }),
      }),
    );
    await waitFor(() => expect(input).not.toBeDisabled());
    await userEvent.upload(
      input,
      new File(['%PDF-1.7'], 'second.pdf', { type: 'application/pdf' }),
    );
    await waitFor(() =>
      expect(
        api.request.mock.calls.filter(
          ([r]) => r.path === 'leaveAttachments/uploadOne',
        ),
      ).toHaveLength(2),
    );
    expect(
      api.request.mock.calls.filter(
        ([r]) => r.path === 'leaveRequests' && r.method === 'POST',
      ),
    ).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findAllByText('Enter a value.')).not.toHaveLength(0);
  });
});

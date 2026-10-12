import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/probation.en-US.js';
import {
  PrivateCompensationSection,
  salaryLabel,
} from '../../../client/pages/probation-requests/private-compensation.js';
const { api, permission, identity } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: { can: false, isPending: false, error: undefined as unknown },
  identity: { id: 'hr-one' },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: identity.id } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => permission,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
});
function Page({ id = 'r1', refresh = 0 }: { id?: string; refresh?: number }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <PrivateCompensationSection
        recordId={id}
        refreshKey={refresh}
        grades={[
          { id: 'g1', title: 'Senior', code: 'S', rank: 3, active: true },
        ]}
      />
    </TestI18nProvider>
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  permission.can = false;
  permission.isPending = false;
  permission.error = undefined;
  identity.id = 'hr-one';
});
it('neither requests nor renders compensation without its independent grant', () => {
  render(<Page />);
  expect(api.request).not.toHaveBeenCalled();
  expect(screen.queryByText('Private compensation proposal')).toBeNull();
});
it('clears salary synchronously on viewer, record or permission change and ignores a late previous-viewer response', async () => {
  permission.can = true;
  let resolveOld: ((value: unknown) => void) | undefined;
  api.request
    .mockResolvedValueOnce({
      data: { gradeId: 'g1', baseSalary: '12345678901234.99' },
    })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValue({ data: null });
  const page = render(<Page />);
  await screen.findByText('12,345,678,901,234.99');
  identity.id = 'hr-two';
  page.rerender(<Page />);
  expect(screen.queryByText('12,345,678,901,234.99')).toBeNull();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  permission.can = false;
  page.rerender(<Page />);
  expect(screen.queryByText('Private compensation proposal')).toBeNull();
  resolveOld?.({ data: { gradeId: 'g1', baseSalary: '98765.43' } });
  await Promise.resolve();
  expect(screen.queryByText('98,765.43')).toBeNull();
  permission.can = true;
  page.rerender(<Page id='r2' />);
  expect(screen.queryByText('98,765.43')).toBeNull();
  await screen.findByText('No compensation proposal has been saved.');
  expect(api.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      path: 'probationRequests/r2/compensation',
    }),
  );
});
it('shows a denied private block without a retry and refetches unchanged records on detail refresh', async () => {
  permission.can = true;
  api.request
    .mockResolvedValueOnce({ data: { gradeId: 'g1', baseSalary: '123.01' } })
    .mockRejectedValueOnce(
      new ApiClientError('Denied', {
        status: 403,
        reason: 'PROBATION_COMPENSATION_DENIED',
      }),
    );
  const page = render(<Page />);
  await screen.findByText('123.01');
  page.rerender(<Page refresh={1} />);
  await screen.findByText('You cannot view compensation.');
  expect(screen.queryByText('123.01')).toBeNull();
  expect(screen.queryByRole('button', { name: /Retry/i })).toBeNull();
});
it('formats large decimal strings exactly and rejects nondecimal salary payloads', () => {
  expect(salaryLabel('99999999999999.99', 'en-US')).toBe(
    '99,999,999,999,999.99',
  );
  expect(salaryLabel('0', 'en-US')).toBe('0.00');
  expect(salaryLabel('1e3', 'en-US')).toBe('—');
});

it('does not resurrect cached salary when a permission is revoked and restored for the same viewer', async () => {
  permission.can = true;
  api.request
    .mockResolvedValueOnce({ data: { gradeId: 'g1', baseSalary: '54321.99' } })
    .mockImplementationOnce(() => new Promise(() => {}));
  const page = render(<Page />);
  await screen.findByText('54,321.99');
  permission.can = false;
  page.rerender(<Page />);
  expect(screen.queryByText('54,321.99')).toBeNull();
  permission.can = true;
  page.rerender(<Page />);
  expect(screen.queryByText('54,321.99')).toBeNull();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
});

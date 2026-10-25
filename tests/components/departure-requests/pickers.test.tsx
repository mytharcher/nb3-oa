import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import base from '../../../client/locales/en-US.js';
import { HandoverPicker } from '../../../client/pages/departure-requests/pickers.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'actor' } } }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: base },
});
function Show({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <TestI18nProvider runtime={runtime}>
      <HandoverPicker
        id='handover'
        value={value}
        onChange={setValue}
        focusRef={() => {}}
        invalid={false}
        disabled={false}
        employeeId='employee'
        knownUser={{ id: 'known', name: 'Known recipient' }}
      />
      <output data-testid='value'>{value}</output>
    </TestI18nProvider>
  );
}
beforeEach(() => {
  api.request.mockReset();
});
afterEach(cleanup);
it('waits for two characters before requesting candidates and selecting in the same input', async () => {
  api.request.mockResolvedValue({
    data: { items: [{ id: 'chen', name: '陈明' }], total: 25 },
  });
  render(<Show />);
  const user = userEvent.setup();
  const input = screen.getByRole('combobox');
  expect(api.request).not.toHaveBeenCalled();
  await user.click(input);
  await user.type(input, '陈');
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(api.request).not.toHaveBeenCalled();
  expect(screen.queryByRole('option')).toBeNull();
  await user.type(input, '明');
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1));
  expect(api.request.mock.calls[0][0]).toMatchObject({
    path: 'departureRequests/handoverCandidates',
    query: { search: '陈明', employeeId: 'employee', offset: '0', limit: '20' },
  });
  expect(
    await screen.findByText(base.departureRequests.form.refineHandoverSearch),
  ).toBeTruthy();
  await user.click(await screen.findByRole('option', { name: '陈明' }));
  expect(screen.getByTestId('value').textContent).toBe('chen');
  expect((input as HTMLInputElement).value).toBe('陈明');
  expect(screen.getAllByRole('combobox')).toHaveLength(1);
  expect(screen.queryByText(base.departureRequests.form.previous)).toBeNull();
  expect(screen.queryByText(base.departureRequests.form.next)).toBeNull();
});
it('keeps the known selected name and hides stale results while the next search waits', async () => {
  api.request
    .mockResolvedValueOnce({
      data: { items: [{ id: 'chen', name: '陈明' }], total: 1 },
    })
    .mockImplementation(() => new Promise(() => {}));
  render(<Show initial='known' />);
  const input = screen.getByRole('combobox');
  expect((input as HTMLInputElement).value).toBe('Known recipient');
  const user = userEvent.setup();
  await user.click(input);
  await user.clear(input);
  await user.type(input, '陈明');
  await screen.findByRole('option', { name: '陈明' });
  fireEvent.change(input, { target: { value: '李华' } });
  expect(screen.queryByRole('option', { name: '陈明' })).toBeNull();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  fireEvent.change(input, { target: { value: '' } });
  await new Promise((resolve) => setTimeout(resolve, 350));
  expect(api.request).toHaveBeenCalledTimes(2);
});

it('explains when no eligible employees are available', async () => {
  api.request.mockResolvedValue({ data: { items: [], total: 0 } });
  render(<Show />);
  await userEvent.type(screen.getByRole('combobox'), '无人');
  expect(
    await screen.findByText(base.departureRequests.form.noHandoverCandidates),
  ).toBeInTheDocument();
});

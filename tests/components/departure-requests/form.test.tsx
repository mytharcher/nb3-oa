import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/departure.en-US.js';
import { DepartureForm } from '../../../client/pages/departure-requests/form-dialog.js';
import { readUnknownCreate } from '../../../client/pages/departure-requests/unknown-create.js';
import type { DepartureOptions } from '../../../client/pages/departure-requests/types.js';
const { api, close, disabled } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  close: vi.fn(),
  disabled: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true, isPending: false }),
}));
vi.mock('../../../client/components/use-route-overlay.js', () => ({
  useRouteOverlay: () => ({ close }),
}));
vi.mock('../../../client/pages/departure-requests/pickers.js', () => ({
  HandoverPicker: () => null,
  DepartureEmployeePicker: ({
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
  application: {
    namespace: 'nb3-oa',
    resources: { ...base, departureRequests: copy },
  },
});
const options: DepartureOptions = {
  timeZone: 'Asia/Shanghai',
  actor: { id: 'actor-1', name: 'Employee' },
  canCreateSelfDraft: true,
  canCreateManualDraft: false,
  selfDepartureTypes: [
    { code: 'resignation', label: { 'en-US': 'Resignation' } },
  ],
  manualDepartureTypes: [
    { code: 'dismissal', label: { 'en-US': 'Dismissal' } },
    { code: 'contractExpiry', label: { 'en-US': 'Contract expiry' } },
  ],
  departureTypes: [],
};
function show(current = options) {
  const element = (current: DepartureOptions) => (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={['/departureRequests/new']}>
        <DepartureForm
          options={current}
          allowed
          reload={vi.fn()}
          onBusy={vi.fn()}
          onDirty={vi.fn()}
          onDisabled={disabled}
        />
        <button form='departure-draft-form' type='submit'>
          Save
        </button>
      </MemoryRouter>
    </TestI18nProvider>
  );
  const view = render(element(current));
  return {
    ...view,
    rerenderOptions: (options: DepartureOptions) =>
      view.rerender(element(options)),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  close.mockResolvedValue(undefined);
});
afterEach(cleanup);
async function fill() {
  const user = userEvent.setup();
  await user.click(screen.getByLabelText('Departure type *'));
  await user.click(await screen.findByRole('option', { name: 'Resignation' }));
  fireEvent.change(screen.getByLabelText('Reason *'), {
    target: { value: 'Career change' },
  });
}
it('keeps an unknown manual-create result locked across remount and empty mine lookup', async () => {
  api.request.mockRejectedValueOnce(new TypeError('lost response'));
  const rendered = show();
  await fill();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText(/earlier create request/i);
  expect(readUnknownCreate('actor-1')).not.toBeNull();
  expect(api.request).toHaveBeenCalledOnce();
  expect(api.request.mock.calls[0][0].json).not.toHaveProperty('employeeId');
  rendered.unmount();
  api.request.mockResolvedValue({ data: [] });
  show();
  await screen.findByText(/earlier create request/i);
  fireEvent.click(
    screen.getByRole('button', { name: 'Check existing drafts' }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  expect(readUnknownCreate('actor-1')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(api.request).toHaveBeenCalledTimes(2);
});
it('manual HR selection offers dismissal and contract expiry, keeping resignation out of that mode', async () => {
  show({ ...options, canCreateSelfDraft: false, canCreateManualDraft: true });
  await userEvent.click(screen.getByLabelText('Departure type *'));
  expect(
    await screen.findByRole('option', { name: 'Dismissal' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Contract expiry' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'Resignation' })).toBeNull();
});

it('clears manual selections and reason when options withdraw the live manual grant', async () => {
  const current = {
    ...options,
    canCreateSelfDraft: false,
    canCreateManualDraft: true,
  };
  const page = show(current);
  fireEvent.change(screen.getByLabelText('Employee *'), {
    target: { value: 'employee-secret' },
  });
  await userEvent.click(screen.getByLabelText('Departure type *'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'Dismissal' }),
  );
  fireEvent.change(screen.getByLabelText('Reason *'), {
    target: { value: 'Private dismissal reason' },
  });
  page.rerenderOptions({ ...current, canCreateManualDraft: false });
  await waitFor(() =>
    expect(screen.getByLabelText('Reason *')).toHaveValue(''),
  );
  expect(screen.getByLabelText('Employee *')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(api.request).not.toHaveBeenCalled();
});

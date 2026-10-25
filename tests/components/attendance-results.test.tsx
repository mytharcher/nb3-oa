import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import copy from '../../client/locales/modules/attendance-results.en-US.js';
import AttendanceResultsPage from '../../client/pages/attendance-results/index.js';
import { attendanceCsvCell } from '../../client/pages/attendance-results/types.js';
const { api, state, flags, reload, toast } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  toast: vi.fn(),
  flags: { export: false, recalculate: true, calculateSelf: true },
  state: {
    data: {
      items: [
        {
          id: 'result-1',
          userId: 'alice',
          userName: 'Alice',
          date: '2026-10-12',
          revision: 1,
          calculatedAt: '2026-10-13T00:00:00Z',
          result: {
            status: 'exception',
            reasons: [],
            lateMinutes: 0,
            earlyMinutes: 0,
            missingPunches: 1,
            absentMinutes: 0,
          },
          approvedOvertimeMinutes: 60,
          missingPunches: [
            {
              id: 'missing-1',
              date: '2026-10-12',
              punchKind: 'in',
              version: 3,
            },
          ],
        },
      ],
      summary: { normalDays: 9, exceptionDays: 1, blockedDays: 0, restDays: 3 },
      total: 1,
      page: 1,
      pageSize: 31,
      timeZone: 'Asia/Shanghai',
    },
  },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ action }: { action: string }) => ({
    can: action in flags ? flags[action as keyof typeof flags] : true,
    isPending: false,
  }),
}));
vi.mock('../../client/pages/approvals/use-resource.js', () => ({
  useResource: () => ({ data: state.data, loading: false, reload }),
}));
vi.mock('../../client/components/date-picker.js', () => ({
  DatePicker: ({ id, disabled }: { id: string; disabled: boolean }) => (
    <input id={id} disabled={disabled} readOnly />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...copy } },
});
function open() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <AttendanceResultsPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  flags.export = false;
  flags.recalculate = true;
  flags.calculateSelf = true;
  api.request.mockReset();
  reload.mockClear();
  toast.mockClear();
});
it('shows monthly summary and links own missing punch to the existing correction drawer', () => {
  open();
  expect(
    screen.getByText(copy.attendanceResults.exceptionDays),
  ).toBeInTheDocument();
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: copy.attendanceResults.correctIn }),
  ).toHaveAttribute('href', '/newAttendanceChange?missingPunchId=missing-1');
  expect(
    screen.queryByRole('button', { name: copy.attendanceResults.export }),
  ).toBeNull();
});
it('requires a reason, keeps failed input, and retries the identical calculation key', async () => {
  api.request
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { id: 'result-1', status: 'normal' } });
  open();
  await userEvent.click(
    screen.getByRole('button', { name: copy.attendanceResults.recalculate }),
  );
  const dialog = within(screen.getByRole('dialog'));
  const submit = dialog.getByRole('button', {
    name: copy.attendanceResults.confirmCalculate,
  });
  expect(submit).toBeDisabled();
  await userEvent.type(
    dialog.getByRole('textbox', { name: copy.attendanceResults.reason }),
    'Imported late punch',
  );
  await userEvent.click(submit);
  await screen.findByText(copy.attendanceResults.calculateFailed);
  expect(
    dialog.getByRole('textbox', { name: copy.attendanceResults.reason }),
  ).toHaveValue('Imported late punch');
  await userEvent.click(submit);
  await waitFor(() => expect(reload).toHaveBeenCalled());
  expect(api.request.mock.calls[0][0].json).toEqual(
    api.request.mock.calls[1][0].json,
  );
  expect(api.request.mock.calls[0][0].json).toMatchObject({
    id: 'result-1',
    date: '2026-10-12',
    reason: 'Imported late punch',
  });
});
it('does not offer calculation of a new own result from recalculate permission alone', () => {
  flags.calculateSelf = false;
  open();
  expect(
    screen.queryByRole('button', { name: copy.attendanceResults.calculate }),
  ).toBeNull();
  expect(
    screen.getByRole('button', { name: copy.attendanceResults.recalculate }),
  ).toBeInTheDocument();
});
it('quotes CSV content and prevents spreadsheet formula injection', () => {
  expect(attendanceCsvCell('=HYPERLINK("bad")')).toBe(
    '"\'=HYPERLINK(""bad"")"',
  );
  expect(attendanceCsvCell('Alice, Bob')).toBe('"Alice, Bob"');
});

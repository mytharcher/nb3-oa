import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import formCopy from '../../../client/locales/modules/probation-form.en-US.js';
import {
  ProbationForm,
  MissingForm,
} from '../../../client/pages/probation-requests/form-dialog.js';
import type { ProbationDetail } from '../../../client/pages/probation-requests/types.js';
const { api, close, disabled, toast, reload, focusList } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  close: vi.fn(),
  disabled: vi.fn(),
  toast: vi.fn(),
  reload: vi.fn(),
  focusList: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: toast }),
}));
vi.mock('../../../client/components/use-route-overlay.js', () => ({
  useRouteOverlay: () => ({ close }),
}));
vi.mock('../../../client/pages/probation-requests/employee-picker.js', () => ({
  ProbationEmployeePicker: ({
    id,
    value,
    onChange,
    focusRef,
    disabled: locked,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    focusRef: (node: HTMLInputElement | null) => void;
    disabled: boolean;
  }) => (
    <input
      id={id}
      value={value}
      ref={focusRef}
      disabled={locked}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: {
      ...base,
      probationRequests: { ...base.probationRequests, ...formCopy },
    },
  },
});
const draft = {
  id: 'probation-1',
  employeeId: 'employee-1',
  applicantId: 'person-1',
  createdById: 'hr-1',
  applicant: { id: 'person-1', name: 'Employee' },
  number: null,
  selfEvaluation: 'Original',
  status: 'draft',
  lifecycleVersion: 0,
};
function show(detail?: ProbationDetail, path = '/probationRequests/new') {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Outlet context={{ reload: vi.fn() }} />}>
            <Route
              path={path.split('?')[0]}
              element={
                <>
                  <ProbationForm
                    detail={detail}
                    actorId='hr-1'
                    focusList={focusList}
                    allowed
                    reload={reload}
                    reloadDetail={vi.fn()}
                    onBusy={vi.fn()}
                    onDirty={vi.fn()}
                    onDisabled={disabled}
                  />
                  <button type='submit' form='probation-draft-form'>
                    Apply
                  </button>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
function editDetail(): ProbationDetail {
  return {
    record: draft,
    view: { available: [{ name: 'edit', allowed: true }] },
  } as unknown as ProbationDetail;
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  api.request.mockReset();
  close.mockResolvedValue(undefined);
});
afterEach(cleanup);
it('creates the selected employee draft with no fabricated applicant or idempotency key', async () => {
  api.request.mockResolvedValue({
    data: { record: { ...draft, selfEvaluation: 'My evaluation' } },
  });
  show();
  fireEvent.change(screen.getByLabelText('Employee *'), {
    target: { value: 'employee-1' },
  });
  fireEvent.change(screen.getByLabelText('Self-evaluation'), {
    target: { value: 'My evaluation' },
  });
  fireEvent.click(screen.getByText('Apply'));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'probationRequests',
      json: { employeeId: 'employee-1', selfEvaluation: 'My evaluation' },
    }),
  );
});
it('keeps an unknown create locked and checks drafts without sending a second create', async () => {
  api.request
    .mockRejectedValueOnce(new TypeError('Lost response'))
    .mockResolvedValueOnce({ data: [] });
  show();
  fireEvent.change(screen.getByLabelText('Employee *'), {
    target: { value: 'employee-1' },
  });
  fireEvent.change(screen.getByLabelText('Self-evaluation'), {
    target: { value: 'Preserved' },
  });
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText(
    'The save result is unknown. Check drafts before continuing; do not create another draft.',
  );
  expect(
    (screen.getByLabelText('Self-evaluation') as HTMLTextAreaElement).value,
  ).toBe('Preserved');
  expect(
    (screen.getByLabelText('Employee *') as HTMLInputElement).disabled,
  ).toBe(true);
  fireEvent.click(screen.getByText('Apply'));
  fireEvent.click(screen.getByText('Check saved drafts'));
  await screen.findByText(
    'No matching request is visible. The previous create is still unconfirmed.',
  );
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'POST'),
  ).toHaveLength(1);
  expect(close).not.toHaveBeenCalled();
});
it('does not revive a latest denied edit offer with an older parent offer', async () => {
  api.request
    .mockRejectedValueOnce(
      new ApiClientError('Conflict', {
        status: 409,
        method: 'POST',
        url: 'probationRequests',
      }),
    )
    .mockResolvedValueOnce({
      data: {
        ...editDetail(),
        record: { ...draft, lifecycleVersion: 2 },
        view: { available: [{ name: 'edit', allowed: false }] },
      },
    });
  show(editDetail());
  fireEvent.change(screen.getByLabelText('Self-evaluation'), {
    target: { value: 'Preserved' },
  });
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText(
    'The draft changed. Read the latest version before saving your retained input.',
  );
  fireEvent.click(screen.getAllByText('Load latest')[0]);
  await screen.findByText(
    'This draft cannot be edited with your current access.',
  );
  expect(
    (screen.getByLabelText('Self-evaluation') as HTMLTextAreaElement).value,
  ).toBe('Preserved');
  fireEvent.click(screen.getByText('Apply'));
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'POST'),
  ).toHaveLength(1);
});
it('replays an unknown edit with its exact original request key and payload', async () => {
  api.request
    .mockRejectedValueOnce(new TypeError('Lost response'))
    .mockResolvedValueOnce({
      data: {
        record: { ...draft, selfEvaluation: 'Changed', lifecycleVersion: 1 },
      },
    });
  show(editDetail());
  fireEvent.change(screen.getByLabelText('Self-evaluation'), {
    target: { value: 'Changed' },
  });
  fireEvent.click(screen.getByText('Apply'));
  await screen.findByText(
    'The save result is unknown. Retry the same request to confirm it.',
  );
  const first = api.request.mock.calls[0][0];
  fireEvent.click(screen.getByText('Confirm previous save'));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.request.mock.calls[1][0]).toEqual(first);
});

it('unknown create reconciliation excludes other creators, employees, old/future records and non-drafts', async () => {
  const now = Date.parse('2026-10-11T02:00:00.000Z');
  vi.spyOn(Date, 'now').mockReturnValue(now);
  const candidate = { ...draft, createdAt: new Date(now).toISOString() };
  api.request
    .mockRejectedValueOnce(new TypeError('unknown'))
    .mockResolvedValueOnce({
      data: [
        {
          ...candidate,
          id: 'match',
          applicant: { id: 'person-1', name: 'Matching employee' },
        },
        {
          ...candidate,
          id: 'wrong-actor',
          createdById: 'other',
          applicant: { id: 'person-1', name: 'Other actor' },
        },
        {
          ...candidate,
          id: 'wrong-employee',
          employeeId: 'employee-2',
          applicant: { id: 'person-2', name: 'Other employee' },
        },
        {
          ...candidate,
          id: 'old',
          createdAt: new Date(now - 1000).toISOString(),
          applicant: { id: 'person-1', name: 'Old draft' },
        },
        {
          ...candidate,
          id: 'future',
          createdAt: new Date(now + 1000).toISOString(),
          applicant: { id: 'person-1', name: 'Future draft' },
        },
        {
          ...candidate,
          id: 'submitted',
          status: 'manager',
          applicant: { id: 'person-1', name: 'Submitted' },
        },
      ],
    });
  show();
  fireEvent.change(screen.getByLabelText('Employee *'), {
    target: { value: 'employee-1' },
  });
  fireEvent.change(screen.getByLabelText('Self-evaluation'), {
    target: { value: 'Retained unknown input' },
  });
  fireEvent.click(screen.getByText('Apply'));
  fireEvent.click(await screen.findByText('Check saved drafts'));
  await screen.findByRole('button', { name: /Matching employee/ });
  for (const name of [
    'Other actor',
    'Other employee',
    'Old draft',
    'Future draft',
    'Submitted',
  ])
    expect(screen.queryByRole('button', { name: new RegExp(name) })).toBeNull();
  expect(screen.getByLabelText('Self-evaluation')).toHaveValue(
    'Retained unknown input',
  );
  fireEvent.click(screen.getByText('Apply'));
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'POST'),
  ).toHaveLength(1);
});
it.each([
  '/probationRequests/edit/probation-1?view=mine',
  '/approvals/done/editProbation/probation-1?search=kept',
])(
  'edit latest 404 refreshes and closes at source %s with stable focus',
  async (path) => {
    api.request
      .mockRejectedValueOnce(
        new ApiClientError('conflict', {
          status: 409,
          method: 'POST',
          url: 'edit',
        }),
      )
      .mockRejectedValueOnce(
        new ApiClientError('missing', {
          status: 404,
          method: 'GET',
          url: 'latest',
        }),
      );
    show(editDetail(), path);
    fireEvent.change(screen.getByLabelText('Self-evaluation'), {
      target: { value: 'Preserved' },
    });
    fireEvent.click(screen.getByText('Apply'));
    fireEvent.click((await screen.findAllByText('Load latest'))[0]);
    await waitFor(() => expect(focusList).toHaveBeenCalledOnce());
    expect(reload).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(reload.mock.invocationCallOrder[0]).toBeLessThan(
      close.mock.invocationCallOrder[0],
    );
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(
      focusList.mock.invocationCallOrder[0],
    );
  },
);
it('first-load missing handler refreshes source before closing and restoring focus', async () => {
  render(<MissingForm onMissing={reload} focusList={focusList} />);
  await waitFor(() => expect(focusList).toHaveBeenCalledOnce());
  expect(reload).toHaveBeenCalledOnce();
  expect(close).toHaveBeenCalledOnce();
  expect(reload.mock.invocationCallOrder[0]).toBeLessThan(
    close.mock.invocationCallOrder[0],
  );
});
it.each(['P-001', null])(
  'names the successfully saved record in the toast (%s)',
  async (number) => {
    api.request.mockResolvedValue({ data: { record: { ...draft, number } } });
    show(editDetail());
    fireEvent.change(screen.getByLabelText('Self-evaluation'), {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByText('Apply'));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        type: 'success',
        title: `Saved probation draft “${number ?? 'Employee — Draft'}”`,
      }),
    );
  },
);

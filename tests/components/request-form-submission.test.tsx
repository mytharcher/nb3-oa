import { useRef, useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { Transition as VehicleTransition } from '../../server/routes/vehicles/schemas.js';
import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import {
  useRequestFormSubmission,
  preventComposingSubmit,
  type DraftRecord,
  type SubmitAdapter,
} from '../../client/hooks/use-request-form-submission.js';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '../../client/components/request-form-submission.js';
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true }),
}));
const { api, write, done } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  write: vi.fn(),
  done: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const draft = { id: 'draft-1', status: 'draft', lifecycleVersion: 1 };
const edited = { ...draft, lifecycleVersion: 2 };
const submitted = { ...edited, status: 'head', lifecycleVersion: 3 };
function Harness({
  existing,
  adapter = { resource: 'generalRequests' },
}: {
  existing?: DraftRecord;
  adapter?: SubmitAdapter;
}) {
  const submission = useRequestFormSubmission(adapter);
  const [value, setValue] = useState('First proposal');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const busyRef = useRef(false);
  return (
    <>
      <form
        id='request'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) => {
          event.preventDefault();
          if (busyRef.current) return;
          busyRef.current = true;
          setBusy(true);
          setError(undefined);
          void submission
            .save({ value }, existing, (record) => write(record, value))
            .then((record) => submission.finish(record))
            .then(done)
            .catch(setError)
            .finally(() => {
              busyRef.current = false;
              setBusy(false);
            });
        }}
      >
        <input
          aria-label='Proposal'
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
        />
      </form>
      <RequestFormButtons resource='oa.test' form='request' busy={busy} />
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {error ? <p role='alert'>Operation failed</p> : null}
    </>
  );
}
function mount(props: Parameters<typeof Harness>[0] = {}) {
  render(
    <TestI18nProvider runtime={runtime}>
      <Harness {...props} />
    </TestI18nProvider>,
  );
}
function failure(status: number) {
  return new ApiClientError('Failure', {
    status,
    method: 'POST',
    url: '/api/generalRequests/draft-1/transition',
  } as ConstructorParameters<typeof ApiClientError>[1]);
}
beforeEach(() => {
  api.request.mockReset();
  write.mockReset();
  done.mockReset();
  write.mockResolvedValue(draft);
  api.request.mockResolvedValue({ data: { record: submitted } });
});
it('saves a draft without submitting and Enter uses the same safe action', async () => {
  mount();
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox'), '{Enter}');
  await waitFor(() => expect(done).toHaveBeenCalledWith(draft));
  expect(api.request).not.toHaveBeenCalled();
});
it('submits a newly written draft from the primary button', async () => {
  mount();
  await userEvent.click(
    screen.getByRole('button', { name: 'Submit', exact: true }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(write).toHaveBeenCalledWith(undefined, 'First proposal');
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'generalRequests/draft-1/transition',
      json: expect.objectContaining({
        transition: 'submit',
        version: 1,
        requestId: expect.any(String),
      }),
    }),
  );
});
it('edits a reopened draft before submitting its returned version', async () => {
  write.mockResolvedValue(edited);
  mount({ existing: draft });
  await userEvent.click(
    screen.getByRole('button', { name: 'Submit', exact: true }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(write).toHaveBeenCalledWith(draft, 'First proposal');
  expect(api.request.mock.calls[0][0].json.version).toBe(2);
});
it('keeps the saved draft and retries submission without another draft write', async () => {
  api.request
    .mockRejectedValueOnce(failure(400))
    .mockResolvedValueOnce({ data: { record: submitted } });
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await screen.findByText(/Draft saved. Submission did not complete/);
  expect(screen.getByRole('textbox')).toHaveValue('First proposal');
  expect(done).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(write).toHaveBeenCalledTimes(1);
  expect(api.request.mock.calls[1][0]).toEqual(api.request.mock.calls[0][0]);
});
it('saves changed content into the same committed draft after a definite submission refusal', async () => {
  api.request
    .mockRejectedValueOnce(failure(400))
    .mockResolvedValueOnce({ data: { record: submitted } });
  write.mockResolvedValueOnce(draft).mockResolvedValueOnce(edited);
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await screen.findByText(/Draft saved/);
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'Corrected proposal');
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(write).toHaveBeenLastCalledWith(draft, 'Corrected proposal');
  expect(api.request.mock.calls[1][0].json.version).toBe(2);
});
it('replays an unknown submission using its exact command', async () => {
  api.request
    .mockRejectedValueOnce(failure(500))
    .mockResolvedValueOnce({ data: { record: submitted } });
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await screen.findByText(/submission result is unknown/);
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(write).toHaveBeenCalledTimes(1);
  expect(api.request.mock.calls[1][0]).toEqual(api.request.mock.calls[0][0]);
});
it('blocks changed content while submission is unknown', async () => {
  api.request.mockRejectedValue(failure(500));
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await screen.findByText(/submission result is unknown/);
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'Changed');
  await user.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Submit', exact: true }),
    ).toBeEnabled(),
  );
  expect(write).toHaveBeenCalledTimes(1);
  expect(api.request).toHaveBeenCalledTimes(1);
});
it.each([
  [
    {
      resource: 'transferRequests',
      suffix: 'transitions',
      keyField: 'requestKey',
      includeInput: false,
    },
    'transferRequests/draft-1/transitions',
    { transition: 'submit', version: 1, requestKey: expect.any(String) },
  ],
  [
    {
      resource: 'certificateRequests',
      suffix: 'submit',
      keyField: 'requestKey',
      versionField: 'expectedVersion',
      recordResult: 'direct',
    },
    'certificateRequests/draft-1/submit',
    { expectedVersion: 1, requestKey: expect.any(String) },
  ],
  [
    { resource: 'vendorQualifications', nameField: 'name' },
    'vendorQualifications/draft-1/transition',
    { name: 'submit', version: 1, requestId: expect.any(String), input: {} },
  ],
] as const)('uses the owner adapter for %s', async (adapter, path, json) => {
  if ('recordResult' in adapter)
    api.request.mockResolvedValue({ data: submitted });
  mount({ adapter });
  await userEvent.click(
    screen.getByRole('button', { name: 'Submit', exact: true }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
  expect(api.request).toHaveBeenCalledWith({ method: 'POST', path, json });
});
it('does not write on an IME confirmation Enter', () => {
  mount();
  const allowed = fireEvent.keyDown(screen.getByRole('textbox'), {
    key: 'Enter',
    isComposing: true,
  });
  expect(allowed).toBe(false);
  expect(write).not.toHaveBeenCalled();
});

it('never blindly replays an unknown plain creation', async () => {
  write.mockRejectedValue(new Error('Connection lost'));
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  await screen.findByRole('alert');
  expect(write).toHaveBeenCalledTimes(1);
  expect(api.request).not.toHaveBeenCalled();
});

it('uses the strict vehicle submit contract without an edit input', async () => {
  api.request.mockImplementation(async (request) => {
    expect(VehicleTransition.parse(request.json)).toMatchObject({
      transition: 'submit',
      version: draft.lifecycleVersion,
    });
    return { data: { record: submitted } };
  });
  mount({
    adapter: {
      resource: 'vehicleRequests',
      suffix: 'transitions',
      includeInput: false,
    },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Submit', exact: true }),
  );
  await waitFor(() => expect(done).toHaveBeenCalledWith(submitted));
});

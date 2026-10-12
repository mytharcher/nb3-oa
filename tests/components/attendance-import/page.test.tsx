import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Link, useLocation } from 'react-router';
import { NavigationGuardProvider, ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import Page from '../../../client/pages/attendance-import/index.js';
import { createTemplate } from '../../../client/pages/attendance-import/workbook.js';
import enUS from '../../../client/locales/en-US.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  toast: vi.fn(),
  refresh: vi.fn(),
  allowed: true,
  actor: 'hr',
  revision: 0,
}));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: state.toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: { user: { id: state.actor } },
    refresh: state.refresh,
  }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => state.revision,
  useCan: () => ({ can: state.allowed, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function Probe() {
  const location = useLocation();
  return <output data-testid='location'>{location.pathname}</output>;
}
function tree() {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <NavigationGuardProvider>
          <Page />
          <Link to='/destination'>Destination</Link>
          <Probe />
        </NavigationGuardProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function file(key = 'one') {
  const f = unzipSync(createTemplate()),
    name = 'xl/worksheets/sheet1.xml';
  const values = [
    'hr',
    '2035-01-02',
    'in',
    '2035-01-02T01:00:00Z',
    'test',
    key,
    '{}',
  ];
  const xml =
    '<row r="2">' +
    values
      .map(
        (v, i) =>
          `<c r="${String.fromCharCode(65 + i)}2" t="inlineStr"><is><t>${v}</t></is></c>`,
      )
      .join('') +
    '</row>';
  f[name] = strToU8(
    strFromU8(f[name]).replace('</sheetData>', xml + '</sheetData>'),
  );
  const bytes = zipSync(f),
    result = new File([new Uint8Array(bytes)], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  Object.defineProperty(result, 'arrayBuffer', {
    value: async () => bytes.buffer,
  });
  return result;
}
async function preview() {
  await userEvent.upload(
    screen.getByLabelText('Excel evidence file', { exact: false }),
    file(),
  );
  await screen.findByText('Preview: 1 rows');
  await userEvent.click(screen.getByRole('checkbox'));
}
afterEach(() => {
  cleanup();
  state.request.mockReset();
  state.toast.mockReset();
  state.refresh.mockReset();
  state.allowed = true;
  state.revision = 0;
  state.actor = 'hr';
});
it('previews without HTTP, confirms exactly one pending request, displays receipt and clears on new file', async () => {
  let resolve!: (v: unknown) => void;
  state.request.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(tree());
  await preview();
  expect(state.request).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm batch import' }),
  );
  expect(screen.getByRole('button', { name: 'Importing' })).toBeDisabled();
  expect(state.request).toHaveBeenCalledTimes(1);
  expect(state.request.mock.calls[0][0].json.rows[0].sourceData).toEqual({});
  resolve({ data: { count: 1, recordIds: ['record'] } });
  await screen.findByText('1 evidence rows imported.');
  expect(state.toast).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'success' }),
  );
  await userEvent.upload(
    screen.getByLabelText('Excel evidence file', { exact: false }),
    file('two'),
  );
  await waitFor(() =>
    expect(
      screen.queryByText('1 evidence rows imported.'),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('checkbox')).not.toBeChecked();
});
it('denies controls and removes preview and receipt immediately on current authorization revision', async () => {
  const view = render(tree());
  await preview();
  state.revision++;
  view.rerender(tree());
  expect(screen.queryByText('Preview: 1 rows')).not.toBeInTheDocument();
  state.allowed = false;
  view.rerender(tree());
  expect(
    screen.getByText(
      'You do not have permission to import attendance evidence.',
    ),
  ).toBeVisible();
  expect(
    screen.queryByLabelText('Excel evidence file', { exact: false }),
  ).not.toBeInTheDocument();
  expect(state.request).not.toHaveBeenCalled();
});
it('suppresses stale successful writes after actor/revision changes', async () => {
  let resolve!: (v: unknown) => void;
  state.request.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(tree());
  await preview();
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm batch import' }),
  );
  state.actor = 'another';
  view.rerender(tree());
  resolve({ data: { count: 1, recordIds: ['record'] } });
  await waitFor(() =>
    expect(
      screen.queryByText('1 evidence rows imported.'),
    ).not.toBeInTheDocument(),
  );
  expect(state.toast).not.toHaveBeenCalled();
});
it('safe server errors retain retryable preview, clear terminal evidence and expose session recovery', async () => {
  for (const status of [409, 500, 403, 401]) {
    state.request.mockRejectedValue(
      new ApiClientError('secret failure', { status, reason: 'SECRET' }),
    );
    const view = render(tree());
    await preview();
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm batch import' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Importing' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByText('secret failure')).not.toBeInTheDocument();
    if (status === 409 || status === 500) {
      expect(screen.getByText('Preview: 1 rows')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Try importing again' }),
      ).toBeEnabled();
    } else
      expect(screen.queryByText('Preview: 1 rows')).not.toBeInTheDocument();
    if (status === 401) {
      await userEvent.click(
        screen.getByRole('button', { name: 'Sign in again' }),
      );
      expect(state.refresh).toHaveBeenCalled();
    }
    view.unmount();
  }
});

it('dirty preview blocks navigation, discard explains retry and then permits destination', async () => {
  render(tree());
  await preview();
  await userEvent.click(screen.getByRole('link', { name: 'Destination' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/');
  expect(screen.getByRole('alertdialog')).toBeVisible();
  expect(
    screen.getByText(
      'After discarding the preview, click your destination again to continue navigating.',
    ),
  ).toBeVisible();
  await userEvent.click(
    screen.getByRole('button', { name: 'Discard preview', exact: true }),
  );
  await userEvent.click(screen.getByRole('link', { name: 'Destination' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/destination');
});

it('reports safe template download failures without an unhandled rejected action', async () => {
  const original = URL.createObjectURL;
  URL.createObjectURL = vi.fn(() => {
    throw new Error('private failure');
  });
  try {
    render(tree());
    await userEvent.click(
      screen.getByRole('button', { name: 'Download Excel template' }),
    );
    await waitFor(() =>
      expect(state.toast).toHaveBeenCalledWith({
        title: 'The Excel template could not be downloaded. Try again.',
        type: 'error',
      }),
    );
  } finally {
    URL.createObjectURL = original;
  }
});

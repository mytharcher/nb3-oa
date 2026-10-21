import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import { Mentor } from '../../../client/pages/onboarding/mentor.js';
const { api, permission, changed } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: { can: true },
  changed: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: permission.can, isPending: false }),
  useAuthorizationRevision: () => 0,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'hr' } } }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function Harness() {
  const [value, setValue] = useState('');
  return (
    <TestI18nProvider runtime={runtime}>
      <Mentor
        id='mentor'
        value={value}
        onChange={(id) => {
          setValue(id);
          changed(id);
        }}
        disabled={false}
        exclude='self'
      />
    </TestI18nProvider>
  );
}
beforeEach(() => {
  api.request.mockReset();
  changed.mockReset();
  permission.can = true;
  api.request.mockResolvedValue({
    data: [{ id: 'alice', name: 'Alice', code: 'A-1' }],
    meta: { total: 1 },
  });
});
it('uses a searchable combobox with a placeholder, debounced directory requests and named selection', async () => {
  render(<Harness />);
  const input = screen.getByRole('combobox');
  expect(input).toHaveAttribute(
    'placeholder',
    'Search by name or employee code',
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  await userEvent.type(input, 'Ali');
  expect(api.request).toHaveBeenCalledOnce();
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'directory',
        query: { q: 'Ali', page: '1', pageSize: '100' },
      }),
    ),
  );
  await userEvent.click(
    await screen.findByRole('option', { name: /Alice.*A-1/ }),
  );
  expect(changed).toHaveBeenLastCalledWith('alice');
  expect(input).toHaveValue('Alice');
});
it('does not search or select intermediate IME text and searches the committed text after debounce', async () => {
  render(<Harness />);
  const input = screen.getByRole('combobox');
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: 'ni' } });
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  expect(api.request).toHaveBeenCalledOnce();
  expect(changed).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input, { target: { value: '你' } });
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ q: '你' }) }),
    ),
  );
});
it('announces a capped result informationally and does not request directory data without view permission', async () => {
  api.request.mockResolvedValue({
    data: Array.from({ length: 100 }, (_, index) => ({
      id: String(index),
      name: `Employee ${index}`,
      code: '',
    })),
    meta: { total: 101 },
  });
  const view = render(<Harness />);
  const cap = await screen.findByText(
    'Showing the first 100 matches. Refine your search.',
  );
  expect(cap).not.toHaveAttribute('role', 'alert');
  view.unmount();
  api.request.mockClear();
  permission.can = false;
  render(<Harness />);
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(api.request).not.toHaveBeenCalled();
});

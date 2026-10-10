import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, type ReactNode, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';

// Only HTTP is mocked: the picker's requests go to this function instead of the server.
const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  const client = { request: mocks.request };
  return { ...actual, useApiClient: () => client };
});
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh: vi.fn() }),
}));

const { ApiClientError } = await import('@nocobase/app-client');
const { UserMultiPicker, UserPicker } =
  await import('@/components/user-picker');

const runtime = await createTestI18nRuntime({
  locale: 'en-US',
  application: { namespace: '@nocobase/app-template-default', resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const people = [
  { id: 'u1', name: 'Ann Lee', username: 'ann', email: 'ann@example.com' },
  { id: 'u2', name: 'Bob Wu', username: null, email: 'bob@example.com' },
  { id: 'u3', name: 'Carol Ma', username: 'carol', email: 'carol@example.com' },
];

interface Request {
  readonly path: string;
  readonly query: { q?: string; pageSize?: number; status?: string };
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.request.mockImplementation(async ({ query }: Request) => {
    const q = (query.q ?? '').toLowerCase();
    const data = people.filter(
      (person) =>
        !q ||
        person.name.toLowerCase().includes(q) ||
        person.email.includes(q) ||
        (person.username ?? '').includes(q),
    );
    return { data, meta: { page: 1, pageSize: 20, total: data.length } };
  });
});

function SinglePicker({
  onChange,
  initial = '',
  knownUsers,
}: {
  readonly onChange: (value: string) => void;
  readonly initial?: string;
  readonly knownUsers?: { id: string; name: string }[];
}): ReactElement {
  const [value, setValue] = useState(initial);
  return (
    <UserPicker
      id='owner'
      value={value}
      knownUsers={knownUsers}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('UserPicker', () => {
  it('searches users by the typed text and stores the id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SinglePicker onChange={onChange} />, { wrapper: I18n });

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute(
      'placeholder',
      'Search by name, username or email',
    );
    await user.click(input);
    await user.type(input, 'bob');

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'users',
          query: { q: 'bob', pageSize: 20, status: 'enabled' },
        }),
      ),
    );
    const option = await screen.findByRole('option', { name: /Bob Wu/u });
    expect(screen.queryByRole('option', { name: /Ann Lee/u })).toBeNull();
    await user.click(option);

    expect(onChange).toHaveBeenLastCalledWith('u2');
    expect(input).toHaveValue('Bob Wu');
  });

  it('shows the name of a known selected user', () => {
    render(
      <SinglePicker
        onChange={() => {}}
        initial='u3'
        knownUsers={[{ id: 'u3', name: 'Carol Ma' }]}
      />,
      { wrapper: I18n },
    );
    expect(screen.getByRole('combobox')).toHaveValue('Carol Ma');
  });

  it('explains a forbidden search without a retry', async () => {
    mocks.request.mockRejectedValue(
      new ApiClientError('Forbidden', {
        status: 403,
        method: 'GET',
        url: '/api/users',
      }),
    );
    render(<SinglePicker onChange={() => {}} />, { wrapper: I18n });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to look up users.',
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('offers a retry after another failure', async () => {
    const user = userEvent.setup();
    mocks.request.mockRejectedValueOnce(new Error('network'));
    render(<SinglePicker onChange={() => {}} />, { wrapper: I18n });

    await user.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });
});

describe('UserMultiPicker', () => {
  it('collects several users as removable chips', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Multi(): ReactElement {
      const [value, setValue] = useState<string[]>(['u1']);
      return (
        <UserMultiPicker
          value={value}
          knownUsers={[people[0]!]}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Multi />, { wrapper: I18n });

    expect(screen.getByText('Ann Lee')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: /Carol Ma/u }));
    expect(onChange).toHaveBeenLastCalledWith(['u1', 'u3']);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Remove Ann Lee' }));
    expect(onChange).toHaveBeenLastCalledWith(['u3']);
  });
});

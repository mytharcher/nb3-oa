import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import users from '../../client/locales/administration/users/en-US.js';
import { InviteDialog } from '../../client/pages/administration/users/components/invite-dialog.js';
const ns = '@nocobase/app-plugin-users';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: users },
});
it('keeps invitation input and displays a translated in-dialog error when sending fails', async () => {
  const invite = vi
    .fn()
    .mockRejectedValue(new Error('private transport details'));
  render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <InviteDialog roleScopes={[]} onInvite={invite} onClose={vi.fn()} />
    </TestI18nProvider>,
  );
  const dialog = screen.getByRole('dialog');
  const emails = within(dialog).getByRole('textbox');
  await userEvent.type(emails, 'employee@example.com');
  await userEvent.click(
    within(dialog).getByRole('button', { name: users.invite.send }),
  );
  await within(dialog).findByRole('alert');
  expect(within(dialog).getByRole('alert')).toHaveTextContent(
    users.errors.operationFailed,
  );
  expect(emails).toHaveValue('employee@example.com');
  expect(screen.queryByText('private transport details')).toBeNull();
  await waitFor(() => expect(invite).toHaveBeenCalledOnce());
});

it('retains invitation results in the same drawer and closes without a discard prompt', async () => {
  const close = vi.fn();
  const invite = vi
    .fn()
    .mockResolvedValue([
      { email: 'fixture@example.com', outcome: 'existingUser' },
    ]);
  render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <InviteDialog roleScopes={[]} onInvite={invite} onClose={close} />
    </TestI18nProvider>,
  );
  const drawer = screen.getByRole('dialog');
  expect(drawer).toHaveAttribute('data-presentation', 'drawer');
  await userEvent.type(
    within(drawer).getByRole('textbox'),
    'fixture@example.com',
  );
  await userEvent.click(
    within(drawer).getByRole('button', { name: users.invite.send }),
  );
  await within(drawer).findByText(users.invite.outcome.existingUser);
  expect(within(drawer).getByText('fixture@example.com')).toBeInTheDocument();
  await userEvent.click(
    within(drawer).getByRole('button', { name: users.invite.done }),
  );
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(invite).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alertdialog')).toBeNull();
});

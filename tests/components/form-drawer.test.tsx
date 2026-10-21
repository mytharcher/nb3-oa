import { useState, type ReactNode } from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { Dialog, DialogTitle } from '../../client/components/ui/dialog.js';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '../../client/components/form-drawer.js';
import { useFormDiscardGuard } from '../../client/hooks/use-form-discard-guard.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
function mount(save: (value: string) => Promise<void> = async () => {}) {
  function Host() {
    const [open, setOpen] = useState(true);
    const [value, setValue] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const guard = useFormDiscardGuard(!!value, busy);
    const close = () => void guard.requestClose(() => setOpen(false));
    return (
      <>
        <button onClick={() => setOpen(true)}>Open form</button>
        <Dialog open={open} onOpenChange={(next) => !next && close()}>
          <FormDrawerContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (busy) return;
                setBusy(true);
                void save(value)
                  .then(
                    () => setOpen(false),
                    () => setError(true),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              <FormDrawerHeader>
                <DialogTitle>Create record</DialogTitle>
              </FormDrawerHeader>
              <FormDrawerBody>
                <label>
                  Name
                  <input
                    required
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </label>
                {error && <p role='alert'>Save failed</p>}
              </FormDrawerBody>
              <FormDrawerFooter>
                <button type='button' disabled={busy} onClick={close}>
                  Cancel
                </button>
                <button type='submit' disabled={busy}>
                  Save
                </button>
              </FormDrawerFooter>
            </form>
          </FormDrawerContent>
          {guard.confirmation}
        </Dialog>
      </>
    );
  }
  render(<Host />, { wrapper: I18n });
}

it('keeps the fixed footer associated with its native form and submits using Enter', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  mount(save);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('data-presentation', 'drawer');
  const input = screen.getByRole('textbox');
  const submit = screen.getByRole('button', {
    name: 'Save',
  }) as HTMLButtonElement;
  expect(submit.form).toBe(input.closest('form'));
  expect(submit.closest('[data-slot="form-drawer-body"]')).toBeNull();
  await userEvent.type(input, '测试 employee{Enter}');
  await waitFor(() =>
    expect(save).toHaveBeenCalledExactlyOnceWith('测试 employee'),
  );
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('uses the same discard guard for Cancel and Escape and keeps input when editing continues', async () => {
  mount();
  await userEvent.type(screen.getByRole('textbox'), 'Unsaved');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  const confirmation = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(confirmation).getByRole('button', { name: 'Continue editing' }),
  );
  expect(screen.getByRole('textbox')).toHaveValue('Unsaved');
  await userEvent.click(screen.getByRole('textbox'));
  await userEvent.keyboard('{Escape}');
  const again = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(again).getByRole('button', { name: 'Discard changes' }),
  );
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

it('blocks every close while saving and keeps input after failure', async () => {
  let reject!: (error: Error) => void;
  const save = vi.fn(
    () =>
      new Promise<void>((_, rejectSave) => {
        reject = rejectSave;
      }),
  );
  mount(save);
  await userEvent.type(screen.getByRole('textbox'), 'Keep this');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.queryByRole('alertdialog')).toBeNull();
  await act(async () => reject(new Error('failure')));
  await screen.findByRole('alert');
  expect(screen.getByRole('textbox')).toHaveValue('Keep this');
  expect(save).toHaveBeenCalledOnce();
});

import { useDrawerFormGuard } from '../../../client/hooks/use-drawer-form-guard';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US';
import { Dialog, DialogTitle } from '../../../client/components/ui/dialog';
import { Button } from '../../../client/components/ui/button';
import { Input } from '../../../client/components/ui/input';
import { Textarea } from '../../../client/components/ui/textarea';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '../../../client/components/form-drawer';
import { RouteFormPage } from '../../../client/components/route-form-page';
import { FormActions } from '../../../client/components/form-actions';
import { PageContainer } from '../../../client/components/page-container';
import { PageHeader } from '../../../client/components/page-header';
import { useFormDiscardGuard } from '../../../client/hooks/use-form-discard-guard';

// Synthetic browser fixture: no server, credentials, or business records.
export function Fields({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <label className='flex flex-col gap-2'>
        Name
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {Array.from({ length: 18 }, (_, i) => (
        <label key={i} className='flex flex-col gap-2'>
          Optional field {i + 1}
          <Input />
        </label>
      ))}
      <label className='flex flex-col gap-2'>
        Notes
        <Textarea />
      </label>
    </>
  );
}
export function ControlledForm() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const guard = useFormDiscardGuard(!!value, busy);
  const close = () => void guard.requestClose(() => setOpen(false));
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open controlled form</Button>
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <FormDrawerContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              window.setTimeout(() => {
                setBusy(false);
                setFailed(true);
              }, 250);
            }}
          >
            <FormDrawerHeader>
              <DialogTitle>Create employee fixture</DialogTitle>
            </FormDrawerHeader>
            <FormDrawerBody>
              {failed && <p role='alert'>Synthetic save failure</p>}
              <Fields value={value} onChange={setValue} />
            </FormDrawerBody>
            <FormDrawerFooter>
              <Button
                type='button'
                variant='outline'
                onClick={close}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={busy}>
                Save
              </Button>
            </FormDrawerFooter>
          </form>
        </FormDrawerContent>
        {guard.confirmation}
      </Dialog>
    </>
  );
}
export function RouteFields() {
  const [value, setValue] = useState('');
  const guard = useDrawerFormGuard(!!value, false);
  return (
    <>
      <form
        id='fixture-route-form'
        className='flex flex-col gap-4'
        onSubmit={(event) => event.preventDefault()}
      >
        <Fields value={value} onChange={setValue} />
        <FormActions>
          <Button type='submit' form='fixture-route-form'>
            Save
          </Button>
        </FormActions>
      </form>
      {guard.confirmation}
    </>
  );
}
export function RouteForm() {
  return (
    <RouteFormPage title='Create employee fixture'>
      <PageContainer>
        <PageHeader title='Create employee fixture' />
        <RouteFields />
      </PageContainer>
    </RouteFormPage>
  );
}

async function main() {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: enUS },
  });
  const mode = new URLSearchParams(window.location.search).get('mode');
  const router = createMemoryRouter(
    [
      {
        path: '/records',
        element: (
          <main className='p-6'>
            <h1>Employee list fixture</h1>
            <Outlet />
          </main>
        ),
        children: [{ path: 'new', element: <RouteForm /> }],
      },
    ],
    { initialEntries: ['/records/new?q=staff&page=2'] },
  );
  createRoot(document.getElementById('root')!).render(
    <TestI18nProvider runtime={runtime}>
      {mode === 'route' ? (
        <RouterProvider router={router} />
      ) : (
        <ControlledForm />
      )}
    </TestI18nProvider>,
  );
}
void main();

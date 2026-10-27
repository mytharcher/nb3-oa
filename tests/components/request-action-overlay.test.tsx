import { RouteOverlaySequence } from '../../client/components/route-overlay-sequence.js';
import { DrawerCloseGuardsContext } from '../../client/components/drawer-form-context.js';
import { useContext, useLayoutEffect, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
} from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { RequestActionOverlay } from '../../client/components/request-action-overlay.js';
import { RouteDrawer } from '../../client/components/route-drawer.js';
import { useRouteOverlay } from '../../client/components/use-route-overlay.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const submit = vi.fn();
const descendantGuard = vi.fn(() => true);
beforeEach(() => {
  descendantGuard.mockReset().mockReturnValue(true);
});
function Guard() {
  const guards = useContext(DrawerCloseGuardsContext);
  useLayoutEffect(() => {
    guards?.add(descendantGuard);
    return () => {
      guards?.delete(descendantGuard);
    };
  }, [guards]);
  return null;
}
function CurrentLocation() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
      {location.hash}
    </output>
  );
}

function Footer({ busy }: { busy: boolean }) {
  const { close } = useRouteOverlay();
  return (
    <>
      <button disabled={busy} onClick={() => void close()}>
        Cancel action
      </button>
      <button disabled={busy} form='command' type='submit'>
        Confirm action
      </button>
    </>
  );
}
function Action() {
  const [busy, setBusy] = useState(false);
  return (
    <RequestActionOverlay
      title='Submit draft'
      className='sm:max-w-2xl'
      beforeClose={() => !busy}
      footer={<Footer busy={busy} />}
    >
      <Guard />
      <form
        id='command'
        onSubmit={(event) => {
          event.preventDefault();
          submit();
          setBusy(true);
        }}
      >
        <label>
          Note
          <input />
        </label>
      </form>
    </RequestActionOverlay>
  );
}
function Draft() {
  return (
    <RouteDrawer title='Draft details'>
      <Link to='action/submit?keep=1#draft'>Open submission</Link>
      <Outlet />
    </RouteDrawer>
  );
}
function open(path = '/draft', parameter = 'actionName') {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path='/'
            element={
              <>
                <CurrentLocation />
                <Outlet />
              </>
            }
          >
            <Route path='draft' element={<Draft />}>
              <Route path={`action/:${parameter}`} element={<Action />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
it.each(['actionName', 'operation', 'action'])(
  'presents submit as a compact dialog for the existing %s action parameter',
  async (parameter) => {
    submit.mockClear();
    open('/draft/action/submit?keep=1#draft', parameter);
    const popup = await screen.findByRole('dialog', { name: 'Submit draft' });
    expect(popup).toHaveAttribute('data-presentation', 'dialog');
    expect(popup).toHaveClass('sm:max-w-md');
    expect(popup).not.toHaveClass('sm:max-w-2xl');
    expect(
      document.querySelectorAll('[data-presentation=drawer]'),
    ).toHaveLength(1);
    expect(submit).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Cancel action' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Submit draft' })).toBeNull(),
    );
    expect(screen.getByRole('dialog', { name: 'Draft details' })).toBeVisible();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/draft?keep=1#draft',
    );
  },
);
it('keeps other actions as drawers and keeps the original width', async () => {
  open('/draft/action/approve');
  const popup = await screen.findByRole('dialog', { name: 'Submit draft' });
  expect(popup).toHaveAttribute('data-presentation', 'drawer');
  expect(popup).toHaveClass('sm:max-w-2xl');
});
it('opens without submitting, retains the parent draft, and blocks closing during submission', async () => {
  submit.mockClear();
  open();
  await userEvent.click(screen.getByRole('link', { name: 'Open submission' }));
  const popup = await screen.findByRole('dialog', { name: 'Submit draft' });
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Note'), {
    target: { value: 'Ready' },
  });
  await userEvent.click(screen.getByRole('button', { name: 'Confirm action' }));
  expect(submit).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Cancel action' })).toBeDisabled();
  await userEvent.keyboard('{Escape}');
  expect(popup).toBeVisible();
});
it('returns keyboard focus into the original draft after cancelling', async () => {
  open();
  const trigger = screen.getByRole('link', { name: 'Open submission' });
  await userEvent.click(trigger);
  await screen.findByRole('dialog', { name: 'Submit draft' });
  await userEvent.keyboard('{Escape}');
  await waitFor(() =>
    expect(
      screen.getByRole('dialog', { name: 'Draft details' }),
    ).toContainElement(document.activeElement as HTMLElement),
  );
});
it('describes the actual missing departure inputs in both languages', () => {
  expect(
    zhCN.departureRequests.businessErrors.DEPARTURE_APPLICATION_INCOMPLETE,
  ).toBe('请填写期望最后工作日并选择交接人。');
  expect(
    enUS.departureRequests.businessErrors.DEPARTURE_APPLICATION_INCOMPLETE,
  ).toBe('Choose the expected last working day and handover recipient.');
});

it('respects registered descendant form close guards inside a submit dialog', async () => {
  descendantGuard.mockReturnValue(false);
  open('/draft/action/submit');
  await screen.findByRole('dialog', { name: 'Submit draft' });
  await userEvent.click(screen.getByRole('button', { name: 'Cancel action' }));
  await waitFor(() => expect(descendantGuard).toHaveBeenCalled());
  expect(screen.getByRole('dialog', { name: 'Submit draft' })).toBeVisible();
  descendantGuard.mockReturnValue(true);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel action' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Submit draft' })).toBeNull(),
  );
});

it('shares one entrance across loading, form and error replacements, and resets for a new view', () => {
  function FormPanel() {
    return <RouteDrawer title='Form'>Inputs</RouteDrawer>;
  }
  const view = (stage: string, identity = 'first') => (
    <MemoryRouter>
      <RouteOverlaySequence key={identity}>
        {stage === 'form' ? (
          <FormPanel />
        ) : (
          <RouteDrawer title={stage}>Feedback</RouteDrawer>
        )}
      </RouteOverlaySequence>
    </MemoryRouter>
  );
  const { rerender } = render(view('Loading'));
  expect(screen.getByRole('dialog')).not.toHaveClass('data-open:animate-none');
  for (const stage of ['form', 'Error', 'form']) {
    rerender(view(stage));
    expect(screen.getByRole('dialog')).toHaveClass('data-open:animate-none');
  }
  rerender(view('Loading', 'another'));
  expect(screen.getByRole('dialog')).not.toHaveClass('data-open:animate-none');
});

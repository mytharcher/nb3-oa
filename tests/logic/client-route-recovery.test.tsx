import { RouteOverlayHandoffContext } from '../../client/components/route-overlay-handoff.js';
import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { RouteDrawer } from '../../client/components/route-drawer.js';
import { requestActionDefinitions } from '../../client/components/request-action-definitions.js';
import { ClientRoute } from '../../client/routing/client-route.tsx';

const access = vi.hoisted(() => ({ can: true }));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: access.can, isPending: false }),
}));

const route: AppClientRegisteredRoute = {
  id: 'recoverable',
  name: 'recoverable',
  path: '/recoverable',
  auth: 'required',
  authz: 'skip',
  packageName: 'test',
  source: 'application',
  componentLoader: async () => {
    throw new Error('Module unavailable');
  },
};

// Loading a lazy route and rendering its error boundary can take longer than Testing Library's one-second default on
// a loaded CI runner. A page that never renders still fails, well inside the 30-second test timeout.
const ROUTE_LOAD_TIMEOUT = { timeout: 10_000 };

const healthyModule: AppClientRouteComponentModule = {
  default: () => <h2>Recovered page</h2>,
};

describe('client route loading recovery', () => {
  it('clears a previous failure when the same mounted route loads successfully', async () => {
    const { rerender } = render(<ClientRoute route={route} />);
    expect(
      await screen.findByText('Unable to load page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();

    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );

    expect(
      await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });

  it('ignores a superseded loader failure after the replacement succeeds', async () => {
    let rejectLoad!: (error: Error) => void;
    const pending = new Promise<AppClientRouteComponentModule>(
      (_resolve, reject) => {
        rejectLoad = reject;
      },
    );
    const { rerender } = render(
      <ClientRoute route={{ ...route, componentLoader: () => pending }} />,
    );
    rerender(
      <ClientRoute
        route={{ ...route, componentLoader: async () => healthyModule }}
      />,
    );
    expect(
      await screen.findByText('Recovered page', {}, ROUTE_LOAD_TIMEOUT),
    ).toBeVisible();

    await act(async () => {
      rejectLoad(new Error('Stale failure'));
      await pending.catch(() => undefined);
    });
    expect(screen.getByText('Recovered page')).toBeVisible();
    expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
  });
});

it('offers a workbench exit without exposing route identifiers when denied', () => {
  access.can = false;
  const loader = vi.fn();
  render(
    <MemoryRouter>
      <ClientRoute
        route={{
          ...route,
          name: 'oa-sensitive-internal',
          authz: {
            resource: { type: 'composite', id: 'oa.private' },
            action: 'view',
          },
          componentLoader: loader,
        }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('Access denied')).toBeVisible();
  expect(screen.queryByText(/oa-sensitive-internal/)).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Back to workbench' }),
  ).toHaveAttribute('href', '/');
  expect(loader).not.toHaveBeenCalled();
  access.can = true;
});

it.each(requestActionDefinitions)(
  'does not replay the loading drawer entrance for $to',
  async ({ to }) => {
    let finish!: (module: AppClientRouteComponentModule) => void;
    const pending = new Promise<AppClientRouteComponentModule>((resolve) => {
      finish = resolve;
    });
    render(
      <MemoryRouter>
        <ClientRoute
          route={{ ...route, path: `/${to}`, componentLoader: () => pending }}
        />
      </MemoryRouter>,
    );
    const loading = screen.getByRole('dialog');
    expect(loading).not.toHaveClass('data-open:animate-none');
    await act(async () => {
      finish({
        default: () => (
          <RouteDrawer title='Application form'>
            <input aria-label='Reason' />
          </RouteDrawer>
        ),
      });
    });
    const form = screen.getByRole('dialog', { name: 'Application form' });
    expect(form).toHaveClass('data-open:animate-none');
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'data-open:animate-none',
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Reason' })).toBeVisible();
  },
);
it('keeps ordinary and nested overlay entrance animations', async () => {
  render(
    <MemoryRouter>
      <ClientRoute
        route={{
          ...route,
          componentLoader: async () => ({
            default: () => (
              <RouteDrawer title='Parent'>
                <RouteDrawer title='Nested'>Details</RouteDrawer>
              </RouteDrawer>
            ),
          }),
        }}
      />
    </MemoryRouter>,
  );
  const nested = await screen.findByRole('dialog', { name: 'Nested' });
  expect(nested).not.toHaveClass('data-open:animate-none');
  for (const panel of document.querySelectorAll(
    '[data-slot="route-overlay-content"]',
  ))
    expect(panel).not.toHaveClass('data-open:animate-none');
});
it('does not suppress a nested panel after a request drawer handoff', async () => {
  render(
    <MemoryRouter>
      <ClientRoute
        route={{
          ...route,
          path: '/newLeave',
          componentLoader: async () => ({
            default: () => (
              <RouteDrawer title='Application'>
                <RouteDrawer title='Nested'>Details</RouteDrawer>
              </RouteDrawer>
            ),
          }),
        }}
      />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('dialog', { name: 'Nested' })).not.toHaveClass(
    'data-open:animate-none',
  );
  expect(
    document.querySelector('[data-slot="route-overlay-content"]'),
  ).toHaveClass('data-open:animate-none');
});

it('keeps redirected detail loading feedback in a drawer without replaying its entrance', async () => {
  let finish!: (module: AppClientRouteComponentModule) => void;
  const pending = new Promise<AppClientRouteComponentModule>((resolve) => {
    finish = resolve;
  });
  render(
    <MemoryRouter>
      <RouteOverlayHandoffContext.Provider value>
        <ClientRoute route={{ ...route, componentLoader: () => pending }} />
      </RouteOverlayHandoffContext.Provider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('dialog')).toHaveClass('data-open:animate-none');
  await act(async () => {
    finish({
      default: () => <RouteDrawer title='Resolved detail'>Details</RouteDrawer>,
    });
  });
  expect(screen.getByRole('dialog', { name: 'Resolved detail' })).toHaveClass(
    'data-open:animate-none',
  );
});

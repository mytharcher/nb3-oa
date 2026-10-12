import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDepartureResource } from '../../../client/pages/departure-requests/use-resource.js';
const { api, viewer } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  viewer: { id: 'first' },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: viewer.id } } }),
}));
function Probe() {
  const state = useDepartureResource<{ name: string }>('departureRequests/r1');
  return <div>{state.data?.name ?? 'Loading current viewer'}</div>;
}
afterEach(cleanup);
it('clears the old viewer synchronously and ignores delayed responses from that viewer', async () => {
  let resolveOld: (value: { data: { name: string } }) => void = () => {};
  let resolveNew: (value: { data: { name: string } }) => void = () => {};
  api.request
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNew = resolve;
        }),
    );
  viewer.id = 'first';
  const page = render(<Probe />);
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  viewer.id = 'second';
  page.rerender(<Probe />);
  expect(screen.queryByText('First viewer record')).toBeNull();
  expect(screen.getByText('Loading current viewer')).toBeInTheDocument();
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  resolveOld({ data: { name: 'First viewer record' } });
  await Promise.resolve();
  expect(screen.queryByText('First viewer record')).toBeNull();
  resolveNew({ data: { name: 'Second viewer record' } });
  await screen.findByText('Second viewer record');
  expect(api.request.mock.calls[0][0].query).toEqual({});
  expect(api.request.mock.calls[0][0].signal.aborted).toBe(true);
});

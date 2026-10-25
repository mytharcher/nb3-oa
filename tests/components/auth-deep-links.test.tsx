import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import {
  AppGuestAuthentication,
  AppRequiredAuthentication,
} from '../../client/routing/app-authentication.js';
const auth = vi.hoisted(() => ({
  session: null as object | null,
  isPending: false,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => auth,
  RequiredAuthentication: ({ children }: { children: ReactNode }) =>
    auth.isPending ? null : children,
  GuestAuthentication: ({ children }: { children: ReactNode }) =>
    auth.isPending ? null : children,
}));
afterEach(cleanup);
function Location() {
  const location = useLocation();
  return <output>{location.pathname + location.search}</output>;
}
it('preserves a protected document path for password and SSO login', async () => {
  auth.session = null;
  render(
    <MemoryRouter initialEntries={['/approvals/mine/leave/123?tab=history']}>
      <Routes>
        <Route path='/login' element={<Location />} />
        <Route
          path='*'
          element={
            <AppRequiredAuthentication>
              <p>Private document</p>
            </AppRequiredAuthentication>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    '/login?redirect=%2Fapprovals%2Fmine%2Fleave%2F123%3Ftab%3Dhistory',
  );
  expect(screen.queryByText('Private document')).not.toBeInTheDocument();
});
it.each(['/taskCenter', '/%2Fevil.example', '/one/../login'])(
  'sanitizes signed-in return %s',
  async (redirect) => {
    auth.session = { user: { id: 'one' } };
    render(
      <MemoryRouter
        initialEntries={['/login?redirect=' + encodeURIComponent(redirect)]}
      >
        <Routes>
          <Route
            path='/login'
            element={
              <AppGuestAuthentication>
                <p>Login</p>
              </AppGuestAuthentication>
            }
          />
          <Route path='*' element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      redirect === '/taskCenter' ? '/taskCenter' : '/',
    );
  },
);

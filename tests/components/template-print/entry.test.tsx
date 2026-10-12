import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import { PrintEntry } from '../../../client/pages/template-print/entry.js';
const grants = vi.hoisted(() => ({ use: true, print: true, pending: false }));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ action }: { action: string }) => ({
    can: action === 'use' ? grants.use : grants.print,
    isPending: grants.pending,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
afterEach(cleanup);
function show(readable = true) {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter
        initialEntries={['/approvals/mine/payment/id?search=preserved']}
      >
        <Routes>
          <Route
            path='/approvals/mine/payment/:id'
            element={<PrintEntry source='payment' readable={readable} />}
          />
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
it('links the authorized print child while preserving the originating query', () => {
  grants.use = grants.print = true;
  grants.pending = false;
  show();
  expect(screen.getByRole('button')).toHaveAttribute(
    'href',
    '/approvals/mine/payment/id/print?search=preserved',
  );
});
it('hides entry for unreadable detail, denied source or unresolved grant', () => {
  grants.use = grants.print = true;
  grants.pending = false;
  show(false);
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  grants.print = false;
  show();
  expect(screen.queryByRole('button')).toBeNull();
  cleanup();
  grants.print = true;
  grants.pending = true;
  show();
  expect(screen.queryByRole('button')).toBeNull();
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import {
  FavoriteRequestActions,
  RequestActions,
} from '../../client/components/request-actions.js';
import { requestActionDefinitions } from '../../client/components/request-action-definitions.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', () => ({ useApiClient: () => api }));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'catalog-user' } } }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const available = Object.fromEntries(
  requestActionDefinitions.map(({ key }) => [key, true]),
);
function open(favorites = false) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        {favorites ? (
          <FavoriteRequestActions available={available} />
        ) : (
          <RequestActions available={available} />
        )}
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  api.request
    .mockReset()
    .mockResolvedValue({ data: { favorites: ['leave'], recent: [] } });
});
it('groups searchable employee actions and excludes derived and functional requests even with all permissions', async () => {
  open();
  expect(
    screen.queryByRole('button', {
      name: enUS.approvalCenter.kinds.cancellation,
    }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', {
      name: enUS.approvalCenter.kinds.travelCancellation,
    }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', {
      name: enUS.approvalCenter.kinds.budgetAdjustment,
    }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: enUS.recruitment.title }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', {
      name: enUS.approvalCenter.kinds.expensePlan,
    }),
  ).toBeNull();
  expect(
    within(
      screen.getByRole('region', {
        name: enUS.workbench.catalogGroups.attendance,
      }),
    ).getByRole('button', { name: enUS.approvalCenter.kinds.leave }),
  ).toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox'), 'loan');
  expect(
    screen.getByRole('button', { name: enUS.approvalCenter.kinds.loan }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: enUS.approvalCenter.kinds.leave }),
  ).toBeNull();
});
it('filters legacy values and clears browser storage only after migration succeeds', async () => {
  const key = 'nb3-oa:request-favorites:catalog-user';
  localStorage.setItem(
    key,
    JSON.stringify(['loan', 'cancellation', 'budget', 'loan']),
  );
  api.request.mockRejectedValueOnce(new Error('offline'));
  open(true);
  await screen.findByRole('alert');
  expect(localStorage.getItem(key)).not.toBeNull();
  await userEvent.click(
    screen.getByRole('button', { name: enUS.workbench.refresh }),
  );
  await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'requestPreferences/migrate',
      json: { favorites: ['loan'] },
    }),
  );
});
it('does not apply failed favorites saves and keeps navigation available', async () => {
  open(true);
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  await userEvent.click(
    screen.getByRole('button', { name: enUS.workbench.allRequests }),
  );
  const dialog = within(screen.getByRole('dialog'));
  const star = dialog.getByRole('button', {
    name: `Favorite: ${enUS.approvalCenter.kinds.leave}`,
  });
  await waitFor(() => expect(star).toBeEnabled());
  api.request.mockRejectedValueOnce(new Error('offline'));
  await userEvent.click(star);
  await screen.findByText(enUS.workbench.saveFailed);
  expect(star).toHaveAttribute('aria-pressed', 'true');
  expect(
    dialog.getByRole('button', { name: enUS.approvalCenter.kinds.leave }),
  ).toHaveAttribute('href', '/newLeave');
});

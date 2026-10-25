import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import LoginPage from '../../client/pages/auth/login.js';
import { useEnterpriseIdentity } from '../../client/hooks/use-enterprise-identity.js';
const state = vi.hoisted(() => ({
  enabled: false,
  social: vi.fn(),
  link: vi.fn(),
}));
vi.mock('@nocobase/app-client', () => ({
  resolveAppUrl: (path: string) => '/main' + path,
  useClientApplication: () => ({
    config: {
      public: {
        get: (key: string) =>
          ({
            'enterpriseIdentity.enabled': state.enabled,
            'enterpriseIdentity.providerId': 'enterprise-test',
            'enterpriseIdentity.label': 'Company account',
          })[key],
      },
    },
  }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useSignUpAvailable: () => false,
  useAuthentication: () => ({
    client: { signIn: { social: state.social }, linkSocial: state.link },
  }),
}));
vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => ({ submit: vi.fn(), isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
beforeEach(() => {
  state.enabled = false;
  state.social.mockReset().mockResolvedValue({});
  state.link.mockReset().mockResolvedValue({});
});
afterEach(cleanup);
function mount(path = '/login', element = <LoginPage />) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </TestI18nProvider>,
  );
}
it('hides unconfigured SSO and retains password login', () => {
  mount();
  expect(
    screen.queryByRole('button', { name: /Company account/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Password', { exact: true })).toBeVisible();
});
it('starts social login with an application deep link and exposes failure', async () => {
  state.enabled = true;
  state.social.mockResolvedValue({ error: { message: 'internal detail' } });
  mount('/login?redirect=%2Fapprovals%2Fmine%2Fleave%2F123');
  await userEvent.click(
    screen.getByRole('button', { name: /Company account/ }),
  );
  expect(state.social).toHaveBeenCalledWith({
    provider: 'enterprise-test',
    callbackURL: '/main/approvals/mine/leave/123',
    errorCallbackURL:
      '/main/login?ssoError=1&redirect=%2Fapprovals%2Fmine%2Fleave%2F123',
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to complete enterprise',
  );
  expect(screen.queryByText('internal detail')).not.toBeInTheDocument();
});
it('uses authenticated linking and prevents concurrent duplicate starts', async () => {
  state.enabled = true;
  let finish: (value: object) => void;
  state.link.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  function Action() {
    const enterprise = useEnterpriseIdentity();
    return (
      <button
        onClick={() => {
          void enterprise.start(true);
          void enterprise.start(true);
        }}
      >
        Link
      </button>
    );
  }
  mount('/personal-archive', <Action />);
  await userEvent.click(screen.getByRole('button', { name: 'Link' }));
  expect(state.link).toHaveBeenCalledTimes(1);
  expect(state.link).toHaveBeenCalledWith({
    provider: 'enterprise-test',
    callbackURL: '/main/personal-archive',
    errorCallbackURL: '/main/?ssoError=1',
  });
  finish!({});
  await waitFor(() => expect(state.social).not.toHaveBeenCalled());
});

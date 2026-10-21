import { AuthorizationFormError } from '../../client/pages/administration/authorization/components/validation-error.js';
import { render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import authorization from '../../client/locales/administration/authorization/en-US.js';
import {
  errorMessage,
  ErrorBox,
} from '../../client/pages/administration/authorization/components/feedback.js';
import { useAuthorizationTranslation } from '../../client/pages/administration/authorization/i18n.js';
import { AuthorizationPageState } from '../../client/pages/administration/authorization/pages/page-support.js';
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh: vi.fn() }),
}));
const ns = '@nocobase/app-plugin-authorization';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: authorization },
});
function Feedback({ error }: { error: unknown }) {
  const t = useAuthorizationTranslation();
  return <ErrorBox value={errorMessage(t, error)} />;
}
it('keeps unexpected transport text private while translating explicit form-validation errors', () => {
  const { rerender } = render(
    <TestI18nProvider runtime={runtime}>
      <Feedback error={new Error('private service detail')} />
    </TestI18nProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    authorization.errors.requestFailed,
  );
  expect(screen.queryByText('private service detail')).toBeNull();
  rerender(
    <TestI18nProvider runtime={runtime}>
      <Feedback error={new AuthorizationFormError('errors.completeRule')} />
    </TestI18nProvider>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    authorization.errors.completeRule,
  );
});
it.each([403, 404, 500])(
  'offers retry only for a temporary options failure with status %s',
  (status) => {
    render(
      <TestI18nProvider runtime={runtime}>
        <AuthorizationPageState
          error='Translated load failure'
          status={status}
          forbidden={status === 403}
          reload={vi.fn()}
        />
      </TestI18nProvider>,
    );
    expect(
      screen.queryByRole('button', { name: authorization.common.retry }) !==
        null,
    ).toBe(status === 500);
  },
);
it('offers signing in again for an expired session', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <AuthorizationPageState
        error='Translated load failure'
        status={401}
        reload={vi.fn()}
      />
    </TestI18nProvider>,
  );
  expect(
    within(screen.getByRole('alert')).getByRole('button', {
      name: enUS.actions.signInAgain,
    }),
  ).toBeInTheDocument();
});

import { useSignUpAvailable } from '@nocobase/app-plugin-authentication/client';
import { usePasswordLogin } from '@nocobase/app-plugin-authentication/client/actions';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { PasswordLoginForm } from '#extensions/nocobase-auth-forms/password-login-form';
import { AuthMethods } from '#extensions/nocobase-auth-methods/auth-methods';

import { AuthPage } from './shared.js';
import { useEnterpriseIdentity } from '#hooks/use-enterprise-identity';
import { Alert, AlertDescription } from '#components/ui/alert';

export default function LoginPage(): ReactElement {
  const { t } = useTranslation();
  const login = usePasswordLogin();
  const enterprise = useEnterpriseIdentity();
  // The sign-up link follows the server: it is hidden while `auth.emailAndPassword` turns sign-up off.
  const signUpAvailable = useSignUpAvailable();

  return (
    <AuthPage
      description={t('auth.loginDescription')}
      title={t('auth.welcome')}
    >
      {enterprise.error ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('enterpriseIdentity.failed')}</AlertDescription>
        </Alert>
      ) : null}
      {/* Add another sign-in method to `methods`, or SSO buttons as `providers`; the guest route redirects once
          the session exists. */}
      <AuthMethods
        providers={
          enterprise.enabled
            ? [
                {
                  id: enterprise.providerId,
                  label: enterprise.label,
                  disabled: enterprise.isPending,
                  onClick: () => {
                    void enterprise.start();
                  },
                },
              ]
            : []
        }
        labels={{
          continueWith: t('auth.continueWith'),
          methods: t('auth.methods'),
          separator: t('auth.or'),
        }}
        methods={[
          {
            content: (
              <PasswordLoginForm
                className='max-sm:[&_[data-slot=input]]:h-11 max-sm:[&_[data-slot=input-group]]:h-11 max-sm:[&_[data-slot=input-group-control]]:h-full'
                error={login.error?.message}
                footer={
                  signUpAvailable ? (
                    <>
                      {t('auth.noAccount')}{' '}
                      <Link to='/register'>{t('auth.signUp')}</Link>
                    </>
                  ) : undefined
                }
                forgotPasswordLink={
                  <Link to='/forgot-password'>{t('auth.forgotLink')}</Link>
                }
                labels={{
                  hidePassword: t('auth.hidePassword'),
                  identifier: t('auth.identifier'),
                  password: t('auth.password'),
                  showPassword: t('auth.showPassword'),
                  submit: t('auth.signIn'),
                  submitting: t('auth.signingIn'),
                }}
                onSubmit={login.submit}
                submitting={login.isPending}
              />
            ),
            id: 'password',
            label: t('auth.password'),
          },
        ]}
      />
    </AuthPage>
  );
}

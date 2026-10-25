import { defineAppConfig } from '@nocobase/app-server/config';
import { enterpriseOidcOptions } from './enterprise-oidc-options.js';

/** Only display metadata is public; the authentication provider owns credentials. */
export default defineAppConfig({
  defaults: () => {
    const provider = enterpriseOidcOptions();
    return {
      enabled: !!provider,
      providerId: provider?.providerId ?? '',
      label: provider?.name ?? '',
    };
  },
  public: ['enabled', 'providerId', 'label'],
  validate: (_value, context) => {
    for (const field of ['enabled', 'providerId', 'label'])
      if (context.isUserProvided(field))
        context.error(
          field,
          'Derived from OA_OIDC_* environment variables; do not override this display metadata.',
        );
  },
});

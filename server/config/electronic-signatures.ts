import {
  defineAppConfig,
  envBoolean,
  envString,
} from '@nocobase/app-server/config';
import { SignatureGateway } from '../providers/electronic-signatures/gateway.js';
import type { SignatureConfig } from '../providers/electronic-signatures/service.js';
export default defineAppConfig<SignatureConfig>({
  defaults: { enabled: false, instanceId: '', baseUrl: '', token: '' },
  env: {
    OA_SIGNATURE_ENABLED: envBoolean('enabled', {
      description: 'Enable the enterprise electronic-signature gateway.',
    }),
    OA_SIGNATURE_INSTANCE_ID: envString('instanceId', {
      description:
        'Stable signature tenant identity; never rotate for retries.',
    }),
    OA_SIGNATURE_BASE_URL: envString('baseUrl', {
      description: 'HTTPS signature gateway base URL.',
    }),
    OA_SIGNATURE_TOKEN: envString('token', {
      description: 'Server-only signature gateway bearer secret.',
      secret: true,
    }),
  },
  validate: (config, context) => {
    if (!config.enabled) return;
    if (!/^[A-Za-z0-9_-]{1,64}$/u.test(config.instanceId))
      context.error('instanceId', 'A stable instance identity is required.');
    try {
      new SignatureGateway(config);
    } catch {
      context.error(
        'baseUrl',
        'A valid HTTPS gateway and secret are required.',
      );
    }
  },
});

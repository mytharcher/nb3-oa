import {
  defineAppConfig,
  envBoolean,
  envString,
} from '@nocobase/app-server/config';
import { FinanceGateway } from '../providers/finance-integration/gateway.js';

export interface FinanceIntegrationConfig {
  enabled: boolean;
  instanceId: string;
  baseUrl: string;
  token: string;
}
export default defineAppConfig<FinanceIntegrationConfig>({
  defaults: { enabled: false, instanceId: '', baseUrl: '', token: '' },
  env: {
    OA_FINANCE_ENABLED: envBoolean('enabled', {
      description: 'Enable the finance gateway integration.',
    }),
    OA_FINANCE_INSTANCE_ID: envString('instanceId', {
      required: false,
      description:
        'Stable OA identity at the finance gateway; never rotate for a retry.',
    }),
    OA_FINANCE_BASE_URL: envString('baseUrl', {
      required: false,
      description: 'HTTPS base URL of the enterprise finance gateway.',
    }),
    OA_FINANCE_TOKEN: envString('token', {
      required: false,
      description: 'Server-only bearer secret for the finance gateway.',
      secret: true,
    }),
  },
  validate: (config, context) => {
    if (!config.enabled) return;
    if (!/^[A-Za-z0-9_-]{1,64}$/u.test(config.instanceId))
      context.error(
        'instanceId',
        'Use a stable identifier containing letters, digits, underscores or hyphens.',
      );
    try {
      new FinanceGateway(config);
    } catch {
      context.error(
        'baseUrl',
        'Enabled finance integration requires a valid HTTPS gateway and a bearer token.',
      );
    }
  },
});

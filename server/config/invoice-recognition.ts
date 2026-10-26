import {
  defineAppConfig,
  envBoolean,
  envString,
} from '@nocobase/app-server/config';
import { InvoiceGateway } from '../providers/invoice-recognition/gateway.js';

export interface InvoiceRecognitionConfig {
  enabled: boolean;
  instanceId: string;
  baseUrl: string;
  token: string;
}
export default defineAppConfig<InvoiceRecognitionConfig>({
  defaults: { enabled: false, instanceId: '', baseUrl: '', token: '' },
  env: {
    OA_INVOICE_ENABLED: envBoolean('enabled', {
      description: 'Enable the invoice gateway integration.',
    }),
    OA_INVOICE_INSTANCE_ID: envString('instanceId', {
      required: false,
      description:
        'Stable OA identity at the invoice gateway; never rotate for a retry.',
    }),
    OA_INVOICE_BASE_URL: envString('baseUrl', {
      required: false,
      description: 'HTTPS base URL of the enterprise invoice gateway.',
    }),
    OA_INVOICE_TOKEN: envString('token', {
      required: false,
      description: 'Server-only bearer secret for the invoice gateway.',
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
      new InvoiceGateway(config);
    } catch {
      context.error(
        'baseUrl',
        'Enabled invoice integration requires a valid HTTPS gateway and a bearer token.',
      );
    }
  },
});

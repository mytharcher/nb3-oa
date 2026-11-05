import type { AppConfigFactory } from '@nocobase/app-server/config';
import {
  defineDemoModeConfig,
  type DemoModeConfig,
} from '@nocobase/app-plugin-demo-mode/config';

const pluginConfig = defineDemoModeConfig();
const demoMode: AppConfigFactory<DemoModeConfig> = Object.assign(
  (...args: Parameters<typeof pluginConfig>) => pluginConfig(...args),
  {
    rules: {
      ...pluginConfig.rules!,
      env: {
        ...pluginConfig.rules!.env,
        // An empty allow-list is valid, including when demo mode is disabled.
        // Manifest inference otherwise treats the empty default array as missing.
        NOCOBASE_DEMO_WRITABLE_COLLECTIONS: {
          ...pluginConfig.rules!.env!.NOCOBASE_DEMO_WRITABLE_COLLECTIONS,
          required: false,
        },
      },
    },
  },
);

export default demoMode;

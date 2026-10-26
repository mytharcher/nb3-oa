import {
  defineAppConfig,
  envBoolean,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import type { DemoLocale } from '../providers/demo-data/contract.js';
import {
  joinBasePath,
  normalizeBasePath,
  resolveAppNameFromBasePath,
} from '@nocobase/app-server/support';

interface OaAppConfig extends AppIdentityConfig {
  sampleLocale?: DemoLocale;
}

const app: AppConfigFactory<OaAppConfig> = defineAppConfig({
  env: {
    APP_SAMPLE_LOCALE: envString('sampleLocale', {
      description:
        'OA sample content language: zh-CN or en-US. Defaults to i18n.defaultLocale; existing datasets retain their language.',
      required: false,
    }),
    OA_LEGACY_TIMESTAMP_TIME_ZONE: envString('legacyTimestampTimeZone', {
      description:
        'Verified historical writer IANA time zone for the one-time migration of existing OA timestamps to timezone-aware instants. Required only when converting populated legacy fields.',
      required: false,
    }),
    APP_PUBLIC_ORIGIN: envString('publicOrigin', {
      description:
        'The origin browsers reach the application at, such as https://apps.example.com, for callbacks and redirects.',
      required: false,
    }),
    APP_SAMPLE_DATA: envBoolean('sampleData', {
      description:
        'Load sample data on first installation (sample seeds and sampleDataToken registrations).',
      required: false,
    }),
  },
  validate: (config, context) => {
    if (
      config.sampleLocale !== undefined &&
      config.sampleLocale !== 'zh-CN' &&
      config.sampleLocale !== 'en-US'
    )
      context.error(
        'sampleLocale',
        'Use zh-CN or en-US for OA sample content.',
      );
  },
  defaults: (runtime) => {
    const { routing } = runtime;
    const publicBasePath = normalizeBasePath(routing.publicBasePath || '/main');
    return {
      name: routing.name || resolveAppNameFromBasePath(publicBasePath, 'main'),
      publicBasePath,
      internalBasePath: routing.internalBasePath,
      publicApiUrl: joinBasePath(publicBasePath, '/api'),
    };
  },
});

export default app;

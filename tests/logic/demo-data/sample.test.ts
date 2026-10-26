// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { AppConfig, defaultAppConfigs } from '@nocobase/app-server/config';
import appConfig from '../../../server/config/app.js';
import i18nConfig from '../../../server/config/i18n.js';
import {
  ensureOaSample,
  oaRoleCoverageSample,
  resolveOaSampleLocale,
} from '../../../server/samples/oa.js';
import type {
  DemoDataService,
  DemoState,
  DemoStatus,
} from '../../../server/providers/demo-data/contract.js';

async function sampleConfig(
  environment: Record<string, string> = {},
  sampleLocale?: string,
) {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: sampleLocale === undefined ? {} : { sampleLocale },
    i18n: { defaultLocale: 'en-US' },
  });
  config.defineSections(
    defaultAppConfigs({ app: appConfig, i18n: i18nConfig }).sections!,
  );
  await config.loadSectionEnvironment(environment);
  return config;
}

it.each(['zh-CN', 'en-US'] as const)(
  'selects %s sample content independently of the interface default',
  async (locale) => {
    const defaultLocale = locale === 'zh-CN' ? 'en-US' : 'zh-CN';
    const config = await sampleConfig({
      APP_SAMPLE_LOCALE: locale,
      APP_DEFAULT_LOCALE: defaultLocale,
    });
    expect(await config.validate()).toEqual([]);
    expect(resolveOaSampleLocale({ config })).toBe(locale);
    expect(config.get('i18n.defaultLocale')).toBe(defaultLocale);
  },
);

it.each(['zh-CN', 'en-US'] as const)(
  'uses the %s application default when sample language is omitted',
  async (locale) => {
    const config = await sampleConfig({ APP_DEFAULT_LOCALE: locale });
    expect(resolveOaSampleLocale({ config })).toBe(locale);
  },
);

it('reads the configured sample language and allows an environment override', async () => {
  const configured = await sampleConfig({}, 'zh-CN');
  expect(resolveOaSampleLocale({ config: configured })).toBe('zh-CN');
  const overridden = await sampleConfig(
    { APP_SAMPLE_LOCALE: 'en-US' },
    'zh-CN',
  );
  expect(resolveOaSampleLocale({ config: overridden })).toBe('en-US');
});

it('rejects unsupported sample languages instead of silently generating another language', async () => {
  const config = await sampleConfig({ APP_SAMPLE_LOCALE: 'fr-FR' });
  expect(await config.validate()).toEqual([
    expect.objectContaining({ path: 'app.sampleLocale', level: 'error' }),
  ]);
  expect(() => resolveOaSampleLocale({ config })).toThrow(
    'Invalid app.sampleLocale',
  );
});

function fixture(state: DemoState, result: DemoState = 'ready') {
  const status: DemoStatus = {
    state,
    version: 3,
    locale: 'en-US',
    timeZone: 'Asia/Singapore',
    completedSteps: 0,
    totalSteps: 0,
    moduleCoverage: [],
    safeFailures: [],
    accounts: [],
  };
  const service = {
    idle: vi.fn(async () => {}),
    status: vi.fn(async () => ({ ...status })),
    useSamplePasswords: vi.fn(async () => {
      status.version += 1;
    }),
    import: vi.fn(async () => {
      status.state = result;
      return { ...status, operationId: 'operation' };
    }),
  };
  return {
    service,
    run: () => ensureOaSample(service as unknown as DemoDataService, 'zh-CN'),
  };
}

it('adopts an existing ready dataset and normalizes its passwords without regenerating', async () => {
  const { service, run } = fixture('ready');
  await run();
  expect(service.useSamplePasswords).toHaveBeenCalledOnce();
  expect(service.import).not.toHaveBeenCalled();
});

it('retries the existing locale and uses the version after password migration', async () => {
  const { service, run } = fixture('importFailed');
  await run();
  expect(service.import).toHaveBeenCalledWith(
    expect.objectContaining({ locale: 'en-US', expectedVersion: 4 }),
    'sample:oa/demo-data',
  );
});

it('does not report a swallowed generation failure as a successful sample', async () => {
  const { run } = fixture('absent', 'importFailed');
  await expect(run()).rejects.toThrow('OA sample generation incomplete');
});

it.each(['importing', 'removing', 'removeFailed'] as const)(
  'does not replace a dataset in %s state',
  async (state) => {
    const { service, run } = fixture(state);
    await expect(run()).rejects.toThrow('busy or needs cleanup');
    expect(service.import).not.toHaveBeenCalled();
    expect(service.useSamplePasswords).not.toHaveBeenCalled();
  },
);

it('requires eight-character onboarding passwords even in a server-owned sample import', async () => {
  const { Create } =
    await import('../../../server/routes/onboarding/schemas.js');
  const { demoContext } =
    await import('../../../server/providers/demo-data/context.js');
  const password = Create.shape.account.shape.password;
  expect(password.safeParse('123456').success).toBe(false);
  expect(password.safeParse('ordinary-password').success).toBe(true);
  const scope = {
    id: 'demo-fixture',
    locale: 'en-US' as const,
    baseDate: '2026-10-21',
    users: new Set<string>(),
  };
  demoContext.run(scope, () =>
    expect(password.safeParse('123456').success).toBe(false),
  );
  demoContext.run({ ...scope, operationToken: 'server-owned-import' }, () => {
    expect(password.safeParse('123456').success).toBe(false);
    expect(password.safeParse('12345678').success).toBe(true);
    expect(password.safeParse('abcdef').success).toBe(false);
  });
});

it('retains eight characters for ordinary and sample installation', async () => {
  const { default: authConfig } =
    await import('../../../server/config/auth.js');
  expect(
    authConfig({ env: {} } as never).emailAndPassword?.minPasswordLength,
  ).toBe(8);
  expect(
    authConfig({ env: { APP_SAMPLE_DATA: 'false' } } as never).emailAndPassword
      ?.minPasswordLength,
  ).toBe(8);
  expect(
    authConfig({ env: { APP_SAMPLE_DATA: 'true' } } as never).emailAndPassword
      ?.minPasswordLength,
  ).toBe(8);
});

it('retries role supplementation without replaying the existing business stories', async () => {
  const service = {
    idle: vi.fn(async () => {}),
    status: vi.fn(async () => ({
      state: 'importFailed',
      datasetId: 'existing',
    })),
    useSamplePasswords: vi.fn(async () => {}),
    import: vi.fn(),
    enrichRoleCoverage: vi.fn(async () => {
      throw new Error('supplement failed');
    }),
  };
  const app = {
    container: { resolve: () => service },
    config: { get: () => 'zh-CN' },
  };
  const sample = oaRoleCoverageSample(app as never);
  expect(sample.name).toBe('oa/role-coverage-v1');
  await expect(sample.run()).rejects.toThrow('supplement failed');
  expect(service.useSamplePasswords).toHaveBeenCalledOnce();
  expect(service.enrichRoleCoverage).toHaveBeenCalledOnce();
  expect(service.import).not.toHaveBeenCalled();
});

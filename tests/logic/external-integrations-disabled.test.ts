// @vitest-environment node
import { expect, it, vi } from 'vitest';
import appRuntime from '../../server/runtime.js';
import financeRoutes from '../../server/routes/finance-integration/index.js';
import invoiceRoutes from '../../server/routes/invoice-recognition/index.js';
import signatureRoutes from '../../server/routes/electronic-signatures/index.js';
import wecomRoutes from '../../server/routes/wecom-attendance/index.js';
import { Create, Fields } from '../../server/routes/seals/schemas.js';

it('excludes all external integration endpoints from the main application', () => {
  for (const contribution of [
    ...financeRoutes,
    ...invoiceRoutes,
    ...signatureRoutes,
    ...wecomRoutes,
  ]) {
    expect(appRuntime.routes).not.toContain(contribution);
  }
});

it('accepts physical seal requests and rejects the withdrawn electronic channel', () => {
  const request = {
    contractId: null,
    fileIds: [],
    sealType: 'company',
    copies: 1,
    external: false,
    returnDueAt: null,
    purpose: 'Contract',
    contact: '',
    requestKey: 'test',
  };
  expect(Create.safeParse(request).success).toBe(true);
  expect(Fields.executionMode.safeParse('electronic').success).toBe(true);
  expect(
    Create.safeParse({ ...request, copies: 0, executionMode: 'electronic' })
      .success,
  ).toBe(false);
});

it('keeps persisted WeCom schedules harmless and registers no new schedule or sync service', async () => {
  const { default: Provider } =
    await import('../../server/providers/wecom-attendance/index.js');
  const { schedulerServiceToken } =
    await import('@nocobase/app-plugin-scheduler/server/tokens');
  const { authorizationToken } =
    await import('@nocobase/app-plugin-authorization/server');
  const { calendarServiceToken } =
    await import('../../server/providers/platform/index.js');
  const { i18nToken } = await import('@nocobase/app-server/i18n');
  let target: { start: (...args: unknown[]) => Promise<unknown> } | undefined;
  const singleton = vi.fn(),
    defineSchedule = vi.fn();
  const dependencies = new Map<unknown, unknown>([
    [
      authorizationToken,
      { settings: { add: vi.fn() }, ui: { place: vi.fn() } },
    ],
    [
      schedulerServiceToken,
      {
        registerTarget: (value: typeof target) => {
          target = value;
        },
        defineSchedule,
      },
    ],
    [calendarServiceToken, {}],
    [
      i18nToken,
      {
        getDefaultLocale: () => 'en-US',
        ensureLocaleLoaded: async () => {},
        getFixedT: () => (key: string) => key,
      },
    ],
  ]);
  const context = {
    app: {
      container: {
        singleton,
        resolve: (token: unknown) => {
          if (!dependencies.has(token))
            throw new Error('Withdrawn service was accessed');
          return dependencies.get(token);
        },
      },
    },
  } as unknown as InstanceType<typeof Provider>;
  Provider.prototype.register.call(context);
  await Provider.prototype.boot.call(context);
  expect(singleton).not.toHaveBeenCalled();
  expect(defineSchedule).not.toHaveBeenCalled();
  expect(await target!.start({}, {})).toMatchObject({
    state: 'completed',
    outcome: 'succeeded',
    result: { skipped: true, committedRecords: 0 },
  });
});

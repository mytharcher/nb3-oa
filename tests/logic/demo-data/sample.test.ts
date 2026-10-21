// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { ensureOaSample } from '../../../server/samples/oa.js';
import type {
  DemoDataService,
  DemoState,
  DemoStatus,
} from '../../../server/providers/demo-data/contract.js';

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

it('allows the six-character onboarding password only in a server-owned sample import', async () => {
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
    expect(password.safeParse('123456').success).toBe(true);
    expect(password.safeParse('abcdef').success).toBe(false);
  });
});

it('retains eight characters by default and opts in only for sample installation', async () => {
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
  ).toBe(6);
});

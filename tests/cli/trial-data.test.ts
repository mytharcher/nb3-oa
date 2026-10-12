// @vitest-environment node
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import TrialData from '../../cli/commands/trial-data.ts';

it('previews trial coverage without creating an application or opening the database', async () => {
  const Bound = bindAppCommand(TrialData, {
    rootDir: process.cwd(),
    id: 'app:trial-data',
    loadRuntime: async () => {
      throw new Error('Preview must not load the runtime.');
    },
    createApp: () => {
      throw new Error('Preview must not create the application.');
    },
  });
  const run = await runAppCommand(Bound, ['--dry-run', '--json']);
  expect(run.error).toBeUndefined();
  expect(run.exitCode ?? 0).toBe(0);
  expect(run.json()).toMatchObject({
    ok: true,
    status: 'success-noop',
    result: { dataset: 'oa-trial-v1' },
  });
  expect(run.stdout).not.toContain('password');
});

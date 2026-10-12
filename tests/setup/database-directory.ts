import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { TestProject } from 'vitest/node';

/** Own one directory per runner; stale-PID cleanup must never see another runner's live SQLite files. */
export async function isolateTestDatabaseDirectory(
  environment: Partial<NodeJS.ProcessEnv>,
): Promise<(() => Promise<void>) | undefined> {
  const dialect =
    environment.NOCOBASE_TEST_DB_DIALECT ??
    process.env.NOCOBASE_TEST_DB_DIALECT ??
    'postgres';
  if (dialect !== 'sqlite') return;

  const configuredDirectory = environment.NOCOBASE_TEST_DB_SQLITE_DIRECTORY;
  const parent =
    configuredDirectory ??
    process.env.NOCOBASE_TEST_DB_SQLITE_DIRECTORY ??
    tmpdir();
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, 'oa-vitest-databases-'));
  environment.NOCOBASE_TEST_DB_SQLITE_DIRECTORY = directory;

  return async () => {
    // Vitest invokes global teardown after workers and their database fixtures have closed.
    await rm(directory, { recursive: true, force: true });
    if (configuredDirectory === undefined)
      delete environment.NOCOBASE_TEST_DB_SQLITE_DIRECTORY;
    else environment.NOCOBASE_TEST_DB_SQLITE_DIRECTORY = configuredDirectory;
  };
}

export default async function setup(project: TestProject) {
  project.config.env ??= {};
  return isolateTestDatabaseDirectory(project.config.env);
}

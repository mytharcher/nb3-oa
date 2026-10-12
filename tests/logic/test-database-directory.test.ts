// @vitest-environment node
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

import { isolateTestDatabaseDirectory } from '../setup/database-directory';

it('isolates simultaneous runs and removes only its owned directory', async () => {
  const parent = await mkdtemp(path.join(tmpdir(), 'oa-directory-acceptance-'));
  const first: NodeJS.ProcessEnv = {
    NOCOBASE_TEST_DB_DIALECT: 'sqlite',
    NOCOBASE_TEST_DB_SQLITE_DIRECTORY: parent,
  };
  const second = { ...first };
  let closeFirst: (() => Promise<void>) | undefined;
  let closeSecond: (() => Promise<void>) | undefined;
  try {
    [closeFirst, closeSecond] = await Promise.all([
      isolateTestDatabaseDirectory(first),
      isolateTestDatabaseDirectory(second),
    ]);
    expect(first.NOCOBASE_TEST_DB_SQLITE_DIRECTORY).not.toBe(
      second.NOCOBASE_TEST_DB_SQLITE_DIRECTORY,
    );
    const owned = first.NOCOBASE_TEST_DB_SQLITE_DIRECTORY!;
    const sibling = path.join(
      second.NOCOBASE_TEST_DB_SQLITE_DIRECTORY!,
      'live-database',
    );
    const retained = path.join(parent, 'caller-owned');
    await writeFile(sibling, 'live');
    await writeFile(retained, 'retained');
    await closeFirst!();
    await expect(readFile(owned)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(sibling, 'utf8')).toBe('live');
    expect(await readFile(retained, 'utf8')).toBe('retained');
    expect(first.NOCOBASE_TEST_DB_SQLITE_DIRECTORY).toBe(parent);
  } finally {
    await closeFirst?.();
    await closeSecond?.();
    await rm(parent, { recursive: true, force: true });
  }
});

it('leaves non-SQLite environments unchanged', async () => {
  const environment = { NOCOBASE_TEST_DB_DIALECT: 'postgres' };
  expect(await isolateTestDatabaseDirectory(environment)).toBeUndefined();
  expect(environment).toEqual({ NOCOBASE_TEST_DB_DIALECT: 'postgres' });
});

it('provisions real databases inside the runner directory and closes before cleanup', async () => {
  const database = await createTestDatabase();
  try {
    if (database.dialect === 'sqlite') {
      const directory = process.env.NOCOBASE_TEST_DB_SQLITE_DIRECTORY!;
      expect(path.basename(directory)).toMatch(/^oa-vitest-databases-/u);
      expect(
        (await readdir(directory)).some((name) => name.endsWith('.sqlite')),
      ).toBe(true);
    }
    expect(await database.connection.collections.list()).toBeDefined();
  } finally {
    await database.destroy();
  }
});

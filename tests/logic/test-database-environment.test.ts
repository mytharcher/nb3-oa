// @vitest-environment node
import { expect, it } from 'vitest';
import { postgresTestEnvironment } from '../setup/database-environment.js';

it('aligns the app and provisioner dialects and maps the configured PG connection', () => {
  expect(
    postgresTestEnvironment({
      DB_DIALECT: 'postgres',
      DB_HOST: 'db.internal',
      DB_PORT: '5432',
      DB_DATABASE: 'oa',
      DB_USERNAME: 'oa_test',
      DB_PASSWORD: 'test-secret',
    }),
  ).toEqual({
    DB_HOST: 'db.internal',
    DB_PORT: '5432',
    DB_DATABASE: 'oa',
    DB_USERNAME: 'oa_test',
    DB_PASSWORD: 'test-secret',
    DB_DIALECT: 'postgres',
    NOCOBASE_TEST_DB_DIALECT: 'postgres',
    POSTGRES_HOST: 'db.internal',
    POSTGRES_PORT: '5432',
    POSTGRES_DATABASE: 'oa',
    POSTGRES_USER: 'oa_test',
    POSTGRES_PASSWORD: 'test-secret',
  });
});
it('preserves explicit test-server settings and ignores unrelated application secrets', () => {
  const environment = postgresTestEnvironment({
    POSTGRES_DATABASE: 'isolated_tests',
    PGUSER: 'tester',
    DB_DATABASE: 'business',
    DB_USERNAME: 'app',
    SECRETS_KEYS: 'private',
  });
  expect(environment.POSTGRES_DATABASE).toBe('isolated_tests');
  expect(environment.POSTGRES_USER).toBe('tester');
  expect(environment.DB_DATABASE).toBe('isolated_tests');
  expect(environment.DB_USERNAME).toBe('tester');
  expect(environment).not.toHaveProperty('SECRETS_KEYS');
});

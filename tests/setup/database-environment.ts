/** PG test provisioners own temporary schemas; DB_* and POSTGRES_* must select the same server. */
export function postgresTestEnvironment(
  configured: Partial<NodeJS.ProcessEnv>,
): Record<string, string> {
  const environment: Record<string, string> = {
    NOCOBASE_TEST_DB_DIALECT: 'postgres',
    DB_DIALECT: 'postgres',
  };
  for (const [target, source, pg] of [
    ['POSTGRES_HOST', 'DB_HOST', 'PGHOST'],
    ['POSTGRES_PORT', 'DB_PORT', 'PGPORT'],
    ['POSTGRES_DATABASE', 'DB_DATABASE', 'PGDATABASE'],
    ['POSTGRES_USER', 'DB_USERNAME', 'PGUSER'],
    ['POSTGRES_PASSWORD', 'DB_PASSWORD', 'PGPASSWORD'],
  ] as const) {
    const value = configured[target] ?? configured[pg] ?? configured[source];
    if (value !== undefined) {
      environment[target] = value;
      environment[source] = value;
    }
  }
  return environment;
}

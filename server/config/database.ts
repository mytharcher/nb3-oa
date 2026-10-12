import {
  connectionEnvironment,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';

/** Installed official drivers are loaded synchronously when first needed. */
export default defineAppDatabaseConfig(
  () => ({
    default: 'main',
    connections: {
      main: {
        dialect: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        database: 'nb3_oa',
        username: 'postgres',
        schemaManagement: 'managed',
        debug: false,
      },
    },
  }),
  // DB_DIALECT, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_SSL and DB_FILENAME set the main
  // connection. Another connection declares its own, such as connectionEnvironment('analytics', 'DB_ANALYTICS').
  { env: connectionEnvironment('main') },
);

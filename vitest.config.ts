import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { postgresTestEnvironment } from './tests/setup/database-environment.js';

import { createReactVitestConfig } from '@nocobase/dev-config/vitest/react';

const root = fileURLToPath(new URL('.', import.meta.url));

export default createReactVitestConfig({
  test: {
    root,
    // PG application fixtures each own connection pools. Unbounded file workers
    // can exhaust the shared development server's max_connections.
    maxWorkers: 2,
    env: postgresTestEnvironment({
      ...loadEnv('development', root, ''),
      ...process.env,
    }),
    server: {
      deps: {
        // Transform the public Client surfaces so vi.mock applies, without duplicating the Server packages' identity tokens.
        inline: [
          // NavigationGuardProvider must read the same router contexts as the page under test.
          /@nocobase\/app-client\/dist\//u,
          // Client test hosts must share that application context and its service tokens.
          /@nocobase\/app-testing\/dist\/src\/client\//u,
          // Client plugins consume the shared application/router contexts; keep their public Client surfaces
          // in the same module graph while Server packages retain their original identity tokens.
          /@nocobase\/app-plugin-[^/]+\/(?:dist\/)?client\//u,
        ],
      },
    },
    // A glob rather than a list of filenames. The list had to be edited by hand for every test added or removed and
    // silently drifted: it named a file that no longer existed while several real test files were absent from it, so
    // those tests were never run at all.
    include: ['tests/**/*.test.{ts,tsx}'],
    // Playwright runs tests/playwright/ against a built application; its files are named *.test.ts too.
    exclude: ['tests/playwright/**'],
    setupFiles: ['./tests/setup/client-config.ts'],
    // Public db-testing cleanup uses PID liveness; separate runner directories bound cleanup to this run.
    globalSetup: ['./tests/setup/database-directory.ts'],
    // Keep the command usable if an application intentionally removes all scaffold tests before adding its own.
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html'],
    },
  },
});

import { mergeConfig } from 'vitest/config';
import base from '../../../vitest.config.js';

// Supplement PostgreSQL with the affected dialect, in a disposable directory.
const config = mergeConfig(base, {
  test: { env: { NOCOBASE_TEST_DB_DIALECT: 'sqlite' } },
});
export default {
  ...config,
  test: {
    ...config.test,
    // Vite's mergeConfig concatenates arrays; replace the base glob explicitly.
    include: ['tests/logic/approval-ai/conversation-upgrade.test.ts'],
  },
};

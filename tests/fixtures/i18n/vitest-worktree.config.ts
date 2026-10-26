import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../../../vitest.config.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));

// A new worktree may reuse installed dependencies from the original checkout.
// Allow Vite to transform their test setup while preserving the normal test configuration.
export default {
  ...config,
  server: {
    ...config.server,
    fs: {
      allow: [
        root,
        path.dirname(realpathSync(path.join(root, 'node_modules'))),
      ],
    },
  },
};

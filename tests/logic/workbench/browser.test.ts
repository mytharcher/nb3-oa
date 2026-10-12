// @vitest-environment node
import { test } from 'vitest';
import { runWorkbenchBrowser } from '../../fixtures/workbench/browser-acceptance.js';
test.skipIf(process.env.OA_WORKBENCH_BROWSER_ACCEPTANCE !== '1')(
  'workbench real isolated browser acceptance',
  { timeout: 240000 },
  async () => {
    await runWorkbenchBrowser();
  },
);

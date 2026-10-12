// @vitest-environment node
import { test } from 'vitest';
import { startIsolatedBrowserApp } from '../../fixtures/browser/harness.js';
import { runAnnouncementBrowser } from '../../fixtures/announcements/browser-acceptance.js';
test.skipIf(process.env.OA_ISOLATED_BROWSER !== '1')(
  'announcement public-role browser flows on an isolated whole App',
  async () => {
    const app = await startIsolatedBrowserApp({
      name: 'announcements',
      apiPort: 14143,
      vitePort: 15143,
    });
    try {
      await runAnnouncementBrowser(
        app.testApp,
        (session, options) => app.pageFor(session, options),
        app.screenshotsDir,
        `${app.origin}${app.basePath}`,
      );
    } finally {
      await app.close();
    }
  },
  360000,
);

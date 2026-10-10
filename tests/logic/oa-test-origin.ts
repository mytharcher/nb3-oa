import { fileURLToPath } from 'node:url';

import { loadEnv } from 'vite';

/** Follow the configured public address without changing the development server or disabling CSRF. */
export const OA_TEST_ORIGIN =
  process.env.APP_PUBLIC_ORIGIN ??
  loadEnv(
    'development',
    fileURLToPath(new URL('../../', import.meta.url)),
    'APP_PUBLIC_ORIGIN',
  ).APP_PUBLIC_ORIGIN ??
  'http://127.0.0.1:13000';

/** Test applications run in process on temporary databases; this is not a listener or a network connection. */
export const OA_TEST_SERVER = { env: { APP_PUBLIC_ORIGIN: OA_TEST_ORIGIN } };

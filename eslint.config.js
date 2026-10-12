import { createApplicationConfig } from '@nocobase/dev-config/eslint';

export default [
  ...createApplicationConfig({
    tsconfigRootDir: import.meta.dirname,
    ignores: [
      '.extension-state/**',
      'client-old/**',
      'public/r/**',
      'storage/**',
    ],
  }),
  {
    files: ['client/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'randomUUID',
          message:
            'Use createRequestKey from #lib/request-key for intranet HTTP compatibility.',
        },
      ],
    },
  },
];

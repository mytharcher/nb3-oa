// @vitest-environment node

import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, it } from 'vitest';

const require = createRequire(import.meta.url);

it('pins the published approval dependency in dist', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'oa-registry-package-build-'));
  try {
    mkdirSync(path.join(root, 'dist/server'), { recursive: true });
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: ["."]\n');
    writeFileSync(
      path.join(root, '.npmrc'),
      '@nocobase:registry=https://pkg-v3.nocobase.com/\n//pkg-v3.nocobase.com/:_authToken=fixture-token\n',
    );
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'oa-build-fixture',
        dependencies: {
          '@nocobase/app-plugin-approval': '0.0.2-beta.0',
        },
      }),
    );
    const directory = path.join(
      root,
      'node_modules/@nocobase/app-plugin-approval',
    );
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-plugin-approval',
        version: '0.0.2-beta.0',
      }),
    );

    // Exercise the production manifest builder without installing fixture dependencies.
    const cliRoot = path.dirname(
      require.resolve('@nocobase/app-cli/package.json'),
    );
    const result = spawnSync(
      process.execPath,
      [
        path.join(
          cliRoot,
          'dist/tools/scripts/utils/build-server-dist-package.mjs',
        ),
      ],
      { env: { ...process.env, NOCOBASE_TOOL_ROOT: root }, encoding: 'utf8' },
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const manifest = JSON.parse(
      readFileSync(path.join(root, 'dist/package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> };
    expect(manifest.dependencies['@nocobase/app-plugin-approval']).toBe(
      '0.0.2-beta.0',
    );
    const registryConfig = readFileSync(path.join(root, 'dist/.npmrc'), 'utf8');
    expect(registryConfig).toContain(
      '@nocobase:registry=https://pkg-v3.nocobase.com/',
    );
    expect(registryConfig).not.toContain('fixture-token');
    expect(registryConfig).not.toContain('_authToken');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

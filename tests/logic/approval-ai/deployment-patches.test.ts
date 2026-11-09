// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

it('builds an independent deployment using released approval APIs without local patches', async () => {
  const cliRoot = path.dirname(
    createRequire(import.meta.url).resolve('@nocobase/app-cli/package.json'),
  );
  const yaml = createRequire(path.join(cliRoot, 'package.json'))('yaml') as {
    parse(text: string): { patchedDependencies?: unknown };
  };
  const workspace = yaml.parse(await readFile('pnpm-workspace.yaml', 'utf8'));
  expect(workspace.patchedDependencies).toBeUndefined();
  const assistant =
    await import('@nocobase/app-plugin-approval/server/assistant');
  expect(assistant.approvalSuggestionsToken).toBeDefined();
  expect(assistant.approvalSuggestionMaterialsToken).toBeDefined();
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const root = await mkdtemp(path.join(tmpdir(), 'oa-native-approval-deploy-'));
  try {
    await mkdir(path.join(root, 'dist/server'), { recursive: true });
    await symlink(
      path.resolve('node_modules'),
      path.join(root, 'node_modules'),
      'dir',
    );
    await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'native-approval-deployment-test',
        version: '1.0.0',
        type: 'module',
        dependencies: manifest.dependencies,
      }),
    );
    execFileSync(
      process.execPath,
      [
        path.join(
          cliRoot,
          'dist/tools/scripts/utils/build-server-dist-package.mjs',
        ),
      ],
      {
        cwd: root,
        env: { ...process.env, NOCOBASE_TOOL_ROOT: root },
        stdio: 'pipe',
      },
    );
    const deployed = JSON.parse(
      await readFile(path.join(root, 'dist/package.json'), 'utf8'),
    );
    expect(deployed.dependencies['@nocobase/app-plugin-approval']).toBe(
      '1.0.0-beta.11',
    );
    expect(deployed.dependencies['@nocobase/app-plugin-agents']).toBe(
      manifest.dependencies['@nocobase/app-plugin-agents'],
    );
    const deployedWorkspace = yaml.parse(
      await readFile(path.join(root, 'dist/pnpm-workspace.yaml'), 'utf8'),
    );
    expect(deployedWorkspace.patchedDependencies).toBeUndefined();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

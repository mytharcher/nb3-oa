// @vitest-environment node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import clientPlugins from '../../client/plugins.js';
import serverPlugins from '../../server/plugins.js';
import cliPlugins from '../../cli/plugins.js';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));

interface AppPackageJson {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const appPackage = JSON.parse(
  readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
) as AppPackageJson;

const registeredClientPackages = clientPlugins.plugins.map(
  (plugin) => plugin.packageName,
);

describe('client plugin registry consistency', () => {
  it('migrates AI Employee to Agents in every composition root', () => {
    const packagesByRoot = [
      registeredClientPackages,
      serverPlugins.plugins.map((plugin) => plugin.packageName),
      cliPlugins.plugins.map((plugin) => plugin.packageName),
    ];
    for (const packages of packagesByRoot) {
      expect(packages).toContain('@nocobase/app-plugin-agents');
      expect(packages).not.toContain('@nocobase/app-plugin-ai-employee');
      expect(packages).not.toContain('@nocobase/app-plugin-ai-knowledge');
    }
    for (const name of [
      '@nocobase/app-plugin-ai-employee',
      '@nocobase/ai-employee',
      '@nocobase/app-plugin-ai-knowledge',
    ]) {
      expect(appPackage.dependencies?.[name]).toBeUndefined();
      expect(appPackage.devDependencies?.[name]).toBeUndefined();
    }
  });

  it('declares every client plugin as a dependency', () => {
    const undeclared = registeredClientPackages.filter(
      (packageName) =>
        appPackage.devDependencies?.[packageName] === undefined &&
        appPackage.dependencies?.[packageName] === undefined,
    );

    expect(undeclared).toEqual([]);
  });

  it('registers no package twice', () => {
    expect(new Set(registeredClientPackages).size).toBe(
      registeredClientPackages.length,
    );
  });

  it('keeps scheduled tasks after removing generic workflows', () => {
    expect(registeredClientPackages).not.toContain(
      '@nocobase/app-plugin-workflow',
    );
    expect(registeredClientPackages).toContain(
      '@nocobase/app-plugin-scheduler',
    );
    expect(
      appPackage.dependencies?.['@nocobase/app-plugin-workflow'],
    ).toBeUndefined();
  });
});

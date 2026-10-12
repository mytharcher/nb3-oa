// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('includes every registered application module that constructs a public approval service', () => {
  const providers = fileURLToPath(
    new URL('../../../server/providers/', import.meta.url),
  );
  const registration = readFileSync(join(providers, 'index.ts'), 'utf8');
  const owners = readFileSync(
    join(providers, 'departure-reassignment/owners.ts'),
    'utf8',
  );
  const registered = new Set(
    [...registration.matchAll(/from '\.\/([^/]+)\//g)].map((match) => match[1]),
  );
  const covered = new Set(
    [...owners.matchAll(/from '\.\.\/([^/]+)\//g)].map((match) => match[1]),
  );
  function constructsApproval(path: string): boolean {
    return readdirSync(path, { withFileTypes: true }).some((entry) => {
      const child = join(path, entry.name);
      return entry.isDirectory()
        ? constructsApproval(child)
        : entry.name.endsWith('.ts') &&
            /new ApprovalService\s*\(/.test(readFileSync(child, 'utf8'));
    });
  }
  const missing = [...registered].filter(
    (module) =>
      constructsApproval(join(providers, module)) && !covered.has(module),
  );
  expect(
    missing,
    'Registered SDK owners need a public departure maintenance binding before accounts may be disabled.',
  ).toEqual([]);
});

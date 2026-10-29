import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVariablesManifest } from '@nocobase/app-server/config';
import demoMode from '../../server/config/demo-mode.ts';

test('an empty demo write allow-list does not block an ordinary deployment', () => {
  const defaults = demoMode({});
  const variables = Object.fromEntries(
    Object.entries(demoMode.rules.env).map(([name, mapping]) => [
      name,
      { ...mapping, path: `demoMode.${mapping.path}` },
    ]),
  );
  const manifest = buildVariablesManifest({
    app: { name: 'nb3-oa' },
    variables,
    defaults: { demoMode: defaults },
  });
  assert.equal(defaults.enabled, false);
  assert.deepEqual(defaults.allowCollections, []);
  assert.equal(
    manifest.variables.find(
      (variable) => variable.name === 'NOCOBASE_DEMO_WRITABLE_COLLECTIONS',
    ).required,
    false,
  );
  assert.deepEqual(demoMode.rules.public, ['enabled']);
  assert(demoMode.rules.validators.length > 0);
  assert.deepEqual(
    demoMode.rules.env.NOCOBASE_DEMO_WRITABLE_COLLECTIONS.parse('orders,items'),
    ['orders', 'items'],
  );
});

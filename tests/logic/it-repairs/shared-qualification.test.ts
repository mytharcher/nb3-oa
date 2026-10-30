// @vitest-environment node
import { expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import type { Knex } from 'knex';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createPlatformAppTest } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { ALL } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('shared qualification permits same actor cross-record writes and serializes account revocation', async ({
  testApp,
}) => {
  const f = await prepareRepairs(testApp),
    c = testApp.application.container,
    service = c.resolve(repairServiceToken),
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken);
  const draft = {
    title: 'Shared qualification',
    description: 'Synthetic',
    category: 'network',
    impact: 'partial',
    location: 'Lab',
    contact: '',
    occurredAt: null,
    assetId: null,
  };
  let entered!: () => void, release!: () => void;
  const reached = new Promise<void>((r) => (entered = r)),
    gate = new Promise<void>((r) => (release = r));
  const original = audit.record.bind(audit);
  let held = false;
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (input, tx) => {
      if (!held && input.targetType === 'itRepairs') {
        held = true;
        entered();
        await gate;
      }
      return original(input, tx);
    });
  const cmd = () => ({ actorId: f.a.userId, requestKey: randomUUID() });
  try {
    const first = service.save(cmd(), draft, ALL);
    await reached;
    const second = await service.save(
      cmd(),
      { ...draft, title: 'Independent record' },
      ALL,
    );
    expect(second.version).toBe(1);
    let revoked = false;
    const disable = c
      .resolve(userAdministrationServiceToken)
      .disable(f.a.userId)
      .then(() => {
        revoked = true;
      });
    const knex = await db.connection().client<Knex>();
    await vi.waitFor(async () => {
      const result = await knex.raw(
        "select 1 from pg_stat_activity where datname=current_database() and wait_event_type='Lock'",
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });
    expect(revoked).toBe(false);
    release();
    await first;
    await disable;
    await expect(service.save(cmd(), draft, ALL)).rejects.toMatchObject({
      code: 'ACCESS_DENIED',
    });
  } finally {
    release();
    spy.mockRestore();
  }
});

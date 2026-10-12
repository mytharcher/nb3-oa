// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  createEmployeesAppTest,
  createPerson,
  grantToUser,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';
import { vendorServiceToken } from '../../../server/providers/vendors/index.ts';
const test = createEmployeesAppTest();
const fields = () => ({
  code: `V-${randomUUID()}`,
  name: 'Visible vendor',
  category: 'Services',
  contactName: 'Sales',
  contactPhone: '12345',
  contactEmail: 'sales@example.test',
  bankName: 'Bank',
  bankAccount: '0001234',
  bankAccountName: 'Company',
  reason: 'Setup vendor',
});
describe('vendors HTTP record and bank field authorization', () => {
  test('separates view rows from bank grants and rejects anonymous or unauthorized writes', async ({
    testApp,
    request,
  }) => {
    const viewer = await createPerson(testApp, 'Limited vendor reader'),
      basic = await createPerson(testApp, 'Basic reader'),
      stranger = await createPerson(testApp, 'Outside'),
      editor = await createPerson(testApp, 'Procurement');
    const grants = (actions: string[], scope = 'allRecords') => [
      {
        resource: { type: 'composite' as const, id: 'oa.vendors' },
        actions: actions.map((action) => ({
          action,
          policy: { type: 'composite' as const, scopes: { vendors: scope } },
        })),
      },
    ];
    await grantToUser(
      testApp,
      'vendor-limited',
      grants(['view'], 'oa.vendorCreated'),
      viewer.userId,
    );
    await grantToUser(
      testApp,
      'vendor-limited-bank',
      grants(['bankRead']),
      viewer.userId,
    );
    await grantToUser(testApp, 'vendor-basic', grants(['view']), basic.userId);
    await grantToUser(
      testApp,
      'vendor-editor',
      grants(['view', 'manage', 'bankRead']),
      editor.userId,
    );
    const app = testApp.application,
      db = app.container.resolve(databaseManagerToken),
      service = app.container.resolve(vendorServiceToken);
    const own = await db.transaction((tx) =>
      service.create({ ...fields(), actorId: viewer.userId }, tx),
    );
    const foreign = await db.transaction((tx) =>
      service.create({ ...fields(), actorId: editor.userId }, tx),
    );
    expect((await request('/vendors')).status).toBe(401);
    expect((await (await stranger.session()).fetch('/vendors')).status).toBe(
      403,
    );
    const session = await viewer.session();
    const list = await (await session.fetch('/vendors')).json();
    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({
      id: own.id,
      bankAccount: '0001234',
      createdBy: { id: viewer.userId, name: 'Limited vendor reader' },
    });
    expect((await session.fetch(`/vendors/${foreign.id}`)).status).toBe(404);
    const basicList = await (
      await (await basic.session()).fetch('/vendors')
    ).json();
    expect(basicList.data).toHaveLength(2);
    expect(basicList.data[0]).not.toHaveProperty('bankAccount');
    expect(
      (await (await basic.session()).fetch('/vendors', json(fields()))).status,
    ).toBe(403);
    const written = await (
      await editor.session()
    ).fetch('/vendors', json(fields()));
    expect(written.status).toBe(200);
    expect((await written.json()).data.status).toBe('manual');
    expect(
      (
        await (
          await editor.session()
        ).fetch('/vendors', json({ ...fields(), status: 'qualified' }))
      ).status,
    ).toBe(400);
  });
});

// @vitest-environment node
import { expect } from 'vitest';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { test } from './helpers.js';
test('browser previews require current view and action policy and never fabricate physical operations', async ({
  testApp,
}) => {
  const org = testApp.application.container.resolve(organizationServiceToken),
    owner = await createEmployee(testApp, 'Browser seal owner'),
    other = await createEmployee(testApp, 'Browser seal outsider');
  const dep = await org.createDepartment(
    { title: 'Browser seals' },
    { actorId: owner.userId },
  );
  await org.addMember(
    { departmentId: dep.id, userId: owner.userId, primary: true },
    { actorId: owner.userId },
  );
  const session = await owner.session(),
    outsider = await other.session();
  expect((await testApp.request('/sealBrowser/options')).status).toBe(401);
  const options = await session.fetch('/sealBrowser/options');
  expect(options.status).toBe(200);
  const metadata = (await options.json()) as {
    data: {
      timeZone: string;
      sealTypes: { code: string }[];
      contracts: unknown[];
    };
  };
  expect(metadata.data.timeZone).toBeTruthy();
  expect(metadata.data.sealTypes.some((t) => t.code === 'official')).toBe(true);
  expect(metadata.data.contracts).toEqual([]);
  const created = await session.fetch(
    '/sealRequests',
    write('POST', {
      contractId: null,
      fileIds: [],
      sealType: 'official',
      copies: 1,
      external: false,
      returnDueAt: null,
      purpose: 'Preview draft',
      contact: '',
      requestKey: 'browser-create',
    }),
  );
  expect(created.status).toBe(200);
  const { data: record } = (await created.json()) as { data: { id: string } };
  const response = await session.fetch(
    `/sealBrowser/requests/${record.id}/capabilities`,
  );
  expect(response.status).toBe(200);
  const { data } = (await response.json()) as {
    data: {
      transitions: string[];
      taskActions: unknown[];
      canActualReturn: boolean;
    };
  };
  expect(data.transitions).toEqual(
    expect.arrayContaining(['edit', 'submit', 'withdraw']),
  );
  expect(data.transitions).not.toContain('forceComplete');
  expect(data.taskActions).toEqual([]);
  expect(data.canActualReturn).toBe(false);
  expect([403, 404]).toContain(
    (await outsider.fetch(`/sealBrowser/requests/${record.id}/capabilities`))
      .status,
  );
});

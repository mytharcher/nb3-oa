// @vitest-environment node
import { expect, vi } from 'vitest';
import { ApiError } from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import {
  createEmployee,
  createEmployeesAppTest,
  createPerson,
  grantToUser,
  ALL,
} from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { requestSearchRegistryToken } from '../../../server/providers/request-search/index.js';
import { registerOwnedRequestSearch } from '../../../server/providers/request-search/owned-source.js';
const test = createEmployeesAppTest();
test('all business sources register bounded scoped search; authorized uninvolved users can find records by summary and applicant', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const registry = c.resolve(requestSearchRegistryToken);
  expect(registry.sources()).toHaveLength(26);
  expect(new Set(registry.sources().map((source) => source.kind)).size).toBe(
    26,
  );
  for (const source of registry.sources()) {
    expect(
      await source.candidates({
        query: 'not-present-zz9898',
        applicantIds: [],
        limit: 2,
        policy: ALL,
      }),
    ).toEqual([]);
  }
  expect(
    findApiDocumentSchemaProblems(await c.resolve(apiDocsToken).getDocument()),
  ).toEqual([]);
  expect((await testApp.request('/requestSearch?q=fixture')).status).toBe(401);
  const owner = await createEmployee(testApp, 'SearchApplicant UniqueName');
  const colleague = await createEmployee(testApp, 'SearchColleague');
  const hr = await createPerson(testApp, 'SearchHR Uninvolved');
  const session = await owner.session();
  const ids: string[] = [];
  for (const suffix of ['first', 'second']) {
    const response = await session.fetch(
      '/leaveRequests',
      write('POST', {
        leaveType: 'personal',
        startDate: '2026-11-02',
        endDate: '2026-11-02',
        startHalf: 'am',
        endHalf: 'pm',
        reason: `SearchFixture ${suffix}`,
        attachments: [],
        handoverUserId: null,
        enableDelegation: false,
      }),
    );
    expect(response.status).toBe(200);
    ids.push((await response.json()).data.record.id);
  }
  const stranger = await colleague.session();
  expect(
    (await (await stranger.fetch('/requestSearch?q=SearchFixture')).json())
      .data,
  ).toEqual([]);
  await grantToUser(
    testApp,
    'search-hr-global-read',
    [
      {
        resource: { type: 'composite', id: 'oa.leave' },
        actions: [
          {
            action: 'view',
            policy: {
              type: 'composite',
              scopes: { leaveRequests: 'allRecords' },
            },
          },
        ],
      },
    ],
    hr.userId,
  );
  const hrSession = await hr.session();
  const first = await hrSession.fetch(
    '/requestSearch?q=SearchFixture&pageSize=1',
  );
  expect(first.status).toBe(200);
  const page1 = await first.json();
  expect(page1.data).toHaveLength(1);
  expect(page1.data[0].applicant.name).toBe('SearchApplicant UniqueName');
  expect(page1.meta.hasMore).toBe(true);
  const second = await hrSession.fetch(
    `/requestSearch?q=SearchFixture&pageSize=1&cursor=${encodeURIComponent(page1.meta.nextCursor)}`,
  );
  const page2 = await second.json();
  expect(page2.data).toHaveLength(1);
  expect(new Set([page1.data[0].id, page2.data[0].id])).toEqual(new Set(ids));
  expect(
    (
      await hrSession.fetch(
        `/requestSearch?q=different&cursor=${encodeURIComponent(page1.meta.nextCursor)}`,
      )
    ).status,
  ).toBe(400);
  expect(
    (await hrSession.fetch('/requestSearch?q=SearchFixture&cursor=bad')).status,
  ).toBe(400);
  const byName = await hrSession.fetch('/requestSearch?q=UniqueName');
  expect(
    (await byName.json()).data.map((row: { id: string }) => row.id).sort(),
  ).toEqual(ids.sort());
  // A broad directory match skips applicant expansion instead of failing the search.
  const users = c.resolve(userAdministrationServiceToken);
  const listUsers = users.list.bind(users);
  const broad = vi
    .spyOn(users, 'list')
    .mockImplementation(async (input) =>
      'search' in input && input.search
        ? { ...(await listUsers(input)), total: 501 }
        : listUsers(input),
    );
  try {
    const skippedByName = await (
      await hrSession.fetch('/requestSearch?q=UniqueName')
    ).json();
    expect(skippedByName.data).toEqual([]);
    expect(skippedByName.meta.skippedMatches).toEqual(['applicant']);
    const stillByTitle = await (
      await hrSession.fetch('/requestSearch?q=SearchFixture')
    ).json();
    expect(
      stillByTitle.data.map((row: { id: string }) => row.id).sort(),
    ).toEqual([...ids].sort());
    expect(stillByTitle.meta.skippedMatches).toEqual(['applicant']);
  } finally {
    broad.mockRestore();
  }
  expect(
    (await (await hrSession.fetch('/requestSearch?q=UniqueName')).json()).meta
      .skippedMatches,
  ).toEqual([]);
  const source = registry.sources().find((entry) => entry.kind === 'oa.leave')!;
  const originalGuard = source.validate;
  const guard = vi
    .spyOn(source, 'validate')
    .mockImplementation(async (id, actorId, policy) => {
      if (id === ids[0])
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'test',
          reason: 'ACCESS_DENIED',
          message: 'Denied',
        });
      return originalGuard(id, actorId, policy);
    });
  try {
    const filtered = await (
      await hrSession.fetch('/requestSearch?q=SearchFixture')
    ).json();
    expect(filtered.data.map((item: { id: string }) => item.id)).toEqual([
      ids[1],
    ]);
    expect(filtered.meta).toEqual({
      nextCursor: null,
      hasMore: false,
      skippedMatches: [],
    });
  } finally {
    guard.mockRestore();
  }
  const tampered = Buffer.from(
    JSON.stringify({
      v: 1,
      query: 'a'.repeat(64),
      source: 'oa.leave',
      afterId: { id: ids[0] },
    }),
  ).toString('base64url');
  expect(
    (await hrSession.fetch(`/requestSearch?q=SearchFixture&cursor=${tampered}`))
      .status,
  ).toBe(400);
  // A hidden summary cannot be used as an oracle even when another summary
  // field remains readable. No internal service is called for this no-match.
  expect(
    await source.candidates({
      query: 'SearchFixture',
      applicantIds: [],
      limit: 5,
      policy: {
        ...ALL,
        read: { fields: ['id', 'number', 'applicantId'], scope: true },
      },
    }),
  ).toEqual([]);
  const db = c.resolve(databaseManagerToken);
  const client = await db.connection().client();
  let statements = 0;
  const count = () => {
    statements++;
  };
  client.on('query', count);
  try {
    const empty = await hrSession.fetch('/requestSearch?q=not-present-zz9898');
    expect(empty.status).toBe(200);
    expect((await empty.json()).data).toEqual([]);
  } finally {
    client.off('query', count);
  }
  // 26 sources retain SDK gate/transaction and indexed relation checks. This
  // budget guards the measured 687-query baseline against repeated directory loads.
  expect(statements).toBeLessThan(750);
  // A broad related-number match skips that expansion and reports it; the
  // source's own title still matches.
  registerOwnedRequestSearch(testApp.application, {
    kind: 'test.relatedBroad',
    resource: 'oa.leave',
    collection: 'leaveRequests',
    titleField: 'reason',
    titleType: 'text',
    numberField: null,
    validate: async () => undefined,
    relatedNumber: {
      referenceField: 'handoverUserId',
      matchingRequestIds: async () =>
        Array.from({ length: 501 }, (_, index) => `related-${index}`),
      value: async () => null,
    },
  });
  const related = registry
    .sources()
    .find((entry) => entry.kind === 'test.relatedBroad')!;
  const skippedMatches: string[] = [];
  const broadRelated = await related.candidates({
    query: 'SearchFixture',
    applicantIds: [],
    limit: 5,
    policy: ALL,
    onSkippedMatch: (match) => skippedMatches.push(match),
  });
  expect(broadRelated.map((row) => row.id).sort()).toEqual([...ids].sort());
  expect(skippedMatches).toEqual(['relatedNumber']);
}, 120_000);

// @vitest-environment node
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { describe, expect } from 'vitest';

import { PLATFORM_SETTINGS } from '../../../server/providers/platform/index.ts';
import {
  createPlatformAppTest,
  createUser,
  grantSettings,
  json,
  write,
} from './helpers.ts';

const test = createPlatformAppTest();

interface Endpoint {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
  /** The settings item and action a caller needs. */
  readonly needs: readonly [string, 'read' | 'update'];
}

const ENDPOINTS: readonly Endpoint[] = [
  {
    method: 'GET',
    path: '/workCalendar',
    needs: [PLATFORM_SETTINGS.calendar, 'read'],
  },
  {
    method: 'GET',
    path: '/calendarDays?year=2026',
    needs: [PLATFORM_SETTINGS.calendar, 'read'],
  },
  {
    method: 'PUT',
    path: '/calendarDays/2026-12-31',
    body: { kind: 'holiday', note: 'Test' },
    needs: [PLATFORM_SETTINGS.calendar, 'update'],
  },
  {
    method: 'POST',
    path: '/calendarDays/import',
    body: { year: 2026, entries: [], replace: false },
    needs: [PLATFORM_SETTINGS.calendar, 'update'],
  },
  {
    method: 'GET',
    path: '/dictionaryTypes/leaveType/entries?includeInactive=true',
    needs: [PLATFORM_SETTINGS.dictionaries, 'read'],
  },
  {
    method: 'POST',
    path: '/dictionaryTypes/sealType/entries',
    body: { code: 'routeTest', label: { 'en-US': 'Route test' } },
    needs: [PLATFORM_SETTINGS.dictionaries, 'update'],
  },
  {
    method: 'GET',
    path: '/approvalRules',
    needs: [PLATFORM_SETTINGS.rules, 'read'],
  },
  {
    method: 'GET',
    path: '/approvalRules?area=calendar',
    needs: [PLATFORM_SETTINGS.calendar, 'read'],
  },
  {
    method: 'GET',
    path: '/approvalRules/spend.vp/versions',
    needs: [PLATFORM_SETTINGS.rules, 'read'],
  },
  {
    method: 'POST',
    path: '/approvalRules/purchase.quotes/versions',
    body: { value: 60000, note: 'Route test' },
    needs: [PLATFORM_SETTINGS.rules, 'update'],
  },
  {
    method: 'POST',
    path: '/approvalRules/versions',
    body: {
      changes: [{ key: 'overtime.monthlyHead', value: 40 }],
      note: 'Route test',
    },
    needs: [PLATFORM_SETTINGS.rules, 'update'],
  },
  {
    method: 'POST',
    path: '/approvalRules/calendar.workHours/versions',
    body: { value: { start: '09:00', end: '18:00' } },
    needs: [PLATFORM_SETTINGS.calendar, 'update'],
  },
  {
    method: 'GET',
    path: '/sequences',
    needs: [PLATFORM_SETTINGS.sequences, 'read'],
  },
  {
    method: 'GET',
    path: '/auditLogs',
    needs: [PLATFORM_SETTINGS.auditLogs, 'read'],
  },
  {
    method: 'GET',
    path: '/auditLogs/facets',
    needs: [PLATFORM_SETTINGS.auditLogs, 'read'],
  },
];

const init = (endpoint: Endpoint): RequestInit =>
  endpoint.method === 'GET' ? {} : write(endpoint.method, endpoint.body);

describe('platform routes', () => {
  test('reject anonymous callers', async ({ request }) => {
    for (const endpoint of ENDPOINTS) {
      const response = await request(endpoint.path, init(endpoint));
      expect(response.status, `${endpoint.method} ${endpoint.path}`).toBe(401);
    }
    expect((await request('/dictionaryTypes')).status).toBe(401);
  });

  test('reject a signed-in user without the settings item, before validating input', async ({
    testApp,
  }) => {
    const user = await createUser(testApp, 'Nobody');
    for (const endpoint of ENDPOINTS) {
      const response = await user.fetch(endpoint.path, init(endpoint));
      expect(response.status, `${endpoint.method} ${endpoint.path}`).toBe(403);
    }
    // An invalid body is still 403: permission comes first.
    expect(
      (await user.fetch('/calendarDays/2026-12-31', write('PUT', {}))).status,
    ).toBe(403);
  });

  test('let any signed-in user read dictionary types and active entries', async ({
    testApp,
  }) => {
    const user = await createUser(testApp, 'Reader');
    const types = await user.fetch('/dictionaryTypes');
    expect(types.status).toBe(200);
    const entries = await user.fetch('/dictionaryTypes/leaveType/entries');
    expect(entries.status).toBe(200);
    const body = await json<{ data: { code: string; active: boolean }[] }>(
      entries,
    );
    expect(body.data.map((entry) => entry.code)).toContain('annual');
    expect(body.data.every((entry) => entry.active)).toBe(true);
    expect((await user.fetch('/dictionaryTypes/nope/entries')).status).toBe(
      404,
    );
  });

  test('read permission does not allow writing', async ({ testApp }) => {
    const user = await createUser(testApp, 'Viewer');
    await grantSettings(testApp, user.user.id, PLATFORM_SETTINGS.rules, [
      'read',
    ]);
    expect((await user.fetch('/approvalRules')).status).toBe(200);
    const write = ENDPOINTS.find(
      (endpoint) => endpoint.path === '/approvalRules/purchase.quotes/versions',
    )!;
    expect((await user.fetch(write.path, init(write))).status).toBe(403);
    // The calendar keys belong to the calendar page's item.
    expect((await user.fetch('/approvalRules?area=calendar')).status).toBe(403);
  });

  test('a granted user can use each endpoint', async ({ testApp }) => {
    const user = await createUser(testApp, 'Admin of platform');
    for (const [id, actions] of [
      [PLATFORM_SETTINGS.calendar, ['read', 'update']],
      [PLATFORM_SETTINGS.dictionaries, ['read', 'update']],
      [PLATFORM_SETTINGS.rules, ['read', 'update']],
      [PLATFORM_SETTINGS.sequences, ['read']],
      [PLATFORM_SETTINGS.auditLogs, ['read']],
    ] as const)
      await grantSettings(testApp, user.user.id, id, actions);
    for (const endpoint of ENDPOINTS) {
      const response = await user.fetch(endpoint.path, init(endpoint));
      expect([200, 201], `${endpoint.method} ${endpoint.path}`).toContain(
        response.status,
      );
    }
    // The audit log names who did it.
    const logs = await json<{
      data: { action: string; actorName: string | null }[];
    }>(await user.fetch('/auditLogs?targetType=approvalRules'));
    expect(logs.data[0]).toMatchObject({
      action: 'rule.set',
      actorName: 'Admin of platform',
    });
    const first = logs.data[0] as unknown as { id: string };
    const one = await user.fetch(`/auditLogs/${first.id}`);
    expect(one.status).toBe(200);
    expect((await user.fetch('/auditLogs/999999')).status).toBe(404);
    const history = await json<{ data: { updatedByName: string | null }[] }>(
      await user.fetch('/approvalRules/purchase.quotes/versions'),
    );
    expect(history.data[0]?.updatedByName).toBe('Admin of platform');
  });

  test('saves several rule versions together, all or none', async ({
    testApp,
  }) => {
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const post = (body: unknown) =>
      admin.fetch('/approvalRules/versions', write('POST', body));
    const values = async () =>
      Object.fromEntries(
        (
          await json<{
            data: { key: string; current: { value: unknown } | null }[];
          }>(await admin.fetch('/approvalRules'))
        ).data.map((rule) => [rule.key, rule.current?.value]),
      );

    // Raising the lower key past the upper key's old value only works when both move together.
    const order = await post({
      changes: [{ key: 'spend.vp', value: 300_000 }],
    });
    expect(order.status).toBe(400);
    expect(
      await json<{ error: { reason: string; metadata: unknown } }>(order),
    ).toMatchObject({
      error: {
        reason: 'RULE_ORDER_VIOLATED',
        metadata: { lower: 'spend.vp', upper: 'spend.gm' },
      },
    });
    const saved = await post({
      changes: [
        { key: 'spend.vp', value: 300_000 },
        { key: 'spend.gm', value: 500_000 },
      ],
      note: 'Raise both',
    });
    expect(saved.status).toBe(201);
    expect(
      (await json<{ data: { key: string; note: string }[] }>(saved)).data,
    ).toMatchObject([
      { key: 'spend.vp', note: 'Raise both' },
      { key: 'spend.gm', note: 'Raise both' },
    ]);
    expect(await values()).toMatchObject({
      'spend.vp': 300_000,
      'spend.gm': 500_000,
    });

    // One invalid change rolls back the others and names its key.
    const invalid = await post({
      changes: [
        { key: 'overtime.monthlyHead', value: 50 },
        { key: 'leave.head', value: 'three' },
      ],
    });
    expect(invalid.status).toBe(400);
    expect(
      await json<{ error: { reason: string; metadata: unknown } }>(invalid),
    ).toMatchObject({
      error: { reason: 'RULE_INVALID_VALUE', metadata: { key: 'leave.head' } },
    });
    expect((await values())['overtime.monthlyHead']).not.toBe(50);

    const repeated = await post({
      changes: [
        { key: 'leave.head', value: 2 },
        { key: 'leave.head', value: 4 },
      ],
    });
    expect(repeated.status).toBe(409);
  });

  test('answers domain errors in the standard body', async ({ testApp }) => {
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const post = (path: string, body: unknown) =>
      admin.fetch(path, write('POST', body));

    const unknown = await post('/approvalRules/nope/versions', { value: 1 });
    expect(unknown.status).toBe(404);
    expect(
      (await json<{ error: { reason: string } }>(unknown)).error.reason,
    ).toBe('RULE_UNKNOWN');

    const order = await post('/approvalRules/spend.vp/versions', {
      value: 999999,
    });
    expect(order.status).toBe(400);
    expect(
      (await json<{ error: { reason: string } }>(order)).error.reason,
    ).toBe('RULE_ORDER_VIOLATED');

    const invalid = await post('/approvalRules/leave.head/versions', {
      value: 'three',
    });
    expect(invalid.status).toBe(400);
    const invalidBody = await json<{
      error: { reason: string; fieldViolations: { field: string }[] };
    }>(invalid);
    expect(invalidBody.error.reason).toBe('RULE_INVALID_VALUE');
    expect(invalidBody.error.fieldViolations[0]?.field).toBe('value');

    const scheduled = await post('/approvalRules/raise.gm/versions', {
      value: 0.35,
      effectiveFrom: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(scheduled.status).toBe(201);
    const { data } = await json<{ data: { id: string } }>(scheduled);
    const summary = await json<{
      data: { key: string; scheduled: { id: string }[] }[];
    }>(await admin.fetch('/approvalRules'));
    expect(
      summary.data
        .find((rule) => rule.key === 'raise.gm')
        ?.scheduled.map((v) => v.id),
    ).toEqual([data.id]);
    expect(
      (
        await admin.fetch(
          `/approvalRules/raise.gm/versions/${data.id}`,
          write('DELETE'),
        )
      ).status,
    ).toBe(204);

    const duplicate = await post('/dictionaryTypes/sealType/entries', {
      code: 'official',
      label: { 'en-US': 'Again' },
    });
    expect(duplicate.status).toBe(409);

    expect(
      (await admin.fetch('/calendarDays/2099-01-01', write('DELETE'))).status,
    ).toBe(404);
    const outside = await post('/calendarDays/import', {
      year: 2026,
      entries: [{ date: '2027-01-01', kind: 'holiday' }],
      replace: false,
    });
    expect(outside.status).toBe(400);
  });

  test('declares every route in the API document', async ({ testApp }) => {
    expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
    const document = await testApp.application.container
      .resolve(apiDocsToken)
      .getDocument();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => (operation as { operationId?: string }).operationId,
      ),
    );
    for (const operationId of [
      'getWorkCalendar',
      'listCalendarDays',
      'importCalendarDays',
      'setCalendarDay',
      'deleteCalendarDay',
      'listDictionaryTypes',
      'listDictionaryEntries',
      'createDictionaryEntry',
      'updateDictionaryEntry',
      'listApprovalRules',
      'listApprovalRuleVersions',
      'createApprovalRuleVersion',
      'deleteApprovalRuleVersion',
      'listSequences',
      'listAuditLogs',
      'getAuditLogFacets',
      'getAuditLog',
    ])
      expect(operations).toContain(operationId);
    const create = document.paths?.['/api/approvalRules/{key}/versions']?.post;
    expect(Object.keys(create?.responses ?? {}).sort()).toEqual([
      '201',
      '400',
      '401',
      '403',
      '404',
      '409',
      '500',
    ]);
    const types = document.paths?.['/api/dictionaryTypes']?.get;
    expect(Object.keys(types?.responses ?? {}).sort()).toEqual([
      '200',
      '401',
      '500',
    ]);
  });
});

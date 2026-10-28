// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { demoDataServiceToken } from '../../server/providers/demo-data/index.js';
import { createTestApp } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { createStandaloneServer } from '../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
} from './oa-test-origin.js';

it('switches real accounts and permits configured business writes while retaining role permissions', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    env: OA_TEST_DATABASE_ENV,
    server: {
      ...OA_TEST_SERVER,
      env: {
        ...OA_TEST_SERVER.env,
        NOCOBASE_DEMO_MODE: 'true',
        NOCOBASE_DEMO_WRITABLE_COLLECTIONS: 'departments,auditLogs',
      },
    },
    config: {
      app: { publicOrigin: OA_TEST_ORIGIN },
      secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      demoMode: {
        enabled: true,
        allowCollections: ['departments', 'auditLogs'],
      },
    },
  });
  try {
    const users = app.application.container.resolve(
      userAdministrationServiceToken,
    );
    const member = await users.create({
      name: 'Demo ordinary user',
      username: 'demo_member',
      email: 'demo-member@example.test',
      password: 'isolated-test-password',
    });
    const enter = async (username: string, previousCookie?: string) => {
      const response = await app.request(
        `/demoMode/accounts/${username}/signIn`,
        {
          method: 'POST',
          headers: {
            origin: OA_TEST_ORIGIN,
            ...(previousCookie ? { cookie: previousCookie } : {}),
          },
        },
      );
      expect(response.status).toBe(200);
      return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(';')[0])
        .join('; ');
    };
    const adminCookie = await enter(DEFAULT_ADMIN_CREDENTIALS.username);
    const create = (cookie: string, title: string) =>
      app.request('/departments', {
        method: 'POST',
        headers: {
          origin: OA_TEST_ORIGIN,
          cookie,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
    const created = await create(adminCookie, 'Writable demo department');
    expect(created.status).toBeLessThan(300);
    expect(created.status).toBeGreaterThanOrEqual(200);
    const { data } = await created.json();
    expect(
      await app.database
        .repository('departments')
        .findOne({ filter: { id: data.id } }),
    ).toMatchObject({ title: 'Writable demo department' });
    const memberCookie = await enter('demo_member', adminCookie);
    expect((await app.request('/demoAccountRoles')).status).toBe(401);
    const demoService = app.application.container.resolve(demoDataServiceToken);
    const before = await demoService.status();
    const labels = vi.spyOn(demoService, 'status').mockResolvedValue({
      ...before,
      accounts: [
        {
          id: member.id,
          username: 'demo_member',
          name: member.name,
          email: member.email,
          role: 'finance',
        },
      ],
    });
    try {
      const roles = await app.request('/demoAccountRoles', {
        headers: { cookie: memberCookie },
      });
      expect(roles.status).toBe(200);
      expect((await roles.json()).data).toEqual(
        expect.arrayContaining([
          { username: 'demo_member', roles: ['finance'] },
          {
            username: DEFAULT_ADMIN_CREDENTIALS.username,
            roles: ['administrator'],
          },
        ]),
      );
    } finally {
      labels.mockRestore();
    }
    const accounts = await app.request('/demoMode/accounts', {
      headers: { cookie: memberCookie },
    });
    expect((await accounts.json()).data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'demo_member', current: true }),
      ]),
    );
    expect((await create(memberCookie, 'Forbidden department')).status).toBe(
      403,
    );
    expect(
      await app.database
        .repository('departments')
        .findOne({ filter: { id: data.id } }),
    ).toMatchObject({ title: 'Writable demo department' });
    const status = await app.request('/demoMode/data', {
      headers: {
        cookie: await enter(DEFAULT_ADMIN_CREDENTIALS.username, memberCookie),
      },
    });
    expect((await status.json()).data).toMatchObject({
      available: false,
      present: false,
    });
  } finally {
    await app.close();
  }
}, 120_000);

it('does not expose role labels in ordinary application mode', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    env: OA_TEST_DATABASE_ENV,
    server: {
      ...OA_TEST_SERVER,
      env: { ...OA_TEST_SERVER.env, NOCOBASE_DEMO_MODE: 'false' },
    },
    config: {
      app: { publicOrigin: OA_TEST_ORIGIN },
      secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      demoMode: { enabled: false },
    },
  });
  try {
    const admin = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
    expect((await admin.fetch('/demoAccountRoles')).status).toBe(404);
  } finally {
    await app.close();
  }
}, 120_000);

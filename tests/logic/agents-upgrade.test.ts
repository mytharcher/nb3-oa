// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';

import { json, startOrgTestApp, type OrgTestApp } from './org/helpers.ts';

describe('Agents upgrade in the OA application', () => {
  let app: OrgTestApp;
  let admin: TestSession;
  let unpermitted: TestSession;

  beforeAll(async () => {
    app = await startOrgTestApp();
    admin = await app.admin();
    unpermitted = await app.createUser('agents-upgrade');
  });

  afterAll(async () => {
    await app?.close();
  });

  it('publishes the new plugin operations in the authenticated API document', async () => {
    const response = await admin.fetch('/swagger');
    expect(response.status).toBe(200);
    const document = (await response.json()) as {
      paths: Record<string, { get?: { operationId?: string } }>;
    };
    expect(document.paths['/api/agents']?.get?.operationId).toBe(
      'agentsListAgents',
    );
    expect(document.paths['/api/agents/services']?.get?.operationId).toBe(
      'agentsListModelServices',
    );
  });

  it('allows signed-in users to read the agent directory', async () => {
    expect((await app.testApp.request('/agents')).status).toBe(401);
    for (const session of [unpermitted, admin]) {
      const response = await session.fetch('/agents');
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ data: expect.any(Array) });
    }
  });

  it.each(['/agents/services', '/agents/skills'])(
    'enforces authentication and settings grants on %s',
    async (path) => {
      expect((await app.testApp.request(path)).status).toBe(401);
      expect((await unpermitted.fetch(path)).status).toBe(403);
      const response = await admin.fetch(path);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ data: expect.any(Array) });
    },
  );

  it('does not expose manual agent creation', async () => {
    const body = { name: 'Upgrade verification', type: 'online' };
    for (const session of [unpermitted, admin]) {
      expect((await session.fetch('/agents', json(body))).status).toBe(404);
    }
  });

  it('requires management grants before updating an agent', async () => {
    const path = '/agents/00000000-0000-4000-8000-000000000001';
    const body = {
      expectedRevision: 1,
      enabled: true,
      description: 'Office work',
    };
    const request = { ...json(body), method: 'PATCH' };
    expect((await app.testApp.request(path, request)).status).toBe(401);
    expect((await unpermitted.fetch(path, request)).status).toBe(403);
    expect((await admin.fetch(path, request)).status).toBe(404);
  });
});

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

  it.each(['/agents', '/agents/services', '/agents/skills'])(
    'enforces authentication and settings grants on %s',
    async (path) => {
      expect((await app.testApp.request(path)).status).toBe(401);
      expect((await unpermitted.fetch(path)).status).toBe(403);
      const response = await admin.fetch(path);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ data: expect.any(Array) });
    },
  );

  it('creates and reads an online agent after the plugin migrations', async () => {
    const body = { name: 'Upgrade verification', type: 'online' };
    expect((await unpermitted.fetch('/agents', json(body))).status).toBe(403);
    const response = await admin.fetch('/agents', json(body));
    expect(response.status).toBe(201);
    const { data } = (await response.json()) as {
      data: { id: string; name: string; type: string };
    };
    expect(data).toMatchObject(body);
    const read = await admin.fetch(`/agents/${data.id}`);
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({ data: { id: data.id, ...body } });
  });
});

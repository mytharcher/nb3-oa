// @vitest-environment node
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
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
import {
  DELEGATION_SETTINGS,
  approvalDirectoryServiceToken,
} from '../../../server/providers/approval-directory/index.ts';
import {
  createEmployee,
  createEmployeesAppTest,
  grantToUser,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';

const test = createEmployeesAppTest();

describe('approval delegation HTTP security', () => {
  test('rejects anonymous and unpermitted reads/writes before validating, honors read-only and update grants', async ({
    testApp,
    request,
  }) => {
    expect((await request('/approvalDelegations')).status).toBe(401);
    const reader = await createEmployee(testApp, 'Delegation Reader');
    const principal = await createEmployee(testApp, 'Delegation Principal');
    const delegate = await createEmployee(testApp, 'Delegation Delegate');
    const session = await reader.session();
    expect((await session.fetch('/approvalDelegations')).status).toBe(403);
    expect(
      (await session.fetch('/approvalDelegations', json({ invalid: true })))
        .status,
    ).toBe(403);
    const authz = testApp.application.container.resolve(authorizationToken);
    await grantToUser(
      testApp,
      'delegation-reader-test',
      [authz.settings.grant(DELEGATION_SETTINGS, ['read'])],
      reader.userId,
    );
    expect((await session.fetch('/approvalDelegations')).status).toBe(200);
    expect((await session.fetch('/approvalDelegations', json({}))).status).toBe(
      403,
    );
    await grantToUser(
      testApp,
      'delegation-writer-test',
      [authz.settings.grant(DELEGATION_SETTINGS, ['update'])],
      reader.userId,
    );
    const input = {
      principalId: principal.userId,
      delegateId: delegate.userId,
      scope: 'all',
      from: '2026-10-10T00:00:00Z',
      to: '2026-10-12T00:00:00Z',
    };
    const response = await session.fetch('/approvalDelegations', json(input));
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      data: {
        id: string;
        principal: { id: string; name: string };
        delegate: { id: string; name: string };
      };
    };
    expect(body.data.principal).toEqual({
      id: principal.userId,
      name: 'Delegation Principal',
    });
    expect(body.data.delegate).toEqual({
      id: delegate.userId,
      name: 'Delegation Delegate',
    });
    expect(
      (
        await session.fetch(
          `/approvalDelegations/${body.data.id}`,
          json({ ...input, source: 'leave' }, 'PATCH'),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await session.fetch(
          `/approvalDelegations/${body.data.id}/disable`,
          json({}),
        )
      ).status,
    ).toBe(200);
    const audits = await testApp.database
      .repository('auditLogs')
      .findMany({ filter: { targetId: body.data.id } });
    expect(audits.map((entry) => entry.actorId)).toEqual([
      reader.userId,
      reader.userId,
    ]);
    const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    expect((await root.fetch('/approvalDelegations')).status).toBe(200);
    const directory = await testApp.application.container
      .resolve(approvalDirectoryServiceToken)
      .snapshot();
    expect(directory.hasRole(root.user.id, 'approval.admin')).toBe(true);
    expect(directory.hasRole(reader.userId, 'approval.admin')).toBe(false);
  });
  test('declares every operation and resolves its response schemas', async ({
    testApp,
  }) => {
    const app = testApp.application;
    expect(findUndeclaredApiRoutes(app)).toEqual([]);
    const document = await app.container.resolve(apiDocsToken).getDocument();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(document.paths?.['/api/approvalDelegations']?.get?.operationId).toBe(
      'listApprovalDelegations',
    );
    expect(
      document.paths?.['/api/approvalDelegations/{id}/disable']?.post
        ?.operationId,
    ).toBe('disableApprovalDelegation');
  });
});

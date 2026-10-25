import { accessCatalog } from './catalog.js';
import { roleDirectory, roleMetadata } from './roles.js';
import { roleGrantTitle } from '../../../shared/access-titles.js';
import { ruleSummary } from './rules.js';
import { z } from 'zod';
import { accessDirectory, accessMembers } from './directory.js';
import {
  PermissionSetProtectedError,
  PermissionSetLastAssignmentError,
  PermissionSetSubjectNotAllowedError,
  PermissionSetNotFoundError,
} from '@nocobase/authorization/permission-sets';
import type { Application } from '@nocobase/app-server/application';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  describeRoute,
  apiValidator,
  apiErrorResponses,
  apiErrorResponse,
  dataResponse,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { Hono, type MiddlewareHandler } from 'hono';
import { lockAccessWrites } from '../../providers/audit/access-lock.js';
import {
  applyChanges,
  fail,
  setSnapshot,
  snapshot,
  subjectSnapshot,
} from './model.js';
import {
  Assignments,
  Changes,
  SetParams,
  SetSnapshot,
  Snapshot,
  SubjectParams,
  SubjectGrants,
} from './schemas.js';

import {
  roleTypes,
  saveSubjectGrants,
  planSubjectGrants,
  validateSubjects,
} from './subject-grants.js';

export const accessApiRoutes = defineApiRoutes<Application>((app) => {
  const router = new Hono();
  const routes = new Hono<AuthorizationEnv>();
  const authz = app.container.resolve(authorizationToken);
  routes.onError((error, c) => {
    const reason =
      error instanceof PermissionSetProtectedError
        ? 'PROTECTED_PERMISSION_SET'
        : error instanceof PermissionSetLastAssignmentError
          ? 'LAST_ASSIGNMENT'
          : error instanceof PermissionSetSubjectNotAllowedError
            ? 'SUBJECT_NOT_ALLOWED'
            : error instanceof PermissionSetNotFoundError
              ? 'NOT_FOUND'
              : undefined;
    return apiErrorHandler(
      reason
        ? new ApiError({
            status:
              reason === 'NOT_FOUND' ? 'NOT_FOUND' : 'FAILED_PRECONDITION',
            reason,
            domain: 'access',
            message: reason,
            cause: error,
          })
        : error,
      c,
    );
  });

  const database = app.container.resolve(databaseManagerToken);
  routes.use(
    '*',
    app.container.resolve(authenticationToken).required(),
    authz.middleware(),
  );
  const requireAction =
    (action: string): MiddlewareHandler<AuthorizationEnv> =>
    async (c, next) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        action,
      });
      await next();
    };
  const describe = (operationId: string, schema: z.ZodType) =>
    describeRoute({
      tags: ['Access management'],
      summary: operationId,
      operationId,
      responses: {
        200: dataResponse(schema),
        ...apiErrorResponses,
        400: apiErrorResponse(400),
        404: apiErrorResponse(404),
        409: apiErrorResponse(409),
      },
    });
  routes.get(
    '/roles',
    requireAction('read'),
    describe(
      'getAccessRoleDirectory',
      z.array(z.record(z.string(), z.unknown())),
    ),
    async (c) => c.json({ data: await roleDirectory(app, authz) }),
  );
  routes.get(
    '/options',
    requireAction('read'),
    describe('getAccessMatrixOptions', z.record(z.string(), z.unknown())),
    (c) => c.json({ data: accessCatalog(authz) }),
  );
  routes.get(
    '/subjects/:type/:id',
    requireAction('read'),
    apiValidator('param', SubjectParams),
    describe('getAccessRole', Snapshot),
    async (c) => {
      const subject = c.req.valid('param');
      const [role, data, rules] = await Promise.all([
        roleMetadata(app, authz, subject, { authz: c.get('authz') }),
        subjectSnapshot(authz.permissionSets, subject),
        ruleSummary(authz, c.get('authz')),
      ]);
      return c.json({ data: { ...data, role, rules } });
    },
  );
  routes.get(
    '/directory',
    requireAction('read'),
    describe('getAccessDirectory', z.array(z.record(z.string(), z.unknown()))),
    async (c) => c.json({ data: await accessDirectory(app, authz) }),
  );
  routes.get(
    '/subjects/:type/:id/members',
    requireAction('read'),
    apiValidator('param', SubjectParams),
    describe('getAccessMembers', z.array(z.record(z.string(), z.unknown()))),
    async (c) => {
      await c
        .get('authz')
        .require({ resource: { type: 'user', id: '*' }, action: 'read' });
      return c.json({
        data: await accessMembers(app, authz, c.req.valid('param')),
      });
    },
  );
  routes.get(
    '/snapshot',
    requireAction('read'),
    describe('getAccessSnapshot', Snapshot),
    async (c) =>
      c.json({
        data: {
          ...(await snapshot(authz.permissionSets)),
          rules: await ruleSummary(authz, c.get('authz')),
        },
      }),
  );
  routes.get(
    '/permissionSets/:key',
    requireAction('read'),
    describe('getAccessPermissionSet', SetSnapshot),
    apiValidator('param', SetParams),
    async (c) =>
      c.json({
        data: await setSnapshot(authz.permissionSets, c.req.valid('param').key),
      }),
  );
  routes.put(
    '/permissionSets/:key',
    requireAction('update'),
    requireAction('read'),
    describe('updateAccessPermissionSet', SetSnapshot),
    apiValidator('param', SetParams),
    apiValidator('json', Changes),
    async (c) => {
      const { key } = c.req.valid('param');
      const input = c.req.valid('json');
      // Public subject administration accepts request authz but no transaction connection.
      // Resolve visibility before acquiring the write lock to avoid a nested SQLite connection wait.
      // The locked revision check below binds this complete impact to the exact saved definition/assignments.
      authz.permissionSets.assertWritable(key, 'update');
      const impact = await setSnapshot(authz.permissionSets, key);
      if (impact.revision !== input.expectedRevision)
        fail('VERSION_CONFLICT', 'ABORTED');
      // Revalidate impact on the server too: a client confirmation is not an access boundary.
      for (const type of new Set(
        impact.assignments.map((entry) => entry.subject.type),
      )) {
        const ids = [
          ...new Set(
            impact.assignments
              .filter((entry) => entry.subject.type === type)
              .map((entry) => entry.subject.id),
          ),
        ];
        const administration = authz.subjects.get(type)?.administration;
        if (!administration) fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
        if (administration.selection.type === 'fixed') {
          const fixedId = administration.selection.id;
          if (ids.some((id) => id !== fixedId))
            fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
        } else {
          for (let offset = 0; offset < ids.length; offset += 100) {
            const batch = ids.slice(offset, offset + 100);
            const resolved = await administration.selection.resolve(batch, {
              authz: c.get('authz'),
            });
            if (batch.some((id) => !resolved.some((entry) => entry.id === id)))
              fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
          }
        }
      }
      const data = await database.transaction(async (connection) => {
        await lockAccessWrites(connection);
        const sets = authz.permissionSets.withTransaction(connection);
        sets.assertWritable(key, 'update');
        const current = await setSnapshot(sets, key);
        if (current.revision !== input.expectedRevision)
          fail('VERSION_CONFLICT', 'ABORTED');
        await sets.update(key, {
          key,
          ...(current.definition.title === undefined
            ? {}
            : { title: current.definition.title }),
          grants: applyChanges(authz, current.definition.grants, input.changes),
        });
        return setSnapshot(sets, key);
      });
      return c.json({ data });
    },
  );
  routes.put(
    '/subjects/:type/:id/assignments',
    requireAction('assign'),
    requireAction('read'),
    describe('replaceAccessAssignments', Snapshot),
    apiValidator('param', SubjectParams),
    apiValidator('json', Assignments),
    async (c) => {
      const subject = c.req.valid('param');
      const input = c.req.valid('json');
      const administration = authz.subjects.get(subject.type)?.administration;
      if (!administration) fail('UNSUPPORTED_SUBJECT');
      if (administration.selection.type === 'fixed') {
        if (subject.id !== administration.selection.id)
          fail('UNSUPPORTED_SUBJECT');
      } else {
        const entries = await administration.selection.resolve([subject.id], {
          authz: c.get('authz'),
        });
        if (!entries.some((entry) => entry.id === subject.id))
          fail('NOT_FOUND', 'NOT_FOUND');
      }
      const data = await database.transaction(async (connection) => {
        await lockAccessWrites(connection);
        const sets = authz.permissionSets.withTransaction(connection);
        const current = await snapshot(sets);
        if (current.revision !== input.expectedRevision)
          fail('VERSION_CONFLICT', 'ABORTED');
        const managed = new Set(input.managedPermissionSets);
        const selected = new Set(input.permissionSets);
        if (
          managed.size !== input.managedPermissionSets.length ||
          selected.size !== input.permissionSets.length ||
          [...selected].some((key) => !managed.has(key))
        )
          fail('INVALID_SUBSET');
        const before = new Set(
          current.assignments
            .filter(
              (entry) =>
                entry.subject.type === subject.type &&
                entry.subject.id === subject.id,
            )
            .map((entry) => entry.permissionSet),
        );
        for (const key of managed) {
          const definition = current.sets.find((entry) => entry.key === key);
          if (!definition) fail('NOT_FOUND', 'NOT_FOUND');
          if (before.has(key) !== selected.has(key)) {
            sets.assertWritable(key, selected.has(key) ? 'assign' : 'revoke');
            if (
              selected.has(key) &&
              definition.protection?.assignableTo &&
              !definition.protection.assignableTo.includes(subject.type)
            )
              fail('SUBJECT_NOT_ALLOWED');
          }
        }
        await sets.replaceSubjectAssignments({
          subject,
          managedPermissionSets: [...managed],
          permissionSets: [...selected],
        });
        return snapshot(sets);
      });
      return c.json({ data });
    },
  );
  routes.put(
    '/subjects/:type/:id/grants',
    requireAction('read'),
    requireAction('update'),
    requireAction('assign'),
    describe('updateAccessSubjectGrants', Snapshot),
    apiValidator('param', SubjectParams),
    apiValidator('json', SubjectGrants),
    async (c) => {
      const subject = c.req.valid('param');
      const input = c.req.valid('json');
      if (!roleTypes.has(subject.type)) fail('UNSUPPORTED_SUBJECT');
      const impact =
        input.revisionScope === 'subject'
          ? await subjectSnapshot(authz.permissionSets, subject)
          : await snapshot(authz.permissionSets);
      if (impact.revision !== input.expectedRevision)
        fail('VERSION_CONFLICT', 'ABORTED');
      const planned = planSubjectGrants(authz, impact, subject, input);
      const keys = new Set(
        planned.flatMap((plan) => (plan.source ? [plan.source.key] : [])),
      );
      await validateSubjects(
        authz,
        [
          subject,
          ...impact.assignments
            .filter((entry) => keys.has(entry.permissionSet))
            .map((entry) => entry.subject),
        ],
        { authz: c.get('authz') },
      );
      const administration = authz.subjects.get(subject.type)!.administration!;
      const subjectTitle =
        administration.selection.type === 'fixed'
          ? administration.title
          : (
              await administration.selection.resolve([subject.id], {
                authz: c.get('authz'),
              })
            )[0]?.title;
      const rules = await ruleSummary(authz, c.get('authz'));
      const data = await database.transaction(async (connection) => {
        await lockAccessWrites(connection);
        return saveSubjectGrants(
          authz,
          authz.permissionSets.withTransaction(connection),
          subject,
          input,
          {
            authorize: async (action) => {
              await c.get('authz').require({
                resource: {
                  type: 'settings',
                  id: 'authorization.permission-sets',
                },
                action,
              });
            },
            titleFor: (resource, number) =>
              roleGrantTitle({
                number,
                module:
                  (resource.type === 'composite'
                    ? authz.compositeResources
                        .list()
                        .find((entry) => entry.name === resource.id)?.title
                    : authz.resourceTypes
                        .get(resource.type)
                        .items?.get(resource.id)?.title) ?? resource.id,
                role: subjectTitle ?? subject.id,
              }),
          },
        );
      });
      return c.json({ data: { ...data, rules } });
    },
  );
  router.route('/access', routes);
  return router;
});
export default [accessApiRoutes];

import {
  authorizationToken,
  condition,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import type { Application } from '@nocobase/app-server/application';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
export function registerAttendanceResultPermissions(app: Application) {
  const authz = app.container.resolve(authorizationToken);
  const title = (key: string) => ({
    key: `attendanceResults.authz.${key}`,
    ns: 'nb3-oa',
  });
  const fields = {
    attendanceEvaluations: [
      'id',
      'userId',
      'departmentId',
      'date',
      'version',
      'currentRevisionId',
    ],
    attendanceEvaluationRevisions: [
      'id',
      'userId',
      'departmentId',
      'date',
      'evaluationId',
      'revision',
      'createdAt',
      'result',
      'snapshot',
    ],
  };
  for (const name of Object.keys(fields))
    authz.database.collections.add({ name, title: title(name) });
  const own = authz.recordAccess.define(
    defineRecordAccess('oa.attendanceResults.self', (a) =>
      a
        .title(title('self'))
        .collections(...Object.keys(fields))
        .resolver(({ principal }) =>
          principal.type === 'user'
            ? condition('userId', '$eq', principal.id)
            : false,
        ),
    ),
  );
  const departments = registerDepartmentScopes(
    authz,
    app.container.resolve(organizationServiceToken),
    {
      prefix: 'oa.attendanceResults',
      targets: Object.keys(fields).map((collection) => ({
        collection,
        departmentField: 'departmentId',
      })),
    },
  );
  authz.compositeResources.define(
    defineCompositeResource('oa.attendanceResults', (r) => {
      let resource = r.title(title('resource')).action('calculateSelf', (a) =>
        a.title(title('calculateSelf')).grant(
          'attendanceEvaluations',
          defineDatabasePermission((p) =>
            p
              .collection('attendanceEvaluations')
              .read((read) => read.fields('id'))
              .options(own)
              .default(own),
          ),
        ),
      );
      for (const action of ['view', 'recalculate', 'export'])
        resource = resource.action(action, (a) => {
          let grant = a.title(title(action));
          for (const [collection, columns] of Object.entries(fields))
            grant = grant.grant(
              collection,
              defineDatabasePermission((p) =>
                p
                  .collection(collection)
                  .read((read) => read.fields(...columns))
                  .options(
                    own,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                    {
                      key: 'allRecords',
                      collections: Object.keys(fields),
                    },
                  )
                  .default(own),
              ),
            );
          return grant;
        });
      return resource;
    }),
  );
  authz.ui.place(
    { type: 'composite', id: 'oa.attendanceResults' },
    { section: 'oa.attendanceManagement' },
  );
}

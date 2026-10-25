import type { Application } from '@nocobase/app-server/application';
import type {
  AppAuthorization,
  AuthorizationConfig,
} from '@nocobase/app-plugin-authorization/server';
import type {
  AuthorizationSubject,
  AuthorizationContext,
} from '@nocobase/authorization/core';
import { organizationServiceToken } from '../../providers/org/index.js';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { fail } from './model.js';

export function rootKey(app: Application): string {
  return (
    app.config.get<AuthorizationConfig>('authorization')?.permissionSets
      ?.rootSet ?? 'root'
  );
}
/** Role identities only. No permission-set list, assignments or membership aggregation. */
type RoleText = string | { key: string; ns?: string; defaultValue?: string };
export interface RoleMetadata {
  title: RoleText;
  memberCount?: number;
}
export interface RoleIdentity {
  type: string;
  id: string;
  title: RoleText;
}
export async function roleDirectory(
  app: Application,
  authz: AppAuthorization,
): Promise<RoleIdentity[]> {
  const org = app.container.resolve(organizationServiceToken);
  const [roles, departments, positions] = await Promise.all([
    org.listDutyRoles(),
    org.listTree(),
    org.listPositions(),
  ]);
  return [
    ...(authz.permissionSets.protection(rootKey(app))?.unrestricted
      ? [
          {
            type: 'system',
            id: rootKey(app),
            title: { key: 'access.systemAdmin', ns: 'nb3-oa' },
          },
        ]
      : []),
    ...['authenticated', 'org.departmentHead', 'org.reportingManager'].map(
      (type) => ({
        type,
        id: '*',
        title: authz.subjects.get(type)?.administration?.title ?? type,
      }),
    ),
    ...roles.map((role) => ({
      type: 'org.dutyRole',
      id: role.code,
      title: role.title,
    })),
    ...departments.map((department) => ({
      type: 'org.department',
      id: department.id,
      title: department.title,
    })),
    ...positions.map((position) => ({
      type: 'org.position',
      id: position.id,
      title: position.title,
    })),
  ];
}
export async function roleMetadata(
  app: Application,
  authz: AppAuthorization,
  subject: AuthorizationSubject,
  context: { authz: AuthorizationContext },
): Promise<RoleMetadata> {
  const org = app.container.resolve(organizationServiceToken);
  if (subject.type === 'system') {
    if (
      subject.id !== rootKey(app) ||
      !authz.permissionSets.protection(subject.id)?.unrestricted ||
      !(await authz.permissionSets.get(subject.id))
    )
      fail('NOT_FOUND', 'NOT_FOUND');
    return {
      title: { key: 'access.systemAdmin', ns: 'nb3-oa' },
      memberCount: (await authz.permissionSets.listAssignments(subject.id))
        .length,
    };
  }
  const administration = authz.subjects.get(subject.type)?.administration;
  if (
    !administration ||
    ![
      'user',
      'authenticated',
      'org.dutyRole',
      'org.position',
      'org.department',
      'org.departmentHead',
      'org.reportingManager',
    ].includes(subject.type)
  )
    fail('NOT_FOUND', 'NOT_FOUND');
  let title = administration.title;
  if (administration.selection.type === 'fixed') {
    if (subject.id !== administration.selection.id)
      fail('NOT_FOUND', 'NOT_FOUND');
  } else {
    const entry = (
      await administration.selection.resolve([subject.id], context)
    )[0];
    if (!entry) fail('NOT_FOUND', 'NOT_FOUND');
    title = entry.title;
  }
  const memberCount =
    subject.type === 'user'
      ? 1
      : subject.type === 'org.dutyRole'
        ? (await org.dutyRoleMembers(subject.id)).length
        : subject.type === 'org.department'
          ? new Set(await org.membersOf(await org.subtreeIds(subject.id))).size
          : subject.type === 'authenticated'
            ? undefined
            : ((
                await (
                  subject.type === 'org.departmentHead'
                    ? org
                    : app.container.resolve(employeeServiceToken)
                ).accessMemberships()
              ).get(`${subject.type}:${subject.id}`)?.length ?? 0);
  return { title, memberCount };
}

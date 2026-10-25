import type { Application } from '@nocobase/app-server/application';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { organizationServiceToken } from '../../providers/org/index.js';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';

export async function accessMemberships(
  app: Application,
  authz: AppAuthorization,
) {
  const org = await app.container
    .resolve(organizationServiceToken)
    .accessMemberships();
  const employees = await app.container
    .resolve(employeeServiceToken)
    .accessMemberships();
  const result = new Map([...org, ...employees]);
  const assignments = await authz.permissionSets.listAssignments();
  for (const set of await authz.permissionSets.list())
    if (authz.permissionSets.protection(set.key)?.unrestricted)
      result.set(
        `system:${set.key}`,
        assignments
          .filter(
            (entry) =>
              entry.permissionSet === set.key && entry.subject.type === 'user',
          )
          .map((entry) => entry.subject.id),
      );
  return result;
}

export async function accessDirectory(
  app: Application,
  authz: AppAuthorization,
): Promise<
  {
    type: string;
    id: string;
    title:
      | string
      | {
          readonly key: string;
          readonly ns?: string;
          readonly defaultValue?: string;
        };
    memberCount?: number;
  }[]
> {
  const organization = app.container.resolve(organizationServiceToken);
  const [members, roles, departments, positions] = await Promise.all([
    accessMemberships(app, authz),
    organization.listDutyRoles(),
    organization.listTree(),
    organization.listPositions(),
  ]);
  const fixed = [
    'authenticated',
    'org.departmentHead',
    'org.reportingManager',
  ].map((type) => ({
    type,
    id: '*',
    title: authz.subjects.get(type)?.administration?.title ?? type,
  }));
  const subjects = [
    ...fixed,
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
  return subjects.map((subject) => ({
    ...subject,
    memberCount:
      subject.type === 'authenticated'
        ? undefined
        : (members.get(`${subject.type}:${subject.id}`)?.length ?? 0),
  }));
}
export async function accessMembers(
  app: Application,
  authz: AppAuthorization,
  subject: { type: string; id: string },
) {
  const ids =
    (await accessMemberships(app, authz)).get(
      `${subject.type}:${subject.id}`,
    ) ?? [];
  const users = app.container.resolve(userAdministrationServiceToken);
  const members: { userId: string; user: { id: string; name: string } }[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const page = await users.list({
      userIds: ids.slice(offset, offset + 100),
      pageSize: 100,
      kind: 'all',
    });
    members.push(
      ...page.items.map((user) => ({
        userId: user.id,
        user: { id: user.id, name: user.name },
      })),
    );
  }
  return members;
}

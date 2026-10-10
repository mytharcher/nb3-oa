import {
  encodeAuthorizationTitle,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Ids declared by `server/providers/employees/authorization.ts`. A seed is loaded on its own, outside the server's
// module graph, so it repeats the stable ids and writes composite grants in their stored shape.
const EMPLOYEES_SETTINGS = 'oa.employees';
const DIRECTORY_PAGE = 'oa.employees.directory';

/** A stored composite grant: per action, one record access key per data scope. */
function composite(
  id: string,
  actions: Record<string, Record<string, string>>,
): PermissionGrant {
  return {
    resource: { type: 'composite', id },
    actions: Object.entries(actions).map(([action, scopes]) => ({
      action,
      policy: { type: 'composite', scopes },
    })),
  };
}
const employeeArchive = {
  grant: (actions: Record<string, Record<string, string>>) =>
    composite('oa.employees.archive', actions),
};
const employeeProfile = {
  grant: (actions: Record<string, Record<string, string>>) =>
    composite('oa.employees.profile', actions),
};
const employeeCompensation = {
  grant: (actions: Record<string, Record<string, string>>) =>
    composite('oa.employees.compensation', actions),
};
const employeeDirectory = {
  grant: (actions: Record<string, Record<string, string>>) =>
    composite('oa.employees.directory', actions),
};

/** The application's translation namespace (its package name); the client locales ship these keys. */
const NS = 'nb3-oa';
const title = (key: string) => ({
  key: `employees.permissionSets.${key}`,
  ns: NS,
});

const archivePage: PermissionGrant = {
  resource: { type: 'settings', id: EMPLOYEES_SETTINGS },
  actions: [{ action: 'read' }],
};
/** The user picker that binds an archive to an account searches the Users plugin's list. */
const userRead: PermissionGrant = {
  resource: { type: 'user', id: '*' },
  actions: [{ action: 'read' }],
};

/**
 * The initial employee permission sets, from the visibility matrix (OA plan 02 §7). They are ordinary configuration:
 * written only when the key is missing, so an administrator's later edits survive a replay. Each is assigned to the
 * subject that holds the job, never to a person.
 */
const SETS = [
  {
    set: definePermissionSet('oa-employees-hr')
      .title(title('hr'))
      .grant(archivePage, userRead)
      .grant(
        employeeArchive.grant({
          view: { employees: 'allRecords' },
          manage: { employees: 'allRecords' },
        }),
        employeeProfile.grant({
          view: { employeeProfiles: 'allRecords' },
          update: { employeeProfiles: 'allRecords' },
        }),
        employeeCompensation.grant({
          view: { employeeCompensation: 'allRecords' },
        }),
      )
      .build(),
    subjects: [
      { type: 'org.dutyRole', id: 'hr' },
      { type: 'org.dutyRole', id: 'hrbp' },
      { type: 'org.dutyRole', id: 'hrDirector' },
    ],
  },
  {
    // 总经理 and CFO: every archive and its compensation, read-only.
    set: definePermissionSet('oa-employees-compensation')
      .title(title('compensation'))
      .grant(archivePage)
      .grant(
        employeeArchive.grant({
          view: { employees: 'allRecords' },
        }),
        employeeCompensation.grant({
          view: { employeeCompensation: 'allRecords' },
        }),
      )
      .build(),
    subjects: [
      { type: 'org.dutyRole', id: 'gm' },
      { type: 'org.dutyRole', id: 'cfo' },
    ],
  },
  {
    // 财务: the bank account of the controlled profile, for payments; no archive page.
    set: definePermissionSet('oa-employees-bank')
      .title(title('bank'))
      .grant(
        employeeProfile.grant({
          viewBank: { employeeProfiles: 'allRecords' },
        }),
      )
      .build(),
    subjects: [
      { type: 'org.dutyRole', id: 'finance' },
      { type: 'org.dutyRole', id: 'financeManager' },
      { type: 'org.dutyRole', id: 'cashier' },
    ],
  },
  {
    // 直属上级: the basic archive of every report, at any depth.
    set: definePermissionSet('oa-employees-manager')
      .title(title('manager'))
      .grant(archivePage)
      .grant(
        employeeArchive.grant({
          view: { employees: 'oa.reports' },
        }),
      )
      .build(),
    subjects: [{ type: 'org.reportingManager', id: '*' }],
  },
  {
    // 部门负责人: the basic archive of their department and below.
    set: definePermissionSet('oa-employees-head')
      .title(title('head'))
      .grant(archivePage)
      .grant(
        employeeArchive.grant({
          view: { employees: 'oa.employees.myDepartmentsAndBelow' },
        }),
      )
      .build(),
    subjects: [{ type: 'org.departmentHead', id: '*' }],
  },
  {
    // The administrator's data correction. Left unassigned: who administers the archive is an installation decision.
    set: definePermissionSet('oa-employees-admin')
      .title(title('admin'))
      .grant(archivePage)
      .grant(
        employeeArchive.grant({
          view: { employees: 'allRecords' },
          correctStatus: { employees: 'allRecords' },
        }),
        employeeProfile.grant({
          view: { employeeProfiles: 'allRecords' },
        }),
      )
      .build(),
    subjects: [],
  },
  {
    // 通讯录 for everyone signed in; phone and email visible to all by default (tighten `viewContact` per department).
    set: definePermissionSet('oa-directory')
      .title(title('directory'))
      .grant({
        resource: { type: 'page', id: DIRECTORY_PAGE },
        actions: [{ action: 'access' }],
      })
      .grant(
        employeeDirectory.grant({
          view: { employees: 'allRecords' },
          viewContact: { employees: 'allRecords' },
        }),
      )
      .build(),
    subjects: [{ type: 'authenticated', id: '*' }],
  },
];

const seed: SeedDefinition = defineSeed({
  name: '202610100411_employees_permission_sets',

  async run({ query }) {
    const now = new Date();
    for (const { set, subjects } of SETS) {
      const existing = await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', set.key)
        .executeTakeFirst();
      // An existing set is the administrator's now; neither it nor its assignments are touched again.
      if (existing) continue;
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: set.key,
          key: set.key,
          title: encodeAuthorizationTitle(set.title ?? set.key),
          grants: JSON.stringify(set.grants),
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      for (const subject of subjects) {
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values({
            id: `${subject.type}:${subject.id}:${set.key}`,
            permissionSetKey: set.key,
            subjectType: subject.type,
            subjectId: subject.id,
            createdAt: now,
            updatedAt: now,
          })
          .execute();
      }
    }
  },
});

export default seed;

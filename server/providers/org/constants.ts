import type { AuthorizationTitle } from '@nocobase/authorization/core';

/** The application's package name, which is also its client translation namespace. */
export const APP_NAMESPACE = 'nb3-oa';

/** The error domain of the organisation routes; the client translates each `reason`. */
export const ORG_DOMAIN = 'org';

/** Inherited subject type: members of a department and of every department below it. */
export const DEPARTMENT_SUBJECT = 'org.department';
/** Fixed subject type (`*`): everyone who heads an active department. */
export const DEPARTMENT_HEAD_SUBJECT = 'org.departmentHead';
/** Flat subject type: active members of an active duty role, keyed by the role code. */
export const DUTY_ROLE_SUBJECT = 'org.dutyRole';

/** Settings items gating the organisation settings pages and their endpoints (`read` and `update` each). */
export const ORG_SETTINGS = {
  departments: 'oa.org.departments',
  positions: 'oa.org.positions',
  grades: 'oa.org.grades',
  dutyRoles: 'oa.org.dutyRoles',
} as const;

export type OrgSettingsItem = (typeof ORG_SETTINGS)[keyof typeof ORG_SETTINGS];

/** The permission-workspace subsection the four settings items are listed in. */
export const ORG_SECTION = 'oa.org';

/** A translation descriptor in the application's namespace; keys live under `org.` in the client locales. */
export function label(key: string): { key: string; ns: string } {
  return { key: `org.${key}`, ns: APP_NAMESPACE };
}

export type Title = AuthorizationTitle;

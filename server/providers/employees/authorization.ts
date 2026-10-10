import {
  anyScope,
  condition,
  defineDatabasePermission,
  type AppAuthorization,
  type DatabaseScope,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  type AuthorizationTitle,
  type RecordAccessContext,
} from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';

import type { OrgService } from '../org/contract.js';
import {
  REPORTS_ACCESS,
  SELF_AND_REPORTS_ACCESS,
  type Employee,
  type EmployeeCompensation,
  type EmployeeProfile,
  type ReportingScopes,
  type ReportingScopeTarget,
} from './contract.js';
import { descendantsOf, type ReportingGraph } from './reporting-chain.js';
import {
  CONTACT_FIELDS,
  DIRECTORY_FIELDS,
  EMPLOYEE_EDITABLE_FIELDS,
  EMPLOYEE_FIELDS,
  PROFILE_BANK_FIELDS,
  PROFILE_EDITABLE_FIELDS,
  PROFILE_FIELDS,
} from './service.js';

/** The application's package name, which is its client translation namespace. */
const APP_NAMESPACE = 'nb3-oa';
const label = (key: string): AuthorizationTitle => ({
  key: `employees.authz.${key}`,
  ns: APP_NAMESPACE,
});

/** Settings item gating the 员工档案 settings page and every `/employees` HR endpoint (`read`). */
export const EMPLOYEES_SETTINGS = 'oa.employees';
/** Page id of the 通讯录 App page. */
export const DIRECTORY_PAGE = 'oa.employees.directory';

/** Flat subject type: active employees holding a position, keyed by position id. */
export const POSITION_SUBJECT = 'org.position';
/** Fixed subject type (`*`): every active employee with at least one active report. */
export const REPORTING_MANAGER_SUBJECT = 'org.reportingManager';

type EmployeeRow = Employee & Record<string, unknown>;
type ProfileRow = EmployeeProfile & Record<string, unknown>;
type CompensationRow = Omit<EmployeeCompensation, 'id'> & {
  id: number;
} & Record<string, unknown>;

const employeeRead = defineDatabasePermission((p) =>
  p
    .collection<EmployeeRow>('employees')
    .title(label('collections.employees'))
    .read([...EMPLOYEE_FIELDS]),
);
const directoryRead = defineDatabasePermission((p) =>
  p
    .collection<EmployeeRow>('employees')
    .title(label('collections.employees'))
    .read([...DIRECTORY_FIELDS]),
);
const contactRead = defineDatabasePermission((p) =>
  p
    .collection<EmployeeRow>('employees')
    .title(label('collections.employees'))
    .read([...CONTACT_FIELDS]),
);
const profileRead = defineDatabasePermission((p) =>
  p
    .collection<ProfileRow>('employeeProfiles')
    .title(label('collections.employeeProfiles'))
    .read([...PROFILE_FIELDS]),
);
const bankRead = defineDatabasePermission((p) =>
  p
    .collection<ProfileRow>('employeeProfiles')
    .title(label('collections.employeeProfiles'))
    .read([...PROFILE_BANK_FIELDS]),
);
const compensationRead = defineDatabasePermission((p) =>
  p
    .collection<CompensationRow>('employeeCompensation')
    .title(label('collections.employeeCompensation'))
    .read('*'),
);

/** 员工档案: the basic archive. HR maintains it; status changes only through flows or the administrator's correction. */
export const employeeArchive = defineCompositeResource(
  'oa.employees.archive',
  (r) =>
    r
      .title(label('archive.title'))
      .action('view', (a) =>
        a.title(label('archive.view')).grant('employees', employeeRead),
      )
      .action('manage', (a) =>
        a
          .title(label('archive.manage'))
          .grant(
            'employees',
            employeeRead
              .create([
                'id',
                'userId',
                'status',
                'active',
                'createdAt',
                'updatedAt',
                ...EMPLOYEE_EDITABLE_FIELDS,
              ])
              .update(['updatedAt', ...EMPLOYEE_EDITABLE_FIELDS]),
          ),
      )
      .action('correctStatus', (a) =>
        a
          .title(label('archive.correctStatus'))
          .grant(
            'employees',
            employeeRead.update([
              'status',
              'active',
              'lastWorkingDay',
              'updatedAt',
            ]),
          ),
      ),
);

/** 员工受控信息: identity document, address, education and bank account. */
export const employeeProfile = defineCompositeResource(
  'oa.employees.profile',
  (r) =>
    r
      .title(label('profile.title'))
      .action('view', (a) =>
        a.title(label('profile.view')).grant('employeeProfiles', profileRead),
      )
      .action('viewBank', (a) =>
        a.title(label('profile.viewBank')).grant('employeeProfiles', bankRead),
      )
      .action('update', (a) =>
        a
          .title(label('profile.update'))
          .grant(
            'employeeProfiles',
            profileRead.update(['updatedAt', ...PROFILE_EDITABLE_FIELDS]),
          ),
      ),
);

/** 薪酬: compensation rows, written only by flows. */
export const employeeCompensation = defineCompositeResource(
  'oa.employees.compensation',
  (r) =>
    r
      .title(label('compensation.title'))
      .action('view', (a) =>
        a
          .title(label('compensation.view'))
          .grant('employeeCompensation', compensationRead),
      ),
);

/** 通讯录: who works here, and separately, whose phone and email the viewer may see. */
export const employeeDirectory = defineCompositeResource(
  'oa.employees.directory',
  (r) =>
    r
      .title(label('directory.title'))
      .action('view', (a) =>
        a.title(label('directory.view')).grant('employees', directoryRead),
      )
      .action('viewContact', (a) =>
        a.title(label('directory.viewContact')).grant('employees', contactRead),
      ),
);

/** Record access registry fed by `ReportingScopes.use()` until the employees provider defines the record access. */
export function createReportingScopes(): ReportingScopes & {
  seal(): void;
} {
  const targets = new Map<string, ReportingScopeTarget>();
  let sealed = false;
  return {
    use(collection, target) {
      if (sealed)
        throw new Error(
          `Reporting scopes are already defined; call use('${collection}') from a provider's register().`,
        );
      targets.set(collection, target);
    },
    targets: () => targets,
    seal() {
      sealed = true;
    },
  };
}

function anyOf(field: string, values: readonly string[]): DatabaseScope {
  return values.length
    ? anyScope(values.map((value) => condition(field, '$eq', value)))
    : false;
}

/**
 * Defines `oa.reports` (下属（含多级）) and `oa.selfAndReports` (本人及下属) over the reporting line, for every
 * collection registered through `ReportingScopes.use()`.
 *
 * The viewer's reports are every employee below them through `managerId`, at any depth, recomputed from the database
 * on each check: a manager change moves access on the next request. An inactive viewer has no reports. An inactive
 * employee in between does not cut the line: their own reports stay with the managers above. A cycle ends the walk.
 */
export function registerReportingAccess(
  authz: AppAuthorization,
  scopes: ReturnType<typeof createReportingScopes>,
  loadGraph: () => Promise<ReportingGraph>,
): void {
  scopes.seal();
  const collections = [...scopes.targets().keys()];
  const resolver =
    (includeSelf: boolean) =>
    async ({ principal, collection }: RecordAccessContext) => {
      if (principal.type !== 'user') return false;
      const target = scopes.targets().get(collection);
      if (!target) return false;
      const graph = await loadGraph();
      const viewer = graph.byUserId.get(principal.id);
      if (!viewer || !viewer.active) {
        // Without an active archive there are no reports; "self" still matches the viewer's own records.
        if (!includeSelf) return false;
        if (target.identifies === 'user')
          return anyOf(target.field, [principal.id]);
        return viewer ? anyOf(target.field, [viewer.id]) : false;
      }
      const nodes = [
        ...(includeSelf ? [viewer] : []),
        ...descendantsOf(graph, viewer.id),
      ];
      return anyOf(
        target.field,
        nodes.map((node) =>
          target.identifies === 'user' ? node.userId : node.id,
        ),
      );
    };
  authz.recordAccess.define({
    key: REPORTS_ACCESS,
    title: label('scopes.reports'),
    description: label('scopes.reportsHint'),
    collections,
    resolve: resolver(false),
  });
  authz.recordAccess.define({
    key: SELF_AND_REPORTS_ACCESS,
    title: label('scopes.selfAndReports'),
    description: label('scopes.reportsHint'),
    collections,
    resolve: resolver(true),
  });
}

export interface SubjectDependencies {
  loadGraph: (connection?: DatabaseConnection) => Promise<ReportingGraph>;
  positionOf: (userId: string) => Promise<string | null>;
  org: () => OrgService | undefined;
}

/** Registers `org.position` and `org.reportingManager`; returns the function that removes both. */
export function registerEmployeeSubjects(
  authz: AppAuthorization,
  deps: SubjectDependencies,
): () => void {
  const activePositions = async (
    connection?: DatabaseConnection,
  ): Promise<Map<string, string>> => {
    const org = deps.org();
    if (!org) return new Map();
    const positions = await org.listPositions(connection);
    return new Map(
      positions.filter((p) => p.active).map((p) => [p.id, String(p.title)]),
    );
  };

  const releasePositions = authz.subjects.add<DatabaseConnection>(
    POSITION_SUBJECT,
    {
      async resolveFor(principal) {
        if (principal.type !== 'user') return [];
        const positionId = await deps.positionOf(principal.id);
        if (!positionId) return [];
        return (await activePositions()).has(positionId) ? [positionId] : [];
      },
      async filterActive(ids, transaction) {
        const active = await activePositions(transaction);
        return ids.filter((id) => active.has(id));
      },
      administration: {
        title: label('subjects.position'),
        selection: {
          type: 'collection',
          async list({ search, page, pageSize }) {
            const needle = search?.trim().toLowerCase();
            const items = [...(await activePositions()).entries()]
              .map(([id, title]) => ({ id, title }))
              .filter(
                (item) => !needle || item.title.toLowerCase().includes(needle),
              )
              .sort(
                (a, b) =>
                  a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
              );
            return {
              items: items.slice((page - 1) * pageSize, page * pageSize),
              total: items.length,
            };
          },
          async resolve(ids) {
            const org = deps.org();
            if (!org) return [];
            const wanted = new Set(ids);
            return (await org.listPositions())
              .filter((p) => wanted.has(p.id))
              .map((p) => ({ id: p.id, title: String(p.title) }));
          },
        },
      },
    },
  );

  const releaseManagers = authz.subjects.add<DatabaseConnection>(
    REPORTING_MANAGER_SUBJECT,
    {
      async resolveFor(principal) {
        if (principal.type !== 'user') return [];
        const graph = await deps.loadGraph();
        const viewer = graph.byUserId.get(principal.id);
        if (!viewer?.active) return [];
        return descendantsOf(graph, viewer.id).some((node) => node.active)
          ? ['*']
          : [];
      },
      filterActive: async (ids) => ids.filter((id) => id === '*'),
      administration: {
        title: label('subjects.reportingManager'),
        selection: { type: 'fixed', id: '*' },
      },
    },
  );

  return () => {
    releasePositions();
    releaseManagers();
  };
}

/** Opts the collections in, registers the composites and the settings item, and lists them in the workspace. */
export function registerEmployeeResources(authz: AppAuthorization): void {
  authz.database.collections.add({
    name: 'employees',
    title: label('collections.employees'),
  });
  authz.database.collections.add({
    name: 'employeeProfiles',
    title: label('collections.employeeProfiles'),
  });
  authz.database.collections.add({
    name: 'employeeCompensation',
    title: label('collections.employeeCompensation'),
  });

  authz.ui.sections.add({
    name: 'oa.employees',
    title: label('section'),
    parent: 'business',
  });
  authz.ui.sections.add({
    name: 'oa.employees.admin',
    title: label('section'),
    parent: 'administration',
  });

  authz.ui.place(authz.compositeResources.define(employeeArchive), {
    section: 'oa.employees',
  });
  authz.ui.place(authz.compositeResources.define(employeeProfile), {
    section: 'oa.employees',
  });
  authz.ui.place(authz.compositeResources.define(employeeCompensation), {
    section: 'oa.employees',
  });
  authz.ui.place(authz.compositeResources.define(employeeDirectory), {
    section: 'oa.employees',
  });

  authz.settings.add({
    id: EMPLOYEES_SETTINGS,
    title: label('settings'),
    actions: [{ name: 'read', title: label('settingsRead') }],
  });
  authz.ui.place(
    { type: 'settings', id: EMPLOYEES_SETTINGS },
    { section: 'oa.employees.admin' },
  );
}

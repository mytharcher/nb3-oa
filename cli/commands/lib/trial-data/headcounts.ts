import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { organizationServiceToken } from '../../../../server/providers/org/index.js';
import { headcountServiceToken } from '../../../../server/providers/headcounts/contract.js';
import { calendarServiceToken } from '../../../../server/providers/platform/index.js';
import {
  trialAccounts,
  trialEmail,
  trialUsername,
  trialPrefix,
} from './accounts.js';
export const headcountSamplePlan = {
  dataset: trialPrefix,
  scope: 'headcounts-only',
  accounts: [
    'six existing trial departments, current company year, existing trial position, limit 50',
    'engineering, next company year, existing trial position, limit 50',
    'engineering, current year, dedicated uninitialized teaching position, limit 3',
  ],
  preserves: [
    'existing initialized occupancy',
    'existing limits',
    'passwords and duties',
    'workflow progress',
  ],
  year: 'current company calendar year at execution',
};
export async function populateHeadcountSamples(
  app: Application,
  dryRun = false,
) {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    users = c.resolve(userAdministrationServiceToken),
    capacity = c.resolve(headcountServiceToken);
  const year = Number(
    c.resolve(calendarServiceToken).localDate(new Date()).slice(0, 4),
  );
  // Narrow mode requires existing exact fictional identities. Never recreate users,
  // root grants, departments, workflow records or a missing trial manifest here.
  let actorId = '';
  for (const p of trialAccounts) {
    const existing = (
      await users.list({
        search: trialEmail(p.key),
        pageSize: 100,
        kind: 'all',
      })
    ).items.find((u) => u.email === trialEmail(p.key));
    if (
      !existing ||
      existing.username !== trialUsername(p.key) ||
      existing.name !== p.name
    )
      throw new Error(
        `Existing trial identity is missing or changed: ${p.key}. Run the full trial setup separately.`,
      );
    if (p.key === 'system') actorId = existing.id;
  }
  const tree = await org.listTree(),
    position = (await org.listPositions()).find(
      (p) => p.code === `${trialPrefix}-position`,
    );
  if (!position?.active)
    throw new Error('Existing trial position is missing or inactive.');
  const departments = [
    'engineering',
    'sales',
    'hr',
    'finance',
    'administration',
    'management',
  ].map((key) => {
    const department = tree.find((d) => d.code === `${trialPrefix}-${key}`);
    if (!department?.active)
      throw new Error(
        `Existing trial department is missing or inactive: ${key}`,
      );
    return { key, department };
  });
  if (dryRun)
    return {
      year,
      plan: headcountSamplePlan,
      accounts: departments.map((d) => ({
        department: d.department.title,
        position: position.title,
        year,
        limit: 50,
      })),
      dryRun: true,
    };
  const accounts = await db.transaction((tx) =>
    capacity.within(tx, async (locked) => {
      const result: {
        id: string;
        department: string;
        position: string;
        year: number;
        initialized: boolean;
        created: boolean;
      }[] = [];
      const reason = 'OA虚构试用编制数据补充';
      async function ensure(
        key: string,
        departmentId: string,
        positionId: string,
        accountYear: number,
        limit: number,
        initialize: boolean,
      ) {
        const existing = await locked
          .repository('headcountAccounts')
          .findOne({ filter: { departmentId, positionId, year: accountYear } });
        const a =
          existing ??
          (await capacity.create(
            {
              departmentId,
              positionId,
              year: accountYear,
              limit,
              actorId,
              reason,
              requestKey: `${trialPrefix}-ledger-create-${key}-${accountYear}`,
            },
            locked,
          ));
        if (initialize && !a.initialized)
          await capacity.reconcile(
            {
              accountId: String(a.id),
              expectedVersion: Number(a.version),
              employeeIds: (await capacity.roster(String(a.id), locked)).map(
                (e) => e.id,
              ),
              actorId,
              reason,
              requestKey: `${trialPrefix}-ledger-initialize-${key}-${accountYear}`,
            },
            locked,
          );
        const b = await capacity.balance(String(a.id), locked);
        if (!b) throw new Error('Trial capacity account disappeared.');
        result.push({
          id: b.id,
          department: (await org.getDepartment(departmentId, locked))!.title,
          position: (await org.listPositions(locked)).find(
            (p) => p.id === positionId,
          )!.title,
          year: accountYear,
          initialized: b.initialized,
          created: !existing,
        });
      }
      for (const d of departments)
        await ensure(d.key, d.department.id, position!.id, year, 50, true);
      const engineering = departments.find(
        (d) => d.key === 'engineering',
      )!.department;
      await ensure(
        'engineering-next',
        engineering.id,
        position!.id,
        year + 1,
        50,
        true,
      );
      const teachingCode = `${trialPrefix}-headcounts-uninitialized`;
      const teaching =
        (await org.listPositions(locked)).find(
          (p) => p.code === teachingCode,
        ) ??
        (await org.createPosition(
          { code: teachingCode, title: '示例·待初始化岗位' },
          { actorId, reason, connection: locked },
        ));
      await ensure(
        'engineering-uninitialized',
        engineering.id,
        teaching.id,
        year,
        3,
        false,
      );
      return result;
    }),
  );
  return { year, accounts, dryRun: false };
}

import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { organizationServiceToken } from '../../../../server/providers/org/index.js';
import {
  employeeServiceToken,
  employeeModuleService,
} from '../../../../server/providers/employees/index.js';
import { budgetServiceToken } from '../../../../server/providers/budgets/contract.js';
import { headcountServiceToken } from '../../../../server/providers/headcounts/contract.js';
import { salaryGradeServiceToken } from '../../../../server/providers/job-grades/contract.js';
import { financeAssignmentServiceToken } from '../../../../server/providers/finance-assignments/contract.js';
import { leaveBalanceServiceToken } from '../../../../server/providers/leave-balances/contract.js';
import { attendanceServiceToken } from '../../../../server/providers/attendance/contract.js';
import { vendorServiceToken } from '../../../../server/providers/vendors/contract.js';
import { assetServiceToken } from '../../../../server/providers/assets/contract.js';
import { vehicleServiceToken } from '../../../../server/providers/vehicles/contract.js';
import { meetingRoomServiceToken } from '../../../../server/providers/meeting-rooms/contract.js';
import { sealServiceToken } from '../../../../server/providers/seals/contract.js';
import { personalScheduleServiceToken } from '../../../../server/providers/personal-schedules/contract.js';
import { calendarServiceToken } from '../../../../server/providers/platform/index.js';
import { attendanceManagementServiceToken } from '../../../../server/providers/attendance-management/contract.js';
import { vendorQualificationHttpServiceToken } from '../../../../server/providers/vendor-qualification/service.js';
import {
  trialAccounts,
  trialEmail,
  trialUsername,
  trialPrefix,
  type TrialRole,
} from './accounts.js';

import { passwordFor, type TrialPasswords } from './passwords.js';

export const trustedPolicy: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: false,
};
export interface TrialFacts {
  instant(date: string, time: string): string;
  users: Record<TrialRole, string>;
  employees: Record<TrialRole, string>;
  departments: Record<string, string>;
  positionId: string;
  gradeId: string;
  promotionGradeId: string;
  accountId: string;
  targetAccountId: string;
  vendorId: string;
  assetIds: string[];
  attendanceId: string;
  attendanceVersion: number;
  attendanceDate: string;
  date: string;
  year: number;
  dictionary: Record<string, string>;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export async function bootstrap(
  app: Application,
  password: string | TrialPasswords,
  baseDate?: string,
  replaceLegacyTrialDuties = false,
): Promise<TrialFacts> {
  const c = app.container;
  const db = c.resolve(databaseManagerToken);
  const users = c.resolve(userAdministrationServiceToken);
  const organization = c.resolve(organizationServiceToken);
  const employees = employeeModuleService(c.resolve(employeeServiceToken));
  const today =
    baseDate ?? c.resolve(calendarServiceToken).localDate(new Date());
  const date = addDays(today, 7);
  const instant = (value: string, time: string): string =>
    c
      .resolve(calendarServiceToken)
      .resolveLocalDateTime(value, time)
      .toISOString();
  const year = Number(date.slice(0, 4));
  // All identity/roster/resource initialization commits together. Business flows use their own public transactions.
  const facts = await db.transaction(async (tx) => {
    const ids = {} as Record<TrialRole, string>;
    for (const person of trialAccounts) {
      const existing = await tx
        .repository('user')
        .findOne({ filter: { email: trialEmail(person.key) } });
      if (
        existing &&
        (existing.username !== trialUsername(person.key) ||
          existing.name !== person.name)
      )
        throw new Error(
          `Trial identity collision for ${person.key}; no existing account will be modified.`,
        );
      ids[person.key] = existing
        ? String(existing.id)
        : (
            await users.withConnection(tx).create({
              name: person.name,
              email: trialEmail(person.key),
              username: trialUsername(person.key),
              password: passwordFor(password, person.key),
            })
          ).id;
    }
    const actorId = ids.system;
    const context = { actorId, connection: tx, reason: 'OA虚构试用数据初始化' };
    const permissions = c
      .resolve(authorizationToken)
      .permissionSets.withTransaction(tx);
    const root =
      app.config.get<string>('authorization.permissionSets.rootSet') ?? 'root';
    if (
      !(await permissions.listAssignments(root)).some(
        (entry) =>
          entry.subject.type === 'user' && entry.subject.id === actorId,
      )
    )
      await permissions.assign({
        permissionSet: root,
        subject: { type: 'user', id: actorId },
      });
    const legacyIds = new Set<string>();
    if (replaceLegacyTrialDuties) {
      const existingUsers = await tx.repository('user').findMany();
      for (const user of existingUsers)
        if (
          typeof user.email === 'string' &&
          /^oa\.test\d{3}@example\.test$/.test(user.email)
        )
          legacyIds.add(String(user.id));
      const duties = new Set(
        trialAccounts.flatMap((person) => [...person.duties]),
      );
      for (const duty of duties)
        for (const userId of await organization.listDutyRoleMembers(duty, tx))
          if (legacyIds.has(userId))
            await organization.removeDutyRoleMember(duty, userId, context);
    }
    const tree = await organization.listTree(tx);
    const departments: Record<string, string> = {};
    for (const [key, title, head] of [
      ['management', '示例·管理中心', 'gm'],
      ['engineering', '示例·研发部', 'head'],
      ['sales', '示例·销售部', 'sales'],
      ['hr', '示例·人事部', 'hrDirector'],
      ['finance', '示例·财务部', 'financeManager'],
      ['administration', '示例·行政部', 'admin2'],
    ] as const) {
      const code = `${trialPrefix}-${key}`;
      departments[key] =
        tree.find((row) => row.code === code)?.id ??
        (
          await organization.createDepartment(
            {
              title,
              code,
              managerId: ids[head],
              executiveId: ids.executive,
            },
            context,
          )
        ).id;
    }
    const positionCode = `${trialPrefix}-position`;
    const positionId =
      (await organization.listPositions(tx)).find(
        (row) => row.code === positionCode,
      )?.id ??
      (
        await organization.createPosition(
          { code: positionCode, title: '示例·业务专员' },
          context,
        )
      ).id;
    const gradeCode = `${trialPrefix}-grade`;
    const gradeId =
      (await organization.listGrades(tx)).find((row) => row.code === gradeCode)
        ?.id ??
      (
        await organization.createGrade(
          { code: gradeCode, title: '示例·专业级', rank: 2 },
          context,
        )
      ).id;
    const promotionGradeId =
      (await organization.listGrades(tx)).find(
        (row) => row.code === `${gradeCode}-senior`,
      )?.id ??
      (
        await organization.createGrade(
          { code: `${gradeCode}-senior`, title: '示例·高级专业级', rank: 3 },
          context,
        )
      ).id;
    const employeeIds = {} as Record<TrialRole, string>;
    for (const person of trialAccounts) {
      const existing = await employees.getByUserId(ids[person.key], tx);
      const manager =
        person.key === 'gm' || person.key === 'system'
          ? null
          : person.key === 'executive'
            ? employeeIds.gm
            : person.key === 'head' || person.key === 'sales'
              ? employeeIds.executive
              : person.key === 'manager'
                ? employeeIds.head
                : ['employee', 'employee2', 'probation', 'departing'].includes(
                      person.key,
                    )
                  ? employeeIds.manager
                  : employeeIds.gm;
      employeeIds[person.key] =
        existing?.id ??
        (
          await employees.createEmployee(
            {
              userId: ids[person.key],
              code: `${trialPrefix}-${person.key}`,
              name: person.name,
              status: person.key === 'probation' ? 'probation' : 'regular',
              positionId,
              gradeId,
              managerId: manager,
              hireDate: addDays(today, -60),
              careerStartDate: '2020-01-01',
              probationEndDate: addDays(today, 14),
              email: trialEmail(person.key),
              workLocation: '示例园区',
            },
            trustedPolicy,
            actorId,
            { connection: tx, reason: context.reason },
          )
        ).id;
      if (!(await organization.membershipsOf(ids[person.key], tx)).length)
        await organization.manageMember(
          {
            action: 'add',
            userId: ids[person.key],
            departmentId: departments[person.department],
            primary: true,
          },
          context,
        );
      for (const duty of person.duties)
        if (
          !(await organization.listDutyRoleMembers(duty, tx)).includes(
            ids[person.key],
          )
        )
          await organization.addDutyRoleMember(duty, ids[person.key], context);
    }
    const salary = c.resolve(salaryGradeServiceToken);
    const current = await salary.current(tx);
    if (!current.revision?.bands.some((band) => band.gradeId === gradeId))
      await salary.publish(
        {
          actorId,
          requestKey: `${trialPrefix}-salary`,
          reason: context.reason,
          expectedVersion: current.version,
          bands: [
            ...(current.revision?.bands ?? []).map(
              ({ gradeId: id, minimumCents, maximumCents }) => ({
                gradeId: id,
                minimumCents,
                maximumCents,
              }),
            ),
            { gradeId, minimumCents: 500000, maximumCents: 2000000 },
            {
              gradeId: promotionGradeId,
              minimumCents: 800000,
              maximumCents: 3000000,
            },
          ],
        },
        tx,
      );
    const dictionary: Record<string, string> = {};
    for (const type of [
      'assetCategory',
      'supplierCategory',
      'vehicleType',
      'sealType',
      'contractType',
      'officeItem',
      'expenseCategory',
      'expensePlanType',
      'paymentMethod',
      'departureType',
    ]) {
      const entry = await tx
        .repository('dictionaries')
        .findOne({ filter: { type, active: true } });
      if (!entry)
        throw new Error(
          `No active ${type} dictionary entry; trial data does not override configuration.`,
        );
      dictionary[type] = String(entry.code);
    }
    for (const departmentId of Object.values(departments)) {
      for (const subject of [
        'office',
        'equipment',
        'travel',
        'training',
        'entertainment',
      ])
        await c.resolve(budgetServiceToken).allocate(
          {
            departmentId,
            year,
            subject,
            actorId,
            deltaCents: 100000000,
            requestKey: `${trialPrefix}-budget-${departmentId}-${year}-${subject}`,
            reference: trialPrefix,
            reason: context.reason,
          },
          tx,
        );
      if (
        !(await tx
          .repository('financeAssignments')
          .findOne({ filter: { departmentId } }))
      )
        await c.resolve(financeAssignmentServiceToken).create(
          {
            departmentId,
            accountantId: ids.finance,
            actorId,
            reason: context.reason,
          },
          tx,
        );
    }
    const capacity = c.resolve(headcountServiceToken);
    const accounts: Record<string, string> = {};
    for (const key of ['engineering', 'sales']) {
      const departmentId = departments[key];
      const existing = await tx
        .repository('headcountAccounts')
        .findOne({ filter: { departmentId, positionId, year } });
      const account =
        existing ??
        (await capacity.create(
          {
            departmentId,
            positionId,
            year,
            limit: 50,
            actorId,
            requestKey: `${trialPrefix}-capacity-${key}-${year}`,
            reason: context.reason,
          },
          tx,
        ));
      accounts[key] = String(account.id);
      if (!account.initialized)
        await capacity.reconcile(
          {
            accountId: String(account.id),
            expectedVersion: Number(account.version),
            actorId,
            reason: context.reason,
            requestKey: `${trialPrefix}-reconcile-${key}-${year}`,
            employeeIds: trialAccounts
              .filter((p) => p.department === key)
              .map((p) => employeeIds[p.key]),
          },
          tx,
        );
    }
    for (const person of trialAccounts)
      await c.resolve(leaveBalanceServiceToken).grant(
        {
          employeeId: employeeIds[person.key],
          leaveType: 'annual',
          units: 20,
          actorId,
          requestKey: `${trialPrefix}-leave-${person.key}`,
          reference: trialPrefix,
          reason: context.reason,
        },
        tx,
      );
    const attendance = await c.resolve(attendanceServiceToken).ingest(
      {
        userId: ids.employee,
        date: addDays(today, -1),
        punchKind: 'in',
        punchedAt: null,
        source: trialPrefix,
        sourceKey: `${trialPrefix}-missing-punch`,
        sourceData: { fictional: true },
      },
      context,
    );
    const attendanceManagement = c.resolve(attendanceManagementServiceToken);
    const previousShift = await tx
      .repository('attendanceShifts')
      .findOne({ filter: { code: `${trialPrefix}-shift` } });
    const shiftRevisionId = previousShift
      ? String(
          (
            await tx.repository('attendanceShiftRevisions').findOne({
              filter: {
                shiftId: String(previousShift.id),
                revision: Number(previousShift.currentRevision),
              },
            })
          )?.id,
        )
      : (
          await attendanceManagement.saveShift(
            {
              code: `${trialPrefix}-shift`,
              enabled: true,
              expectedVersion: null,
              actorId: ids.hr,
              reason: context.reason,
              definition: {
                name: '示例·标准工作班次',
                timeZone: c.resolve(calendarServiceToken).timeZone(),
                intervals: [
                  {
                    start: '09:00',
                    startDayOffset: 0,
                    end: '12:00',
                    endDayOffset: 0,
                  },
                  {
                    start: '13:00',
                    startDayOffset: 0,
                    end: '18:00',
                    endDayOffset: 0,
                  },
                ],
                lateToleranceMinutes: 5,
                earlyToleranceMinutes: 5,
                absenceThresholdMinutes: 120,
              },
            },
            tx,
          )
        ).revision.id;
    for (const departmentId of Object.values(departments))
      for (const scheduleDate of [attendance.date, date])
        if (
          !(await tx.query
            .selectFrom('attendanceSchedules')
            .select('id')
            .where('departmentId', '=', departmentId)
            .where('date', '=', scheduleDate)
            .executeTakeFirst())
        )
          await attendanceManagement.saveSchedule(
            {
              departmentId,
              date: scheduleDate,
              shiftRevisionId,
              restDay: false,
              expectedVersion: null,
              actorId: ids.hr,
              reason: context.reason,
            },
            tx,
          );
    const committee = c.resolve(
      vendorQualificationHttpServiceToken,
    ).configuration;
    for (const version of await committee.versions(tx)) {
      const assignments = await committee.assignments(version.version, tx);
      for (const seat of version.seats) {
        const assignment = assignments.find((v) => v.seatKey === seat.key);
        if (
          seat.source === 'applicantHead' ||
          (assignment?.personId && !legacyIds.has(assignment.personId))
        )
          continue;
        const person =
          seat.source === 'purchasing'
            ? ids.purchasing2
            : seat.source === 'finance'
              ? ids.finance
              : seat.source === 'technical'
                ? ids.committeeTech
                : seat.source === 'legal'
                  ? ids.legal
                  : undefined;
        if (person)
          await committee.assign(
            {
              committeeVersion: version.version,
              seatKey: seat.key,
              personId: person,
              expectedVersion: assignment?.version ?? 0,
              actorId,
              reason: context.reason,
            },
            tx,
          );
      }
    }
    const existingVendor = await tx
      .repository('vendors')
      .findOne({ filter: { code: `${trialPrefix}-vendor` } });
    const vendor =
      existingVendor ??
      (await c.resolve(vendorServiceToken).create(
        {
          actorId,
          reason: context.reason,
          code: `${trialPrefix}-vendor`,
          name: '示例·办公设备供应商（虚构）',
          category: dictionary.supplierCategory,
          contactName: '示例联系人',
          contactPhone: '00000000000',
          contactEmail: 'vendor@oa-trial.example.test',
          bankName: '示例银行（不可支付）',
          bankAccount: '0000000000000000',
          bankAccountName: '虚构试用账户',
        },
        tx,
      ));
    const assetIds: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const code = `${trialPrefix}-asset-${i}`;
      const existing = await tx
        .repository('assets')
        .findOne({ filter: { code } });
      const asset =
        existing ??
        (await c.resolve(assetServiceToken).create(
          {
            actorId,
            reason: context.reason,
            code,
            category: dictionary.assetCategory,
            name: `示例·办公设备${i}`,
            serialNumber: `TRIAL-SERIAL-${i}`,
            originalValueCents: 500000,
          },
          tx,
        ));
      assetIds.push(String(asset.id));
    }
    if (
      !(await tx
        .repository('vehicles')
        .findOne({ filter: { plateNumber: 'TRIAL-001' } }))
    )
      await c.resolve(vehicleServiceToken).create(
        {
          actorId,
          reason: context.reason,
          plateNumber: 'TRIAL-001',
          name: '示例·公务车',
          vehicleType: dictionary.vehicleType,
          capacity: 7,
          status: 'active',
        },
        tx,
      );
    if (
      !(await tx
        .repository('vehicleDrivers')
        .findOne({ filter: { employeeId: employeeIds.driver } }))
    )
      await c.resolve(vehicleServiceToken).setDriver(
        {
          employeeId: employeeIds.driver,
          active: true,
          actorId,
          reason: context.reason,
        },
        tx,
      );
    if (
      !(await tx
        .repository('seals')
        .findOne({ filter: { code: `${trialPrefix}-seal` } }))
    )
      await c.resolve(sealServiceToken).saveInstance(
        {
          actorId: ids.admin,
          reason: context.reason,
          requestKey: `${trialPrefix}-seal`,
          code: `${trialPrefix}-seal`,
          name: '示例·公章',
          sealType: dictionary.sealType,
          active: true,
        },
        tx,
        trustedPolicy,
      );
    for (const requiresAdminConfirmation of [false, true]) {
      const name = requiresAdminConfirmation
        ? '示例·董事会议室'
        : '示例·团队会议室';
      const existingRoom = await tx
        .repository('meetingRooms')
        .findOne({ filter: { name } });
      const room =
        existingRoom ??
        (await c.resolve(meetingRoomServiceToken).saveRoom(
          {
            actorId: ids.admin,
            reason: context.reason,
            requestId: `${trialPrefix}-room-${requiresAdminConfirmation}`,
            name,
            capacity: 12,
            location: '示例园区一楼',
            facilities: '投影、白板',
            active: true,
            requiresAdminConfirmation,
          },
          tx,
        ));
      if (
        !(await tx.repository('meetingBookings').findOne({
          filter: {
            roomId: String(room.id),
            title: `${trialPrefix}·团队试用说明会`,
          },
        }))
      )
        await c.resolve(meetingRoomServiceToken).create(
          {
            actorId: ids.employee,
            requestId: `${trialPrefix}-booking-${requiresAdminConfirmation}`,
            roomId: String(room.id),
            title: `${trialPrefix}·团队试用说明会`,
            attendeeUserIds: [ids.employee2, ids.manager],
            date,
            startTime: '10:00',
            endTime: '11:00',
            recurrence: { frequency: 'weekly', count: 3 },
          },
          tx,
        );
    }
    for (const person of trialAccounts) {
      const title = `${trialPrefix}·${person.name}试用日程`;
      if (
        !(await tx
          .repository('personalSchedules')
          .findOne({ filter: { ownerUserId: ids[person.key], title } }))
      )
        await c.resolve(personalScheduleServiceToken).create(
          {
            title,
            description: '虚构试用数据：登录并查看待办。',
            startAt: instant(date, '09:00'),
            endAt: instant(date, '09:30'),
          },
          ids[person.key],
          tx,
          trustedPolicy,
        );
    }
    return {
      instant,
      users: ids,
      employees: employeeIds,
      departments,
      positionId,
      gradeId,
      promotionGradeId,
      accountId: accounts.engineering,
      targetAccountId: accounts.sales,
      vendorId: String(vendor.id),
      assetIds,
      attendanceId: String(attendance.id),
      attendanceVersion: attendance.version,
      attendanceDate: attendance.date,
      date,
      year,
      dictionary,
    };
  });
  for (const role of ['employee', 'employee2', 'probation'] as const) {
    const employeeId = facts.employees[role];
    const profile = await db
      .repository('employeeProfiles')
      .findOne({ filter: { employeeId } });
    if (
      !profile ||
      (!profile.bankName && !profile.bankAccount && !profile.bankAccountName)
    )
      await employees.updateProfile(
        employeeId,
        {
          bankName: '示例银行（不可支付）',
          bankAccount: '0000000000000000',
          bankAccountName: '虚构试用账户',
        },
        trustedPolicy,
        facts.users.hr,
      );
    if (
      !(await db
        .repository('employeeCompensation')
        .findOne({ filter: { employeeId, sourceApplication: trialPrefix } }))
    )
      await employees.appendCompensation(
        {
          employeeId,
          gradeId: facts.gradeId,
          baseSalary: '8000.00',
          effectiveFrom: addDays(today, -60),
          note: '虚构试用薪资',
        },
        { actorId: facts.users.hr, sourceApplication: trialPrefix },
      );
  }
  return facts;
}

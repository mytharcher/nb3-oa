// @vitest-environment node
import { it, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp } from '../org/helpers.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { createEmployee } from '../employees/helpers.js';
import {
  attendanceServiceToken,
  attendanceEvaluationServiceToken,
} from '../../../server/providers/attendance/index.js';
import { attendanceManagementServiceToken } from '../../../server/providers/attendance-management/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createWecomAttendanceService } from '../../../server/providers/wecom-attendance/service.js';
import { WecomAttendanceClient } from '../../../server/providers/wecom-attendance/client.js';
it('commits vendor-shaped data through public ingestion, replays safely and assigns overnight checkout to the preceding shift', async () => {
  const app = await startOrgTestApp();
  try {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      attendance = c.resolve(attendanceServiceToken);
    const employee = await createEmployee(
      app.testApp,
      'Synthetic WeCom employee',
    );
    const department = await app.organization.createDepartment(
      { title: 'WeCom source acceptance' },
      { actorId: employee.userId },
    );
    await app.organization.addMember(
      { departmentId: department.id, userId: employee.userId, primary: true },
      { actorId: employee.userId },
    );
    const day = '2026-10-12';
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'wecom-night',
          enabled: true,
          expectedVersion: null,
          actorId: employee.userId,
          reason: 'Synthetic night schedule',
          definition: {
            name: 'Night',
            timeZone: calendar.timeZone(),
            lateToleranceMinutes: 0,
            earlyToleranceMinutes: 0,
            absenceThresholdMinutes: 480,
            intervals: [
              {
                start: '22:00',
                startDayOffset: 0,
                end: '06:00',
                endDayOffset: 1,
              },
            ],
          },
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId: department.id,
          date: day,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: employee.userId,
          reason: 'Synthetic schedule',
        },
        tx,
      ),
    );
    const evaluator = c.resolve(attendanceEvaluationServiceToken);
    const before = await evaluator.evaluate({
      userId: employee.userId,
      date: day,
      actorId: employee.userId,
      requestKey: 'before-source',
      reason: 'Synthetic check',
    });
    expect(before.result.missingPunches).toBe(2);
    const at = (date: string, time: string) =>
      calendar.resolveLocalDateTime(date, time).getTime() / 1000;
    const data = [
      {
        userid: 'native-employee',
        checkin_type: '上班打卡',
        checkin_time: at(day, '22:15'),
        sch_checkin_time: at(day, '22:00'),
        exception_type: '迟到',
      },
      {
        userid: 'native-employee',
        checkin_type: '下班打卡',
        checkin_time: at('2026-10-13', '06:00'),
        sch_checkin_time: at('2026-10-13', '06:00'),
      },
    ];
    let calls = 0;
    let failSecondDay = true;
    const transport: typeof fetch = async (url, init) => {
      if (String(url).includes('gettoken'))
        return Response.json({ access_token: 'synthetic', expires_in: 7200 });
      calls++;
      const body = JSON.parse(String(init?.body)) as {
        starttime: number;
        endtime: number;
      };
      if (failSecondDay && body.starttime === at('2026-10-13','00:00')) return Response.json({errcode:45009});
      return Response.json({
        errcode: 0,
        checkindata: data.filter(
          (r) =>
            r.checkin_time >= body.starttime && r.checkin_time <= body.endtime,
        ),
      });
    };
    const config = {
      enabled: true,
      corpId: 'synthetic-corp',
      secret: 'synthetic-secret',
      mappings: [{ wecomUserId: 'native-employee', userId: employee.userId }],
    };
    const service = createWecomAttendanceService({
      config,
      db,
      calendar,
      management,
      attendance,
      employees: c.resolve(employeeServiceToken),
      org: c.resolve(orgServiceToken),
      audit: c.resolve(auditServiceToken),
      client: new WecomAttendanceClient(config, transport),
    });
    const input = {
      actorId: employee.userId,
      requestKey: 'vendor-run',
      startDate: day,
      endDate: '2026-10-13',
      reason: 'Synthetic vendor acceptance',
    };
    const partial = await service.sync(input);
    expect(partial).toMatchObject({ state: 'failed', committedRecords: 1, completedBatches: 1, errorCode: 'WECOM_API_REJECTED' });
    failSecondDay = false;
    const run = await service.sync(input);
    expect(run).toMatchObject({
      state: 'completed',
      committedRecords: 2,
      completedBatches: 2,
    });
    expect((await service.sync(input)).id).toBe(run.id);
    expect(calls).toBe(3);
    const records = await db
      .repository('attendanceRecords')
      .findMany({
        filter: { userId: employee.userId, source: 'wecom-checkin' },
      });
    expect(records).toHaveLength(2);
    expect(
      records.every(
        (r) => (r.sourceData as Record<string, unknown>).workDate === day,
      ),
    ).toBe(true);
    const after = await evaluator.evaluate({
      userId: employee.userId,
      date: day,
      actorId: employee.userId,
      requestKey: 'after-source',
      reason: 'Synthetic check',
    });
    expect(after.result).toMatchObject({
      missingPunches: 0,
      lateMinutes: 15,
      status: 'exception',
    });
    await expect(
      service.sync({ ...input, reason: 'changed' }),
    ).rejects.toMatchObject({ code: 'WECOM_REQUEST_CONFLICT' });
    const again = await service.sync({ ...input, requestKey: 'second-run' });
    expect(again.state).toBe('completed');
    expect(
      await db
        .repository('attendanceRecords')
        .count({
          filter: { userId: employee.userId, source: 'wecom-checkin' },
        }),
    ).toBe(2);
  } finally {
    await app.close();
  }
}, 120000);

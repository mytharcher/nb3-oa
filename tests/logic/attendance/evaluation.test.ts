import { outingServiceToken } from '../../../server/providers/outings/index.js';
// @vitest-environment node
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
import {
  attendanceEvaluationServiceToken,
  attendanceServiceToken,
} from '../../../server/providers/attendance/index.js';
import { attendanceManagementServiceToken } from '../../../server/providers/attendance-management/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
let app: OrgTestApp;
let userId: string;
let departmentId: string;
const date = '2026-10-12';
describe('main PostgreSQL immutable attendance evaluation', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken);

    userId = (await app.createUser('EvaluationEmployee')).user.id;
    departmentId = (
      await app.organization.createDepartment(
        { title: 'Evaluation department' },
        { actorId: userId },
      )
    ).id;
    await app.organization.addMember(
      { departmentId, userId },
      { actorId: userId },
    );
    await db.repository('employees').createOne({
      values: {
        id: 'evaluation-employee',
        userId,
        code: 'evaluation-employee',
        name: 'Synthetic evaluation employee',
        status: 'regular',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });
  afterAll(async () => app?.close());
  const command = (key: string) => ({
    userId,
    date,
    requestKey: key,
    actorId: userId,
    reason: 'Explicit synthetic recalculation',
  });
  it('persists blocked configuration, replays concurrently and keeps historical outputs after a schedule change', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(attendanceEvaluationServiceToken);
    expect(db.connection().dialect).toBe('postgres');
    const first = await service.evaluate(command('initial'));
    expect(first.result).toMatchObject({
      status: 'blocked',
      reasons: ['missingSchedule'],
    });
    const replays = await Promise.all([
      service.evaluate(command('initial')),
      service.evaluate(command('initial')),
    ]);
    expect(replays.map((r) => r.id)).toEqual([first.id, first.id]);
    await expect(
      service.evaluate({ ...command('initial'), reason: 'Changed meaning' }),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_EVALUATION_KEY_CONFLICT' });
    const management = c.resolve(attendanceManagementServiceToken),
      calendar = c.resolve(calendarServiceToken);
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'evaluation-day',
          definition: {
            name: 'Evaluation shift',
            timeZone: calendar.timeZone(),
            intervals: [
              {
                start: '09:00',
                startDayOffset: 0,
                end: '18:00',
                endDayOffset: 0,
              },
            ],
            lateToleranceMinutes: 5,
            earlyToleranceMinutes: 5,
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Configure synthetic day',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Configure synthetic schedule',
        },
        tx,
      ),
    );
    const next = await service.evaluate(command('missing'));
    expect(next.revision).toBe(2);
    expect(next.result).toMatchObject({
      status: 'exception',
      missingPunches: 2,
      absentMinutes: 540,
    });
    expect(
      await db
        .repository('attendanceEvaluationRevisions')
        .findOne({ filter: { id: first.id } }),
    ).toMatchObject({ result: first.result });
    await c.resolve(attendanceServiceToken).ingestBatch(
      [
        {
          userId,
          date,
          punchKind: 'in',
          punchedAt: calendar.resolveLocalDateTime(date, '09:10').toISOString(),
          source: 'synthetic',
          sourceKey: 'in',
          sourceData: {},
        },
        {
          userId,
          date,
          punchKind: 'out',
          punchedAt: calendar.resolveLocalDateTime(date, '17:50').toISOString(),
          source: 'synthetic',
          sourceKey: 'out',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    const punched = await service.evaluate(command('punched'));
    expect(punched.result).toMatchObject({
      lateMinutes: 10,
      earlyMinutes: 10,
      missingPunches: 0,
      reasons: ['late', 'early'],
    });
  });
  it('rolls revision, pointer and audit back inside a caller savepoint even when caller catches the error', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(attendanceEvaluationServiceToken);
    const count = await db.repository('attendanceEvaluationRevisions').count();
    const audit = vi
      .spyOn(c.resolve(auditServiceToken), 'record')
      .mockRejectedValueOnce(new Error('synthetic audit failure'));
    await db.transaction(async (tx) => {
      await expect(service.evaluate(command('failed'), tx)).rejects.toThrow(
        'synthetic audit failure',
      );
    });
    audit.mockRestore();
    expect(await db.repository('attendanceEvaluationRevisions').count()).toBe(
      count,
    );
    expect(
      await db.repository('attendanceEvaluations').findOne({
        filter: (f) =>
          f.and([f.string('userId').eq(userId), f.date('date').on(date)]),
      }),
    ).toMatchObject({ version: count - 1 });
  });
  it('requires current pointer and complete historical revision policy and does not trust activity rows', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(attendanceEvaluationServiceToken);
    const pointer = await db.repository('attendanceEvaluations').findOne({
      filter: (f) =>
        f.and([f.string('userId').eq(userId), f.date('date').on(date)]),
    });
    const allow: RepositoryPolicy = {
      read: true,
      create: false,
      update: false,
      delete: false,
    };
    expect(
      await service.read(
        String(pointer!.id),
        db.connection(),
        { current: allow, revision: allow },
        1,
      ),
    ).toMatchObject({ revision: 1 });
    expect(
      await service.read(
        String(pointer!.id),
        db.connection(),
        { current: { ...allow, read: false }, revision: allow },
        1,
      ),
    ).toBeUndefined();
    expect(
      await service.read(
        String(pointer!.id),
        db.connection(),
        { current: allow, revision: { ...allow, read: false } },
        1,
      ),
    ).toBeUndefined();
    const calendar = c.resolve(calendarServiceToken);
    await db.transaction((tx) =>
      c.resolve(attendanceServiceToken).recordActivity(
        {
          kind: 'untrusted-test',
          applicationId: 'unverified',
          userId,
          startAt: calendar.resolveLocalDateTime(date, '09:00').toISOString(),
          endAt: calendar.resolveLocalDateTime(date, '18:00').toISOString(),
          actorId: userId,
          now: new Date(),
        },
        tx,
      ),
    );
    const blocked = await service.evaluate(command('unverified-activity'));
    expect(blocked.result).toMatchObject({
      status: 'blocked',
      reasons: ['unverifiedActivitySource'],
      absentMinutes: 0,
    });
  });
  it('uses next-day correction facts for an overnight shift and preserves the original missing output', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      evidence = c.resolve(attendanceServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken);
    const nightDate = '2026-10-13',
      nextDate = '2026-10-14';
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'evaluation-night',
          definition: {
            name: 'Night',
            timeZone: calendar.timeZone(),
            intervals: [
              {
                start: '22:00',
                startDayOffset: 0,
                end: '06:00',
                endDayOffset: 1,
              },
            ],
            lateToleranceMinutes: 5,
            earlyToleranceMinutes: 5,
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Night fixture',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date: nightDate,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Night fixture',
        },
        tx,
      ),
    );
    const [punch] = await evidence.ingestBatch(
      [
        {
          userId,
          date: nextDate,
          punchKind: 'out',
          punchedAt: null,
          source: 'night',
          sourceKey: 'missing-out',
          sourceData: {},
        },
        {
          userId,
          date: nightDate,
          punchKind: 'in',
          punchedAt: calendar
            .resolveLocalDateTime(nightDate, '22:00')
            .toISOString(),
          source: 'night',
          sourceKey: 'in',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    await evidence.ingestBatch(
      [
        {
          userId,
          date: nextDate,
          punchKind: 'in',
          punchedAt: calendar
            .resolveLocalDateTime(nextDate, '05:00')
            .toISOString(),
          source: 'night',
          sourceKey: 'tomorrow-in',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    const initial = await evaluator.evaluate({
      ...command('night-initial'),
      date: nightDate,
    });
    expect(initial.result).toMatchObject({
      missingPunches: 1,
      status: 'exception',
    });
    await db.transaction((tx) =>
      evidence.correct(
        {
          originalId: punch.id,
          originalVersion: punch.version,
          applicationId: 'synthetic-approved-correction',
          userId,
          punchedAt: calendar
            .resolveLocalDateTime(nextDate, '06:00')
            .toISOString(),
          actorId: userId,
        },
        tx,
      ),
    );
    const corrected = await evaluator.evaluate({
      ...command('night-corrected'),
      date: nightDate,
    });
    expect(corrected.result).toMatchObject({
      status: 'normal',
      missingPunches: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
    });
    expect(corrected.snapshot.corrections).toHaveLength(1);
    expect(
      await db
        .repository('attendanceEvaluationRevisions')
        .findOne({ filter: { id: initial.id } }),
    ).toMatchObject({ result: { missingPunches: 1 } });
  });
  it('clears a calculated overnight missing out only with a punch owned by that shift', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      attendance = c.resolve(attendanceServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken);
    const nightDate = '2026-10-20',
      nextDate = '2026-10-21';
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'evaluation-night-evidence',
          definition: {
            name: 'Night evidence',
            timeZone: calendar.timeZone(),
            intervals: [
              {
                start: '22:00',
                startDayOffset: 0,
                end: '06:00',
                endDayOffset: 1,
              },
            ],
            lateToleranceMinutes: 5,
            earlyToleranceMinutes: 5,
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Night evidence fixture',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date: nightDate,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Night evidence fixture',
        },
        tx,
      ),
    );
    await attendance.ingestBatch(
      [
        {
          userId,
          date: nightDate,
          punchKind: 'in',
          punchedAt: calendar
            .resolveLocalDateTime(nightDate, '22:00')
            .toISOString(),
          source: 'synthetic-device',
          sourceKey: 'night-evidence-in',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    expect(
      (
        await evaluator.evaluate({
          ...command('night-evidence'),
          date: nightDate,
        })
      ).result,
    ).toMatchObject({ status: 'exception', missingPunches: 1 });
    // The calculated missing out belongs to the endpoint's own local date.
    const [missing] = await db
      .repository<
        import('../../../server/providers/attendance/contract.js').AttendanceRecord
      >('attendanceRecords')
      .findMany({
        filter: (f) =>
          f.and([
            f.string('userId').eq(userId),
            f.date('date').on(nextDate),
            f.string('source').eq('oa-evaluation'),
          ]),
      });
    expect(missing).toMatchObject({ punchKind: 'out' });
    expect(await attendance.isMissingEffective(missing)).toBe(true);
    const lateOut = calendar
      .resolveLocalDateTime(nextDate, '06:05')
      .toISOString();
    // A WeCom punch owned by another work date does not count for this shift.
    await attendance.ingestBatch(
      [
        {
          userId,
          date: nextDate,
          punchKind: 'out',
          punchedAt: lateOut,
          source: 'wecom-checkin',
          sourceKey: 'night-evidence-foreign-wecom',
          sourceData: { workDate: nextDate },
        },
      ],
      { actorId: userId },
    );
    expect(await attendance.isMissingEffective(missing)).toBe(true);
    await attendance.ingestBatch(
      [
        {
          userId,
          date: nextDate,
          punchKind: 'out',
          punchedAt: lateOut,
          source: 'wecom-checkin',
          sourceKey: 'night-evidence-owned-wecom',
          sourceData: { workDate: nightDate },
        },
      ],
      { actorId: userId },
    );
    expect(await attendance.isMissingEffective(missing)).toBe(false);
    expect(
      (
        await evaluator.evaluate({
          ...command('night-evidence-punched'),
          date: nightDate,
        })
      ).result,
    ).toMatchObject({ status: 'normal', missingPunches: 0 });
  });
  it('blocks unsupported multi-interval matching and refuses absent or partial current policies', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken);
    const splitDate = '2026-10-15';
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'evaluation-split',
          definition: {
            name: 'Split',
            timeZone: calendar.timeZone(),
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
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Split fixture',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date: splitDate,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Split fixture',
        },
        tx,
      ),
    );
    const revision = await evaluator.evaluate({
      ...command('split'),
      date: splitDate,
    });
    expect(revision.result).toMatchObject({
      status: 'exception',
      missingPunches: 4,
      absentMinutes: 480,
    });
    const allow: RepositoryPolicy = {
      read: true,
      create: false,
      update: false,
      delete: false,
    };
    expect(
      await evaluator.read(revision.evaluationId, db.connection(), {
        current: { ...allow, read: { scope: true, fields: ['id'] } },
        revision: allow,
      }),
    ).toBeUndefined();
    expect(
      await evaluator.read(revision.evaluationId, db.connection(), {
        current: allow,
        revision: { ...allow, read: { scope: true, fields: ['id'] } },
      }),
    ).toBeUndefined();
    await expect(
      evaluator.read(
        revision.evaluationId,
        db.connection(),
        undefined as never,
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_ACCESS_DENIED' });
  });
  it('does not substitute tomorrow out for a missing day-shift out or mix it into complete evidence', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      evidence = c.resolve(attendanceServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken);
    const dayDate = '2026-10-16',
      tomorrow = '2026-10-17';
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'evaluation-adjacent-days',
          definition: {
            name: 'Day',
            timeZone: calendar.timeZone(),
            intervals: [
              {
                start: '09:00',
                startDayOffset: 0,
                end: '18:00',
                endDayOffset: 0,
              },
            ],
            lateToleranceMinutes: 5,
            earlyToleranceMinutes: 5,
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Adjacent day fixture',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date: dayDate,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Adjacent day fixture',
        },
        tx,
      ),
    );
    await evidence.ingestBatch(
      [
        {
          userId,
          date: dayDate,
          punchKind: 'in',
          punchedAt: calendar
            .resolveLocalDateTime(dayDate, '09:00')
            .toISOString(),
          source: 'adjacent-day',
          sourceKey: 'in',
          sourceData: {},
        },
        {
          userId,
          date: tomorrow,
          punchKind: 'out',
          punchedAt: calendar
            .resolveLocalDateTime(tomorrow, '18:00')
            .toISOString(),
          source: 'adjacent-day',
          sourceKey: 'tomorrow-out',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    const missing = await evaluator.evaluate({
      ...command('adjacent-missing'),
      date: dayDate,
    });
    expect.soft(missing.result).toMatchObject({
      status: 'exception',
      missingPunches: 1,
      reasons: ['missingPunch'],
    });
    await evidence.ingestBatch(
      [
        {
          userId,
          date: dayDate,
          punchKind: 'out',
          punchedAt: calendar
            .resolveLocalDateTime(dayDate, '18:00')
            .toISOString(),
          source: 'adjacent-day',
          sourceKey: 'today-out',
          sourceData: {},
        },
      ],
      { actorId: userId },
    );
    const complete = await evaluator.evaluate({
      ...command('adjacent-complete'),
      date: dayDate,
    });
    expect(complete.result).toMatchObject({
      status: 'normal',
      missingPunches: 0,
      reasons: [],
    });
  });
  it('uses real approved outing evidence, removes withdrawn coverage, and supersedes generated missing facts with device data', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      calendar = c.resolve(calendarServiceToken),
      management = c.resolve(attendanceManagementServiceToken),
      evaluator = c.resolve(attendanceEvaluationServiceToken),
      attendance = c.resolve(attendanceServiceToken),
      outings = c.resolve(outingServiceToken);
    const managerId = (await app.createUser('AttendanceOutingManager')).user.id;
    await db.repository('employees').createOne({
      values: {
        id: 'attendance-outing-manager',
        userId: managerId,
        code: 'attendance-outing-manager',
        name: 'Synthetic manager',
        status: 'regular',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    await db.repository('employees').updateOne({
      filter: { userId },
      values: { managerId: 'attendance-outing-manager' },
    });
    let day = calendar.addCalendarDays(calendar.localDate(new Date()), 2);
    while (!calendar.isWorkday(day)) day = calendar.addCalendarDays(day, 1);
    const shift = await db.transaction((tx) =>
      management.saveShift(
        {
          code: 'approved-absence-day',
          definition: {
            name: 'Synthetic absence shift',
            timeZone: calendar.timeZone(),
            intervals: [
              {
                start: '09:00',
                startDayOffset: 0,
                end: '18:00',
                endDayOffset: 0,
              },
            ],
            lateToleranceMinutes: 5,
            earlyToleranceMinutes: 5,
            absenceThresholdMinutes: 240,
          },
          enabled: true,
          expectedVersion: null,
          actorId: userId,
          reason: 'Approved absence test',
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      management.saveSchedule(
        {
          departmentId,
          date: day,
          shiftRevisionId: shift.revision.id,
          restDay: false,
          expectedVersion: null,
          actorId: userId,
          reason: 'Approved absence test',
        },
        tx,
      ),
    );
    const startAt = calendar.resolveLocalDateTime(day, '09:00').toISOString(),
      endAt = calendar.resolveLocalDateTime(day, '18:00').toISOString();
    const draft = await outings.create(
      {
        startAt,
        endAt,
        location: 'Synthetic partner office',
        reason: 'Synthetic business visit',
      },
      userId,
    );
    const id = String(draft.record.id);
    await outings.transition(
      id,
      'submit',
      userId,
      Number(draft.record.lifecycleVersion),
      'absence-submit',
    );
    const detail = await outings.detail(id, managerId);
    const task = detail.taskActions.find((row) =>
      row.actions.some((action) => action.name === 'approve'),
    )!.task;
    await outings.action(
      id,
      {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: detail.runs.at(-1)!.run.contentHash,
        requestId: 'absence-approve',
      },
      managerId,
    );
    expect(
      (await evaluator.evaluate({ ...command('approved-absence'), date: day }))
        .result,
    ).toMatchObject({ status: 'normal', missingPunches: 0 });
    const approved = await outings.detail(id, userId);
    await outings.transition(
      id,
      'withdraw',
      userId,
      Number(approved.record.lifecycleVersion),
      'absence-withdraw',
    );
    expect(
      (await evaluator.evaluate({ ...command('withdrawn-absence'), date: day }))
        .result,
    ).toMatchObject({ status: 'exception', missingPunches: 2 });
    const missing = await db
      .repository<
        import('../../../server/providers/attendance/contract.js').AttendanceRecord
      >('attendanceRecords')
      .findMany({
        filter: (f) =>
          f.and([
            f.string('userId').eq(userId),
            f.date('date').on(day),
            f.string('source').eq('oa-evaluation'),
          ]),
      });
    expect(missing).toHaveLength(2);
    expect(await attendance.isMissingEffective(missing[0])).toBe(true);
    await attendance.ingestBatch(
      [
        {
          userId,
          date: day,
          punchKind: 'in',
          punchedAt: startAt,
          source: 'synthetic-device',
          sourceKey: 'actual-in',
          sourceData: { synthetic: true },
        },
        {
          userId,
          date: day,
          punchKind: 'out',
          punchedAt: endAt,
          source: 'synthetic-device',
          sourceKey: 'actual-out',
          sourceData: { synthetic: true },
        },
      ],
      { actorId: userId },
    );
    expect(await attendance.isMissingEffective(missing[0])).toBe(false);
    expect(
      (await evaluator.evaluate({ ...command('late-device'), date: day }))
        .result,
    ).toMatchObject({ status: 'normal', missingPunches: 0 });
  });
});

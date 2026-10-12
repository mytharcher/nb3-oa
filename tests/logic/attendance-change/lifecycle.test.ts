// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  attendanceServiceToken,
  type AttendanceService,
} from '../../../server/providers/attendance/index.ts';
import {
  attendanceChangeServiceToken,
  type AttendanceChangeService,
  type AttendanceChangeInput,
} from '../../../server/providers/attendance-change/index.ts';
import { calendarServiceToken } from '../../../server/providers/platform/index.ts';
let app: OrgTestApp;
let attendance: AttendanceService;
let service: AttendanceChangeService;
let applicant: string;
let manager: string;
async function form(key: string): Promise<AttendanceChangeInput> {
  const calendar =
    app.testApp.application.container.resolve(calendarServiceToken);
  const time = new Date(Date.now() - 60_000);
  const date = calendar.localDate(time);
  const original = await attendance.ingest(
    {
      userId: applicant,
      date,
      punchKind: 'in',
      punchedAt: null,
      source: 'test',
      sourceKey: key,
      sourceData: { device: 'preserved', raw: 'missing' },
    },
    { actorId: manager },
  );
  return {
    date,
    originalAttendanceId: original.id,
    originalVersion: original.version,
    correctionAt: time.toISOString(),
    reason: 'Device failed',
    proof: 'Supervisor saw arrival',
    attachments: [],
  };
}
async function submit(values: AttendanceChangeInput, key: string) {
  const draft = await service.create(values, applicant);
  const id = String(draft.record.id);
  await service.transition(
    id,
    'submit',
    applicant,
    Number(draft.record.lifecycleVersion),
    key,
  );
  return id;
}
async function approve(id: string) {
  const detail = await service.detail(id, manager);
  const action = detail.taskActions.find((row) =>
    row.actions.some((a) => a.name === 'approve'),
  )!;
  const run = detail.runs.find((row) => row.run.id === action.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: action.task.id },
      action: 'approve',
      contentHash: run.run.contentHash,
      requestId: `approve-${id}`,
    },
    manager,
  );
}
describe('attendance correction lifecycle', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container;
    attendance = c.resolve(attendanceServiceToken);
    service = c.resolve(attendanceChangeServiceToken);
    manager = (await app.createUser('CorrectionManager')).user.id;
    applicant = (await app.createUser('CorrectionApplicant')).user.id;
    const db = c.resolve(databaseManagerToken),
      now = new Date().toISOString();
    for (const [id, userId, managerId] of [
      ['correction-manager', manager, null],
      ['correction-applicant', applicant, 'correction-manager'],
    ])
      await db.repository('employees').createOne({
        values: {
          id,
          userId,
          managerId,
          code: id,
          name: id,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
  }, 120000);
  afterAll(async () => app?.close());
  it('applies one correction atomically while preserving original evidence and duplicate-free replay', async () => {
    const values = await form('success');
    const id = await submit(values, 'submit-success');
    await expect(
      service.runtime.fire('oa.attendanceChange', id, 'managerApproved', {
        actor: { id: manager },
      }),
    ).rejects.toThrow();
    const before = await service.detail(id, manager);
    const task = before.taskActions.find((row) =>
      row.actions.some((action) => action.name === 'approve'),
    )!.task;
    await approve(id);
    await service.action(
      id,
      {
        target: { taskId: task.id },
        action: 'approve',
        contentHash: before.runs.at(-1)!.run.contentHash,
        requestId: `approve-${id}`,
      },
      manager,
    );
    const original = await attendance.get(values.originalAttendanceId);
    expect(original).toMatchObject({
      status: 'corrected',
      punchedAt: null,
      version: 1,
      correctedByRequestId: id,
      sourceData: { device: 'preserved', raw: 'missing' },
    });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const facts = await db
      .repository('attendanceCorrections')
      .findMany({ filter: { applicationId: id } });
    expect(facts).toHaveLength(1);
    expect(facts[0]?.punchedAt).toBe(values.correctionAt);
    const audit = await db
      .repository('auditLogs')
      .findMany({ filter: { targetId: original!.id } });
    expect(audit.some((row) => row.action === 'attendance.correct')).toBe(true);
  });
  it('reserves the monthly limit with pending work and rejects changed original evidence at final approval', async () => {
    const a = await form('limit-a'),
      b = await form('limit-b');
    const id = await submit(a, 'submit-a');
    await submit(b, 'submit-b');
    const fourth = await service.create(await form('limit-c'), applicant);
    await expect(
      service.transition(
        String(fourth.record.id),
        'submit',
        applicant,
        Number(fourth.record.lifecycleVersion),
        'submit-c',
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_MONTHLY_LIMIT' });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('attendanceRecords').updateMany({
      filter: { id: a.originalAttendanceId },
      values: { version: 1 },
    });
    await expect(approve(id)).rejects.toThrow();
    expect((await service.detail(id, manager)).record.status).toBe('manager');
    expect(
      await db
        .repository('attendanceCorrections')
        .findMany({ filter: { applicationId: id } }),
    ).toHaveLength(0);
    await service.transition(
      id,
      'withdraw',
      applicant,
      Number((await service.detail(id, applicant)).record.lifecycleVersion),
      'withdraw-limit',
    );
    await service.transition(
      String(fourth.record.id),
      'submit',
      applicant,
      Number(fourth.record.lifecycleVersion),
      'submit-after-release',
    );
  });
  it('refuses stale/mismatched baseline and evidence beyond seven natural days', async () => {
    const value = await form('old');
    const calendar =
      app.testApp.application.container.resolve(calendarServiceToken);
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const oldDate = calendar.addCalendarDays(value.date, -8);
    await db.repository('attendanceRecords').updateMany({
      filter: { id: value.originalAttendanceId },
      values: { date: oldDate },
    });
    const draft = await service.create({ ...value, date: oldDate }, applicant);
    await expect(
      service.transition(
        String(draft.record.id),
        'submit',
        applicant,
        Number(draft.record.lifecycleVersion),
        'submit-old',
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_CHANGE_TOO_OLD' });
  });
});

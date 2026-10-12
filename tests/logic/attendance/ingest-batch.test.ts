// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
import {
  attendanceServiceToken,
  type AttendanceService,
  type AttendanceIngestInput,
} from '../../../server/providers/attendance/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
let app: OrgTestApp;
let service: AttendanceService;
let userId: string;
let actorId: string;
function row(key: string): AttendanceIngestInput {
  const calendar =
    app.testApp.application.container.resolve(calendarServiceToken);
  return {
    userId,
    date: calendar.localDate(new Date()),
    punchKind: 'in',
    punchedAt: null,
    source: 'batch-test',
    sourceKey: key,
    sourceData: { device: 'raw', cells: ['missing', 1] },
  };
}
describe('main attendance batch evidence integration', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    userId = (await app.createUser('BatchEmployee')).user.id;
    actorId = (await app.createUser('BatchOperator')).user.id;
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('employees').createOne({
      values: {
        id: 'batch-employee',
        userId,
        code: 'batch-employee',
        name: 'Synthetic batch employee',
        status: 'regular',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    service = app.testApp.application.container.resolve(attendanceServiceToken);
  });
  afterAll(async () => app?.close());
  it('commits ordered evidence atomically and replays equivalent JSON without another audit', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const first = await service.ingestBatch([row('first'), row('second')], {
      actorId,
    });
    expect(first.map((record) => record.sourceKey)).toEqual([
      'first',
      'second',
    ]);
    const count = await db
      .repository('auditLogs')
      .count({ filter: { action: 'attendance.ingest' } });
    const replay = await service.ingestBatch(
      [
        {
          ...row('first'),
          sourceData: { cells: ['missing', 1], device: 'raw' },
        },
        row('second'),
      ],
      { actorId },
    );
    expect(replay.map((record) => record.id)).toEqual(
      first.map((record) => record.id),
    );
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { action: 'attendance.ingest' } }),
    ).toBe(count);
    await expect(
      service.ingestBatch(
        [
          row('rollback-conflict'),
          { ...row('first'), sourceData: { device: 'different' } },
        ],
        { actorId },
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_SOURCE_CONFLICT' });
    expect(
      await db
        .repository('attendanceRecords')
        .findOne({ filter: { sourceKey: 'rollback-conflict' } }),
    ).toBeUndefined();
  });
  it('validates all identities and rows before writes and rejects unrepresentable JSON', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const spy = vi.spyOn(audit, 'record');
    for (const invalid of [
      { ...row('bad-date'), date: '2026-02-30' },
      { ...row('bad-json'), sourceData: { lost: undefined } },
      { ...row('bad-source'), source: '' },
      { ...row('bad-time'), punchedAt: '2026-10-11T09:00:00' },
    ]) {
      await expect(
        service.ingestBatch([row('not-written'), invalid], { actorId }),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_INVALID_INPUT' });
    }
    await expect(
      service.ingestBatch(
        [row('not-written'), { ...row('no-archive'), userId: actorId }],
        { actorId },
      ),
    ).rejects.toMatchObject({ code: 'ATTENDANCE_IDENTITY_UNAVAILABLE' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    expect(
      await db
        .repository('attendanceRecords')
        .findOne({ filter: { sourceKey: 'not-written' } }),
    ).toBeUndefined();
    await expect(service.ingestBatch([], { actorId })).rejects.toMatchObject({
      code: 'ATTENDANCE_INVALID_BATCH',
    });
  });
  it('bounds raw JSON and compares actual punch instants rather than database text', async () => {
    const accessor = Object.defineProperty({}, 'raw', {
      enumerable: true,
      get() {
        throw new Error('must not invoke accessor');
      },
    });
    for (const sourceData of [
      accessor,
      { huge: 'x'.repeat(65537) },
      { nonJson: NaN },
    ])
      await expect(
        service.ingestBatch([{ ...row('unsafe-json'), sourceData }], {
          actorId,
        }),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_INVALID_INPUT' });
    const input = {
      ...row('actual-punch'),
      punchedAt: new Date().toISOString(),
    };
    const [first] = await service.ingestBatch([input], { actorId });
    const [replay] = await service.ingestBatch([input], { actorId });
    expect(replay.id).toBe(first.id);
    await expect(service.ingest(input, { actorId })).resolves.toMatchObject({
      id: first.id,
    });
  });
  it('rejects own properties that JSON serialization would silently lose', async () => {
    const hiddenObject = Object.defineProperty({}, 'raw', {
      value: 'original evidence',
      enumerable: false,
    });
    const sparseWithExtra = new Array<unknown>(1);
    Object.defineProperty(sparseWithExtra, 'extra', {
      value: 'raw',
      enumerable: true,
    });
    const arrayWithHiddenExtra = ['raw'];
    Object.defineProperty(arrayWithHiddenExtra, 'extra', {
      value: 'original evidence',
      enumerable: false,
    });
    for (const sourceData of [
      hiddenObject,
      { raw: sparseWithExtra },
      { raw: arrayWithHiddenExtra },
    ]) {
      await expect(
        service.ingestBatch([{ ...row('lossy-json'), sourceData }], {
          actorId,
        }),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_INVALID_INPUT' });
      await expect(
        service.ingest({ ...row('lossy-single'), sourceData }, { actorId }),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_INVALID_INPUT' });
    }
  });
  it('rejects nonexistent punch dates and 24-hour rollover before calendar attribution', async () => {
    const calendar =
      app.testApp.application.container.resolve(calendarServiceToken);
    for (const punchedAt of ['2026-02-30T00:00:00Z', '2026-10-11T24:00:00Z']) {
      const input = {
        ...row('rollover-time'),
        date: calendar.localDate(new Date(punchedAt)),
        punchedAt,
      };
      await expect(
        service.ingestBatch([input], { actorId }),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_INVALID_INPUT' });
      await expect(service.ingest(input, { actorId })).rejects.toMatchObject({
        code: 'ATTENDANCE_INVALID_INPUT',
      });
    }
  });
  it('rolls back audit failure and participates in an enclosing transaction', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const count = await db
      .repository('auditLogs')
      .count({ filter: { action: 'attendance.ingest' } });
    const original = audit.record.bind(audit);
    let calls = 0;
    const spy = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (...args) => {
        if (++calls === 2) throw new Error('second row audit unavailable');
        return original(...args);
      });
    await expect(
      service.ingestBatch([row('audit-a'), row('audit-b')], { actorId }),
    ).rejects.toThrow('second row audit unavailable');
    spy.mockRestore();
    for (const sourceKey of ['audit-a', 'audit-b'])
      expect(
        await db
          .repository('attendanceRecords')
          .count({ filter: { sourceKey } }),
      ).toBe(0);
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { action: 'attendance.ingest' } }),
    ).toBe(count);
    await expect(
      db.transaction(async (connection) => {
        await service.ingestBatch([row('caller-a')], { actorId, connection });
        throw new Error('caller failed');
      }),
    ).rejects.toThrow('caller failed');
    expect(
      await db
        .repository('attendanceRecords')
        .findOne({ filter: { sourceKey: 'caller-a' } }),
    ).toBeUndefined();
  });
  it('rolls back a failed savepoint even if the outer caller catches and commits', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.transaction(async (connection) => {
      await expect(
        service.ingestBatch(
          [
            row('savepoint-a'),
            { ...row('first'), sourceData: { changed: true } },
          ],
          { actorId, connection },
        ),
      ).rejects.toMatchObject({ code: 'ATTENDANCE_SOURCE_CONFLICT' });
      await service.ingestBatch([row('savepoint-success')], {
        actorId,
        connection,
      });
    });
    expect(
      await db
        .repository('attendanceRecords')
        .findOne({ filter: { sourceKey: 'savepoint-a' } }),
    ).toBeUndefined();
    expect(
      await db
        .repository('attendanceRecords')
        .findOne({ filter: { sourceKey: 'savepoint-success' } }),
    ).toBeDefined();
  });
  it('preserves original evidence when replayed after a real correction', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const [first] = await service.ingestBatch([row('corrected')], { actorId });
    const punchedAt = new Date().toISOString();
    await db.transaction((tx) =>
      service.correct(
        {
          originalId: first.id,
          originalVersion: 0,
          applicationId: 'synthetic-correction',
          userId,
          punchedAt,
          actorId,
        },
        tx,
      ),
    );
    const [replay] = await service.ingestBatch([row('corrected')], { actorId });
    expect(replay).toMatchObject({
      id: first.id,
      version: 1,
      status: 'corrected',
      punchedAt: null,
      sourceData: first.sourceData,
    });
    expect(
      await db
        .repository('attendanceCorrections')
        .count({ filter: { originalId: first.id } }),
    ).toBe(1);
  });
});

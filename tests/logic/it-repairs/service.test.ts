import { writeFile } from 'node:fs/promises';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { createPlatformAppTest } from '../platform/helpers.js';
import { createEmployee, ALL } from '../employees/helpers.js';
import { createRepairService } from '../../../server/providers/it-repairs/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import {
  ruleServiceToken,
  sequenceServiceToken,
  dictionaryServiceToken,
  calendarServiceToken,
} from '../../../server/providers/platform/index.js';
const test = createPlatformAppTest();
test('draft, frozen submission, replay, concurrency, task rollback and private file slots', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    a = await createEmployee(testApp, 'Employee A'),
    leader = await createEmployee(testApp, 'Leader L');
  const deps = {
    db,
    audit: c.resolve(auditServiceToken),
    employees: c.resolve(employeeServiceToken),
    org: c.resolve(orgServiceToken),
    users: c.resolve(userAdministrationServiceToken),
    assets: c.resolve(assetServiceToken),
    calendar: c.resolve(calendarServiceToken),
    dictionaries: c.resolve(dictionaryServiceToken),
    rules: c.resolve(ruleServiceToken),
    sequences: c.resolve(sequenceServiceToken),
    files: c.resolve(serverFileRepositoryManagerToken),
    writer: c.resolve(userTaskServiceToken).registerSource('test.itRepair'),
    now: () => new Date('2026-10-30T09:00:00Z'),
    notify: async () => {},
    dispatcher: { dispatch: async () => {} },
  };
  const service = createRepairService(deps),
    cmd = () => ({ actorId: a.userId, requestKey: randomUUID() }),
    draft = {
      title: 'Network issue',
      description: 'Intermittent failure',
      category: 'network',
      impact: 'partial',
      location: 'Test office',
      contact: 'Desk 1',
      occurredAt: null,
      assetId: null,
    };
  await deps.rules.set({
    key: 'calendar.timeZone',
    value: 'Asia/Singapore',
    actorId: null,
  });
  await service.configure(
    { ...cmd(), id: 'it', expectedVersion: 0 },
    {
      id: 'it',
      title: 'IT',
      leaderIds: [leader.userId],
      engineerIds: [],
      categories: ['network'],
      active: true,
    },
  );
  const incomplete = await service.save(
    cmd(),
    { ...draft, title: '', description: '' },
    ALL,
  );
  expect(incomplete.status).toBe('draft');
  expect(incomplete.submittedAt).toBeNull();
  await expect(
    service.submit({ ...cmd(), id: incomplete.id, expectedVersion: 1 }, ALL),
  ).rejects.toThrow('INVALID_INPUT');
  const saved = await service.save(cmd(), draft, ALL),
    input = { ...cmd(), id: saved.id, expectedVersion: saved.version };
  const [one, two] = await Promise.all([
    service.submit(input, ALL),
    service.submit(input, ALL),
  ]);
  expect(one.id).toBe(two.id);
  expect(one.version).toBe(two.version);
  expect(one.status).toBe('triage');
  expect(new Date(one.responseDueAt!)).toEqual(
    new Date('2026-11-02T04:00:00Z'),
  );
  expect(new Date(one.resolutionDueAt!)).toEqual(
    new Date('2026-11-03T09:00:00Z'),
  );
  const tasks = await deps.writer.listBySourceKey(one.id, db.connection());
  expect(tasks).toHaveLength(1);
  expect(tasks[0].userId).toBe(leader.userId);
  await expect(
    service.save({ ...input }, { ...draft, title: 'Different' }, ALL),
  ).rejects.toThrow('REQUEST_CONFLICT');
  await expect(service.get(one.id, leader.userId, ALL)).resolves.toMatchObject({
    id: one.id,
  });
  const b = await createEmployee(testApp, 'Employee B');
  await expect(service.get(one.id, b.userId, ALL)).rejects.toThrow(
    'ACCESS_DENIED',
  );
  const saveRequest = cmd();
  await service.save(saveRequest, draft, ALL);
  await expect(
    service.save(saveRequest, { ...draft, title: 'Changed request' }, ALL),
  ).rejects.toThrow('REQUEST_CONFLICT');
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { targetId: one.id, action: 'itRepair.submit' } }),
  ).toBe(1);
  expect(
    await db
      .repository('itRepairCommands')
      .count({ filter: { repairId: one.id } }),
  ).toBe(2);
  await deps.calendar.setDay({ date: '2026-11-02', kind: 'holiday' }, null);
  const holidayDraft = await service.save(cmd(), draft, ALL);
  const holiday = await service.submit(
    { ...cmd(), id: holidayDraft.id, expectedVersion: 1 },
    ALL,
  );
  expect(new Date(holiday.responseDueAt!)).toEqual(
    new Date('2026-11-03T04:00:00Z'),
  );
  expect((await service.get(one.id, a.userId, ALL)).responseDueAt).toEqual(
    one.responseDueAt,
  );
  expect(new Date(holiday.resolutionDueAt!)).toEqual(
    new Date('2026-11-04T09:00:00Z'),
  );
  expect((await service.get(one.id, a.userId, ALL)).resolutionDueAt).toEqual(
    one.resolutionDueAt,
  );
  await deps.calendar.removeDay('2026-11-02', null);
  const rollback = await service.save(cmd(), draft, ALL),
    broken = createRepairService({
      ...deps,
      writer: {
        ...deps.writer,
        put: async () => {
          throw new Error('INDEX_FAILURE');
        },
      },
    });
  const rolledBackRequest = { ...cmd(), id: rollback.id, expectedVersion: 1 };
  await expect(broken.submit(rolledBackRequest, ALL)).rejects.toThrow(
    'INDEX_FAILURE',
  );
  expect(await service.get(rollback.id, a.userId, ALL)).toMatchObject({
    status: 'draft',
    version: 1,
    number: null,
  });
  expect(
    await deps.writer.listBySourceKey(rollback.id, db.connection()),
  ).toHaveLength(0);
  await expect(service.submit(rolledBackRequest, ALL)).resolves.toMatchObject({
    status: 'triage',
  });
  // The native effect survives an injected sender failure and is recovered by a new runtime.
  const runs = await service.runtime.listEffectRuns({ recordId: one.id });
  expect(runs).toHaveLength(1);
  const failedSender = createRepairService({
    ...deps,
    notify: async () => {
      throw new Error('SENDER_UNAVAILABLE');
    },
  });
  await failedSender.runtime.runEffect(runs[0].id);
  expect((await service.get(one.id, a.userId, ALL)).status).toBe('triage');
  const delivered: string[] = [];
  const restarted = createRepairService({
    ...deps,
    now: () => new Date(+deps.now() + 6000),
    notify: async (_id, _number, _recipients, key) => {
      delivered.push(key);
    },
  });
  await restarted.runtime.runEffect(runs[0].id);
  await restarted.runtime.runEffect(runs[0].id);
  expect(delivered).toHaveLength(2);
  expect(new Set(delivered).size).toBe(2);
  expect(delivered.every((key) => key.includes(one.id))).toBe(true);
  // Audit failure must undo task targets, counters, receipts, the lifecycle and uploaded storage objects.
  const auditDraft = await service.save(cmd(), draft, ALL);
  const badAudit = {
    record: async () => {
      throw new Error('AUDIT_FAILURE');
    },
  };
  const auditFailure = createRepairService({
    ...deps,
    audit: { ...deps.audit, ...badAudit },
  });
  await expect(
    auditFailure.submit(
      { ...cmd(), id: auditDraft.id, expectedVersion: 1 },
      ALL,
    ),
  ).rejects.toThrow('AUDIT_FAILURE');
  expect(await service.get(auditDraft.id, a.userId, ALL)).toMatchObject({
    status: 'draft',
    version: 1,
    number: null,
  });
  expect(
    await db.repository('oaTaskCenterTargets').count({
      filter: { sourceType: 'oa.itRepair', sourceKey: auditDraft.id },
    }),
  ).toBe(0);
  let storageKey = '';
  const wrapped = Object.create(deps.files) as typeof deps.files;
  wrapped.repository = (...args) => {
    const repository = deps.files.repository(...args);
    return new Proxy(repository, {
      get(target, property, receiver) {
        if (property === 'uploadOne')
          return async (...input: Parameters<typeof repository.uploadOne>) => {
            const result = await target.uploadOne(...input);
            storageKey = result.record.key;
            return result;
          };
        const value = Reflect.get(target, property, receiver) as unknown;
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };
  const uploadFailure = createRepairService({
    ...deps,
    files: wrapped,
    audit: { ...deps.audit, ...badAudit },
  });
  await expect(
    uploadFailure.upload(
      { ...cmd(), id: auditDraft.id, expectedVersion: 1 },
      new File(['rollback'], 'rollback.txt', { type: 'text/plain' }),
      ALL,
    ),
  ).rejects.toThrow('AUDIT_FAILURE');
  expect(
    await db
      .repository('itRepairFiles')
      .count({ filter: { repairId: auditDraft.id } }),
  ).toBe(0);
  expect(
    await c.resolve(driveManagerToken).use('local').exists(storageKey),
  ).toBe(false);
  // Keep the category name frozen and reject a currently disabled category with no submission side effects.
  await deps.dictionaries.update(
    'itRepairCategory',
    (await deps.dictionaries.get('itRepairCategory', 'network'))!.id,
    { active: false },
    null,
  );
  await expect(
    service.submit({ ...cmd(), id: auditDraft.id, expectedVersion: 1 }, ALL),
  ).rejects.toThrow('INVALID_INPUT');
  await deps.dictionaries.update(
    'itRepairCategory',
    (await deps.dictionaries.get('itRepairCategory', 'network'))!.id,
    { active: true },
    null,
  );
  await expect(
    service.save(cmd(), { ...draft, title: 'x'.repeat(121) }, ALL),
  ).rejects.toThrow('INVALID_INPUT');
  await expect(
    service.save(cmd(), { ...draft, occurredAt: '2040-01-01T00:00:00Z' }, ALL),
  ).rejects.toThrow('INVALID_INPUT');
  const files = await service.save(cmd(), draft, ALL);
  let version = files.version;
  for (let i = 0; i < 9; i++) {
    const upload = await service.upload(
      { ...cmd(), id: files.id, expectedVersion: version },
      new File(['test log'], `fault-${i}.txt`, { type: 'text/plain' }),
      ALL,
    );
    version = upload.version;
  }
  const race = await Promise.allSettled(
    [0, 1].map((i) =>
      service.upload(
        { ...cmd(), id: files.id, expectedVersion: version },
        new File(['final'], `last-${i}.txt`, { type: 'text/plain' }),
        ALL,
      ),
    ),
  );
  expect(race.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(
    await db
      .repository('itRepairFiles')
      .count({ filter: { repairId: files.id } }),
  ).toBe(10);
  await expect(
    service.upload(
      { ...cmd(), id: files.id, expectedVersion: version },
      new File(['x'.repeat(20 * 1024 * 1024 + 1)], 'too-large.log', {
        type: 'text/plain',
      }),
      ALL,
    ),
  ).rejects.toThrow('INVALID_ATTACHMENT');
  const current = await service.get(files.id, a.userId, ALL);
  await expect(
    service.upload(
      { ...cmd(), id: files.id, expectedVersion: current.version },
      new File(['extra'], 'extra.txt', { type: 'text/plain' }),
      ALL,
    ),
  ).rejects.toThrow('ATTACHMENT_LIMIT');
  await expect(
    service.upload(
      { ...cmd(), id: files.id, expectedVersion: current.version },
      new File(['<html>fake'], 'fake.png', { type: 'image/png' }),
      ALL,
    ),
  ).rejects.toThrow('INVALID_ATTACHMENT');
  expect((await service.get(files.id, a.userId, ALL)).version).toBe(
    current.version,
  );
  const largeDraft = await service.save(cmd(), draft, ALL),
    acquisitionTimes: number[] = [];
  let reached!: () => void;
  const reachedUpload = new Promise<void>((resolve) => {
    reached = resolve;
  });
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const measured = Object.create(deps.files) as typeof deps.files;
  measured.repository = (...args) => {
    const repository = deps.files.repository(...args);
    return new Proxy(repository, {
      get(target, property, receiver) {
        if (property === 'uploadOne')
          return async (...input: Parameters<typeof repository.uploadOne>) => {
            reached();
            await barrier;
            return target.uploadOne(...input);
          };
        const value = Reflect.get(target, property, receiver) as unknown;
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };
  const largeService = createRepairService({
    ...deps,
    files: measured,
    onLockAcquired: (ms) => acquisitionTimes.push(ms),
  });
  const start = performance.now(),
    large = largeService.upload(
      { ...cmd(), id: largeDraft.id, expectedVersion: 1 },
      new File(['x'.repeat(20 * 1024 * 1024)], 'boundary.log', {
        type: 'text/plain',
      }),
      ALL,
    );
  await reachedUpload;
  const competing = largeService.upload(
    { ...cmd(), id: largeDraft.id, expectedVersion: 1 },
    new File(['other'], 'other.log', { type: 'text/plain' }),
    ALL,
  );
  setTimeout(release, 50);
  const outcomes = await Promise.allSettled([large, competing]);
  expect(outcomes.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const measurement = {
    sizeMiB: 20,
    totalMs: Math.round(performance.now() - start),
    lockAcquisitionMs: acquisitionTimes.map((ms) => Math.round(ms * 10) / 10),
    controlledStorageHoldMs: 50,
  };
  if (process.env.OA_IT_REPAIR_MEASUREMENT)
    await writeFile(
      process.env.OA_IT_REPAIR_MEASUREMENT,
      JSON.stringify(measurement, null, 2),
    );
}, 60000);

test('routing recovery is bounded, repeatable and preserves frozen intake facts', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    a = await createEmployee(testApp, 'Batch employee'),
    leader = await createEmployee(testApp, 'Batch leader'),
    writer = c.resolve(userTaskServiceToken).registerSource('test.recovery');
  const service = createRepairService({
    db,
    writer,
    audit: c.resolve(auditServiceToken),
    employees: c.resolve(employeeServiceToken),
    org: c.resolve(orgServiceToken),
    users: c.resolve(userAdministrationServiceToken),
    assets: c.resolve(assetServiceToken),
    calendar: c.resolve(calendarServiceToken),
    dictionaries: c.resolve(dictionaryServiceToken),
    rules: c.resolve(ruleServiceToken),
    sequences: c.resolve(sequenceServiceToken),
    files: c.resolve(serverFileRepositoryManagerToken),
    dispatcher: { dispatch: async () => {} },
    notify: async () => {},
  });
  const cmd = () => ({ actorId: a.userId, requestKey: randomUUID() });
  const draft = await service.save(
    cmd(),
    {
      title: 'Batch fixture',
      description: 'Synthetic unassigned repairs',
      category: 'software',
      impact: 'partial',
      location: 'Test office',
      contact: '',
      occurredAt: null,
      assetId: null,
    },
    ALL,
  );
  const first = await service.submit(
    { ...cmd(), id: draft.id, expectedVersion: draft.version },
    ALL,
  );
  // Synthetic historical intake rows, each with the same validated frozen facts and distinct document identity.
  const original = await db
    .repository('itRepairs')
    .findOne({ filter: { id: first.id } });
  for (let i = 0; i < 100; i++)
    await db.repository('itRepairs').createOne({
      values: { ...original, id: randomUUID(), number: `IT-BOUND-${i}` },
    });
  const audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit);
  const facts = async () =>
    Promise.all(
      [
        'itRepairCommands',
        'oaLifecycleTransitions',
        'oaLifecycleEffectRuns',
        'userTasks',
        'auditLogs',
      ].map((name) => db.repository(name).count()),
    );
  const beforeBatch = await facts();
  let audited = 0;
  const fault = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'itRepair.refreshRouting' && ++audited === 3)
        throw Error('THIRD_RECOVERY_AUDIT');
      return record(entry, tx);
    });
  try {
    await expect(
      service.configure(
        { ...cmd(), id: 'batch', expectedVersion: 0 },
        {
          id: 'batch',
          title: 'Batch IT',
          leaderIds: [leader.userId],
          engineerIds: [],
          categories: ['software'],
          active: true,
        },
      ),
    ).rejects.toThrow('THIRD_RECOVERY_AUDIT');
  } finally {
    fault.mockRestore();
  }
  expect(audited).toBe(3);
  expect(await facts()).toEqual(beforeBatch);
  expect(
    await db.repository('itRepairGroups').findOne({ filter: { id: 'batch' } }),
  ).toBeUndefined();
  expect(
    await db
      .repository('itRepairs')
      .count({
        filter: { status: 'triage', groupId: null, category: 'software' },
      }),
  ).toBe(101);
  const configured = await service.configure(
    { ...cmd(), id: 'batch', expectedVersion: 0 },
    {
      id: 'batch',
      title: 'Batch IT',
      leaderIds: [leader.userId],
      engineerIds: [],
      categories: ['software'],
      active: true,
    },
  );
  expect(configured.recovery).toEqual({ processed: 5, hasMore: true });
  expect(
    await db.repository('itRepairs').count({
      filter: { status: 'triage', groupId: null, category: 'software' },
    }),
  ).toBe(96);
  for (let batch = 0; batch < 19; batch++) {
    expect(
      await service.recoverRouting({
        ...cmd(),
        id: 'batch',
        expectedVersion: 1,
      }),
    ).toEqual({ processed: 5, hasMore: true });
  }
  const recovery = { ...cmd(), id: 'batch', expectedVersion: 1 };
  expect(await service.recoverRouting(recovery)).toEqual({
    processed: 1,
    hasMore: false,
  });
  const receiptCount = await db.repository('itRepairCommands').count();
  expect(await service.recoverRouting(recovery)).toEqual({
    processed: 1,
    hasMore: false,
  });
  expect(await db.repository('itRepairCommands').count()).toBe(receiptCount);
  expect(
    await service.recoverRouting({ ...cmd(), id: 'batch', expectedVersion: 1 }),
  ).toEqual({ processed: 0, hasMore: false });
  const repaired = await service.get(first.id, a.userId, ALL);
  expect(repaired.groupId).toBe('batch');
  for (const key of [
    'number',
    'submittedAt',
    'responseDueAt',
    'resolutionDueAt',
    'calendarSnapshot',
    'ruleSnapshot',
  ])
    expect(repaired[key]).toEqual(first[key]);
  expect(await writer.listBySourceKey(first.id, db.connection())).toHaveLength(
    1,
  );
}, 60000);

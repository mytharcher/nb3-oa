// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../../../server/providers/platform/index.js';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.js';
import { createAssetService } from '../../../server/providers/assets/service.js';
import { createAssetRequestService } from '../../../server/providers/asset-requests/service.js';
import { ASSET_REQUEST_LIFECYCLE } from '../../../server/providers/asset-requests/contract.js';
const test = createEmployeesAppTest();
test('actual SDK claim/complete and stock issue/return share rollback, and real caller transaction sees clearance', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    org = c.resolve(organizationServiceToken),
    dictionaries = c.resolve(dictionaryServiceToken);
  const owner = await createEmployee(testApp, 'Asset flow owner'),
    head = await createEmployee(testApp, 'Asset flow head'),
    handler = await createEmployee(testApp, 'Asset flow handler');
  const department = await org.createDepartment(
    { title: 'Asset flow department', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('admin', handler.userId, {
    actorId: head.userId,
  });
  const assets = createAssetService({
    audit,
    dictionaries,
    source: { intent: (...args) => service.stockSource.intent(...args) },
  });
  const service = createAssetRequestService({
    users: c.resolve(userAdministrationServiceToken),
    db,
    audit,
    org,
    dictionaries,
    assets,
    employees: c.resolve(employeeServiceToken),
    directory: c.resolve(approvalDirectoryServiceToken),
    calendar: c.resolve(calendarServiceToken),
    rules: c.resolve(ruleServiceToken),
    sequences: c.resolve(sequenceServiceToken),
    notifications: c.resolve(approvalNotificationServiceToken),
    validatePhotos: async (record) => {
      if (record.photos.length)
        throw new Error('Secure photo adapter is required');
    },
  });
  const category = (await dictionaries.list('assetCategory'))[0]!.code;
  const asset = await db.transaction((tx) =>
    assets.create(
      {
        code: randomUUID(),
        category,
        name: 'Actual borrowed laptop',
        serialNumber: 'REAL-001',
        originalValueCents: 12345,
        actorId: handler.userId,
        reason: 'Receipt',
      },
      tx,
    ),
  );
  const secondAsset = await db.transaction((tx) =>
    assets.create(
      {
        code: randomUUID(),
        category,
        name: 'Second actual borrowed unit',
        serialNumber: 'REAL-002',
        originalValueCents: 23456,
        actorId: handler.userId,
        reason: 'Receipt',
      },
      tx,
    ),
  );
  const record = await service.create(
    owner.userId,
    {
      operation: 'borrow',
      category,
      assetIds: [asset.id, secondAsset.id],
      quantity: 2,
      purpose: 'Work',
      borrowDueDate: '2030-01-01',
      scrapReason: '',
      photos: [],
    },
    'flow-create',
  );
  const id = String(record.id);
  expect(
    (
      await service.create(
        owner.userId,
        {
          operation: 'borrow',
          category,
          assetIds: [asset.id, secondAsset.id],
          quantity: 2,
          purpose: 'Work',
          borrowDueDate: '2030-01-01',
          scrapReason: '',
          photos: [],
        },
        'flow-create',
      )
    ).id,
  ).toBe(id);
  await service.act(id, owner.userId, 'submit', {
    lifecycleVersion: Number(record.lifecycleVersion),
    requestId: 'flow-submit',
  });
  async function action(
    actorId: string,
    name: string,
    requestId: string,
    input?: { units: { assetId: string; serialNumber: string }[] },
  ) {
    const views = await service.approvals.runViewsFor(
        ASSET_REQUEST_LIFECYCLE,
        id,
      ),
      view = views.at(-1)!;
    const offers = await service.approvals.actionsFor(
      ASSET_REQUEST_LIFECYCLE,
      id,
      { id: actorId },
    );
    const task = offers.find((offer) =>
      offer.actions.some((action) => action.name === name),
    )?.task;
    expect(task).toBeTruthy();
    return service.action(id, actorId, {
      actor: { id: actorId },
      target: { taskId: task!.id },
      action: name,
      contentHash: view.run.contentHash,
      requestId,
      comment: requestId.startsWith('return-')
        ? 'All physical units received and checked'
        : undefined,
      input,
    });
  }
  await action(head.userId, 'approve', 'head-approved');
  expect((await service.get(id))!.status).toBe('issuing');
  await action(handler.userId, 'claim', 'claim-issue');
  const units = [
    { assetId: asset.id, serialNumber: 'REAL-001' },
    { assetId: secondAsset.id, serialNumber: 'REAL-002' },
  ];
  await expect(
    action(handler.userId, 'complete', 'partial-issue', { units: [units[0]!] }),
  ).rejects.toMatchObject({ code: 'ASSET_UNITS_INCOMPLETE' });
  expect((await service.get(id))!.status).toBe('issuing');
  expect(
    await db.repository('assetIssueFacts').count({ filter: { sourceId: id } }),
  ).toBe(0);
  expect(
    await db.repository('assetActiveHolds').count({ filter: { sourceId: id } }),
  ).toBe(2);
  const original = audit.record.bind(audit),
    spy = vi.spyOn(audit, 'record').mockImplementation(async (entry, tx) => {
      if (entry.action === 'asset.issue') throw new Error('Issue audit outage');
      return original(entry, tx);
    });
  try {
    await expect(
      action(handler.userId, 'complete', 'issue-complete', { units }),
    ).rejects.toThrow('Issue audit outage');
  } finally {
    spy.mockRestore();
  }
  expect((await service.get(id))!.status).toBe('issuing');
  expect((await assets.stockFacts(id, db.connection())).issued).toHaveLength(0);
  expect((await assets.stockFacts(id, db.connection())).held).toHaveLength(2);
  await action(handler.userId, 'complete', 'issue-complete', { units });
  expect((await service.get(id))!.status).toBe('returning');
  await db.transaction(async (tx) => {
    await expect(
      assets.assertAllReturned(owner.employeeId, tx),
    ).rejects.toThrow();
  });
  await action(handler.userId, 'claim', 'claim-return');
  await expect(
    action(handler.userId, 'complete', 'missing-receipt-reason', { units }),
  ).rejects.toMatchObject({ code: 'REASON_REQUIRED' });
  await expect(
    action(handler.userId, 'complete', 'return-partial', {
      units: [units[0]!],
    }),
  ).rejects.toMatchObject({ code: 'ASSET_UNITS_INCOMPLETE' });
  expect((await service.get(id))!.status).toBe('returning');
  expect(
    await db.repository('assetReturnFacts').count({ filter: { sourceId: id } }),
  ).toBe(0);
  await action(handler.userId, 'complete', 'return-complete', { units });
  expect((await service.get(id))!.status).toBe('returned');
  await db.transaction((tx) => assets.assertAllReturned(owner.employeeId, tx));
  expect(await assets.get(asset.id, db.connection())).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
  });
  const useUnits = [units[0]!];
  const use = await service.create(
    owner.userId,
    {
      operation: 'use',
      category,
      assetIds: [asset.id],
      quantity: 1,
      purpose: 'Permanent desk',
      borrowDueDate: null,
      scrapReason: '',
      photos: [],
    },
    'use-create',
  );
  const useId = String(use.id);
  await service.act(useId, owner.userId, 'submit', {
    lifecycleVersion: Number(use.lifecycleVersion),
    requestId: 'use-submit',
  });
  async function permanentUseAction(
    actorId: string,
    name: string,
    comment?: string,
    input?: { units: { assetId: string; serialNumber: string }[] },
  ) {
    const offers = await service.approvals.actionsFor(
        ASSET_REQUEST_LIFECYCLE,
        useId,
        { id: actorId },
      ),
      task = offers.find((o) => o.actions.some((a) => a.name === name))?.task;
    expect(task).toBeTruthy();
    const view = (
      await service.approvals.runViewsFor(ASSET_REQUEST_LIFECYCLE, useId)
    ).at(-1)!;
    return service.action(useId, actorId, {
      actor: { id: actorId },
      target: { taskId: task!.id },
      action: name,
      requestId: randomUUID(),
      contentHash: view.run.contentHash,
      comment,
      input,
    });
  }
  await permanentUseAction(head.userId, 'approve');
  await permanentUseAction(handler.userId, 'claim');
  await permanentUseAction(
    handler.userId,
    'unable',
    'Inventory condition changed',
  );
  const currentAsset = await assets.get(asset.id, db.connection());
  await db.transaction((tx) =>
    assets.update(
      asset.id,
      {
        version: currentAsset!.version,
        name: 'Inventory corrected after review',
        actorId: handler.userId,
        reason: 'Correct condition',
      },
      tx,
    ),
  );
  const exception = await service.get(useId);
  await service.act(useId, owner.userId, 'submit', {
    lifecycleVersion: Number(exception!.lifecycleVersion),
    requestId: 'baseline-resubmit',
  });
  expect((await service.get(useId))!.status).toBe('head');
  // Reuse of a previous head approval must not hide the new inventory baseline.
  await permanentUseAction(head.userId, 'approve');
  await permanentUseAction(handler.userId, 'claim');
  await permanentUseAction(handler.userId, 'complete', undefined, {
    units: useUnits,
  });
  expect((await service.get(useId))!.status).toBe('issued');
  expect((await service.get(useId))!.allocation![0]).not.toHaveProperty(
    'originalValueCents',
  );
  const restrictedDetail = await service.detail(useId, owner.userId, {
    read: {
      scope: true,
      fields: [
        'id',
        'applicantId',
        'createdById',
        'status',
        'lifecycleVersion',
      ],
    },
    create: false,
    update: false,
    delete: false,
  });
  expect(restrictedDetail.record).not.toHaveProperty('originalValueCents');
  expect(restrictedDetail.view).not.toHaveProperty('record');
  const visibleJson = JSON.stringify(restrictedDetail);
  for (const field of [
    'originalValueCents',
    'photos',
    'purpose',
    'allocation',
    'handlingUnits',
    'ruleSnapshot',
  ])
    expect(visibleJson).not.toContain(`"${field}":`);
  await expect(
    service.returnIssued(
      useId,
      owner.userId,
      {
        units: useUnits,
        reason: 'Return received',
        requestId: 'denied-admin-return',
      },
      { read: true, create: false, update: true, delete: false },
    ),
  ).rejects.toMatchObject({ code: 'ASSET_RETURN_FORBIDDEN' });
  await service.returnIssued(
    useId,
    handler.userId,
    {
      units: useUnits,
      reason: 'Returned to inventory',
      requestId: 'real-admin-return',
    },
    { read: true, create: false, update: true, delete: false },
  );
  await db.transaction((tx) => assets.assertAllReturned(owner.employeeId, tx));
});

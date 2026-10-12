// @vitest-environment node
import { expect, vi } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { createAssetRequestsAppTest } from './helpers.js';
import { createEmployee, composite } from '../employees/helpers.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { assetRequestServiceToken } from '../../../server/providers/asset-requests/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createAssetRequestsAppTest();
test('scrap uses real any votes and exact frozen yuan threshold, with final SDK answer and disposal audit in one transaction', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    authz = c.resolve(authorizationToken),
    assets = c.resolve(assetServiceToken),
    service = c.resolve(assetRequestServiceToken),
    audit = c.resolve(auditServiceToken);
  const owner = await createEmployee(testApp, 'Scrap inventory administrator'),
    head = await createEmployee(testApp, 'Scrap head'),
    admin1 = await createEmployee(testApp, 'Scrap appraisal one'),
    admin2 = await createEmployee(testApp, 'Scrap appraisal two'),
    finance1 = await createEmployee(testApp, 'Scrap finance one'),
    finance2 = await createEmployee(testApp, 'Scrap finance two'),
    gm = await createEmployee(testApp, 'Scrap GM');
  const dept = await org.createDepartment(
    { title: 'Scrap department', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: dept.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  for (const person of [owner, admin1, admin2])
    await org.addDutyRoleMember('admin', person.userId, {
      actorId: head.userId,
    });
  for (const person of [finance1, finance2])
    await org.addDutyRoleMember('finance', person.userId, {
      actorId: head.userId,
    });
  await org.addDutyRoleMember('gm', gm.userId, { actorId: head.userId });
  await authz.permissionSets.create({
    key: 'scrap-photos',
    title: 'Scrap photos',
    grants: [
      composite('oa.assetRequests', {
        view: { assetRequests: 'oa.assetRequestsOwned' },
        edit: { assetRequests: 'oa.assetRequestsOwned' },
      }),
    ],
  });
  await authz.permissionSets.assign({
    permissionSet: 'scrap-photos',
    subject: { type: 'user', id: owner.userId },
  });
  const category = (
      await c.resolve(dictionaryServiceToken).list('assetCategory')
    )[0]!.code,
    session = await owner.session();
  const read = { read: true, create: false, update: false, delete: false };
  async function setup(cents: number, index: number) {
    const asset = await db.transaction((tx) =>
      assets.create(
        {
          code: `SCRAP-${index}`,
          category,
          name: 'Damaged unit',
          serialNumber: `SCRAP-SERIAL-${index}`,
          originalValueCents: cents,
          actorId: owner.userId,
          reason: 'Receipt',
        },
        tx,
      ),
    );
    const proposal = {
      operation: 'scrap' as const,
      category: null,
      assetIds: [asset.id],
      quantity: 1,
      purpose: 'Dispose safely',
      borrowDueDate: null,
      scrapReason: 'Irreparable damage',
      photos: [],
    };
    const record = await service.create(
      owner.userId,
      proposal,
      `scrap-create-${index}`,
    );
    const body = new FormData();
    body.set(
      'file',
      new File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])],
        'damage.png',
        { type: 'image/png' },
      ),
    );
    const upload = await session.fetch('/assetRequestPhotos/uploadOne', {
      method: 'POST',
      headers: { origin: OA_TEST_ORIGIN, 'x-asset-request-id': record.id! },
      body,
    });
    expect(upload.status).toBe(201);
    const photo = (await upload.json()).data.record;
    const edited = await service.edit(record.id!, owner.userId, {
      ...proposal,
      photos: [photo.id],
      lifecycleVersion: record.lifecycleVersion!,
      requestId: `scrap-photo-${index}`,
    });
    await service.act(record.id!, owner.userId, 'submit', {
      lifecycleVersion: edited.lifecycleVersion!,
      requestId: `scrap-submit-${index}`,
    });
    return { asset, id: record.id! };
  }
  async function answer(
    id: string,
    person: typeof owner,
    name: string,
    key: string,
    comment?: string,
    input?: { data: { appraisalOpinion: string } },
  ) {
    const detail = await service.detail(id, person.userId, read),
      group = detail.taskActions.find((item) =>
        item.actions.some((offer) => offer.name === name),
      );
    expect(group).toBeTruthy();
    return service.action(id, person.userId, {
      target: { taskId: group!.task.id },
      action: name,
      actor: { id: person.userId },
      requestId: key,
      contentHash: detail.runs.at(-1)!.run.contentHash,
      comment,
      input,
    });
  }
  const boundary = await setup(1_000_000, 1);
  expect((await service.get(boundary.id))?.needsGm).toBe(false);
  await answer(boundary.id, head, 'approve', 'scrap-head-one');
  await answer(
    boundary.id,
    admin1,
    'reject',
    'appraisal-one-reject',
    'Not convinced',
  );
  expect((await service.get(boundary.id))?.status).toBe('appraisal');
  await answer(
    boundary.id,
    admin2,
    'approve',
    'appraisal-two-approve',
    undefined,
    { data: { appraisalOpinion: 'Irreparable damage confirmed' } },
  );
  await answer(
    boundary.id,
    finance1,
    'reject',
    'finance-one-reject',
    'Need care',
  );
  expect((await service.get(boundary.id))?.status).toBe('finance');
  const nativeAudit = audit.record.bind(audit),
    failure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'asset.scrap')
          throw new Error('Disposal audit failure');
        return nativeAudit(entry, tx);
      });
  await expect(
    answer(boundary.id, finance2, 'approve', 'finance-final-retry'),
  ).rejects.toThrow('Disposal audit failure');
  failure.mockRestore();
  expect((await service.get(boundary.id))?.status).toBe('finance');
  expect((await assets.get(boundary.asset.id, db.connection()))?.status).toBe(
    'available',
  );
  expect(
    await db
      .repository('assetDisposalFacts')
      .count({ filter: { sourceId: boundary.id } }),
  ).toBe(0);
  expect(
    await db
      .repository('assetActiveHolds')
      .count({ filter: { sourceId: boundary.id } }),
  ).toBe(1);
  await answer(boundary.id, finance2, 'approve', 'finance-final-retry');
  expect((await service.get(boundary.id))?.status).toBe('scrapped');
  expect((await assets.get(boundary.asset.id, db.connection()))?.status).toBe(
    'scrapped',
  );
  expect(
    await db
      .repository('assetDisposalFacts')
      .count({ filter: { sourceId: boundary.id } }),
  ).toBe(1);
  const above = await setup(1_000_001, 2);
  expect((await service.get(above.id))?.needsGm).toBe(true);
  await answer(above.id, head, 'approve', 'scrap-head-two');
  await answer(above.id, admin1, 'approve', 'scrap-appraisal-two', undefined, {
    data: { appraisalOpinion: 'Inspected physical damage' },
  });
  await answer(above.id, finance1, 'approve', 'scrap-finance-two');
  expect((await service.get(above.id))?.status).toBe('gm');
  expect((await assets.get(above.asset.id, db.connection()))?.status).toBe(
    'available',
  );
  await answer(
    above.id,
    gm,
    'reject',
    'scrap-gm-rejected',
    'Keep for recovery',
  );
  expect((await service.get(above.id))?.status).toBe('rejected');
  expect((await assets.get(above.asset.id, db.connection()))?.status).toBe(
    'available',
  );
  expect(
    await db
      .repository('assetActiveHolds')
      .count({ filter: { sourceId: above.id } }),
  ).toBe(0);
  const approvedAbove = await setup(1_000_001, 3);
  await answer(approvedAbove.id, head, 'approve', 'scrap-head-three');
  await answer(
    approvedAbove.id,
    admin1,
    'approve',
    'scrap-appraisal-three',
    undefined,
    {
      data: { appraisalOpinion: 'Inspected physical damage' },
    },
  );
  await answer(approvedAbove.id, finance1, 'approve', 'scrap-finance-three');
  expect((await service.get(approvedAbove.id))?.status).toBe('gm');
  await answer(approvedAbove.id, gm, 'approve', 'scrap-gm-approved');
  expect((await service.get(approvedAbove.id))?.status).toBe('scrapped');
  expect(
    (await assets.get(approvedAbove.asset.id, db.connection()))?.status,
  ).toBe('scrapped');
  expect(
    await db
      .repository('assetDisposalFacts')
      .count({ filter: { sourceId: approvedAbove.id } }),
  ).toBe(1);
  expect(
    await db
      .repository('assetActiveHolds')
      .count({ filter: { sourceId: approvedAbove.id } }),
  ).toBe(0);
}, 60_000);

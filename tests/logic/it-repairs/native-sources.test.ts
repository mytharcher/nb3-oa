import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { offeredActions } from '@nocobase/app-plugin-approval/client';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee, grantToUser } from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.js';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.js';
import { purchaseServiceToken } from '../../../server/providers/purchases/service.js';
import { purchaseOrderServiceToken } from '../../../server/providers/purchases/contract.js';
import { expensePlanServiceToken } from '../../../server/providers/expense-plan/service.js';
import { purchaseQuoteBasis } from '../../../server/providers/purchases/quotes.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'p'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
async function setup(
  testApp: Parameters<typeof prepareRepairs>[0],
  category: string,
) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    f = await prepareRepairs(testApp),
    e1 = await createEmployee(testApp, 'Native source E1'),
    finance = await createEmployee(testApp, 'Native finance'),
    buyer = await createEmployee(testApp, 'Native buyer'),
    authz = c.resolve(authorizationToken);
  for (const [p, role] of [
    [f.a, 'employee'],
    [f.leader, 'leader'],
    [e1, 'engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-handling-${role}`,
      subject: { type: 'user', id: p.userId },
    });
  await grantToUser(
    testApp,
    `source-views-${category}`,
    [
      {
        resource: { type: 'composite', id: 'oa.purchase' },
        actions: [{ action: 'view' }],
      },
      {
        resource: { type: 'composite', id: 'oa.expensePlan' },
        actions: [{ action: 'view' }],
      },
    ],
    f.leader.userId,
  );
  await grantToUser(
    testApp,
    `buyer-views-${category}`,
    [
      {
        resource: { type: 'composite', id: 'oa.purchase' },
        actions: [{ action: 'view' }],
      },
    ],
    buyer.userId,
  );
  const departmentId = randomUUID();
  await db.repository('departments').createOne({
    values: {
      id: departmentId,
      title: 'Source fixture department',
      managerId: f.leader.userId,
      executiveId: f.leader.userId,
      active: true,
    },
  });
  await c
    .resolve(organizationServiceToken)
    .addMember(
      { departmentId, userId: f.a.userId, primary: true },
      { actorId: f.admin.userId },
    );
  for (const [person, role] of [
    [finance, 'finance'],
    [buyer, 'purchasing'],
    [f.admin, 'admin'],
  ] as const)
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: randomUUID(),
        dutyRoleCode: role,
        userId: person.userId,
        active: true,
      },
    });
  await db.transaction((tx) =>
    c.resolve(budgetServiceToken).allocate(
      {
        departmentId,
        year: new Date().getFullYear(),
        subject: 'office',
        deltaCents: 10000000,
        reference: 'source-fixture',
        requestKey: randomUUID(),
        actorId: finance.userId,
        reason: 'Synthetic annual budget',
      },
      tx,
    ),
  );
  const systemAdmin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const a = await f.a.session(),
    l = await f.leader.session(),
    s = await f.admin.session(),
    bs = await buyer.session();
  expect(
    (
      await s.fetch(
        `/itRepairs/groups/native-${category}`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          title: 'Source IT',
          leaderIds: [f.leader.userId],
          engineerIds: [e1.userId],
          categories: [category],
          active: true,
        }),
      )
    ).status,
  ).toBe(200);
  const saved = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', {
          requestKey: randomUUID(),
          draft: {
            title: 'Native source repair',
            description: 'Public fault',
            category,
            impact: 'partial',
            location: 'Lab',
            contact: '',
            occurredAt: null,
            assetId: null,
          },
        }),
      )
    ).json()
  ).data as Repair;
  let repair = (
    await (
      await a.fetch(
        `/itRepairs/${saved.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: saved.version,
        }),
      )
    ).json()
  ).data as Repair;
  const svc = c.resolve(repairServiceToken),
    purchase = c.resolve(purchaseServiceToken),
    expense = c.resolve(expensePlanServiceToken);
  let offset = 0;
  const refresh = async () => {
    repair = (await (await l.fetch(`/itRepairs/${repair.id}`)).json())
      .data as Repair;
  };
  const link = async (kind: string, sourceId: string) => {
    await refresh();
    const r = await l.fetch(
      `/itRepairs/${repair.id}/actions`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: repair.version,
        action: 'link',
        data: { kind, sourceId, reason: 'Follow native owner' },
      }),
    );
    expect(r.status).toBe(200);
    repair = (await r.json()).data as Repair;
  };
  const sweep = async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      offset += 61000;
      vi.setSystemTime(Date.now() + offset);
      await svc.tick();
    } finally {
      vi.useRealTimers();
    }
    await refresh();
  };
  const action = async (
    owner: typeof purchase | typeof expense,
    id: string,
    actor: string,
    name = 'approve',
    input?: Record<string, unknown>,
  ) => {
    const detail = await owner.detail(id, actor),
      offers = offeredActions(
        detail.taskActions,
        detail.runActions,
        detail.runs.map((r) => r.run),
      ),
      offer = offers.find((x) => x.name === name);
    expect(offer).toBeDefined();
    const run = detail.runs.find((r) =>
      'runId' in offer!.target
        ? r.run.id === offer!.target.runId
        : r.tasks.some((t) => t.id === offer!.target.taskId),
    )!;
    await owner.action(
      id,
      {
        target: offer!.target,
        action: name,
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        ...(input ? { input } : {}),
        ...(name === 'reject' ? { comment: 'Rejected synthetic source' } : {}),
      },
      actor,
    );
  };
  const events = async () =>
    db
      .repository('itRepairEvents')
      .findMany({ filter: { repairId: repair.id, type: 'sourceChange' } });
  return {
    c,
    db,
    f,
    adminId: systemAdmin.user.id,
    e1,
    finance,
    buyer,
    a,
    l,
    bs,
    purchase,
    expense,
    repair,
    link,
    sweep,
    action,
    events,
  };
}
test('V25 native purchase approval, real quote upload and receipt follow-up never close a repair or leak money', async ({
  testApp,
}) => {
  const h = await setup(testApp, 'network'),
    { c, db, f, finance, buyer, bs, purchase, link, sweep, action, events } = h;
  const draft = await purchase.create(
    {
      items: [
        {
          id: 'cable',
          name: 'Cable',
          specification: 'Ethernet',
          quantity: '1',
          unit: 'piece',
        },
      ],
      purpose: 'PRIVATE-SOURCE-PURPOSE',
      estimatedCents: 10000,
      subject: 'office',
      expectedDate: '2026-11-12',
      suggestedVendorId: null,
    },
    f.a.userId,
    f.a.userId,
  );
  const id = String(draft.record.id);
  await purchase.transition(
    id,
    'submit',
    f.a.userId,
    Number(draft.record.lifecycleVersion),
    randomUUID(),
  );
  await link('purchase', id);
  await action(purchase, id, f.leader.userId);
  await action(purchase, id, buyer.userId, 'claim');
  const current = await purchase.detail(id, buyer.userId),
    quotes: { vendorId: string; attachmentIds: string[] }[] = [];
  // Quote evidence is uploaded through the owner's guarded native File Repository, not inserted as approved facts.
  for (let i = 0; i < 3; i++) {
    const vendor = await db.transaction((tx) =>
      c.resolve(vendorServiceToken).create(
        {
          code: randomUUID(),
          name: `PRIVATE-VENDOR-${i}`,
          category: 'Office',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: '',
          actorId: buyer.userId,
          reason: 'Synthetic quote vendor',
        },
        tx,
      ),
    );
    const body = new FormData();
    body.set(
      'file',
      new File(['%PDF-1.7\nSynthetic quotation\n%%EOF'], 'quote.pdf', {
        type: 'application/pdf',
      }),
    );
    const upload = await bs.fetch('/purchaseAttachments/uploadOne', {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        'x-purchase-request-id': id,
        'x-purchase-vendor-id': vendor.id,
        'x-purchase-version': String(current.record.lifecycleVersion),
        'x-purchase-quote-basis': purchaseQuoteBasis(current.record),
      },
      body,
    });
    expect(upload.status).toBe(201);
    const data = (await upload.json()).data.record;
    quotes.push({ vendorId: vendor.id, attachmentIds: [data.id] });
  }
  await action(purchase, id, buyer.userId, 'complete', {
    actualCents: 10000,
    selectedVendorId: quotes[0].vendorId,
    quotes,
  });
  await action(purchase, id, finance.userId);
  const approved = (await purchase.detail(id, f.a.userId)).record;
  expect(approved.status).toBe('approved');
  await sweep();
  const order = await c
    .resolve(purchaseOrderServiceToken)
    .get(String(approved.orderId));
  expect(order?.status).toBe('awaitingReceipt');
  await db.transaction((tx) =>
    c.resolve(purchaseOrderServiceToken).accept(
      order!.id,
      {
        actorId: f.a.userId,
        version: order!.version,
        receiptDate: '2026-11-12',
        reason: 'Synthetic receipt',
        requestKey: randomUUID(),
      },
      tx,
    ),
  );
  await sweep();
  const changes = await events();
  expect(
    changes.some((e) => (e.data as { status: string }).status === 'approved'),
  ).toBe(true);
  expect(
    changes.some((e) => (e.data as { status: string }).status === 'accepted'),
  ).toBe(true);
  const amount = (
    await db.repository('purchaseRequests').findOne({ filter: { id } })
  )?.actualCents;
  expect(Number(amount)).toBe(10000);
  const detail = await h.a.fetch(`/itRepairs/${h.repair.id}/handling`);
  const publicData = JSON.stringify(await detail.json());
  expect(publicData).not.toContain('PRIVATE-SOURCE-PURPOSE');
  expect(publicData).not.toContain('PRIVATE-VENDOR');
  expect(publicData).not.toContain('actualCents');
  expect(
    (
      await db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: h.repair.id } })
    )?.status,
  ).toBe('triage');
  const before = changes.length;
  await sweep();
  expect((await events()).length).toBe(before);
  const linked = (
    await (await h.l.fetch(`/itRepairs/${h.repair.id}/handling`)).json()
  ).data.references;
  expect(linked.some((r: { readable: boolean }) => r.readable)).toBe(true);
});
test('V25 native expense approval, rejection, withdrawal and administrative cancellation are journaled without owner writes', async ({
  testApp,
}) => {
  const h = await setup(testApp, 'device'),
    { c, db, f, finance, expense, link, sweep, action, events } = h;
  const form = {
    matterType: 'teamBuilding',
    reason: 'PRIVATE-EXPENSE-REASON',
    amountCents: 10000,
    subject: 'office',
    participants: 2,
    eventDate: '2026-11-12',
  };
  const approved = await expense.create(form, f.a.userId, f.a.userId),
    approvedId = String(approved.record.id);
  await expense.transition(
    approvedId,
    'submit',
    f.a.userId,
    Number(approved.record.lifecycleVersion),
    randomUUID(),
  );
  await link('expensePlan', approvedId);
  await action(expense, approvedId, f.leader.userId);
  await action(expense, approvedId, finance.userId);
  expect((await expense.detail(approvedId, f.a.userId)).record.status).toBe(
    'approved',
  );
  await sweep();
  const rejected = await expense.create(form, f.a.userId, f.a.userId),
    rejectedId = String(rejected.record.id);
  await expense.transition(
    rejectedId,
    'submit',
    f.a.userId,
    Number(rejected.record.lifecycleVersion),
    randomUUID(),
  );
  await link('expensePlan', rejectedId);
  await action(expense, rejectedId, f.leader.userId, 'reject');
  await sweep();
  const withdrawn = await expense.create(form, f.a.userId, f.a.userId),
    withdrawnId = String(withdrawn.record.id);
  await expense.transition(
    withdrawnId,
    'submit',
    f.a.userId,
    Number(withdrawn.record.lifecycleVersion),
    randomUUID(),
  );
  await link('expensePlan', withdrawnId);
  const pending = await expense.detail(withdrawnId, f.a.userId);
  await expense.transition(
    withdrawnId,
    'withdraw',
    f.a.userId,
    pending.record.lifecycleVersion,
    randomUUID(),
  );
  await sweep();
  const cancelled = await expense.create(form, f.a.userId, f.a.userId),
    cancelledId = String(cancelled.record.id);
  const cancellationPending = await expense.transition(
    cancelledId,
    'submit',
    f.a.userId,
    Number(cancelled.record.lifecycleVersion),
    randomUUID(),
  );
  await link('expensePlan', cancelledId);
  await expense.transition(
    cancelledId,
    'terminate',
    h.adminId,
    Number(cancellationPending.record.lifecycleVersion),
    randomUUID(),
    { reason: 'Synthetic administrative cancellation' },
  );
  await sweep();
  const statuses = (await events()).map(
    (e) => (e.data as { status: string }).status,
  );
  expect(statuses).toEqual(
    expect.arrayContaining(['approved', 'rejected', 'withdrawn', 'terminated']),
  );
  const recordBefore = await db
    .repository('expensePlans')
    .findOne({ filter: { id: approvedId } });
  const balanceBefore = await c.resolve(budgetServiceToken).balance({
    departmentId: String(recordBefore!.departmentId),
    year: Number(recordBefore!.year),
    subject: 'office',
  });
  await sweep();
  expect(
    await db.repository('expensePlans').findOne({ filter: { id: approvedId } }),
  ).toEqual(recordBefore);
  expect(
    await c.resolve(budgetServiceToken).balance({
      departmentId: String(recordBefore!.departmentId),
      year: Number(recordBefore!.year),
      subject: 'office',
    }),
  ).toEqual(balanceBefore);
  const detail = JSON.stringify(
    (await (await h.a.fetch(`/itRepairs/${h.repair.id}/handling`)).json()).data,
  );
  expect(detail).not.toContain('PRIVATE-EXPENSE-REASON');
  expect(detail).not.toContain('amountCents');
  expect(
    (
      await db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: h.repair.id } })
    )?.status,
  ).toBe('triage');
});

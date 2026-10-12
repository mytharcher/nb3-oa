import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import { ruleServiceToken } from '../../../server/providers/platform/index.ts';
import { offeredActions } from '@nocobase/app-plugin-approval/client';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.ts';
import { purchaseQuoteBasis } from '../../../server/providers/purchases/quotes.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { json } from '../org/helpers.ts';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  purchaseServiceToken,
  type PurchaseService,
} from '../../../server/providers/purchases/service.ts';
import type { PurchaseInput } from '../../../server/providers/purchases/contract.ts';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
let app: OrgTestApp;
let service: PurchaseService;
const sessions: Record<string, TestSession> = {};
const ids: Record<string, string> = {};
const departmentId = 'expense-department';
const account = (subject = 'office', year = 2026) => ({
  departmentId,
  year,
  subject,
});
const form = (extra: Partial<PurchaseInput> = {}): PurchaseInput => ({
  items: [
    {
      id: 'item-1',
      name: 'Paper',
      specification: 'A4',
      quantity: '1.5',
      unit: 'kg',
    },
  ],
  purpose: 'Office purchase',
  estimatedCents: 10000,
  subject: 'office',
  expectedDate: '2026-11-12',
  suggestedVendorId: null,
  ...extra,
});
async function draft(input = form(), actor = ids.applicant, applicant = actor) {
  return (await service.create(input, actor, applicant)).record;
}
async function submit(input = form()) {
  const r = await draft(input);
  return service.transition(
    String(r.id),
    'submit',
    ids.applicant,
    Number(r.lifecycleVersion),
    randomUUID(),
  );
}
async function detail(id: string) {
  return service.detail(id, ids.applicant);
}
async function act(
  id: string,
  actor: string,
  action = 'approve',
  extra: Record<string, unknown> = {},
) {
  const d = await service.detail(id, actor);
  const offer = offeredActions(
    d.taskActions,
    d.runActions,
    d.runs.map((v) => v.run),
  ).find((v) => v.name === action);
  expect(offer).toBeDefined();
  const run = d.runs.find((v) =>
    'runId' in offer!.target
      ? v.run.id === offer!.target.runId
      : v.tasks.some((t) => t.id === offer!.target.taskId),
  )!;
  return service.action(
    id,
    {
      target: offer!.target,
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(action === 'return'
        ? { input: { to: 'revision' }, comment: 'Correct estimate' }
        : action === 'reject'
          ? { comment: 'Rejected' }
          : {}),
      ...extra,
    },
    actor,
  );
}
async function withdraw(id: string) {
  const d = await detail(id);
  return service.transition(
    id,
    'withdraw',
    ids.applicant,
    d.record.lifecycleVersion,
    randomUUID(),
  );
}

async function pricedForFinance(actualCents: number) {
  const c = app.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    vendors = c.resolve(vendorServiceToken);
  const r = await submit(form({ estimatedCents: actualCents })),
    id = String(r.record.id);
  await act(id, ids.head);
  await act(id, ids.purchasing, 'claim');
  const current = await detail(id),
    quotes: { vendorId: string; attachmentIds: string[] }[] = [];
  for (let i = 0; i < 3; i++) {
    const vendor = await db.transaction((tx) =>
      vendors.create(
        {
          code: `boundary-${randomUUID()}`,
          name: `Boundary vendor ${i}`,
          category: 'Office',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: '',
          actorId: ids.purchasing,
          reason: 'Boundary quote supplier',
        },
        tx,
      ),
    );
    const fileId = randomUUID();
    await db.repository('purchaseQuoteFiles').createOne({
      values: {
        id: fileId,
        purchaseId: id,
        vendorId: vendor.id,
        ownerId: ids.purchasing,
        uploadVersion: current.record.lifecycleVersion,
        quoteBasisHash: purchaseQuoteBasis(current.record),
        disk: 'local',
        key: `test/${fileId}`,
        filename: 'quote.pdf',
        ext: '.pdf',
        mimeType: 'application/pdf',
        size: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    quotes.push({ vendorId: vendor.id, attachmentIds: [fileId] });
  }
  await act(id, ids.purchasing, 'complete', {
    input: { actualCents, selectedVendorId: quotes[0].vendorId, quotes },
  });
  return id;
}
describe('purchases: current-year reservation, quotations and order issuance', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    service = c.resolve(purchaseServiceToken);
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'head',
      'finance',
      'finance2',
      'executive',
      'gm',
      'proxy',
      'outsider',
      'purchasing',
      'administrator',
    ]) {
      sessions[name] = await app.createUser(`Expense-${name}`);
      ids[name] = sessions[name].user.id;
      await db.repository('employees').createOne({
        values: {
          id: `expense-${name}`,
          code: `EXP-${name}`,
          name,
          userId: ids[name],
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: departmentId,
        title: 'Applicant primary department',
        managerId: ids.head,
        executiveId: ids.executive,
        active: true,
      },
    });
    await app.organization.addMember(
      { departmentId, userId: ids.applicant, primary: true },
      { actorId: ids.head },
    );
    for (const [name, role] of [
      ['finance', 'finance'],
      ['finance2', 'finance'],
      ['gm', 'gm'],
      ['purchasing', 'purchasing'],
      ['administrator', 'admin'],
    ])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `expense-role-${name}`,
          dutyRoleCode: role,
          userId: ids[name],
          active: true,
        },
      });
    await db.transaction((tx) =>
      c.resolve(vendorServiceToken).create(
        {
          code: 'base-vendor',
          name: 'Base supplier',
          category: 'Office',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: '',
          actorId: ids.purchasing,
          reason: 'Test foundation supplier',
        },
        tx,
      ),
    );
    for (const [subject, year] of [
      ['office', 2026],
      ['travel', 2026],
      ['office', 2027],
    ] as const)
      await db.transaction((tx) =>
        c.resolve(budgetServiceToken).allocate(
          {
            ...account(subject, year),
            deltaCents: 1000000000,
            reference: 'initial',
            requestKey: randomUUID(),
            actorId: ids.finance,
            reason: 'Annual budget',
          },
          tx,
        ),
      );
  }, 120000);
  afterAll(async () => app?.close());

  it('initializes public custom procurement stage, approves exact 120% price and retains final hold without spending', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      budgets = c.resolve(budgetServiceToken);
    const vendor = await db.transaction((tx) =>
      c.resolve(vendorServiceToken).create(
        {
          code: 'purchase-test',
          name: 'Supplier',
          category: 'Office',
          contactName: '',
          contactPhone: '',
          contactEmail: '',
          bankName: '',
          bankAccount: '',
          bankAccountName: '',
          actorId: ids.purchasing,
          reason: 'Test supplier',
        },
        tx,
      ),
    );
    const before = await budgets.balance(account());
    const r = await submit(),
      id = String(r.record.id);
    expect(r.record).toMatchObject({
      status: 'head',
      year: 2026,
      heldCents: 10000,
      heldAccount: account(),
    });
    await act(id, ids.head);
    expect((await detail(id)).record.status).toBe('purchasing');
    await act(id, ids.purchasing, 'claim');
    await act(id, ids.purchasing, 'complete', {
      input: { actualCents: 12000, selectedVendorId: vendor.id, quotes: [] },
    });
    expect((await detail(id)).record).toMatchObject({
      status: 'finance',
      actualCents: 12000,
      heldCents: 12000,
      financeEntered: true,
    });
    await act(id, ids.finance);
    const approved = await detail(id);
    expect(approved.record.status).toBe('approved');
    expect(approved.order).toMatchObject({
      purchaseId: id,
      actualCents: 12000,
      status: 'awaitingReceipt',
      vendor: { id: vendor.id, name: 'Supplier' },
    });
    const after = await budgets.balance(account());
    expect(after.usedCents).toBe(before.usedCents);
    expect(after.heldCents - before.heldCents).toBe(12000);
  });
  it('failure preserves the exact handler reason and unchanged reviewed content resumes procurement without another head review', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    await act(id, ids.purchasing, 'unable', {
      comment: 'All suppliers declined the required date',
    });
    const failed = await detail(id);
    expect(failed.record).toMatchObject({
      status: 'exception',
      handlingFailureReason: 'All suppliers declined the required date',
      heldCents: 10000,
    });
    await service.transition(
      id,
      'submit',
      ids.applicant,
      failed.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('purchasing');
    await withdraw(id);
    expect((await detail(id)).record).toMatchObject({
      status: 'withdrawn',
      heldCents: 0,
      heldAccount: null,
    });
  });
  it('a changed reviewed item after procurement failure requires head review again', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    await act(id, ids.purchasing, 'unable', { comment: 'No supplier' });
    const failed = await detail(id);
    await service.transition(
      id,
      'edit',
      ids.applicant,
      failed.record.lifecycleVersion,
      randomUUID(),
      form({
        items: [
          {
            id: 'item-1',
            name: 'Other paper',
            specification: 'A4',
            quantity: '1.5',
            unit: 'kg',
          },
        ],
      }),
    );
    const edited = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('head');
  });
  it('strictly greater than 120% returns for estimate confirmation while reserving the actual price', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      vendor = await db.transaction((tx) =>
        c.resolve(vendorServiceToken).create(
          {
            code: 'over-price',
            name: 'Supplier',
            category: 'Office',
            contactName: '',
            contactPhone: '',
            contactEmail: '',
            bankName: '',
            bankAccount: '',
            bankAccountName: '',
            actorId: ids.purchasing,
            reason: 'Test supplier',
          },
          tx,
        ),
      );
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    await act(id, ids.purchasing, 'complete', {
      input: { actualCents: 12001, selectedVendorId: vendor.id, quotes: [] },
    });
    const returned = await detail(id);
    expect(returned.record).toMatchObject({
      status: 'revision',
      heldCents: 12001,
      actualCents: 12001,
      priceConfirmationRequired: true,
      financeEntered: false,
    });
    await expect(
      service.transition(
        id,
        'submit',
        ids.applicant,
        returned.record.lifecycleVersion,
        randomUUID(),
      ),
    ).rejects.toThrow();
    await service.transition(
      id,
      'edit',
      ids.applicant,
      returned.record.lifecycleVersion,
      randomUUID(),
      form({ estimatedCents: 12001 }),
    );
    const edited = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record).toMatchObject({
      status: 'head',
      estimatedCents: 12001,
      actualCents: null,
    });
  });
  it('administrator force close without a price is explicitly forcedClosed, releases funds and creates no order', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    const administrator = (await app.admin()).user.id;
    const d = await service.detail(id, administrator),
      run = d.runs.find(
        (r) => r.run.status === 'purchasing' && !r.run.endedAt,
      )!;
    if (!run)
      throw new Error(
        JSON.stringify({ runs: d.runs, status: d.record.status }),
      );
    await service.action(
      id,
      {
        target: { runId: run.run.id },
        action: 'forceComplete',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
        input: {},
        comment: 'Supplier cannot fulfill; close without an order',
      },
      administrator,
    );
    const ended = await detail(id);
    expect(ended.record).toMatchObject({
      status: 'forcedClosed',
      heldCents: 0,
      heldAccount: null,
      actualCents: null,
      orderId: null,
      handlingForced: true,
    });
    expect(ended.order).toBeNull();
  });
  it('rejects client decision data/hash substitution and foreign current task targets', async () => {
    const r = await submit(),
      id = String(r.record.id),
      d = await service.detail(id, ids.head),
      offer = d.taskActions.find((t) =>
        t.actions.some((a) => a.name === 'approve'),
      )!,
      run = d.runs.find((r) => r.run.id === offer.task.runId)!;
    await expect(
      service.action(
        id,
        {
          target: { taskId: offer.task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
          input: { data: { hash: run.run.contentHash, estimatedCents: 1 } },
        },
        ids.head,
      ),
    ).rejects.toThrow();
    expect((await detail(id)).record.status).toBe('head');
    const other = await submit();
    await expect(
      service.action(
        String(other.record.id),
        {
          target: { taskId: offer.task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        ids.head,
      ),
    ).rejects.toMatchObject({ code: 'PURCHASE_TARGET_MISMATCH' });
  });
  it('requires three distinct current quotes above the snapshotted threshold and rejects foreign quote evidence atomically', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      v = c.resolve(vendorServiceToken);
    const vendors = await Promise.all(
      [1, 2, 3].map((n) =>
        db.transaction((tx) =>
          v.create(
            {
              code: `quoted-${n}`,
              name: `Quote ${n}`,
              category: 'Office',
              contactName: '',
              contactPhone: '',
              contactEmail: '',
              bankName: '',
              bankAccount: '',
              bankAccountName: '',
              actorId: ids.purchasing,
              reason: 'Quotation supplier',
            },
            tx,
          ),
        ),
      ),
    );
    const r = await submit(form({ estimatedCents: 6000000 })),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    const d = await detail(id);
    const evidence = [] as { vendorId: string; attachmentIds: string[] }[];
    for (const vendor of vendors) {
      const fileId = randomUUID();
      await db.repository('purchaseQuoteFiles').createOne({
        values: {
          id: fileId,
          purchaseId: id,
          vendorId: vendor.id,
          ownerId: ids.purchasing,
          uploadVersion: d.record.lifecycleVersion,
          quoteBasisHash: purchaseQuoteBasis(d.record),
          disk: 'local',
          key: `test/${fileId}`,
          filename: 'quote.pdf',
          ext: '.pdf',
          mimeType: 'application/pdf',
          size: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      evidence.push({ vendorId: vendor.id, attachmentIds: [fileId] });
    }
    await expect(
      act(id, ids.purchasing, 'complete', {
        input: {
          actualCents: 6000000,
          selectedVendorId: vendors[0].id,
          quotes: evidence.slice(0, 2),
        },
      }),
    ).rejects.toThrow();
    expect((await detail(id)).record).toMatchObject({
      status: 'purchasing',
      actualCents: null,
      heldCents: 6000000,
    });
    const bad = evidence.map((q, i) =>
      i === 0 ? { ...q, attachmentIds: [randomUUID()] } : q,
    );
    await expect(
      act(id, ids.purchasing, 'complete', {
        input: {
          actualCents: 6000000,
          selectedVendorId: vendors[0].id,
          quotes: bad,
        },
      }),
    ).rejects.toThrow();
    await act(id, ids.purchasing, 'complete', {
      input: {
        actualCents: 6000000,
        selectedVendorId: vendors[0].id,
        quotes: evidence,
      },
    });
    expect((await detail(id)).record.status).toBe('finance');
  });
  it('HTTP scopes own requests and orders independently and refuses injected business ownership', async () => {
    const r = await draft(),
      id = String(r.id);
    expect(
      (
        await app.testApp.fetch(
          new Request(
            `${OA_TEST_ORIGIN}${app.testApp.publicBasePath.replace(/\/$/, '')}/api/purchaseRequests/${id}`,
          ),
        )
      ).status,
    ).toBe(401);
    expect(
      (await sessions.applicant.fetch(`/purchaseRequests/${id}`)).status,
    ).toBe(200);
    expect(
      (await sessions.outsider.fetch(`/purchaseRequests/${id}`)).status,
    ).toBe(403);
    expect(
      (
        await sessions.outsider.fetch(
          '/purchaseRequests',
          json({ ...form(), applicantId: ids.applicant }),
        )
      ).status,
    ).toBe(400);
    const orderList = await sessions.applicant.fetch(
      '/purchaseOrders?page=1&pageSize=1',
    );
    expect(orderList.status).toBe(200);
    const body = await orderList.json();
    expect(body.meta.pageSize).toBe(1);
    expect(body.meta.total).toBeGreaterThan(0);
    expect(body.data).toHaveLength(1);
    const ownDetail = await sessions.applicant.fetch(
      `/purchaseOrders/${body.data[0].id}`,
    );
    expect(ownDetail.status).toBe(200);
    expect((await ownDetail.json()).data).toMatchObject({
      actions: { accept: true, cancel: false },
      timeZone: expect.any(String),
    });
    const foreign = await sessions.outsider.fetch(
      `/purchaseOrders/${body.data[0].id}`,
    );
    expect(foreign.status).toBe(404);
    expect(
      (
        await sessions.outsider.fetch(
          `/purchaseOrders/${body.data[0].id}/accept`,
          json({
            version: body.data[0].version,
            requestKey: randomUUID(),
            reason: 'Try receipt',
            receiptDate: '2026-10-11',
          }),
        )
      ).status,
    ).toBe(404);
  });
  it('secure quote HTTP permits only the current claimed handler and freezes selected download access', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken),
      vendor = (
        await app.testApp.application.container
          .resolve(vendorServiceToken)
          .options()
      )[0];
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    const upload = async (
      name: string,
      file = new File(['%PDF-1.7\nfixture\n%%EOF'], 'quote.pdf', {
        type: 'application/pdf',
      }),
      version?: number,
      basis?: string,
    ) => {
      const current = await detail(id);
      const body = new FormData();
      body.append('file', file);
      return sessions[name].fetch('/purchaseAttachments/uploadOne', {
        method: 'POST',
        headers: {
          origin: OA_TEST_ORIGIN,
          'x-purchase-request-id': id,
          'x-purchase-vendor-id': vendor.id,
          'x-purchase-version': String(
            version ?? current.record.lifecycleVersion,
          ),
          'x-purchase-quote-basis': basis ?? purchaseQuoteBasis(current.record),
        },
        body,
      });
    };
    expect((await upload('applicant')).status).toBe(403);
    expect((await upload('purchasing')).status).toBe(403);
    await act(id, ids.purchasing, 'claim');
    expect(
      (
        await upload(
          'purchasing',
          new File(['HTML'], 'quote.pdf', { type: 'application/pdf' }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await upload(
          'purchasing',
          undefined,
          (await detail(id)).record.lifecycleVersion - 1,
        )
      ).status,
    ).toBe(409);
    expect(
      (await upload('purchasing', undefined, undefined, '0'.repeat(64))).status,
    ).toBe(400);
    const uploaded = await upload('purchasing');
    expect(uploaded.status).toBe(201);
    const file = (await uploaded.json()).data.record;
    const url = new URL(file.contentUrl, OA_TEST_ORIGIN).href;
    expect((await sessions.purchasing.fetch(url)).status).toBe(200);
    expect((await sessions.applicant.fetch(url)).status).toBe(403);
    await act(id, ids.purchasing, 'complete', {
      input: {
        actualCents: 10000,
        selectedVendorId: vendor.id,
        quotes: [{ vendorId: vendor.id, attachmentIds: [file.id] }],
      },
    });
    expect((await sessions.applicant.fetch(url)).status).toBe(200);
    expect((await sessions.outsider.fetch(url)).status).toBe(403);
    expect((await upload('purchasing')).status).toBe(403);
    expect(
      await db
        .repository('purchaseQuoteFiles')
        .count({ filter: { purchaseId: id } }),
    ).toBe(1);
  });
  it('missing purchasing personnel produces a real maintenance alarm for the open lifecycle state', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      notifications = c.resolve(approvalNotificationServiceToken),
      alarm = vi.spyOn(notifications, 'alarm').mockResolvedValue();
    const r = await submit(),
      id = String(r.record.id);
    await db.repository('dutyRoleMembers').updateOne({
      filter: { id: 'expense-role-purchasing' },
      values: { active: false },
    });
    try {
      await act(id, ids.head);
      expect((await detail(id)).record.status).toBe('purchasing');
      await service.maintenance();
      expect(alarm).toHaveBeenCalledWith(
        expect.objectContaining({
          recordId: id,
          reason: 'unassigned',
          kind: 'oa.purchase',
        }),
      );
    } finally {
      await db.repository('dutyRoleMembers').updateOne({
        filter: { id: 'expense-role-purchasing' },
        values: { active: true },
      });
      alarm.mockRestore();
    }
  });
  it('insufficient actual-price reservation rolls back both the handler answer and priced business outputs', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      budgets = c.resolve(budgetServiceToken),
      vendor = (await c.resolve(vendorServiceToken).options())[0];
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    const before = await budgets.balance(account()),
      delta = before.availableCents - 1999;
    await db.transaction((tx) =>
      budgets.allocate(
        {
          ...account(),
          deltaCents: -delta,
          reference: 'temporary-test-budget',
          requestKey: randomUUID(),
          actorId: ids.finance,
          reason: 'Boundary shortage',
        },
        tx,
      ),
    );
    try {
      await expect(
        act(id, ids.purchasing, 'complete', {
          input: {
            actualCents: 12000,
            selectedVendorId: vendor.id,
            quotes: [],
          },
        }),
      ).rejects.toMatchObject({ code: 'BUDGET_INSUFFICIENT' });
      const unchanged = await detail(id);
      expect(unchanged.record).toMatchObject({
        status: 'purchasing',
        actualCents: null,
        heldCents: 10000,
      });
      expect(
        unchanged.runs
          .flatMap((r) => r.tasks)
          .some((t) => t.stage === 'purchasing' && t.status === 'claimed'),
      ).toBe(true);
    } finally {
      await db.transaction((tx) =>
        budgets.allocate(
          {
            ...account(),
            deltaCents: delta,
            reference: 'temporary-test-budget-restore',
            requestKey: randomUUID(),
            actorId: ids.finance,
            reason: 'Restore annual funds',
          },
          tx,
        ),
      );
    }
  });
  it('final order audit failure rolls back final approval and immutable order creation', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken),
      vendor = (await c.resolve(vendorServiceToken).options())[0];
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    await act(id, ids.purchasing, 'claim');
    await act(id, ids.purchasing, 'complete', {
      input: { actualCents: 10000, selectedVendorId: vendor.id, quotes: [] },
    });
    const original = audit.record.bind(audit),
      failure = vi
        .spyOn(audit, 'record')
        .mockImplementation((input, tx) =>
          input.action === 'purchaseOrder.issue'
            ? Promise.reject(new Error('Final order audit unavailable'))
            : original(input, tx),
        );
    try {
      await expect(act(id, ids.finance)).rejects.toThrow(
        'Final order audit unavailable',
      );
      expect((await detail(id)).record).toMatchObject({
        status: 'finance',
        orderId: null,
        heldCents: 10000,
      });
      expect(
        await db
          .repository('purchaseOrders')
          .count({ filter: { purchaseId: id } }),
      ).toBe(0);
    } finally {
      failure.mockRestore();
    }
    await act(id, ids.finance);
    expect((await detail(id)).order).toMatchObject({
      purchaseId: id,
      status: 'awaitingReceipt',
    });
  });
  it('applicant manual copies in procurement use finite SDK candidates and recipients can mark the copy read without deciding the purchase', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.head);
    const current = await service.detail(id, ids.applicant),
      offer = offeredActions(
        current.taskActions,
        current.runActions,
        current.runs.map((v) => v.run),
      ).find((v) => v.name === 'cc')!;
    expect(offer).toBeDefined();
    const candidates = await sessions.applicant.fetch(
      `/purchaseRequests/${id}/candidates?runId=${'runId' in offer.target ? offer.target.runId : ''}&action=cc`,
    );
    expect(candidates.status).toBe(200);
    expect(
      (await candidates.json()).data.people.some(
        (p: { id: string }) => p.id === ids.outsider,
      ),
    ).toBe(true);
    await act(id, ids.applicant, 'cc', { input: { to: ids.outsider } });
    const copied = await service.list(ids.outsider, 'copied');
    expect(copied.some((r) => r.id === id)).toBe(true);
    await act(id, ids.outsider, 'read');
    expect((await detail(id)).record.status).toBe('purchasing');
    await expect(
      service.action(
        id,
        {
          action: 'complete',
          target: {
            taskId: (await service.detail(id, ids.purchasing)).taskActions.find(
              (v) => v.actions.some((a) => a.name === 'claim'),
            )!.task.id,
          },
          contentHash: current.runs[0].run.contentHash,
          requestId: randomUUID(),
          input: {
            actualCents: 1,
            selectedVendorId: (
              await app.testApp.application.container
                .resolve(vendorServiceToken)
                .options()
            )[0].id,
            quotes: [],
          },
        },
        ids.outsider,
      ),
    ).rejects.toThrow();
  });
  it('uses strict snapshotted spending thresholds even when live rules change before finance finishes', async () => {
    const equal = await pricedForFinance(5000000);
    await act(equal, ids.finance);
    expect((await detail(equal)).record.status).toBe('approved');
    const above = await pricedForFinance(5000001),
      rules = app.testApp.application.container.resolve(ruleServiceToken);
    await rules.set({
      key: 'spend.vp',
      value: 100000,
      actorId: ids.administrator,
      note: 'Change after submission',
    });
    try {
      await act(above, ids.finance);
      expect((await detail(above)).record).toMatchObject({
        status: 'executive',
        ruleSnapshot: { 'spend.vp': 50000 },
      });
      await act(above, ids.executive);
      expect((await detail(above)).record.status).toBe('approved');
    } finally {
      await rules.set({
        key: 'spend.vp',
        value: 50000,
        actorId: ids.administrator,
        note: 'Restore test threshold',
      });
    }
    const gmEqual = await pricedForFinance(20000000);
    await act(gmEqual, ids.finance);
    await act(gmEqual, ids.executive);
    expect((await detail(gmEqual)).record.status).toBe('approved');
  });
  it('merges adjacent executive and GM only for the principal task actually approved in the same transaction, never a delegation proxy', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      directory = c.resolve(approvalDirectoryServiceToken);
    await db.repository('departments').updateMany({
      filter: { id: departmentId },
      values: { executiveId: ids.gm },
    });
    try {
      const merged = await pricedForFinance(20000001);
      await act(merged, ids.finance);
      await act(merged, ids.gm);
      expect((await detail(merged)).record).toMatchObject({
        status: 'approved',
        gmMerged: { personId: ids.gm, stages: ['executive', 'gm'] },
      });
      expect(
        await db.repository('auditLogs').count({
          filter: { targetId: merged, action: 'purchase.samePersonMerged' },
        }),
      ).toBe(1);
      const delegation = await directory.createManualDelegation(
        {
          principalId: ids.gm,
          delegateId: ids.proxy,
          scope: ['oa.purchase'],
          from: new Date(Date.now() - 60000).toISOString(),
          to: new Date(Date.now() + 86400000).toISOString(),
        },
        { actorId: ids.gm },
      );
      try {
        const proxied = await pricedForFinance(20000001);
        await act(proxied, ids.finance);
        await act(proxied, ids.proxy);
        expect((await detail(proxied)).record).toMatchObject({
          status: 'gm',
          gmMerged: null,
          heldCents: 20000001,
          orderId: null,
        });
        await act(proxied, ids.gm);
        expect((await detail(proxied)).record.status).toBe('approved');
      } finally {
        await directory.disableManualDelegation(delegation.id, {
          actorId: ids.gm,
        });
      }
    } finally {
      await db.repository('departments').updateMany({
        filter: { id: departmentId },
        values: { executiveId: ids.executive },
      });
    }
  });
});

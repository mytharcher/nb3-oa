// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { projectPrintTimeline } from '../../../server/providers/template-print/timeline.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import {
  createReimbursementService,
  type ReimbursementService,
} from '../../../server/providers/reimbursement/service.ts';
import type { ReimbursementInput } from '../../../server/providers/reimbursement/contract.ts';
import { orgServiceToken } from '../../../server/providers/org/contract.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { employeeServiceToken } from '../../../server/providers/employees/contract.ts';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.ts';
import {
  calendarServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
  dictionaryServiceToken,
} from '../../../server/providers/platform/index.ts';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.ts';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { invoiceServiceToken } from '../../../server/providers/invoices/contract.ts';
import { loanLedgerServiceToken } from '../../../server/providers/loan-ledger/contract.ts';
let app: OrgTestApp, service: ReimbursementService;
const ids: Record<string, string> = {};
const attachmentCheck = vi.fn(async () => {});
const form = (amounts = [100, 200]): ReimbursementInput => ({
  reason: 'Business expense',
  authorizationId: null,
  loanId: null,
  offsetCents: 0,
  overrunReason: '',
  lines: amounts.map((amountCents) => ({
    id: randomUUID(),
    category: 'other',
    date: '2026-10-11',
    amountCents,
    invoiceNumber: randomUUID(),
    attachmentIds: [randomUUID()],
    standardExceptionReason: '',
  })),
});
async function detail(id: string, actor = ids.applicant) {
  return service.detail(id, actor);
}
async function act(
  id: string,
  actor: string,
  action: string,
  subject?: string,
  input?: Record<string, unknown>,
) {
  const d = await detail(id, actor);
  const offer = d.taskActions.find(
    (v) =>
      (!subject || v.task.subject === subject) &&
      v.actions.some((a) => a.name === action),
  );
  expect(offer, `${d.record.status} offers ${action}`).toBeDefined();
  const run = d.runs.find((v) => v.run.id === offer!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offer!.task.id },
      action,
      contentHash: run.run.contentHash,
      requestId: randomUUID(),
      ...(input ? { input } : {}),
      ...(['returnItem', 'unable', 'reject'].includes(action)
        ? { comment: 'Correct the returned evidence' }
        : {}),
    },
    actor,
  );
}
async function submitted(input = form()) {
  const draft = (await service.create(input, ids.applicant)).record;
  await service.transition(
    String(draft.id),
    'submit',
    ids.applicant,
    Number(draft.lifecycleVersion),
    randomUUID(),
  );
  return String(draft.id);
}
describe('reimbursement application-bound approval integration', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      now = new Date().toISOString();
    for (const name of [
      'applicant',
      'manager',
      'head',
      'finance',
      'cashier',
      'outsider',
    ]) {
      ids[name] = (await app.createUser('Reimbursement-' + name)).user.id;
      await db.repository('employees').createOne({
        values: {
          id: 'reimbursement-' + name,
          code: 'REIMB-' + name,
          name,
          userId: ids[name],
          managerId: name === 'applicant' ? 'reimbursement-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('departments').createOne({
      values: {
        id: 'reimbursement-department',
        title: 'Reimbursement department',
        managerId: ids.head,
        active: true,
      },
    });
    await app.organization.addMember(
      {
        departmentId: 'reimbursement-department',
        userId: ids.applicant,
        primary: true,
      },
      { actorId: ids.head },
    );
    for (const [name, role] of [
      ['finance', 'finance'],
      ['cashier', 'cashier'],
    ])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: 'reimbursement-role-' + name,
          dutyRoleCode: role,
          userId: ids[name],
          active: true,
        },
      });
    const accountants = c.resolve(financeAssignmentServiceToken);
    await db.transaction((tx) =>
      accountants.create(
        {
          departmentId: 'reimbursement-department',
          accountantId: ids.finance,
          actorId: ids.head,
          reason: 'Designated accountant',
        },
        tx,
      ),
    );
    ids.admin = (await app.admin()).user.id;
    const employees = c.resolve(employeeServiceToken);
    vi.spyOn(employees, 'paymentAccountOf').mockResolvedValue({
      bankName: 'Private bank',
      bankAccount: '0000012345',
      bankAccountName: 'Employee',
    });
    service = createReimbursementService({
      db,
      org: c.resolve(orgServiceToken),
      audit: c.resolve(auditServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      employees,
      directory: c.resolve(approvalDirectoryServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
      notifications: c.resolve(approvalNotificationServiceToken),
      accountants,
      invoices: c.resolve(invoiceServiceToken),
      authorizations: c.resolve(expenseAuthorizationServiceToken),
      loans: c.resolve(loanLedgerServiceToken),
      validateAttachments: attachmentCheck,
    });
    await service.initialize();
  }, 120000);
  afterAll(async () => {
    vi.restoreAllMocks();
    await app?.close();
  });
  it('departure clearance reads caller transaction and blocks every unfinished reimbursement without returning financial data', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const applicant = (await app.createUser('Departure-clearance')).user.id;
    const draft = (await service.create(form(), applicant)).record;
    await db.transaction(async (tx) => {
      await expect(
        service.assertDepartureCleared(applicant, tx),
      ).rejects.toMatchObject({
        code: 'REIMBURSEMENT_DEPARTURE_NOT_CLEARED',
      });
      for (const status of [
        'revision',
        'finance',
        'cashier',
        'handlingException',
      ]) {
        await tx
          .repository('reimbursementRequests')
          .updateMany({ filter: { id: draft.id }, values: { status } });
        await expect(
          service.assertDepartureCleared(applicant, tx),
        ).rejects.toMatchObject({
          code: 'REIMBURSEMENT_DEPARTURE_NOT_CLEARED',
        });
      }
      for (const status of [
        'paid',
        'forcedPaid',
        'rejected',
        'withdrawn',
        'terminated',
      ]) {
        await tx
          .repository('reimbursementRequests')
          .updateMany({ filter: { id: draft.id }, values: { status } });
        expect(
          await service.assertDepartureCleared(applicant, tx),
        ).toBeUndefined();
      }
    });
  });
  it('immediate line correction reuses actual self-made manager and unchanged line opinions, then claimed cashier pays atomically', async () => {
    const input = form(),
      id = await submitted(input);
    expect((await detail(id)).record.status).toBe('manager');
    await act(id, ids.manager, 'approve');
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance, 'approve', input.lines[0].id);
    await act(id, ids.finance, 'returnItem', input.lines[1].id);
    const returned = await detail(id);
    expect(returned.record.status).toBe('revision');
    expect(returned.record.financeLineFacts).toMatchObject({
      [input.lines[0].id]: { outcome: 'approved' },
      [input.lines[1].id]: { outcome: 'returned' },
    });
    const revised = {
      ...input,
      lines: input.lines.map((line, index) => ({
        ...line,
        amountCents: index ? 150 : line.amountCents,
      })),
    };
    await expect(
      service.transition(
        id,
        'edit',
        ids.applicant,
        returned.record.lifecycleVersion,
        randomUUID(),
        {
          ...revised,
          lines: revised.lines.map((line, index) => ({
            ...line,
            amountCents: index ? 150 : 101,
          })),
        },
      ),
    ).rejects.toBeDefined();
    const edited = await service.transition(
      id,
      'edit',
      ids.applicant,
      returned.record.lifecycleVersion,
      randomUUID(),
      revised,
    );
    await service.transition(
      id,
      'submit',
      ids.applicant,
      Number(edited.record.lifecycleVersion),
      randomUUID(),
    );
    const again = await detail(id);
    expect(again.record.status).toBe('finance');
    const printable = projectPrintTimeline({
      timeline: again.timeline,
      runs: again.runs,
      person: (id) => (typeof id === 'string' ? id : ''),
      label: (_, value) => value,
      formatDate: (at) => at,
    });
    expect(printable.some((fact) => fact.actionValue === 'task.reused')).toBe(
      true,
    );
    expect(printable.some((fact) => fact.actionValue === 'returnItem')).toBe(
      true,
    );
    const currentRunIds = new Set(
      again.runs
        .map((run) => run.run.id)
        .filter((id) => !returned.runs.some((run) => run.run.id === id)),
    );
    expect(
      printable.some(
        (fact) =>
          fact.actionValue === 'task.reused' && currentRunIds.has(fact.runId),
      ),
    ).toBe(true);
    expect(new Set(printable.map((fact) => fact.runId))).toEqual(
      new Set(again.timeline.runs.map((run) => run.run.id)),
    );
    expect(JSON.stringify(printable)).not.toMatch(
      /0000012345|contentHash|parameters|settings/,
    );

    expect(
      again.runs.at(-1)!.tasks.find((t) => t.subject === input.lines[0].id),
    ).toMatchObject({ status: 'completed', answer: 'approve' });
    await act(id, ids.finance, 'approve', input.lines[1].id);
    expect((await detail(id)).record.status).toBe('cashier');
    expect(
      (await detail(id, ids.cashier)).taskActions.flatMap((v) =>
        v.actions.map((a) => a.name),
      ),
    ).not.toContain('reject');
    await expect(service.paymentAccount(id, ids.manager)).rejects.toMatchObject(
      { code: 'REIMBURSEMENT_PAYMENT_ACCOUNT_DENIED' },
    );
    expect(await service.paymentAccount(id, ids.cashier)).toMatchObject({
      bankAccount: '0000012345',
    });
    expect(JSON.stringify(await detail(id, ids.manager))).not.toContain(
      '0000012345',
    );
    await act(id, ids.cashier, 'claim');
    await expect(
      act(id, ids.cashier, 'complete', undefined, {}),
    ).rejects.toBeDefined();
    await act(id, ids.cashier, 'complete', undefined, {
      voucherNumber: 'BANK-1',
    });
    const paid = await detail(id);
    expect(paid.record).toMatchObject({
      status: 'paid',
      totalCents: 250,
      voucherNumber: 'BANK-1',
    });
    const exported = await service.financeExport(id, ids.finance, {
      read: true,
      create: false,
      update: false,
      delete: false,
    });
    expect(exported).toMatchObject({
      id,
      amountCents: 250,
      offsetCents: 0,
      paidCents: 250,
      forced: false,
    });
    expect(
      exported.lines.reduce((total, line) => total + line.amountCents, 0),
    ).toBe(250);
    expect(JSON.stringify(exported)).not.toContain('0000012345');
    await expect(
      service.financeExport(id, ids.finance, {
        read: { fields: ['id'], scope: true },
        create: false,
        update: false,
        delete: false,
      }),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_FIELDS_RESTRICTED' });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('reimbursementPayments')
        .findOne({ filter: { requestId: id } }),
    ).toMatchObject({
      grossCents: '250',
      offsetCents: '0',
      netCents: '250',
      voucherNumber: 'BANK-1',
    });
    expect(attachmentCheck).toHaveBeenCalled();
  }, 120000);
  it('cashier failure retains real holds, private account correction does not leak into lifecycle logs, and payment audit failure rolls back the decision', async () => {
    const id = await submitted(form([400]));
    await act(id, ids.manager, 'approve');
    await act(id, ids.finance, 'approve');
    await act(id, ids.cashier, 'claim');
    await act(id, ids.cashier, 'unable');
    const exception = await detail(id);
    expect(exception.record).toMatchObject({
      status: 'exception',
      handlingFailureReason: 'Correct the returned evidence',
    });
    const account = await service.paymentAccount(id, ids.applicant);
    await expect(
      service.transition(
        id,
        'retryCash',
        ids.applicant,
        exception.record.lifecycleVersion,
        randomUUID(),
        { paymentAccount: { bankAccount: '999-secret' } },
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PRIVATE_INPUT_FORBIDDEN' });
    await expect(
      service.correctPaymentAccount(
        id,
        ids.manager,
        exception.record.lifecycleVersion,
        account!.version,
        {
          bankName: 'New bank',
          bankAccount: '999-secret',
          bankAccountName: 'Employee',
        },
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_PAYMENT_ACCOUNT_DENIED' });
    await service.correctPaymentAccount(
      id,
      ids.applicant,
      exception.record.lifecycleVersion,
      account!.version,
      {
        bankName: 'New bank',
        bankAccount: '999-secret',
        bankAccountName: 'Employee',
      },
    );
    await service.transition(
      id,
      'retryCash',
      ids.applicant,
      exception.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('cashier');
    expect((await service.paymentAccount(id, ids.applicant))?.bankAccount).toBe(
      '999-secret',
    );
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    const logs = await db
      .repository('oaLifecycleTransitions')
      .findMany({ filter: { recordId: id } });
    expect(JSON.stringify(logs)).not.toContain('999-secret');
    expect(JSON.stringify(await detail(id, ids.manager))).not.toContain(
      '999-secret',
    );
    await act(id, ids.cashier, 'claim');
    const audit = app.testApp.application.container.resolve(auditServiceToken),
      original = audit.record.bind(audit);
    const failure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'reimbursement.paid')
          throw new Error('Payment audit unavailable');
        return original(entry, tx);
      });
    await expect(
      act(id, ids.cashier, 'complete', undefined, {
        voucherNumber: 'FAILED-1',
      }),
    ).rejects.toThrow('Payment audit unavailable');
    failure.mockRestore();
    expect((await detail(id)).record.status).toBe('cashier');
    expect(
      await db
        .repository('reimbursementPayments')
        .count({ filter: { requestId: id } }),
    ).toBe(0);
    expect(
      await app.testApp.application.container
        .resolve(invoiceServiceToken)
        .forDocument(id),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ state: 'held' })]),
    );
    await act(id, ids.cashier, 'complete', undefined, {
      voucherNumber: 'RECOVERY-1',
    });
    expect((await detail(id)).record.status).toBe('paid');
  }, 120000);
  it('a reduced correction followed by an increase requires a fresh manager opinion even below the original total', async () => {
    const input = form([1000]),
      id = await submitted(input);
    await act(id, ids.manager, 'approve');
    await act(id, ids.finance, 'returnItem', input.lines[0].id);
    let current = await detail(id);
    await service.transition(
      id,
      'edit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
      { ...input, lines: [{ ...input.lines[0], amountCents: 800 }] },
    );
    current = await detail(id);
    // Repeated correction uses the exact submitted baseline, not the previous edited proposal.
    await service.transition(
      id,
      'edit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
      {
        ...input,
        lines: [
          {
            ...input.lines[0],
            amountCents: 800,
            standardExceptionReason: 'Corrected evidence',
          },
        ],
      },
    );
    current = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance, 'returnItem', input.lines[0].id);
    current = await detail(id);
    await service.transition(
      id,
      'edit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
      {
        ...input,
        lines: [
          {
            ...input.lines[0],
            amountCents: 900,
            standardExceptionReason: 'Corrected evidence',
          },
        ],
      },
    );
    current = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('manager');
  }, 120000);
  it('only an administrative explicit amount confirmation can force cashier completion without inventing a voucher', async () => {
    const id = await submitted(form([123]));
    await act(id, ids.manager, 'approve');
    await act(id, ids.finance, 'approve');
    const d = await detail(id, ids.admin),
      offer = d.runActions.find((v) =>
        v.actions.some((a) => a.name === 'forceComplete'),
      );
    expect(offer).toBeDefined();
    const input = {
      target: { runId: offer!.run.id },
      action: 'forceComplete',
      contentHash: offer!.run.contentHash,
      requestId: randomUUID(),
      comment: 'Cash settlement verified outside the banking integration',
      input: {
        voucherNumber: null,
        confirmedGrossCents: 123,
        confirmedOffsetCents: 0,
        confirmedNetCents: 123,
      },
    };
    await expect(
      service.action(
        id,
        { ...input, input: { ...input.input, confirmedNetCents: 122 } },
        ids.admin,
      ),
    ).rejects.toBeDefined();
    await service.action(id, input, ids.admin);
    expect((await detail(id)).record).toMatchObject({
      status: 'forcedPaid',
      voucherNumber: null,
    });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('reimbursementPayments')
        .findOne({ filter: { requestId: id } }),
    ).toMatchObject({
      forced: true,
      voucherNumber: null,
      reason: 'Cash settlement verified outside the banking integration',
    });
  });
  it('recovers a closed cashier failure only through reasoned administrative retry or exact forced settlement', async () => {
    const id = await submitted(form([321]));
    await act(id, ids.manager, 'approve');
    await act(id, ids.finance, 'approve');
    await act(id, ids.cashier, 'claim');
    await act(id, ids.cashier, 'unable');
    let current = (await detail(id)).record;
    const confirmation = {
      reason: 'Verified completion after a failed cashier report',
      voucherNumber: null,
      confirmedGrossCents: 321,
      confirmedOffsetCents: 0,
      confirmedNetCents: 321,
    };
    await expect(
      service.transition(
        id,
        'forcePayException',
        ids.applicant,
        current.lifecycleVersion,
        randomUUID(),
        confirmation,
      ),
    ).rejects.toBeDefined();
    await expect(
      service.transition(
        id,
        'forcePayException',
        ids.admin,
        current.lifecycleVersion,
        randomUUID(),
        { ...confirmation, confirmedNetCents: 320 },
      ),
    ).rejects.toBeDefined();
    await expect(
      service.transition(
        id,
        'retryCashAsAdmin',
        ids.admin,
        current.lifecycleVersion,
        randomUUID(),
      ),
    ).rejects.toBeDefined();
    await service.transition(
      id,
      'retryCashAsAdmin',
      ids.admin,
      current.lifecycleVersion,
      randomUUID(),
      { reason: 'Account verified for cashier retry' },
    );
    expect((await detail(id)).record.status).toBe('cashier');
    await act(id, ids.cashier, 'claim');
    await act(id, ids.cashier, 'unable');
    current = (await detail(id)).record;
    const c = app.testApp.application.container;
    const db = c.resolve(databaseManagerToken),
      audit = c.resolve(auditServiceToken);
    const original = audit.record.bind(audit);
    const failure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'reimbursement.forcePaid')
          throw new Error('Forced payment audit unavailable');
        return original(entry, tx);
      });
    await expect(
      service.transition(
        id,
        'forcePayException',
        ids.admin,
        current.lifecycleVersion,
        randomUUID(),
        confirmation,
      ),
    ).rejects.toBeDefined();
    failure.mockRestore();
    expect((await detail(id)).record.status).toBe('exception');
    expect(
      await db
        .repository('reimbursementPayments')
        .findMany({ filter: { requestId: id } }),
    ).toEqual([]);
    const requestId = randomUUID();
    await service.transition(
      id,
      'forcePayException',
      ids.admin,
      current.lifecycleVersion,
      requestId,
      confirmation,
    );
    expect((await detail(id)).record).toMatchObject({
      status: 'forcedPaid',
      voucherNumber: null,
    });
    expect(
      await db
        .repository('reimbursementPayments')
        .findMany({ filter: { requestId: id } }),
    ).toHaveLength(1);
    await service.transition(
      id,
      'forcePayException',
      ids.admin,
      current.lifecycleVersion,
      requestId,
      confirmation,
    );
    expect(
      await db
        .repository('reimbursementPayments')
        .findMany({ filter: { requestId: id } }),
    ).toHaveLength(1);
  });
  it('alerts administrators for a real manager-stage stay with no assigned approver', async () => {
    await app.organization.addMember(
      {
        departmentId: 'reimbursement-department',
        userId: ids.outsider,
        primary: true,
      },
      { actorId: ids.head },
    );
    const notifications = app.testApp.application.container.resolve(
        approvalNotificationServiceToken,
      ),
      alarm = vi.spyOn(notifications, 'alarm').mockResolvedValue(undefined);
    try {
      const draft = (await service.create(form([50]), ids.outsider)).record,
        id = String(draft.id);
      await service.transition(
        id,
        'submit',
        ids.outsider,
        Number(draft.lifecycleVersion),
        randomUUID(),
      );
      const d = await detail(id, ids.outsider);
      expect(d.record.status).toBe('manager');
      expect(d.runs.at(-1)!.run.status).toBe('manager');
      expect(d.runs.at(-1)!.tasks).toHaveLength(0);
      await service.maintenance();
      expect(alarm).toHaveBeenCalledWith(
        expect.objectContaining({
          recordId: id,
          reason: 'unassigned',
          kind: 'oa.reimbursement',
          eventId: 'hold:' + d.runs.at(-1)!.run.id,
        }),
      );
    } finally {
      alarm.mockRestore();
    }
  }, 120000);
  it('failed secure attachment validation rolls back submission, number and all reservations', async () => {
    const input = form([500]),
      draft = (await service.create(input, ids.applicant)).record;
    attachmentCheck.mockRejectedValueOnce(
      new Error('Selected evidence is not linked to this request'),
    );
    await expect(
      service.transition(
        String(draft.id),
        'submit',
        ids.applicant,
        Number(draft.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toThrow('Selected evidence');
    expect((await detail(String(draft.id))).record).toMatchObject({
      status: 'draft',
      number: null,
      bindingCaptured: false,
    });
    expect(
      await app.testApp.application.container
        .resolve(invoiceServiceToken)
        .forDocument(String(draft.id)),
    ).toEqual([]);
  });
  it('enforces approved grade daily standards across split lines and retains facts through dictionary changes', async () => {
    const c = app.testApp.application.container;
    const tx = c.resolve(databaseManagerToken).connection();
    const travelId = randomUUID();
    const now = new Date();
    const auth = await c.resolve(expenseAuthorizationServiceToken).issue(
      {
        sourceKind: 'oa.travel',
        sourceId: travelId,
        applicantId: ids.applicant,
        grantedCents: 1000000,
        actorId: ids.applicant,
        reason: 'Approved travel fixture',
        requestKey: randomUUID(),
        now,
      },
      tx,
    );
    await tx.repository('travelRequests').createOne({
      values: {
        id: travelId,
        applicantId: ids.applicant,
        createdById: ids.applicant,
        destination: 'Office',
        reason: 'Approved business trip',
        international: false,
        needsLoan: false,
        needsBooking: false,
        startAt: now,
        endAt: now,
        transportCents: 0,
        lodgingCents: 10000,
        allowanceCents: 0,
        amountCents: 10000,
        companionIds: [],
        attachments: [],
        standardSnapshot: {
          code: 'staff',
          gradeRank: 1,
          lodgingPerNight: 100,
          allowancePerDay: 20,
        },
        authorizationId: auth.id,
        authorizationSourceId: travelId,
        approvalGrantedAt: now,
        status: 'completed',
        statusChangedAt: now,
        createdAt: now,
      },
    });
    const sourceOptions = await service.options(ids.applicant);
    expect(sourceOptions.authorizations).toContainEqual(
      expect.objectContaining({
        id: auth.id,
        sourceKind: 'oa.travel',
        grantedCents: 1000000,
        availableCents: 1000000,
      }),
    );
    await expect(
      service.options(ids.outsider, ids.applicant),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_ACCESS_DENIED' });
    const input = { ...form([6000, 4001]), authorizationId: auth.id };
    input.lines = input.lines.map((line) => ({ ...line, category: 'lodging' }));
    const draft = (await service.create(input, ids.applicant)).record;
    await expect(
      service.transition(
        String(draft.id),
        'submit',
        ids.applicant,
        Number(draft.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_STANDARD_REASON_REQUIRED' });
    expect((await detail(String(draft.id))).record.standardSnapshot).toBeNull();
    const fixed = {
      ...input,
      lines: input.lines.map((line) => ({
        ...line,
        standardExceptionReason: 'No standard-priced hotel available',
      })),
    };
    await service.transition(
      String(draft.id),
      'edit',
      ids.applicant,
      Number(draft.lifecycleVersion),
      randomUUID(),
      fixed,
    );
    const edited = await detail(String(draft.id));
    await service.transition(
      String(draft.id),
      'submit',
      ids.applicant,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    const frozen = (await detail(String(draft.id))).record.standardSnapshot;
    expect(frozen).toMatchObject({
      linkedKind: 'oa.travel',
      standard: { gradeRank: 1, lodgingPerNight: 100 },
    });
    await act(String(draft.id), ids.manager, 'approve');
    await act(String(draft.id), ids.finance, 'returnItem', input.lines[0].id);
    await tx.repository('dictionaries').updateMany({
      filter: { type: 'expenseCategory', code: 'lodging' },
      values: { extra: { travelStandardKind: 'none' } },
    });
    await tx.repository('travelRequests').updateMany({
      filter: { id: travelId },
      values: {
        standardSnapshot: {
          code: 'manager',
          gradeRank: 9,
          lodgingPerNight: 10000,
          allowancePerDay: 10000,
        },
      },
    });
    const revised = await detail(String(draft.id));
    await expect(
      service.transition(
        String(draft.id),
        'edit',
        ids.applicant,
        revised.record.lifecycleVersion,
        randomUUID(),
        {
          ...fixed,
          lines: fixed.lines.map((line, index) => ({
            ...line,
            standardExceptionReason:
              index === 0 ? '' : line.standardExceptionReason,
          })),
        },
      ),
    ).rejects.toMatchObject({ code: 'REIMBURSEMENT_STANDARD_REASON_REQUIRED' });
    expect((await detail(String(draft.id))).record.standardSnapshot).toEqual(
      frozen,
    );
    await tx.repository('dictionaries').updateMany({
      filter: { type: 'expenseCategory', code: 'lodging' },
      values: { extra: { travelStandardKind: 'lodging' } },
    });
  });
});

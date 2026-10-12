// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { approvalNotificationServiceToken } from '../../../server/providers/approval-notifications/contract.ts';
import { expenseAuthorizationServiceToken } from '../../../server/providers/expense-authorizations/contract.ts';
import { loanRequestServiceToken } from '../../../server/providers/loan-requests/contract.ts';
import { travelCancellationServiceToken } from '../../../server/providers/travel/cancellation-service.ts';
import {
  dictionaryServiceToken,
  ruleServiceToken,
} from '../../../server/providers/platform/index.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import { databaseManagerToken } from '@nocobase/db';
import {
  travelServiceToken,
  type TravelService,
} from '../../../server/providers/travel/service.ts';
import type { TravelInput } from '../../../server/providers/travel/contract.ts';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.ts';
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
let app: OrgTestApp;
let service: TravelService;
const sessions: Record<string, TestSession> = {};
const ids: Record<string, string> = {};
const departmentId = 'expense-department';
const form = (extra: Partial<TravelInput> = {}): TravelInput => ({
  destination: 'Shanghai',
  international: false,
  startAt: '2026-11-12T01:00:00Z',
  endAt: '2026-11-12T09:00:00Z',
  reason: 'Trip',
  companionIds: [],
  attachments: [],
  transportCents: 0,
  lodgingCents: 0,
  allowanceCents: 0,
  needsLoan: false,
  needsBooking: false,
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
  const offer = d.taskActions.find((v) =>
    v.actions.some((a) => a.name === action),
  );
  expect(offer).toBeDefined();
  const run = d.runs.find((v) => v.run.id === offer!.task.runId)!;
  return service.action(
    id,
    {
      target: { taskId: offer!.task.id },
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
describe('travel: expense staircase and transactional attendance/quota', () => {
  beforeAll(async () => {
    app = await startOrgTestApp();
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    service = c.resolve(travelServiceToken);
    const now = new Date().toISOString();
    for (const name of [
      'applicant',
      'manager',
      'head',
      'finance',
      'finance2',
      'executive',
      'gm',
      'proxy',
      'outsider',
      'hr',
      'admin',
    ]) {
      sessions[name] = await app.createUser(`Expense-${name}`);
      ids[name] = sessions[name].user.id;
      await db.repository('employees').createOne({
        values: {
          id: `expense-${name}`,
          code: `EXP-${name}`,
          name,
          userId: ids[name],
          managerId: name === 'applicant' ? 'expense-manager' : null,
          status: 'regular',
          active: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await db.repository('employees').updateMany({
      filter: { userId: ids.applicant },
      values: { managerId: 'expense-manager' },
    });
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
      ['hr', 'hr'],
      ['admin', 'admin'],
    ])
      await db.repository('dutyRoleMembers').createOne({
        values: {
          id: `expense-role-${name}`,
          dutyRoleCode: role,
          userId: ids[name],
          active: true,
        },
      });
  }, 120000);
  afterAll(async () => app?.close());

  it('zero domestic trip still requires manager, head and finance; one finance reject does not end the pool', async () => {
    const r = await submit(),
      id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance, 'reject');
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance2);
    expect((await detail(id)).record).toMatchObject({
      status: 'completed',
      authorizationId: null,
    });
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    expect(
      await db
        .repository('attendanceActivities')
        .findMany({ filter: { kind: 'oa.travel', userId: ids.applicant } }),
    ).toHaveLength(1);
  });
  it('creates approved attendance before booking and captures the real booking output', async () => {
    const r = await submit(
      form({
        needsBooking: true,
        startAt: '2026-11-15T01:00:00Z',
        endAt: '2026-11-15T09:00:00Z',
      }),
    );
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    expect((await detail(id)).record.status).toBe('booking');
    await act(id, ids.admin, 'claim');
    await act(id, ids.admin, 'complete', {
      input: { bookingInformation: 'Train G123, ticket reference ABC' },
    });
    expect((await detail(id)).record).toMatchObject({
      status: 'completed',
      bookingInformation: 'Train G123, ticket reference ABC',
    });
  });
  it('an unavailable booking retains approval resources and can be retried without withdrawing', async () => {
    const r = await submit(
      form({
        needsBooking: true,
        startAt: '2026-11-20T01:00:00Z',
        endAt: '2026-11-20T09:00:00Z',
      }),
    );
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    await act(id, ids.admin, 'claim');
    await act(id, ids.admin, 'unable', {
      comment: 'No train tickets are available',
    });
    const failed = await detail(id);
    expect(failed.record).toMatchObject({
      status: 'exception',
      exceptionReason: 'No train tickets are available',
    });
    expect(failed.record.approvalGrantedAt).toBeTruthy();
    expect(
      failed.view.available.some((a) => a.name === 'withdraw' && a.allowed),
    ).toBe(false);
    await service.transition(
      id,
      'retryBooking',
      ids.applicant,
      failed.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('booking');
  });
  it('revising an exception closes the old generation, preserves paid claims and records a new activity and allowance', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken),
      quota = c.resolve(expenseAuthorizationServiceToken);
    const r = await submit(
      form({
        needsBooking: true,
        transportCents: 100,
        startAt: '2026-11-23T01:00:00Z',
        endAt: '2026-11-23T09:00:00Z',
      }),
    );
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    const old = (await detail(id)).record;
    const claim = randomUUID();
    await db.transaction((tx) =>
      quota.reserveClaim(
        {
          authorizationId: old.authorizationId!,
          applicantId: ids.applicant,
          reimbursementId: claim,
          cents: 29,
          actorId: ids.applicant,
          reason: 'Paid transport',
          requestKey: randomUUID(),
        },
        tx,
      ),
    );
    await db.transaction((tx) =>
      quota.settleClaim(
        {
          authorizationId: old.authorizationId!,
          reimbursementId: claim,
          actorId: ids.finance,
          reason: 'Cash paid',
          requestKey: randomUUID(),
        },
        tx,
      ),
    );
    await act(id, ids.admin, 'claim');
    await act(id, ids.admin, 'unable', { comment: 'No available booking' });
    let d = await detail(id);
    await service.transition(
      id,
      'reviseTrip',
      ids.applicant,
      d.record.lifecycleVersion,
      randomUUID(),
    );
    expect((await quota.get(old.authorizationId!))?.state).toBe('closed');
    expect(await quota.claims(old.authorizationId!)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reimbursementId: claim,
          state: 'paid',
          cents: 29,
        }),
      ]),
    );
    d = await detail(id);
    const edited = await service.transition(
      id,
      'edit',
      ids.applicant,
      d.record.lifecycleVersion,
      randomUUID(),
      form({
        needsBooking: true,
        transportCents: 200,
        startAt: '2026-11-23T02:00:00Z',
        endAt: '2026-11-23T10:00:00Z',
      }),
    );
    await service.transition(
      id,
      'submit',
      ids.applicant,
      edited.record.lifecycleVersion,
      randomUUID(),
    );
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    const next = (await detail(id)).record;
    expect(next.approvalGeneration).toBe(2);
    expect(next.authorizationId).not.toBe(old.authorizationId);
    expect(next.authorizationSourceId).toMatch(new RegExp(`^${id}:revision:`));
    expect((await quota.get(next.authorizationId!))?.grantedCents).toBe(200);
    expect((await quota.get(old.authorizationId!))?.grantedCents).toBe(100);
    const activities = await db
      .repository('attendanceActivities')
      .findMany({ filter: { kind: 'oa.travel', userId: ids.applicant } });
    expect(
      activities.filter(
        (a) =>
          Date.parse(String(a.startAt)) ===
            Date.parse('2026-11-23T01:00:00Z') && a.status === 'withdrawn',
      ),
    ).toHaveLength(1);
    expect(
      activities.filter(
        (a) =>
          Date.parse(String(a.startAt)) ===
            Date.parse('2026-11-23T02:00:00Z') && a.status === 'active',
      ),
    ).toHaveLength(1);
  });
  it('revokes the trip at head confirmation but requires administrative cancellation and preserves failed handling evidence', async () => {
    const cancellation = app.testApp.application.container.resolve(
      travelCancellationServiceToken,
    );
    const r = await submit(
      form({
        needsBooking: true,
        startAt: '2026-12-02T01:00:00Z',
        endAt: '2026-12-02T09:00:00Z',
      }),
    );
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    await act(id, ids.admin, 'claim');
    await act(id, ids.admin, 'complete', {
      input: { bookingInformation: 'Ticket original order A' },
    });
    const created = await cancellation.create(
      { sourceId: id, reason: 'Customer cancelled meeting' },
      ids.applicant,
    );
    const cid = String(created.record.id);
    await cancellation.transition(
      cid,
      'submit',
      ids.applicant,
      Number(created.record.lifecycleVersion),
      randomUUID(),
    );
    async function answer(
      actor: string,
      name: string,
      input: Record<string, unknown> = {},
      comment?: string,
    ) {
      const d = await cancellation.detail(cid, actor);
      const offer = d.taskActions.find((v) =>
        v.actions.some((a) => a.name === name),
      )!;
      expect(offer).toBeDefined();
      const run = d.runs.find((v) => v.run.id === offer.task.runId)!;
      return cancellation.action(
        cid,
        {
          target: { taskId: offer.task.id },
          action: name,
          input,
          comment,
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
        },
        actor,
      );
    }
    await answer(ids.head, 'approve');
    expect((await detail(id)).record.status).toBe('cancelled');
    expect((await cancellation.detail(cid, ids.applicant)).record.status).toBe(
      'unbooking',
    );
    await answer(ids.admin, 'claim');
    await answer(
      ids.admin,
      'unable',
      {},
      'Carrier cancellation system unavailable',
    );
    const failed = await cancellation.detail(cid, ids.applicant);
    expect(failed.record).toMatchObject({
      status: 'exception',
      exceptionReason: 'Carrier cancellation system unavailable',
    });
    await cancellation.transition(
      cid,
      'retryUnbooking',
      ids.applicant,
      Number(failed.record.lifecycleVersion),
      randomUUID(),
    );
    await answer(ids.admin, 'claim');
    await answer(ids.admin, 'complete', {
      bookingInformation: 'Order A cancelled; refund request B remains pending',
    });
    expect(
      (await cancellation.detail(cid, ids.applicant)).record,
    ).toMatchObject({
      status: 'approved',
      unbookingInformation:
        'Order A cancelled; refund request B remains pending',
    });
    expect((await detail(id)).record.status).toBe('cancelled');
  });
  it('does not revoke an approved trip until its original head confirms cancellation', async () => {
    const cancellation = app.testApp.application.container.resolve(
      travelCancellationServiceToken,
    );
    const r = await submit(
      form({
        startAt: '2026-11-18T01:00:00Z',
        endAt: '2026-11-18T09:00:00Z',
        transportCents: 29,
      }),
    );
    const id = String(r.record.id);
    await act(id, ids.manager);
    await act(id, ids.head);
    await act(id, ids.finance);
    const draft = await cancellation.create(
      { sourceId: id, reason: 'Meeting cancelled' },
      ids.applicant,
    );
    const cid = String(draft.record.id);
    await cancellation.transition(
      cid,
      'submit',
      ids.applicant,
      Number(draft.record.lifecycleVersion),
      randomUUID(),
    );
    expect((await detail(id)).record.status).toBe('completed');
    const d = await cancellation.detail(cid, ids.head);
    const offer = d.taskActions.find((v) =>
      v.actions.some((a) => a.name === 'approve'),
    )!;
    const run = d.runs.find((v) => v.run.id === offer.task.runId)!;
    const loans = app.testApp.application.container.resolve(
      loanRequestServiceToken,
    );
    const failure = vi
      .spyOn(loans, 'markReturnDue')
      .mockRejectedValueOnce(new Error('loan write failed'));
    try {
      await expect(
        cancellation.action(
          cid,
          {
            target: { taskId: offer.task.id },
            action: 'approve',
            contentHash: run.run.contentHash,
            requestId: randomUUID(),
          },
          ids.head,
        ),
      ).rejects.toThrow('loan write failed');
      expect((await detail(id)).record).toMatchObject({
        status: 'completed',
        cancelledAt: null,
        cancellationId: null,
      });
      expect((await cancellation.detail(cid, ids.head)).record.status).toBe(
        'manager',
      );
      const db =
        app.testApp.application.container.resolve(databaseManagerToken);
      const activities = await db
        .repository('attendanceActivities')
        .findMany({ filter: { kind: 'oa.travel', userId: ids.applicant } });
      expect(
        activities.filter(
          (a) =>
            Date.parse(String(a.startAt)) ===
              Date.parse('2026-11-18T01:00:00Z') && a.status === 'withdrawn',
        ),
      ).toHaveLength(0);
    } finally {
      failure.mockRestore();
    }
    await cancellation.action(
      cid,
      {
        target: { taskId: offer.task.id },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: randomUUID(),
      },
      ids.head,
    );
    expect((await detail(id)).record).toMatchObject({
      status: 'cancelled',
      cancellationId: cid,
    });
    expect((await cancellation.detail(cid, ids.applicant)).record.status).toBe(
      'approved',
    );
  });
  it('requires a secure itinerary for an international trip', async () => {
    const r = await draft(form({ international: true }));
    await expect(
      service.transition(
        String(r.id),
        'submit',
        ids.applicant,
        Number(r.lifecycleVersion),
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: 'TRAVEL_ITINERARY_REQUIRED' });
  });
  it('rejects overlapping approved trips but permits touching half-open intervals', async () => {
    await expect(submit()).rejects.toMatchObject({ code: 'TRAVEL_OVERLAP' });
    const r = await submit(
      form({ startAt: '2026-11-12T09:00:00Z', endAt: '2026-11-12T10:00:00Z' }),
    );
    expect(r.record.status).toBe('manager');
  });

  it('maintenance alarms a genuinely empty manager stage whose run status is the stage name', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    const notifications = c.resolve(approvalNotificationServiceToken);
    const alarm = vi.spyOn(notifications, 'alarm').mockResolvedValue(undefined);
    await db.repository('employees').updateMany({
      filter: { userId: ids.applicant },
      values: { managerId: null },
    });
    try {
      const r = await submit(
        form({
          startAt: '2026-12-10T01:00:00Z',
          endAt: '2026-12-10T09:00:00Z',
        }),
      );
      const id = String(r.record.id);
      const d = await detail(id);
      expect(d.record.status).toBe('manager');
      expect(
        d.runs.some((v) => v.run.status === 'manager' && v.tasks.length === 0),
      ).toBe(true);
      await service.maintenance();
      expect(alarm).toHaveBeenCalledWith(
        expect.objectContaining({
          recordId: id,
          kind: 'oa.travel',
          reason: 'unassigned',
        }),
      );
    } finally {
      alarm.mockRestore();
      await db.repository('employees').updateMany({
        filter: { userId: ids.applicant },
        values: { managerId: 'expense-manager' },
      });
    }
  });

  it('returns the delegated applicant grade standard only under a target create grant', async () => {
    const c = app.testApp.application.container,
      db = c.resolve(databaseManagerToken);
    const targetGrade = await app.organization.createGrade(
      { code: 'TR-TARGET', title: 'Target grade', rank: 10 },
      { actorId: ids.hr },
    );
    const actorGrade = await app.organization.createGrade(
      { code: 'TR-ACTOR', title: 'HR grade', rank: 20 },
      { actorId: ids.hr },
    );
    await db.repository('employees').updateMany({
      filter: { userId: ids.applicant },
      values: { gradeId: targetGrade.id },
    });
    await db.repository('employees').updateMany({
      filter: { userId: ids.hr },
      values: { gradeId: actorGrade.id },
    });
    const dictionaries = c.resolve(dictionaryServiceToken);
    for (const [code, rank, limit] of [
      ['TR-TARGET', 10, 100],
      ['TR-ACTOR', 20, 200],
    ] as const)
      await dictionaries.create(
        'travelStandard',
        {
          code,
          label: { 'en-US': code, 'zh-CN': code },
          extra: { minRank: rank, lodgingPerNight: limit, allowancePerDay: 29 },
        },
        ids.hr,
      );
    const own = await sessions.hr.fetch('/travelRequests/options');
    expect(own.status).toBe(200);
    expect((await own.json()).data.standard.code).toBe('TR-ACTOR');
    const delegated = await sessions.hr.fetch(
      `/travelRequests/options?applicantId=${ids.applicant}`,
    );
    expect(delegated.status).toBe(200);
    expect((await delegated.json()).data).toMatchObject({
      applicantId: ids.applicant,
      standard: { code: 'TR-TARGET', lodgingPerNight: 100 },
    });
    expect(
      (
        await sessions.outsider.fetch(
          `/travelRequests/options?applicantId=${ids.applicant}`,
        )
      ).status,
    ).toBe(403);
    await expect(
      service.options(ids.hr, ids.applicant, {
        read: true,
        create: { scope: { applicantId: ids.hr }, fields: ['applicantId'] },
        update: false,
        delete: false,
      }),
    ).rejects.toMatchObject({ code: 'TRAVEL_STANDARD_TARGET_DENIED' });
    await expect(
      service.options(ids.hr, ids.applicant, {
        read: true,
        create: { scope: true, fields: ['reason'] },
        update: false,
        delete: false,
      }),
    ).rejects.toMatchObject({ code: 'TRAVEL_STANDARD_TARGET_DENIED' });
  });
  it('an international zero-cost itinerary still requires finance, executive and general manager', async () => {
    const record = await draft(
      form({
        international: true,
        startAt: '2026-12-11T01:00:00Z',
        endAt: '2026-12-11T09:00:00Z',
      }),
    );
    const id = String(record.id),
      body = new FormData();
    body.append(
      'file',
      new File(['%PDF-1.7\nInternational itinerary'], 'itinerary.pdf', {
        type: 'application/pdf',
      }),
    );
    const uploaded = await sessions.applicant.fetch(
      '/travelAttachments/uploadOne',
      {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN, 'x-travel-request-id': id },
        body,
      },
    );
    expect(uploaded.status).toBe(201);
    const fileId = (await uploaded.json()).data.record.id;
    await service.transition(
      id,
      'edit',
      ids.applicant,
      Number(record.lifecycleVersion),
      randomUUID(),
      { attachments: [fileId] },
    );
    const current = await detail(id);
    await service.transition(
      id,
      'submit',
      ids.applicant,
      current.record.lifecycleVersion,
      randomUUID(),
    );
    await act(id, ids.manager);
    await act(id, ids.head);
    expect((await detail(id)).record.status).toBe('finance');
    await act(id, ids.finance);
    expect((await detail(id)).record.status).toBe('executive');
    await act(id, ids.executive);
    expect((await detail(id)).record.status).toBe('gm');
    await act(id, ids.gm);
    expect((await detail(id)).record).toMatchObject({
      status: 'completed',
      authorizationId: null,
      international: true,
    });
  });
  it('uses exact strict monetary thresholds at 0.29 and 0.58 yuan', async () => {
    const rules = app.testApp.application.container.resolve(ruleServiceToken);
    const vp = await rules.get('spend.vp'),
      gm = await rules.get('spend.gm');
    await rules.set({ key: 'spend.vp', value: 0.29, actorId: ids.finance });
    await rules.set({ key: 'spend.gm', value: 0.58, actorId: ids.finance });
    try {
      for (const [cents, day, executive, general] of [
        [29, 13, false, false],
        [30, 14, true, false],
        [58, 15, true, false],
        [59, 16, true, true],
      ] as const) {
        const r = await submit(
            form({
              transportCents: cents,
              startAt: `2026-12-${day}T01:00:00Z`,
              endAt: `2026-12-${day}T09:00:00Z`,
            }),
          ),
          id = String(r.record.id);
        await act(id, ids.manager);
        await act(id, ids.head);
        await act(id, ids.finance);
        expect((await detail(id)).record.status).toBe(
          executive ? 'executive' : 'completed',
        );
        if (executive) {
          await act(id, ids.executive);
          expect((await detail(id)).record.status).toBe(
            general ? 'gm' : 'completed',
          );
        }
        if (general) await act(id, ids.gm);
        expect((await detail(id)).record.status).toBe('completed');
      }
    } finally {
      await rules.set({ key: 'spend.gm', value: gm, actorId: ids.finance });
      await rules.set({ key: 'spend.vp', value: vp, actorId: ids.finance });
    }
  });
  it('only one overlapping final approval succeeds for a shared companion', async () => {
    const db = app.testApp.application.container.resolve(databaseManagerToken);
    await db.repository('employees').updateMany({
      filter: { userId: ids.proxy },
      values: { managerId: 'expense-manager' },
    });
    await app.organization.addMember(
      { departmentId, userId: ids.proxy, primary: true },
      { actorId: ids.head },
    );
    const input = form({
      companionIds: [ids.outsider],
      startAt: '2026-12-20T01:00:00Z',
      endAt: '2026-12-20T09:00:00Z',
    });
    const records = await Promise.all([draft(input), draft(input, ids.proxy)]);
    const tripIds = records.map((r) => String(r.id));
    for (let i = 0; i < tripIds.length; i++) {
      const id = tripIds[i];
      await service.transition(
        id,
        'submit',
        i ? ids.proxy : ids.applicant,
        Number(records[i].lifecycleVersion),
        randomUUID(),
      );
      await act(id, ids.manager);
      await act(id, ids.head);
    }
    const results = await Promise.allSettled(
      tripIds.map((id) => act(id, ids.finance)),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const failure = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(failure.reason).toMatchObject({ code: 'TRAVEL_OVERLAP' });
    const statuses = await Promise.all(
      tripIds.map(
        async (id) => (await service.detail(id, ids.finance)).record.status,
      ),
    );
    expect(statuses.sort()).toEqual(['completed', 'finance']);
  });
});

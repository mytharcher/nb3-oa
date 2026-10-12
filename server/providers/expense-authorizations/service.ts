import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { BudgetService } from '../budgets/contract.js';
import type { CalendarService } from '../platform/calendar.js';
import type {
  ExpenseAuthorization,
  ExpenseAuthorizationService,
  ExpenseClaim,
  ExpenseCommand,
} from './contract.js';
export class ExpenseAuthorizationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new ExpenseAuthorizationError(`EXPENSE_AUTHORIZATION_${code}`, message);
}
function cents(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0)
    fail('INVALID_AMOUNT', 'Use positive safe integer cents.');
}
function sum(values: number[]): number {
  const n = values.reduce((total, value) => total + BigInt(value), 0n);
  if (n > BigInt(Number.MAX_SAFE_INTEGER))
    fail('INVALID_AMOUNT', 'The combined amount exceeds safe integer cents.');
  return Number(n);
}
function command(input: ExpenseCommand) {
  if (
    !input.actorId ||
    input.actorId.length > 64 ||
    !input.reason?.trim() ||
    input.reason.length > 4000 ||
    !input.requestKey ||
    input.requestKey.length > 255
  )
    fail('INVALID_COMMAND', 'An actor, reason and request key are required.');
  if (input.now && !Number.isFinite(input.now.getTime()))
    fail('INVALID_DATE', 'Use a valid business time.');
}
const grant = (r: ExpenseAuthorization): ExpenseAuthorization => ({
  ...r,
  grantedCents: Number(r.grantedCents),
  issuedAt: new Date(r.issuedAt),
});
const claim = (r: ExpenseClaim): ExpenseClaim => ({
  ...r,
  cents: Number(r.cents),
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
});
export function createExpenseAuthorizationService(d: {
  db: DatabaseManager;
  audit: AuditService;
  budget: BudgetService;
  calendar: CalendarService;
}): ExpenseAuthorizationService {
  async function get(id: string, tx = d.db.connection()) {
    const r = await tx
      .repository<ExpenseAuthorization>('expenseAuthorizations')
      .findOne({ filter: { id } });
    return r ? grant(r) : null;
  }
  async function claims(id: string, tx = d.db.connection()) {
    return (
      await tx
        .repository<ExpenseClaim>('expenseAuthorizationClaims')
        .findMany({ filter: { authorizationId: id } })
    ).map(claim);
  }
  async function lock(id: string, tx: DatabaseConnection) {
    const r = await tx
      .repository<ExpenseAuthorization>('expenseAuthorizations')
      .updateMany({ filter: { id }, values: { version: { increment: 1 } } });
    if (!r.updatedCount)
      fail('NOT_FOUND', 'The approved expense authorization does not exist.');
    return (await get(id, tx))!;
  }
  async function operation(
    g: ExpenseAuthorization,
    input: ExpenseCommand,
    kind: string,
    payload: unknown,
    tx: DatabaseConnection,
  ) {
    const fingerprint = JSON.stringify({
      kind,
      actorId: input.actorId,
      reason: input.reason,
      payload,
    });
    const repo = tx.repository('expenseAuthorizationOperations');
    const old = await repo.findOne({
      filter: { authorizationId: g.id, requestKey: input.requestKey },
    });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'IDEMPOTENCY_CONFLICT',
          'This key already identifies another authorization operation.',
        );
      return true;
    }
    await repo.createOne({
      values: {
        id: randomUUID(),
        authorizationId: g.id,
        requestKey: input.requestKey,
        fingerprint,
      },
    });
    return false;
  }
  function budgetCommand(
    g: ExpenseAuthorization,
    input: ExpenseCommand,
    tag: string,
  ) {
    return {
      ...g,
      departmentId: g.departmentId!,
      year: g.year!,
      subject: g.subject!,
      actorId: input.actorId,
      reason: input.reason,
      requestKey: `authorization:${tag}:${createHash('sha256')
        .update(JSON.stringify([g.sourceReference, input.requestKey]))
        .digest('hex')}`,
      reference: g.sourceReference,
    };
  }
  function expired(g: ExpenseAuthorization, now: Date) {
    return d.calendar.localDate(now) >= g.deadline;
  }
  async function releaseIfDue(
    g: ExpenseAuthorization,
    input: ExpenseCommand,
    tx: DatabaseConnection,
  ) {
    if (g.state !== 'open' || !expired(g, input.now ?? new Date()))
      return false;
    if ((await claims(g.id, tx)).some((c) => c.state === 'pending'))
      return false;
    if (g.budgetMode === 'reserved')
      await d.budget.release(budgetCommand(g, input, 'expire'), tx);
    await tx
      .repository('expenseAuthorizations')
      .updateOne({ filter: { id: g.id }, values: { state: 'expired' } });
    await d.audit.record(
      {
        actorId: input.actorId,
        action: 'expenseAuthorization.expire',
        targetType: 'expenseAuthorizations',
        targetId: g.id,
        before: g,
        after: { ...g, state: 'expired' },
        reason: input.reason,
      },
      tx,
    );
    return true;
  }
  async function resize(
    g: ExpenseAuthorization,
    input: ExpenseCommand,
    tx: DatabaseConnection,
  ) {
    if (g.budgetMode === 'none') return;
    const all = (await claims(g.id, tx)).filter((c) => c.state !== 'cancelled');
    const total = sum(all.map((c) => c.cents)),
      paid = sum(all.filter((c) => c.state === 'paid').map((c) => c.cents));
    await d.budget.adjustHold(
      {
        ...budgetCommand(g, input, 'resize'),
        cents: Math.max(g.grantedCents, total) - paid,
      },
      tx,
    );
  }
  async function changeClaim(
    input: ExpenseCommand & {
      authorizationId: string;
      reimbursementId: string;
    },
    state: 'paid' | 'cancelled',
    connection: DatabaseConnection,
  ) {
    command(input);
    return connection.transaction(async (tx) => {
      const g = await lock(input.authorizationId, tx);
      let c = (await claims(g.id, tx)).find(
        (c) => c.reimbursementId === input.reimbursementId,
      );
      if (!c)
        fail('CLAIM_NOT_FOUND', 'The reimbursement claim does not exist.');
      if (
        await operation(
          g,
          input,
          state,
          { reimbursementId: input.reimbursementId },
          tx,
        )
      )
        return c;
      if (g.state !== 'open' || c.state !== 'pending')
        fail(
          'CLAIM_STATE',
          'Only a pending claim on an open authorization can change.',
        );
      if (state === 'paid' && g.budgetMode === 'reserved')
        await d.budget.consumeHeld(
          {
            ...budgetCommand(g, input, 'pay'),
            cents: c.cents,
            consumptionReference: `${g.sourceReference}:${input.reimbursementId}`,
          },
          tx,
        );
      const before = c;
      c = claim(
        (
          await tx
            .repository<ExpenseClaim>('expenseAuthorizationClaims')
            .updateOne({
              filter: { id: c.id },
              values: { state, updatedAt: input.now ?? new Date() },
            })
        ).record,
      );
      if (state === 'cancelled') await resize(g, input, tx);
      await d.audit.record(
        {
          actorId: input.actorId,
          action: `expenseAuthorization.${state}`,
          targetType: 'expenseAuthorizationClaims',
          targetId: c.id,
          before,
          after: c,
          reason: input.reason,
        },
        tx,
      );
      await releaseIfDue(g, input, tx);
      return c;
    });
  }
  return {
    async listFor(applicantId, connection = d.db.connection()) {
      return (
        await connection
          .repository<ExpenseAuthorization>('expenseAuthorizations')
          .findMany({
            filter: { applicantId },
            sort: (s) => [s.field('issuedAt').desc(), s.field('id').asc()],
          })
      ).map(grant);
    },
    get,
    claims,
    async issue(input, connection) {
      if (input.id !== undefined && (!input.id || input.id.length > 64))
        fail('INVALID_SOURCE', 'Use a valid preassigned authorization id.');
      command(input);
      cents(input.grantedCents);
      const budgetMode =
        input.budgetMode ??
        (input.sourceKind === 'oa.expensePlan' ? 'reserved' : 'none');
      if (
        !['reserved', 'none'].includes(budgetMode) ||
        (input.sourceKind === 'oa.expensePlan' && budgetMode !== 'reserved') ||
        (budgetMode === 'reserved' &&
          (!input.departmentId ||
            !Number.isSafeInteger(input.year) ||
            !input.subject)) ||
        (budgetMode === 'none' &&
          (input.departmentId !== undefined ||
            input.year !== undefined ||
            input.subject !== undefined))
      )
        fail(
          'INVALID_BUDGET_MODE',
          'Reserved authorizations require a budget account; expense plans must reserve budget.',
        );
      const account = {
        budgetMode,
        departmentId: budgetMode === 'reserved' ? input.departmentId! : null,
        year: budgetMode === 'reserved' ? input.year! : null,
        subject: budgetMode === 'reserved' ? input.subject! : null,
      };
      if (
        !['oa.expensePlan', 'oa.travel', 'oa.training'].includes(
          input.sourceKind,
        ) ||
        !input.sourceId ||
        input.sourceId.length > 64 ||
        !input.applicantId ||
        input.applicantId.length > 64
      )
        fail(
          'INVALID_SOURCE',
          'A supported source document and applicant are required.',
        );
      return connection.transaction(async (tx) => {
        const repo = tx.repository<ExpenseAuthorization>(
          'expenseAuthorizations',
        );
        const filter = {
          sourceKind: input.sourceKind,
          sourceId: input.sourceId,
        };
        const payload = {
          ...filter,
          applicantId: input.applicantId,
          grantedCents: input.grantedCents,
          ...account,
        };
        const now = input.now ?? new Date(),
          date = d.calendar.localDate(now),
          deadline = new Date(Date.parse(`${date}T00:00:00Z`) + 90 * 86400000)
            .toISOString()
            .slice(0, 10);
        let g: ExpenseAuthorization = {
          id: input.id ?? randomUUID(),
          ...filter,
          applicantId: input.applicantId,
          ...account,
          sourceReference: `${input.sourceKind}:${input.sourceId}`,
          grantedCents: input.grantedCents,
          issuedAt: now,
          deadline,
          state: 'open',
          version: 1,
        };
        let row = await repo.findOne({ filter });
        if (!row) {
          try {
            await tx.transaction(async (savepoint) => {
              await savepoint
                .repository<ExpenseAuthorization>('expenseAuthorizations')
                .createOne({ values: { ...g } });
            });
          } catch (error) {
            row = await repo.findOne({ filter });
            if (!row) throw error;
          }
        }
        // All paths acquire the authorization before its budget account; a replay never restores spent holds.
        if (row) {
          g = await lock(row.id, tx);
          if (
            (input.id !== undefined && input.id !== g.id) ||
            g.applicantId !== input.applicantId ||
            g.grantedCents !== input.grantedCents ||
            g.budgetMode !== account.budgetMode ||
            g.departmentId !== account.departmentId ||
            g.year !== account.year ||
            g.subject !== account.subject
          )
            fail(
              'SOURCE_CONFLICT',
              'The source already has a different authorization.',
            );
          if (await operation(g, input, 'issue', payload, tx)) return g;
          fail(
            'SOURCE_CONFLICT',
            'The source authorization has already been issued.',
          );
        }
        if (g.budgetMode === 'reserved')
          await d.budget.adjustHold(
            { ...budgetCommand(g, input, 'issue'), cents: input.grantedCents },
            tx,
          );
        await operation(
          g,
          input,
          'issue',
          {
            sourceKind: input.sourceKind,
            sourceId: input.sourceId,
            applicantId: input.applicantId,
            grantedCents: input.grantedCents,
            ...account,
          },
          tx,
        );
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'expenseAuthorization.issue',
            targetType: 'expenseAuthorizations',
            targetId: g.id,
            before: null,
            after: g,
            reason: input.reason,
          },
          tx,
        );
        return g;
      });
    },
    async reserveClaim(input, connection) {
      command(input);
      cents(input.cents);
      if (!input.reimbursementId || input.reimbursementId.length > 64)
        fail('INVALID_CLAIM', 'A reimbursement document is required.');
      return connection.transaction(async (tx) => {
        const g = await lock(input.authorizationId, tx),
          payload = {
            applicantId: input.applicantId,
            reimbursementId: input.reimbursementId,
            cents: input.cents,
            overrunReason: input.overrunReason?.trim() ?? '',
          };
        const all = await claims(g.id, tx);
        if (await operation(g, input, 'reserve', payload, tx)) {
          const old = all.find(
            (c) => c.reimbursementId === input.reimbursementId,
          );
          if (!old)
            fail('CLAIM_NOT_FOUND', 'The replayed claim no longer exists.');
          return old;
        }
        if (g.state !== 'open' || expired(g, input.now ?? new Date()))
          fail(
            'EXPIRED',
            'This authorization is closed or past its claim deadline.',
          );
        if (g.applicantId !== input.applicantId)
          fail(
            'APPLICANT_MISMATCH',
            'The reimbursement applicant must match the approved source applicant.',
          );
        if (
          await tx
            .repository('expenseAuthorizationClaims')
            .findOne({ filter: { reimbursementId: input.reimbursementId } })
        )
          fail(
            'CLAIM_EXISTS',
            'This reimbursement already has an authorization claim.',
          );
        const total = sum([
          ...all.filter((c) => c.state !== 'cancelled').map((c) => c.cents),
          input.cents,
        ]);
        if (
          BigInt(total) * 5n > BigInt(g.grantedCents) * 6n &&
          !input.overrunReason?.trim()
        )
          fail(
            'OVERRUN_REASON',
            'Explain reimbursement totals exceeding the approved amount by more than 20%.',
          );
        const now = input.now ?? new Date();
        const c: ExpenseClaim = {
          id: randomUUID(),
          authorizationId: g.id,
          reimbursementId: input.reimbursementId,
          cents: input.cents,
          state: 'pending',
          overrunReason: input.overrunReason?.trim() ?? '',
          createdAt: now,
          updatedAt: now,
        };
        await tx
          .repository<ExpenseClaim>('expenseAuthorizationClaims')
          .createOne({ values: { ...c } });
        await resize(g, input, tx);
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'expenseAuthorization.reserve',
            targetType: 'expenseAuthorizationClaims',
            targetId: c.id,
            before: null,
            after: c,
            reason: input.reason,
          },
          tx,
        );
        return c;
      });
    },
    async adjustClaim(input, connection) {
      command(input);
      cents(input.cents);
      return connection.transaction(async (tx) => {
        const g = await lock(input.authorizationId, tx),
          all = await claims(g.id, tx),
          old = all.find((c) => c.reimbursementId === input.reimbursementId);
        if (!old)
          fail(
            'CLAIM_NOT_FOUND',
            'The reimbursement claim does not belong to this authorization.',
          );
        const payload = {
          applicantId: input.applicantId,
          reimbursementId: input.reimbursementId,
          cents: input.cents,
          overrunReason: input.overrunReason?.trim() ?? '',
        };
        if (await operation(g, input, 'adjust', payload, tx)) return old;
        // A claim submitted before the deadline may finish its in-progress revision after expiry; funds remain protected.
        if (g.state !== 'open' || old.state !== 'pending')
          fail(
            'CLAIM_STATE',
            'Only pending reimbursement claims can be revised.',
          );
        if (g.applicantId !== input.applicantId)
          fail(
            'APPLICANT_MISMATCH',
            'The reimbursement applicant must match the approved source applicant.',
          );
        const total = sum([
          ...all
            .filter((c) => c.state !== 'cancelled' && c.id !== old.id)
            .map((c) => c.cents),
          input.cents,
        ]);
        if (
          BigInt(total) * 5n > BigInt(g.grantedCents) * 6n &&
          !input.overrunReason?.trim()
        )
          fail(
            'OVERRUN_REASON',
            'Explain reimbursement totals exceeding the approved amount by more than 20%.',
          );
        const after = claim(
          (
            await tx
              .repository<ExpenseClaim>('expenseAuthorizationClaims')
              .updateOne({
                filter: { id: old.id },
                values: {
                  cents: input.cents,
                  overrunReason: input.overrunReason?.trim() ?? '',
                  updatedAt: input.now ?? new Date(),
                },
              })
          ).record,
        );
        await resize(g, input, tx);
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'expenseAuthorization.adjust',
            targetType: 'expenseAuthorizationClaims',
            targetId: after.id,
            before: old,
            after,
            reason: input.reason,
          },
          tx,
        );
        return after;
      });
    },
    cancelClaim: (input, tx) => changeClaim(input, 'cancelled', tx),
    settleClaim: (input, tx) => changeClaim(input, 'paid', tx),
    async close(input, connection) {
      command(input);
      return connection.transaction(async (tx) => {
        const g = await lock(input.authorizationId, tx);
        if (await operation(g, input, 'close', {}, tx)) return g;
        if (g.state !== 'open')
          fail('CLOSED', 'This authorization has already closed.');
        if ((await claims(g.id, tx)).some((c) => c.state === 'pending'))
          fail(
            'PENDING_CLAIMS',
            'Complete or cancel pending reimbursements before closing.',
          );
        if (g.budgetMode === 'reserved')
          await d.budget.release(budgetCommand(g, input, 'close'), tx);
        const after = grant(
          (
            await tx
              .repository<ExpenseAuthorization>('expenseAuthorizations')
              .updateOne({ filter: { id: g.id }, values: { state: 'closed' } })
          ).record,
        );
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'expenseAuthorization.close',
            targetType: 'expenseAuthorizations',
            targetId: g.id,
            before: g,
            after,
            reason: input.reason,
          },
          tx,
        );
        return after;
      });
    },
    async expireDue(now = new Date()) {
      let count = 0,
        pending = 0;
      const rows = await d.db
        .connection()
        .repository<ExpenseAuthorization>('expenseAuthorizations')
        .findMany({
          filter: {
            state: 'open',
          },
        });
      for (const row of rows.filter(
        (row) => row.deadline <= d.calendar.localDate(now),
      )) {
        const outcome = await d.db.transaction(async (tx) => {
          const g = await lock(row.id, tx);
          const released = await releaseIfDue(
            g,
            {
              actorId: 'system:expense-expiry',
              reason: '90 natural-day approved expense deadline',
              requestKey: `expire:${g.id}:${g.deadline}`,
              now,
            },
            tx,
          );
          return released
            ? 'expired'
            : (await claims(g.id, tx)).some((c) => c.state === 'pending')
              ? 'pending'
              : 'skip';
        });
        if (outcome === 'expired') count++;
        if (outcome === 'pending') pending++;
      }
      return { expired: count, pending };
    },
  };
}

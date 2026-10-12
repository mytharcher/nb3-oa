import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type {
  BudgetAccount,
  BudgetBalance,
  BudgetCommand,
  BudgetLedgerEntry,
  BudgetService,
} from './contract.js';

export class BudgetError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const fail = (code: string, message: string): never => {
  throw new BudgetError(`BUDGET_${code}`, message);
};
const MAX_CENTS = Number.MAX_SAFE_INTEGER;
function amount(value: number, signed = false): void {
  if (
    !Number.isSafeInteger(value) ||
    Math.abs(value) > MAX_CENTS ||
    (!signed && value < 0)
  )
    fail('INVALID_AMOUNT', 'Budget amounts must be bounded integer cents.');
}
function accountOf(input: BudgetAccount): BudgetAccount {
  if (
    !input.departmentId ||
    input.departmentId.length > 64 ||
    !input.subject ||
    input.subject.length > 64 ||
    !Number.isInteger(input.year) ||
    input.year < 1900 ||
    input.year > 9999
  )
    fail(
      'INVALID_ACCOUNT',
      'A department, year and budget subject are required.',
    );
  return {
    departmentId: input.departmentId,
    year: input.year,
    subject: input.subject,
  };
}
interface BudgetRow {
  id: string;
  departmentId: string;
  year: number;
  subject: string;
  version: number;
}
interface Entry {
  kind: string;
  reference: string;
  allocatedDelta: number;
  heldDelta: number;
  usedDelta: number;
  consumptionReference?: string | null;
}
function totals(
  id: string,
  account: BudgetAccount,
  entries: Entry[],
): BudgetBalance {
  const result: BudgetBalance = {
    id,
    ...account,
    allocatedCents: 0,
    heldCents: 0,
    usedCents: 0,
    availableCents: 0,
  };
  for (const e of entries) {
    result.allocatedCents += Number(e.allocatedDelta);
    result.heldCents += Number(e.heldDelta);
    result.usedCents += Number(e.usedDelta);
  }
  result.availableCents =
    result.allocatedCents - result.heldCents - result.usedCents;
  return result;
}
/** Account writes serialize ledger changes; nested transactions preserve caller rollback and PostgreSQL savepoints. */
export function createBudgetService(
  db: DatabaseManager,
  audit: AuditService,
): BudgetService {
  async function entries(id: string, tx: DatabaseConnection): Promise<Entry[]> {
    return (await tx
      .repository('budgetLedger')
      .findMany({ filter: { budgetId: id } })) as unknown as Entry[];
  }
  async function lock(
    account: BudgetAccount,
    tx: DatabaseConnection,
    create: boolean,
  ): Promise<string> {
    const repo = tx.repository<BudgetRow>('budgets');
    const update = () =>
      repo.updateMany({
        filter: { ...account },
        values: { version: { increment: 1 } },
        select: (s) => s.fields('id'),
      });
    let result = await update();
    if (result.records.length) return result.records[0].id;
    if (!create)
      fail('NOT_FOUND', 'No budget has been allocated for this account.');
    try {
      const id = randomUUID();
      await tx.transaction(async (savepoint) => {
        await savepoint
          .repository<BudgetRow>('budgets')
          .createOne({ values: { id, ...account, version: 1 } });
      });
      return id;
    } catch (error) {
      result = await update();
      if (!result.records.length) throw error;
      return result.records[0].id;
    }
  }
  async function mutate(
    kind: 'allocate' | 'hold' | 'settle' | 'release' | 'consume',
    input: BudgetCommand & {
      value?: number;
      requireNew?: boolean;
      consumptionReference?: string;
    },
    connection: DatabaseConnection,
  ): Promise<BudgetBalance> {
    const account = accountOf(input);
    if (
      !input.actorId ||
      input.actorId.length > 64 ||
      !input.reason?.trim() ||
      !input.reference ||
      input.reference.length > 255 ||
      !input.requestKey ||
      input.requestKey.length > 255
    )
      fail(
        'INVALID_COMMAND',
        'An actor, reason, source reference and idempotency key are required.',
      );
    if (kind === 'allocate' || kind === 'hold' || kind === 'consume')
      amount(input.value!, kind === 'allocate');
    if (
      kind === 'consume' &&
      (!input.value ||
        !input.consumptionReference ||
        input.consumptionReference.length > 255)
    )
      fail(
        'INVALID_CONSUMPTION',
        'A positive amount and unique consumption reference are required.',
      );
    const fingerprint = JSON.stringify({
      kind,
      value: input.value ?? null,
      reference: input.reference,
      actorId: input.actorId,
      reason: input.reason,
      ...(input.requireNew ? { requireNew: true } : {}),
      ...(input.consumptionReference
        ? { consumptionReference: input.consumptionReference }
        : {}),
    });
    return connection.transaction(async (tx) => {
      const id = await lock(account, tx, kind === 'allocate');
      const ledger = await entries(id, tx);
      const before = totals(id, account, ledger);
      const operations = tx.repository('budgetOperations');
      const old = await operations.findOne({
        filter: { budgetId: id, requestKey: input.requestKey },
      });
      if (old) {
        if (old.fingerprint !== fingerprint)
          fail(
            'IDEMPOTENCY_CONFLICT',
            'This key already identifies another budget operation.',
          );
        return before;
      }
      if (input.requireNew && ledger.length)
        fail(
          'ALREADY_EXISTS',
          'A budget already exists for this department, year and subject.',
        );
      if (
        kind === 'consume' &&
        ledger.some(
          (e) => e.consumptionReference === input.consumptionReference,
        )
      )
        fail(
          'ALREADY_CONSUMED',
          'This reimbursement has already consumed reserved funds.',
        );
      const source = ledger.filter(
        (e) => e.reference === input.reference && e.kind !== 'allocate',
      );
      const held = source.reduce((sum, e) => sum + Number(e.heldDelta), 0);
      if (
        kind !== 'allocate' &&
        source.some((e) => e.kind === 'settle' || e.kind === 'transferOut')
      )
        fail(
          'ALREADY_SETTLED',
          'A settled document cannot reserve or release funds again.',
        );
      let allocatedDelta = 0,
        heldDelta = 0,
        usedDelta = 0;
      if (kind === 'allocate') {
        allocatedDelta = input.value!;
        if (before.availableCents + allocatedDelta < 0)
          fail(
            'INSUFFICIENT',
            'Allocated funds cannot fall below held and used funds.',
          );
        amount(before.allocatedCents + allocatedDelta);
      } else if (kind === 'hold') {
        heldDelta = input.value! - held;
        if (heldDelta > before.availableCents)
          fail(
            'INSUFFICIENT',
            'There are insufficient available budget funds.',
          );
      } else if (kind === 'consume') {
        if (input.value! > held)
          fail(
            'INSUFFICIENT_HELD',
            'The source reservation cannot cover this payment.',
          );
        heldDelta = -input.value!;
        usedDelta = input.value!;
      } else {
        heldDelta = -held;
        if (kind === 'settle') usedDelta = held;
      }
      const entry = {
        kind,
        reference: input.reference,
        allocatedDelta,
        heldDelta,
        usedDelta,
        ...(kind === 'consume'
          ? { consumptionReference: input.consumptionReference! }
          : {}),
      };
      if (kind === 'consume') {
        // A receipt is unique across accounts too: changing an account must not pay the same source/claim twice.
        try {
          await tx.transaction(async (savepoint) => {
            await savepoint.repository('budgetConsumptions').createOne({
              values: {
                id: randomUUID(),
                budgetId: id,
                sourceReference: input.reference,
                consumptionReference: input.consumptionReference!,
                cents: input.value!,
                requestKey: input.requestKey,
              },
            });
          });
        } catch (error) {
          if (
            await tx.repository('budgetConsumptions').findOne({
              filter: { consumptionReference: input.consumptionReference! },
            })
          )
            fail(
              'ALREADY_CONSUMED',
              'This source reimbursement has already consumed reserved funds.',
            );
          throw error;
        }
      }
      // Keep zero settlements as terminal evidence, preventing a completed document from reserving again.
      await tx.repository('budgetLedger').createOne({
        values: {
          id: randomUUID(),
          budgetId: id,
          ...entry,
          requestKey: input.requestKey,
          actorId: input.actorId,
          reason: input.reason.trim(),
          at: new Date(),
        },
      });
      await operations.createOne({
        values: {
          id: randomUUID(),
          budgetId: id,
          requestKey: input.requestKey,
          fingerprint,
        },
      });
      const after = totals(id, account, [...ledger, entry]);
      await audit.record(
        {
          actorId: input.actorId,
          action: `budget.${kind}`,
          targetType: 'budgets',
          targetId: id,
          before,
          after: { ...after, reference: input.reference },
          reason: input.reason,
        },
        tx,
      );
      return after;
    });
  }
  return {
    consumeHeld: (input, tx) =>
      mutate('consume', { ...input, value: input.cents }, tx),
    async get(id, connection = db.connection()) {
      const row = await connection
        .repository<BudgetRow>('budgets')
        .findOne({ filter: { id } });
      return row
        ? totals(row.id, accountOf(row), await entries(row.id, connection))
        : null;
    },
    async list(query, connection = db.connection()) {
      if (
        !Number.isInteger(query.page) ||
        query.page < 1 ||
        !Number.isInteger(query.pageSize) ||
        query.pageSize < 1 ||
        query.pageSize > 100
      )
        fail('INVALID_PAGE', 'Budget pages must use 1–100 entries.');
      const filter = {
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.year ? { year: query.year } : {}),
        ...(query.subject ? { subject: query.subject } : {}),
      };
      const rows = await connection
        .repository<BudgetRow>('budgets')
        .findMany(Object.keys(filter).length ? { filter } : {});
      // Balances are ledger aggregates. Sort the complete filtered set before paging, never a capped page.
      const balances = await Promise.all(
        rows.map(async (row) =>
          totals(row.id, accountOf(row), await entries(row.id, connection)),
        ),
      );
      const field = query.sort ?? 'year';
      const sign = query.direction === 'asc' ? 1 : -1;
      balances.sort(
        (a, b) => sign * (a[field] - b[field]) || a.id.localeCompare(b.id),
      );
      const page = Math.min(
        query.page,
        Math.max(1, Math.ceil(balances.length / query.pageSize)),
      );
      return {
        page,
        items: balances.slice(
          (page - 1) * query.pageSize,
          page * query.pageSize,
        ),
        total: balances.length,
      };
    },
    allocate: (input, tx) =>
      mutate('allocate', { ...input, value: input.deltaCents }, tx),
    adjustHold: (input, tx) =>
      mutate('hold', { ...input, value: input.cents }, tx),
    settle: (input, tx) => mutate('settle', input, tx),
    release: (input, tx) => mutate('release', input, tx),
    async transferHeld(input, connection) {
      const source = accountOf(input);
      const target = accountOf({ ...source, subject: input.targetSubject });
      if (source.subject === target.subject)
        fail('INVALID_TRANSFER', 'Source and target subjects must differ.');
      if (
        !input.actorId ||
        input.actorId.length > 64 ||
        !input.reason?.trim() ||
        !input.reference ||
        input.reference.length > 255 ||
        !input.requestKey ||
        input.requestKey.length > 255
      )
        fail(
          'INVALID_COMMAND',
          'An actor, reason, source reference and idempotency key are required.',
        );
      const fingerprint = JSON.stringify({
        kind: 'transfer',
        target,
        reference: input.reference,
        actorId: input.actorId,
        reason: input.reason,
      });
      return connection.transaction(async (tx) => {
        // Every transfer takes both accounts in the same order, including opposite-subject transfers.
        const ids = new Map<string, string>();
        for (const a of [source, target].sort((a, b) =>
          a.subject.localeCompare(b.subject),
        ))
          ids.set(a.subject, await lock(a, tx, a.subject === target.subject));
        const sourceId = ids.get(source.subject)!,
          targetId = ids.get(target.subject)!;
        const sourceEntries = await entries(sourceId, tx),
          targetEntries = await entries(targetId, tx);
        const beforeSource = totals(sourceId, source, sourceEntries),
          beforeTarget = totals(targetId, target, targetEntries);
        const operations = tx.repository('budgetOperations');
        const old = await operations.findOne({
          filter: { budgetId: sourceId, requestKey: input.requestKey },
        });
        if (old) {
          if (old.fingerprint !== fingerprint)
            fail(
              'IDEMPOTENCY_CONFLICT',
              'This key already identifies another budget operation.',
            );
          return { source: beforeSource, target: beforeTarget };
        }
        const sourceDocument = sourceEntries.filter(
          (e) => e.reference === input.reference && e.kind !== 'allocate',
        );
        if (
          sourceDocument.some(
            (e) => e.kind === 'settle' || e.kind === 'transferOut',
          )
        )
          fail(
            'ALREADY_SETTLED',
            'A settled document cannot transfer funds again.',
          );
        const cents = sourceDocument.reduce(
          (sum, e) => sum + Number(e.heldDelta),
          0,
        );
        if (cents <= 0)
          fail(
            'NO_RESERVATION',
            'The adjustment must reserve source funds before transfer.',
          );
        amount(beforeTarget.allocatedCents + cents);
        const out = {
          kind: 'transferOut',
          reference: input.reference,
          allocatedDelta: -cents,
          heldDelta: -cents,
          usedDelta: 0,
        };
        const into = {
          kind: 'transferIn',
          reference: input.reference,
          allocatedDelta: cents,
          heldDelta: 0,
          usedDelta: 0,
        };
        for (const [id, entry] of [
          [sourceId, out],
          [targetId, into],
        ] as const) {
          await tx.repository('budgetLedger').createOne({
            values: {
              id: randomUUID(),
              budgetId: id,
              ...entry,
              requestKey: input.requestKey,
              actorId: input.actorId,
              reason: input.reason.trim(),
              at: new Date(),
            },
          });
          await operations.createOne({
            values: {
              id: randomUUID(),
              budgetId: id,
              requestKey: input.requestKey,
              fingerprint,
            },
          });
        }
        const after = {
          source: totals(sourceId, source, [...sourceEntries, out]),
          target: totals(targetId, target, [...targetEntries, into]),
        };
        await audit.record(
          {
            actorId: input.actorId,
            action: 'budget.transfer',
            targetType: 'budgets',
            targetId: sourceId,
            before: { source: beforeSource, target: beforeTarget },
            after: { ...after, reference: input.reference },
            reason: input.reason,
          },
          tx,
        );
        return after;
      });
    },
    async ledger(input, query, connection = db.connection()) {
      const account = accountOf(input);
      if (
        !Number.isInteger(query.page) ||
        query.page < 1 ||
        !Number.isInteger(query.pageSize) ||
        query.pageSize < 1 ||
        query.pageSize > 100
      )
        fail('INVALID_PAGE', 'Budget ledger pages must use 1–100 entries.');
      const row = await connection
        .repository<BudgetRow>('budgets')
        .findOne({ filter: { ...account } });
      if (!row) return { items: [], total: 0, page: 1 };
      const repo = connection.repository<BudgetLedgerEntry>('budgetLedger');
      const filter = { budgetId: row.id };
      const field = query.sort ?? 'at',
        direction = query.direction ?? 'desc';
      const total = await repo.count({ filter });
      const page = Math.min(
        query.page,
        Math.max(1, Math.ceil(total / query.pageSize)),
      );
      const items = await repo.findMany({
        filter,
        limit: query.pageSize,
        offset: (page - 1) * query.pageSize,
        sort: (s) =>
          direction === 'asc'
            ? [s.field(field).asc(), s.field('id').asc()]
            : [s.field(field).desc(), s.field('id').desc()],
      });
      return {
        items: items.map((e) => ({
          ...e,
          allocatedDelta: Number(e.allocatedDelta),
          heldDelta: Number(e.heldDelta),
          usedDelta: Number(e.usedDelta),
          at: new Date(e.at),
        })),
        total,
        page,
      };
    },
    async balance(input, connection = db.connection()) {
      const account = accountOf(input);
      const row = await connection
        .repository<BudgetRow>('budgets')
        .findOne({ filter: { ...account } });
      return row
        ? totals(row.id, account, await entries(row.id, connection))
        : null;
    },
  };
}

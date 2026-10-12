import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type {
  LeaveAccount,
  LeaveBalance,
  LeaveBalanceCommand,
  LeaveBalanceService,
  LeaveGrantCommand,
  LeaveLedgerEntry,
} from './contract.js';
export class LeaveBalanceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
interface Lot {
  id: string;
  available: number;
  held: number;
  expiresAt: Date | null;
}
function fail(code: string, message: string): never {
  throw new LeaveBalanceError(code, message);
}
function units(value: number | undefined, zero = false): number {
  if (
    !Number.isSafeInteger(value) ||
    value! < (zero ? 0 : 1) ||
    value! > 2_000_000_000
  )
    fail(
      'LEAVE_BALANCE_INVALID_UNITS',
      'Leave amounts must be integer half-days.',
    );
  return value!;
}
function validAccount(account: LeaveAccount): void {
  for (const value of [account.employeeId, account.leaveType])
    if (!value || value.length > 64)
      fail(
        'LEAVE_BALANCE_INVALID_ACCOUNT',
        'An employee id and leave type are required.',
      );
}
function date(value: Date | null | undefined): Date | null {
  if (value == null) return null;
  const result = new Date(value);
  if (!Number.isFinite(result.getTime()))
    fail('LEAVE_BALANCE_INVALID_DATE', 'Invalid leave expiry or event time.');
  return result;
}
function normalize(row: LeaveLedgerEntry): LeaveLedgerEntry {
  return {
    ...row,
    availableDelta: Number(row.availableDelta),
    heldDelta: Number(row.heldDelta),
    at: new Date(row.at),
    expiresAt: date(row.expiresAt),
  };
}
function fold(rows: LeaveLedgerEntry[]): Map<string, Lot> {
  const lots = new Map<string, Lot>();
  for (const row of rows) {
    const lot = lots.get(row.lotId) ?? {
      id: row.lotId,
      available: 0,
      held: 0,
      expiresAt: row.expiresAt,
    };
    lot.available += row.availableDelta;
    lot.held += row.heldDelta;
    lots.set(row.lotId, lot);
  }
  return lots;
}
function balanceOf(
  account: LeaveAccount,
  lots: Map<string, Lot>,
  at: Date,
): LeaveBalance {
  let availableUnits = 0;
  let heldUnits = 0;
  for (const lot of lots.values()) {
    if (!lot.expiresAt || lot.expiresAt > at) availableUnits += lot.available;
    heldUnits += lot.held;
  }
  return { ...account, availableUnits, heldUnits };
}
/** Serialized by account lock writes. No balance snapshots or floating point quantities are stored. */
export function createLeaveBalanceService(
  db: DatabaseManager,
  audit: AuditService,
): LeaveBalanceService {
  async function rowsOf(
    account: LeaveAccount,
    connection: DatabaseConnection,
  ): Promise<LeaveLedgerEntry[]> {
    return (
      (await connection.repository('leaveLedger').findMany({
        filter: {
          employeeId: account.employeeId,
          leaveType: account.leaveType,
        },
        sort: (s) => [s.field('at').asc(), s.field('id').asc()],
      })) as unknown as LeaveLedgerEntry[]
    ).map(normalize);
  }
  async function lock(
    account: LeaveAccount,
    connection: DatabaseConnection,
  ): Promise<void> {
    // One coordination row per employee also serializes cross-type revisions, avoiding opposite lock orders.
    const lockAccount = { employeeId: account.employeeId, leaveType: '*' };
    const locks = connection.repository('leaveBalanceLocks');
    const update = () =>
      locks.updateMany({
        filter: lockAccount,
        values: { version: { increment: 1 } },
        select: (s) => s.fields('id'),
      });
    const result = await update();
    if (result.records.length) return;
    try {
      await connection.transaction(async (savepoint) => {
        await savepoint.repository('leaveBalanceLocks').createOne({
          values: { id: randomUUID(), ...lockAccount, version: 1 },
        });
      });
    } catch (error) {
      if (!(await update()).records.length) throw error;
    }
  }
  async function mutate(
    kind:
      | 'grant'
      | 'hold'
      | 'adjustHold'
      | 'deduct'
      | 'release'
      | 'refund'
      | 'adjust',
    input: LeaveGrantCommand | LeaveBalanceCommand,
    connection: DatabaseConnection,
  ): Promise<LeaveBalance> {
    validAccount(input);
    if (
      !input.requestKey ||
      input.requestKey.length > 255 ||
      !input.reference ||
      input.reference.length > 255
    )
      fail(
        'LEAVE_BALANCE_INVALID_REFERENCE',
        'An idempotency key and source reference are required.',
      );
    const at = date(input.at) ?? new Date();
    const expiresAt = date('expiresAt' in input ? input.expiresAt : null);
    if (kind === 'grant' || (kind === 'adjust' && input.units! > 0)) {
      units(input.units);
      if (expiresAt && expiresAt <= at)
        fail(
          'LEAVE_BALANCE_INVALID_EXPIRY',
          'A grant must expire after its event time.',
        );
    } else if (kind === 'hold' || kind === 'refund') units(input.units);
    else if (kind === 'adjustHold') units(input.units, true);
    else if (kind === 'adjust') units(-input.units!);
    if (kind === 'adjust' && (!input.actorId || !input.reason?.trim()))
      fail(
        'LEAVE_BALANCE_ADJUSTMENT_REASON_REQUIRED',
        'An actor and reason are required for HR adjustments.',
      );
    const account = {
      employeeId: input.employeeId,
      leaveType: input.leaveType,
    };
    const fingerprint = JSON.stringify({
      kind,
      reference: input.reference,
      units: input.units ?? null,
      expiresAt: expiresAt?.toISOString() ?? null,
      actorId: input.actorId ?? null,
      reason: input.reason ?? null,
    });
    return connection.transaction(async (tx) => {
      await lock(account, tx);
      const old = await tx
        .repository('leaveBalanceOperations')
        .findOne({ filter: { ...account, requestKey: input.requestKey } });
      if (old) {
        if (old.fingerprint !== fingerprint)
          fail(
            'LEAVE_BALANCE_IDEMPOTENCY_CONFLICT',
            'The idempotency key was already used for another change.',
          );
        return balanceOf(account, fold(await rowsOf(account, tx)), at);
      }
      const rows = await rowsOf(account, tx);
      const lots = fold(rows);
      const before = balanceOf(account, lots, at);
      const pending: LeaveLedgerEntry[] = [];
      const append = (
        eventKind: LeaveLedgerEntry['kind'],
        lot: Lot,
        availableDelta: number,
        heldDelta: number,
        reference = input.reference,
        requestKey = input.requestKey,
      ) => {
        if (!availableDelta && !heldDelta) return;
        const entry: LeaveLedgerEntry = {
          id: randomUUID(),
          ...account,
          kind: eventKind,
          lotId: lot.id,
          reference,
          requestKey,
          availableDelta,
          heldDelta,
          at,
          expiresAt: lot.expiresAt,
          actorId: input.actorId ?? null,
          reason: input.reason ?? null,
        };
        pending.push(entry);
        lot.available += availableDelta;
        lot.held += heldDelta;
      };
      // Held entitlements remain reserved after expiry; release/refund below are immediately swept again.
      const sweep = () => {
        for (const lot of lots.values())
          if (lot.expiresAt && lot.expiresAt <= at && lot.available > 0)
            append(
              'expire',
              lot,
              -lot.available,
              0,
              `expiry:${lot.id}`,
              `expiry:${lot.id}:${randomUUID()}`,
            );
      };
      sweep();
      const available = () =>
        [...lots.values()]
          .filter((l) => l.available > 0)
          .sort(
            (a, b) =>
              (a.expiresAt?.getTime() ?? Infinity) -
                (b.expiresAt?.getTime() ?? Infinity) ||
              a.id.localeCompare(b.id),
          );
      const consume = (amount: number, eventKind: 'hold' | 'expire') => {
        if (available().reduce((sum, l) => sum + l.available, 0) < amount)
          fail(
            'LEAVE_BALANCE_INSUFFICIENT',
            'Available leave balance is insufficient.',
          );
        for (const lot of available()) {
          const count = Math.min(lot.available, amount);
          append(eventKind, lot, -count, eventKind === 'hold' ? count : 0);
          amount -= count;
          if (!amount) break;
        }
      };
      const referenced = rows.filter((r) => r.reference === input.reference);
      const held = new Map<string, number>();
      for (const row of referenced)
        held.set(row.lotId, (held.get(row.lotId) ?? 0) + row.heldDelta);
      const heldTotal = [...held.values()].reduce((sum, n) => sum + n, 0);
      const closed = referenced.some((r) => r.kind === 'deduct');
      if (kind === 'grant' || (kind === 'adjust' && input.units! > 0)) {
        const lot: Lot = { id: randomUUID(), available: 0, held: 0, expiresAt };
        lots.set(lot.id, lot);
        append('grant', lot, input.units!, 0);
      } else if (kind === 'adjust') consume(-input.units!, 'expire');
      else if (kind === 'hold' || kind === 'adjustHold') {
        if (closed)
          fail(
            'LEAVE_BALANCE_REFERENCE_CLOSED',
            'The leave reservation has already terminated.',
          );
        if (kind === 'hold' && heldTotal)
          fail(
            'LEAVE_BALANCE_ALREADY_HELD',
            'This leave request already has a reservation.',
          );
        const change = input.units! - heldTotal;
        if (change > 0) consume(change, 'hold');
        else {
          let remaining = -change;
          for (const [lotId, count] of held) {
            const restore = Math.min(count, remaining);
            append('release', lots.get(lotId)!, restore, -restore);
            remaining -= restore;
            if (!remaining) break;
          }
        }
      } else if (kind === 'deduct' || kind === 'release') {
        if (!heldTotal && kind === 'deduct' && !closed)
          fail(
            'LEAVE_BALANCE_HOLD_NOT_FOUND',
            'No outstanding leave reservation exists.',
          );
        if (closed && kind === 'release')
          fail(
            'LEAVE_BALANCE_REFERENCE_CLOSED',
            'The leave reservation has already been deducted.',
          );
        for (const [lotId, count] of held)
          if (count)
            append(
              kind,
              lots.get(lotId)!,
              kind === 'release' ? count : 0,
              -count,
            );
      } else if (kind === 'refund') {
        const refundable = new Map<string, number>();
        for (const row of referenced) {
          if (row.kind === 'deduct')
            refundable.set(
              row.lotId,
              (refundable.get(row.lotId) ?? 0) - row.heldDelta,
            );
          if (row.kind === 'refund')
            refundable.set(
              row.lotId,
              (refundable.get(row.lotId) ?? 0) - row.availableDelta,
            );
        }
        if (
          [...refundable.values()].reduce((sum, n) => sum + n, 0) < input.units!
        )
          fail(
            'LEAVE_BALANCE_REFUND_EXCEEDS_DEDUCTED',
            'The refund exceeds the unrefunded deducted leave.',
          );
        let remaining = input.units!;
        for (const [lotId, count] of refundable) {
          const restored = Math.min(count, remaining);
          append('refund', lots.get(lotId)!, restored, 0);
          remaining -= restored;
          if (!remaining) break;
        }
      }
      sweep();
      for (const entry of pending)
        await tx.repository('leaveLedger').createOne({ values: { ...entry } });
      await tx.repository('leaveBalanceOperations').createOne({
        values: {
          id: randomUUID(),
          ...account,
          requestKey: input.requestKey,
          fingerprint,
        },
      });
      const after = balanceOf(account, lots, at);
      if (kind === 'adjust')
        await audit.record(
          {
            actorId: input.actorId!,
            action: 'leaveBalance.adjust',
            targetType: 'leaveLedger',
            targetId: input.employeeId,
            before,
            after,
            reason: input.reason,
          },
          tx,
        );
      return after;
    });
  }
  const service: LeaveBalanceService = {
    grant: (i, c) => mutate('grant', i, c),
    hold: (i, c) => mutate('hold', i, c),
    adjustHold: (i, c) => mutate('adjustHold', i, c),
    deduct: (i, c) => mutate('deduct', i, c),
    release: (i, c) => mutate('release', i, c),
    refund: (i, c) => mutate('refund', i, c),
    adjust: (i, c) => mutate('adjust', i, c),
    async releaseReference(input, connection) {
      const account = { employeeId: input.employeeId, leaveType: '*' };
      validAccount(account);
      if (
        !input.reference ||
        input.reference.length > 255 ||
        !input.requestKey ||
        input.requestKey.length > 255
      )
        fail(
          'LEAVE_BALANCE_INVALID_REFERENCE',
          'An idempotency key and source reference are required.',
        );
      const fingerprint = JSON.stringify({
        kind: 'releaseReference',
        reference: input.reference,
        exceptLeaveType: input.exceptLeaveType ?? null,
        actorId: input.actorId ?? null,
      });
      await connection.transaction(async (tx) => {
        await lock(account, tx);
        const old = await tx
          .repository('leaveBalanceOperations')
          .findOne({ filter: { ...account, requestKey: input.requestKey } });
        if (old) {
          if (old.fingerprint !== fingerprint)
            fail(
              'LEAVE_BALANCE_IDEMPOTENCY_CONFLICT',
              'The idempotency key was already used for another release.',
            );
          return;
        }
        const records = (await tx.repository('leaveLedger').findMany({
          filter: {
            employeeId: input.employeeId,
            reference: input.reference,
          },
        })) as unknown as LeaveLedgerEntry[];
        const holds = new Map<string, number>();
        for (const row of records)
          holds.set(
            row.leaveType,
            (holds.get(row.leaveType) ?? 0) + Number(row.heldDelta),
          );
        for (const leaveType of [...holds.keys()].sort())
          if (leaveType !== input.exceptLeaveType && holds.get(leaveType)! > 0)
            await service.release({ ...input, leaveType }, tx);
        await tx.repository('leaveBalanceOperations').createOne({
          values: {
            id: randomUUID(),
            ...account,
            requestKey: input.requestKey,
            fingerprint,
          },
        });
      });
    },
    async expire(account, connection) {
      validAccount(account);
      const at = date(account.at) ?? new Date();
      return connection.transaction(async (tx) => {
        await lock(account, tx);
        const lots = fold(await rowsOf(account, tx));
        for (const lot of lots.values())
          if (lot.expiresAt && lot.expiresAt <= at && lot.available > 0) {
            await tx.repository('leaveLedger').createOne({
              values: {
                id: randomUUID(),
                employeeId: account.employeeId,
                leaveType: account.leaveType,
                lotId: lot.id,
                requestKey: `expiry:${lot.id}:${randomUUID()}`,
                reference: `expiry:${lot.id}`,
                kind: 'expire',
                availableDelta: -lot.available,
                heldDelta: 0,
                expiresAt: lot.expiresAt,
                at,
                actorId: null,
                reason: null,
              },
            });
            lot.available = 0;
          }
        return balanceOf(
          { employeeId: account.employeeId, leaveType: account.leaveType },
          lots,
          at,
        );
      });
    },
    async expireDue(at = new Date()) {
      const rows = await db.repository('leaveLedger').findMany({
        filter: (f) =>
          f.and([
            f.string('kind').eq('grant'),
            f.date('expiresAt').before(new Date(at.getTime() + 1)),
          ]),
        select: (s) => s.fields('employeeId', 'leaveType'),
      });
      const accounts = new Map<string, LeaveAccount>();
      for (const row of rows as unknown as LeaveAccount[]) {
        const account = {
          employeeId: row.employeeId,
          leaveType: row.leaveType,
        };
        accounts.set(JSON.stringify(account), account);
      }
      for (const account of accounts.values())
        await db.transaction((tx) => service.expire({ ...account, at }, tx));
      return accounts.size;
    },
    async balance(account, connection = db.connection()) {
      validAccount(account);
      return balanceOf(
        account,
        fold(await rowsOf(account, connection)),
        new Date(),
      );
    },
    async list(employeeId, connection = db.connection()) {
      const rows = (await connection
        .repository('leaveLedger')
        .findMany({ filter: { employeeId } })) as unknown as LeaveLedgerEntry[];
      const types = [...new Set(rows.map((r) => r.leaveType))].sort();
      return Promise.all(
        types.map((leaveType) =>
          service.balance({ employeeId, leaveType }, connection),
        ),
      );
    },
    async ledger(
      account,
      page,
      pageSize,
      order = { field: 'at', direction: 'desc' },
    ) {
      validAccount(account);
      const repository = db.repository('leaveLedger');
      const [items, total] = await Promise.all([
        repository.findMany({
          filter: {
            employeeId: account.employeeId,
            leaveType: account.leaveType,
          },
          sort: (s) => [
            order.direction === 'asc'
              ? s.field(order.field).asc()
              : s.field(order.field).desc(),
            s.field('id').desc(),
          ],
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        repository.count({
          filter: {
            employeeId: account.employeeId,
            leaveType: account.leaveType,
          },
        }),
      ]);
      return {
        items: (items as unknown as LeaveLedgerEntry[]).map(normalize),
        total,
      };
    },
  };
  return service;
}

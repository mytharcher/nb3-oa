import { demoNow } from '../demo-data/context.js';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import type { ReplacementNotifications } from './notifications.js';
import type { CalendarService } from '../platform/calendar.js';
import type {
  HeadcountAccount,
  HeadcountBalance,
  HeadcountCommand,
  HeadcountKey,
  HeadcountReservation,
  HeadcountService,
  HeadcountSource,
} from './contract.js';
export class HeadcountError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new HeadcountError(`HEADCOUNT_${code}`, message);
}
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canonical = (v: unknown): string =>
  JSON.stringify(v, (_k, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  );
const number = (v: number, positive = false) => {
  if (!Number.isSafeInteger(v) || v < (positive ? 1 : 0) || v > 1000000)
    fail('INVALID_NUMBER', 'Headcounts must be bounded whole persons.');
};
interface Occupancy {
  id: string;
  accountId: string;
  employeeId: string;
  state: string;
  claimSeatId: string | null;
  sourceReference: string;
  releaseKind: string | null;
  generation: number;
}
interface Seat {
  id: string;
  accountId: string;
  sourceReference: string;
  ordinal: number;
  state: string;
  replacementOccupancyId: string | null;
  employeeId: string | null;
}
interface Source extends HeadcountSource {
  id: string;
  accountId: string;
  mode: string;
  state: string;
  quantity: number;
}
export function createHeadcountService(d: {
  audit: AuditService;
  employees: EmployeeService;
  org: OrgService;
  calendar: CalendarService;
  notifications?: Pick<ReplacementNotifications, 'enqueue'>;
}): HeadcountService {
  async function within<T>(
    connection: DatabaseConnection,
    work: (tx: DatabaseConnection) => Promise<T>,
  ) {
    return connection.transaction(async (tx) => {
      // A durable database lock, not a process mutex. Complete roster reconciliation and cross-account writes serialize.
      const locked = await tx.repository('headcountGuards').updateMany({
        filter: { id: 'mutation' },
        values: { version: { increment: 0 } },
      });
      if (locked.updatedCount !== 1)
        fail(
          'GUARD_UNAVAILABLE',
          'Headcount transaction guard is unavailable.',
        );
      return work(tx);
    });
  }
  async function employeeLock(ids: readonly string[], tx: DatabaseConnection) {
    for (const id of [...new Set(ids)].sort()) {
      const employee = await d.employees.getById(id, tx);
      if (!employee)
        fail('EMPLOYEE_NOT_FOUND', 'The employee archive does not exist.');
      await tx
        .repository('employees')
        .updateMany({ filter: { id }, values: { status: employee.status } });
    }
  }
  async function account(
    id: string,
    tx: DatabaseConnection,
    initialized = true,
  ): Promise<HeadcountAccount> {
    const value = await tx
      .repository<HeadcountAccount>('headcountAccounts')
      .findOne({ filter: { id } });
    if (!value) fail('NOT_FOUND', 'Headcount account not found.');
    if (initialized && !value.initialized)
      fail(
        'NOT_INITIALIZED',
        'Reconcile the complete real employee roster first.',
      );
    return value;
  }
  async function accounts(ids: readonly string[], tx: DatabaseConnection) {
    const rows = await Promise.all(
      [...new Set(ids)].map((id) => account(id, tx, false)),
    );
    rows.sort((a, b) =>
      canonical([a.departmentId, a.positionId, a.year]).localeCompare(
        canonical([b.departmentId, b.positionId, b.year]),
      ),
    );
    for (const row of rows) {
      if (!Number.isSafeInteger(row.version) || row.version >= 2147483647)
        fail('VERSION_CONFLICT', 'The account version cannot safely advance.');
      const update = await tx.repository('headcountAccounts').updateMany({
        filter: { id: row.id, version: row.version },
        values: { version: row.version + 1, updatedAt: demoNow() },
      });
      if (update.updatedCount !== 1)
        fail('VERSION_CONFLICT', 'The headcount account changed.');
    }
  }
  async function balances(
    id: string,
    tx: DatabaseConnection,
  ): Promise<HeadcountBalance> {
    const a = await account(id, tx, false);
    const seats = await tx
      .repository<Seat>('headcountSeats')
      .findMany({ filter: { accountId: id } });
    const used = await tx
      .repository('headcountOccupancies')
      .count({ filter: { accountId: id, state: 'used' } });
    const count = (state: string) =>
      seats.filter((s) => s.state === state).length;
    const pending = count('pending'),
      allocated = count('allocated');
    return {
      ...a,
      createdAt: new Date(a.createdAt).toISOString(),
      updatedAt: new Date(a.updatedAt).toISOString(),
      used,
      pending,
      allocated,
      replacementPending: count('futurePending'),
      replacementAllocated: count('futureAllocated'),
      replacementBlocked: count('blocked'),
      available: a.limit - used - pending - allocated,
    };
  }
  async function capacity(
    id: string,
    quantity: number,
    tx: DatabaseConnection,
  ) {
    await account(id, tx);
    const b = await balances(id, tx);
    if (quantity > b.available)
      fail(
        'INSUFFICIENT',
        'The initialized account has insufficient available headcount.',
      );
  }
  async function command<T>(
    kind: string,
    input: HeadcountCommand,
    tx: DatabaseConnection,
    work: () => Promise<T>,
  ): Promise<T> {
    if (
      !input.actorId ||
      input.actorId.length > 64 ||
      !input.requestKey ||
      input.requestKey.length > 128 ||
      !input.reason?.trim() ||
      input.reason.length > 5000
    )
      fail(
        'INVALID_COMMAND',
        'An actor, immutable request key and reason are required.',
      );
    const id = hash([input.actorId, input.requestKey]),
      fingerprint = hash(canonical({ kind, input }));
    const repo = tx.repository<{
      id: string;
      fingerprint: string;
      result: { value: T };
    }>('headcountCommands');
    const old = await repo.findOne({ filter: { id } });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'IDEMPOTENCY_CONFLICT',
          'The request key is bound to another payload.',
        );
      return old.result.value;
    }
    const result = await work();
    await tx.repository('headcountCommands').createOne({
      values: {
        id,
        requestKey: input.requestKey,
        fingerprint,
        result: { value: result ?? null },
        createdAt: demoNow(),
      },
    });
    return result;
  }
  async function journal(
    action: string,
    id: string,
    c: HeadcountCommand,
    tx: DatabaseConnection,
    evidence: unknown,
    sourceReference: string | null = null,
  ) {
    const a = await account(id, tx, false);
    const owner = sourceReference
      ? await tx
          .repository<Source>('headcountSources')
          .findOne({ filter: { id: sourceReference } })
      : undefined;
    const snapshot = {
      ...(evidence as Record<string, unknown>),
      source: owner ? { kind: owner.sourceKind, id: owner.sourceId } : null,
    };
    await tx.repository('headcountJournal').createOne({
      values: {
        id: randomUUID(),
        accountId: id,
        departmentId: a.departmentId,
        action,
        sourceReference,
        actorId: c.actorId,
        reason: c.reason,
        evidence: snapshot,
        at: demoNow(),
      },
    });
    await d.audit.record(
      {
        actorId: c.actorId,
        action: `headcount.${action}`,
        targetType: 'headcountAccounts',
        targetId: id,
        reason: c.reason,
        after: snapshot,
      },
      tx,
    );
  }
  async function realRoster(a: HeadcountAccount, tx: DatabaseConnection) {
    const rows = await tx
      .repository<{ id: string; positionId: string | null }>('employees')
      .findMany({ filter: { positionId: a.positionId } });
    const ids: string[] = [];
    for (const row of rows) {
      const e = await d.employees.getById(row.id, tx);
      if (
        e &&
        e.status !== 'left' &&
        (await d.org.primaryDepartmentOf(e.userId, tx))?.id === a.departmentId
      )
        ids.push(e.id);
    }
    return ids.sort();
  }
  async function identity(key: HeadcountKey, tx: DatabaseConnection) {
    if (
      !Number.isInteger(key.year) ||
      key.year < 1900 ||
      key.year > 9999 ||
      !key.departmentId ||
      !key.positionId
    )
      fail(
        'INVALID_ACCOUNT',
        'A valid department, position and frozen year are required.',
      );
    if (
      !(await d.org.activeChain(key.departmentId, tx)) ||
      !(await d.org.listPositions(tx)).some(
        (p) => p.id === key.positionId && p.active,
      )
    )
      fail(
        'INVALID_IDENTITY',
        'Use a real active organization department and position.',
      );
  }
  const reference = (s: HeadcountSource) => {
    if (
      !s.sourceKind ||
      s.sourceKind.length > 64 ||
      !s.sourceId ||
      s.sourceId.length > 128
    )
      fail(
        'INVALID_SOURCE',
        'A stable source kind and identifier are required.',
      );
    return hash([s.sourceKind, s.sourceId]);
  };
  async function source(
    c: HeadcountSource,
    tx: DatabaseConnection,
  ): Promise<Source> {
    const row = await tx
      .repository<Source>('headcountSources')
      .findOne({ filter: { id: reference(c) } });
    if (!row) fail('SOURCE_NOT_FOUND', 'Headcount source not found.');
    return row;
  }
  const sourceSeats = (id: string, tx: DatabaseConnection) =>
    tx
      .repository<Seat>('headcountSeats')
      .findMany({ filter: { sourceReference: id } });
  async function reservation(
    s: Source,
    tx: DatabaseConnection,
  ): Promise<HeadcountReservation> {
    const seats = await sourceSeats(s.id, tx);
    return {
      id: s.id,
      sourceKind: s.sourceKind,
      sourceId: s.sourceId,
      accountId: s.accountId,
      mode: s.mode,
      state: s.state,
      quantity: s.quantity,
      remaining: seats.filter(
        (v) => !['released', 'consumed'].includes(v.state),
      ).length,
      consumed: seats.filter((v) => v.state === 'consumed').length,
      blocked: seats.filter((v) => v.state === 'blocked').length,
    };
  }
  async function seatState(
    s: Seat,
    state: string,
    tx: DatabaseConnection,
    extra: Record<string, unknown> = {},
  ) {
    const result = await tx.repository('headcountSeats').updateMany({
      filter: { id: s.id, state: s.state },
      values: { state, ...extra },
    });
    if (result.updatedCount !== 1)
      fail('STATE_CONFLICT', 'The reservation seat changed.');
  }
  async function existingEmployee(
    employeeId: string,
    a: HeadcountAccount,
    tx: DatabaseConnection,
  ) {
    const e = await d.employees.getById(employeeId, tx);
    if (
      !e ||
      e.status === 'left' ||
      e.positionId !== a.positionId ||
      (await d.org.primaryDepartmentOf(e.userId, tx))?.id !== a.departmentId
    )
      fail(
        'EMPLOYEE_MISMATCH',
        'The actual employee must belong to the reserved department and position.',
      );
    return e;
  }
  const addOccupancy = async (
    employeeId: string,
    a: HeadcountAccount,
    sourceReference: string,
    tx: DatabaseConnection,
  ) => {
    if (
      await tx
        .repository('headcountOccupancies')
        .exists({ filter: { accountId: a.id, employeeId, state: 'used' } })
    )
      fail(
        'ALREADY_OCCUPIED',
        'An employee cannot consume the same annual account twice.',
      );
    await tx.repository('headcountOccupancies').createOne({
      values: {
        id: randomUUID(),
        activeKey: hash([a.id, employeeId]),
        releaseKind: null,
        generation: a.version,
        accountId: a.id,
        employeeId,
        state: 'used',
        claimSeatId: null,
        sourceReference,
        createdAt: demoNow(),
        releasedAt: null,
      },
    });
  };
  async function reserve(
    input: HeadcountCommand &
      HeadcountSource & {
        accountId: string;
        quantity: number;
        replacementEmployeeIds?: readonly string[];
      },
    c: DatabaseConnection,
    revise: boolean,
  ) {
    number(input.quantity, true);
    const sourceId = reference(input);
    const previous = await c
      .repository<Source>('headcountSources')
      .findOne({ filter: { id: sourceId } });
    if (!revise && previous)
      fail('SOURCE_EXISTS', 'The source already has a reservation.');
    if (revise && (!previous || previous.state !== 'pending'))
      fail(
        'SOURCE_STATE',
        'Only an existing pending source can revise its reservation.',
      );
    const replacement = input.replacementEmployeeIds ?? [];
    if (
      replacement.length &&
      (replacement.length !== input.quantity ||
        new Set(replacement).size !== replacement.length)
    )
      fail(
        'INVALID_REPLACEMENTS',
        'Each replacement seat requires one distinct real employee source.',
      );
    await employeeLock(replacement, c);
    await accounts(
      [input.accountId, ...(previous ? [previous.accountId] : [])],
      c,
    );
    const previousSeats = previous ? await sourceSeats(sourceId, c) : [];
    if (previous) {
      if (
        previousSeats.some(
          (s) =>
            !['pending', 'futurePending', 'blocked', 'released'].includes(
              s.state,
            ),
        )
      )
        fail(
          'SOURCE_STATE',
          'Consumed or approved seats cannot be rewritten on revision.',
        );
      for (const seat of previousSeats)
        if (seat.state !== 'released') {
          await seatState(seat, 'released', c);
          if (seat.replacementOccupancyId)
            await c.repository('headcountOccupancies').updateMany({
              filter: {
                id: seat.replacementOccupancyId,
                claimSeatId: seat.id,
              },
              values: { claimSeatId: null },
            });
        }
    }
    const a = await account(input.accountId, c);
    await identity(a, c);
    let immediate = 0;
    const old: Occupancy[] = [];
    for (const employeeId of replacement) {
      const e = await d.employees.getById(employeeId, c);
      if (
        !e ||
        !['leaving', 'left'].includes(e.status) ||
        e.positionId !== a.positionId
      )
        fail(
          'INVALID_REPLACEMENT',
          'Replacement source must be a real leaving or left employee in the same position.',
        );
      const o = await c.repository<Occupancy>('headcountOccupancies').findOne({
        filter: { accountId: a.id, employeeId },
        sort: (s) => [s.field('generation').desc(), s.field('id').desc()],
      });
      if (!o || o.claimSeatId)
        fail(
          'REPLACEMENT_UNAVAILABLE',
          'The real annual occupancy is missing or already claimed.',
        );
      if (o.state === 'used') {
        if (
          (await d.org.primaryDepartmentOf(e.userId, c))?.id !==
            a.departmentId ||
          e.status !== 'leaving'
        )
          fail(
            'INVALID_REPLACEMENT',
            'A future replacement must match the real current department.',
          );
      } else if (
        o.state === 'released' &&
        o.releaseKind === 'departure' &&
        e.status === 'left'
      )
        immediate++;
      else
        fail(
          'INVALID_REPLACEMENT',
          'The occupancy has not actually been released by departure.',
        );
      old.push(o);
    }
    await capacity(a.id, replacement.length ? immediate : input.quantity, c);
    const s: Source = {
      id: sourceId,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      accountId: a.id,
      mode: replacement.length ? 'replacement' : 'new',
      state: 'pending',
      quantity: input.quantity,
    };
    if (previous)
      await c.repository('headcountSources').updateMany({
        filter: { id: sourceId, state: 'pending' },
        values: { accountId: a.id, mode: s.mode, quantity: s.quantity },
      });
    else
      await c
        .repository('headcountSources')
        .createOne({ values: { ...s, createdAt: demoNow() } });
    const start = previousSeats.length
      ? Math.max(...previousSeats.map((s) => s.ordinal)) + 1
      : 0;
    for (let index = 0; index < input.quantity; index++) {
      const ordinal = start + index;
      const o = old[index],
        id = hash([sourceId, ordinal]);
      await c.repository('headcountSeats').createOne({
        values: {
          id,
          sourceReference: sourceId,
          accountId: a.id,
          ordinal,
          state: o?.state === 'used' ? 'futurePending' : 'pending',
          replacementOccupancyId: o?.id ?? null,
          employeeId: null,
          createdAt: demoNow(),
        },
      });
      if (o)
        await c.repository('headcountOccupancies').updateMany({
          filter: { id: o.id, claimSeatId: null },
          values: { claimSeatId: id },
        });
    }
    await journal(
      revise ? 'reviseHold' : 'hold',
      a.id,
      input,
      c,
      {
        quantity: input.quantity,
        replacementEmployeeIds: replacement,
        previousAccountId: previous?.accountId ?? null,
        previousQuantity: previous?.quantity ?? null,
      },
      sourceId,
    );
    if (previous && previous.accountId !== a.id)
      await journal(
        'reviseHoldOut',
        previous.accountId,
        input,
        c,
        { targetAccountId: a.id },
        sourceId,
      );
    return reservation(s, c);
  }
  return {
    within,
    protectRoster: (userIds, tx, work) =>
      within(tx, async (c) => {
        const initialized = await c
          .repository<HeadcountAccount>('headcountAccounts')
          .findMany({ filter: { initialized: true } });
        const touched = new Set<string>();
        const users = userIds ? new Set(userIds) : undefined;
        async function check() {
          for (const a of initialized) {
            const roster = await realRoster(a, c);
            const occupied = await c
              .repository<Occupancy>('headcountOccupancies')
              .findMany({ filter: { accountId: a.id, state: 'used' } });
            if (!users) touched.add(a.id);
            else
              for (const id of new Set([
                ...roster,
                ...occupied.map((o) => o.employeeId),
              ])) {
                const employee = await d.employees.getById(id, c);
                if (employee && users.has(employee.userId)) touched.add(a.id);
              }
            if (
              touched.has(a.id) &&
              canonical(roster) !==
                canonical(occupied.map((o) => o.employeeId).sort())
            )
              fail(
                'ROSTER_DRIFT',
                'An administrative write cannot change an initialized roster without a verified business occupancy source.',
              );
          }
        }
        // Keep both old and new accounts in the checked set; a move cannot disappear from its source account.
        await check();
        const result = await work(c);
        await check();
        return result;
      }),
    async reservation(input, tx) {
      const row = await tx
        .repository<Source>('headcountSources')
        .findOne({ filter: { id: reference(input) } });
      return row ? reservation(row, tx) : null;
    },
    create: (input, tx, policy) =>
      within(tx, (c) =>
        command('create', input, c, async () => {
          number(input.limit);
          await identity(input, c);
          if (
            await c.repository('headcountAccounts').exists({
              filter: {
                departmentId: input.departmentId,
                positionId: input.positionId,
                year: input.year,
              },
            })
          ) {
            if (
              policy &&
              !(await c
                .repository('headcountAccounts')
                .withPolicy(policy)
                .exists({
                  filter: {
                    departmentId: input.departmentId,
                    positionId: input.positionId,
                    year: input.year,
                  },
                }))
            )
              fail(
                'ACCESS_DENIED',
                'The existing account is outside the authorized department scope.',
              );
            fail(
              'ALREADY_EXISTS',
              'An account already exists for this department, position and year.',
            );
          }
          const id = hash([input.departmentId, input.positionId, input.year]);
          const repo = c.repository('headcountAccounts');
          await (policy ? repo.withPolicy(policy) : repo).createOne({
            values: {
              id,
              departmentId: input.departmentId,
              positionId: input.positionId,
              year: input.year,
              limit: input.limit,
              initialized: false,
              version: 1,
              createdAt: demoNow(),
              updatedAt: demoNow(),
            },
          });
          // Composite read scope also fixes the account identity boundary for creation.
          // A field-only create grant cannot widen the account's department scope.
          if (
            policy &&
            !(await repo.withPolicy(policy).exists({ filter: { id } }))
          )
            fail(
              'ACCESS_DENIED',
              'The new annual account lies outside the authorized department scope.',
            );
          await journal('create', id, input, c, {
            limit: input.limit,
            initialized: false,
          });
          return balances(id, c);
        }),
      ),
    reconcile: (input, tx) =>
      within(tx, (c) =>
        command('reconcile', input, c, async () => {
          const a = await account(input.accountId, c, false);
          if (a.version !== input.expectedVersion)
            fail(
              'VERSION_CONFLICT',
              'The account changed before reconciliation.',
            );
          await identity(a, c);
          const roster = await realRoster(a, c);
          await employeeLock(roster, c);
          await accounts([a.id], c);
          if (
            new Set(input.employeeIds).size !== input.employeeIds.length ||
            canonical([...input.employeeIds].sort()) !== canonical(roster)
          )
            fail(
              'INCOMPLETE_ROSTER',
              'Reconciliation must name the complete actual probation, regular and leaving roster.',
            );
          const used = await c
            .repository<Occupancy>('headcountOccupancies')
            .findMany({ filter: { accountId: a.id, state: 'used' } });
          if (
            a.initialized &&
            canonical(used.map((o) => o.employeeId).sort()) !==
              canonical(roster)
          )
            fail(
              'ROSTER_DRIFT',
              'Existing occupancy drift needs source-specific correction; a recount must not erase reservations or immutable employee exits.',
            );
          if (!a.initialized)
            for (const employeeId of roster)
              await addOccupancy(employeeId, a, `reconcile:${a.id}`, c);
          const b = await balances(a.id, c);
          if (b.used + b.pending + b.allocated > a.limit)
            fail(
              'INSUFFICIENT',
              'The annual limit cannot cover the real roster and reservations.',
            );
          await c.repository('headcountAccounts').updateMany({
            filter: { id: a.id },
            values: { initialized: true },
          });
          await journal('reconcile', a.id, input, c, {
            employeeIds: roster,
            previousInitialized: a.initialized,
          });
          if (canonical(await realRoster(a, c)) !== canonical(roster))
            fail(
              'ROSTER_DRIFT',
              'The real roster changed during reconciliation.',
            );
          return balances(a.id, c);
        }),
      ),
    adjustLimit: (input, tx) =>
      within(tx, (c) =>
        command('adjustLimit', input, c, async () => {
          number(input.limit);
          const a = await account(input.accountId, c, false);
          if (a.version !== input.expectedVersion)
            fail('VERSION_CONFLICT', 'The account changed before adjustment.');
          await accounts([a.id], c);
          const b = await balances(a.id, c);
          if (input.limit < b.used + b.pending + b.allocated)
            fail(
              'INSUFFICIENT',
              'The limit cannot fall below occupied and reserved headcount.',
            );
          await c.repository('headcountAccounts').updateMany({
            filter: { id: a.id },
            values: { limit: input.limit },
          });
          await journal('adjustLimit', a.id, input, c, {
            beforeLimit: a.limit,
            limit: input.limit,
          });
          return balances(a.id, c);
        }),
      ),
    hold: (input, tx) =>
      within(tx, (c) =>
        command('hold', input, c, () => reserve(input, c, false)),
      ),
    reviseHold: (input, tx) =>
      within(tx, (c) =>
        command('reviseHold', input, c, () => reserve(input, c, true)),
      ),
    allocate: (input, tx) =>
      within(tx, (c) =>
        command('allocate', input, c, async () => {
          const s = await source(input, c);
          await accounts([s.accountId], c);
          await account(s.accountId, c);
          if (s.state !== 'pending')
            fail('SOURCE_STATE', 'Only a pending source can be allocated.');
          for (const seat of await sourceSeats(s.id, c)) {
            if (seat.state === 'released') continue;
            if (seat.state === 'blocked')
              fail(
                'REPLACEMENT_BLOCKED',
                'A restored source employee blocks this replacement.',
              );
            if (seat.state === 'futurePending') {
              const o = await c
                .repository<Occupancy>('headcountOccupancies')
                .findOne({ filter: { id: seat.replacementOccupancyId! } });
              const e = o && (await d.employees.getById(o.employeeId, c));
              if (!e || e.status !== 'leaving' || o?.state !== 'used')
                fail(
                  'REPLACEMENT_BLOCKED',
                  'Recheck the actual replacement source before approval.',
                );
              await seatState(seat, 'futureAllocated', c);
            } else if (seat.state === 'pending')
              await seatState(seat, 'allocated', c);
            else fail('SEAT_STATE', 'The reservation seat is not pending.');
          }
          await c.repository('headcountSources').updateMany({
            filter: { id: s.id, state: 'pending' },
            values: { state: 'allocated' },
          });
          await journal(
            'allocate',
            s.accountId,
            input,
            c,
            { quantity: s.quantity },
            s.id,
          );
          return reservation({ ...s, state: 'allocated' }, c);
        }),
      ),
    close: (input, tx) =>
      within(tx, (c) =>
        command('close', input, c, async () => {
          const s = await source(input, c);
          await accounts([s.accountId], c);
          if (s.state === 'closed')
            fail('SOURCE_CLOSED', 'This source is already closed.');
          for (const seat of await sourceSeats(s.id, c))
            if (!['consumed', 'released'].includes(seat.state)) {
              await seatState(seat, 'released', c);
              if (seat.replacementOccupancyId)
                await c.repository('headcountOccupancies').updateMany({
                  filter: {
                    id: seat.replacementOccupancyId,
                    claimSeatId: seat.id,
                  },
                  values: { claimSeatId: null },
                });
            }
          await c
            .repository('headcountSources')
            .updateMany({ filter: { id: s.id }, values: { state: 'closed' } });
          await journal('close', s.accountId, input, c, { remaining: 0 }, s.id);
          return reservation({ ...s, state: 'closed' }, c);
        }),
      ),
    consume: (input, tx) =>
      within(tx, (c) =>
        command('consume', input, c, async () => {
          await employeeLock([input.employeeId], c);
          const s = await source(input, c);
          await accounts([s.accountId], c);
          const a = await account(s.accountId, c);
          if (a.year !== Number(d.calendar.localDate(demoNow()).slice(0, 4)))
            fail(
              'YEAR_REBIND_REQUIRED',
              'Rebind old-year allocations to the current company year before onboarding.',
            );
          if (s.state !== 'allocated')
            fail('SOURCE_STATE', 'An approved allocation is required.');
          await existingEmployee(input.employeeId, a, c);
          const seat = (await sourceSeats(s.id, c))
            .sort((a, b) => a.ordinal - b.ordinal)
            .find((v) => v.state === 'allocated');
          if (!seat)
            fail(
              'NO_ALLOCATION',
              'No currently available approved seat remains.',
            );
          await addOccupancy(input.employeeId, a, s.id, c);
          await seatState(seat, 'consumed', c, {
            employeeId: input.employeeId,
          });
          const result = await reservation(s, c);
          if (result.remaining === 0)
            await c.repository('headcountSources').updateMany({
              filter: { id: s.id },
              values: { state: 'filled' },
            });
          await journal(
            'consume',
            a.id,
            input,
            c,
            { employeeId: input.employeeId, remaining: result.remaining },
            s.id,
          );
          return {
            ...result,
            state: result.remaining === 0 ? 'filled' : s.state,
          };
        }),
      ),
    releaseEmployee: (input, tx) =>
      within(tx, (c) =>
        command('releaseEmployee', input, c, async () => {
          await employeeLock([input.employeeId], c);
          const e = await d.employees.getById(input.employeeId, c);
          if (e?.status !== 'left')
            fail(
              'NOT_LEFT',
              'Only an actual left employee releases occupancy.',
            );
          const occupied = await c
            .repository<Occupancy>('headcountOccupancies')
            .findMany({
              filter: { employeeId: input.employeeId, state: 'used' },
            });
          if (!occupied.length)
            fail(
              'OCCUPANCY_NOT_FOUND',
              'A real unreleased occupancy is required.',
            );
          await accounts(
            occupied.map((o) => o.accountId),
            c,
          );
          for (const id of [...new Set(occupied.map((o) => o.accountId))]) {
            const a = await account(id, c);
            const actual = await realRoster(a, c);
            const facts = await c
              .repository<Occupancy>('headcountOccupancies')
              .findMany({ filter: { accountId: id, state: 'used' } });
            const remaining = facts
              .filter((o) => o.employeeId !== input.employeeId)
              .map((o) => o.employeeId)
              .sort();
            if (canonical(remaining) !== canonical(actual))
              fail(
                'ROSTER_DRIFT',
                'Departure cannot release an account whose actual roster has drifted.',
              );
          }
          for (const o of occupied) {
            await c.repository('headcountOccupancies').updateMany({
              filter: { id: o.id, state: 'used' },
              values: {
                state: 'released',
                activeKey: hash(['released', o.id]),
                releaseKind: 'departure',
                releasedAt: demoNow(),
              },
            });
            if (o.claimSeatId) {
              const seat = await c
                .repository<Seat>('headcountSeats')
                .findOne({ filter: { id: o.claimSeatId } });
              if (
                seat &&
                ['futurePending', 'futureAllocated'].includes(seat.state)
              )
                await seatState(
                  seat,
                  seat.state === 'futurePending' ? 'pending' : 'allocated',
                  c,
                );
            }
            await journal('releaseEmployee', o.accountId, input, c, {
              employeeId: input.employeeId,
              claimSeatId: o.claimSeatId,
            });
          }
        }),
      ),
    recoverReplacementNotifications: (tx) =>
      within(tx, async (c) => {
        const seats = await c
          .repository<Seat>('headcountSeats')
          .findMany({ filter: { state: 'blocked' } });
        for (const reference of [
          ...new Set(seats.map((seat) => seat.sourceReference)),
        ].sort()) {
          const source = await c
            .repository<Source>('headcountSources')
            .findOne({ filter: { id: reference } });
          if (
            !source ||
            (await c.repository('headcountReplacementNotices').count({
              filter: {
                sourceKind: source.sourceKind,
                sourceId: source.sourceId,
              },
            }))
          )
            continue;
          await d.notifications?.enqueue(source, 'system', c);
        }
      }),
    invalidateReplacements: (input, tx) =>
      within(tx, (c) =>
        command('invalidateReplacements', input, c, async () => {
          await employeeLock([input.employeeId], c);
          const e = await d.employees.getById(input.employeeId, c);
          if (!e || !['regular', 'probation'].includes(e.status))
            fail(
              'NOT_RESTORED',
              'Only an actually restored employee invalidates future replacements.',
            );
          const occupied = await c
            .repository<Occupancy>('headcountOccupancies')
            .findMany({
              filter: { employeeId: input.employeeId, state: 'used' },
            });
          await accounts(
            occupied.map((o) => o.accountId),
            c,
          );
          const affected: HeadcountSource[] = [];
          for (const o of occupied)
            if (o.claimSeatId) {
              const seat = await c
                .repository<Seat>('headcountSeats')
                .findOne({ filter: { id: o.claimSeatId } });
              if (
                seat &&
                ['futurePending', 'futureAllocated'].includes(seat.state)
              ) {
                await seatState(seat, 'blocked', c);
                const s = await c
                  .repository<Source>('headcountSources')
                  .findOne({ filter: { id: seat.sourceReference } });
                if (s)
                  affected.push({
                    sourceKind: s.sourceKind,
                    sourceId: s.sourceId,
                  });
                await journal('invalidateReplacement', o.accountId, input, c, {
                  employeeId: input.employeeId,
                  sourceReference: seat.sourceReference,
                });
              }
            }
          for (const source of new Map(
            affected.map((source) => [canonical(source), source]),
          ).values())
            await d.notifications?.enqueue(source, input.actorId, c);
          return affected;
        }),
      ),
    rebind: (input, tx) =>
      within(tx, (c) =>
        command('rebind', input, c, async () => {
          const s = await source(input, c);
          if (s.accountId === input.targetAccountId || s.state !== 'allocated')
            fail(
              'INVALID_REBIND',
              'Rebind an approved source to another initialized yearly account.',
            );
          await accounts([s.accountId, input.targetAccountId], c);
          const from = await account(s.accountId, c),
            to = await account(input.targetAccountId, c);
          if (
            from.departmentId !== to.departmentId ||
            from.positionId !== to.positionId ||
            to.year <= from.year
          )
            fail(
              'INVALID_REBIND',
              'Yearly rebind preserves the real department and position and moves forward only.',
            );
          const seats = (await sourceSeats(s.id, c)).filter(
            (v) => !['consumed', 'released'].includes(v.state),
          );
          if (
            seats.some(
              (v) => v.state !== 'allocated' || v.replacementOccupancyId,
            )
          )
            fail(
              'REPLACEMENT_REBIND_REQUIRED',
              'Future or replacement credits cannot silently migrate across annual accounts. Cancel and submit with genuine target-year sources.',
            );
          await capacity(to.id, seats.length, c);
          if (!seats.length)
            fail('NO_ALLOCATION', 'No unconsumed allocation remains.');
          for (const seat of seats)
            await c.repository('headcountSeats').updateMany({
              filter: { id: seat.id, state: 'allocated' },
              values: { accountId: to.id },
            });
          await c
            .repository('headcountSources')
            .updateMany({ filter: { id: s.id }, values: { accountId: to.id } });
          await journal(
            'rebindOut',
            from.id,
            input,
            c,
            { targetAccountId: to.id, quantity: seats.length },
            s.id,
          );
          await journal(
            'rebindIn',
            to.id,
            input,
            c,
            { sourceAccountId: from.id, quantity: seats.length },
            s.id,
          );
          return reservation({ ...s, accountId: to.id }, c);
        }),
      ),
    transfer: (input, tx) =>
      within(tx, (c) =>
        command('transfer', input, c, async () => {
          await employeeLock([input.employeeId], c);
          const s = await source(input, c);
          if (s.accountId === input.sourceAccountId || s.state !== 'allocated')
            fail(
              'INVALID_TRANSFER',
              'A distinct approved target reservation is required.',
            );
          await accounts([input.sourceAccountId, s.accountId], c);
          const from = await account(input.sourceAccountId, c),
            to = await account(s.accountId, c);
          if (
            from.year !== to.year ||
            to.year !== Number(d.calendar.localDate(demoNow()).slice(0, 4))
          )
            fail(
              'YEAR_REBIND_REQUIRED',
              'Transfer requires explicit current-year source and target accounts.',
            );
          const o = await c
            .repository<Occupancy>('headcountOccupancies')
            .findOne({
              filter: {
                accountId: from.id,
                employeeId: input.employeeId,
                state: 'used',
              },
            });
          if (!o || o.claimSeatId)
            fail(
              'OCCUPANCY_NOT_FOUND',
              'A real unclaimed source occupancy is required.',
            );
          const seat = (await sourceSeats(s.id, c)).find(
            (v) => v.state === 'allocated' && !v.replacementOccupancyId,
          );
          if (!seat)
            fail(
              'NO_ALLOCATION',
              'The target has no approved ordinary allocation.',
            );
          await existingEmployee(input.employeeId, to, c); // Trusted upstream has written real target facts in this guarded transaction.
          await c.repository('headcountOccupancies').updateMany({
            filter: { id: o.id, state: 'used' },
            values: {
              state: 'released',
              activeKey: hash(['released', o.id]),
              releaseKind: 'transfer',
              releasedAt: demoNow(),
            },
          });
          await addOccupancy(input.employeeId, to, s.id, c);
          await seatState(seat, 'consumed', c, {
            employeeId: input.employeeId,
          });
          const result = await reservation(s, c);
          if (!result.remaining)
            await c.repository('headcountSources').updateMany({
              filter: { id: s.id },
              values: { state: 'filled' },
            });
          await journal(
            'transferOut',
            from.id,
            input,
            c,
            { employeeId: input.employeeId, targetAccountId: to.id },
            s.id,
          );
          await journal(
            'transferIn',
            to.id,
            input,
            c,
            { employeeId: input.employeeId, sourceAccountId: from.id },
            s.id,
          );
          return { ...result, state: !result.remaining ? 'filled' : s.state };
        }),
      ),
    async balance(id, tx, policy) {
      const repo = tx.repository<HeadcountAccount>('headcountAccounts');
      const a = await (policy ? repo.withPolicy(policy) : repo).findOne({
        filter: { id },
      });
      if (!a) return null;
      if (
        [
          'id',
          'departmentId',
          'positionId',
          'year',
          'limit',
          'initialized',
          'version',
          'createdAt',
          'updatedAt',
        ].some((k) => !(k in a))
      )
        fail(
          'FIELD_ACCESS_DENIED',
          'The complete capacity summary is outside the read policy.',
        );
      return balances(id, tx);
    },
    async roster(accountId, tx, employeePolicy) {
      const a = await account(accountId, tx, false);
      const result: { id: string; name: string; status: string }[] = [];
      for (const id of await realRoster(a, tx)) {
        const e = employeePolicy
          ? await tx
              .repository('employees')
              .withPolicy(employeePolicy)
              .findOne({ filter: { id } })
          : await d.employees.getById(id, tx);
        if (!e || ![e.id, e.name, e.status].every((v) => typeof v === 'string'))
          fail(
            'ROSTER_ACCESS_DENIED',
            'The complete employee roster is not readable.',
          );
        result.push({
          id: e.id as string,
          name: e.name as string,
          status: e.status as string,
        });
      }
      return result;
    },
    async list(q, tx, policy) {
      number(q.page, true);
      number(q.pageSize, true);
      if (q.pageSize > 100) fail('INVALID_PAGE', 'Page size is capped at 100.');
      const repo = tx
        .repository<HeadcountAccount>('headcountAccounts')
        .withPolicy(policy);
      const filter = {
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.positionId ? { positionId: q.positionId } : {}),
        ...(q.year ? { year: q.year } : {}),
      };
      const filtered = Object.keys(filter).length ? { filter } : {};
      const total = await repo.count(filtered);
      const orderBy = q.orderBy ?? 'updatedAt',
        desc = q.desc ?? true;
      const derived = ['used', 'pending', 'allocated', 'available'].includes(
        orderBy,
      );
      if (!derived) {
        const rows = await repo.findMany({
          ...filtered,
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
          sort: (s) => [
            desc ? s.field(orderBy).desc() : s.field(orderBy).asc(),
            s.field('id').asc(),
          ],
        });
        const items: HeadcountBalance[] = [];
        for (const a of rows) {
          if (!a.id)
            fail(
              'FIELD_ACCESS_DENIED',
              'The account identity is not readable.',
            );
          const b = await this.balance(a.id, tx, policy);
          if (b) items.push(b);
        }
        return { items, total };
      }
      // Public Repository has no policy-to-SQL compiler. Stream the full scoped query,
      // aggregate only already authorized IDs in fixed batches, and retain its exact
      // global ordering prefix. This is not sorting a capped page or reading every seat.
      const keep = Math.min(total, q.page * q.pageSize);
      const prefix: HeadcountBalance[] = [];
      const compare = (a: HeadcountBalance, b: HeadcountBalance) =>
        (desc ? (b[orderBy] as number) : (a[orderBy] as number)) -
          (desc ? (a[orderBy] as number) : (b[orderBy] as number)) ||
        a.id.localeCompare(b.id);
      let batch: HeadcountAccount[] = [];
      const flush = async () => {
        if (!batch.length) return;
        const ids = batch.map((a) => a.id);
        const [occupancies, seats] = await Promise.all([
          tx.repository('headcountOccupancies').groupBy({
            by: ['accountId'],
            filter: (f) =>
              f.and([
                f.or(ids.map((id) => f.string('accountId').eq(id))),
                f.string('state').eq('used'),
              ]),
            aggregate: (a) => ({ count: a.count() }),
          }),
          tx.repository('headcountSeats').groupBy({
            by: ['accountId', 'state'],
            filter: (f) => f.or(ids.map((id) => f.string('accountId').eq(id))),
            aggregate: (a) => ({ count: a.count() }),
          }),
        ]);
        for (const a of batch) {
          const used = Number(
            occupancies.find((o) => o.accountId === a.id)?.count ?? 0,
          );
          const count = (state: string) =>
            Number(
              seats.find((o) => o.accountId === a.id && o.state === state)
                ?.count ?? 0,
            );
          const pending = count('pending'),
            allocated = count('allocated');
          prefix.push({
            ...a,
            createdAt: new Date(a.createdAt).toISOString(),
            updatedAt: new Date(a.updatedAt).toISOString(),
            used,
            pending,
            allocated,
            available: a.limit - used - pending - allocated,
            replacementPending: count('futurePending'),
            replacementAllocated: count('futureAllocated'),
            replacementBlocked: count('blocked'),
          });
        }
        prefix.sort(compare);
        prefix.length = Math.min(prefix.length, keep);
        batch = [];
      };
      for await (const a of repo.findMany({
        ...filtered,
        sort: (s) => s.field('id').asc(),
      })) {
        if (
          ![
            'id',
            'departmentId',
            'positionId',
            'year',
            'limit',
            'initialized',
            'version',
            'createdAt',
            'updatedAt',
          ].every((k) => k in a)
        )
          fail(
            'FIELD_ACCESS_DENIED',
            'The complete capacity summary is not readable.',
          );
        batch.push(a as HeadcountAccount);
        if (batch.length === 128) await flush();
      }
      await flush();
      return { items: prefix.slice((q.page - 1) * q.pageSize), total };
    },
    async journal(id, tx, policy, query) {
      number(query.page, true);
      number(query.pageSize, true);
      if (query.pageSize > 100)
        fail('INVALID_PAGE', 'Page size is capped at 100.');
      const repo = tx.repository('headcountJournal').withPolicy(policy),
        filter = { accountId: id };
      const total = await repo.count({ filter }),
        items = await repo.findMany({
          filter,
          offset: (query.page - 1) * query.pageSize,
          limit: query.pageSize,
          sort: (s) => [
            query.desc === false ? s.field('at').asc() : s.field('at').desc(),
            s.field('id').asc(),
          ],
        });
      for (const row of items)
        if (
          [
            'id',
            'accountId',
            'departmentId',
            'action',
            'sourceReference',
            'actorId',
            'reason',
            'evidence',
            'at',
          ].some((k) => !(k in row))
        )
          fail(
            'FIELD_ACCESS_DENIED',
            'The source journal fields are outside the read policy.',
          );
      return { items, total };
    },
  };
}

import { demoNow } from '../demo-data/context.js';
import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Asset } from './contract.js';
import { AssetError } from './errors.js';
import type {
  AssetSnapshot,
  AssetStockService,
  AssetStockSource,
  StockCommand,
  StockPhase,
  AssetUnit,
} from './stock-contract.js';
const idFor = (...keys: string[]) =>
  createHash('sha256').update(JSON.stringify(keys)).digest('hex');
const canonical = (v: unknown): string =>
  JSON.stringify(v, (_key, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  );
interface Fact {
  id: string;
  sourceId: string;
  assetId: string;
  snapshot: AssetSnapshot;
}
interface Reservation extends Fact {
  state: string;
}
function fail(code: string, message: string): never {
  throw new AssetError(code, message, 'conflict');
}
export function createAssetStockService(d: {
  audit: AuditService;
  source?: AssetStockSource;
  sourceKind?: string;
  auditTarget?: { type: string; id: string };
}): AssetStockService {
  async function source(
    c: StockCommand,
    phase: StockPhase,
    tx: DatabaseConnection,
  ) {
    if (
      !c.actorId ||
      !c.reason?.trim() ||
      !c.requestKey ||
      c.requestKey.length > 128
    )
      throw new AssetError(
        'ASSET_INVALID_COMMAND',
        'An actor, reason and stable request key are required.',
      );
    if (!d.source)
      throw new AssetError(
        'ASSET_SOURCE_UNAVAILABLE',
        'The stock source integration is unavailable.',
      );
    const intent = await d.source.intent(c.sourceId, c.actorId, phase, tx);
    if (intent.sourceId !== c.sourceId || !intent.employeeId)
      fail(
        'ASSET_SOURCE_MISMATCH',
        'The stock command does not match its real application.',
      );
    return intent;
  }
  async function command<T>(
    c: StockCommand,
    phase: StockPhase,
    tx: DatabaseConnection,
    payload: unknown,
    run: () => Promise<T>,
  ): Promise<T> {
    const fingerprint = canonical({
        phase,
        actorId: c.actorId,
        reason: c.reason,
        payload,
      }),
      repo = tx.repository<{
        id: string;
        fingerprint: string;
        result: { value: T };
      }>('assetStockCommands'),
      id = idFor(c.sourceId, c.requestKey);
    const old = await repo.findOne({ filter: { id } });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'ASSET_REQUEST_REUSED',
          'This stock request key is bound to another payload.',
        );
      return old.result.value;
    }
    const result = await run();
    await tx.repository('assetStockCommands').createOne({
      values: {
        id,
        sourceId: c.sourceId,
        requestKey: c.requestKey,
        fingerprint,
        result: { value: result },
        createdAt: demoNow(),
      },
    });
    await d.audit.record(
      {
        actorId: c.actorId,
        action: `asset.${phase}`,
        targetType: d.auditTarget?.type ?? 'assetRequests',
        targetId: d.auditTarget?.id ?? c.sourceId,
        reason: c.reason,
        after: {
          requestKey: c.requestKey,
          ...(d.auditTarget
            ? { sourceId: c.sourceId, sourceKind: d.sourceKind }
            : {}),
        },
      },
      tx,
    );
    return result;
  }
  async function asset(id: string, tx: DatabaseConnection) {
    const row = await tx
      .repository<Asset>('assets')
      .findOne({ filter: { id } });
    if (!row) fail('ASSET_NOT_FOUND', 'Asset not found.');
    const originalValueCents = Number(row.originalValueCents);
    if (!Number.isSafeInteger(originalValueCents) || originalValueCents < 0)
      fail('ASSET_INVALID_AMOUNT', 'The stored asset amount is invalid.');
    return { ...row, originalValueCents };
  }
  async function lock(id: string, tx: DatabaseConnection) {
    const before = await asset(id, tx);
    if (
      !Number.isSafeInteger(before.version) ||
      before.version >= Number.MAX_SAFE_INTEGER
    )
      fail('ASSET_INVALID_VERSION', 'The asset version cannot advance.');
    const result = await tx.repository('assets').updateMany({
      filter: { id, version: before.version },
      values: { version: before.version + 1 },
    });
    if (!result.updatedCount)
      fail(
        'ASSET_VERSION_CONFLICT',
        'The asset changed during stock processing.',
      );
    return { before, locked: await asset(id, tx) };
  }
  const snapshot = (a: Asset): AssetSnapshot => ({
    id: a.id,
    code: a.code,
    category: a.category,
    serialNumber: a.serialNumber,
    status: a.status,
    holderEmployeeId: a.holderEmployeeId,
    version: a.version,
    originalValueCents: a.originalValueCents,
  });
  const holds = (sourceId: string, tx: DatabaseConnection) =>
    tx.repository<Reservation>('assetReservationFacts').findMany({
      filter: { sourceId, state: 'pending' },
      sort: (s) => [s.field('assetId').asc()],
    });
  async function consume(
    facts: Reservation[],
    tx: DatabaseConnection,
    state: string,
  ) {
    for (const fact of facts) {
      await tx.repository('assetActiveHolds').deleteMany({
        filter: { assetId: fact.assetId, sourceId: fact.sourceId },
      });
      await tx.repository('assetReservationFacts').updateMany({
        filter: { id: fact.id, state: 'pending' },
        values: { state },
      });
      await tx.repository('assetReservations').updateMany({
        filter: {
          assetId: fact.assetId,
          sourceId: fact.sourceId,
          state: 'pending',
        },
        values: { state, updatedAt: demoNow() },
      });
    }
  }
  async function verifyHeld(fact: Reservation, tx: DatabaseConnection) {
    const active = await tx.repository('assetActiveHolds').findOne({
      filter: {
        assetId: fact.assetId,
        sourceId: fact.sourceId,
        sourceKind: d.sourceKind ?? 'oa.assetRequest',
      },
    });
    if (!active)
      fail(
        'ASSET_HOLD_MISMATCH',
        'The single asset is not reserved for this application.',
      );
    const { before, locked } = await lock(fact.assetId, tx);
    if (
      before.version !== fact.snapshot.version ||
      before.status !== fact.snapshot.status ||
      before.holderEmployeeId !== fact.snapshot.holderEmployeeId
    )
      fail(
        'ASSET_BASELINE_CONFLICT',
        'The asset baseline changed. Return the request for renewed review.',
      );
    return locked;
  }
  function completeUnits(units: AssetUnit[], facts: Fact[]) {
    if (
      !Array.isArray(units) ||
      !facts.length ||
      units.length !== facts.length ||
      new Set(units.map((u) => u.assetId)).size !== facts.length ||
      units.some(
        (u) => !u.serialNumber?.trim() || u.serialNumber.length > 200,
      ) ||
      facts.some((f) => !units.some((u) => u.assetId === f.assetId))
    )
      fail(
        'ASSET_UNITS_INCOMPLETE',
        'Confirm every actual asset and serial number; partial batches cannot complete.',
      );
  }
  return {
    async unreservedIds(ids, tx) {
      if (!ids.length) return [];
      if (ids.length > 100)
        fail(
          'ASSET_INVALID_COMMAND',
          'Inspect at most one hundred asset IDs at a time.',
        );
      const active = await tx
        .repository<{ assetId: string }>('assetActiveHolds')
        .findMany({
          filter: (f) => f.or(ids.map((id) => f.string('assetId').eq(id))),
          limit: 100,
          select: (s) => s.fields('assetId'),
        });
      const held = new Set(active.map((row) => row.assetId));
      return [...new Set(ids)].filter((id) => !held.has(id));
    },
    async reservationCurrent(sourceId, tx) {
      const pending = await holds(sourceId, tx);
      if (!pending.length) return false;
      for (const fact of pending) {
        const locked = await tx.repository('assets').updateMany({
          filter: { id: fact.assetId },
          values: { version: { increment: 0 } },
        });
        if (!locked.updatedCount) return false;
        const current = await asset(fact.assetId, tx);
        if (
          current.version !== fact.snapshot.version ||
          current.status !== fact.snapshot.status ||
          current.holderEmployeeId !== fact.snapshot.holderEmployeeId ||
          !(await tx
            .repository('assetActiveHolds')
            .exists({ filter: { assetId: fact.assetId, sourceId } }))
        )
          return false;
      }
      return true;
    },
    async reserve(c, connection) {
      return connection.transaction(async (tx) => {
        const intent = await source(c, 'reserve', tx);
        return command(c, 'reserve', tx, intent, async () => {
          if (
            !Number.isSafeInteger(intent.quantity) ||
            intent.quantity < 1 ||
            intent.quantity > 100 ||
            (intent.assetIds.length &&
              intent.assetIds.length !== intent.quantity)
          )
            throw new AssetError(
              'ASSET_INVALID_QUANTITY',
              'Choose one to one hundred actual assets.',
            );
          if ((await holds(c.sourceId, tx)).length)
            fail(
              'ASSET_EXISTING_HOLD',
              'Release the prior application allocation before reserving again.',
            );
          const selected: Asset[] = [];
          if (intent.assetIds.length) {
            for (const id of [...new Set(intent.assetIds)].sort())
              selected.push(await asset(id, tx));
          } else {
            for (
              let offset = 0;
              selected.length < intent.quantity;
              offset += 100
            ) {
              const page = await tx.repository<Asset>('assets').findMany({
                filter: { status: 'available', category: intent.category },
                limit: 100,
                offset,
                sort: (s) => [s.field('id').asc()],
              });
              for (const row of page)
                if (
                  !(await tx
                    .repository('assetActiveHolds')
                    .exists({ filter: { assetId: row.id } }))
                )
                  selected.push(row);
              if (page.length < 100) break;
            }
            selected.splice(intent.quantity);
          }
          if (selected.length !== intent.quantity)
            fail(
              'ASSET_STOCK_SHORTAGE',
              'There are not enough real available assets.',
            );
          const result: AssetSnapshot[] = [];
          for (const item of selected.sort((a, b) =>
            a.id.localeCompare(b.id),
          )) {
            const { locked } = await lock(item.id, tx);
            if (intent.operation === 'scrap') {
              if (
                intent.quantity !== 1 ||
                !['available', 'assigned'].includes(locked.status) ||
                (locked.status === 'assigned' &&
                  locked.holderEmployeeId !== intent.employeeId) ||
                (locked.status === 'available' && !intent.administrativeScrap)
              )
                fail(
                  'ASSET_SCRAP_INELIGIBLE',
                  'Only an eligible owned or administratively authorized in-stock asset may be scrapped.',
                );
            } else if (
              locked.status !== 'available' ||
              locked.holderEmployeeId !== null ||
              (intent.category && locked.category !== intent.category)
            )
              fail(
                'ASSET_STOCK_SHORTAGE',
                'An asset is no longer available for this request.',
              );
            if (
              await tx
                .repository('assetActiveHolds')
                .exists({ filter: { assetId: locked.id } })
            )
              fail(
                'ASSET_ALREADY_RESERVED',
                'Another application already holds this single asset.',
              );
            await tx.repository('assetActiveHolds').createOne({
              values: {
                assetId: locked.id,
                sourceKind: d.sourceKind ?? 'oa.assetRequest',
                sourceId: c.sourceId,
              },
            });
            const current = snapshot(locked),
              id = idFor(c.sourceId, locked.id);
            const existing = await tx
              .repository('assetReservationFacts')
              .exists({ filter: { id } });
            if (existing)
              await tx.repository('assetReservationFacts').updateMany({
                filter: { id },
                values: { state: 'pending', snapshot: current },
              });
            else
              await tx.repository('assetReservationFacts').createOne({
                values: {
                  id,
                  sourceId: c.sourceId,
                  assetId: locked.id,
                  state: 'pending',
                  snapshot: current,
                },
              });
            if (
              await tx.repository('assetReservations').exists({
                filter: { assetId: locked.id, sourceId: c.sourceId },
              })
            )
              await tx.repository('assetReservations').updateMany({
                filter: { assetId: locked.id, sourceId: c.sourceId },
                values: {
                  employeeId: intent.employeeId,
                  state: 'pending',
                  updatedAt: demoNow(),
                },
              });
            else
              await tx.repository('assetReservations').createOne({
                values: {
                  id,
                  assetId: locked.id,
                  sourceId: c.sourceId,
                  employeeId: intent.employeeId,
                  state: 'pending',
                  createdAt: demoNow(),
                  updatedAt: demoNow(),
                },
              });
            result.push(current);
          }
          return result;
        });
      });
    },
    async release(c, connection) {
      return connection.transaction(async (tx) => {
        const intent = await source(c, 'release', tx);
        await command(c, 'release', tx, { intent }, async () => {
          const facts = await holds(c.sourceId, tx);
          for (const fact of facts) await lock(fact.assetId, tx);
          await consume(facts, tx, 'released');
          return null;
        });
      });
    },
    async issue(c, connection) {
      return connection.transaction(async (tx) => {
        const intent = await source(c, 'issue', tx);
        await command(c, 'issue', tx, { units: c.units, intent }, async () => {
          const facts = await holds(c.sourceId, tx);
          completeUnits(c.units, facts);
          if (intent.operation === 'scrap')
            fail(
              'ASSET_SOURCE_MISMATCH',
              'A scrap application cannot issue stock.',
            );
          for (const fact of facts) {
            const item = await verifyHeld(fact, tx),
              serial = c.units
                .find((u) => u.assetId === fact.assetId)!
                .serialNumber.trim();
            if (item.serialNumber && item.serialNumber !== serial)
              fail(
                'ASSET_SERIAL_MISMATCH',
                'The issued serial number differs from the real register.',
              );
            await tx.repository('assets').updateMany({
              filter: { id: item.id, version: item.version },
              values: {
                status: intent.operation === 'borrow' ? 'borrowed' : 'assigned',
                holderEmployeeId: intent.employeeId,
                borrowDueDate:
                  intent.operation === 'borrow' ? intent.borrowDueDate : null,
                serialNumber: serial,
                updatedAt: demoNow(),
              },
            });
            await tx.repository('assetIssueFacts').createOne({
              values: {
                id: idFor(c.sourceId, item.id),
                sourceId: c.sourceId,
                assetId: item.id,
                employeeId: intent.employeeId,
                actorId: c.actorId,
                snapshot: {
                  ...snapshot(item),
                  serialNumber: serial,
                  status:
                    intent.operation === 'borrow' ? 'borrowed' : 'assigned',
                  holderEmployeeId: intent.employeeId,
                },
                createdAt: demoNow(),
              },
            });
          }
          await consume(facts, tx, 'consumed');
          return null;
        });
      });
    },
    async returnIssued(c, connection) {
      return connection.transaction(async (tx) => {
        const intent = await source(c, 'return', tx);
        await command(
          c,
          'return',
          tx,
          { units: c.units, employeeId: intent.employeeId },
          async () => {
            const facts = await tx
              .repository<Fact>('assetIssueFacts')
              .findMany({
                filter: { sourceId: c.sourceId },
                sort: (s) => [s.field('assetId').asc()],
              });
            completeUnits(c.units, facts);
            for (const fact of facts) {
              if (
                await tx.repository('assetReturnFacts').exists({
                  filter: { sourceId: c.sourceId, assetId: fact.assetId },
                })
              )
                fail(
                  'ASSET_ALREADY_RETURNED',
                  'This issue batch already has a return receipt.',
                );
              const { locked } = await lock(fact.assetId, tx),
                serial = c.units
                  .find((u) => u.assetId === fact.assetId)!
                  .serialNumber.trim();
              if (
                !['assigned', 'borrowed'].includes(locked.status) ||
                locked.holderEmployeeId !== intent.employeeId ||
                serial !== locked.serialNumber ||
                serial !== fact.snapshot.serialNumber
              )
                fail(
                  'ASSET_RETURN_MISMATCH',
                  'The actual custody and serial number do not match this issue source.',
                );
              if (
                await tx
                  .repository('assetActiveHolds')
                  .exists({ filter: { assetId: locked.id } })
              )
                fail(
                  'ASSET_ALREADY_RESERVED',
                  'An active disposition hold must be resolved before return.',
                );
              await tx.repository('assets').updateMany({
                filter: { id: locked.id, version: locked.version },
                values: {
                  status: 'available',
                  holderEmployeeId: null,
                  borrowDueDate: null,
                  updatedAt: demoNow(),
                },
              });
              await tx.repository('assetReturnFacts').createOne({
                values: {
                  id: idFor(c.sourceId, locked.id),
                  sourceId: c.sourceId,
                  assetId: locked.id,
                  employeeId: intent.employeeId,
                  actorId: c.actorId,
                  snapshot: snapshot(locked),
                  createdAt: demoNow(),
                },
              });
            }
            return null;
          },
        );
      });
    },
    async scrap(c, connection) {
      return connection.transaction(async (tx) => {
        const intent = await source(c, 'scrap', tx);
        await command(c, 'scrap', tx, { intent }, async () => {
          const facts = await holds(c.sourceId, tx);
          if (intent.operation !== 'scrap' || facts.length !== 1)
            fail(
              'ASSET_SOURCE_MISMATCH',
              'A scrap approval must match exactly one reserved asset.',
            );
          const item = await verifyHeld(facts[0], tx);
          await tx.repository('assets').updateMany({
            filter: { id: item.id, version: item.version },
            values: {
              status: 'scrapped',
              holderEmployeeId: null,
              borrowDueDate: null,
              updatedAt: demoNow(),
            },
          });
          await tx.repository('assetDisposalFacts').createOne({
            values: {
              id: idFor(c.sourceId, item.id),
              sourceId: c.sourceId,
              assetId: item.id,
              employeeId: intent.employeeId,
              actorId: c.actorId,
              snapshot: snapshot(item),
              createdAt: demoNow(),
            },
          });
          await consume(facts, tx, 'consumed');
          return null;
        });
      });
    },
    async stockFacts(sourceId, tx) {
      const read = async (table: string) =>
        (
          await tx.repository<Fact>(table).findMany({
            filter: { sourceId },
            sort: (s) => [s.field('assetId').asc()],
          })
        ).map((f) => f.snapshot);
      return {
        held: (await holds(sourceId, tx)).map((f) => f.snapshot),
        issued: await read('assetIssueFacts'),
        returned: await read('assetReturnFacts'),
        disposed: await read('assetDisposalFacts'),
      };
    },
  };
}

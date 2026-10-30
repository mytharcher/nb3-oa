import { demoNow } from '../demo-data/context.js';
import { createLegacyAssetReturn } from './legacy-return.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { DictionaryService } from '../platform/index.js';
import type { Asset, AssetInput, AssetService } from './contract.js';
import { createAssetClearanceService } from './clearance.js';
import { AssetError } from './errors.js';
export { AssetError } from './errors.js';
import { createAssetStockService } from './stock.js';
import type { AssetStockSource } from './stock-contract.js';
export function createAssetService(d: {
  audit: AuditService;
  dictionaries: DictionaryService;
  source?: AssetStockSource;
  returnActor?: (actorId: string, tx: DatabaseConnection) => Promise<boolean>;
}): AssetService {
  const normalize = (row: Asset): Asset => {
    const originalValueCents = Number(row.originalValueCents);
    if (!Number.isSafeInteger(originalValueCents) || originalValueCents < 0)
      throw new AssetError(
        'ASSET_INVALID_STORED_AMOUNT',
        'The stored asset value is outside the supported exact amount range.',
      );
    return { ...row, originalValueCents };
  };
  const normalizeProjection = (row: Partial<Asset>): Partial<Asset> => {
    if (row.originalValueCents === undefined) return row;
    const value = Number(row.originalValueCents);
    if (!Number.isSafeInteger(value) || value < 0)
      throw new AssetError(
        'ASSET_INVALID_STORED_AMOUNT',
        'The stored asset value is outside the supported exact amount range.',
      );
    return { ...row, originalValueCents: value };
  };
  const clearance = createAssetClearanceService();
  const validate = async (
    input: AssetInput,
    connection: Parameters<AssetService['get']>[1],
  ) => {
    if (
      !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(input.code) ||
      typeof input.category !== 'string' ||
      !input.category ||
      input.category.length > 64 ||
      !input.name?.trim() ||
      input.name.length > 200 ||
      !Number.isSafeInteger(input.originalValueCents) ||
      input.originalValueCents < 0 ||
      (input.serialNumber !== null &&
        (typeof input.serialNumber !== 'string' ||
          input.serialNumber.length > 200))
    )
      throw new AssetError(
        'ASSET_INVALID_INPUT',
        'Enter a stable asset code, name and nonnegative exact amount.',
      );
    if (
      !(await d.dictionaries.get('assetCategory', input.category, connection))
        ?.active
    )
      throw new AssetError(
        'ASSET_CATEGORY_INACTIVE',
        'Choose an active asset category.',
      );
    return {
      ...input,
      name: input.name.trim(),
      serialNumber: input.serialNumber?.trim() || null,
    };
  };
  const command = (input: { actorId: string; reason: string }) => {
    if (
      !input.actorId ||
      input.actorId.length > 64 ||
      !input.reason?.trim() ||
      input.reason.length > 5000
    )
      throw new AssetError(
        'ASSET_INVALID_COMMAND',
        'An actor and audit reason are required.',
      );
  };
  const get: AssetService['get'] = async (id, connection) => {
    const row = await connection
      .repository<Asset>('assets')
      .findOne({ filter: { id } });
    return row ? normalize(row) : null;
  };
  return {
    returnHeld: createLegacyAssetReturn(d),
    ...createAssetStockService({ audit: d.audit, source: d.source }),
    ...clearance,
    get,
    async repairEligibility(
      id,
      employeeId,
      connection,
      heldPolicy,
      explicitPolicy,
    ) {
      const held = heldPolicy
        ? await this.read(id, connection, heldPolicy, employeeId)
        : null;
      const row =
        held ??
        (explicitPolicy
          ? await this.read(id, connection, explicitPolicy)
          : null);
      return row?.id && row.status && row.status !== 'scrapped' ? row : null;
    },
    async read(id, connection, policy, holderEmployeeId) {
      const row = await connection
        .repository<Asset>('assets')
        .withPolicy(policy)
        .findOne({
          filter: {
            id,
            ...(holderEmployeeId === undefined ? {} : { holderEmployeeId }),
          },
        });
      return row ? normalizeProjection(row) : null;
    },
    async list(query, connection, policy) {
      const repo = connection.repository<Asset>('assets').withPolicy(policy);
      const filter =
        query.holderEmployeeId === undefined
          ? undefined
          : { holderEmployeeId: query.holderEmployeeId };
      const rows = await repo.findMany({
        filter,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
        sort: (o) => [o.field('id').asc()],
      });
      return {
        rows: rows.map(normalizeProjection),
        total: await repo.count({ filter }),
      };
    },
    async create(input, connection, policy) {
      command(input);
      return connection.transaction(async (tx) => {
        const clean = await validate(input, tx);
        const repo = tx.repository<Asset>('assets');
        if (await repo.exists({ filter: { code: clean.code } }))
          throw new AssetError(
            'ASSET_CODE_EXISTS',
            'This asset code already exists.',
            'conflict',
          );
        const now = demoNow().toISOString();
        const id = randomUUID();
        await (policy ? repo.withPolicy(policy) : repo).createOne({
          values: {
            id,
            code: clean.code,
            name: clean.name,
            category: clean.category,
            serialNumber: clean.serialNumber,
            originalValueCents: clean.originalValueCents,
            status: 'available',
            holderEmployeeId: null,
            borrowDueDate: null,
            version: 1,
            createdAt: now,
            updatedAt: now,
          },
        });
        // Write results obey read projection and may be partial. Audit uses a trusted read by generated ID.
        const row = await get(id, tx);
        if (!row)
          throw new AssetError(
            'ASSET_WRITE_UNCONFIRMED',
            'The asset write could not be confirmed.',
            'conflict',
          );
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'asset.create',
            targetType: 'assets',
            targetId: row.id,
            after: row,
            reason: input.reason.trim(),
          },
          tx,
        );
        return row;
      });
    },
    async update(id, input, connection, policy) {
      command(input);
      if (
        !Number.isSafeInteger(input.version) ||
        input.version < 1 ||
        input.version >= Number.MAX_SAFE_INTEGER
      )
        throw new AssetError(
          'ASSET_INVALID_VERSION',
          'Enter the current asset version.',
        );
      return connection.transaction(async (tx) => {
        if (
          policy &&
          !(await tx
            .repository<Asset>('assets')
            .withPolicy(policy)
            .exists({ filter: { id } }))
        )
          throw new AssetError(
            'ASSET_NOT_FOUND',
            'Asset not found.',
            'notFound',
          );
        const before = await get(id, tx);
        if (!before)
          throw new AssetError(
            'ASSET_NOT_FOUND',
            'Asset not found.',
            'notFound',
          );
        if (before.version !== input.version)
          throw new AssetError(
            'ASSET_VERSION_CONFLICT',
            'Load the latest asset version.',
            'conflict',
          );
        const clean = await validate({ ...before, ...input }, tx);
        const repo = tx.repository<Asset>('assets');
        if (
          clean.code !== before.code &&
          (await repo.exists({ filter: { code: clean.code } }))
        )
          throw new AssetError(
            'ASSET_CODE_EXISTS',
            'This asset code already exists.',
            'conflict',
          );
        const changed = await (
          policy ? repo.withPolicy(policy) : repo
        ).updateMany({
          filter: { id, version: input.version },
          values: {
            ...(input.code === undefined ? {} : { code: clean.code }),
            ...(input.category === undefined
              ? {}
              : { category: clean.category }),
            ...(input.name === undefined ? {} : { name: clean.name }),
            ...(input.serialNumber === undefined
              ? {}
              : { serialNumber: clean.serialNumber }),
            ...(input.originalValueCents === undefined
              ? {}
              : { originalValueCents: clean.originalValueCents }),
            version: input.version + 1,
            updatedAt: demoNow().toISOString(),
          },
        });
        if (!changed.updatedCount)
          throw new AssetError(
            'ASSET_VERSION_CONFLICT',
            'Load the latest asset version.',
            'conflict',
          );
        const after = (await get(id, tx))!;
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'asset.update',
            targetType: 'assets',
            targetId: id,
            before,
            after,
            reason: input.reason.trim(),
          },
          tx,
        );
        return after;
      });
    },
  };
}

/**
 * Dictionaries (01 §7): the enumerations flows read. Types and the shape of their `extra` are code
 * (`dictionary-types.ts`); entries are data administrators maintain. An entry's `code` is what other records store,
 * so it never changes after creation, and entries are disabled rather than deleted: an old request must still resolve
 * the leave type it was filed under. Every change is audited in the same transaction.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { z } from 'zod';

import type { AuditService } from '../audit/index.js';
import {
  DICTIONARY_TYPES,
  LABEL_LOCALES,
  dictionaryExtraSchema,
  dictionaryTypeOf,
  type DictionaryLabel,
  type DictionaryTypeDefinition,
} from './dictionary-types.js';
import { PlatformError } from './errors.js';

export {
  DICTIONARY_TYPES,
  localizeLabel,
  type DictionaryLabel,
  type DictionaryTypeDefinition,
} from './dictionary-types.js';

export interface DictionaryEntry {
  readonly id: string;
  readonly type: string;
  readonly code: string;
  readonly label: DictionaryLabel;
  readonly sortOrder: number;
  readonly active: boolean;
  readonly extra: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateDictionaryEntryInput {
  readonly code: string;
  readonly label: DictionaryLabel;
  readonly sortOrder?: number;
  readonly active?: boolean;
  readonly extra?: Record<string, unknown> | null;
}

export interface UpdateDictionaryEntryInput {
  readonly label?: DictionaryLabel;
  readonly sortOrder?: number;
  readonly active?: boolean;
  readonly extra?: Record<string, unknown> | null;
}

export interface DictionaryService {
  types(): readonly DictionaryTypeDefinition[];
  /** Entries of a type ordered by `sortOrder`; active ones only unless `includeInactive`. */
  list(
    type: string,
    options?: { includeInactive?: boolean },
    connection?: DatabaseConnection,
  ): Promise<DictionaryEntry[]>;
  /** One entry by type and code, active or not — what a stored code resolves to. */
  get(
    type: string,
    code: string,
    connection?: DatabaseConnection,
  ): Promise<DictionaryEntry | undefined>;
  create(
    type: string,
    input: CreateDictionaryEntryInput,
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<DictionaryEntry>;
  update(
    type: string,
    entryId: string,
    input: UpdateDictionaryEntryInput,
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<DictionaryEntry>;
}

export const dictionaryServiceToken: ServiceToken<DictionaryService> =
  createServiceToken<DictionaryService>('oa/platform/dictionary-service');

interface EntryRow {
  id: number | string;
  type: string;
  code: string;
  label: DictionaryLabel | null;
  sortOrder: number;
  active: boolean;
  extra: Record<string, unknown> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toEntry(row: EntryRow): DictionaryEntry {
  return {
    id: String(row.id),
    type: row.type,
    code: row.code,
    label: row.label ?? {},
    sortOrder: Number(row.sortOrder ?? 0),
    active: Boolean(row.active),
    extra: row.extra ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

const labelSchema = z
  .partialRecord(z.enum(LABEL_LOCALES), z.string().trim().max(100))
  .refine((label) => Object.values(label).some((value) => value), {
    message: 'A label needs at least one language.',
  });

function requireType(type: string): DictionaryTypeDefinition {
  const definition = dictionaryTypeOf(type);
  if (!definition)
    throw new PlatformError(
      'DICTIONARY_TYPE_UNKNOWN',
      `Dictionary type "${type}" is not defined.`,
    );
  return definition;
}

function parseLabel(label: unknown): DictionaryLabel {
  const parsed = labelSchema.safeParse(label);
  if (!parsed.success)
    throw new PlatformError(
      'DICTIONARY_INVALID_LABEL',
      parsed.error.issues[0]?.message ?? 'The label is invalid.',
      { field: 'label' },
    );
  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value),
  );
}

function parseExtra(
  definition: DictionaryTypeDefinition,
  extra: unknown,
): Record<string, unknown> | null {
  const parsed = dictionaryExtraSchema(definition).safeParse(extra ?? null);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new PlatformError(
      'DICTIONARY_INVALID_EXTRA',
      issue?.message ?? 'The extra attributes are invalid.',
      { field: ['extra', ...(issue?.path ?? [])].join('.') },
    );
  }
  return parsed.data;
}

export function createDictionaryService(
  database: DatabaseManager,
  audit: AuditService,
): DictionaryService {
  async function inTransaction<T>(
    connection: DatabaseConnection | undefined,
    work: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return connection ? work(connection) : database.transaction(work);
  }

  const snapshotOf = (entry: DictionaryEntry) => ({
    code: entry.code,
    label: entry.label,
    sortOrder: entry.sortOrder,
    active: entry.active,
    extra: entry.extra,
  });

  return {
    types: () => DICTIONARY_TYPES,

    async list(type, options = {}, connection) {
      requireType(type);
      const rows = (await (connection ?? database.connection())
        .repository('dictionaries')
        .findMany({
          filter: options.includeInactive ? { type } : { type, active: true },
          sort: (sort) => [
            sort.field('sortOrder').asc(),
            sort.field('id').asc(),
          ],
        })) as unknown as EntryRow[];
      return rows.map(toEntry);
    },

    async get(type, code, connection) {
      requireType(type);
      const row = (await (connection ?? database.connection())
        .repository('dictionaries')
        .findOne({ filter: { type, code } })) as unknown as
        EntryRow | undefined;
      return row ? toEntry(row) : undefined;
    },

    async create(type, input, actorId, connection) {
      const definition = requireType(type);
      const label = parseLabel(input.label);
      const extra = parseExtra(definition, input.extra);
      return inTransaction(connection, async (transaction) => {
        const repository = transaction.repository('dictionaries');
        if (await repository.exists({ filter: { type, code: input.code } }))
          throw new PlatformError(
            'DICTIONARY_CODE_EXISTS',
            `"${type}" already has an entry "${input.code}".`,
            { field: 'code' },
          );
        const now = new Date();
        const result = await repository.createOne({
          values: {
            type,
            code: input.code,
            label,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
            extra,
            createdAt: now,
            updatedAt: now,
          },
        });
        const entry = toEntry(result.record as unknown as EntryRow);
        await audit.record(
          {
            actorId,
            action: 'dictionary.create',
            targetType: 'dictionaries',
            targetId: `${type}:${entry.code}`,
            after: snapshotOf(entry),
          },
          transaction,
        );
        return entry;
      });
    },

    async update(type, entryId, input, actorId, connection) {
      const definition = requireType(type);
      const label =
        input.label === undefined ? undefined : parseLabel(input.label);
      const extra =
        input.extra === undefined
          ? undefined
          : parseExtra(definition, input.extra);
      return inTransaction(connection, async (transaction) => {
        const repository = transaction.repository('dictionaries');
        const id = Number(entryId);
        const existing = Number.isInteger(id)
          ? ((await repository.findOne({ filter: { id, type } })) as unknown as
              EntryRow | undefined)
          : undefined;
        if (!existing)
          throw new PlatformError(
            'DICTIONARY_ENTRY_NOT_FOUND',
            `Entry ${entryId} of "${type}" was not found.`,
          );
        const before = toEntry(existing);
        const values: {
          updatedAt: Date;
          label?: DictionaryLabel;
          extra?: Record<string, unknown> | null;
          sortOrder?: number;
          active?: boolean;
        } = { updatedAt: new Date() };
        if (label !== undefined) values.label = label;
        if (extra !== undefined) values.extra = extra;
        if (input.sortOrder !== undefined) values.sortOrder = input.sortOrder;
        if (input.active !== undefined) values.active = input.active;
        const result = await repository.updateOne({ filter: { id }, values });
        const after = toEntry(result.record as unknown as EntryRow);
        const changedBefore: Record<string, unknown> = {};
        const changedAfter: Record<string, unknown> = {};
        const beforeSnapshot = snapshotOf(before) as Record<string, unknown>;
        const afterSnapshot = snapshotOf(after) as Record<string, unknown>;
        for (const field of Object.keys(afterSnapshot)) {
          if (
            JSON.stringify(beforeSnapshot[field]) ===
            JSON.stringify(afterSnapshot[field])
          )
            continue;
          changedBefore[field] = beforeSnapshot[field];
          changedAfter[field] = afterSnapshot[field];
        }
        if (Object.keys(changedAfter).length > 0)
          await audit.record(
            {
              actorId,
              action:
                input.active === false && before.active
                  ? 'dictionary.disable'
                  : input.active === true && !before.active
                    ? 'dictionary.enable'
                    : 'dictionary.update',
              targetType: 'dictionaries',
              targetId: `${type}:${after.code}`,
              before: changedBefore,
              after: changedAfter,
            },
            transaction,
          );
        return after;
      });
    },
  };
}

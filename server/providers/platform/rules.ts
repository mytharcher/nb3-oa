/**
 * Versioned approval rules (02 §3). A key's rows are its history; the value in effect at an instant is the latest row
 * whose `effectiveFrom` is not after it. Flows snapshot the keys they use inside their submit transaction, so a rule
 * change affects only requests submitted after it takes effect. Editing never rewrites a row: it adds a version,
 * effective now or in the future, and a version not yet in effect may be withdrawn. Every change is audited in the
 * same transaction.
 */
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AuditService } from '../audit/index.js';
import { PlatformError } from './errors.js';
import {
  RULE_DEFINITIONS,
  RULE_ORDERINGS,
  ruleDefinitionOf,
  ruleValueSchema,
  type RuleDefinition,
} from './rule-definitions.js';

export interface RuleVersion {
  readonly id: string;
  readonly key: string;
  readonly value: unknown;
  readonly effectiveFrom: Date;
  readonly updatedBy: string | null;
  readonly note: string | null;
  readonly createdAt: Date;
}

export interface SetRuleInput {
  readonly key: string;
  readonly value: unknown;
  /** When the version takes effect; now when omitted. Never in the past. */
  readonly effectiveFrom?: Date;
  readonly note?: string | null;
  readonly actorId: string | null;
}

export interface RuleService {
  /** The metadata of every key, in display order. */
  definitions(): readonly RuleDefinition[];
  /** The value of `key` in effect at `at` (now by default). */
  get<T = unknown>(
    key: string,
    at?: Date,
    connection?: DatabaseConnection,
  ): Promise<T>;
  /**
   * The values of `keys` in effect at `at`, as `{ key: value }`. Pass the submit transaction's connection so the
   * snapshot reads what that transaction sees; store the result on the request as its `ruleSnapshot`.
   */
  snapshot(
    keys: readonly string[],
    at?: Date,
    connection?: DatabaseConnection,
  ): Promise<Record<string, unknown>>;
  /** Every version of the given keys (all keys when omitted), oldest first per key. */
  versions(
    keys?: readonly string[],
    connection?: DatabaseConnection,
  ): Promise<RuleVersion[]>;
  /** Adds a version after validating it; audited in the same transaction. */
  set(
    input: SetRuleInput,
    connection?: DatabaseConnection,
  ): Promise<RuleVersion>;
  /** Withdraws a version that has not taken effect yet; audited in the same transaction. */
  cancel(
    key: string,
    versionId: string,
    actorId: string | null,
    connection?: DatabaseConnection,
  ): Promise<RuleVersion>;
  /** Called with the changed key after each committed change. Returns the unsubscribe function. */
  onChange(listener: (key: string) => void): () => void;
}

export const ruleServiceToken: ServiceToken<RuleService> =
  createServiceToken<RuleService>('oa/platform/rule-service');

/** Clock skew tolerated before "now" counts as the past. */
const SKEW_MS = 60_000;

interface RuleRow {
  id: number | string;
  key: string;
  value: unknown;
  effectiveFrom: Date | string;
  updatedBy: string | null;
  note: string | null;
  createdAt: Date | string;
}

function toVersion(row: RuleRow): RuleVersion {
  return {
    id: String(row.id),
    key: row.key,
    value: row.value,
    effectiveFrom: new Date(row.effectiveFrom),
    updatedBy: row.updatedBy ?? null,
    note: row.note ?? null,
    createdAt: new Date(row.createdAt),
  };
}

/** The version of a key in effect at `at` among its versions sorted oldest first. */
function versionAt(
  versions: readonly RuleVersion[],
  at: number,
): RuleVersion | undefined {
  let found: RuleVersion | undefined;
  for (const version of versions) {
    if (version.effectiveFrom.getTime() <= at) found = version;
    else break;
  }
  return found;
}

function requireDefinition(key: string): RuleDefinition {
  const definition = ruleDefinitionOf(key);
  if (!definition)
    throw new PlatformError('RULE_UNKNOWN', `Rule "${key}" is not defined.`, {
      field: 'key',
    });
  return definition;
}

export function createRuleService(
  database: DatabaseManager,
  audit: AuditService,
  now: () => Date = () => new Date(),
): RuleService {
  const listeners = new Set<(key: string) => void>();

  async function load(
    keys: readonly string[] | undefined,
    connection?: DatabaseConnection,
  ): Promise<RuleVersion[]> {
    if (keys && keys.length === 0) return [];
    const repository = (connection ?? database.connection()).repository(
      'approvalRules',
    );
    const rows = (await repository.findMany({
      ...(keys
        ? { filter: (f) => f.or(keys.map((key) => f.string('key').eq(key))) }
        : {}),
      sort: (sort) => [
        sort.field('key').asc(),
        sort.field('effectiveFrom').asc(),
      ],
    })) as unknown as RuleRow[];
    return rows.map(toVersion);
  }

  function group(versions: readonly RuleVersion[]): Map<string, RuleVersion[]> {
    const byKey = new Map<string, RuleVersion[]>();
    for (const version of versions) {
      const list = byKey.get(version.key) ?? [];
      list.push(version);
      byKey.set(version.key, list);
    }
    for (const list of byKey.values())
      list.sort(
        (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime(),
      );
    return byKey;
  }

  function valueIn(
    byKey: ReadonlyMap<string, readonly RuleVersion[]>,
    key: string,
    at: number,
  ): unknown {
    const version = versionAt(byKey.get(key) ?? [], at);
    return version ? version.value : ruleDefinitionOf(key)?.defaultValue;
  }

  /** Rejects a version that would put an ordered pair out of order at any instant from its start on. */
  function assertOrdering(
    byKey: Map<string, RuleVersion[]>,
    key: string,
    from: number,
  ): void {
    for (const [lower, upper] of RULE_ORDERINGS) {
      if (key !== lower && key !== upper) continue;
      const instants = new Set<number>([from]);
      for (const name of [lower, upper])
        for (const version of byKey.get(name) ?? []) {
          const at = version.effectiveFrom.getTime();
          if (at > from) instants.add(at);
        }
      for (const at of instants) {
        const low = valueIn(byKey, lower, at);
        const high = valueIn(byKey, upper, at);
        if (typeof low === 'number' && typeof high === 'number' && low > high)
          throw new PlatformError(
            'RULE_ORDER_VIOLATED',
            `"${lower}" (${low}) may not exceed "${upper}" (${high}) from ${new Date(at).toISOString()}.`,
            { field: 'value', metadata: { lower, upper } },
          );
      }
    }
  }

  async function inTransaction<T>(
    connection: DatabaseConnection | undefined,
    work: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return connection ? work(connection) : database.transaction(work);
  }

  function notify(connection: DatabaseConnection, key: string): void {
    connection.afterCommit(() => {
      for (const listener of listeners) listener(key);
    });
  }

  return {
    definitions: () => RULE_DEFINITIONS,

    async get<T>(key: string, at?: Date, connection?: DatabaseConnection) {
      requireDefinition(key);
      const snapshot = await this.snapshot([key], at, connection);
      return snapshot[key] as T;
    },

    async snapshot(keys, at = now(), connection) {
      for (const key of keys) requireDefinition(key);
      const byKey = group(await load(keys, connection));
      return Object.fromEntries(
        keys.map((key) => [key, valueIn(byKey, key, at.getTime())]),
      );
    },

    versions: (keys, connection) => load(keys, connection),

    async set(input, connection) {
      const definition = requireDefinition(input.key);
      const parsed = ruleValueSchema(definition).safeParse(input.value);
      if (!parsed.success)
        throw new PlatformError(
          'RULE_INVALID_VALUE',
          parsed.error.issues[0]?.message ?? 'The value is invalid.',
          { field: 'value' },
        );
      const current = now();
      let effectiveFrom = input.effectiveFrom ?? current;
      if (effectiveFrom.getTime() < current.getTime() - SKEW_MS)
        throw new PlatformError(
          'RULE_EFFECTIVE_IN_PAST',
          'A rule version cannot take effect in the past.',
          { field: 'effectiveFrom' },
        );
      if (
        !definition.allowFuture &&
        effectiveFrom.getTime() > current.getTime() + SKEW_MS
      )
        throw new PlatformError(
          'RULE_FUTURE_NOT_ALLOWED',
          `"${input.key}" takes effect immediately and cannot be scheduled.`,
          { field: 'effectiveFrom' },
        );
      if (effectiveFrom.getTime() < current.getTime()) effectiveFrom = current;

      return inTransaction(connection, async (transaction) => {
        const related = new Set([input.key]);
        for (const pair of RULE_ORDERINGS)
          if (pair.includes(input.key)) pair.forEach((key) => related.add(key));
        const byKey = group(await load([...related], transaction));
        const own = byKey.get(input.key) ?? [];
        if (
          own.some(
            (version) =>
              version.effectiveFrom.getTime() === effectiveFrom.getTime(),
          )
        )
          throw new PlatformError(
            'RULE_VERSION_EXISTS',
            `"${input.key}" already has a version taking effect at that instant.`,
            { field: 'effectiveFrom' },
          );
        const previous = versionAt(own, effectiveFrom.getTime());
        const created = toVersion({
          id: '',
          key: input.key,
          value: parsed.data,
          effectiveFrom,
          updatedBy: input.actorId,
          note: input.note ?? null,
          createdAt: current,
        });
        byKey.set(
          input.key,
          [...own, created].sort(
            (a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime(),
          ),
        );
        assertOrdering(byKey, input.key, effectiveFrom.getTime());

        const result = await transaction.repository('approvalRules').createOne({
          values: {
            key: input.key,
            // Validated against the key's schema above: a number, a string or a plain object.
            value: parsed.data as
              number | string | Readonly<Record<string, unknown>>,
            effectiveFrom,
            updatedBy: input.actorId,
            note: input.note ?? null,
            createdAt: current,
          },
        });
        const version = toVersion(result.record as unknown as RuleRow);
        await audit.record(
          {
            actorId: input.actorId,
            action: 'rule.set',
            targetType: 'approvalRules',
            targetId: input.key,
            before: previous
              ? {
                  value: previous.value,
                  effectiveFrom: previous.effectiveFrom.toISOString(),
                }
              : null,
            after: {
              value: version.value,
              effectiveFrom: version.effectiveFrom.toISOString(),
            },
            reason: version.note,
          },
          transaction,
        );
        notify(transaction, input.key);
        return version;
      });
    },

    async cancel(key, versionId, actorId, connection) {
      requireDefinition(key);
      return inTransaction(connection, async (transaction) => {
        const repository = transaction.repository('approvalRules');
        const row = (await repository.findOne({
          filter: { id: Number(versionId), key },
        })) as unknown as RuleRow | undefined;
        if (!row)
          throw new PlatformError(
            'RULE_VERSION_NOT_FOUND',
            `Version ${versionId} of "${key}" was not found.`,
          );
        const version = toVersion(row);
        if (version.effectiveFrom.getTime() <= now().getTime())
          throw new PlatformError(
            'RULE_VERSION_IN_EFFECT',
            'A version that has taken effect is history and cannot be withdrawn.',
          );
        const byKey = group(
          await load(
            [
              ...new Set([
                key,
                ...RULE_ORDERINGS.filter((pair) => pair.includes(key)).flat(),
              ]),
            ],
            transaction,
          ),
        );
        byKey.set(
          key,
          (byKey.get(key) ?? []).filter((item) => item.id !== version.id),
        );
        assertOrdering(byKey, key, version.effectiveFrom.getTime());
        await repository.deleteOne({ filter: { id: Number(versionId) } });
        await audit.record(
          {
            actorId,
            action: 'rule.cancel',
            targetType: 'approvalRules',
            targetId: key,
            before: {
              value: version.value,
              effectiveFrom: version.effectiveFrom.toISOString(),
            },
            after: null,
          },
          transaction,
        );
        notify(transaction, key);
        return version;
      });
    },

    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

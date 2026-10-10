import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type DatabaseManager,
  type FilterBuilder,
} from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';

import { installPermissionSetAudit } from './permission-sets.js';

/** One sensitive operation. `before`/`after` are JSON snapshots of what changed; omit unchanged fields. */
export interface AuditEntry {
  actorId: string | null;
  /** Dotted verb, e.g. `department.update`, `dutyRoleMember.add`, `rule.set`. */
  action: string;
  /** Logical collection or concept the action touched, e.g. `departments`. */
  targetType: string;
  targetId?: string | number | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
}

export interface AuditLogRecord extends Omit<AuditEntry, 'targetId'> {
  id: number;
  targetId: string | null;
  at: Date;
}

export interface AuditListQuery {
  targetType?: string;
  targetId?: string;
  actorId?: string;
  action?: string;
  /** Entries at or after this instant. */
  from?: Date;
  /** Entries before this instant. */
  to?: Date;
  /** Newest first by default. */
  order?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** The distinct values the audit log page offers as filters. */
export interface AuditFacets {
  targetTypes: string[];
  actions: string[];
}

export interface AuditService {
  /**
   * Records an entry. Pass the transaction connection when the audited change is written in one, so the entry
   * commits or rolls back with it.
   */
  record(entry: AuditEntry, connection?: DatabaseConnection): Promise<void>;
  list(
    query: AuditListQuery,
  ): Promise<{ items: AuditLogRecord[]; total: number }>;
  facets(): Promise<AuditFacets>;
  get(id: number): Promise<AuditLogRecord | undefined>;
}

type AuditFilterBuilder = FilterBuilder;

export const auditServiceToken: ServiceToken<AuditService> =
  createServiceToken<AuditService>('oa/audit-service');

export function createAuditService(database: DatabaseManager): AuditService {
  return {
    async record(entry, connection) {
      const repository = connection
        ? connection.repository('auditLogs')
        : database.repository('auditLogs');
      await repository.createOne({
        values: {
          actorId: entry.actorId,
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId == null ? null : String(entry.targetId),
          before: entry.before ?? null,
          after: entry.after ?? null,
          reason: entry.reason ?? null,
          at: new Date(),
        },
      });
    },

    async list({ page, pageSize, from, to, order = 'desc', ...criteria }) {
      const repository = database.repository('auditLogs');
      const equals = Object.entries<string | undefined>(criteria).filter(
        (entry): entry is [string, string] => Boolean(entry[1]),
      );
      const hasFilter = equals.length > 0 || from || to;
      const filter = hasFilter
        ? {
            filter: (f: AuditFilterBuilder) =>
              f.and([
                ...equals.map(([field, value]) => f.string(field).eq(value)),
                ...(from ? [f.date('at').notBefore(from)] : []),
                ...(to ? [f.date('at').before(to)] : []),
              ]),
          }
        : {};
      const [items, total] = await Promise.all([
        repository.findMany({
          ...filter,
          sort: (sort) =>
            order === 'asc' ? sort.field('id').asc() : sort.field('id').desc(),
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        repository.count(filter),
      ]);
      return { items: items as unknown as AuditLogRecord[], total };
    },

    async get(id) {
      const record = await database
        .repository('auditLogs')
        .findOne({ filter: { id } });
      return (record as unknown as AuditLogRecord | undefined) ?? undefined;
    },

    async facets() {
      const repository = database.repository('auditLogs');
      const [targetTypes, actions] = await Promise.all(
        (['targetType', 'action'] as const).map(async (field) => {
          const groups = await repository.groupBy({
            by: [field],
            aggregate: (aggregate) => ({ count: aggregate.count() }),
            sort: (sort) => sort.field(field).asc(),
          });
          return (groups as unknown as Record<string, unknown>[])
            .map((group) => group[field])
            .filter((value): value is string => typeof value === 'string');
        }),
      );
      return { targetTypes: targetTypes, actions: actions };
    },
  };
}

export default class AuditProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/audit-provider';
  private restorePermissions: (() => void) | undefined;

  public override register(): void {
    this.app.container.singleton(auditServiceToken, () =>
      createAuditService(this.app.container.resolve(databaseManagerToken)),
    );
  }

  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    this.restorePermissions = installPermissionSetAudit(
      this.app.container.resolve(authorizationToken).permissionSets,
      this.app.container.resolve(databaseManagerToken),
      this.app.container.resolve(auditServiceToken),
    );
  }

  public override async shutdown(): Promise<void> {
    this.restorePermissions?.();
  }
}

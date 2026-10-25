import { createHash, randomUUID } from 'node:crypto';
import { ApiError } from '@nocobase/app-server/router';
import type {
  DatabaseManager,
  DatabaseConnection,
  RepositoryPolicy,
} from '@nocobase/db';
import type { OrganizationService } from '../org/service.js';
import type { EmployeeService } from '../employees/contract.js';
import type { AuditService } from '../audit/index.js';
import type { BatchInput, SyncItem } from './schema.js';
export type SyncAccess = {
  actorId: string;
  manage: boolean;
  departments: boolean;
  grades: boolean;
  employees?: RepositoryPolicy;
  status?: RepositoryPolicy;
};
export type SourceRow = {
  id: string;
  name: string;
  principalId: string;
  active: boolean;
  updatedAt: Date | string;
};
type Mapping = {
  id: string;
  source: string;
  entity: SyncItem['entity'];
  externalId: string;
  localId: string;
  revision: number;
  payloadHash: string;
  localHash: string;
  fields: string[];
  updatedAt: Date | string;
};
type Run = {
  id: string;
  source: string;
  eventId: string;
  payloadHash: string;
  payload: BatchInput;
  state: string;
  reasonCode: string | null;
  itemCount: number;
  actorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};
const hash = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canonical = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, value[key] ?? null]),
  );
const projection = (value: object, fields: string[]) =>
  canonical(
    Object.fromEntries(
      fields.map((key) => [key, Reflect.get(value, key) ?? null]),
    ),
  );
export function syncError(reason: string): never {
  throw new ApiError({
    status: [
      'ACCESS_DENIED',
      'FIELDS_RESTRICTED',
      'BINDING_REQUIRES_MANAGER',
    ].includes(reason)
      ? 'PERMISSION_DENIED'
      : 'FAILED_PRECONDITION',
    domain: 'hrMasterData',
    reason,
    message: 'The HR synchronization could not be applied.',
  });
}
function readFields(policy: RepositoryPolicy | undefined, fields: string[]) {
  if (!policy?.read) syncError('ACCESS_DENIED');
  if (policy.read !== true) {
    const allowed = policy.read.fields;
    if (
      allowed === false ||
      (Array.isArray(allowed) &&
        fields.some(
          (field) => !allowed.includes('*') && !allowed.includes(field),
        ))
    )
      syncError('FIELDS_RESTRICTED');
  }
}
export function createHrMasterDataService(d: {
  db: DatabaseManager;
  org: OrganizationService;
  employees: EmployeeService;
  audit: AuditService;
}) {
  const root = () => d.db.connection();
  const audit = (
    tx: DatabaseConnection,
    access: SyncAccess,
    action: string,
    id: string,
    after: Record<string, unknown>,
    reason?: string,
  ) =>
    d.audit.record(
      {
        actorId: access.actorId,
        action: `hrMasterData.${action}`,
        targetType: 'hrMasterData',
        targetId: id,
        after,
        reason,
      },
      tx,
    );
  async function source(
    tx: DatabaseConnection,
    id: string,
    access: SyncAccess,
    lock = false,
  ) {
    const repo = tx.repository<SourceRow>('hrSyncSources');
    const row = await repo.findOne({ filter: { id } });
    if (!row || (!access.manage && row.principalId !== access.actorId))
      syncError('ACCESS_DENIED');
    if (lock) {
      await repo.updateOne({
        filter: { id },
        values: { updatedAt: new Date() },
      });
      return source(tx, id, access, false);
    }
    return row;
  }
  async function local(
    tx: DatabaseConnection,
    entity: SyncItem['entity'],
    id: string,
  ) {
    if (entity === 'department') return d.org.getDepartment(id, tx);
    if (entity === 'grade')
      return (await d.org.listGrades(tx)).find((row) => row.id === id);
    const employee = await d.employees.getById(id, tx);
    return employee
      ? {
          ...employee,
          departmentId:
            (await d.org.primaryDepartmentOf(employee.userId, tx))?.id ?? null,
        }
      : undefined;
  }
  async function mapped(
    tx: DatabaseConnection,
    source: string,
    entity: SyncItem['entity'],
    externalId: string | null | undefined,
  ) {
    if (!externalId) return null;
    const found = await tx
      .repository<Mapping>('hrSyncMappings')
      .findOne({ filter: { source, entity, externalId } });
    if (!found) syncError('DEPENDENCY_MISSING');
    return found.localId;
  }
  async function apply(
    tx: DatabaseConnection,
    input: BatchInput,
    item: SyncItem,
    access: SyncAccess,
  ) {
    if (
      (item.entity === 'department' && !access.departments) ||
      (item.entity === 'grade' && !access.grades)
    )
      syncError('ACCESS_DENIED');
    const repo = tx.repository<Mapping>('hrSyncMappings'),
      existing = await repo.findOne({
        filter: {
          source: input.source,
          entity: item.entity,
          externalId: item.externalId,
        },
      }),
      payloadHash = hash(item);
    if (existing) {
      if (Number(existing.revision) > item.revision)
        syncError('STALE_REVISION');
      if (Number(existing.revision) === item.revision) {
        if (existing.payloadHash !== payloadHash)
          syncError('REVISION_CONFLICT');
        return;
      }
      if (item.localId && item.localId !== existing.localId)
        syncError('MAPPING_CONFLICT');
    } else if (item.localId && !access.manage)
      syncError('BINDING_REQUIRES_MANAGER');
    const localId = existing?.localId ?? item.localId;
    if (localId && item.entity !== 'employee')
      await d.org.lockMasterDataRecord(item.entity, localId, tx);
    if (item.entity === 'employee') {
      if (existing?.fields.includes('departmentId') && !access.departments)
        syncError('ACCESS_DENIED');
      readFields(access.employees, [
        'id',
        ...(existing?.fields ?? []).filter((field) => field !== 'departmentId'),
      ]);
      if (
        localId &&
        !(await d.employees.masterDataSnapshot(localId, access.employees!, tx))
      )
        syncError('ACCESS_DENIED');
    }

    const before = localId ? await local(tx, item.entity, localId) : undefined;
    if (localId && !before) syncError('LOCAL_RECORD_MISSING');
    if (
      localId &&
      !existing &&
      (await repo.findOne({ filter: { entity: item.entity, localId } }))
    )
      syncError('MAPPING_CONFLICT');
    if (
      existing &&
      before &&
      hash(projection(before, existing.fields)) !== existing.localHash
    )
      syncError('LOCAL_CHANGE_CONFLICT');
    const context = {
      actorId: access.actorId,
      connection: tx,
      reason: `HR sync ${input.source}/${input.eventId}`,
    };
    let id = localId;
    let fields: string[];
    if (item.entity === 'department') {
      const { parentExternalId, ...data } = item.data;
      const values = {
        ...data,
        ...(parentExternalId !== undefined
          ? {
              parentId: await mapped(
                tx,
                input.source,
                'department',
                parentExternalId,
              ),
            }
          : {}),
      };
      fields = Object.keys(values);
      if (item.operation === 'deactivate') {
        if (!id) syncError('LOCAL_RECORD_MISSING');
        await d.org.setDepartmentActive(id, false, context);
        fields = ['active'];
      } else if (id) await d.org.updateDepartment(id, values, context);
      else id = (await d.org.createDepartment(values, context)).id;
    } else if (item.entity === 'grade') {
      fields = Object.keys(item.data);
      if (item.operation === 'deactivate') {
        if (!id) syncError('LOCAL_RECORD_MISSING');
        await d.org.setGradeActive(id, false, context);
        fields = ['active'];
      } else if (id) await d.org.updateGrade(id, item.data, context);
      else id = (await d.org.createGrade(item.data, context)).id;
    } else {
      const {
        userId,
        status,
        managerExternalId,
        departmentExternalId: _departmentExternalId,
        gradeExternalId,
        ...data
      } = item.data;
      const values = {
        ...data,
        ...(managerExternalId !== undefined
          ? {
              managerId: await mapped(
                tx,
                input.source,
                'employee',
                managerExternalId,
              ),
            }
          : {}),
        ...(gradeExternalId !== undefined
          ? {
              gradeId: await mapped(tx, input.source, 'grade', gradeExternalId),
            }
          : {}),
      };
      fields = Object.keys(values);
      readFields(access.employees, ['id', ...fields]);
      if (item.operation === 'deactivate') {
        if (!id || !before || !('status' in before))
          syncError('LOCAL_RECORD_MISSING');
        readFields(access.status, ['id', 'status', 'active']);
        await d.employees.correctStatus(
          id,
          { status: before.status, active: false, reason: context.reason },
          access.status!,
          access.actorId,
          { connection: tx },
        );
        fields = ['active'];
      } else if (id) {
        if (status && before && 'status' in before && status !== before.status)
          syncError('STATUS_CHANGE_REQUIRES_WORKFLOW');
        if (userId && 'userId' in before! && before.userId !== userId)
          syncError('MAPPING_CONFLICT');
        await d.employees.updateEmployee(
          id,
          values,
          access.employees!,
          access.actorId,
          context,
        );
      } else {
        if (!userId) syncError('USER_BINDING_REQUIRED');
        id = (
          await d.employees.createEmployee(
            { ...values, userId, status: status ?? 'regular' },
            access.employees!,
            access.actorId,
            context,
          )
        ).id;
      }
    }
    if (!id) syncError('LOCAL_RECORD_MISSING');
    if (
      item.entity === 'employee' &&
      item.data.departmentExternalId &&
      item.operation === 'upsert'
    ) {
      if (!access.departments) syncError('ACCESS_DENIED');
      const departmentId = await mapped(
        tx,
        input.source,
        'department',
        item.data.departmentExternalId,
      );
      const employee = await d.employees.getById(id, tx);
      if (!employee || !departmentId) syncError('DEPENDENCY_MISSING');
      await d.org.manageMember(
        { action: 'add', departmentId, userId: employee.userId, primary: true },
        context,
      );
      fields.push('departmentId');
    }
    const current = await local(tx, item.entity, id);
    if (!current) syncError('LOCAL_RECORD_MISSING');
    fields = [
      ...new Set([
        ...(existing?.fields ?? []).filter((field) => field !== 'departmentId'),
        ...fields,
      ]),
    ].sort();
    const values = {
      source: input.source,
      entity: item.entity,
      externalId: item.externalId,
      localId: id,
      revision: item.revision,
      payloadHash,
      fields,
      localHash: hash(projection(current, fields)),
      updatedAt: new Date(),
    };
    if (existing) await repo.updateOne({ filter: { id: existing.id }, values });
    else await repo.createOne({ values: { id: randomUUID(), ...values } });
  }
  async function run(input: BatchInput, access: SyncAccess) {
    const id = hash([input.source, input.eventId]),
      payloadHash = hash(input);
    await d.db.transaction(async (tx) => {
      const owner = await source(tx, input.source, access, true);
      if (!owner.active) syncError('SOURCE_DISABLED');
      const repo = tx.repository<Run>('hrSyncBatches'),
        previous = await repo.findOne({ filter: { id } });
      if (previous && previous.payloadHash !== payloadHash)
        syncError('EVENT_CONFLICT');
      if (!previous)
        await repo.createOne({
          values: {
            id,
            source: input.source,
            eventId: input.eventId,
            payloadHash,
            payload: input,
            state: 'pending',
            reasonCode: null,
            itemCount: input.items.length,
            actorId: access.actorId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
    });
    try {
      return await d.db.transaction(async (tx) => {
        const owner = await source(tx, input.source, access, true);
        if (!owner.active) syncError('SOURCE_DISABLED');
        const repo = tx.repository<Run>('hrSyncBatches'),
          previous = (await repo.findOne({ filter: { id } }))!;
        if (previous.state === 'completed') return summary(previous);
        const keys = new Set<string>();
        for (const item of input.items) {
          const key = JSON.stringify([item.entity, item.externalId]);
          if (keys.has(key)) syncError('DUPLICATE_ITEM');
          keys.add(key);
          await apply(tx, input, item, access);
        }
        await repo.updateOne({
          filter: { id },
          values: {
            state: 'completed',
            reasonCode: null,
            updatedAt: new Date(),
          },
        });
        await audit(tx, access, 'completed', id, {
          source: input.source,
          eventId: input.eventId,
          itemCount: input.items.length,
        });
        return summary((await repo.findOne({ filter: { id } }))!);
      });
    } catch (error) {
      const code =
        error instanceof ApiError ? error.reason : 'BUSINESS_CONFLICT';
      await d.db.transaction(async (tx) => {
        await source(tx, input.source, access, true);
        const repo = tx.repository<Run>('hrSyncBatches');
        const row = await repo.findOne({ filter: { id } });
        if (row?.state !== 'completed') {
          await repo.updateOne({
            filter: { id },
            values: {
              state: 'failed',
              reasonCode: code,
              updatedAt: new Date(),
            },
          });
          await audit(tx, access, 'failed', id, {
            source: input.source,
            eventId: input.eventId,
            reasonCode: code,
          });
        }
      });
      syncError(code);
    }
  }
  function summary(row: Run) {
    const { payload: _, payloadHash: __, ...safe } = row;
    return safe;
  }
  return {
    run,
    async sources(access: SyncAccess) {
      return root()
        .repository<SourceRow>('hrSyncSources')
        .findMany({
          filter: access.manage ? undefined : { principalId: access.actorId },
          limit: 100,
          sort: (s) => [s.field('id').asc()],
        });
    },
    async saveSource(value: Omit<SourceRow, 'updatedAt'>, access: SyncAccess) {
      if (!access.manage) syncError('ACCESS_DENIED');
      return d.db.transaction(async (tx) => {
        await tx.repository<SourceRow>('hrSyncSources').upsertOne({
          filter: { id: value.id },
          create: { ...value, updatedAt: new Date() },
          update: { ...value, updatedAt: new Date() },
        });
        await audit(tx, access, 'sourceSaved', value.id, {
          principalId: value.principalId,
          active: value.active,
        });
        return value;
      });
    },
    async batches(sourceId: string, access: SyncAccess) {
      await source(root(), sourceId, access);
      return (
        await root()
          .repository<Run>('hrSyncBatches')
          .findMany({
            filter: { source: sourceId },
            sort: (s) => [s.field('createdAt').desc()],
            limit: 50,
          })
      ).map(summary);
    },
    async replay(id: string, access: SyncAccess) {
      const row = await root()
        .repository<Run>('hrSyncBatches')
        .findOne({ filter: { id } });
      if (!row) syncError('ACCESS_DENIED');
      await source(root(), row.source, access);
      return run(row.payload, access);
    },
    async mappings(sourceId: string, access: SyncAccess, externalId?: string) {
      await source(root(), sourceId, access);
      return root()
        .repository<Mapping>('hrSyncMappings')
        .findMany({
          filter: { source: sourceId, ...(externalId ? { externalId } : {}) },
          limit: 100,
        });
    },
    async reclaim(id: string, reason: string, access: SyncAccess) {
      if (!access.manage) syncError('ACCESS_DENIED');
      return d.db.transaction(async (tx) => {
        const repo = tx.repository<Mapping>('hrSyncMappings'),
          mapping = await repo.findOne({ filter: { id } });
        if (!mapping) syncError('ACCESS_DENIED');
        await source(tx, mapping.source, access, true);
        if (
          (mapping.entity === 'department' && !access.departments) ||
          (mapping.entity === 'grade' && !access.grades)
        )
          syncError('ACCESS_DENIED');
        if (mapping.entity !== 'employee')
          await d.org.lockMasterDataRecord(mapping.entity, mapping.localId, tx);
        if (mapping.entity === 'employee') {
          readFields(access.employees, [
            'id',
            ...mapping.fields.filter((field) => field !== 'departmentId'),
          ]);
          if (mapping.fields.includes('departmentId') && !access.departments)
            syncError('ACCESS_DENIED');
          if (
            !(await d.employees.masterDataSnapshot(
              mapping.localId,
              access.employees!,
              tx,
            ))
          )
            syncError('ACCESS_DENIED');
        }
        const current = await local(tx, mapping.entity, mapping.localId);
        if (!current) syncError('LOCAL_RECORD_MISSING');
        await repo.updateOne({
          filter: { id },
          values: {
            localHash: hash(projection(current, mapping.fields)),
            updatedAt: new Date(),
          },
        });
        await audit(
          tx,
          access,
          'reclaim',
          id,
          {
            source: mapping.source,
            entity: mapping.entity,
            externalId: mapping.externalId,
          },
          reason,
        );
        return { id };
      });
    },
  };
}

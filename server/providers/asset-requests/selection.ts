import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { AssetService, Asset } from '../assets/contract.js';
import type { EmployeeService } from '../employees/contract.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type { AssetRequestService } from './contract.js';
import { AssetError } from '../assets/errors.js';
import { assertAssetRequestReadFields } from './list-query.js';
const fields = [
  'id',
  'code',
  'name',
  'category',
  'serialNumber',
  'status',
  'version',
] as const;
export interface AssetSelectionQuery {
  purpose: 'scrap' | 'issue' | 'receive';
  mode: 'task' | 'returnIssued';
  requestId?: string;
  targetId?: string;
  search: string;
  category?: string;
  page: number;
  pageSize: number;
}
const denied = (): never => {
  throw new AssetError(
    'ASSET_ACCESS_DENIED',
    'No current authorized asset operation permits this selection.',
    'permission',
  );
};
function requireWriteFields(
  policy: RepositoryPolicy,
  method: 'create' | 'update',
  names: readonly string[],
) {
  const rule = policy[method];
  if (rule === true) return;
  const allowed = rule && rule.fields;
  if (!Array.isArray(allowed) || names.some((name) => !allowed.includes(name)))
    return denied();
}
/** Advisory source selection only. Final stock effects revalidate the complete reserved batch in their transaction. */
export function createAssetSelectionService(d: {
  db: DatabaseManager;
  assets: AssetService;
  employees: EmployeeService;
  directory: ApprovalDirectoryService;
  requests: AssetRequestService;
}) {
  return {
    async list(
      actorId: string,
      query: AssetSelectionQuery,
      actionPolicy: RepositoryPolicy,
      viewPolicy?: RepositoryPolicy,
    ) {
      const tx = d.db.connection();
      const directory = await d.directory.snapshot(tx);
      if (!directory.isActive(actorId)) denied();
      const admin = directory.hasRole(actorId, 'admin');
      let ids: string[] | undefined;
      let employeeId: string | undefined;
      if (query.purpose === 'scrap') {
        assertAssetRequestReadFields(actionPolicy, ['assetIds', 'operation']);
        requireWriteFields(
          actionPolicy,
          query.requestId ? 'update' : 'create',
          ['assetIds', 'operation'],
        );
        const employee = await d.employees.getByUserId(actorId, tx);
        if (
          !employee?.active ||
          !['probation', 'regular'].includes(employee.status)
        )
          denied();
        employeeId = employee!.id;
        if (query.requestId) {
          if (!viewPolicy) denied();
          assertAssetRequestReadFields(viewPolicy!, ['applicantId', 'status']);
          const row = await d.requests.get(query.requestId, tx, viewPolicy);
          if (
            !row ||
            row.applicantId !== actorId ||
            !['draft', 'revision', 'exception'].includes(row.status ?? '')
          )
            denied();
          const write = actionPolicy.update;
          if (!write) return denied();
          const scoped = await d.requests.get(query.requestId, tx, {
            read:
              write === true ? true : { scope: write.scope, fields: ['id'] },
            create: false,
            update: false,
            delete: false,
          });
          if (!scoped) denied();
        } else if (!actionPolicy.create) denied();
      } else {
        if (!admin || !query.requestId || !viewPolicy) denied();
        assertAssetRequestReadFields(viewPolicy!, [
          'id',
          'status',
          'operation',
          'allocation',
        ]);
        const detail = await d.requests.detail(
          query.requestId!,
          actorId,
          viewPolicy!,
        );
        const row = detail.record;
        const actionRow = await d.requests.get(
          query.requestId!,
          tx,
          actionPolicy,
        );
        if (!actionRow) denied();
        if (query.mode === 'returnIssued') {
          if (
            query.purpose !== 'receive' ||
            row.status !== 'issued' ||
            row.operation !== 'use'
          )
            denied();
        } else {
          if (
            row.status !== (query.purpose === 'issue' ? 'issuing' : 'returning')
          )
            denied();
          const offer = detail.taskActions.find(
            (group) => group.task.id === query.targetId,
          );
          if (!offer?.actions.some((action) => action.name === 'complete'))
            denied();
          requireWriteFields(actionPolicy, 'update', [
            'handlingUnits',
            'handlingReason',
          ]);
          const write = actionPolicy.update;
          if (!write) return denied();
          if (
            !(await d.requests.get(query.requestId!, tx, {
              read:
                write === true ? true : { scope: write.scope, fields: ['id'] },
              create: false,
              update: false,
              delete: false,
            }))
          )
            denied();
        }
        if (!Array.isArray(row.allocation) || !row.allocation.length) denied();
        ids = row.allocation!.map((unit) => unit.id);
      }
      // These literal fields and contextual scopes are the public source-picker contract, not asset-management access.
      // Use the asset service's policy-bound read; neither valuation nor another holder's identity is loaded.
      const assetPolicy: RepositoryPolicy = {
        create: false,
        update: false,
        delete: false,
        read: {
          fields: [...fields],
          scope: (f) =>
            f.and([
              ids
                ? f.or(ids.map((id) => f.string('id').eq(id)))
                : f.or([
                    f.and([
                      f.string('holderEmployeeId').eq(employeeId!),
                      f.string('status').eq('assigned'),
                    ]),
                    ...(admin ? [f.string('status').eq('available')] : []),
                  ]),
              ...(query.category
                ? [f.string('category').eq(query.category)]
                : []),
            ]),
        },
      };
      const rows: Partial<Asset>[] = [];
      for (let page = 1; ; page++) {
        const batch = await d.assets.list(
          { page, pageSize: 100 },
          tx,
          assetPolicy,
        );
        const visible =
          query.purpose === 'scrap'
            ? new Set(
                await d.assets.unreservedIds(
                  batch.rows
                    .map((row) => row.id)
                    .filter((id): id is string => typeof id === 'string'),
                  tx,
                ),
              )
            : undefined;
        rows.push(
          ...batch.rows.filter(
            (row) =>
              !visible || (typeof row.id === 'string' && visible.has(row.id)),
          ),
        );
        if (page * 100 >= batch.total || !batch.rows.length) break;
      }
      const search = query.search.trim().toLocaleLowerCase();
      const selected = rows.filter(
        (row) =>
          !search ||
          [row.code, row.name, row.serialNumber].some(
            (value) =>
              typeof value === 'string' &&
              value.toLocaleLowerCase().includes(search),
          ),
      );
      selected.sort(
        (a, b) =>
          String(a.code).localeCompare(String(b.code)) ||
          String(a.id).localeCompare(String(b.id)),
      );
      return {
        data: selected.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        ),
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: selected.length,
        },
      };
    },
  };
}
export const assetSelectionServiceToken = createServiceToken<
  ReturnType<typeof createAssetSelectionService>
>('oa/asset-selection-service');

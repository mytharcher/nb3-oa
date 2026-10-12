import type { RepositoryPolicy } from '@nocobase/db';
import { AssetError } from '../assets/errors.js';
import type { AssetRequestRecord } from './contract.js';

export function assertAssetRequestReadFields(
  policy: RepositoryPolicy,
  fields: readonly string[],
) {
  const read = policy.read;
  const allowed = read !== true && read !== false ? read.fields : undefined;
  if (
    read !== true &&
    (!Array.isArray(allowed) ||
      fields.some((field) => !allowed.includes(field)))
  )
    throw new AssetError(
      'ASSET_ACCESS_DENIED',
      'The fields required for this operation are not readable.',
      'permission',
    );
}
export interface AssetRequestPageQuery {
  page: number;
  pageSize: number;
  search?: string;
  operation?: 'use' | 'borrow' | 'scrap';
  status?: string;
  sortBy: 'number' | 'quantity' | 'borrowDueDate' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}
/** Filter and sort the complete authorized projection before pagination; hidden fields never influence totals. */
export function assetRequestPage<T extends Partial<AssetRequestRecord>>(
  rows: readonly T[],
  query: AssetRequestPageQuery,
  policy: RepositoryPolicy,
) {
  assertAssetRequestReadFields(policy, [
    'id',
    query.sortBy,
    ...(query.search?.trim() ? ['number', 'purpose'] : []),
    ...(query.operation ? ['operation'] : []),
    ...(query.status ? ['status'] : []),
  ]);
  const search = query.search?.trim().toLocaleLowerCase() ?? '';
  const selected = rows.filter(
    (row) =>
      (!query.operation || row.operation === query.operation) &&
      (!query.status || row.status === query.status) &&
      (!search ||
        [row.number, row.purpose].some(
          (value) =>
            typeof value === 'string' &&
            value.toLocaleLowerCase().includes(search),
        )),
  );
  selected.sort((left, right) => {
    const a = left[query.sortBy],
      b = right[query.sortBy];
    const compared =
      typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a ?? '').localeCompare(String(b ?? ''));
    return (
      (query.sortOrder === 'desc' ? -compared : compared) ||
      String(left.id).localeCompare(String(right.id))
    );
  });
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
}

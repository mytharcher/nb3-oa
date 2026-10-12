import { ApiError } from '@nocobase/app-server/router';
const MAX_EXPORT_ROWS = 10_000;
export async function allRows<T>(
  load: (page: number) => Promise<{
    data: readonly T[];
    meta: { total: number };
  }>,
): Promise<readonly T[]> {
  const first = await load(1);
  if (first.meta.total > MAX_EXPORT_ROWS)
    throw new ApiError({
      status: 'FAILED_PRECONDITION',
      domain: 'reports',
      reason: 'EXPORT_LIMIT_EXCEEDED',
      message: `Reports with more than ${MAX_EXPORT_ROWS} rows cannot be exported.`,
    });
  if (
    first.data.length > first.meta.total ||
    (first.meta.total > 0 && first.data.length === 0)
  )
    throw new ApiError({
      status: 'FAILED_PRECONDITION',
      domain: 'reports',
      reason: 'SOURCE_CHANGED',
      message: 'The report source changed during export.',
    });
  const rows = [...first.data];
  for (let page = 2; rows.length < first.meta.total; page++) {
    const next = await load(page);
    if (
      next.meta.total !== first.meta.total ||
      next.data.length === 0 ||
      rows.length + next.data.length > first.meta.total ||
      page > Math.ceil(MAX_EXPORT_ROWS / 100)
    )
      throw new ApiError({
        status: 'FAILED_PRECONDITION',
        domain: 'reports',
        reason: 'SOURCE_CHANGED',
        message:
          'The report source changed during export. Reload and export again.',
      });
    rows.push(...next.data);
  }
  return rows;
}

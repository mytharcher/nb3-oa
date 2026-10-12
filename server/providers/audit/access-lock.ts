import type { DatabaseConnection } from '@nocobase/db';

/** All decorated public permission writes join this lock, including legacy HTTP and Users role changes. */
export async function lockAccessWrites(
  connection: DatabaseConnection,
): Promise<void> {
  const result = await connection.repository('accessWriteLock').updateMany({
    filter: { id: 'permissions' },
    values: { version: { increment: 0 } },
  });
  if (result.updatedCount !== 1)
    throw new Error('Access write lock is not initialized.');
}

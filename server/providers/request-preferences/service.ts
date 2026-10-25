import type { DatabaseConnection } from '@nocobase/db';
import type {
  EmployeeRequestKey,
  RequestPreferences,
} from '../../../shared/request-catalog.js';

type Row = RequestPreferences & { userId: string; updatedAt: Date };
const defaults = (): RequestPreferences => ({ favorites: null, recent: [] });

/** Account settings are self-service. The caller supplies only the authenticated
 * principal, never a client-selected user. No business access is granted here. */
export async function getRequestPreferences(
  db: DatabaseConnection,
  userId: string,
): Promise<RequestPreferences> {
  if (!userId) throw new Error('Authenticated user required');
  const row = await db
    .repository<Row>('requestPreferences')
    .findOne({ filter: { userId } });
  return row ? { favorites: row.favorites, recent: row.recent } : defaults();
}

export async function saveRequestPreferences(
  db: DatabaseConnection,
  userId: string,
  change:
    | { type: 'favorites' | 'migrate'; favorites: EmployeeRequestKey[] | null }
    | { type: 'recent'; key: EmployeeRequestKey },
): Promise<RequestPreferences> {
  if (!userId) throw new Error('Authenticated user required');
  return db.transaction(async (tx) => {
    const repository = tx.repository<Row>('requestPreferences');
    const updatedAt = new Date();
    // Unique principal key plus upsert serializes concurrent first visits and
    // obtains a write lock before read/modify/write of the recent list.
    await repository.upsertOne({
      filter: { userId },
      create: {
        userId,
        favorites: change.type === 'migrate' ? change.favorites : null,
        recent: [],
        updatedAt,
      },
      update: { updatedAt },
    });
    if (change.type === 'favorites') {
      await repository.updateOne({
        filter: { userId },
        values: { favorites: change.favorites, updatedAt },
      });
    } else if (change.type === 'recent') {
      const current = await getRequestPreferences(tx, userId);
      await repository.updateOne({
        filter: { userId },
        values: {
          recent: [
            change.key,
            ...current.recent.filter((key) => key !== change.key),
          ].slice(0, 6),
          updatedAt,
        },
      });
    }
    return getRequestPreferences(tx, userId);
  });
}

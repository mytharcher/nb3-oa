import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { MeetingRoom } from '../../providers/meeting-rooms/contract.js';

/** Optional display metadata never broadens booking visibility or room field access. */
export async function readBookingRoomNames(
  connection: DatabaseConnection,
  policy: RepositoryPolicy | undefined,
  roomIds: readonly string[],
): Promise<Map<string, string>> {
  const ids = [...new Set(roomIds)];
  const read = policy?.read;
  if (
    !ids.length ||
    !read ||
    (read !== true &&
      (!Array.isArray(read.fields) ||
        !read.fields.includes('id') ||
        !read.fields.includes('name')))
  )
    return new Map();
  const rows = await connection
    .repository<MeetingRoom>('meetingRooms')
    .withPolicy(policy)
    .findMany({
      filter: (filter) =>
        filter.or(ids.map((id) => filter.string('id').eq(id))),
    });
  return new Map(
    rows.flatMap((room) =>
      typeof room.id === 'string' &&
      ids.includes(room.id) &&
      typeof room.name === 'string'
        ? [[room.id, room.name] as const]
        : [],
    ),
  );
}

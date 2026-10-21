// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { readBookingRoomNames } from '../../../server/routes/meeting-rooms/list-room-names.js';

it('does not query names without room viewing or the name field grant', async () => {
  const repository = vi.fn();
  const connection = { repository } as unknown as DatabaseConnection;
  for (const policy of [
    undefined,
    { read: false },
    { read: { fields: ['id'] } },
  ] as (RepositoryPolicy | undefined)[]) {
    expect(
      (await readBookingRoomNames(connection, policy, ['room-1'])).get(
        'room-1',
      ) ?? null,
    ).toBeNull();
  }
  expect(repository).not.toHaveBeenCalled();
});

it('performs one policy-bound batch and omits inaccessible or unnamed rooms', async () => {
  const policy: RepositoryPolicy = {
    read: { fields: ['id', 'name'], scope: true },
  };
  const findMany = vi
    .fn()
    .mockResolvedValue([
      { id: 'room-1', name: 'Boardroom' },
      { id: 'room-2' },
      { id: 'unrequested', name: 'Private' },
    ]);
  const withPolicy = vi.fn().mockReturnValue({ findMany });
  const repository = vi.fn().mockReturnValue({ withPolicy });
  const names = await readBookingRoomNames(
    { repository } as unknown as DatabaseConnection,
    policy,
    ['room-1', 'room-2', 'room-1'],
  );
  expect(repository).toHaveBeenCalledWith('meetingRooms');
  expect(withPolicy).toHaveBeenCalledWith(policy);
  expect(findMany).toHaveBeenCalledTimes(1);
  expect([...names]).toEqual([['room-1', 'Boardroom']]);
  expect(names.get('room-2') ?? null).toBeNull();
});

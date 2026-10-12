import type { Asset, AssetClearanceService } from './contract.js';
export class AssetClearanceError extends Error {
  readonly code = 'ASSET_DEPARTURE_NOT_CLEARED';
  constructor() {
    super(
      'Assigned, borrowed or reserved assets must be returned before departure clearance.',
    );
    this.name = 'AssetClearanceError';
  }
}
/** Reads only actual asset facts in the caller's transaction; missing integrations never fabricate returns. */
export function createAssetClearanceService(): AssetClearanceService {
  return {
    async assertAllReturned(employeeId, connection) {
      const held = await connection.repository<Asset>('assets').findMany({
        filter: (f) =>
          f.and([
            f.string('holderEmployeeId').eq(employeeId),
            f.or([
              f.string('status').eq('assigned'),
              f.string('status').eq('borrowed'),
            ]),
          ]),
        select: (s) => s.fields('id'),
      });
      if (held.length) throw new AssetClearanceError();
      const reservations = await connection
        .repository<{ id: string; employeeId: string; state: string }>(
          'assetReservations',
        )
        .findMany({
          filter: { employeeId, state: 'pending' },
          select: (s) => s.fields('id'),
        });
      if (reservations.length) throw new AssetClearanceError();
    },
  };
}

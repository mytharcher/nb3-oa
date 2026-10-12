import type { DatabaseConnection } from '@nocobase/db';
import type { AssetRequestRecord } from './contract.js';
import { AssetError } from '../assets/errors.js';
export const MAX_ASSET_PHOTO_SIZE = 5 * 1024 * 1024;
export const ASSET_PHOTO_FIELDS = [
  'id',
  'filename',
  'ext',
  'mimeType',
  'size',
  'createdAt',
  'updatedAt',
] as const;
export async function validateAssetPhoto(file: File) {
  if (!file.size || file.size > MAX_ASSET_PHOTO_SIZE)
    throw new AssetError(
      'ASSET_PHOTO_SIZE',
      'Photos must be nonempty and at most 5 MiB.',
    );
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    ext = file.name.split('.').at(-1)?.toLowerCase();
  const ascii = (offset: number, value: string) =>
    [...value].every((char, i) => b[offset + i] === char.charCodeAt(0));
  const valid =
    (['jpg', 'jpeg'].includes(ext ?? '') &&
      file.type === 'image/jpeg' &&
      b[0] === 255 &&
      b[1] === 216 &&
      b[2] === 255) ||
    (ext === 'png' &&
      file.type === 'image/png' &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) ||
    (ext === 'webp' &&
      file.type === 'image/webp' &&
      ascii(0, 'RIFF') &&
      ascii(8, 'WEBP'));
  if (!valid)
    throw new AssetError(
      'ASSET_PHOTO_TYPE',
      'Only matching JPEG, PNG and WebP photos are accepted.',
    );
}
export async function assertAssetPhotos(
  record: AssetRequestRecord,
  tx: DatabaseConnection,
) {
  if (
    record.photos.length > 10 ||
    new Set(record.photos).size !== record.photos.length
  )
    throw new AssetError(
      'ASSET_PHOTO_INVALID',
      'Choose at most ten distinct photos.',
    );
  for (const id of record.photos) {
    const file = await tx
      .repository<{
        id: string;
        requestId: string;
        ownerId: string;
        size: number;
        mimeType: string;
      }>('assetRequestPhotos')
      .findOne({ filter: { id, requestId: record.id } });
    if (
      !file ||
      file.ownerId !== record.applicantId ||
      !Number.isSafeInteger(Number(file.size)) ||
      Number(file.size) <= 0 ||
      Number(file.size) > MAX_ASSET_PHOTO_SIZE ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType)
    )
      throw new AssetError(
        'ASSET_PHOTO_INVALID',
        'A photo is not valid evidence linked to this request.',
      );
  }
}

import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryPolicy } from '@nocobase/db';
import type { AssetRequestService } from './contract.js';
export interface AssetPhotoAccess {
  id: string;
  applicantId: string;
  status: string;
  lifecycleVersion: number;
  photos: string[];
}
export interface AssetPhotoService {
  authorize(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
    upload: boolean,
  ): Promise<AssetPhotoAccess>;
}
export const assetPhotoServiceToken = createServiceToken<AssetPhotoService>(
  'oa/asset-request-photos',
);
export function createAssetPhotoService(
  service: Pick<AssetRequestService, 'get'>,
): AssetPhotoService {
  return {
    async authorize(id, actorId, policy, upload) {
      const row = await service.get(id, undefined, policy);
      if (
        !row ||
        row.id !== id ||
        typeof row.applicantId !== 'string' ||
        typeof row.status !== 'string' ||
        !Number.isSafeInteger(row.lifecycleVersion) ||
        !Array.isArray(row.photos)
      )
        throw new AssetError(
          'ASSET_PHOTO_DENIED',
          'The record or its photo field is not accessible.',
          'permission',
        );
      if (
        upload &&
        (row.applicantId !== actorId ||
          !['draft', 'revision', 'exception'].includes(row.status))
      )
        throw new AssetError(
          'ASSET_PHOTO_DENIED',
          'Photos can be uploaded only to your editable request.',
          'permission',
        );
      return {
        id,
        applicantId: row.applicantId,
        status: row.status,
        lifecycleVersion: row.lifecycleVersion!,
        photos: row.photos,
      };
    },
  };
}

import { createHash } from 'node:crypto';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { SealDependencies } from './service.js';
import type { SealRequest, SealRequestService } from './contract.js';
import { digest } from './ledger.js';
import { fail } from './errors.js';
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};
const MAX = 20 * 1024 * 1024;
interface StoredFile {
  id: string;
  ownerId: string;
  requestId: string;
  uploadKey: string;
  payloadHash: string;
  disk: string;
  key: string;
  filename: string;
  ext: string;
  mimeType: string;
  size: number | string;
}
export function createSealAttachments(
  d: SealDependencies & {
    read: (
      id: string,
      tx: DatabaseConnection,
      policy: RepositoryPolicy,
    ) => Promise<SealRequest>;
    raw: (id: string, tx: DatabaseConnection) => Promise<SealRequest>;
    employee: (actorId: string, tx: DatabaseConnection) => Promise<unknown>;
  },
) {
  async function editable(
    actorId: string,
    id: string,
    policy: RepositoryPolicy,
  ) {
    return d.db.transaction(async (tx) => {
      await d.employee(actorId, tx);
      const record = await d.read(id, tx, policy);
      if (
        record.applicantId !== actorId ||
        !['draft', 'revision', 'exception'].includes(record.status)
      )
        fail('ACCESS_DENIED');
      const check = await tx
        .repository('sealRequests')
        .withPolicy(policy)
        .validateMutation({
          operation: 'updateOne',
          filter: { id },
          values: { fileIds: record.fileIds },
        });
      if (!check.valid) fail('ACCESS_DENIED');
      return record;
    });
  }
  const upload: SealRequestService['upload'] = async (
    actorId,
    requestId,
    file,
    requestKey,
    policy,
  ) => {
    await editable(actorId, requestId, policy);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (
      !requestKey ||
      requestKey.length > 128 ||
      !TYPES[ext] ||
      !file.size ||
      file.size > MAX ||
      (file.type && file.type !== TYPES[ext])
    )
      fail('INVALID_FILE');
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > MAX) fail('INVALID_FILE');
    const valid =
      ext === 'pdf'
        ? bytes.subarray(0, 5).toString() === '%PDF-'
        : ['docx', 'xlsx'].includes(ext)
          ? bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))
          : ext === 'png'
            ? bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : bytes[0] === 255 && bytes[1] === 216;
    if (!valid) fail('INVALID_FILE');
    const uploadKey = digest([actorId, requestKey]),
      payloadHash = digest([
        requestId,
        file.name,
        createHash('sha256').update(bytes).digest('hex'),
      ]);
    const old = await d.db
      .repository<StoredFile>('sealFiles')
      .findOne({ filter: { uploadKey } });
    if (old) {
      if (
        old.ownerId !== actorId ||
        old.requestId !== requestId ||
        old.payloadHash !== payloadHash
      )
        fail('COMMAND_CONFLICT');
      return {
        id: old.id,
        filename: old.filename,
        ext: old.ext,
        mimeType: old.mimeType,
        size: Number(old.size),
      };
    }
    const uploaded = await d.files
      .repository('sealFiles', {
        disk: 'local',
        accessPath: '/private/seals',
        policy: {
          read: true,
          create: {
            scope: { ownerId: actorId, requestId, uploadKey, payloadHash },
            defaults: { ownerId: actorId, requestId, uploadKey, payloadHash },
          },
          update: false,
          delete: false,
        },
      })
      .uploadOne({ file: new File([bytes], file.name, { type: TYPES[ext] }) });
    const row = uploaded.record;
    return {
      id: row.id,
      filename: row.filename,
      ext: row.ext,
      mimeType: row.mimeType,
      size: Number(row.size),
    };
  };
  const content: SealRequestService['content'] = async (
    _actorId,
    requestId,
    fileId,
    policy,
  ) =>
    d.db.transaction(async (tx) => {
      const record = await d.read(requestId, tx, policy);
      if (!record.fileIds.includes(fileId)) fail('INVALID_FILE');
      const file = await tx
        .repository<StoredFile>('sealFiles')
        .findOne({ filter: { id: fileId, requestId } });
      if (!file || !TYPES[file.ext]) fail('INVALID_FILE');
      const stream = await d.drive.use(file.disk).getStream(file.key);
      const chunks: Buffer[] = [];
      let size = 0;
      try {
        for await (const chunk of stream) {
          const bytes = Buffer.from(chunk as Uint8Array);
          size += bytes.length;
          if (size > MAX) fail('INVALID_FILE');
          chunks.push(bytes);
        }
      } finally {
        stream.destroy();
      }
      return {
        bytes: Buffer.concat(chunks),
        filename: file.filename,
        mimeType: TYPES[file.ext],
      };
    });
  return {
    upload,
    content,
    files: ((_actorId, requestId, policy) =>
      d.db.transaction(async (tx) => {
        const record = await d.read(requestId, tx, policy);
        const files = [];
        for (const id of record.fileIds) {
          const file = await tx
            .repository<StoredFile>('sealFiles')
            .findOne({ filter: { id, requestId } });
          if (!file || !TYPES[file.ext]) fail('INVALID_FILE');
          files.push({
            id: file.id,
            filename: file.filename,
            ext: file.ext,
            mimeType: TYPES[file.ext],
            size: Number(file.size),
          });
        }
        return files;
      })) satisfies SealRequestService['files'],
    async validate(record: SealRequest, tx: DatabaseConnection) {
      for (const id of record.fileIds) {
        const file = await tx.repository<StoredFile>('sealFiles').findOne({
          filter: { id, requestId: record.id, ownerId: record.applicantId },
        });
        if (!file || !TYPES[file.ext]) fail('INVALID_FILE');
      }
    },
  };
}

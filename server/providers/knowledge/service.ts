import { demoNow } from '../demo-data/context.js';
import { randomUUID, createHash } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import type { ServerFileRepositoryManager } from '@nocobase/app-plugin-file/server';
import type { NocoBaseDriveManager } from '@nocobase/drive';
import type { AuditService } from '../audit/index.js';
import type { EmployeeService } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import {
  KNOWLEDGE_DOCUMENT_FIELDS,
  type KnowledgeDocument,
  type KnowledgeFolder,
  type KnowledgeService,
  type KnowledgeVersion,
  type KnowledgeSnapshot,
} from './contract.js';
export class KnowledgeError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
function fail(code: string): never {
  throw new KnowledgeError(code);
}
const MAX_BYTES = 20 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  md: 'text/markdown',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};
interface StoredFile {
  id: string;
  ownerId: string;
  disk: string;
  key: string;
  filename: string;
  mimeType: string;
  ext: string;
  size: number;
  uploadKey: string;
  payloadHash: string;
}
export function createKnowledgeService(d: {
  db: DatabaseManager;
  audit: AuditService;
  org: OrgService;
  employees: EmployeeService;
  files: ServerFileRepositoryManager;
  drive: NocoBaseDriveManager;
  notices?: {
    enqueue(
      documentId: string,
      versionId: string,
      actorId: string,
      tx: DatabaseConnection,
    ): Promise<void>;
  };
}): KnowledgeService {
  async function complete(
    id: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeDocument> {
    const row = await tx
      .repository<KnowledgeDocument>('knowledgeDocuments')
      .withPolicy(policy)
      .findOne({ filter: { id } });
    if (!row) fail('DOCUMENT_NOT_FOUND');
    if (KNOWLEDGE_DOCUMENT_FIELDS.some((k) => !(k in row)))
      fail('ACCESS_DENIED');
    return row as KnowledgeDocument;
  }
  async function readable(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ) {
    const row = await complete(id, tx, policy);
    if (!(await service.visible(actorId, row, tx))) fail('ACCESS_DENIED');
    return row;
  }
  async function mutation(
    tx: DatabaseConnection,
    collection: string,
    policy: RepositoryPolicy,
    values: Record<string, unknown>,
    id?: string,
  ) {
    const repo = tx.repository(collection).withPolicy(policy);
    const checked = await repo.validateMutation(
      id
        ? {
            operation: 'updateOne',
            filter: { id },
            values: values as RepositoryRecord,
          }
        : { operation: 'createOne', values: values as RepositoryRecord },
    );
    if (!checked.valid) fail('ACCESS_DENIED');
  }
  async function treeLock(tx: DatabaseConnection) {
    // A pre-existing singleton serializes parent changes and document placement across processes.
    const result = await tx.repository('knowledgeTreeLock').updateMany({
      filter: { id: 'tree' },
      values: { version: { increment: 0 } },
    });
    if (result.updatedCount !== 1) fail('TREE_UNINITIALIZED');
  }
  async function folderExists(id: string | null, tx: DatabaseConnection) {
    if (
      id &&
      !(await tx.repository('knowledgeFolders').exists({ filter: { id } }))
    )
      fail('FOLDER_NOT_FOUND');
  }
  async function snapshot(
    documentId: string,
    actorId: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<KnowledgeSnapshot> {
    const row = await readable(documentId, actorId, tx, policy);
    return {
      documentId: row.id,
      title: row.title,
      versionId: row.latestVersionId,
      version: row.version,
    };
  }
  const fingerprint = (value: unknown) =>
    createHash('sha256')
      .update(
        JSON.stringify(value, (_k, v: unknown) =>
          v && typeof v === 'object' && !Array.isArray(v)
            ? Object.fromEntries(
                Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
              )
            : v,
        ),
      )
      .digest('hex');
  async function prior(
    input: { actorId: string; requestKey: string },
    kind: string,
    tx: DatabaseConnection,
  ) {
    if (!input.requestKey || input.requestKey.length > 128)
      fail('INVALID_INPUT');
    const id = fingerprint([input.actorId, input.requestKey]);
    const payloadHash = fingerprint({ kind, input });
    const old = await tx
      .repository<{
        id: string;
        actorId: string;
        payloadHash: string;
        result: unknown;
      }>('knowledgeCommands')
      .findOne({ filter: { id } });
    if (
      old &&
      (old.actorId !== input.actorId || old.payloadHash !== payloadHash)
    )
      fail('COMMAND_CONFLICT');
    return { id, payloadHash, old };
  }
  const service: KnowledgeService = {
    async visible(actorId, row, tx) {
      const employee = await d.employees.getByUserId(actorId, tx);
      if (!row.active || !employee?.active || employee.status === 'left')
        return false;
      if (!row.departmentIds.length && !row.dutyRoleCodes.length) return true;
      const department = await d.org.primaryDepartmentOf(actorId, tx);
      if (department) {
        const chain = await d.org.activeChain(department.id, tx);
        if (chain?.some((p) => row.departmentIds.includes(p.id))) return true;
      }
      for (const code of row.dutyRoleCodes)
        if (await d.org.hasDutyRole(actorId, code, tx)) return true;
      return false;
    },
    async list(actorId, tx, policy) {
      const rows = await tx
        .repository<KnowledgeDocument>('knowledgeDocuments')
        .withPolicy(policy)
        .findMany({ sort: (s) => s.field('updatedAt').desc() });
      const result: KnowledgeDocument[] = [];
      for (const row of rows) {
        if (KNOWLEDGE_DOCUMENT_FIELDS.some((k) => !(k in row)))
          fail('ACCESS_DENIED');
        if (await service.visible(actorId, row as KnowledgeDocument, tx))
          result.push(row as KnowledgeDocument);
      }
      return result;
    },
    async listPage(actorId, tx, policy, query) {
      // Business audience visibility includes inherited departments and duty roles.
      // Filter through the owner contract before pagination/counting; pre-limiting
      // repository rows would produce incorrect totals or expose hidden membership.
      const visible = await service.list(actorId, tx, policy);
      const q = query.q?.trim().toLocaleLowerCase();
      const rows = visible.filter(
        (row) =>
          (!q || row.title.toLocaleLowerCase().includes(q)) &&
          (query.folderId === undefined || row.folderId === query.folderId),
      );
      const [field, direction] = (query.orderBy ?? 'updatedAt:desc').split(':');
      rows.sort((a, b) => {
        const left =
          field === 'title'
            ? a.title
            : field === 'version'
              ? a.version
              : new Date(a.updatedAt).getTime();
        const right =
          field === 'title'
            ? b.title
            : field === 'version'
              ? b.version
              : new Date(b.updatedAt).getTime();
        const compare = left < right ? -1 : left > right ? 1 : 0;
        return (
          (direction === 'asc' ? compare : -compare) ||
          (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
        );
      });
      const start = (query.page - 1) * query.pageSize;
      return {
        items: rows.slice(start, start + query.pageSize),
        total: rows.length,
      };
    },
    async versionFile(
      documentId,
      versionId,
      actorId,
      tx,
      policy,
      versionPolicy,
    ) {
      await readable(documentId, actorId, tx, policy);
      const version = await tx
        .repository<KnowledgeVersion>('knowledgeVersions')
        .withPolicy(versionPolicy)
        .findOne({ filter: { id: versionId, documentId } });
      if (
        version &&
        ['id', 'documentId', 'kind', 'fileId'].some(
          (field) => !(field in version),
        )
      )
        fail('ACCESS_DENIED');
      if (!version || version.kind !== 'file' || !version.fileId)
        fail('INVALID_FILE');
      const identity = version.id;
      if (typeof identity !== 'string') fail('ACCESS_DENIED');
      const file = await tx
        .repository<StoredFile>('knowledgeFiles')
        .findOne({ filter: { id: version.fileId } });
      if (
        !file ||
        !TYPES[file.ext] ||
        !Number.isSafeInteger(Number(file.size)) ||
        Number(file.size) <= 0 ||
        Number(file.size) > MAX_BYTES
      )
        fail('INVALID_FILE');
      return {
        id: identity,
        filename: file.filename,
        ext: file.ext,
        mimeType: file.mimeType,
        size: Number(file.size),
      };
    },
    async detail(id, actorId, tx, policy, versionPolicy) {
      const document = await readable(id, actorId, tx, policy);
      const versions = await tx
        .repository<KnowledgeVersion>('knowledgeVersions')
        .withPolicy(versionPolicy)
        .findMany({
          filter: { documentId: id },
          sort: (s) => s.field('version').desc(),
        });
      if (
        versions.some((v) =>
          [
            'id',
            'documentId',
            'version',
            'kind',
            'markdown',
            'fileId',
            'authorId',
            'createdAt',
          ].some((k) => !(k in v)),
        )
      )
        fail('ACCESS_DENIED');
      return { document, versions: versions as KnowledgeVersion[] };
    },
    async save(input, tx, policy, versionPolicy, folderPolicy) {
      if (
        !input.title.trim() ||
        input.title.length > 200 ||
        new Set(input.departmentIds).size !== input.departmentIds.length ||
        new Set(input.dutyRoleCodes).size !== input.dutyRoleCodes.length
      )
        fail('INVALID_INPUT');
      await treeLock(tx);
      const command = await prior(input, 'publish', tx);
      if (command.old) {
        await complete(
          (command.old.result as KnowledgeDocument).id,
          tx,
          policy,
        );
        const result = command.old.result as KnowledgeDocument;
        await mutation(
          tx,
          'knowledgeDocuments',
          policy,
          result as unknown as Record<string, unknown>,
          input.id,
        );
        await mutation(tx, 'knowledgeVersions', versionPolicy, {
          id: result.latestVersionId,
          documentId: result.id,
          version: result.version,
          kind: input.kind,
          markdown: input.markdown ?? null,
          fileId: input.fileId ?? null,
          authorId: input.actorId,
          createdAt: result.updatedAt,
        });
        return result;
      }
      await folderExists(input.folderId, tx);
      if (
        input.folderId &&
        !(await tx
          .repository('knowledgeFolders')
          .withPolicy(folderPolicy)
          .exists({ filter: { id: input.folderId } }))
      )
        fail('ACCESS_DENIED');
      for (const id of input.departmentIds)
        if (!(await d.org.activeChain(id, tx))) fail('INVALID_AUDIENCE');
      for (const code of input.dutyRoleCodes)
        if (
          !(await tx
            .repository('dutyRoles')
            .exists({ filter: { code, active: true } }))
        )
          fail('INVALID_AUDIENCE');
      const id = input.id ?? randomUUID();
      let old: KnowledgeDocument | undefined;
      if (input.id) {
        await complete(id, tx, policy);
        old = await complete(id, tx, policy);
        if (old.version !== input.expectedVersion) fail('VERSION_CONFLICT');
      }
      const version = (old?.version ?? 0) + 1,
        versionId = randomUUID();
      let fileId: string | null = null,
        markdown: string | null = null;
      if (input.kind === 'markdown') {
        if (
          input.markdown === undefined ||
          Buffer.byteLength(input.markdown) > MAX_BYTES ||
          input.fileId
        )
          fail('INVALID_CONTENT');
        markdown = input.markdown;
      } else {
        if (!input.fileId || input.markdown !== undefined)
          fail('INVALID_CONTENT');
        const file = await tx
          .repository<StoredFile>('knowledgeFiles')
          .findOne({ filter: { id: input.fileId, ownerId: input.actorId } });
        if (
          !file ||
          (await tx
            .repository('knowledgeVersions')
            .exists({ filter: { fileId: file.id } }))
        )
          fail('INVALID_FILE');
        fileId = file.id;
      }
      const values = {
        id,
        folderId: input.folderId,
        title: input.title.trim(),
        ownerId: old?.ownerId ?? input.actorId,
        latestVersionId: versionId,
        version,
        active: true,
        departmentIds: input.departmentIds,
        dutyRoleCodes: input.dutyRoleCodes,
        updatedAt: demoNow(),
      };
      await mutation(tx, 'knowledgeDocuments', policy, values, input.id);
      await tx
        .repository('knowledgeVersions')
        .withPolicy(versionPolicy)
        .createOne({
          values: {
            id: versionId,
            documentId: id,
            version,
            kind: input.kind,
            markdown,
            fileId,
            authorId: input.actorId,
            createdAt: demoNow(),
          },
        });
      const document = (
        old
          ? await tx
              .repository<KnowledgeDocument>('knowledgeDocuments')
              .withPolicy(policy)
              .updateOne({ filter: { id, version: old.version }, values })
          : await tx
              .repository<KnowledgeDocument>('knowledgeDocuments')
              .withPolicy(policy)
              .createOne({ values })
      ).record;
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'knowledge.publish',
          targetType: 'knowledgeDocuments',
          targetId: id,
          after: { title: values.title, version, versionId },
        },
        tx,
      );
      await tx.repository('knowledgeCommands').createOne({
        values: {
          id: command.id,
          actorId: input.actorId,
          payloadHash: command.payloadHash,
          result: document,
        },
      });
      // Initial publication has no existing linked policy notice. Updates enqueue
      // atomically; effects run only after commit and never fail the HTTP write.
      if (old) await d.notices?.enqueue(id, versionId, input.actorId, tx);
      return document as KnowledgeDocument;
    },
    async folders(tx, policy) {
      const rows = await tx
        .repository<KnowledgeFolder>('knowledgeFolders')
        .withPolicy(policy)
        .findMany({ sort: (s) => s.field('title').asc() });
      if (
        rows.some((r) =>
          ['id', 'parentId', 'title', 'version'].some((k) => !(k in r)),
        )
      )
        fail('ACCESS_DENIED');
      return rows as KnowledgeFolder[];
    },
    async saveFolder(input, tx, policy) {
      if (!input.title.trim() || input.title.length > 200)
        fail('INVALID_INPUT');
      await treeLock(tx);
      const command = await prior(input, 'folder', tx);
      if (command.old) {
        if (
          !(await tx
            .repository('knowledgeFolders')
            .withPolicy(policy)
            .exists({
              filter: { id: (command.old.result as KnowledgeFolder).id },
            }))
        )
          fail('ACCESS_DENIED');
        await mutation(
          tx,
          'knowledgeFolders',
          policy,
          command.old.result as Record<string, unknown>,
          input.id,
        );
        return command.old.result as KnowledgeFolder;
      }
      await folderExists(input.parentId, tx);
      if (
        input.parentId &&
        !(await tx
          .repository('knowledgeFolders')
          .withPolicy(policy)
          .exists({ filter: { id: input.parentId } }))
      )
        fail('ACCESS_DENIED');
      const id = input.id ?? randomUUID();
      let old: KnowledgeFolder | undefined;
      if (input.id) {
        const found = await tx
          .repository<KnowledgeFolder>('knowledgeFolders')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (
          found &&
          ['id', 'parentId', 'title', 'version'].some((k) => !(k in found))
        )
          fail('ACCESS_DENIED');
        old = found as KnowledgeFolder | undefined;
        if (!old) fail('FOLDER_NOT_FOUND');
        if (old.version !== input.expectedVersion) fail('VERSION_CONFLICT');
      }
      let parent = input.parentId;
      const visited = new Set<string>();
      while (parent) {
        if (parent === id || visited.has(parent)) fail('FOLDER_CYCLE');
        visited.add(parent);
        parent =
          (
            await tx
              .repository<KnowledgeFolder>('knowledgeFolders')
              .findOne({ filter: { id: parent } })
          )?.parentId ?? null;
      }
      const values = {
        id,
        parentId: input.parentId,
        title: input.title.trim(),
        version: (old?.version ?? 0) + 1,
      };
      await mutation(tx, 'knowledgeFolders', policy, values, input.id);
      const row = (
        old
          ? await tx
              .repository<KnowledgeFolder>('knowledgeFolders')
              .withPolicy(policy)
              .updateOne({ filter: { id, version: old.version }, values })
          : await tx
              .repository<KnowledgeFolder>('knowledgeFolders')
              .withPolicy(policy)
              .createOne({ values })
      ).record;
      await d.audit.record(
        {
          actorId: input.actorId,
          action: 'knowledge.folder.save',
          targetType: 'knowledgeFolders',
          targetId: id,
          after: values,
        },
        tx,
      );
      await tx.repository('knowledgeCommands').createOne({
        values: {
          id: command.id,
          actorId: input.actorId,
          payloadHash: command.payloadHash,
          result: row,
        },
      });
      return row as KnowledgeFolder;
    },
    async upload(actorId, file, requestKey) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (
        !TYPES[ext] ||
        file.size === 0 ||
        file.size > MAX_BYTES ||
        (file.type &&
          file.type !== TYPES[ext] &&
          !(ext === 'md' && file.type === 'text/plain'))
      )
        fail('INVALID_FILE');
      if (!requestKey || requestKey.length > 128) fail('INVALID_INPUT');
      const bytes = Buffer.from(await file.arrayBuffer());
      const uploadKey = fingerprint([actorId, requestKey]),
        payloadHash = fingerprint([
          file.name,
          createHash('sha256').update(bytes).digest('hex'),
        ]);
      const old = await d.db
        .repository<StoredFile>('knowledgeFiles')
        .findOne({ filter: { uploadKey } });
      if (old) {
        if (old.payloadHash !== payloadHash) fail('COMMAND_CONFLICT');
        return {
          id: old.id,
          filename: old.filename,
          ext: old.ext,
          mimeType: old.mimeType,
          size: Number(old.size),
        };
      }
      const signature =
        ext === 'pdf'
          ? bytes.subarray(0, 5).toString() === '%PDF-'
          : ['docx', 'xlsx', 'pptx'].includes(ext)
            ? bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))
            : ext === 'png'
              ? bytes
                  .subarray(0, 8)
                  .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
              : ['jpg', 'jpeg'].includes(ext)
                ? bytes[0] === 255 && bytes[1] === 216
                : ext === 'webp'
                  ? bytes.subarray(0, 4).toString() === 'RIFF' &&
                    bytes.subarray(8, 12).toString() === 'WEBP'
                  : !bytes.includes(0);
      if (!signature) fail('INVALID_FILE');
      const uploaded = await d.files
        .repository('knowledgeFiles', {
          disk: 'local',
          accessPath: '/private/knowledge',
          policy: {
            read: true,
            create: {
              scope: { ownerId: actorId, uploadKey, payloadHash },
              defaults: { ownerId: actorId, uploadKey, payloadHash },
            },
            update: false,
            delete: false,
          },
        })
        .uploadOne({
          file: new File([bytes], file.name, { type: TYPES[ext] }),
        });
      const r = uploaded.record;
      return {
        id: r.id,
        filename: r.filename,
        ext: r.ext,
        mimeType: r.mimeType,
        size: Number(r.size),
      };
    },
    async content(documentId, versionId, actorId, tx, policy, versionPolicy) {
      await readable(documentId, actorId, tx, policy);
      const version = await tx
        .repository<KnowledgeVersion>('knowledgeVersions')
        .withPolicy(versionPolicy)
        .findOne({ filter: { id: versionId, documentId } });
      if (
        version &&
        ['id', 'documentId', 'fileId'].some((k) => !(k in version))
      )
        fail('ACCESS_DENIED');
      if (!version?.fileId) fail('INVALID_FILE');
      const file = await tx
        .repository<StoredFile>('knowledgeFiles')
        .findOne({ filter: { id: version.fileId } });
      if (!file || !TYPES[file.ext]) fail('INVALID_FILE');
      const stream = await d.drive.use(file.disk).getStream(file.key);
      const chunks: Buffer[] = [];
      let size = 0;
      try {
        for await (const chunk of stream) {
          const b = Buffer.from(chunk as Uint8Array);
          size += b.length;
          if (size > MAX_BYTES) fail('INVALID_FILE');
          chunks.push(b);
        }
      } finally {
        stream.destroy();
      }
      return {
        bytes: Buffer.concat(chunks),
        filename: file.filename,
        mimeType: TYPES[file.ext],
      };
    },
    snapshotForAnnouncement: ({ documentId, actorId }, tx, policy) =>
      snapshot(documentId, actorId, tx, policy),
    async compareAnnouncementVersion(
      { documentId, versionId, actorId },
      tx,
      policy,
    ) {
      try {
        const latest = await snapshot(documentId, actorId, tx, policy);
        return {
          visible: true,
          hasNewVersion: latest.versionId !== versionId,
          latest,
        };
      } catch (error) {
        if (
          error instanceof KnowledgeError &&
          (error.code === 'ACCESS_DENIED' ||
            error.code === 'DOCUMENT_NOT_FOUND')
        )
          return { visible: false, hasNewVersion: false };
        throw error;
      }
    },
  };
  return service;
}

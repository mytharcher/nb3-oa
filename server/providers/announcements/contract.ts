import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export interface Audience {
  all: boolean;
  departmentIds: string[];
  dutyRoleCodes: string[];
}
export interface Announcement {
  id: string;
  publisherUserId: string;
  title: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published' | 'revoked';
  audience: Audience;
  requiresConfirmation: boolean;
  pinned: boolean;
  attachments: string[];
  knowledgeLink: {
    documentId: string;
    versionId: string;
    version: number;
    title: string;
  } | null;
  validFrom: Date;
  validUntil: Date;
  publishedAt: Date | null;
  version: number;
}
export interface Receipt {
  id: string;
  announcementId: string;
  userId: string;
  employeeId: string;
  name: string;
  status: 'pending' | 'confirmed';
  confirmedAt: Date | null;
  version: number;
}
export const RECEIPT_FIELDS = [
  'id',
  'announcementId',
  'userId',
  'employeeId',
  'name',
  'status',
  'confirmedAt',
  'version',
] as const;
export interface Command {
  actorId: string;
  requestId: string;
}
export interface DraftInput extends Command {
  id?: string;
  expectedVersion?: number;
  title: string;
  body: string;
  audience: Audience;
  requiresConfirmation: boolean;
  pinned: boolean;
  attachments: string[];
  validFrom: string;
  validUntil: string;
  knowledgeDocumentId?: string | null;
}
export interface ActionInput extends Command {
  id: string;
  expectedVersion: number;
  action: 'publish' | 'revoke' | 'remind';
}
export const ANNOUNCEMENT_FIELDS = [
  'id',
  'publisherUserId',
  'title',
  'body',
  'status',
  'audience',
  'requiresConfirmation',
  'pinned',
  'attachments',
  'knowledgeLink',
  'validFrom',
  'validUntil',
  'publishedAt',
  'version',
] as const;
export interface AnnouncementService {
  /** Own active pending receipts only, with current ordinary view and confirm record scope. */
  listForCenter(
    actorId: string,
    tx: DatabaseConnection,
    policies: {
      view: RepositoryPolicy;
      confirm: RepositoryPolicy;
    },
  ): Promise<
    {
      id: string;
      initiatorId: string;
      title: string;
      status: 'pending';
      dueAt: string;
      createdAt: string | null;
    }[]
  >;
  /** Internal owner facade: freeze published policy-notice receipt identities. */
  linkedVersionAudience(
    documentId: string,
    tx: DatabaseConnection,
  ): Promise<{ announcementId: string; userIds: string[] }[]>;
  /** Current ordinary view, active employee, valid publication and exact linkage. */
  versionNoticeEligible(
    input: { announcementId: string; documentId: string; actorId: string },
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<boolean>;
  save(
    input: DraftInput,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
    knowledgePolicy?: RepositoryPolicy,
  ): Promise<Announcement>;
  act(
    input: ActionInput,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
    knowledgePolicy?: RepositoryPolicy,
  ): Promise<Announcement>;
  confirm(
    input: Command & { id: string },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Receipt>;
  get(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Announcement | undefined>;
  ownReceipt(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<Receipt | null>;
  receipts(
    id: string,
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
    receiptPolicy?: RepositoryPolicy,
  ): Promise<Receipt[]>;
  pending(
    actorId: string,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<{
    items: { id: string; announcementId: string; title: string; dueAt: Date }[];
    count: number;
  }>;
}
export const announcementServiceToken = createServiceToken<AnnouncementService>(
  'oa/announcement-service',
);

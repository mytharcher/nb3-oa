export const resource = { type: 'composite' as const, id: 'oa.announcements' };
export interface Announcement {
  id: string;
  title: string;
  body: string;
  publisher: { id: string; name: string };
  status: 'draft' | 'scheduled' | 'published' | 'revoked';
  audience: { all: boolean; departmentIds: string[]; dutyRoleCodes: string[] };
  requiresConfirmation: boolean;
  pinned: boolean;
  attachments: string[];
  knowledgeLink: {
    documentId: string;
    versionId: string;
    version: number;
    title: string;
  } | null;
  hasNewVersion: boolean;
  validFrom: string;
  validUntil: string;
  publishedAt: string | null;
  version: number;
}
export type Action = 'publish' | 'revoke' | 'remind' | 'confirm';
export interface Detail extends Announcement {
  capabilities: {
    actions: ('edit' | 'receipts' | Action)[];
    ownReceipt: {
      status: 'pending' | 'confirmed';
      confirmedAt: string | null;
    } | null;
  };
}
export interface Receipt {
  id: string;
  name: string;
  user: { id: string; name: string };
  status: 'pending' | 'confirmed';
  confirmedAt: string | null;
}
export interface Envelope<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pending?: number;
    confirmed?: number;
  };
}
export interface Options {
  timeZone: string;
  dutyRoles:
    { code: string; title: string | { key: string; ns: string } }[] | null;
}
export interface Context {
  reload: () => void;
  updateDetail?: (data: Detail) => void;
}
export interface FileMetadata {
  id: string;
  filename: string;
  contentUrl: string;
  size: number;
}
export const statuses = ['draft', 'scheduled', 'published', 'revoked'] as const;
export function dateLabel(value: string | null, locale: string, zone: string) {
  return value
    ? new Intl.DateTimeFormat(locale, {
        timeZone: zone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
}
export function effective(row: Announcement, now = Date.now()) {
  return (
    row.status === 'published' &&
    Date.parse(row.validFrom) <= now &&
    Date.parse(row.validUntil) > now
  );
}
// A stale offer cannot authorize a write once the validity window has ended.
export function currentActions(row: Detail, now = Date.now()) {
  return row.capabilities.actions.filter(
    (action) => !['confirm', 'remind'].includes(action) || effective(row, now),
  );
}

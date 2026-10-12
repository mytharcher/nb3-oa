export const resource = { type: 'composite' as const, id: 'oa.workItems' };
export const statuses = [
  'draft',
  'open',
  'assigned',
  'claimed',
  'awaitingConfirmation',
  'blocked',
  'completed',
  'cancelled',
] as const;
export const modes = ['pending', 'created', 'assigned', 'pool', 'all'] as const;
export const actions = [
  'dispatch',
  'claim',
  'release',
  'complete',
  'confirm',
  'return',
  'block',
  'resume',
  'reassign',
  'cancel',
  'forceComplete',
] as const;
export type Action = (typeof actions)[number];
export type Title = string | { key: string; ns: string };
export interface User {
  id: string;
  name: string;
}
export interface Item {
  id: string;
  title: string;
  description: string;
  creator: User;
  target: User | null;
  assignee: User | null;
  creatorUserId: string;
  confirmationOwnerUserId: string | null;
  confirmationOwner: User | null;
  targetUserId: string | null;
  dutyRoleCode: string | null;
  assigneeUserId: string | null;
  dutyRole: { code: string; title: Title } | null;
  dueAt: string;
  requiresConfirmation: boolean;
  attachments: string[];
  resultAttachments: string[];
  result: string | null;
  reason: string | null;
  status: (typeof statuses)[number];
  version: number;
  forced: boolean;
  completedAt: string | null;
  overdue: boolean;
  actions: Action[];
  canEdit: boolean;
  canHandoverConfirmation: boolean;
}
export interface Context {
  timeZone: string;
  dutyRoles: { code: string; title: Title }[] | null;
}
export interface Envelope<T> {
  data: T;
}
export interface Source {
  basePath: string;
  detailPath?: string;
  search: string;
  reload: () => void;
}

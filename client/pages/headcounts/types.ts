export const resource = { type: 'composite' as const, id: 'oa.headcounts' };
export interface Identity {
  id: string;
  name: string;
}
export interface Balance {
  id: string;
  departmentId: string;
  positionId: string;
  department: Identity | null;
  position: Identity | null;
  year: number;
  limit: number;
  initialized: boolean;
  version: number;
  used: number;
  pending: number;
  allocated: number;
  available: number;
  replacementPending: number;
  replacementAllocated: number;
  replacementBlocked: number;
  createdAt: string;
  updatedAt: string;
}
export interface Journal {
  id: string;
  action: string;
  actor: Identity;
  reason: string;
  at: string;
  sourceReference: string | null;
  sourceLink: { kind: string; id: string; path: string } | null;
}
export interface Preview {
  version: number;
  initialized: boolean;
  employees: { id: string; name: string; status: string }[];
}
export interface Options {
  year: number;
  targets: { department: Identity; position: Identity }[];
}
export interface PageContext {
  reload: () => void;
  onSaved: (value: Balance) => void;
  source: string;
  search: string;
}
export const sortFields = [
  'year',
  'limit',
  'used',
  'pending',
  'allocated',
  'available',
  'updatedAt',
] as const;
export function accountName(a: Balance) {
  return `${a.department?.name ?? '—'} / ${a.position?.name ?? '—'} / ${a.year}`;
}

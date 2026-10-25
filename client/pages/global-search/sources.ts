export interface SearchHit {
  id: string;
  title: string;
  detail?: string;
  to: string;
}
export interface SearchResponse {
  data: unknown[];
  meta: { total: number; page: number; pageSize: number };
}
export interface SearchSource {
  key: string;
  path: string;
  resource: { type: 'page' | 'composite'; id: string };
  action: string;
  query(q: string): Record<string, string>;
  hit(value: unknown): SearchHit;
}
export const searchSources: readonly SearchSource[] = [
  {
    key: 'people',
    path: 'directory',
    resource: { type: 'composite', id: 'oa.employees.directory' },
    action: 'view',
    query: (q) => ({ q }),
    hit: (value) => {
      const row = value as {
        id: string;
        name: string;
        code: string;
        primaryDepartment: { name?: string; title?: string } | null;
      };
      return {
        id: row.id,
        title: `${row.name} · ${row.code}`,
        detail: row.primaryDepartment?.name ?? row.primaryDepartment?.title,
        to: `/directory?q=${encodeURIComponent(row.code)}`,
      };
    },
  },
  {
    key: 'announcements',
    path: 'announcements',
    resource: { type: 'composite', id: 'oa.announcements' },
    action: 'view',
    query: (q) => ({ q, mode: 'received' }),
    hit: (value) => {
      const row = value as { id: string; title: string };
      return {
        id: row.id,
        title: row.title,
        to: `/announcements/${encodeURIComponent(row.id)}`,
      };
    },
  },
  {
    key: 'knowledge',
    path: 'knowledge/documents',
    resource: { type: 'composite', id: 'oa.knowledgeDocuments' },
    action: 'view',
    query: (q) => ({ q }),
    hit: (value) => {
      const row = value as { id: string; title: string };
      return {
        id: row.id,
        title: row.title,
        to: `/knowledge/${encodeURIComponent(row.id)}`,
      };
    },
  },
];

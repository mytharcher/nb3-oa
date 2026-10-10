import type { OrgUser } from '../shared.js';

/** A department as `GET /api/departments` answers it. */
export interface Department {
  readonly id: string;
  readonly title: string;
  readonly code: string | null;
  readonly parentId: string | null;
  readonly managerId: string | null;
  readonly manager: OrgUser | null;
  readonly executiveId: string | null;
  readonly executive: OrgUser | null;
  /** The stored flag; a department also counts as disabled while any ancestor is. */
  readonly active: boolean;
  readonly sortOrder: number;
  readonly memberCount: number;
}

export interface DepartmentMember {
  readonly userId: string;
  readonly user: OrgUser;
  readonly primary: boolean;
}

/** What the departments page hands the selected department and the top-level create dialog. */
export interface DepartmentsOutletContext {
  /** `undefined` until the tree has loaded. */
  readonly departments: readonly Department[] | undefined;
  readonly canUpdate: boolean;
  /** Reloads the tree (and with it the selected department's details). */
  readonly reload: () => void;
}

/** What the selected department hands the dialogs stacked on it. */
export interface DepartmentOutletContext {
  readonly department: Department;
  readonly reload: () => void;
  /** Reloads the member list after a membership write. */
  readonly reloadMembers: () => void;
  /** Current members, which the add-member picker leaves out. */
  readonly memberIds: readonly string[];
}

/** The department and its ancestors, nearest first; a cycle or a missing parent ends the walk. */
export function chainOf(
  departments: readonly Department[],
  id: string,
): Department[] {
  const byId = new Map(departments.map((row) => [row.id, row]));
  const chain: Department[] = [];
  const seen = new Set<string>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current);
    current =
      current.parentId === null ? undefined : byId.get(current.parentId);
  }
  return chain;
}

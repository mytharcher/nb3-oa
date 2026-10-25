import type { Department } from '../../providers/org/contract.js';
import type { Membership } from '../../providers/org/service.js';

export function organizationOf(
  memberships: readonly Membership[],
  departments: readonly Department[],
) {
  const primary = memberships.filter((entry) => entry.primary);
  const empty = { primaryDepartment: null, inactiveDepartmentIds: [] };
  if (!primary.length) return { ...empty, state: 'unassigned' as const };
  if (primary.length !== 1)
    return { ...empty, state: 'invalid-chain' as const };
  const id = primary[0].departmentId;
  const byId = new Map(departments.map((entry) => [entry.id, entry]));
  const invalid = {
    ...empty,
    state: 'invalid-chain' as const,
    primaryDepartment: { id, title: byId.get(id)?.title ?? null, path: [] },
  };
  const path: { id: string; title: string; active: boolean }[] = [];
  const seen = new Set<string>();
  let cursor: string | null = id;
  while (cursor) {
    const node = byId.get(cursor);
    if (!node || seen.has(cursor)) return invalid;
    seen.add(cursor);
    path.unshift({ id: node.id, title: node.title, active: node.active });
    cursor = node.parentId;
  }
  const inactiveDepartmentIds = path
    .filter((entry) => !entry.active)
    .map((entry) => entry.id);
  return {
    state: inactiveDepartmentIds.length
      ? ('inactive-chain' as const)
      : ('active' as const),
    primaryDepartment: { id, title: byId.get(id)!.title, path },
    inactiveDepartmentIds,
  };
}

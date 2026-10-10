/** Pure helpers over a loaded department tree. Every walk stops at a node already visited, so a cycle cannot loop. */

export interface TreeNode {
  readonly id: string;
  readonly title: string;
  readonly code: string | null;
  readonly parentId: string | null;
  readonly managerId: string | null;
  readonly executiveId: string | null;
  readonly active: boolean;
  readonly sortOrder: number;
}

export type Tree = ReadonlyMap<string, TreeNode>;

export function compareNodes(left: TreeNode, right: TreeNode): number {
  return (
    left.sortOrder - right.sortOrder ||
    left.title.localeCompare(right.title) ||
    left.id.localeCompare(right.id)
  );
}

/** The department and its ancestors, nearest first; `undefined` on a cycle or a missing node. */
export function chainOf(tree: Tree, id: string): TreeNode[] | undefined {
  const chain: TreeNode[] = [];
  const visited = new Set<string>();
  let current: string | null = id;
  while (current !== null) {
    if (visited.has(current)) return undefined;
    visited.add(current);
    const node = tree.get(current);
    if (!node) return undefined;
    chain.push(node);
    current = node.parentId;
  }
  return chain;
}

/** The chain when the department and every ancestor are active; `undefined` otherwise. */
export function activeChainOf(tree: Tree, id: string): TreeNode[] | undefined {
  const chain = chainOf(tree, id);
  if (!chain || chain.some((node) => !node.active)) return undefined;
  return chain;
}

export function isEffectivelyActive(tree: Tree, id: string): boolean {
  return activeChainOf(tree, id) !== undefined;
}

function childrenIndex(tree: Tree): Map<string, TreeNode[]> {
  const children = new Map<string, TreeNode[]>();
  for (const node of tree.values()) {
    if (node.parentId === null) continue;
    const siblings = children.get(node.parentId) ?? [];
    siblings.push(node);
    children.set(node.parentId, siblings);
  }
  return children;
}

/** The department and every descendant, active or not, breadth first. */
export function subtreeOf(tree: Tree, id: string): TreeNode[] {
  const root = tree.get(id);
  if (!root) return [];
  const children = childrenIndex(tree);
  const result: TreeNode[] = [];
  const visited = new Set<string>();
  const pending: TreeNode[] = [root];
  while (pending.length) {
    const node = pending.shift();
    if (!node || visited.has(node.id)) continue;
    visited.add(node.id);
    result.push(node);
    pending.push(...(children.get(node.id) ?? []));
  }
  return result;
}

/** The departments plus every descendant, keeping only those whose whole chain is active. */
export function activeSubtrees(tree: Tree, ids: readonly string[]): string[] {
  const result = new Set<string>();
  for (const id of ids) {
    if (!isEffectivelyActive(tree, id)) continue;
    for (const node of subtreeOf(tree, id))
      if (isEffectivelyActive(tree, node.id)) result.add(node.id);
  }
  return [...result];
}

/** Effectively active departments the user heads. */
export function headedIn(tree: Tree, userId: string): string[] {
  return [...tree.values()]
    .filter(
      (node) => node.managerId === userId && isEffectivelyActive(tree, node.id),
    )
    .map((node) => node.id);
}

/** The first non-empty value of `pick` along the chain, starting at the department itself. */
export function walkUp(
  tree: Tree,
  id: string,
  pick: (node: TreeNode) => string | null,
): string | undefined {
  const visited = new Set<string>();
  let current: string | null = id;
  while (current !== null && !visited.has(current)) {
    visited.add(current);
    const node = tree.get(current);
    if (!node) return undefined;
    const value = pick(node);
    if (value) return value;
    current = node.parentId;
  }
  return undefined;
}

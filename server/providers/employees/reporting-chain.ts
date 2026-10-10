/**
 * The reporting line as a graph over `employees.managerId`. The whole line of a company of a few hundred people is
 * loaded in one read and walked in memory; every walk keeps a visited set, so a cycle written by mistake (or by two
 * concurrent edits) ends the walk instead of looping.
 */

export interface ReportingNode {
  readonly id: string;
  readonly userId: string;
  readonly managerId: string | null;
  readonly active: boolean;
}

export interface ReportingGraph {
  readonly byId: ReadonlyMap<string, ReportingNode>;
  readonly byUserId: ReadonlyMap<string, ReportingNode>;
  /** Employees whose `managerId` names the key, in load order. */
  readonly children: ReadonlyMap<string, readonly ReportingNode[]>;
}

export function buildReportingGraph(
  nodes: Iterable<ReportingNode>,
): ReportingGraph {
  const byId = new Map<string, ReportingNode>();
  const byUserId = new Map<string, ReportingNode>();
  const children = new Map<string, ReportingNode[]>();
  for (const node of nodes) {
    byId.set(node.id, node);
    byUserId.set(node.userId, node);
  }
  for (const node of byId.values()) {
    if (!node.managerId || !byId.has(node.managerId)) continue;
    const list = children.get(node.managerId);
    if (list) list.push(node);
    else children.set(node.managerId, [node]);
  }
  return { byId, byUserId, children };
}

/** Every employee above the start, nearest first, inactive ones included; stops at a cycle or a dangling id. */
export function rawChainAbove(
  graph: ReportingGraph,
  employeeId: string,
): readonly ReportingNode[] {
  const chain: ReportingNode[] = [];
  const visited = new Set<string>([employeeId]);
  let current = graph.byId.get(employeeId)?.managerId ?? null;
  while (current && !visited.has(current)) {
    visited.add(current);
    const node = graph.byId.get(current);
    if (!node) break;
    chain.push(node);
    current = node.managerId;
  }
  return chain;
}

/** The active managers above the start, nearest first: an inactive manager is skipped and their manager counts. */
export function activeChainAbove(
  graph: ReportingGraph,
  employeeId: string,
): readonly ReportingNode[] {
  return rawChainAbove(graph, employeeId).filter((node) => node.active);
}

/**
 * Every employee below the start, any depth, active or not, never the start itself. A former employee stays below
 * the managers they reported to, and the people who reported to them stay below those managers too.
 */
export function descendantsOf(
  graph: ReportingGraph,
  employeeId: string,
): readonly ReportingNode[] {
  const result: ReportingNode[] = [];
  const visited = new Set<string>([employeeId]);
  const queue = [employeeId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of graph.children.get(current) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      result.push(child);
      queue.push(child.id);
    }
  }
  return result;
}

/** Active employees whose nearest active manager is the start: reports of an inactive intermediate move up. */
export function effectiveDirectReportsOf(
  graph: ReportingGraph,
  employeeId: string,
): readonly ReportingNode[] {
  const result: ReportingNode[] = [];
  const visited = new Set<string>([employeeId]);
  const queue = [employeeId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const child of graph.children.get(current) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      if (child.active) result.push(child);
      else queue.push(child.id);
    }
  }
  return result;
}

/** Whether giving `employeeId` the manager `managerId` would close a loop (including managing oneself). */
export function wouldCreateCycle(
  graph: ReportingGraph,
  employeeId: string,
  managerId: string,
): boolean {
  if (managerId === employeeId) return true;
  return rawChainAbove(graph, managerId).some((node) => node.id === employeeId);
}

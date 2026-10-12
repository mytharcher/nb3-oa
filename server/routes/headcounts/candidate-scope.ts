import type { FilterAst, FilterNode } from '@nocobase/db';

// Options have no stored row to query. validateMutation checks shape, not values
// against the row scope. Only fully understood scalar scopes admit candidates;
// unsupported expressions fail closed. Actual creates still use Repository policy.
export function admitsCandidate(
  scope: true | FilterAst,
  values: Record<string, unknown>,
): boolean {
  if (scope === true) return true;
  function evaluate(node: FilterNode): boolean | undefined {
    if (node.kind === 'group') {
      const children = node.items.map(evaluate);
      if (children.includes(undefined)) return undefined;
      return node.logic === 'and'
        ? children.every(Boolean)
        : children.some(Boolean);
    }
    if (node.kind !== 'condition' || node.path.length !== 1 || node.jsonPath)
      return undefined;
    let actual = values[node.path[0]],
      expected = node.value;
    if (expected !== null && typeof expected === 'object') return undefined;
    if (node.mode === 'insensitive') {
      if (typeof actual !== 'string' || typeof expected !== 'string')
        return undefined;
      actual = actual.toLowerCase();
      expected = expected.toLowerCase();
    }
    if (node.operator === '$empty')
      return actual === null || actual === undefined || actual === '';
    if (node.operator === '$notEmpty')
      return actual !== null && actual !== undefined && actual !== '';
    if (
      actual === null ||
      actual === undefined ||
      expected === null ||
      expected === undefined
    ) {
      if (node.operator === '$eq') return actual === expected;
      if (node.operator === '$ne' && expected === null)
        return actual !== null && actual !== undefined;
      return false;
    }
    if (typeof actual !== typeof expected) return undefined;
    if (node.operator === '$eq') return actual === expected;
    if (node.operator === '$ne') return actual !== expected;
    if (typeof actual === 'number' && typeof expected === 'number') {
      switch (node.operator) {
        case '$gt':
          return actual > expected;
        case '$gte':
          return actual >= expected;
        case '$lt':
          return actual < expected;
        case '$lte':
          return actual <= expected;
      }
    }
    return undefined;
  }
  return evaluate(scope.root) === true;
}

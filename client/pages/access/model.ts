import { operationPolicyKey } from '../../../shared/access-grants.js';
import type {
  ActionRow,
  AuthorizationOptions,
  PermissionSet,
} from './types.js';
export function resources(options: AuthorizationOptions) {
  return options.sections
    .flatMap((section) =>
      section.subsections.flatMap((subsection) => subsection.resources),
    )
    .sort(
      (left, right) =>
        ['composite', 'settings', 'page'].indexOf(left.type) -
        ['composite', 'settings', 'page'].indexOf(right.type),
    );
}
export function actionRows(
  options: AuthorizationOptions,
  definition: PermissionSet,
): ActionRow[] {
  return resources(options).flatMap((resource) =>
    (resource.actions ?? [{ value: 'access', label: resource.label }]).map(
      (action) => {
        const entries = definition.grants
          .filter(
            (grant) =>
              grant.resource.type === resource.type &&
              grant.resource.id === resource.value,
          )
          .flatMap((grant) =>
            grant.actions.filter((entry) => entry.action === action.value),
          );
        const stored = entries[0]?.policy;
        const scopes = (stored?.scopes ?? {}) as Record<string, unknown>;
        const available = resource.dataScopes?.[action.value] ?? [];
        const custom =
          new Set(
            entries.map((entry) =>
              operationPolicyKey(resource.type, entry.policy),
            ),
          ).size > 1 ||
          Boolean(
            stored &&
            (resource.type !== 'composite' ||
              stored.type !== 'composite' ||
              Object.keys(stored).some(
                (key) => !['type', 'scopes'].includes(key),
              ) ||
              Object.entries(scopes).some(
                ([key, value]) =>
                  typeof value !== 'string' ||
                  !available.some(
                    (scope) =>
                      scope.key === key &&
                      scope.options.some((option) => option.value === value),
                  ),
              )),
          );
        return {
          id: JSON.stringify([resource.type, resource.value, action.value]),
          resource,
          action: action.value,
          label: action.label,
          enabled: entries.length > 0,
          custom,
          scopes: Object.fromEntries(
            available.map((scope) => [
              scope.key,
              typeof scopes[scope.key] === 'string' ? scopes[scope.key] : '',
            ]),
          ) as Record<string, string>,
        };
      },
    ),
  );
}
export function grantSummary(
  options: AuthorizationOptions,
  set: PermissionSet,
): string[] {
  const catalog = resources(options);
  return set.grants
    .map(
      (grant) =>
        catalog.find(
          (entry) =>
            entry.type === grant.resource.type &&
            entry.value === grant.resource.id,
        )?.label ?? '',
    )
    .filter(Boolean);
}

/** Exact operations for the assignment preview; resource summaries alone cannot describe sensitive grants. */
export function operationSummary(
  options: AuthorizationOptions,
  set: PermissionSet,
  formatPair: (label: string, value: string) => string,
): string[] {
  return actionRows(options, set)
    .filter((row) => row.enabled)
    .map(
      (row) =>
        `${row.resource.label} · ${row.label}${row.custom ? '' : (row.resource.dataScopes?.[row.action] ?? []).map((scope) => ` · ${formatPair(scope.label, scope.options.find((option) => option.value === row.scopes[scope.key])?.label ?? '—')}`).join('')}`,
    );
}

export function sensitiveSummary(
  options: AuthorizationOptions,
  set: PermissionSet,
): string[] {
  // Explicit OA sensitive actions/resources; labels still come from the registered catalog.
  return roleRows(options, [set])
    .filter(
      (row) =>
        row.enabled &&
        ([
          'viewBank',
          'paymentAccount',
          'bankRead',
          'viewSalary',
          'compensation',
          'viewCost',
          'viewValue',
        ].includes(row.action) ||
          row.resource.value === 'oa.employees.compensation'),
    )
    .map((row) => `${row.resource.label} · ${row.label}`);
}

export function subjectSets(
  snapshot: import('./types.js').AccessSnapshot,
  subject: { type: string; id: string },
) {
  return snapshot.sets.filter((set) =>
    snapshot.assignments.some(
      (entry) =>
        entry.permissionSet === set.key &&
        entry.subject.type === subject.type &&
        entry.subject.id === subject.id,
    ),
  );
}

/** Aggregate and route operations. Distinct module sets do not make unrelated actions read-only. */
export function roleRows(
  options: AuthorizationOptions,
  sets: PermissionSet[],
  _editable = true,
): ActionRow[] {
  const catalog = resources(options);
  const rows = actionRows(options, { key: '', grants: [] });
  const indexed = sets.map((set) => {
    const expanded = {
      ...set,
      grants: set.grants.flatMap((grant) =>
        grant.resource.id === '*'
          ? catalog
              .filter((resource) => resource.type === grant.resource.type)
              .map((resource) => ({
                ...grant,
                resource: { type: resource.type, id: resource.value },
              }))
          : [grant],
      ),
    };
    return {
      set,
      rows: new Map(actionRows(options, expanded).map((row) => [row.id, row])),
      modules: new Set(
        expanded.grants.map((grant) =>
          JSON.stringify([grant.resource.type, grant.resource.id]),
        ),
      ),
    };
  });
  return rows.map((row) => {
    const sources = indexed.filter((entry) =>
      entry.modules.has(
        JSON.stringify([row.resource.type, row.resource.value]),
      ),
    );
    const holders = sources.filter((entry) => entry.rows.get(row.id)!.enabled);
    const entries = holders.map((entry) => entry.rows.get(row.id)!);
    const policies = holders.flatMap(({ set }) =>
      set.grants
        .filter(
          (grant) =>
            grant.resource.type === row.resource.type &&
            [row.resource.value, '*'].includes(grant.resource.id),
        )
        .flatMap((grant) =>
          grant.actions.filter((entry) => entry.action === row.action),
        ),
    );
    return {
      ...(entries[0] ?? row),
      sourceKeys: holders.map(({ set }) => set.key),
      targetKeys: entries.length
        ? []
        : sources
            .filter(
              ({ set }) =>
                !set.protection || set.protection.allow.includes('update'),
            )
            .map(({ set }) => set.key),
      custom:
        new Set(
          policies.map((entry) =>
            operationPolicyKey(row.resource.type, entry.policy),
          ),
        ).size > 1 ||
        entries.some((entry) => entry.custom) ||
        holders.some(({ set }) =>
          set.grants.some(
            (grant) =>
              grant.resource.type === row.resource.type &&
              grant.resource.id === '*' &&
              grant.actions.some((entry) => entry.action === row.action),
          ),
        ) ||
        holders.some(
          ({ set }) =>
            set.protection && !set.protection.allow.includes('update'),
        ),
    };
  });
}

export function rowValue(
  row: ActionRow,
  none: string,
  granted: string,
  special: string,
) {
  if (row.custom) return special;
  if (!row.enabled) return none;
  const scopes = row.resource.dataScopes?.[row.action] ?? [];
  return (
    scopes
      .map(
        (scope) =>
          `${scopes.length > 1 ? `${scope.label}: ` : ''}${scope.options.find((option) => option.value === row.scopes[scope.key])?.label ?? special}`,
      )
      .join(' · ') || granted
  );
}

export function businessModuleCount(
  options: AuthorizationOptions,
  sets: PermissionSet[],
): number {
  return new Set(
    roleRows(options, sets)
      .filter((row) => row.enabled && row.resource.type === 'composite')
      .map((row) => row.resource.value),
  ).size;
}

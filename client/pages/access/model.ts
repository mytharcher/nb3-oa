import type {
  ActionRow,
  AuthorizationOptions,
  PermissionSet,
} from './types.js';
export function resources(options: AuthorizationOptions) {
  return options.sections.flatMap((section) =>
    section.subsections.flatMap((subsection) => subsection.resources),
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
          entries.length > 1 ||
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
): string[] {
  return actionRows(options, set)
    .filter((row) => row.enabled)
    .map(
      (row) =>
        `${row.resource.label} · ${row.label}${row.custom ? '' : (row.resource.dataScopes?.[row.action] ?? []).map((scope) => ` · ${scope.label}: ${scope.options.find((option) => option.value === row.scopes[scope.key])?.label ?? '—'}`).join('')}`,
    );
}

export function sensitiveSummary(
  options: AuthorizationOptions,
  set: PermissionSet,
): string[] {
  // Explicit OA sensitive actions/resources; labels still come from the registered catalog.
  return actionRows(options, set)
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

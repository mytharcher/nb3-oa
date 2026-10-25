import {
  parseRoleGrantTitle,
  renderAccessTitle,
} from '../../../../shared/access-titles.js';
import type { UserRoleScopeOption, UserRoleValue } from './user-client.js';

export function localizeRoleScopes(
  scopes: readonly UserRoleScopeOption[],
  translate: (
    key: string,
    namespace?: string,
    defaultValue?: string,
    values?: Readonly<Record<string, unknown>>,
  ) => string,
): readonly UserRoleScopeOption[] {
  const text = (key: string, ns: string | undefined, fallback: string) => {
    const title = { key, ns };
    return parseRoleGrantTitle(title)
      ? renderAccessTitle(
          title,
          (key, values) =>
            translate(
              key,
              typeof values?.ns === 'string' ? values.ns : undefined,
              typeof values?.defaultValue === 'string'
                ? values.defaultValue
                : undefined,
              values,
            ),
          fallback,
        )
      : translate(key, ns, fallback);
  };
  return scopes.map((scope) => ({
    ...scope,
    label: scope.labelI18nKey
      ? text(scope.labelI18nKey, scope.labelI18nNs, scope.label)
      : scope.label,
    options: scope.options.map((option) => ({
      ...option,
      label: option.labelI18nKey
        ? text(option.labelI18nKey, option.labelI18nNs, option.label)
        : option.label,
    })),
  }));
}

export function assignableRoleScopes(
  scopes: readonly UserRoleScopeOption[],
): readonly UserRoleScopeOption[] {
  return scopes
    .map((scope) => ({
      ...scope,
      options: scope.options.filter((option) => option.assignable !== false),
    }))
    .filter((scope) => scope.requiredOnCreate || scope.options.length > 0);
}

export function emptyRoleScopeValues(
  scopes: readonly UserRoleScopeOption[],
): Record<string, UserRoleValue> {
  return Object.fromEntries(
    scopes.map((scope) => [
      scope.key,
      scope.selection === 'multiple' ? [] : '',
    ]),
  );
}

export function selectedRoleScopeValues(
  scopes: readonly UserRoleScopeOption[],
  values: Readonly<Record<string, UserRoleValue>>,
): Readonly<Record<string, UserRoleValue>> {
  return Object.fromEntries(
    scopes.flatMap((scope) => {
      const value = values[scope.key];
      return value !== undefined && roleValueCount(value) > 0
        ? [[scope.key, value] as const]
        : [];
    }),
  );
}

export function hasEveryRequiredRoleScope(
  scopes: readonly UserRoleScopeOption[],
  values: Readonly<Record<string, UserRoleValue>>,
): boolean {
  return scopes.every(
    (scope) =>
      !scope.requiredOnCreate || roleValueCount(values[scope.key] ?? '') > 0,
  );
}

function roleValueCount(value: UserRoleValue): number {
  return typeof value === 'string'
    ? Number(value.trim().length > 0)
    : value.length;
}

/** App-owned compact payload inside the platform's unchanged { key, ns } title contract. */
export type AccessTitle = string | { key: string; ns?: string };
const prefix = 'access.roleGrant:';
export interface RoleGrantTitle {
  module: AccessTitle;
  role: AccessTitle;
  number: number;
}
type PackedTitle = string | [string] | [string, string];
function pack(title: AccessTitle): PackedTitle {
  if (typeof title === 'string') return title;
  return title.ns === 'nb3-oa'
    ? [title.key]
    : [title.key, title.ns ?? '@nocobase/app-plugin-authorization'];
}
function unpack(value: unknown): AccessTitle | undefined {
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return;
  const parts: readonly unknown[] = value;
  if (
    parts.length < 1 ||
    parts.length > 2 ||
    typeof parts[0] !== 'string' ||
    (parts.length === 2 && typeof parts[1] !== 'string')
  )
    return;
  return {
    key: parts[0],
    ns: typeof parts[1] === 'string' ? parts[1] : 'nb3-oa',
  };
}
export function parseRoleGrantTitle(
  title: AccessTitle | undefined,
): RoleGrantTitle | undefined {
  if (
    !title ||
    typeof title !== 'object' ||
    title.ns !== 'nb3-oa' ||
    !title.key.startsWith(prefix)
  )
    return;
  try {
    const value: unknown = JSON.parse(title.key.slice(prefix.length));
    if (!Array.isArray(value)) return;
    const parts: readonly unknown[] = value;
    const number = parts[2];
    if (
      parts.length !== 3 ||
      typeof number !== 'number' ||
      !Number.isSafeInteger(number) ||
      number < 1
    )
      return;
    const module = unpack(parts[0]),
      role = unpack(parts[1]);
    if (module === undefined || role === undefined) return;
    return { module, role, number };
  } catch {
    return;
  }
}
export function roleGrantTitle(value: RoleGrantTitle): {
  key: string;
  ns: string;
} {
  const parts: [PackedTitle, PackedTitle, number] = [
    pack(value.module),
    pack(value.role),
    value.number,
  ];
  const descriptor = () => ({
    key: prefix + JSON.stringify(parts),
    ns: 'nb3-oa',
  });
  // The public store's title column is varchar(255). Preserve translation references;
  // unusually long administrator-entered names get a visible ellipsis, never broken keys.
  while (
    JSON.stringify({
      key:
        prefix + JSON.stringify([parts[0], parts[1], Number.MAX_SAFE_INTEGER]),
      ns: 'nb3-oa',
    }).length > 255
  ) {
    const candidates = ([0, 1] as const)
      .filter(
        (index) => typeof parts[index] === 'string' && parts[index].length > 8,
      )
      .sort(
        (a, b) => (parts[b] as string).length - (parts[a] as string).length,
      );
    if (!candidates.length)
      throw new RangeError(
        'Role title translation references exceed the title storage limit',
      );
    const index = candidates[0];
    const name = parts[index] as string;
    parts[index] = [...name.replace(/…$/, '')].slice(0, -1).join('') + '…';
  }
  return descriptor();
}
export function renderAccessTitle(
  value: AccessTitle | undefined,
  t: (key: string, options?: Readonly<Record<string, unknown>>) => string,
  fallback = '',
  depth = 0,
): string {
  if (typeof value !== 'object') return value ?? fallback;
  const generated = parseRoleGrantTitle(value);
  if (generated && depth < 4)
    return t('access.roleGrantTitle', {
      ns: 'nb3-oa',
      module: renderAccessTitle(generated.module, t, fallback, depth + 1),
      role: renderAccessTitle(generated.role, t, fallback, depth + 1),
      number: generated.number,
    });
  return t(value.key, {
    ns: value.ns ?? '@nocobase/app-plugin-authorization',
    defaultValue: fallback || value.key,
  });
}

/** Only committed directory state travels between records and through legacy links. */
export function userListParams(source: URLSearchParams) {
  const result = new URLSearchParams();
  const search = source.get('search')?.trim();
  if (search) result.set('search', search);
  const status = source.get('status');
  if (status === 'enabled' || status === 'disabled')
    result.set('status', status);
  const role = source.get('role');
  if (role && role !== 'all') result.set('role', role);
  const page = Number(source.get('page'));
  if (Number.isSafeInteger(page) && page > 1) result.set('page', String(page));
  return result;
}
export function userDetailLink(
  userId: string,
  source: URLSearchParams,
  tab?: string,
) {
  const params = userListParams(source);
  if (tab)
    params.set(
      'tab',
      tab === 'roles' || tab === 'organization'
        ? 'information'
        : tab === 'exceptions'
          ? 'permissions'
          : tab,
    );
  return `/users/${encodeURIComponent(userId)}${params.size ? `?${params}` : ''}`;
}
export function legacyUserLink(
  path: string,
  source: URLSearchParams,
  userId?: string,
) {
  if (!userId) {
    const params = userListParams(source);
    return `/users${params.size ? `?${params}` : ''}`;
  }
  const tab = path.endsWith('/duty-roles')
    ? 'roles'
    : /\/(assign|personal)$/.test(path)
      ? 'exceptions'
      : 'permissions';
  return userDetailLink(userId, source, tab);
}

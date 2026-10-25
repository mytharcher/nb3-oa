const base = 'https://oa.invalid';

function unsafe(value: string) {
  return (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    [...value].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  );
}

/** Accept an application-relative route, before resolveAppUrl adds the mount path. */
export function authReturnPath(value: string | null | undefined): string {
  if (!value || value.length > 2048 || unsafe(value)) return '/';
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return '/';
    // Only the path decides where the browser goes. Reject encoded separators there,
    // including a second layer handled by a proxy; query and hash keep their encoding.
    let path = url.pathname;
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(path);
      if (next === path) break;
      path = next;
    }
    if (
      unsafe(path) ||
      /^\/(?:login|register|forgot-password|reset-password|api\/auth)(?:\/|$)/iu.test(
        path,
      )
    )
      return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

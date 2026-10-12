import { usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useLocation, useResolvedPath } from 'react-router';
export function sourcePath(path: string) {
  const recordSplit = path.search(
    /\/(?:newContract|editContract|contract)(?:\/|$)/,
  );
  if (recordSplit >= 0) return path.slice(0, recordSplit);
  const ledgerSplit = path.search(/\/contractLedger(?:\/|$)/);
  return ledgerSplit >= 0 ? path.slice(0, ledgerSplit) : path;
}
export function useTrail(name: string) {
  const { t } = useTranslation(),
    location = useLocation(),
    parent = useResolvedPath('..'),
    source = sourcePath(location.pathname);
  const parentQuery = new URLSearchParams(location.search);
  if (location.pathname.includes('/newContract')) {
    parentQuery.delete('operation');
    parentQuery.delete('source');
  }
  const sourceSearch = parentQuery.toString();
  usePageBreadcrumb([
    {
      label: t('contracts.source'),
      to: { pathname: source, search: sourceSearch },
    },
    ...(parent.pathname !== source
      ? [
          {
            label: t('contracts.detail'),
            to: { pathname: parent.pathname, search: location.search },
          },
        ]
      : []),
    { label: name },
  ]);
  return { source, parent: parent.pathname, search: sourceSearch };
}
export function focusSource() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const h = [...document.querySelectorAll<HTMLHeadingElement>('h1')]
        .filter((h) => !h.closest('[inert]'))
        .at(-1);
      if (h) {
        h.tabIndex = -1;
        h.focus();
      }
    }),
  );
}

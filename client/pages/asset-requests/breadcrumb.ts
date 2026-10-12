import { usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useLocation, useResolvedPath } from 'react-router';
export function focusSource() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const headings = [
        ...document.querySelectorAll<HTMLHeadingElement>('h1'),
      ].filter((h) => !h.closest('[inert]'));
      const heading = headings.at(-1);
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }),
  );
}
export function useSourceTrail(name: string, form = false) {
  const { t } = useTranslation();
  const location = useLocation();
  const parent = useResolvedPath('..');
  const split = location.pathname.search(
    /\/(?:newAssetRequest|editAssetRequest|assetRequest)(?:\/|$)/,
  );
  const source =
    split >= 0 ? location.pathname.slice(0, split) : parent.pathname;
  usePageBreadcrumb([
    {
      label: t('assetRequests.source'),
      to: { pathname: source, search: location.search },
    },
    ...(form && parent.pathname !== source
      ? [
          {
            label: t('assetRequests.detail'),
            to: { pathname: parent.pathname, search: location.search },
          },
        ]
      : []),
    { label: name },
  ]);
  return { source, parent: parent.pathname, search: location.search };
}

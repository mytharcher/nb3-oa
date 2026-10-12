import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
/** Return to the owning tab/list, including direct child forms and stacked actions. */
function qualificationSourcePath(path: string) {
  const segments = path.split('/').filter(Boolean);
  const index = segments.findIndex((s) =>
    [
      'vendorQualifications',
      'vendorQualification',
      'editVendorQualification',
      'newVendorQualification',
    ].includes(s),
  );
  if (index < 0) return '/';
  return (
    '/' +
    segments
      .slice(0, index + (segments[index] === 'vendorQualifications' ? 1 : 0))
      .join('/')
  );
}
export function Missing({
  onMissing,
  focusList,
  name,
  allowNavigation,
}: {
  onMissing?: () => void;
  focusList?: () => void;
  name?: string;
  allowNavigation?: () => void;
}) {
  const handledRef = useRef(false),
    location = useLocation(),
    navigate = useNavigate(),
    toaster = useToaster(),
    { t } = useTranslation();
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    toaster.show({
      type: 'error',
      duration: 0,
      id: `vendor-qualification-missing:${location.pathname}`,
      title: name
        ? t('vendorQualifications.errors.missingReturned', { name })
        : t('vendorQualifications.errors.missingUnnamed'),
    });
    allowNavigation?.();
    onMissing?.();
    void Promise.resolve(
      navigate(
        {
          pathname: qualificationSourcePath(location.pathname),
          search: location.search,
        },
        { replace: true },
      ),
    ).then(() => {
      // Let the outgoing dialog finish its own focus restoration before focusing the source.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (focusList) {
            focusList();
            return;
          }
          const target = document.querySelector<HTMLElement>(
            '[data-vendor-qualification-list-focus],main input[type="search"],main h1,[data-slot="page-header"] h1',
          );
          if (target) {
            if (!target.matches('input,button,a,[tabindex]'))
              target.setAttribute('tabindex', '-1');
            target.focus();
          }
        }),
      );
    });
  }, [
    allowNavigation,
    focusList,
    location.pathname,
    location.search,
    name,
    navigate,
    onMissing,
    t,
    toaster,
  ]);
  return null;
}

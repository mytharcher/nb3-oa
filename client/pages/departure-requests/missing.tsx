import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
/** Return to the owning tab/list, including direct child forms and stacked actions. */
function departureSourcePath(path: string) {
  const segments = path.split('/').filter(Boolean);
  const index = segments.findIndex((s) =>
    [
      'departureRequests',
      'departure',
      'editDeparture',
      'newDeparture',
    ].includes(s),
  );
  if (index < 0) return '/';
  return (
    '/' +
    segments
      .slice(0, index + (segments[index] === 'departureRequests' ? 1 : 0))
      .join('/')
  );
}
export function Missing({
  onMissing,
  focusList,
  name,
}: {
  onMissing?: () => void;
  focusList?: () => void;
  name?: string;
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
      title: name
        ? t('departureRequests.errors.missingReturned', { name })
        : t('departureRequests.errors.missingUnnamed'),
    });
    onMissing?.();
    void Promise.resolve(
      navigate(
        {
          pathname: departureSourcePath(location.pathname),
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
            '[data-departure-list-focus],main input[type="search"],main h1,[data-slot="page-header"] h1',
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

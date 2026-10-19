import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { NocoOaLogo } from '#components/brand-logo';
import {
  BRAND_MARK_PATH,
  BRAND_MARK_TRANSLATE,
  BRAND_MARK_VIEW_BOX,
} from '#components/brand-mark-geometry';

export interface AppBrandProps {
  readonly compact?: boolean;
}

export function AppBrand(inputProps: AppBrandProps): ReactElement {
  const { t } = useTranslation();
  const { compact = false } = inputProps;

  // The OA lockup uses the official small-size geometry; route navigation cannot configure shell branding.
  return (
    <Link
      aria-label={t('navigation.brandHome')}
      className='flex min-w-0 items-center text-foreground'
      to='/'
    >
      {compact ? (
        <span className='flex size-9 shrink-0 items-center justify-center'>
          <svg
            aria-hidden='true'
            viewBox={BRAND_MARK_VIEW_BOX}
            fill='currentColor'
            className='h-[18px] w-auto'
          >
            <g transform={BRAND_MARK_TRANSLATE}>
              <path d={BRAND_MARK_PATH} />
            </g>
          </svg>
        </span>
      ) : (
        <NocoOaLogo aria-hidden='true' className='h-[18px] w-auto shrink-0' />
      )}
    </Link>
  );
}

import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import type { ReactElement } from 'react';
import { TooltipProvider } from '#components/ui/tooltip';

import { ThemeSettings } from '../../theme/index.js';
import { UserMenu } from './user-menu.js';

/** The header's right-hand actions, shared by every authenticated page. */
export function HeaderActions(): ReactElement {
  const { t } = useTranslation();
  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
        <Button
          variant='ghost'
          size='icon'
          nativeButton={false}
          render={<Link to='/search' />}
          aria-label={t('globalSearch.title')}
        >
          <Search aria-hidden='true' />
        </Button>
        <ThemeSettings />
        <UserMenu />
      </div>
    </TooltipProvider>
  );
}

import {
  requestActionDefinitions,
  type RequestActionAvailability,
} from './request-action-definitions.js';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation } from 'react-router';
import { Button } from '#components/ui/button';

export function RequestActions({
  available,
  onSelect,
}: {
  available: RequestActionAvailability;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <div className='flex flex-wrap gap-3'>
      {requestActionDefinitions
        .filter(({ key }) => available[key])
        .map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            data-slot='request-action-card'
            variant='outline'
            size='lg'
            // Fixed targets align icons/labels on both the workbench and picker.
            className='h-16 w-full max-w-full sm:w-52 justify-start gap-3 px-4 text-left whitespace-normal has-data-[icon=inline-start]:pl-4'
            render={
              <Link
                to={{
                  pathname: to,
                  search: location.search,
                  hash: location.hash,
                }}
              />
            }
            nativeButton={false}
            onClick={onSelect}
          >
            <Icon data-icon='inline-start' aria-hidden='true' />
            <span className='min-w-0 break-words'>{t(label)}</span>
          </Button>
        ))}
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
import { useResource } from '../approvals/use-resource.js';
import type { ProbationRecord, ProbationDetail } from './types.js';

/** Load the current edit offer only when this menu opens; viewing a draft alone never grants editing. */
export function ProbationRowActions({
  record,
  disabled = false,
}: {
  record: ProbationRecord;
  disabled?: boolean;
}) {
  const { t } = useTranslation(),
    location = useLocation(),
    { session } = useAuthentication();
  const [open, setOpen] = useState(false);
  const resource = useResource<ProbationDetail>(
    open ? `probationRequests/${encodeURIComponent(record.id)}` : null,
    { viewer: session?.user.id ?? '' },
  );
  const editable =
    !disabled &&
    !resource.loading &&
    !resource.error &&
    resource.data?.view?.available.some((a) => a.name === 'edit' && a.allowed);
  const link = (pathname: string) => ({ pathname, search: location.search });
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip disabled={open}>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('probationRequests.rowActions', {
                    name: record.number ?? t('approvals.draft'),
                  })}
                />
              }
            />
          }
        >
          <MoreHorizontal />
        </TooltipTrigger>
        <TooltipContent>
          {t('probationRequests.rowActions', {
            name: record.number ?? t('approvals.draft'),
          })}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align='end'
        className='w-auto min-w-40 max-w-[min(var(--container-sm),var(--available-width))]'
      >
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to={link(record.id)} />}>
            {t('probationRequests.details')}
          </DropdownMenuItem>
          {editable ? (
            <DropdownMenuItem render={<Link to={link(`edit/${record.id}`)} />}>
              {t('probationRequests.edit')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

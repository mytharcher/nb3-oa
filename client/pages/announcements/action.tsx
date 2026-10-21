import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigationGuard, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { useRef } from 'react';
import { statusOf } from '../platform/shared/errors.js';
import { useAnnouncementResource, isDenied } from './resource.js';
import { useAnnouncementCommand } from './command.js';
import { Failure, Loading } from './states.js';
import {
  currentActions,
  resource,
  type Action,
  type Context,
  type Detail,
} from './types.js';
export default function AnnouncementAction() {
  const { announcementId } = useParams(),
    { t } = useTranslation(),
    location = useLocation(),
    navigate = useNavigate(),
    parent = useOutletContext<Context>(),
    toaster = useToaster();
  const action = location.pathname.split('/').at(-1) as Action,
    valid = ['publish', 'revoke', 'remind', 'confirm'].includes(action);
  const grant = useCan({ resource, action: valid ? action : 'view' }),
    r = useAnnouncementResource<{ data: Detail }>(
      valid ? `announcements/${encodeURIComponent(announcementId!)}` : null,
    ),
    command = useAnnouncementCommand(),
    finishedRef = useRef(false);
  const row = r.data?.data,
    allowed =
      valid &&
      grant.can &&
      !grant.isPending &&
      !grant.error &&
      !!row &&
      !r.loading &&
      !r.error &&
      currentActions(row).includes(action) &&
      !isDenied(command.error) &&
      statusOf(command.error) !== 409;
  useNavigationGuard(() => finishedRef.current || !command.busy);
  const closeTo = {
    pathname: '..',
    search: location.search,
    hash: location.hash,
  };
  async function perform() {
    if (!allowed || !row || !currentActions(row).includes(action)) return;

    const result = await command.execute<{
      data: import('./types.js').Announcement | import('./types.js').Receipt;
    }>(
      `announcements/${encodeURIComponent(row.id)}/${action}`,
      'POST',
      action === 'confirm' ? {} : { expectedVersion: row.version },
    );
    if (result) {
      finishedRef.current = true;
      if (action === 'confirm')
        parent.updateDetail?.({
          ...row,
          capabilities: {
            actions: [],
            ownReceipt: {
              status: 'confirmed',
              confirmedAt:
                'confirmedAt' in result.data ? result.data.confirmedAt : null,
            },
          },
        });
      else if ('body' in result.data)
        parent.updateDetail?.({
          ...row,
          ...result.data,
          capabilities: { ...row.capabilities, actions: [] },
        });
      parent.reload();
      toaster.show({
        type: 'success',
        title: t('announcements.done', { name: row.title }),
      });
      void navigate(closeTo, { replace: true });
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) void navigate(closeTo, { replace: true });
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('announcements.confirmTitle', {
              action: t(`announcements.actions.${valid ? action : 'confirm'}`),
              name: row?.title ?? t('announcements.title'),
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(`announcements.consequence.${valid ? action : 'confirm'}`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {r.error ? (
          <Failure error={r.error} retry={r.reload} />
        ) : r.loading ? (
          <Loading />
        ) : !allowed && !command.busy ? (
          <p>{t('announcements.unavailable')}</p>
        ) : null}
        {command.error ? (
          <>
            <Failure error={command.error} />
            {!isDenied(command.error) ? (
              <Button
                variant='outline'
                disabled={command.busy}
                onClick={() => {
                  command.clearError();
                  r.reload();
                }}
              >
                {t('announcements.loadLatest')}
              </Button>
            ) : null}
          </>
        ) : null}
        <AlertDialogFooter>
          <Button
            variant='outline'
            disabled={command.busy}
            onClick={() => {
              void navigate(closeTo, { replace: true });
            }}
          >
            {t('announcements.cancel')}
          </Button>
          <AlertDialogAction
            variant={action === 'revoke' ? 'destructive' : 'default'}
            disabled={command.busy || !allowed}
            onClick={(event) => {
              event.preventDefault();
              void perform();
            }}
          >
            {command.busy ? <Spinner /> : null}
            {t(`announcements.actions.${valid ? action : 'confirm'}`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

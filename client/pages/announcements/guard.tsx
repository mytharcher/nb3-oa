import type { useAnnouncementGuard } from './use-guard.js';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
export function AnnouncementDiscard({
  guard,
  name,
}: {
  guard: ReturnType<typeof useAnnouncementGuard>;
  name: string;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={guard.confirm}
      onOpenChange={(v) => {
        if (!v) guard.stay();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('announcements.discardNamed', { name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('announcements.discardDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('announcements.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={guard.discard}>
            {t('announcements.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

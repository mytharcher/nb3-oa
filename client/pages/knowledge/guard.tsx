import type { useKnowledgeGuard } from './use-guard.js';
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
export function KnowledgeDiscard({
  guard,
  name,
}: {
  guard: ReturnType<typeof useKnowledgeGuard>;
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
            {t('knowledge.discard')} — {name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('knowledge.discardDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('knowledge.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant='destructive' onClick={guard.discard}>
            {t('knowledge.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

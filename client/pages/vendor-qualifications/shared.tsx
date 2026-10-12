import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
export function Choice({
  label,
  value,
  items,
  onChange,
  disabled,
  id,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <Select
      value={value || null}
      items={items}
      disabled={disabled}
      onValueChange={(v) => onChange(v ?? '')}
    >
      <SelectTrigger id={id} aria-label={label} className='w-full sm:w-40'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function DiscardConfirmation({
  open,
  stay,
  discard,
}: {
  open: boolean;
  stay: () => void;
  discard: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) stay();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('approvals.discard')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('approvals.discardDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={stay}>
            {t('vendorQualifications.common.cancel')}
          </AlertDialogCancel>
          <Button variant='destructive' onClick={discard}>
            {t('approvals.discardConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

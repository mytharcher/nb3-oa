import { useTranslation } from '@nocobase/i18n/client';
import { Inbox, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '#components/ui/empty';

/** Shared empty surface; the owner supplies permission-aware creation or filter actions. */
export function ApplicationTableEmpty({
  title,
  description,
  clearFilters,
  action,
  icon,
}: {
  readonly title: ReactNode;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
  readonly description?: ReactNode;
  readonly clearFilters?: {
    readonly label: string;
    readonly onClick: () => void;
  };
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 gap-4 border border-dashed p-6'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          {icon ?? (clearFilters ? <SearchX /> : <Inbox />)}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {!clearFilters || description ? (
          <EmptyDescription className='max-w-md'>
            {description ?? t('dataTable.emptyDescription')}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
      {clearFilters ? (
        <Button
          type='button'
          variant='link'
          size='sm'
          onClick={clearFilters.onClick}
        >
          {clearFilters.label}
        </Button>
      ) : null}
    </Empty>
  );
}

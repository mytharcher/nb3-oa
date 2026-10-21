import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
/** Read-only employee and HR ledger subtables keep their empty surface compact. */
export function CompactEmpty({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <Empty className='min-h-40 p-6'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
    </Empty>
  );
}

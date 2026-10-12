import type { ReactNode } from 'react';
import { cn } from 'cn';

/** OA request lists keep initiation next to filters, including empty lists.
 * Actions stay together at the right; narrow screens wrap the filter group. */
export function ApplicationToolbar({
  children,
  actions,
  className,
}: {
  readonly children?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      data-slot='application-toolbar'
      className={cn('flex min-w-0 flex-wrap items-center gap-3', className)}
    >
      <div
        data-slot='application-filters'
        className='flex min-w-0 flex-1 basis-full flex-wrap items-center gap-2 sm:basis-auto'
      >
        {children}
      </div>
      <div
        data-slot='application-actions'
        className='ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2'
      >
        {actions}
      </div>
    </div>
  );
}

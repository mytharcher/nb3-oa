import type { ReactElement } from 'react';
import { cn } from 'cn';
import { RouteDrawer, type RouteDrawerProps } from './route-drawer.js';

/** All record details share one reading surface, including records with tabs and tables. */
export function RecordDetailDrawer({
  className,
  ...props
}: RouteDrawerProps): ReactElement {
  return (
    <RouteDrawer {...props} className={cn('text-sm sm:max-w-2xl', className)} />
  );
}

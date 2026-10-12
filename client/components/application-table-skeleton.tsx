import { ResponsiveTable as Table } from '#components/responsive-table';
import { useTranslation } from '@nocobase/i18n/client';
import { Skeleton } from '#components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

/** Mirrors the request table frame so loading does not change the page layout. */
export function ApplicationTableSkeleton({
  columns = 6,
}: {
  readonly columns?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className='min-w-0 overflow-hidden rounded-lg border'>
      <Table aria-label={t('status.loading')} aria-busy='true'>
        <TableHeader className='bg-muted/50'>
          <TableRow>
            {Array.from({ length: columns }, (_, i) => (
              <TableHead key={i}>
                <Skeleton className='h-4 w-20' />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, row) => (
            <TableRow key={row}>
              {Array.from({ length: columns }, (_, col) => (
                <TableCell key={col}>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

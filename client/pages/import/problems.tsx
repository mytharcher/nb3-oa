import { ResponsiveTable as Table } from '#components/responsive-table';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

import { useProblemText } from './problem-text.js';
import type { ImportRowError } from './types.js';

/**
 * Row, column and problem of each error, as checking or a failed import reported them. The list is capped by the
 * server (first 200); `total` above the shown count says so. The fixed `max-h-80` keeps hundreds of problems from
 * stretching the dialog or drawer; the table scrolls inside it.
 */
export function ProblemTable({
  errors,
  total,
}: {
  readonly errors: readonly ImportRowError[];
  readonly total: number;
}): ReactElement {
  const { t } = useTranslation();
  const text = useProblemText();
  // Problems have no identity of their own; their position in the server's report is stable.
  const items = errors.map((error, position) => ({
    error,
    id: String(position),
  }));
  return (
    <div className='flex flex-col gap-2'>
      <div className='max-h-80 overflow-auto rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-16'>{t('import.fields.row')}</TableHead>
              <TableHead className='w-32'>
                {t('import.fields.column')}
              </TableHead>
              <TableHead>{t('import.fields.problem')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(({ error, id }) => (
              <TableRow key={id}>
                <TableCell className='align-top tabular-nums'>
                  {error.row ?? '—'}
                </TableCell>
                <TableCell className='align-top'>
                  {error.header ?? t('import.report.wholeFile')}
                </TableCell>
                <TableCell className='align-top whitespace-normal wrap-anywhere'>
                  {text(error)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {total > errors.length ? (
        <p className='text-sm text-muted-foreground'>
          {t('import.report.truncated', { shown: errors.length, count: total })}
        </p>
      ) : null}
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  format,
  parseISO,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { Button } from '#components/ui/button';
import { Calendar } from '#components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { useIsMobile } from '#hooks/use-mobile';
import { useDatePickerLocale } from '#hooks/use-date-picker-locale';
export function ProcessDateRange({
  from,
  to,
  onChange,
  timeZone,
}: {
  timeZone?: string;
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) {
  const { t } = useTranslation(),
    mobile = useIsMobile(),
    locale = useDatePickerLocale();
  const [open, setOpen] = useState(false);
  const range: DateRange | undefined = from
    ? { from: parseISO(from), to: to ? parseISO(to) : undefined }
    : undefined;
  function apply(value: DateRange | undefined) {
    onChange(
      value?.from ? format(value.from, 'yyyy-MM-dd') : undefined,
      value?.to ? format(value.to, 'yyyy-MM-dd') : undefined,
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant='outline' />}>
        <CalendarDays />
        {from
          ? `${from}${to ? ` – ${to}` : ''}`
          : t('processManagement.dateRange')}
      </PopoverTrigger>
      <PopoverContent
        className='flex w-auto max-w-[calc(100vw-2rem)] flex-col gap-2 sm:flex-row'
        align='start'
      >
        <div className='flex flex-wrap gap-1 sm:flex-col'>
          {(
            ['last7', 'last30', 'last90', 'thisMonth', 'lastMonth'] as const
          ).map((key, i) => (
            <Button
              key={key}
              variant='ghost'
              onClick={() => {
                const today = new Intl.DateTimeFormat('en-CA', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  timeZone,
                }).format(new Date());
                const now = parseISO(today),
                  last = subMonths(now, 1);
                const selected =
                  i < 3
                    ? { from: subDays(now, [6, 29, 89][i]), to: now }
                    : i === 3
                      ? { from: startOfMonth(now), to: endOfMonth(now) }
                      : { from: startOfMonth(last), to: endOfMonth(last) };
                apply(selected);
                setOpen(false);
              }}
            >
              {t(`processManagement.${key}`)}
            </Button>
          ))}
        </div>
        <Calendar
          mode='range'
          selected={range}
          onSelect={apply}
          numberOfMonths={mobile ? 1 : 2}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  );
}

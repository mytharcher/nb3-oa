import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { DatePicker } from '#components/date-picker';
import { Input } from '#components/ui/input';
import { parts, zonedDateTime } from './date-time-picker-zone.js';
export function DateTimePicker({
  id,
  value,
  onChange,
  timeZone,
  date: fixedDate,
  disabled,
  invalid,
  timeLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  timeZone: string;
  date?: string;
  disabled?: boolean;
  invalid?: boolean;
  timeLabel: string;
}) {
  const { t } = useTranslation();
  const [invalidWallTime, setInvalidWallTime] = useState(false);
  const current =
    value && Number.isFinite(Date.parse(value))
      ? parts(value, timeZone)
      : undefined;
  const date = fixedDate ?? current?.date;
  return (
    <div className='flex flex-wrap gap-2'>
      <DatePicker
        id={id}
        value={date ? parseISO(date) : undefined}
        onChange={(day) =>
          onChange(
            day
              ? (zonedDateTime(
                  format(day, 'yyyy-MM-dd'),
                  current?.time ?? '00:00',
                  timeZone,
                ) ?? '')
              : '',
          )
        }
        disabled={disabled || !!fixedDate}
        invalid={invalid}
      />
      <Input
        type='time'
        step={60}
        aria-label={timeLabel}
        className='w-full sm:w-40'
        value={current?.time ?? ''}
        disabled={disabled || !date}
        aria-invalid={invalid || invalidWallTime}
        aria-describedby={`${id}-time-policy`}
        onChange={(event) => {
          const next =
            date && event.target.value
              ? zonedDateTime(date, event.target.value, timeZone)
              : undefined;
          setInvalidWallTime(!!event.target.value && !next);
          onChange(next ?? '');
        }}
      />
      <p
        id={`${id}-time-policy`}
        className='w-full text-sm text-muted-foreground'
        role={invalidWallTime ? 'alert' : undefined}
      >
        {t(
          invalidWallTime
            ? 'outings.nonexistentTime'
            : 'outings.daylightSavingPolicy',
        )}
      </p>
    </div>
  );
}

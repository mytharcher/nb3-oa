import { useEffect, useState, type ReactElement } from 'react';
export function RelativeReviewTime({
  value,
  locale,
}: {
  value: string;
  locale: string;
}): ReactElement {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const seconds = (new Date(value).getTime() - now) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  const [unit, size] =
    units.find(([, size]) => Math.abs(seconds) >= size) ??
    units[units.length - 1];
  return (
    <time
      dateTime={value}
      title={new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))}
    >
      {new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round(seconds / size),
        unit,
      )}
    </time>
  );
}

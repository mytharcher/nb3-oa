/** Map company wall time to an instant and refuse a nonexistent DST wall time. */
export function zonedDateTime(
  date: string,
  time: string,
  zone: string,
): string | undefined {
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall)) return undefined;
  const candidates = new Set<number>();
  for (const hours of [-12, 0, 12]) {
    const near = new Date(wall + hours * 3600_000);
    const p = parts(near.toISOString(), zone);
    const asUtc = Date.parse(`${p.date}T${p.time}:00Z`);
    const offset = asUtc - Math.floor(near.getTime() / 60000) * 60000;
    candidates.add(wall - offset);
  }
  // Ambiguous autumn times use the earlier occurrence; the displayed ISO value is preserved on later edits.
  for (const candidate of [...candidates].sort((a, b) => a - b)) {
    const p = parts(new Date(candidate).toISOString(), zone);
    if (p.date === date && p.time === time)
      return new Date(candidate).toISOString();
  }
  return undefined;
}
export function parts(value: string, zone: string) {
  const instant = new Date(value);
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const get = (kind: string) => p.find((p) => p.type === kind)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

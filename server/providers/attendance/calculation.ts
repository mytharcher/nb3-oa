/** Business-time interval arithmetic. Instants are UTC milliseconds; callers resolve local clocks. */
export interface AttendanceInterval {
  start: number;
  end: number;
}
export interface EffectivePunch {
  id: string;
  kind: 'in' | 'out';
  at: number | null;
  date: string;
  expectedAt?: number;
  syntheticMissing?: boolean;
}
export interface DailyAttendanceResult {
  status: 'normal' | 'exception' | 'blocked' | 'rest';
  reasons: string[];
  lateMinutes: number;
  earlyMinutes: number;
  missingPunches: number;
  absentMinutes: number;
  missingEndpoints: { kind: 'in' | 'out'; at: number }[];
}

export function subtractAttendanceExemptions(
  shifts: readonly AttendanceInterval[],
  exemptions: readonly AttendanceInterval[],
): AttendanceInterval[] {
  return shifts.flatMap((shift) => {
    let parts = [{ ...shift }];
    for (const exemption of exemptions) {
      parts = parts.flatMap((part) => {
        if (exemption.end <= part.start || exemption.start >= part.end)
          return [part];
        return [
          ...(exemption.start > part.start
            ? [{ start: part.start, end: exemption.start }]
            : []),
          ...(exemption.end < part.end
            ? [{ start: exemption.end, end: part.end }]
            : []),
        ];
      });
    }
    return parts;
  });
}

/** Each segment requires its own in/out. Ambiguous evidence is never silently resolved. */
export function calculateAttendance(input: {
  shifts: readonly AttendanceInterval[];
  exemptions: readonly AttendanceInterval[];
  punches: readonly EffectivePunch[];
  localDate: (instant: number) => string;
  lateToleranceMinutes: number;
  earlyToleranceMinutes: number;
  absenceThresholdMinutes: number;
}): DailyAttendanceResult {
  const result: DailyAttendanceResult = {
    status: 'normal',
    reasons: [],
    lateMinutes: 0,
    earlyMinutes: 0,
    missingPunches: 0,
    absentMinutes: 0,
    missingEndpoints: [],
  };
  const block = (reason: string) => {
    result.status = 'blocked';
    result.reasons = [reason];
    return result;
  };
  if (
    [...input.shifts, ...input.exemptions].some(
      (part) =>
        !Number.isFinite(part.start) ||
        !Number.isFinite(part.end) ||
        part.end <= part.start,
    ) ||
    input.shifts.some(
      (part, i) => i > 0 && part.start < input.shifts[i - 1].end,
    )
  )
    return block('invalidActivityTime');
  const required = subtractAttendanceExemptions(input.shifts, input.exemptions);
  const missingPlaceholders = new Set<string>();
  for (let i = 0; i < required.length; i++) {
    const part = required[i];
    const previousEnd = required[i - 1]?.end ?? -Infinity;
    const nextStart = required[i + 1]?.start ?? Infinity;
    const candidates = (kind: 'in' | 'out') =>
      input.punches.filter((punch) => {
        if (punch.kind !== kind) return false;
        const date = input.localDate(kind === 'in' ? part.start : part.end);
        if (punch.date !== date) return false;
        // A date-only missing fact cannot be allocated across multiple endpoints.
        if (punch.at === null)
          return (
            punch.expectedAt === undefined ||
            punch.expectedAt === (kind === 'in' ? part.start : part.end)
          );
        if (!Number.isFinite(punch.at) || input.localDate(punch.at) !== date)
          return false;
        return kind === 'in'
          ? punch.at >= previousEnd && punch.at < part.end
          : punch.at > part.start && punch.at <= nextStart;
      });
    const resolved = (kind: 'in' | 'out') => {
      const all = candidates(kind);
      return all.some((p) => p.at !== null)
        ? all.filter((p) => !p.syntheticMissing || p.at !== null)
        : all;
    };
    const ins = resolved('in');
    const outs = resolved('out');
    if (ins.length > 1 || outs.length > 1)
      return block('ambiguousPunchEvidence');
    for (const punch of [...ins, ...outs]) {
      if (punch.at !== null) continue;
      if (missingPlaceholders.has(punch.id))
        return block('ambiguousPunchEvidence');
      missingPlaceholders.add(punch.id);
    }
    const inAt = ins[0]?.at;
    const outAt = outs[0]?.at;
    if (inAt != null && outAt != null && inAt >= outAt)
      return block('invalidPunchOrder');
    if (inAt == null)
      result.missingEndpoints.push({ kind: 'in', at: part.start });
    if (outAt == null)
      result.missingEndpoints.push({ kind: 'out', at: part.end });
    const missing = Number(inAt == null) + Number(outAt == null);
    const late = inAt == null ? 0 : Math.max(0, (inAt - part.start) / 60000);
    const early = outAt == null ? 0 : Math.max(0, (part.end - outAt) / 60000);
    result.missingPunches += missing;
    result.lateMinutes += late;
    result.earlyMinutes += early;
    if (late > input.lateToleranceMinutes) result.reasons.push('late');
    if (early > input.earlyToleranceMinutes) result.reasons.push('early');
    if (missing === 2) result.absentMinutes += (part.end - part.start) / 60000;
  }
  if (result.missingPunches) result.reasons.push('missingPunch');
  if (result.absentMinutes >= input.absenceThresholdMinutes)
    result.reasons.push('absent');
  else result.absentMinutes = 0;
  result.reasons = [...new Set(result.reasons)];
  result.status = result.reasons.length ? 'exception' : 'normal';
  return result;
}

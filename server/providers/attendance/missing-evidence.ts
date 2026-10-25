import type { DatabaseConnection } from '@nocobase/db';
import type { CalendarService } from '../platform/calendar.js';
import type { AttendanceRecord } from './contract.js';
import type {
  AttendanceEvaluation,
  AttendanceEvaluationRevision,
} from './evaluation-contract.js';
import { subtractAttendanceExemptions } from './calculation.js';
/**
 * Synthetic missing facts remain historical evidence after real device data arrives.
 * Matching mirrors the evaluator: punches carry their physical local date, so an
 * overnight endpoint (e.g. 06:00 next day) is matched on that endpoint's own date.
 */
export async function isMissingAttendanceEffective(
  record: AttendanceRecord,
  connection: DatabaseConnection,
  calendar: CalendarService,
): Promise<boolean> {
  if (record.status !== 'missing') return false;
  if (record.source !== 'oa-evaluation') return true;
  const date = record.sourceData.evaluationDate,
    expectedAt = record.sourceData.expectedAt;
  if (typeof date !== 'string' || typeof expectedAt !== 'string') return false;
  const pointer = await connection
    .repository<AttendanceEvaluation>('attendanceEvaluations')
    .findOne({
      filter: (f) =>
        f.and([f.string('userId').eq(record.userId), f.date('date').on(date)]),
    });
  const revision = pointer
    ? await connection
        .repository<AttendanceEvaluationRevision>(
          'attendanceEvaluationRevisions',
        )
        .findOne({ filter: { id: pointer.currentRevisionId } })
    : undefined;
  if (!revision || revision.result.status !== 'exception') return false;
  const intervals = revision.snapshot.intervals as
    { startAt: string; endAt: string }[] | undefined;
  const exemptions = revision.snapshot.approvedExemptions as
    { start: number; end: number }[] | undefined;
  if (!intervals) return false;
  const parts = subtractAttendanceExemptions(
    intervals.map((part) => ({
      start: Date.parse(part.startAt),
      end: Date.parse(part.endAt),
    })),
    exemptions ?? [],
  );
  const endpoint = Date.parse(expectedAt),
    index = parts.findIndex(
      (part) =>
        (record.punchKind === 'in' ? part.start : part.end) === endpoint,
    );
  if (index < 0) return false;
  const part = parts[index];
  const candidates = await connection
    .repository<AttendanceRecord>('attendanceRecords')
    .findMany({
      filter: (f) =>
        f.and([
          f.string('userId').eq(record.userId),
          f.date('date').on(record.date),
          f.string('punchKind').eq(record.punchKind),
        ]),
    });
  for (const candidate of candidates) {
    if (candidate.id === record.id || candidate.status === 'missing') continue;
    // Mirror the evaluator: a WeCom punch counts only for its owning work date.
    if (
      candidate.source === 'wecom-checkin' &&
      candidate.sourceData.workDate !== date
    )
      continue;
    let punchedAt = candidate.punchedAt;
    if (candidate.status === 'corrected') {
      const correction = await connection
        .repository('attendanceCorrections')
        .findOne({
          filter: {
            originalId: candidate.id,
            applicationId: candidate.correctedByRequestId,
          },
        });
      punchedAt =
        typeof correction?.punchedAt === 'string' ? correction.punchedAt : null;
    }
    if (!punchedAt) continue;
    const at = Date.parse(punchedAt);
    if (calendar.localDate(new Date(at)) !== record.date) continue;
    if (
      record.punchKind === 'in'
        ? at >= (parts[index - 1]?.end ?? -Infinity) && at < part.end
        : at > part.start && at <= (parts[index + 1]?.start ?? Infinity)
    )
      return false;
  }
  return true;
}

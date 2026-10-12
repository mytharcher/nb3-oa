import { describe, expect, it } from 'vitest';
import { zonedDateTime } from '../../../client/components/date-time-picker-zone.js';
describe('company date-time conversion', () => {
  it('ignores browser local timezone and uses company offset', () => {
    expect(zonedDateTime('2026-10-11', '09:15', 'Asia/Shanghai')).toBe(
      '2026-10-11T01:15:00.000Z',
    );
  });
  it('rejects nonexistent daylight-saving wall time and deterministically resolves an autumn repeat', () => {
    expect(
      zonedDateTime('2026-03-08', '02:30', 'America/New_York'),
    ).toBeUndefined();
    expect(zonedDateTime('2026-11-01', '01:30', 'America/New_York')).toBe(
      '2026-11-01T05:30:00.000Z',
    );
  });
});

// @vitest-environment node
import { expect } from 'vitest';
import {
  calendarServiceToken,
  ruleServiceToken,
} from '../../../server/providers/platform/index.ts';
import { createPlatformAppTest } from './helpers.ts';
const test = createPlatformAppTest();
test('public booking conversion follows the reloaded company rule without changing working-hour arithmetic', async ({
  app,
}) => {
  const calendar = app.container.resolve(calendarServiceToken);
  expect(
    calendar.resolveLocalDateTime('2026-10-11', '09:00').toISOString(),
  ).toBe('2026-10-11T01:00:00.000Z');
  await app.container
    .resolve(ruleServiceToken)
    .set({
      key: 'calendar.timeZone',
      value: 'America/New_York',
      actorId: null,
      note: 'Booking timezone proof',
    });
  await calendar.reload();
  expect(
    calendar.resolveLocalDateTime('2026-10-11', '09:00').toISOString(),
  ).toBe('2026-10-11T13:00:00.000Z');
  expect(() => calendar.resolveLocalDateTime('2026-11-01', '01:30')).toThrow(
    RangeError,
  );
  expect(() => calendar.resolveLocalDateTime('2026-03-08', '02:30')).toThrow(
    RangeError,
  );
});

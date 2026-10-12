import { randomUUID } from 'node:crypto';
import { instantOfLocal, dayNumberOf } from '../platform/time-zone.js';
import type { DatabaseConnection, RepositoryRecord } from '@nocobase/db';
import type { LeaveBalanceService } from '../leave-balances/contract.js';
import type { CalendarService } from '../platform/index.js';

export interface MinuteLot extends RepositoryRecord {
  id: string;
  employeeId: string;
  applicationId: string;
  originalMinutes: number;
  remainingMinutes: number;
  expiredMinutes: number;
  expiresAt: string;
  createdAt: string;
}
/** Three calendar months, clamped at month end, expiring after the final local day. */
export function expiryDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const last = new Date(Date.UTC(year, month + 3, 0)).getUTCDate();
  return new Date(Date.UTC(year, month + 2, Math.min(day, last)))
    .toISOString()
    .slice(0, 10);
}
export function expiryInstant(
  date: string,
  calendar: Pick<CalendarService, 'timeZone'>,
): Date {
  return new Date(
    instantOfLocal(calendar.timeZone(), dayNumberOf(date) + 1, 0),
  );
}
/** Preserve expired source facts while clearing only their unconverted remainder. Caller holds the applicant lock. */
export async function expireCompensatoryMinutes(
  employeeId: string,
  now: Date,
  connection: DatabaseConnection,
): Promise<number> {
  const repository = connection.repository<MinuteLot>('overtimeMinuteLots');
  const rows = await repository.findMany({ filter: { employeeId } });
  let count = 0;
  for (const row of rows) {
    if (
      Number(row.remainingMinutes) <= 0 ||
      Date.parse(row.expiresAt) > now.getTime()
    )
      continue;
    await repository.updateOne({
      filter: { id: row.id },
      values: {
        remainingMinutes: 0,
        expiredMinutes:
          Number(row.expiredMinutes) + Number(row.remainingMinutes),
      },
    });
    count++;
  }
  return count;
}
/** Caller must hold the applicant user lock; every consumed source remains persisted for audit. */
export async function settleCompensatoryMinutes(
  input: {
    employeeId: string;
    recordId: string;
    date: string;
    minutes: number;
    now: Date;
  },
  connection: DatabaseConnection,
  balances: LeaveBalanceService,
  calendar: CalendarService,
): Promise<void> {
  const repository = connection.repository<MinuteLot>('overtimeMinuteLots');
  if (await repository.findOne({ filter: { applicationId: input.recordId } }))
    return;
  await repository.createOne({
    values: {
      id: randomUUID(),
      employeeId: input.employeeId,
      applicationId: input.recordId,
      originalMinutes: input.minutes,
      remainingMinutes: input.minutes,
      expiredMinutes: 0,
      expiresAt: expiryInstant(expiryDate(input.date), calendar).toISOString(),
      createdAt: input.now.toISOString(),
    },
  });
  const lots = (
    await repository.findMany({ filter: { employeeId: input.employeeId } })
  )
    .filter(
      (lot) =>
        Number(lot.remainingMinutes) > 0 &&
        Date.parse(lot.expiresAt) > input.now.getTime(),
    )
    .sort(
      (a, b) =>
        a.expiresAt.localeCompare(b.expiresAt) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
  let index = 0;
  let unit = 0;
  while (
    lots.reduce((sum, lot) => sum + Number(lot.remainingMinutes), 0) >= 240
  ) {
    let needed = 240;
    const expiresAt = new Date(lots[index].expiresAt);
    const sources: { lotId: string; minutes: number }[] = [];
    while (needed > 0) {
      const lot = lots[index];
      const consumed = Math.min(needed, Number(lot.remainingMinutes));
      lot.remainingMinutes -= consumed;
      needed -= consumed;
      sources.push({ lotId: lot.id, minutes: consumed });
      await repository.updateOne({
        filter: { id: lot.id },
        values: { remainingMinutes: lot.remainingMinutes },
      });
      if (lot.remainingMinutes === 0) index++;
    }
    const reference = `overtime:${input.recordId}:${unit++}`;
    await balances.grant(
      {
        employeeId: input.employeeId,
        leaveType: 'compensatory',
        units: 1,
        reference,
        requestKey: reference,
        expiresAt,
        at: input.now,
        reason: 'Approved overtime',
      },
      connection,
    );
    await connection.repository('overtimeMinuteConversions').createOne({
      values: {
        id: randomUUID(),
        applicationId: input.recordId,
        reference,
        sources,
        expiresAt: expiresAt.toISOString(),
        createdAt: input.now.toISOString(),
      },
    });
  }
}

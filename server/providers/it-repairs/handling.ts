import type { CalendarSnapshot } from '../platform/frozen-calendar.js';
import { FrozenCalendar } from '../platform/frozen-calendar.js';
import type { Repair } from './service.js';
export const STATES = [
  'draft',
  'triage',
  'supplement',
  'pool',
  'assigned',
  'processing',
  'waiting',
  'acceptance',
  'closed',
  'cancelled',
] as const;
export const OPEN = STATES.filter(
  (s) => !['draft', 'closed', 'cancelled'].includes(s),
);
export const ACTIONS = [
  'requestSupplement',
  'supplement',
  'triage',
  'assign',
  'claim',
  'release',
  'start',
  'comment',
  'internal',
  'wait',
  'approvePause',
  'resume',
  'resolve',
  'accept',
  'return',
  'rate',
  'cancel',
  'reviewCancel',
  'duplicate',
  'manageClose',
  'priority',
  'link',
] as const;
export type Action = (typeof ACTIONS)[number];
export interface Processing {
  [key: string]: string | number | boolean | string[] | null | undefined;
  firstResponseAt?: string;
  runningSince?: string | null;
  consumedHours?: number;
  pausedHours?: number;
  acceptanceHours?: number;
  waitHours?: number;
  pauseSince?: string | null;
  waitSince?: string | null;
  acceptanceSince?: string | null;
  acceptanceDueAt?: string | null;
  followUpAt?: string | null;
  waitingParty?: string;
  pauseRequested?: boolean;
  cancelPending?: boolean;
  cancelReason?: string;
  cancelFollowUpAt?: string | null;
  closedAt?: string;
  closureMode?: 'user' | 'management';
  rating?: number;
  evaluation?: string;
  round?: number;
  duplicateId?: string;
  alerted?: string[];
}
/** Explicit edges, including self transitions only where a business action needs one. */
export function edges() {
  const result: Record<string, { from: string; to: string; accept: string[] }> =
    {};
  const add = (action: string, from: string, to: string) => {
    result[`${action}_${from}_${to}`] = {
      from,
      to,
      accept: [
        'processing',
        'assigneeId',
        'groupId',
        'category',
        'priority',
        'responseDueAt',
        'resolutionDueAt',
        'nextDueAt',
        'updatedAt',
      ],
    };
  };
  add('requestSupplement', 'triage', 'supplement');
  add('supplement', 'supplement', 'triage');
  for (const to of ['pool', 'assigned']) add('triage', 'triage', to);
  for (const from of ['pool', 'assigned', 'processing', 'waiting'])
    add('assign', from, from === 'pool' ? 'assigned' : from);
  add('claim', 'pool', 'assigned');
  add('release', 'assigned', 'pool');
  add('start', 'assigned', 'processing');
  add('wait', 'processing', 'waiting');
  add('resume', 'waiting', 'processing');
  add('approvePause', 'waiting', 'waiting');
  add('resolve', 'processing', 'acceptance');
  add('accept', 'acceptance', 'closed');
  add('return', 'acceptance', 'processing');
  add('return', 'acceptance', 'triage');
  add('rate', 'closed', 'closed');
  for (const s of OPEN) {
    for (const a of [
      'comment',
      'internal',
      'priority',
      'upload',
      'uploadInternal',
      'link',
    ])
      add(a, s, s);
    add(
      'cancel',
      s,
      ['triage', 'supplement', 'pool'].includes(s) ? 'cancelled' : s,
    );
    for (const to of [s, 'cancelled']) add('reviewCancel', s, to);
    add('manageClose', s, 'closed');
    for (const action of ['timer', 'alert', 'sourceProgress', 'routing'])
      add(action, s, s);
  }
  for (const s of ['triage', 'pool']) add('duplicate', s, 'cancelled');
  return result;
}
export function clock(row: Repair, at: Date) {
  const p = row.processing ?? {};
  const cal = new FrozenCalendar(
    row.calendarSnapshot as unknown as CalendarSnapshot,
  );
  const since = p.runningSince === undefined ? row.submittedAt : p.runningSince;
  const consumed =
    (p.consumedHours ?? 0) +
    (since ? cal.workingHoursBetween(new Date(since), at) : 0);
  return {
    p: structuredClone(p),
    cal,
    consumed,
    response: cal.workingHoursBetween(
      new Date(row.submittedAt!),
      new Date(p.firstResponseAt ?? at),
    ),
    paused:
      (p.pausedHours ?? 0) +
      (p.pauseSince ? cal.workingHoursBetween(new Date(p.pauseSince), at) : 0),
    acceptance:
      (p.acceptanceHours ?? 0) +
      (p.acceptanceSince
        ? cal.workingHoursBetween(new Date(p.acceptanceSince), at)
        : 0),
    waiting:
      (p.waitHours ?? 0) +
      (p.waitSince ? cal.workingHoursBetween(new Date(p.waitSince), at) : 0),
  };
}
export function deadlines(row: Repair, p: Processing, at: Date) {
  const candidate = { ...row, processing: p } as Repair;
  const { cal, consumed } = clock(candidate, at);
  const rules = (row.ruleSnapshot as { values: Record<string, number> }).values;
  const responseTarget = Number(rules[`itRepair.${row.priority}.response`]);
  const resolutionTarget = Number(rules[`itRepair.${row.priority}.resolution`]);
  const responseDueAt = cal
    .addWorkingHours(new Date(row.submittedAt!), responseTarget)
    .toISOString();
  const resolutionDueAt =
    p.runningSince === null
      ? null
      : cal
          .addWorkingHours(
            new Date(p.runningSince ?? row.submittedAt!),
            Math.max(0, resolutionTarget - (p.consumedHours ?? 0)),
          )
          .toISOString();
  const due: Date[] = [];
  const alerted = p.alerted ?? [];
  if (!p.firstResponseAt) {
    for (const [name, ratio] of [
      ['response80', 0.8],
      ['responseOverdue', 1],
    ] as const)
      if (!alerted.includes(name))
        due.push(
          cal.addWorkingHours(
            new Date(row.submittedAt!),
            responseTarget * ratio,
          ),
        );
  }
  if (p.runningSince !== null) {
    for (const [name, ratio] of [
      ['resolution80', 0.8],
      ['resolutionOverdue', 1],
    ] as const)
      if (!alerted.includes(name))
        due.push(
          cal.addWorkingHours(
            at,
            Math.max(0, resolutionTarget * ratio - consumed),
          ),
        );
  }
  if (p.followUpAt) due.push(new Date(p.followUpAt));
  if (p.cancelPending && p.cancelFollowUpAt)
    due.push(new Date(p.cancelFollowUpAt));
  if (p.acceptanceDueAt && !alerted.includes(`acceptance:${p.round ?? 0}`))
    due.push(new Date(p.acceptanceDueAt));
  // At most one daily reminder per frozen local date, until the incomplete metric finishes.
  if (
    (!p.firstResponseAt && alerted.includes('responseOverdue')) ||
    (p.runningSince !== null && alerted.includes('resolutionOverdue'))
  )
    due.push(cal.addWorkingHours(at, 8));
  return {
    responseDueAt,
    resolutionDueAt,
    nextDueAt: ['closed', 'cancelled'].includes(row.status)
      ? null
      : due.length
        ? new Date(Math.min(...due.map(Number))).toISOString()
        : null,
  };
}

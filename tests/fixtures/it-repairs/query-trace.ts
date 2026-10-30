import { AsyncLocalStorage } from 'node:async_hooks';
import { performance } from 'node:perf_hooks';
import type { Knex } from 'knex';

type Event = {
  who: string;
  kind: 'pool' | 'sql' | 'request' | 'gate';
  start: number;
  end: number;
  sql?: string;
  error?: string;
};
type Query = { sql: string; __knexQueryUid?: string; __knexTxId?: string };
const queryKey = (q: Query) => q.__knexQueryUid ?? `${q.__knexTxId}:${q.sql}`;
/** Isolated test diagnostics only. SQL bindings, cookies and payloads are never captured. */
export function traceQueries(native: Knex) {
  const context = new AsyncLocalStorage<string>(),
    events: Event[] = [],
    pending = new Map<string, Omit<Event, 'end'>>();
  const original = native.client.acquireConnection;
  native.client.acquireConnection = async function () {
    const who = context.getStore(),
      start = performance.now();
    try {
      return await original.call(this);
    } finally {
      if (who)
        events.push({ who, kind: 'pool', start, end: performance.now() });
    }
  };
  const query = (q: Query) => {
    const who = context.getStore();
    if (who)
      pending.set(queryKey(q), {
        who,
        kind: 'sql',
        sql: q.sql,
        start: performance.now(),
      });
  };
  const done = (q: Query, error?: string) => {
    const e = pending.get(queryKey(q));
    if (e) {
      events.push({
        ...e,
        end: performance.now(),
        ...(error ? { error } : {}),
      });
      pending.delete(queryKey(q));
    }
  };
  const response = (_: unknown, q: Query) => done(q),
    failure = (e: { code?: string }, q: Query) => done(q, e.code ?? 'UNKNOWN');
  native.on('query', query);
  native.on('query-response', response);
  native.on('query-error', failure);
  function category(e: Event) {
    if (e.kind === 'pool') return 'connectionAcquisition';
    if (e.kind === 'gate') return 'controlledGate';
    if (/for (share|update)/i.test(e.sql ?? '')) return 'lockStatement';
    if (
      /pg_catalog|information_schema|__?collections|__?fields|__?relations|__?indexes/.test(
        e.sql ?? '',
      )
    )
      return 'structure';
    if (
      /"user"|"employees"|"departments"|department_members|duty_role|authorization_|"session"/.test(
        e.sql ?? '',
      )
    )
      return 'identityAuthorization';
    if (/lifecycle|notification|queue|jobs|in_app/.test(e.sql ?? ''))
      return 'lifecycleNotificationQueue';
    return 'businessOtherSql';
  }
  const priority = [
    'controlledGate',
    'connectionAcquisition',
    'lockStatement',
    'structure',
    'identityAuthorization',
    'lifecycleNotificationQueue',
    'businessOtherSql',
  ] as const;
  return {
    async request<T>(who: string, work: () => Promise<T>) {
      return context.run(who, async () => {
        const start = performance.now();
        try {
          return await work();
        } finally {
          events.push({ who, kind: 'request', start, end: performance.now() });
        }
      });
    },
    gate(start: number) {
      events.push({
        who: 'configuration',
        kind: 'gate',
        start,
        end: performance.now(),
      });
    },
    snapshot() {
      const requests = events
        .filter((e) => e.kind === 'request')
        .map((r) => {
          const spans = events.filter(
            (e) =>
              e.who === r.who &&
              e.kind !== 'request' &&
              e.start < r.end &&
              e.end > r.start,
          );
          const points = [
            ...new Set([
              r.start,
              r.end,
              ...spans.flatMap((e) => [
                Math.max(r.start, e.start),
                Math.min(r.end, e.end),
              ]),
            ]),
          ].sort((a, b) => a - b);
          const phases: Record<string, number> = {};
          for (let i = 1; i < points.length; i++) {
            const active = spans
              .filter((e) => e.start < points[i] && e.end > points[i - 1])
              .map(category);
            const kind =
              priority.find((k) => active.includes(k)) ?? 'unattributed';
            phases[kind] = (phases[kind] ?? 0) + points[i] - points[i - 1];
          }
          const sql = spans.filter((e) => e.kind === 'sql');
          return {
            who: r.who,
            ms: r.end - r.start,
            sqlCount:
              sql.length +
              [...pending.values()].filter(
                (e) => e.who === r.who && e.start >= r.start && e.start < r.end,
              ).length,
            completedSqlCount: sql.length,
            serializationErrors: sql.filter((e) => e.error === '40001').length,
            phases,
          };
        });
      return { requests, events, unfinished: [...pending.values()] };
    },
    stop() {
      native.client.acquireConnection = original;
      native.off('query', query);
      native.off('query-response', response);
      native.off('query-error', failure);
    },
  };
}

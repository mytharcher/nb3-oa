import type { Knex } from 'knex';
import type {
  DatabaseConnection,
  DatabaseManager,
  FilterBuilder,
  FilterNode,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import type { Repair, Group } from './service.js';
import { clock } from './handling.js';
import { readableSearchField } from '../request-search/owned-source.js';

export const METRIC_FIELDS = [
  'metricRevision',
  'firstRespondedAt',
  'metricEndedAt',
  'closureMode',
  'responseHours',
  'responseOnTime',
  'solutionHours',
  'solutionOnTime',
  'solutionExceeded',
  'waitingHours',
  'pausedHours',
  'acceptanceHours',
  'totalHours',
  'naturalHours',
  'everResponseOverdue',
  'everSolutionOverdue',
  'returnCount',
  'rating',
] as const;
export const SUMMARY_FIELDS = [
  'id',
  'requesterId',
  'number',
  'title',
  'status',
  'version',
  'category',
  'priority',
  'groupId',
  'assigneeId',
  'createdAt',
  'updatedAt',
  'submittedAt',
  'responseDueAt',
  'resolutionDueAt',
] as const;
export interface RepairQuery {
  q?: string;
  status?: string;
  groupId?: string;
  assigneeId?: string;
  category?: string;
  priority?: string;
  from?: string;
  to?: string;
  dateField?: string;
  overdue?: string;
  cohort?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}
export function metricsOf(row: Repair, at: Date): RepositoryRecord {
  if (!row.submittedAt || row.status === 'draft') return { metricRevision: 1 };
  const p = row.processing ?? {},
    end = ['closed', 'cancelled'].includes(row.status)
      ? new Date(
          p.closedAt ??
            (row.statusChangedAt instanceof Date ||
            typeof row.statusChangedAt === 'string'
              ? row.statusChangedAt
              : row.updatedAt),
        )
      : at;
  const { response, consumed, waiting, paused, acceptance, cal } = clock(
    row,
    end,
  );
  const rules = (row.ruleSnapshot as { values: Record<string, number> }).values;
  const responseTarget =
    p.responseTargetHours ??
    cal.workingHoursBetween(
      new Date(row.submittedAt),
      new Date(row.responseDueAt!),
    );
  const solutionTarget =
    p.resolutionTargetHours ??
    Number(rules[`itRepair.${row.priority}.resolution`]);
  return {
    metricRevision: 1,
    firstRespondedAt: p.firstResponseAt ? new Date(p.firstResponseAt) : null,
    metricEndedAt: ['closed', 'cancelled'].includes(row.status) ? end : null,
    closureMode:
      row.status === 'cancelled' ? 'cancelled' : (p.closureMode ?? null),
    responseHours: p.firstResponseAt ? response : null,
    responseOnTime: p.firstResponseAt ? response <= responseTarget : null,
    solutionHours: consumed,
    solutionOnTime: consumed <= solutionTarget,
    solutionExceeded: consumed >= solutionTarget,
    waitingHours: waiting,
    pausedHours: paused,
    acceptanceHours: acceptance,
    totalHours: cal.workingHoursBetween(new Date(row.submittedAt), end),
    naturalHours: Math.max(0, (+end - +new Date(row.submittedAt)) / 3600000),
    everResponseOverdue: p.alerted?.includes('responseOverdue') ?? false,
    everSolutionOverdue: p.alerted?.includes('resolutionOverdue') ?? false,
    returnCount:
      p.returnCount ??
      Number(row.returnCount ?? Math.max(0, (p.round ?? 0) - 1)),
    rating: p.closureMode === 'user' ? (p.rating ?? null) : null,
  };
}
export function createRepairQueries(d: {
  db: DatabaseManager;
  now: () => Date;
  active: (id: string, tx: DatabaseConnection) => Promise<boolean>;
  groups: (tx: DatabaseConnection) => Promise<Group[]>;
  fail: (code: string) => never;
}) {
  async function prepare(
    actorId: string,
    policy: RepositoryPolicy,
    q: RepairQuery,
    tx = d.db.connection(),
    asOf = d.now(),
  ) {
    if (!(await d.active(actorId, tx))) d.fail('ACCESS_DENIED');
    const fields = [
      ...SUMMARY_FIELDS,
      ...(q.dateField ? [q.dateField] : []),
      ...(q.sort ? [q.sort] : []),
    ];
    if (fields.some((k) => !readableSearchField(policy, k)))
      d.fail('ACCESS_DENIED');
    const all = await d.groups(tx),
      leaders = all
        .filter((g) => g.leaderIds.includes(actorId))
        .map((g) => g.id),
      engineers = all
        .filter((g) => g.engineerIds.includes(actorId))
        .map((g) => g.id);
    const scope = (f: FilterBuilder) =>
      f.or([
        f.string('requesterId').eq(actorId),
        ...leaders.map((id) =>
          f.and([f.string('groupId').eq(id), f.string('status').ne('draft')]),
        ),
        ...engineers.map((id) =>
          f.and([
            f.string('groupId').eq(id),
            f.string('requesterId').ne(actorId),
            f.or([
              f.string('assigneeId').eq(actorId),
              f.string('status').eq('pool'),
            ]),
          ]),
        ),
      ]);
    const base = (f: FilterBuilder) =>
      f.and([
        scope(f),
        ...(q.q
          ? [
              f.or([
                f.string('number').includes(q.q),
                f.string('title').includes(q.q),
              ]),
            ]
          : []),
        ...(
          ['status', 'groupId', 'assigneeId', 'category', 'priority'] as const
        ).flatMap((k) => (q[k] ? [f.string(k).eq(q[k])] : [])),
      ]);
    const window = (f: FilterBuilder, field: string) =>
      f.and([
        ...(q.from ? [f.date(field).notBefore(new Date(q.from))] : []),
        ...(q.to ? [f.date(field).before(new Date(q.to))] : []),
      ]);
    const overdue = (f: FilterBuilder, metric: string) =>
      metric === 'response'
        ? f.and([
            f.date('firstRespondedAt').empty(),
            f.date('responseDueAt').notAfter(asOf),
            f.string('status').ne('draft'),
            f.string('status').ne('closed'),
            f.string('status').ne('cancelled'),
          ])
        : f.and([
            f.string('status').ne('draft'),
            f.string('status').ne('acceptance'),
            f.string('status').ne('closed'),
            f.string('status').ne('cancelled'),
            f.or([
              f.date('resolutionDueAt').notAfter(asOf),
              f.boolean('solutionExceeded').isTrue(),
            ]),
          ]);
    const cohort = (f: FilterBuilder, name: string): FilterNode => {
      const user = f.and([
        f.string('status').eq('closed'),
        f.string('closureMode').eq('user'),
        window(f, 'metricEndedAt'),
      ]);
      switch (name) {
        case 'responses':
          return f.and([
            f.date('firstRespondedAt').notEmpty(),
            f.string('status').ne('cancelled'),
            f.or([
              f.string('closureMode').empty(),
              f.string('closureMode').ne('management'),
            ]),
            window(f, 'firstRespondedAt'),
          ]);
        case 'userClosed':
          return user;
        case 'managementClosed':
          return f.and([
            f.string('status').eq('closed'),
            f.string('closureMode').eq('management'),
            window(f, 'metricEndedAt'),
          ]);
        case 'cancelled':
          return f.and([
            f.string('status').eq('cancelled'),
            window(f, 'metricEndedAt'),
          ]);
        case 'currentOpen':
          return f.and(
            ['draft', 'closed', 'cancelled'].map((s) =>
              f.string('status').ne(s),
            ),
          );
        case 'responseOverdue':
          return overdue(f, 'response');
        case 'solutionOverdue':
          return overdue(f, 'solution');
        case 'responseMet':
          return f.and([
            cohort(f, 'responses'),
            f.boolean('responseOnTime').isTrue(),
          ]);
        case 'solutionMet':
          return f.and([user, f.boolean('solutionOnTime').isTrue()]);
        case 'rated':
          return f.and([user, f.number('rating').notEmpty()]);
        case 'waiting':
          return f.and([
            cohort(f, 'currentOpen'),
            f.string('status').eq('waiting'),
          ]);
        default:
          return f.and([
            f.date('submittedAt').notEmpty(),
            window(f, 'submittedAt'),
          ]);
      }
    };
    const filter = (f: FilterBuilder) =>
      f.and([
        base(f),
        ...(q.cohort
          ? [cohort(f, q.cohort)]
          : [window(f, q.dateField ?? 'submittedAt')]),
        ...(q.overdue && q.overdue !== 'all'
          ? [
              q.overdue === 'either'
                ? f.or([overdue(f, 'response'), overdue(f, 'solution')])
                : overdue(f, q.overdue),
            ]
          : []),
      ]);
    return {
      asOf,
      repo: tx.repository<Repair>('itRepairs').withPolicy(policy),
      base,
      window,
      cohort,
      filter,
      scope,
      all,
    };
  }
  async function list(
    actor: string,
    policy: RepositoryPolicy,
    page: number,
    pageSize: number,
    q: RepairQuery = {},
  ) {
    const { repo, filter } = await prepare(actor, policy, q);
    return {
      items: await repo.findMany({
        select: (s) => s.fields(...SUMMARY_FIELDS),
        filter,
        sort: (s) =>
          q.direction === 'asc'
            ? [s.field(q.sort ?? 'updatedAt').asc(), s.field('id').asc()]
            : [s.field(q.sort ?? 'updatedAt').desc(), s.field('id').desc()],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      total: await repo.count({ filter }),
    };
  }
  async function reports(
    actor: string,
    policy: RepositoryPolicy,
    q: RepairQuery,
  ) {
    if (METRIC_FIELDS.some((k) => !readableSearchField(policy, k)))
      d.fail('ACCESS_DENIED');
    return d.db.transaction(async (tx) => {
      if (tx.dialect === 'postgres')
        await (
          await tx.client<Knex.Transaction>()
        ).raw('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      const { repo, base, cohort, asOf } = await prepare(actor, policy, q, tx);
      const filter = (name: string) => (f: FilterBuilder) =>
        f.and([
          base(f),
          cohort(f, name),
          ...(q.overdue && q.overdue !== 'all'
            ? [
                q.overdue === 'either'
                  ? f.or([
                      cohort(f, 'responseOverdue'),
                      cohort(f, 'solutionOverdue'),
                    ])
                  : cohort(
                      f,
                      q.overdue === 'response'
                        ? 'responseOverdue'
                        : 'solutionOverdue',
                    ),
              ]
            : []),
        ]);
      const missing = await repo.count({
        filter: (f) =>
          f.and([
            base(f),
            f.string('status').ne('draft'),
            f.number('metricRevision').empty(),
          ]),
      });
      if (missing) d.fail('REPORTS_PREPARING');
      const names = [
        'submitted',
        'responses',
        'responseMet',
        'userClosed',
        'solutionMet',
        'managementClosed',
        'cancelled',
        'currentOpen',
        'responseOverdue',
        'solutionOverdue',
        'rated',
        'waiting',
      ];
      const counts = Object.fromEntries(
        await Promise.all(
          names.map(
            async (n) => [n, await repo.count({ filter: filter(n) })] as const,
          ),
        ),
      );
      const distribution = async (field: string, name = 'userClosed') => {
        const f = (b: FilterBuilder) =>
          b.and([filter(name)(b), b.number(field).notEmpty()]);
        const a = await repo.aggregate({
          filter: f,
          aggregate: (b) => ({ n: b.count(field), mean: b.avg(field) }),
        });
        const n = Number(a.n);
        if (!n) return { samples: 0, mean: null, median: null, p90: null };
        const middle = await repo.findMany({
          filter: f,
          select: (s) => s.fields(field),
          sort: (s) => [s.field(field).asc(), s.field('id').asc()],
          offset: Math.floor((n - 1) / 2),
          limit: n % 2 ? 1 : 2,
        });
        const high = await repo.findMany({
          filter: f,
          select: (s) => s.fields(field),
          sort: (s) => [s.field(field).asc(), s.field('id').asc()],
          offset: Math.ceil(n * 0.9) - 1,
          limit: 1,
        });
        return {
          samples: n,
          mean: a.mean === null ? null : Number(a.mean),
          median:
            middle.reduce((sum, r) => sum + Number(r[field]), 0) /
            middle.length,
          p90: Number(high[0][field]),
        };
      };
      const durations = Object.fromEntries(
        await Promise.all(
          [
            'responseHours',
            'solutionHours',
            'waitingHours',
            'pausedHours',
            'acceptanceHours',
            'totalHours',
            'naturalHours',
          ].map(
            async (field) =>
              [
                field,
                await distribution(
                  field,
                  field === 'responseHours' ? 'responses' : 'userClosed',
                ),
              ] as const,
          ),
        ),
      );
      const ratings = await repo.aggregate({
        filter: filter('rated'),
        aggregate: (a) => ({ mean: a.avg('rating') }),
      });
      const facts = await repo.aggregate({
        filter: filter('submitted'),
        aggregate: (a) => ({ returns: a.sum('returnCount') }),
      });
      const ever = await Promise.all(
        ['everResponseOverdue', 'everSolutionOverdue'].map((field) =>
          repo.count({
            filter: (f) =>
              f.and([filter('submitted')(f), f.boolean(field).isTrue()]),
          }),
        ),
      );
      return {
        asOf: asOf.toISOString(),
        counts,
        durations,
        responseRate: counts.responses
          ? counts.responseMet / counts.responses
          : null,
        solutionRate: counts.userClosed
          ? counts.solutionMet / counts.userClosed
          : null,
        satisfaction: ratings.mean === null ? null : Number(ratings.mean),
        ratedCount: counts.rated,
        participation: counts.userClosed
          ? counts.rated / counts.userClosed
          : null,
        returnCount: Number(facts.returns ?? 0),
        everResponseOverdue: ever[0],
        everSolutionOverdue: ever[1],
      };
    });
  }
  return { list, reports, prepare };
}

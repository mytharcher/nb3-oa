import {
  attendanceServiceToken,
  AttendanceError,
} from '../../providers/attendance/index.js';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import {
  authenticationToken,
  lockUserForAdministration,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  databaseManagerToken,
  RepositoryError,
  type DatabaseConnection,
  type RepositoryPolicy,
} from '@nocobase/db';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiValidator,
  apiErrorResponses,
  apiErrorResponse,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { orgServiceToken } from '../../providers/org/contract.js';
import { attendanceManagementServiceToken } from '../../providers/attendance-management/contract.js';
import { AttendanceConfigurationError } from '../../providers/attendance-management/shift.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
function dateValue(value: unknown, dateOnly = false): unknown {
  if (value instanceof Date)
    return value.toISOString().slice(0, dateOnly ? 10 : undefined);
  if (typeof value !== 'string') return value;
  if (dateOnly) return value.slice(0, 10);
  // SQLite datetime text represents UTC but omits the zone; do not use the host timezone.
  const normalized = value.replace(' ', 'T');
  const instant = new Date(
    /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}Z`,
  );
  return Number.isFinite(instant.getTime()) ? instant.toISOString() : value;
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(attendanceManagementServiceToken),
      attendance = c.resolve(attendanceServiceToken),
      org = c.resolve(orgServiceToken),
      users = c.resolve(userAdministrationServiceToken),
      i18n = c.resolve(i18nToken),
      calendar = c.resolve(calendarServiceToken);
    const r = new Hono<Env>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    async function error(ctx: Context<Env>, reason: string) {
      const locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return new ApiError({
        domain: 'attendanceManagement',
        reason,
        status:
          reason === 'ACCESS_DENIED' ||
          reason === 'ATTENDANCE_ACCESS_DENIED' ||
          reason === 'ATTENDANCE_SCHEDULE_NOT_READABLE'
            ? 'PERMISSION_DENIED'
            : reason === 'NOT_FOUND'
              ? 'NOT_FOUND'
              : reason === 'ATTENDANCE_VERSION_CONFLICT' ||
                  reason === 'ATTENDANCE_SOURCE_CONFLICT'
                ? 'ABORTED'
                : 'INVALID_ARGUMENT',
        message: i18n.getFixedT(
          'nb3-oa',
          locale,
        )(`attendanceManagement.errors.${reason}`),
      });
    }
    r.onError(async (e, ctx) => {
      if (
        e instanceof AttendanceConfigurationError ||
        e instanceof AttendanceError
      )
        return apiErrorHandler(await error(ctx, e.code), ctx);
      if (e instanceof RepositoryError && e.status === 'PERMISSION_DENIED')
        return apiErrorHandler(await error(ctx, 'ACCESS_DENIED'), ctx);
      return apiErrorHandler(e, ctx);
    });
    async function policies(
      ctx: Context<Env>,
      required: string[],
      action: 'view' | 'manage' = 'view',
    ) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.attendanceManagement' },
        action,
      });
      const value =
        decision.effect === 'deny'
          ? undefined
          : (decision.conditions?.database as
              Record<string, RepositoryPolicy | false> | undefined);
      if (!value || required.some((name) => !value[name]))
        throw await error(ctx, 'ACCESS_DENIED');
      return value as Record<string, RepositoryPolicy>;
    }
    async function actor(ctx: Context<Env>, tx: DatabaseConnection) {
      const actorId = ctx.get('auth')!.user.id,
        person = await users.withConnection(tx).get(actorId);
      if (
        !person ||
        person.disabledAt ||
        person.kind !== 'person' ||
        !(await org.hasDutyRole(actorId, 'hr', tx))
      )
        throw await error(ctx, 'ACCESS_DENIED');
    }
    // Authorization precedes validation, including malformed requests from denied callers.
    const permissionMiddleware: MiddlewareHandler<Env> = async (ctx, next) => {
      if (!ctx.req.path.endsWith('/attendanceManagement/ingestBatch'))
        await policies(ctx, [], ctx.req.method === 'GET' ? 'view' : 'manage');
      else {
        const decision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.attendanceImport' },
          action: 'ingest',
        });
        if (decision.effect === 'deny') throw await error(ctx, 'ACCESS_DENIED');
      }
      await next();
    };
    r.use('*', permissionMiddleware);
    r.post(
      '/ingestBatch',
      describeRoute({
        tags: ['Attendance management'],
        summary: 'Import immutable raw attendance evidence atomically',
        operationId: 'ingestAttendanceBatch',
        responses: {
          200: dataResponse(S.IngestReceipt),
          409: apiErrorResponse(409),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', S.IngestBatch),
      async (ctx) => {
        const decision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.attendanceImport' },
          action: 'ingest',
        });
        const policy =
          decision.effect === 'deny'
            ? undefined
            : (
                decision.conditions?.database as
                  Record<string, RepositoryPolicy | false> | undefined
              )?.attendanceRecords;
        if (!policy) throw await error(ctx, 'ACCESS_DENIED');
        const result = await db.transaction(async (tx) => {
          for (const userId of [
            ...new Set([
              ctx.get('auth')!.user.id,
              ...ctx.req.valid('json').rows.map((row) => row.userId),
            ]),
          ].sort())
            await lockUserForAdministration(tx, userId);
          await actor(ctx, tx);
          const records = await attendance.ingestBatch(
            ctx.req.valid('json').rows,
            { actorId: ctx.get('auth')!.user.id, connection: tx, policy },
          );
          return {
            recordIds: records.map((record) => record.id),
            count: records.length,
          };
        });
        return ctx.json({ data: result });
      },
    );
    r.get(
      '/context',
      describeRoute({
        tags: ['Attendance management'],
        summary:
          'Read the current company time zone for explicit configuration',
        operationId: 'getAttendanceConfigurationContext',
        responses: {
          200: dataResponse(S.ConfigurationContext),
          ...apiErrorResponses,
        },
      }),
      async (ctx) => {
        await db.transaction((tx) => actor(ctx, tx));
        return ctx.json({ data: { timeZone: calendar.timeZone() } });
      },
    );
    r.post(
      '/shifts',
      describeRoute({
        tags: ['Attendance management'],
        summary: 'Save an immutable shift revision',
        operationId: 'saveAttendanceShift',
        responses: {
          200: dataResponse(S.Shift),
          409: apiErrorResponse(409),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', S.SaveShift),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          p = await policies(
            ctx,
            ['attendanceShifts', 'attendanceShiftRevisions'],
            'manage',
          );
        const result = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          const saved = await service.saveShift(
            { ...input, actorId: ctx.get('auth')!.user.id },
            tx,
            {
              pointer: p.attendanceShifts,
              revision: p.attendanceShiftRevisions,
            },
          );
          const visible = await tx
            .repository('attendanceShifts')
            .withPolicy(p.attendanceShifts)
            .findOne({ filter: { id: saved.shift.id } });
          const parsed = S.Shift.safeParse(visible);
          if (!parsed.success) throw await error(ctx, 'ACCESS_DENIED');
          return parsed.data;
        });
        return ctx.json({ data: result });
      },
    );
    r.post(
      '/schedule',
      describeRoute({
        tags: ['Attendance management'],
        summary: 'Save an immutable department schedule revision',
        operationId: 'saveAttendanceDepartmentSchedule',
        responses: {
          200: dataResponse(S.Schedule),
          409: apiErrorResponse(409),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', S.SaveSchedule),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          p = await policies(
            ctx,
            [
              'attendanceSchedules',
              'attendanceScheduleRevisions',
              'attendanceShifts',
              'attendanceShiftRevisions',
            ],
            'manage',
          );
        const result = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          if (input.shiftRevisionId) {
            const revision = await tx
              .repository('attendanceShiftRevisions')
              .withPolicy(p.attendanceShiftRevisions)
              .findOne({ filter: { id: input.shiftRevisionId } });
            if (
              !revision ||
              [
                ...Object.keys(S.ShiftDefinition.shape),
                'id',
                'shiftId',
                'revision',
                'actorId',
                'createdAt',
              ].some((field) => !Object.hasOwn(revision, field)) ||
              typeof revision.shiftId !== 'string'
            )
              throw await error(ctx, 'ACCESS_DENIED');
            const shift = await tx
              .repository('attendanceShifts')
              .withPolicy(p.attendanceShifts)
              .findOne({ filter: { id: revision.shiftId } });
            if (!shift) throw await error(ctx, 'ACCESS_DENIED');
          }
          const saved = await service.saveSchedule(
            { ...input, actorId: ctx.get('auth')!.user.id },
            tx,
            {
              pointer: p.attendanceSchedules,
              revision: p.attendanceScheduleRevisions,
            },
          );
          const visible = await service.schedule(
            input.departmentId,
            input.date,
            tx,
            {
              current: p.attendanceSchedules,
              revision: p.attendanceScheduleRevisions,
            },
          );
          if (!visible || typeof visible.revision.actorId !== 'string')
            throw await error(ctx, 'ACCESS_DENIED');
          const person = await users
            .withConnection(tx)
            .get(visible.revision.actorId);
          const parsed = S.Schedule.safeParse({
            id: saved.id,
            departmentId: input.departmentId,
            date: input.date,
            version: saved.version,
            revision: {
              id: visible.revision.id,
              revision: visible.revision.revision,
              shiftRevisionId: visible.revision.shiftRevisionId,
              restDay: visible.revision.restDay,
              createdBy: {
                id: visible.revision.actorId,
                name: person?.name ?? visible.revision.actorId,
              },
              reason: visible.revision.reason,
              createdAt: dateValue(visible.revision.createdAt),
            },
          });
          if (!parsed.success) throw await error(ctx, 'ACCESS_DENIED');
          return parsed.data;
        });
        return ctx.json({ data: result });
      },
    );
    r.get(
      '/shifts/:shiftId',
      describeRoute({
        tags: ['Attendance management'],
        summary:
          'Read the current authorized shift and its exact immutable revision in one transaction',
        operationId: 'getCurrentAttendanceShift',
        responses: {
          200: dataResponse(S.CurrentShift),
          404: apiErrorResponse(404),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', S.ShiftParams),
      async (ctx) => {
        const p = await policies(ctx, [
          'attendanceShifts',
          'attendanceShiftRevisions',
        ]);
        const data = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          const row = await tx
            .repository('attendanceShifts')
            .withPolicy(p.attendanceShifts)
            .findOne({ filter: { id: ctx.req.valid('param').shiftId } });
          if (!row) throw await error(ctx, 'NOT_FOUND');
          const pointer = S.Shift.safeParse(row);
          if (!pointer.success) throw await error(ctx, 'ACCESS_DENIED');
          const revision = await tx
            .repository('attendanceShiftRevisions')
            .withPolicy(p.attendanceShiftRevisions)
            .findOne({
              filter: {
                shiftId: pointer.data.id,
                revision: pointer.data.currentRevision,
              },
            });
          if (!revision || typeof revision.actorId !== 'string')
            throw await error(ctx, 'ACCESS_DENIED');
          const person = await users.withConnection(tx).get(revision.actorId);
          const { actorId, createdAt, ...definition } = revision;
          const parsed = S.ShiftRevision.safeParse({
            ...definition,
            createdBy: { id: actorId, name: person?.name ?? actorId },
            createdAt: dateValue(createdAt),
          });
          if (!parsed.success) throw await error(ctx, 'ACCESS_DENIED');
          return { shift: pointer.data, revision: parsed.data };
        });
        return ctx.json({ data });
      },
    );
    r.get(
      '/shiftRevision',
      describeRoute({
        tags: ['Attendance management'],
        summary: 'Read an authorized immutable shift revision',
        operationId: 'getAttendanceShiftRevision',
        responses: {
          200: dataResponse(S.ShiftRevision.nullable()),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', S.RevisionQuery),
      async (ctx) => {
        const p = await policies(ctx, [
          'attendanceShifts',
          'attendanceShiftRevisions',
        ]);
        const result = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          const query = ctx.req.valid('query');
          const row = await tx
            .repository('attendanceShiftRevisions')
            .withPolicy(p.attendanceShiftRevisions)
            .findOne({
              filter: query.id
                ? { id: query.id }
                : { shiftId: query.shiftId!, revision: query.revision! },
            });
          if (!row) return null;
          if (
            typeof row.shiftId !== 'string' ||
            typeof row.actorId !== 'string'
          )
            throw await error(ctx, 'ACCESS_DENIED');
          if (
            !(await tx
              .repository('attendanceShifts')
              .withPolicy(p.attendanceShifts)
              .findOne({ filter: { id: row.shiftId } }))
          )
            throw await error(ctx, 'ACCESS_DENIED');
          const person = await users.withConnection(tx).get(row.actorId);
          const { actorId, createdAt, ...fields } = row;
          const parsed = S.ShiftRevision.safeParse({
            ...fields,
            createdBy: { id: actorId, name: person?.name ?? actorId },
            createdAt: dateValue(createdAt),
          });
          if (!parsed.success) throw await error(ctx, 'ACCESS_DENIED');
          return parsed.data;
        });
        return ctx.json({ data: result });
      },
    );
    r.get(
      '/shifts',
      describeRoute({
        tags: ['Attendance management'],
        summary: 'List authorized attendance shifts',
        operationId: 'listAttendanceShifts',
        responses: { 200: listResponse(S.Shift), ...apiErrorResponses },
      }),
      apiValidator('query', S.ListQuery),
      async (ctx) => {
        const input = ctx.req.valid('query'),
          p = await policies(ctx, ['attendanceShifts']);
        const result = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          return service.listShifts(input, tx, p.attendanceShifts);
        });
        const items = S.Shift.array().safeParse(result.items);
        if (!items.success) throw await error(ctx, 'ACCESS_DENIED');
        return ctx.json({
          data: items.data,
          meta: { ...input, total: result.total },
        });
      },
    );
    r.get(
      '/schedule',
      describeRoute({
        tags: ['Attendance management'],
        summary:
          'Read the authorized department schedule and immutable revision',
        operationId: 'getAttendanceDepartmentSchedule',
        responses: {
          200: dataResponse(S.Schedule.nullable()),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', S.ScheduleQuery),
      async (ctx) => {
        const input = ctx.req.valid('query'),
          p = await policies(ctx, [
            'attendanceSchedules',
            'attendanceScheduleRevisions',
          ]);
        const result = await db.transaction(async (tx) => {
          await actor(ctx, tx);
          return service.schedule(
            input.departmentId,
            input.date,
            tx,
            {
              current: p.attendanceSchedules,
              revision: p.attendanceScheduleRevisions,
            },
            input.revision,
          );
        });
        if (!result) return ctx.json({ data: null });
        if (typeof result.revision.actorId !== 'string')
          throw await error(ctx, 'ACCESS_DENIED');
        const person = await users.get(result.revision.actorId);
        const parsed = S.Schedule.safeParse({
          id: result.current.id,
          departmentId: result.current.departmentId,
          date: dateValue(result.current.date, true),
          version: result.current.version,
          revision: {
            id: result.revision.id,
            revision: result.revision.revision,
            shiftRevisionId: result.revision.shiftRevisionId,
            restDay: result.revision.restDay,
            createdBy: {
              id: result.revision.actorId,
              name: person?.name ?? result.revision.actorId,
            },
            reason: result.revision.reason,
            createdAt: dateValue(result.revision.createdAt),
          },
        });
        if (!parsed.success) throw await error(ctx, 'ACCESS_DENIED');
        return ctx.json({ data: parsed.data });
      },
    );
    const root = new Hono();
    // Bound wildcard authentication/authorization to this module's prefix.
    root.route('/attendanceManagement', r);
    return root;
  }),
];

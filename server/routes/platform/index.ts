/**
 * HTTP routes of the `platform` OA module: work calendar, dictionaries, approval rules, document sequences and the
 * audit log. Every router authenticates and checks the settings item of its page (`PLATFORM_SETTINGS`) before
 * validating input. Two reads are deliberately open to every signed-in user: the dictionary types and the active
 * entries of a type, because every request form offers them as options and they carry no confidential data.
 */
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import { auditServiceToken } from '../../providers/audit/index.js';
import {
  PLATFORM_SETTINGS,
  type PlatformSettingsId,
} from '../../providers/platform/authz.js';
import { calendarServiceToken } from '../../providers/platform/calendar.js';
import { dictionaryServiceToken } from '../../providers/platform/dictionaries.js';
import { ruleDefinitionOf } from '../../providers/platform/rule-definitions.js';
import { ruleServiceToken } from '../../providers/platform/rules.js';
import { sequenceServiceToken } from '../../providers/platform/sequences.js';
import { databaseManagerToken } from '@nocobase/db';
import { APP_ERROR_DOMAIN, platformErrorHandler } from './errors.js';
import {
  AuditFacetsSchema,
  AuditLogParams,
  AuditLogSchema,
  AuditLogsQuery,
  CalendarDayParams,
  CalendarDaySchema,
  CalendarDaysQuery,
  CalendarImportResultSchema,
  CreateDictionaryEntryInput,
  CreateRuleVersionInput,
  CreateRuleVersionsInput,
  DictionaryEntriesQuery,
  DictionaryEntryParams,
  DictionaryEntrySchema,
  DictionaryTypeParams,
  DictionaryTypeSchema,
  ImportCalendarDaysInput,
  RuleKeyParams,
  RuleSummarySchema,
  RuleVersionParams,
  RuleVersionSchema,
  RulesQuery,
  SequenceSchema,
  SequencesQuery,
  SetCalendarDayInput,
  UpdateDictionaryEntryInput,
  WorkCalendarSchema,
} from './schemas.js';
import {
  auditLogView,
  calendarDayView,
  dictionaryEntryView,
  dictionaryTypeView,
  ruleSummaryView,
  ruleVersionView,
} from './views.js';

type Env = AuthEnv & AuthorizationEnv;

/** Rejects with 403 unless the caller holds `action` on the settings item. */
function requireSetting(
  id: PlatformSettingsId,
  action: 'read' | 'update',
): MiddlewareHandler<Env> {
  return async (context, next) => {
    await context
      .get('authz')
      .require({ resource: { type: 'settings', id }, action });
    await next();
  };
}

/** The settings item governing a rule key: the calendar page's for `calendar.*`, the rules page's otherwise. */
function ruleSettingOf(key: string | undefined): PlatformSettingsId {
  return key && ruleDefinitionOf(key)?.area === 'calendar'
    ? PLATFORM_SETTINGS.calendar
    : PLATFORM_SETTINGS.rules;
}

const actorOf = (context: { get(key: 'auth'): AuthEnv['Variables']['auth'] }) =>
  context.get('auth')?.user.id ?? null;

const pageMeta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
const totalMeta = z.object({ total: z.number().int() });

export const platformApiRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const { container } = app;
    const auth = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const calendar = container.resolve(calendarServiceToken);
    const dictionaries = container.resolve(dictionaryServiceToken);
    const rules = container.resolve(ruleServiceToken);
    const sequences = container.resolve(sequenceServiceToken);
    const audit = container.resolve(auditServiceToken);
    const database = container.resolve(databaseManagerToken);

    /** Display names of the actors, for the audit log; unknown ids are left out. */
    async function actorNames(
      ids: readonly (string | null)[],
    ): Promise<Map<string, string>> {
      const unique = [
        ...new Set(ids.filter((id): id is string => Boolean(id))),
      ];
      const names = new Map<string, string>();
      if (unique.length === 0) return names;
      const users = await container
        .resolve(userAdministrationServiceToken)
        .list({ userIds: unique, pageSize: 100, kind: 'all' });
      for (const user of users.items) names.set(user.id, user.name);
      return names;
    }

    const protectedRouter = (): Hono<Env> => {
      const router = new Hono<Env>();
      router.use('*', auth.required(), authorization.middleware());
      router.onError(platformErrorHandler);
      return router;
    };

    // Work calendar ---------------------------------------------------------------------------------------------

    const workCalendar = protectedRouter();
    workCalendar.get(
      '/',
      requireSetting(PLATFORM_SETTINGS.calendar, 'read'),
      describeRoute({
        tags: ['WorkCalendar'],
        summary: 'Get the work calendar settings',
        operationId: 'getWorkCalendar',
        responses: {
          '200': dataResponse(WorkCalendarSchema),
          ...apiErrorResponses,
        },
      }),
      (context) => {
        const now = new Date();
        return context.json({
          data: {
            timeZone: calendar.timeZone(),
            today: calendar.localDate(now),
            workHours: calendar.workHoursOn(now),
          },
        });
      },
    );

    const calendarDays = protectedRouter();
    calendarDays.get(
      '/',
      requireSetting(PLATFORM_SETTINGS.calendar, 'read'),
      describeRoute({
        tags: ['WorkCalendar'],
        summary: 'List the explicit days of a year',
        operationId: 'listCalendarDays',
        description:
          'Holidays, make-up working days and other explicit days; a date not listed follows the weekday rule. ' +
          'A year holds at most 366 days, so the list is not paged.',
        responses: {
          '200': listResponse(CalendarDaySchema, totalMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', CalendarDaysQuery),
      async (context) => {
        const { year } = context.req.valid('query');
        const days = await calendar.listDays(year);
        return context.json({
          data: days.map(calendarDayView),
          meta: { total: days.length },
        });
      },
    );
    calendarDays.post(
      '/import',
      requireSetting(PLATFORM_SETTINGS.calendar, 'update'),
      describeRoute({
        tags: ['WorkCalendar'],
        summary: 'Import a year of calendar days',
        operationId: 'importCalendarDays',
        description:
          'Writes the entries in one transaction and audits the changes; with `replace`, removes the year’s other explicit days.',
        responses: {
          '200': dataResponse(CalendarImportResultSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', ImportCalendarDaysInput),
      async (context) => {
        const input = context.req.valid('json');
        const result = await calendar.importYear(
          input.year,
          input.entries,
          { replace: input.replace },
          actorOf(context),
        );
        return context.json({ data: result });
      },
    );
    calendarDays.put(
      '/:date',
      requireSetting(PLATFORM_SETTINGS.calendar, 'update'),
      describeRoute({
        tags: ['WorkCalendar'],
        summary: 'Set a calendar day',
        operationId: 'setCalendarDay',
        description: 'Creates or replaces the explicit entry of the date.',
        responses: {
          '200': dataResponse(CalendarDaySchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', CalendarDayParams),
      apiValidator('json', SetCalendarDayInput),
      async (context) => {
        const { date } = context.req.valid('param');
        const input = context.req.valid('json');
        const day = await calendar.setDay(
          { date, kind: input.kind, note: input.note ?? null },
          actorOf(context),
        );
        return context.json({ data: calendarDayView(day) });
      },
    );
    calendarDays.delete(
      '/:date',
      requireSetting(PLATFORM_SETTINGS.calendar, 'update'),
      describeRoute({
        tags: ['WorkCalendar'],
        summary: 'Remove a calendar day',
        operationId: 'deleteCalendarDay',
        description: 'The date follows the weekday rule again.',
        responses: {
          '204': emptyResponse(),
          ...apiErrorResponses,
          '404': apiErrorResponse(
            404,
            'The date has no explicit entry (`CALENDAR_DAY_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', CalendarDayParams),
      async (context) => {
        await calendar.removeDay(
          context.req.valid('param').date,
          actorOf(context),
        );
        return context.body(null, 204);
      },
    );

    // Dictionaries ----------------------------------------------------------------------------------------------

    const dictionaryTypes = protectedRouter();
    dictionaryTypes.get(
      '/',
      describeRoute({
        tags: ['Dictionaries'],
        summary: 'List dictionary types',
        operationId: 'listDictionaryTypes',
        description:
          'Every signed-in user may read it: forms need the types to show their options.',
        responses: {
          '200': listResponse(DictionaryTypeSchema, totalMeta),
          '401': apiErrorResponse(401),
          '500': apiErrorResponse(500),
        },
      }),
      (context) => {
        const types = dictionaries.types().map(dictionaryTypeView);
        return context.json({ data: types, meta: { total: types.length } });
      },
    );
    dictionaryTypes.get(
      '/:type/entries',
      // Active entries are open to every signed-in user (form options); disabled ones are an administration view.
      async (context, next) => {
        if (context.req.query('includeInactive') === 'true')
          return requireSetting(PLATFORM_SETTINGS.dictionaries, 'read')(
            context,
            next,
          );
        await next();
      },
      describeRoute({
        tags: ['Dictionaries'],
        summary: 'List the entries of a dictionary type',
        operationId: 'listDictionaryEntries',
        description:
          'Active entries for every signed-in user, ordered by `sortOrder`; `includeInactive=true` also lists ' +
          'disabled ones and needs the dictionaries settings read permission. Labels carry every language.',
        responses: {
          '200': listResponse(DictionaryEntrySchema, totalMeta),
          ...apiErrorResponses,
          '404': apiErrorResponse(
            404,
            'The type is not defined (`DICTIONARY_TYPE_UNKNOWN`).',
          ),
        },
      }),
      apiValidator('param', DictionaryTypeParams),
      apiValidator('query', DictionaryEntriesQuery),
      async (context) => {
        const { type } = context.req.valid('param');
        const { includeInactive } = context.req.valid('query');
        const entries = await dictionaries.list(type, {
          includeInactive: includeInactive === 'true',
        });
        return context.json({
          data: entries.map(dictionaryEntryView),
          meta: { total: entries.length },
        });
      },
    );
    dictionaryTypes.post(
      '/:type/entries',
      requireSetting(PLATFORM_SETTINGS.dictionaries, 'update'),
      describeRoute({
        tags: ['Dictionaries'],
        summary: 'Create a dictionary entry',
        operationId: 'createDictionaryEntry',
        responses: {
          '201': dataResponse(DictionaryEntrySchema),
          ...apiErrorResponses,
          '404': apiErrorResponse(
            404,
            'The type is not defined (`DICTIONARY_TYPE_UNKNOWN`).',
          ),
          '409': apiErrorResponse(
            409,
            'The type already has an entry with the code (`DICTIONARY_CODE_EXISTS`).',
          ),
        },
      }),
      apiValidator('param', DictionaryTypeParams),
      apiValidator('json', CreateDictionaryEntryInput),
      async (context) => {
        const { type } = context.req.valid('param');
        const entry = await dictionaries.create(
          type,
          context.req.valid('json'),
          actorOf(context),
        );
        return context.json({ data: dictionaryEntryView(entry) }, 201);
      },
    );
    dictionaryTypes.patch(
      '/:type/entries/:entryId',
      requireSetting(PLATFORM_SETTINGS.dictionaries, 'update'),
      describeRoute({
        tags: ['Dictionaries'],
        summary: 'Update a dictionary entry',
        operationId: 'updateDictionaryEntry',
        description:
          'Changes the label, order, attributes or whether it is active. The code never changes, and entries are never deleted.',
        responses: {
          '200': dataResponse(DictionaryEntrySchema),
          ...apiErrorResponses,
          '404': apiErrorResponse(404, 'The type or the entry does not exist.'),
        },
      }),
      apiValidator('param', DictionaryEntryParams),
      apiValidator('json', UpdateDictionaryEntryInput),
      async (context) => {
        const { type, entryId } = context.req.valid('param');
        const entry = await dictionaries.update(
          type,
          entryId,
          context.req.valid('json'),
          actorOf(context),
        );
        return context.json({ data: dictionaryEntryView(entry) });
      },
    );

    // Approval rules --------------------------------------------------------------------------------------------

    const approvalRules = protectedRouter();
    approvalRules.get(
      '/',
      (context, next) =>
        requireSetting(
          context.req.query('area') === 'calendar'
            ? PLATFORM_SETTINGS.calendar
            : PLATFORM_SETTINGS.rules,
          'read',
        )(context, next),
      describeRoute({
        tags: ['ApprovalRules'],
        summary: 'List approval rules',
        operationId: 'listApprovalRules',
        description:
          'Every key of the area with its metadata, the version in effect and the versions scheduled for later. ' +
          '`area=calendar` needs the calendar settings read permission, the default `rules` the rules one.',
        responses: {
          '200': listResponse(RuleSummarySchema, totalMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', RulesQuery),
      async (context) => {
        const { area } = context.req.valid('query');
        const definitions = rules
          .definitions()
          .filter((definition) => definition.area === area);
        const versions = await rules.versions(
          definitions.map((definition) => definition.key),
        );
        const now = new Date();
        const data = definitions.map((definition) =>
          ruleSummaryView(
            definition,
            versions.filter((version) => version.key === definition.key),
            now,
          ),
        );
        return context.json({ data, meta: { total: data.length } });
      },
    );
    approvalRules.get(
      '/:key/versions',
      (context, next) =>
        requireSetting(ruleSettingOf(context.req.param('key')), 'read')(
          context,
          next,
        ),
      describeRoute({
        tags: ['ApprovalRules'],
        summary: 'List the versions of an approval rule',
        operationId: 'listApprovalRuleVersions',
        description:
          'Every version of the key, the latest `effectiveFrom` first. A key has a few versions, so the list is not paged.',
        responses: {
          '200': listResponse(RuleVersionSchema, totalMeta),
          ...apiErrorResponses,
          '404': apiErrorResponse(
            404,
            'The key is not defined (`RULE_UNKNOWN`).',
          ),
        },
      }),
      apiValidator('param', RuleKeyParams),
      async (context) => {
        const { key } = context.req.valid('param');
        await rules.get(key); // 404 for an unknown key
        const versions = (await rules.versions([key])).reverse();
        const names = await actorNames(
          versions.map((version) => version.updatedBy),
        );
        return context.json({
          data: versions.map((version) => ruleVersionView(version, names)),
          meta: { total: versions.length },
        });
      },
    );
    approvalRules.post(
      '/versions',
      describeRoute({
        tags: ['ApprovalRules'],
        summary: 'Add versions of several approval rules at once',
        operationId: 'createApprovalRuleVersions',
        description:
          'One version per key, all sharing `effectiveFrom` and `note`, in one transaction: either every version is ' +
          'added or none is. Orderings between the keys are checked against the combined result. Needs the update ' +
          "permission of every key's settings. Audited per key.",
        responses: {
          '201': listResponse(RuleVersionSchema, totalMeta),
          ...apiErrorResponses,
          '400': apiErrorResponse(
            400,
            'A value is invalid or breaks an ordering; `metadata.key` names the key.',
          ),
          '404': apiErrorResponse(
            404,
            'A key is not defined (`RULE_UNKNOWN`).',
          ),
          '409': apiErrorResponse(
            409,
            'A key repeats or already has a version at that instant (`RULE_VERSION_EXISTS`).',
          ),
        },
      }),
      apiValidator('json', CreateRuleVersionsInput),
      async (context) => {
        const input = context.req.valid('json');
        const authz = context.get('authz');
        for (const id of new Set(
          input.changes.map((change) => ruleSettingOf(change.key)),
        ))
          await authz.require({
            resource: { type: 'settings', id },
            action: 'update',
          });
        const actorId = actorOf(context);
        const effectiveFrom = input.effectiveFrom
          ? new Date(input.effectiveFrom)
          : undefined;
        const versions = await rules.setMany(
          input.changes.map((change) => ({
            key: change.key,
            value: change.value,
            ...(effectiveFrom ? { effectiveFrom } : {}),
            note: input.note ?? null,
            actorId,
          })),
        );
        const names = await actorNames(
          versions.map((version) => version.updatedBy),
        );
        return context.json(
          {
            data: versions.map((version) => ruleVersionView(version, names)),
            meta: { total: versions.length },
          },
          201,
        );
      },
    );
    approvalRules.post(
      '/:key/versions',
      (context, next) =>
        requireSetting(ruleSettingOf(context.req.param('key')), 'update')(
          context,
          next,
        ),
      describeRoute({
        tags: ['ApprovalRules'],
        summary: 'Add a version of an approval rule',
        operationId: 'createApprovalRuleVersion',
        description:
          'Takes effect at `effectiveFrom` (now when omitted, never in the past); requests submitted before then keep ' +
          'the value in their snapshot. Audited.',
        responses: {
          '201': dataResponse(RuleVersionSchema),
          ...apiErrorResponses,
          '400': apiErrorResponse(
            400,
            'The value breaks an ordering with a related key (`RULE_ORDER_VIOLATED`).',
          ),
          '404': apiErrorResponse(
            404,
            'The key is not defined (`RULE_UNKNOWN`).',
          ),
          '409': apiErrorResponse(
            409,
            'The key already has a version at that instant (`RULE_VERSION_EXISTS`).',
          ),
        },
      }),
      apiValidator('param', RuleKeyParams),
      apiValidator('json', CreateRuleVersionInput),
      async (context) => {
        const { key } = context.req.valid('param');
        const input = context.req.valid('json');
        const version = await rules.set({
          key,
          value: input.value,
          ...(input.effectiveFrom
            ? { effectiveFrom: new Date(input.effectiveFrom) }
            : {}),
          note: input.note ?? null,
          actorId: actorOf(context),
        });
        return context.json(
          {
            data: ruleVersionView(
              version,
              await actorNames([version.updatedBy]),
            ),
          },
          201,
        );
      },
    );
    approvalRules.delete(
      '/:key/versions/:versionId',
      (context, next) =>
        requireSetting(ruleSettingOf(context.req.param('key')), 'update')(
          context,
          next,
        ),
      describeRoute({
        tags: ['ApprovalRules'],
        summary: 'Withdraw a scheduled version of an approval rule',
        operationId: 'deleteApprovalRuleVersion',
        description:
          'Only a version that has not taken effect yet; history is never removed. Audited.',
        responses: {
          '204': emptyResponse(),
          ...apiErrorResponses,
          '400': apiErrorResponse(
            400,
            'The version has taken effect (`RULE_VERSION_IN_EFFECT`) or withdrawing it breaks an ordering.',
          ),
          '404': apiErrorResponse(
            404,
            'The key or the version does not exist.',
          ),
        },
      }),
      apiValidator('param', RuleVersionParams),
      async (context) => {
        const { key, versionId } = context.req.valid('param');
        await rules.cancel(key, versionId, actorOf(context));
        return context.body(null, 204);
      },
    );

    // Sequences -------------------------------------------------------------------------------------------------

    const sequenceRouter = protectedRouter();
    sequenceRouter.get(
      '/',
      requireSetting(PLATFORM_SETTINGS.sequences, 'read'),
      describeRoute({
        tags: ['Sequences'],
        summary: 'List document number counters',
        operationId: 'listSequences',
        responses: {
          '200': listResponse(SequenceSchema, pageMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', SequencesQuery),
      async (context) => {
        const { prefix, page, pageSize } = context.req.valid('query');
        const { items, total } = await sequences.list(
          { ...(prefix ? { prefix } : {}), page, pageSize },
          database.connection(),
        );
        return context.json({ data: items, meta: { page, pageSize, total } });
      },
    );

    // Audit logs ------------------------------------------------------------------------------------------------

    const auditLogs = protectedRouter();
    auditLogs.get(
      '/facets',
      requireSetting(PLATFORM_SETTINGS.auditLogs, 'read'),
      describeRoute({
        tags: ['AuditLogs'],
        summary: 'List the target types and actions present in the audit log',
        operationId: 'getAuditLogFacets',
        responses: {
          '200': dataResponse(AuditFacetsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => context.json({ data: await audit.facets() }),
    );
    auditLogs.get(
      '/',
      requireSetting(PLATFORM_SETTINGS.auditLogs, 'read'),
      describeRoute({
        tags: ['AuditLogs'],
        summary: 'List audit log entries',
        operationId: 'listAuditLogs',
        description:
          'Newest first. `from` and `to` bound `at`; the other filters match exactly.',
        responses: {
          '200': listResponse(AuditLogSchema, pageMeta),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', AuditLogsQuery),
      async (context) => {
        const { from, to, page, pageSize, orderBy, ...criteria } =
          context.req.valid('query');
        const { items, total } = await audit.list({
          ...criteria,
          order: orderBy === 'at' ? 'asc' : 'desc',
          ...(from ? { from: new Date(from) } : {}),
          ...(to ? { to: new Date(to) } : {}),
          page,
          pageSize,
        });
        const names = await actorNames(items.map((item) => item.actorId));
        return context.json({
          data: items.map((item) => auditLogView(item, names)),
          meta: { page, pageSize, total },
        });
      },
    );

    auditLogs.get(
      '/:auditLogId',
      requireSetting(PLATFORM_SETTINGS.auditLogs, 'read'),
      describeRoute({
        tags: ['AuditLogs'],
        summary: 'Get an audit log entry',
        operationId: 'getAuditLog',
        responses: {
          '200': dataResponse(AuditLogSchema),
          ...apiErrorResponses,
          '404': apiErrorResponse(
            404,
            'The entry does not exist (`AUDIT_LOG_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', AuditLogParams),
      async (context) => {
        const record = await audit.get(
          Number(context.req.valid('param').auditLogId),
        );
        if (!record)
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'AUDIT_LOG_NOT_FOUND',
            domain: APP_ERROR_DOMAIN,
            message: 'The audit log entry was not found.',
          });
        const names = await actorNames([record.actorId]);
        return context.json({ data: auditLogView(record, names) });
      },
    );

    const router = new Hono();
    router.route('/workCalendar', workCalendar);
    router.route('/calendarDays', calendarDays);
    router.route('/dictionaryTypes', dictionaryTypes);
    router.route('/approvalRules', approvalRules);
    router.route('/sequences', sequenceRouter);
    router.route('/auditLogs', auditLogs);
    return router;
  });

/** HTTP routes of the `platform` OA module, registered through `server/routes/index.ts`. */
const platformRoutes: readonly AppRouteContribution<Application>[] = [
  platformApiRoutes,
];

export default platformRoutes;

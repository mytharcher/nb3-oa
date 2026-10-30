import { branchConditions } from '../../providers/process-management/branch-conditions.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationContext,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type RepositoryPolicy,
} from '@nocobase/db';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { LifecycleError } from '@nocobase/lifecycle';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  processOwners,
  processResource,
  type ProcessOwner,
} from '../../providers/process-management/owners.js';
import { withProcessManagement } from '../../providers/process-management/context.js';
import {
  Command,
  Definition,
  Detail,
  Execution,
  Options,
  OptionsInput,
  Params,
  Process,
  Query,
  type DetailDto,
  type ExecutionDto,
} from './schemas.js';

function fail(
  status: 'PERMISSION_DENIED' | 'NOT_FOUND' | 'ABORTED' | 'FAILED_PRECONDITION',
  reason: string,
): never {
  throw new ApiError({
    status,
    domain: 'processManagement',
    reason,
    message: 'The process management operation is unavailable.',
  });
}
async function policyFor(
  authz: AuthorizationContext,
  owner: ProcessOwner,
  action: string,
) {
  const decision = await authz.authorize({
    resource: { type: 'composite', id: processResource(owner.kind) },
    action,
  });
  const policy =
    decision.effect === 'deny'
      ? undefined
      : (
          decision.conditions?.database as
            Record<string, RepositoryPolicy | false | undefined> | undefined
        )?.[owner.collection];
  return policy || undefined;
}
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const db = app.container.resolve(databaseManagerToken),
      authorization = app.container.resolve(authorizationToken);
    router.use(
      '/processManagement/*',
      app.container.resolve(authenticationToken).required(),
      authorization.middleware(),
    );
    router.use('/processManagement/*', async (c, next) => {
      if (
        !(await c.get('authz').can({
          resource: { type: 'page', id: 'oa.processManagement' },
          action: 'access',
        }))
      )
        fail('PERMISSION_DENIED', 'PROCESS_PAGE_DENIED');
      await next();
    });
    router.onError((error, c) => {
      if (error instanceof ApprovalError || error instanceof LifecycleError) {
        const stale = /STALE|CONFLICT|CONTENT|CLOSED|VERSION/.test(error.code);
        return apiErrorHandler(
          new ApiError({
            status: stale ? 'ABORTED' : 'FAILED_PRECONDITION',
            domain: 'processManagement',
            reason: stale ? 'PROCESS_CHANGED' : 'PROCESS_UNAVAILABLE',
            message:
              'The current task or business state does not permit this operation.',
          }),
          c,
        );
      }
      // Do not return raw owner exceptions, SQL or private error metadata.
      if (!(error instanceof ApiError))
        return apiErrorHandler(
          new ApiError({
            status: 'FAILED_PRECONDITION',
            domain: 'processManagement',
            reason: 'PROCESS_UNAVAILABLE',
            message: 'The process cannot currently be managed.',
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    const doc = (id: string, schema: z.ZodType, list = false) =>
      describeRoute({
        tags: ['ProcessManagement'],
        operationId: id,
        summary: id,
        responses: {
          200: list
            ? listResponse(
                schema,
                z.object({
                  page: z.number(),
                  pageSize: z.number(),
                  total: z.number(),
                  timeZone: z.string().optional(),
                  kinds: z.array(z.string()).optional(),
                  statuses: z.array(z.string()).optional(),
                }),
              )
            : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    function ownerOf(kind: string) {
      const owner = processOwners.find((o) => o.kind === kind);
      if (!owner) fail('NOT_FOUND', 'PROCESS_NOT_FOUND');
      return owner;
    }
    async function scopedRow(
      owner: ProcessOwner,
      id: string,
      policy: RepositoryPolicy,
      connection: DatabaseConnection = db.connection(),
    ) {
      const row = await connection
        .repository(owner.collection)
        .withPolicy(policy)
        .findOne({ filter: { id } });
      if (!row) fail('NOT_FOUND', 'PROCESS_NOT_FOUND');
      if (
        (owner.kind === 'oa.itRepair'
          ? ['id', 'requesterId', 'status', 'version', 'createdAt']
          : ['id', 'applicantId', 'status', 'lifecycleVersion', 'createdAt']
        ).some((key) => !(key in row))
      )
        fail('PERMISSION_DENIED', 'PROCESS_FIELDS_DENIED');
      return row;
    }
    async function requirePolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
      owner: ProcessOwner,
      action: string,
    ) {
      const policy = await policyFor(c.get('authz'), owner, action);
      if (!policy) fail('PERMISSION_DENIED', 'PROCESS_ACTION_DENIED');
      return policy;
    }
    async function person(id: string | null | undefined) {
      if (!id) return null;
      const user = await app.container
        .resolve(userAdministrationServiceToken)
        .get(id);
      return { id, name: user?.name ?? id };
    }
    async function summary(
      owner: ProcessOwner,
      row: Record<string, unknown>,
    ): Promise<ExecutionDto> {
      const sdk = await owner.sdk(app);
      const history = await sdk.read(() =>
        sdk.runtime.history(owner.kind, String(row.id)),
      );
      const states = sdk.runtime.describe(owner.kind).stateInfo;
      const final =
        (owner.kind === 'oa.itRepair' && row.status === 'closed') ||
        states.some((s) => s.name === row.status && s.final);
      const last = history.transitions.at(-1);
      return {
        id: String(row.id),
        kind: owner.kind,
        recordLabel:
          typeof row.number === 'string' && row.number
            ? row.number
            : String(row.id),
        number: typeof row.number === 'string' ? row.number : null,
        applicant: await person(
          String(
            owner.kind === 'oa.itRepair' ? row.requesterId : row.applicantId,
          ),
        ),
        status: String(row.status),
        currentStage: sdk.definition?.isStage(String(row.status))
          ? String(row.status)
          : null,
        version: Number(
          owner.kind === 'oa.itRepair' ? row.version : row.lifecycleVersion,
        ),
        createdAt: new Date(String(row.createdAt)).toISOString(),
        endedAt: final && last && last.to === row.status ? last.at : null,
      };
    }
    async function management<T>(
      c: Context<AuthEnv & AuthorizationEnv>,
      owner: ProcessOwner,
      id: string,
      action: string,
      work: (policy: RepositoryPolicy) => Promise<T>,
    ) {
      const actorId = c.get('auth')!.user.id;
      async function verify(connection?: DatabaseConnection) {
        // A fresh public authorization context, not a decision retained across writes.
        const policy = await policyFor(
          authorization.for(c.get('authz').identity),
          owner,
          action,
        );
        if (!policy || !policy.update)
          fail('PERMISSION_DENIED', 'PROCESS_ACTION_DENIED');
        await scopedRow(owner, id, policy, connection);
        if (policy.update !== true) {
          if (!(
            Array.isArray(policy.update.fields) &&
            (policy.update.fields.includes('*') ||
              ['status', 'lifecycleVersion'].every(
                (field) =>
                  policy.update !== true &&
                  policy.update &&
                  Array.isArray(policy.update.fields) &&
                  policy.update.fields.includes(field),
              ))
          ))
            fail('PERMISSION_DENIED', 'PROCESS_FIELDS_DENIED');
          const eligible = await (connection ?? db.connection())
            .repository(owner.collection)
            .withPolicy({
              ...policy,
              read: { scope: policy.update.scope, fields: ['id'] },
            })
            .findOne({ filter: { id } });
          if (!eligible) fail('NOT_FOUND', 'PROCESS_NOT_FOUND');
        }
      }
      await verify();
      const policy = await requirePolicy(c, owner, action);
      return withProcessManagement({ kind: owner.kind, actorId, verify }, () =>
        work(policy),
      );
    }
    async function details(
      c: Context<AuthEnv & AuthorizationEnv>,
      owner: ProcessOwner,
      id: string,
    ): Promise<DetailDto> {
      const row = await scopedRow(
        owner,
        id,
        await requirePolicy(c, owner, 'historyRead'),
      );
      const sdk = await owner.sdk(app),
        actorId = c.get('auth')!.user.id;
      const runs = await sdk.read(
        () => sdk.approvals?.runViewsFor(owner.kind, id) ?? Promise.resolve([]),
      );
      const history = await sdk.read(() => sdk.runtime.history(owner.kind, id));
      // Free text can carry private business data. Only an independent complete ordinary
      // owner view may reveal it; management history never unlocks record snapshots/outputs.
      const viewDecision = await c.get('authz').authorize({
        resource: { type: 'composite', id: owner.resource },
        action: 'view',
      });
      const viewPolicy =
        viewDecision.effect === 'deny'
          ? undefined
          : viewDecision.conditions?.database?.[owner.collection];
      const commentsReadable = Boolean(
        viewPolicy &&
        (viewPolicy.read === true ||
          (viewPolicy.read &&
            Array.isArray(viewPolicy.read.fields) &&
            viewPolicy.read.fields.includes('*'))) &&
        (await db
          .repository(owner.collection)
          .withPolicy(viewPolicy)
          .findOne({ filter: { id } })),
      );
      const appointments = new Set<string>();
      const offered = new Map<string, ('appoint' | 'reassign')[]>();
      const actions: DetailDto['actions'] = [];
      for (const action of ['appoint', 'reassign', 'terminate'] as const) {
        if (!(await policyFor(c.get('authz'), owner, action))) continue;
        const connected =
          action === 'terminate'
            ? Boolean(owner.terminate)
            : Boolean(owner.action);
        let allowed = false;
        if (connected) {
          try {
            await management(c, owner, id, action, async () => {
              if (action === 'terminate') {
                allowed = (
                  await sdk.read(() =>
                    sdk.runtime.can(
                      owner.kind,
                      id,
                      'terminate',
                      { id: actorId },
                      { input: { reason: 'management preview' } },
                    ),
                  )
                ).allowed;
              } else if (action === 'appoint') {
                for (const entry of await sdk.read(
                  () =>
                    sdk.approvals?.runActionsFor(owner.kind, id, {
                      id: actorId,
                    }) ?? Promise.resolve([]),
                )) {
                  const offer = entry.actions.find((a) => a.name === 'appoint');
                  if (offer) {
                    allowed = true;
                    appointments.add(entry.run.id);
                  }
                }
              } else
                for (const entry of await sdk.read(
                  () =>
                    sdk.approvals?.actionsFor(owner.kind, id, {
                      id: actorId,
                    }) ?? Promise.resolve([]),
                )) {
                  if (entry.actions.some((a) => a.name === action)) {
                    allowed = true;
                    offered.set(entry.task.id, [
                      ...(offered.get(entry.task.id) ?? []),
                      action,
                    ]);
                  }
                }
            });
          } catch (error) {
            if (
              error instanceof ApiError &&
              [
                'PROCESS_ACTION_DENIED',
                'PROCESS_NOT_FOUND',
                'PROCESS_FIELDS_DENIED',
              ].includes(error.reason ?? '')
            )
              continue;
            throw error;
          }
        }
        actions.push({
          action,
          allowed,
          reason: allowed ? null : connected ? 'unavailable' : 'notConnected',
        });
      }
      const timelineActions = await sdk.read(
        () => sdk.approvals?.actionsOf(owner.kind, id) ?? Promise.resolve([]),
      );
      const events = await sdk.read(
        () => sdk.approvals?.eventsFor(owner.kind, id) ?? Promise.resolve([]),
      );
      return {
        timeZone: app.container.resolve(calendarServiceToken).timeZone(),
        record: await summary(owner, row),
        commentsReadable,
        actions,
        runs: await Promise.all(
          runs.map(async (view) => ({
            id: view.run.id,
            stage: view.run.plan[0]?.stage ?? view.run.status,
            status: view.run.status,
            startedAt: view.run.startedAt,
            endedAt: view.run.endedAt,
            outcome: view.run.outcome,
            appoint: appointments.has(view.run.id),
            definitionMissing: view.definitionMissing,
            tasks: await Promise.all(
              view.tasks.map(async (task) => ({
                id: task.id,
                runId: task.runId,
                stage: task.stage,
                status: task.status,
                kind: task.kind,
                assignee: (await person(task.assigneeId))!,
                actor: await person(task.actorId),
                answer: task.answer,
                comment: commentsReadable ? task.comment : null,
                previousTaskId: task.previousTaskId,
                createdAt: task.createdAt,
                closedAt: task.closedAt,
                actions: offered.get(task.id) ?? [],
              })),
            ),
          })),
        ),
        events: (
          await Promise.all([
            ...timelineActions.map(async (a) => ({
              id: `action:${a.id}`,
              runId: a.runId ?? null,
              kind: a.name,
              stage: a.stage,
              actor: await person(a.actorId),
              at: a.at,
              comment: commentsReadable ? a.comment : null,
            })),
            ...events
              .filter((e) => !e.actionId)
              .map(async (e) => ({
                id: `event:${e.id}`,
                runId: e.runId ?? null,
                kind: e.kind,
                stage: e.stage,
                actor: await person(e.actorId),
                at: e.at,
                comment: null,
              })),
          ])
        ).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id)),
        transitions: await Promise.all(
          history.transitions.map(async (e) => ({
            id: e.id,
            from: e.from,
            to: e.to,
            name: e.transition,
            actor: await person(e.actorId),
            at: e.at,
          })),
        ),
      };
    }
    async function descriptor(
      c: Context<AuthEnv & AuthorizationEnv>,
      owner: ProcessOwner,
    ) {
      const capabilities: string[] = [];
      for (const action of ['appoint', 'reassign', 'terminate'])
        if (
          (action === 'terminate' ? owner.terminate : owner.action) &&
          (await policyFor(c.get('authz'), owner, action))
        )
          capabilities.push(action);
      return {
        kind: owner.kind,
        domain: owner.domain,
        category: 'approval' as const,
        connected: true,
        capabilities,
      };
    }
    function paginate<T>(rows: T[], query: z.infer<typeof Query>) {
      const page = Math.min(
        query.page,
        Math.max(1, Math.ceil(rows.length / query.pageSize)),
      );
      return {
        data: rows.slice((page - 1) * query.pageSize, page * query.pageSize),
        meta: {
          page,
          pageSize: query.pageSize,
          total: rows.length,
          timeZone: app.container.resolve(calendarServiceToken).timeZone(),
        },
      };
    }
    router.get(
      '/processManagement/definitions',
      doc('listProcessDefinitions', Process, true),
      apiValidator('query', Query),
      async (c) => {
        const query = c.req.valid('query'),
          rows = [];
        for (const owner of processOwners)
          if (
            (await policyFor(c.get('authz'), owner, 'definitionRead')) &&
            `${owner.zh} ${owner.en}`
              .toLowerCase()
              .includes(query.search.toLowerCase())
          )
            rows.push(await descriptor(c, owner));
        rows.sort((a, b) => {
          const left = ownerOf(a.kind),
            right = ownerOf(b.kind);
          return (
            (query.orderBy === 'name' && query.direction === 'desc' ? -1 : 1) *
            (query.locale === 'zh-CN' ? left.zh : left.en).localeCompare(
              query.locale === 'zh-CN' ? right.zh : right.en,
              query.locale,
            )
          );
        });
        return c.json(paginate(rows, query));
      },
    );
    router.get(
      '/processManagement/definitions/:kind',
      doc('getProcessDefinition', Definition),
      apiValidator('param', Params),
      async (c) => {
        const owner = ownerOf(c.req.valid('param').kind);
        await requirePolicy(c, owner, 'definitionRead');
        const sdk = await owner.sdk(app),
          description = sdk.runtime.describe(owner.kind);
        const frozen = [...(sdk.definition?.options.freeze ?? [])];
        const stages = description.states
          .filter((s) => sdk.definition?.isStage(s))
          .map((name) => {
            const stage = sdk.definition!.stage(name);
            return {
              name,
              policy: stage.policy.kind,
              peopleSource: stage.pools?.length
                ? ('pools' as const)
                : stage.subjects
                  ? ('subjects' as const)
                  : ('dynamic' as const),
              pools: stage.pools?.map((p) => p.key) ?? [],
              covered: [...(stage.covers ?? frozen)],
            };
          });
        return c.json({
          data: {
            ...(await descriptor(c, owner)),
            initial: description.initial,
            states: description.stateInfo.map((s) => ({
              name: s.name,
              final: s.final,
            })),
            stages,
            frozen,
            transitions: description.transitions.map((t) => {
              const conditions = branchConditions(
                owner.kind,
                t.name,
                t.from,
                t.to,
              );
              return {
                name: t.name,
                from: [...t.from],
                to: Object.keys(conditions).length
                  ? t.to.filter((target) => target in conditions)
                  : [...t.to],
                manual: t.manual,
                conditions,
              };
            }),
          },
        });
      },
    );
    router.get(
      '/processManagement/executions',
      doc('listProcessExecutions', Execution, true),
      apiValidator('query', Query),
      async (c) => {
        const query = c.req.valid('query'),
          rows: ExecutionDto[] = [];
        const kinds: string[] = [],
          statuses = new Set<string>();
        for (const candidate of processOwners)
          if (await policyFor(c.get('authz'), candidate, 'historyRead'))
            kinds.push(candidate.kind);
        let readable = false;
        for (const owner of processOwners) {
          if (query.kind && owner.kind !== query.kind) continue;
          const policy = await policyFor(c.get('authz'), owner, 'historyRead');
          if (!policy) continue;
          readable = true;
          const records = await db
            .repository(owner.collection)
            .withPolicy(policy)
            .findMany();
          for (const row of records) {
            if (typeof row.status === 'string' && row.status !== 'draft')
              statuses.add(row.status);
            if (row.status === 'draft') continue;
            if (query.status && row.status !== query.status) continue;
            const record = await summary(owner, row);
            if (
              (query.from &&
                app.container
                  .resolve(calendarServiceToken)
                  .localDate(new Date(record.createdAt)) < query.from) ||
              (query.to &&
                app.container
                  .resolve(calendarServiceToken)
                  .localDate(new Date(record.createdAt)) > query.to)
            )
              continue;
            if (
              !`${record.recordLabel} ${record.applicant?.name ?? ''} ${owner.zh} ${owner.en}`
                .toLowerCase()
                .includes(query.search.toLowerCase())
            )
              continue;
            rows.push(record);
          }
        }
        if (!readable) fail('PERMISSION_DENIED', 'PROCESS_HISTORY_DENIED');
        rows.sort(
          (a, b) =>
            (query.direction === 'asc' ? 1 : -1) *
              (
                a[query.orderBy === 'name' ? 'createdAt' : query.orderBy] ?? ''
              ).localeCompare(
                b[query.orderBy === 'name' ? 'createdAt' : query.orderBy] ?? '',
              ) ||
            a.kind.localeCompare(b.kind) ||
            a.id.localeCompare(b.id),
        );
        const result = paginate(rows, query);
        return c.json({
          ...result,
          meta: { ...result.meta, kinds, statuses: [...statuses].sort() },
        });
      },
    );
    router.get(
      '/processManagement/executions/:kind/:recordId',
      doc('getProcessExecution', Detail),
      apiValidator('param', Params.required()),
      async (c) => {
        const p = c.req.valid('param');
        return c.json({ data: await details(c, ownerOf(p.kind), p.recordId) });
      },
    );
    router.post(
      '/processManagement/executions/:kind/:recordId/managementOptions',
      doc('getProcessManagementOptions', Options),
      apiValidator('param', Params.required()),
      apiValidator('json', OptionsInput),
      async (c) => {
        const p = c.req.valid('param'),
          input = c.req.valid('json'),
          owner = ownerOf(p.kind);
        const data = await management(
          c,
          owner,
          p.recordId,
          input.action,
          async (policy) => {
            const row = await scopedRow(owner, p.recordId, policy),
              sdk = await owner.sdk(app);
            if (input.action === 'terminate') {
              if (
                !owner.terminate ||
                (
                  await sdk.read(() =>
                    sdk.runtime.can(
                      owner.kind,
                      p.recordId,
                      'terminate',
                      { id: c.get('auth')!.user.id },
                      { input: { reason: 'management preview' } },
                    ),
                  )
                ).allowed === false
              )
                fail('FAILED_PRECONDITION', 'PROCESS_UNAVAILABLE');
              return {
                version: Number(
                  owner.kind === 'oa.itRepair'
                    ? row.version
                    : row.lifecycleVersion,
                ),
                people: [],
                nextOffset: null,
              };
            }
            if (!owner.action || !input.taskId)
              fail('FAILED_PRECONDITION', 'PROCESS_UNAVAILABLE');
            const runs = await sdk.read(
              () =>
                sdk.approvals?.runViewsFor(owner.kind, p.recordId) ??
                Promise.resolve([]),
            );
            const run = runs.find((v) =>
              input.action === 'appoint'
                ? v.run.id === input.taskId
                : v.tasks.some((t) => t.id === input.taskId),
            );
            if (!run) fail('NOT_FOUND', 'PROCESS_TASK_NOT_FOUND');
            const offers =
              input.action === 'appoint'
                ? await sdk.read(
                    () =>
                      sdk.approvals?.runActionsFor(owner.kind, p.recordId, {
                        id: c.get('auth')!.user.id,
                      }) ?? Promise.resolve([]),
                  )
                : [];
            const slots = offers
              .find((v) => v.run.id === run.run.id)
              ?.actions.find((a) => a.name === 'appoint')?.options?.unassigned;
            const places = Array.isArray(slots)
              ? slots.flatMap((slot) =>
                  slot &&
                  typeof slot === 'object' &&
                  'place' in slot &&
                  typeof slot.place === 'string'
                    ? [slot.place]
                    : [],
                )
              : [];
            const page = await sdk.read(
              () =>
                sdk.approvals?.candidatesFor({
                  target:
                    input.action === 'appoint'
                      ? { runId: input.taskId! }
                      : { taskId: input.taskId! },
                  action: input.action,
                  actor: { id: c.get('auth')!.user.id },
                  query: {
                    search: input.search,
                    offset: input.offset,
                    limit: input.limit,
                  },
                }) ?? Promise.resolve({ people: [], nextOffset: null }),
            );
            return {
              version: Number(
                owner.kind === 'oa.itRepair'
                  ? row.version
                  : row.lifecycleVersion,
              ),
              taskId: input.taskId,
              runId: run.run.id,
              contentHash: run.run.contentHash,
              places,
              people: await Promise.all(
                page.people.map(async (id) => (await person(id))!),
              ),
              nextOffset: page.nextOffset,
            };
          },
        );
        return c.json({ data });
      },
    );
    router.post(
      '/processManagement/executions/:kind/:recordId/managementActions',
      doc(
        'performProcessManagement',
        z.object({ detail: Detail, replayed: z.boolean() }),
      ),
      apiValidator('param', Params.required()),
      apiValidator('json', Command),
      async (c) => {
        const p = c.req.valid('param'),
          input = c.req.valid('json'),
          owner = ownerOf(p.kind),
          actorId = c.get('auth')!.user.id;
        await requirePolicy(c, owner, 'historyRead');
        const result = await management(
          c,
          owner,
          p.recordId,
          input.action,
          async (policy) => {
            const row = await scopedRow(owner, p.recordId, policy),
              sdk = await owner.sdk(app);
            if (
              Number(
                owner.kind === 'oa.itRepair'
                  ? row.version
                  : row.lifecycleVersion,
              ) !== input.expectedVersion
            )
              fail('ABORTED', 'PROCESS_CHANGED');
            if (input.action === 'terminate') {
              if (!owner.terminate)
                fail('FAILED_PRECONDITION', 'PROCESS_NOT_CONNECTED');
              return owner.terminate(
                app,
                p.recordId,
                actorId,
                input.expectedVersion,
                input.requestId,
                input.reason,
                policy,
              );
            } else {
              if (!owner.action)
                fail('FAILED_PRECONDITION', 'PROCESS_NOT_CONNECTED');
              const runs = await sdk.read(
                () =>
                  sdk.approvals?.runViewsFor(owner.kind, p.recordId) ??
                  Promise.resolve([]),
              );
              const run = runs.find(
                (v) =>
                  v.run.id === input.runId &&
                  (input.action === 'appoint'
                    ? v.run.id === input.taskId
                    : v.tasks.some((t) => t.id === input.taskId)),
              );
              if (
                !run ||
                run.definitionMissing ||
                run.run.contentHash !== input.contentHash
              )
                fail('ABORTED', 'PROCESS_CHANGED');
              return owner.action(
                app,
                p.recordId,
                {
                  target:
                    input.action === 'appoint'
                      ? { runId: input.taskId! }
                      : { taskId: input.taskId! },
                  action: input.action,
                  input: {
                    to: input.to!,
                    ...(input.place ? { place: input.place } : {}),
                  },
                  comment: input.reason,
                  requestId: input.requestId,
                  contentHash: input.contentHash,
                },
                actorId,
                policy,
              );
            }
          },
        );
        return c.json({
          data: {
            detail: await details(c, owner, p.recordId),
            replayed: Boolean(
              result &&
              typeof result === 'object' &&
              (('outcome' in result && result.outcome === 'replayed') ||
                ('replayed' in result && result.replayed === true)),
            ),
          },
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];

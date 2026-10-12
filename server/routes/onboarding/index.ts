import attachments from './attachments.js';
import { onboardingAssetServiceToken } from '../../providers/assets/contract.js';
import { Hono, type Context } from 'hono';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
  UserAdministrationError,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  onboardingServiceToken,
  OnboardingError,
  type Onboarding,
  type OnboardingTask,
} from '../../providers/onboarding/index.js';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { EmployeeError } from '../../providers/employees/errors.js';
import { RecruitmentSubmissionError } from '../../providers/recruitment/submission.js';
import * as S from './schemas.js';
import { organizationServiceToken } from '../../providers/org/index.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  ...attachments,
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(onboardingServiceToken),
      r = new Hono<Env>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (error, ctx) => {
      if (
        !(error instanceof OnboardingError) &&
        !(error instanceof EmployeeError) &&
        !(error instanceof UserAdministrationError) &&
        !(error instanceof RecruitmentSubmissionError)
      )
        return apiErrorHandler(error, ctx);
      const code =
          error instanceof RecruitmentSubmissionError
            ? error.reason
            : error.code,
        i18n = c.resolve(i18nToken),
        locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const key =
        code === 'ONBOARDING_FORBIDDEN'
          ? 'forbidden'
          : code.includes('IDEMPOTENCY')
            ? 'idempotencyConflict'
            : code === 'EMPLOYEE_ONBOARDING_ACCOUNT_ENABLED'
              ? 'employeeAccountEnabled'
              : code === 'EMPLOYEE_ONBOARDING_SOURCE_CONFLICT'
                ? 'employeeSourceConflict'
                : 'sourceInvalid';
      return apiErrorHandler(
        new ApiError({
          domain: 'onboarding',
          reason: code,
          message: code,
          status:
            code === 'ONBOARDING_FORBIDDEN'
              ? 'PERMISSION_DENIED'
              : code.includes('CONFLICT') ||
                  code === 'ONBOARDING_SOURCE_INVALID'
                ? 'ABORTED'
                : 'INVALID_ARGUMENT',
          localizedMessage: {
            locale,
            message: i18n.getFixedT(
              'nb3-oa',
              locale,
            )(`onboarding.errors.${key}`),
          },
        }),
        ctx,
      );
    });
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    async function policy(
      ctx: Context<Env>,
      action: string,
      collection:
        | 'onboardings'
        | 'onboardingTasks'
        | 'assets'
        | 'employees' = 'onboardings',
      resource = 'oa.onboarding',
    ): Promise<RepositoryPolicy> {
      const decision = await ctx
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const p =
        decision.effect === 'deny'
          ? undefined
          : decision.conditions?.database?.[collection];
      if (!p) throw new OnboardingError('ONBOARDING_FORBIDDEN');
      return p;
    }
    async function names(ids: (string | null)[], hideUnresolved = false) {
      const users = await c.resolve(userAdministrationServiceToken).list({
        userIds: [...new Set(ids.filter((id): id is string => !!id))],
        pageSize: 100,
        kind: 'all',
      });
      const found = new Map(users.items.map((user) => [user.id, user.name]));
      return (id: string | null) =>
        id && (found.has(id) || !hideUnresolved)
          ? { id, name: found.get(id) ?? id }
          : null;
    }
    async function recordDto(record: Onboarding) {
      const name = await names([record.creatorId, record.userId]);
      return S.Record.parse({
        ...record,
        creator: name(record.creatorId),
        user: name(record.userId),
      });
    }
    async function taskDto(task: OnboardingTask) {
      const name = await names([task.assigneeId, task.targetUserId]);
      return S.Task.parse({
        ...task,
        assignee: name(task.assigneeId),
        target: name(task.targetUserId),
      });
    }
    const doc = (
      operationId: string,
      schema:
        | typeof S.Record
        | typeof S.Detail
        | typeof S.Task
        | typeof S.Salary
        | typeof S.Bank
        | typeof S.TransferCandidates,
    ) =>
      describeRoute({
        operationId,
        summary: operationId,
        tags: ['Onboarding'],
        responses: {
          200: dataResponse(schema),
          400: apiErrorResponse(400),
          401: apiErrorResponses[401],
          403: apiErrorResponses[403],
          409: apiErrorResponse(409),
        },
      });
    r.get(
      '/onboardings',
      describeRoute({
        operationId: 'listOnboardings',
        summary: 'List onboarding records',
        tags: ['Onboarding'],
        responses: {
          200: listResponse(S.Record, S.Meta),
          400: apiErrorResponse(400),
          401: apiErrorResponses[401],
          403: apiErrorResponses[403],
        },
      }),
      apiValidator('query', S.ListQuery),
      async (ctx) => {
        const query = ctx.req.valid('query'),
          result = await service.list(
            query,
            db.connection(),
            await policy(ctx, 'view'),
          );
        return ctx.json({
          data: await Promise.all(result.items.map(recordDto)),
          meta: {
            page: query.page,
            pageSize: query.pageSize,
            total: result.total,
          },
        });
      },
    );
    r.post(
      '/onboardings',
      doc('createOnboarding', S.Record),
      apiValidator('json', S.Create),
      async (ctx) => {
        const { requestId, reason, ...input } = ctx.req.valid('json');
        const view = await policy(ctx, 'view'),
          write = await policy(ctx, 'create');
        const sourceDecision = await ctx.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.requisitions' },
          action: 'view',
        });
        const sourcePolicy =
          sourceDecision.effect === 'deny'
            ? undefined
            : sourceDecision.conditions?.database?.requisitions;
        if (!sourcePolicy) throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const mentorPolicy = input.mentorEmployeeId
          ? await policy(ctx, 'view', 'employees', 'oa.employees.directory')
          : undefined;
        const record = await db.transaction((tx) =>
          service.create(
            input,
            {
              actorId: actor(ctx),
              requestKey: requestId,
              reason,
            },
            tx,
            { ...write, read: view.read },
            sourcePolicy,
            mentorPolicy,
          ),
        );
        return ctx.json({ data: await recordDto(record) });
      },
    );
    r.get(
      '/onboardings/options',
      describeRoute({
        operationId: 'getOnboardingCreateOptions',
        summary: 'Current onboarding creation eligibility',
        tags: ['Onboarding'],
        responses: {
          200: dataResponse(S.CreateOptions),
          401: apiErrorResponses[401],
          403: apiErrorResponses[403],
        },
      }),
      async (ctx) => {
        await policy(ctx, 'view');
        const p = await policy(ctx, 'create'),
          tx = db.connection(),
          who = actor(ctx),
          employee = await c.resolve(employeeServiceToken).getByUserId(who, tx),
          user = await c
            .resolve(userAdministrationServiceToken)
            .withConnection(tx)
            .get(who);
        const create = p.create,
          required = [
            'id',
            'creatorId',
            'employeeId',
            'userId',
            'requisitionId',
            'departmentId',
            'positionId',
            'gradeId',
            'hireDate',
            'mentorEmployeeId',
            'mentorName',
            'workstationRequirement',
            'status',
            'version',
            'createdAt',
            'updatedAt',
          ];
        const allowedFields =
          create && create !== true ? create.fields : undefined;
        const fields =
          create === true
            ? true
            : create &&
              (allowedFields === undefined ||
                (allowedFields !== false &&
                  required.every((field) => allowedFields.includes(field))));
        const canCreate =
          !!fields &&
          !!employee?.active &&
          employee.status !== 'left' &&
          !!user &&
          !user.disabledAt &&
          user.kind !== 'service' &&
          (await c
            .resolve(organizationServiceToken)
            .hasDutyRole(who, 'hr', tx));
        return ctx.json({ data: { canCreate } });
      },
    );
    r.get(
      '/onboardings/:id',
      doc('getOnboarding', S.Detail),
      apiValidator('param', S.Params),
      async (ctx) => {
        const result = await service.detail(
          ctx.req.valid('param').id,
          db.connection(),
          await policy(ctx, 'view'),
          await policy(ctx, 'view', 'onboardingTasks'),
        );
        // Offers combine current record scopes with actual pool/HR eligibility. Writes still recheck in their transaction.
        const tx = db.connection(),
          who = actor(ctx),
          org = c.resolve(organizationServiceToken);
        const employee = await c
            .resolve(employeeServiceToken)
            .getByUserId(who, tx),
          user = await c
            .resolve(userAdministrationServiceToken)
            .withConnection(tx)
            .get(who);
        const active =
          !!employee?.active &&
          employee.status !== 'left' &&
          !!user &&
          !user.disabledAt &&
          user.kind !== 'service';
        const hr = active && (await org.hasDutyRole(who, 'hr', tx));
        async function permitted(
          action: string,
          collection: 'onboardings' | 'onboardingTasks',
          id: string,
        ) {
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.onboarding' },
            action,
          });
          const p =
            decision.effect === 'deny'
              ? undefined
              : decision.conditions?.database?.[collection];
          if (!p?.update || !p.read) return false;
          const row = await tx
            .repository(collection)
            .withPolicy(p)
            .findOne({ filter: { id } });
          const write = p.update;
          const required =
            collection === 'onboardings'
              ? ['status', 'version', 'updatedAt']
              : action === 'reassignMentor'
                ? ['targetUserId', 'assigneeId', 'version', 'updatedAt']
                : action === 'claim' ||
                    action === 'release' ||
                    action === 'transfer'
                  ? ['status', 'assigneeId', 'version', 'updatedAt']
                  : [
                      'status',
                      'facts',
                      'forced',
                      'assigneeId',
                      'version',
                      'updatedAt',
                    ];
          if (
            write !== true &&
            write.fields !== undefined &&
            (write.fields === false ||
              !required.every(
                (field) =>
                  write.fields !== false && write.fields?.includes(field),
              ))
          )
            return false;
          const writable = await tx
            .repository(collection)
            .withPolicy({
              ...p,
              read: {
                scope: write === true ? true : write.scope,
                fields: ['id'],
              },
            })
            .findOne({ filter: { id } });
          if (!writable) return false;
          const fields =
            collection === 'onboardings'
              ? Object.keys(result.record)
              : Object.keys(result.tasks.find((task) => task.id === id) ?? {});
          return !!row && fields.every((field) => field in row);
        }
        const tasks = await Promise.all(
          result.tasks.map(async (task) => {
            const candidate =
              active &&
              (task.targetUserId === who ||
                (!!task.dutyRoleCode &&
                  (await org.hasDutyRole(who, task.dutyRoleCode, tx))));
            const mutable =
              result.record.status === 'handling' ||
              (result.record.status === 'cancelled' &&
                task.kind.startsWith('recovery:'));
            const actions: (
              | 'claim'
              | 'release'
              | 'complete'
              | 'forceComplete'
              | 'transfer'
              | 'reassignMentor'
            )[] = [];
            if (
              mutable &&
              candidate &&
              task.status === 'open' &&
              (await permitted('claim', 'onboardingTasks', task.id))
            )
              actions.push('claim');
            if (
              mutable &&
              candidate &&
              task.status === 'claimed' &&
              task.assigneeId === who
            ) {
              for (const action of [
                'release',
                'complete',
                ...(task.dutyRoleCode ? ['transfer' as const] : []),
              ] as const)
                if (await permitted(action, 'onboardingTasks', task.id))
                  actions.push(action);
            }
            if (
              mutable &&
              hr &&
              task.kind === 'mentor' &&
              ['open', 'claimed'].includes(task.status) &&
              (await permitted('reassignMentor', 'onboardingTasks', task.id))
            ) {
              const head = await org.headOf(result.record.departmentId, tx);
              const user = head
                ? await c
                    .resolve(userAdministrationServiceToken)
                    .withConnection(tx)
                    .get(head)
                : null;
              const employee = head
                ? await c.resolve(employeeServiceToken).getByUserId(head, tx)
                : null;
              if (
                head &&
                head !== task.targetUserId &&
                user &&
                !user.disabledAt &&
                user.kind !== 'service' &&
                employee?.active &&
                employee.status !== 'left'
              )
                actions.push('reassignMentor');
            }
            const outstandingAssets =
              ['recovery:it', 'recovery:administration'].includes(task.kind) &&
              !!task.facts?.sourceTaskId &&
              (await c
                .resolve(onboardingAssetServiceToken)
                .hasOutstanding(task.facts.sourceTaskId, tx));
            if (
              mutable &&
              hr &&
              !outstandingAssets &&
              ['open', 'claimed'].includes(task.status) &&
              (task.kind !== 'it' ||
                c.resolve(calendarServiceToken).localDate(new Date()) >=
                  result.record.hireDate) &&
              (await permitted('forceComplete', 'onboardingTasks', task.id))
            )
              actions.push('forceComplete');
            return { ...(await taskDto(task)), actions };
          }),
        );
        const timelineNames = await names(
          result.timeline.flatMap((event) => [
            event.actorId,
            event.fromUserId ?? null,
            event.toUserId ?? null,
          ]),
          true,
        );
        const timeline = result.timeline.map(
          ({ actorId, fromUserId, toUserId, ...event }) =>
            S.TimelineEntry.parse({
              ...event,
              actor: timelineNames(actorId),
              ...(fromUserId && timelineNames(fromUserId)
                ? { from: timelineNames(fromUserId) }
                : {}),
              ...(toUserId && timelineNames(toUserId)
                ? { to: timelineNames(toUserId) }
                : {}),
            }),
        );
        return ctx.json({
          data: {
            timeline,
            timeZone: c.resolve(calendarServiceToken).timeZone(),
            record: await recordDto(result.record),
            tasks,
            canCancel:
              hr &&
              result.record.status === 'handling' &&
              (await permitted('cancel', 'onboardings', result.record.id)),
          },
        });
      },
    );
    for (const kind of ['salary', 'bank'] as const)
      r.get(
        `/onboardings/:id/${kind}`,
        doc(`getOnboarding${kind}`, kind === 'salary' ? S.Salary : S.Bank),
        apiValidator('param', S.Params),
        async (ctx) => {
          const result = await service.privateFacts(
            ctx.req.valid('param').id,
            kind,
            db.connection(),
            await policy(ctx, 'view'),
            await policy(ctx, kind === 'salary' ? 'viewSalary' : 'viewBank'),
          );
          return ctx.json({
            data:
              kind === 'salary' ? S.Salary.parse(result) : S.Bank.parse(result),
          });
        },
      );
    r.get(
      '/onboardings/:id/tasks/:taskId/transferCandidates',
      doc('listOnboardingTransferCandidates', S.TransferCandidates),
      apiValidator('param', S.TaskParams),
      async (ctx) => {
        const input = ctx.req.valid('param'),
          who = actor(ctx),
          tx = db.connection();
        const detail = await service.detail(
          input.id,
          tx,
          await policy(ctx, 'view'),
          await policy(ctx, 'view', 'onboardingTasks'),
        );
        const task = detail.tasks.find((t) => t.id === input.taskId);
        const transferPolicy = await policy(ctx, 'transfer', 'onboardingTasks');
        if (
          !task ||
          !(
            await tx
              .repository('onboardingTasks')
              .withPolicy(transferPolicy)
              .validateMutation({
                operation: 'updateOne',
                filter: { id: task.id },
                values: {
                  assigneeId: task.assigneeId,
                  status: task.status,
                  version: task.version,
                  updatedAt: new Date(),
                },
              })
          ).valid
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (!task?.dutyRoleCode || task.assigneeId !== who)
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        await service
          .authorizeAttachment(task.id, who, tx)
          .catch(async (error) => {
            // Finance tasks cannot upload files, but may transfer within their original duty pool.
            if (task.kind !== 'finance' && task.kind !== 'recovery:finance')
              throw error;
            const employee = await c
              .resolve(employeeServiceToken)
              .getByUserId(who, tx);
            const user = await c
              .resolve(userAdministrationServiceToken)
              .withConnection(tx)
              .get(who);
            if (
              !employee?.active ||
              employee.status === 'left' ||
              !user ||
              user.disabledAt ||
              user.kind === 'service' ||
              task.status !== 'claimed' ||
              !(
                detail.record.status === 'handling' ||
                (detail.record.status === 'cancelled' &&
                  task.kind.startsWith('recovery:'))
              ) ||
              !(await c
                .resolve(organizationServiceToken)
                .hasDutyRole(who, task.dutyRoleCode!, tx))
            )
              throw error;
          });
        const ids = await c
          .resolve(organizationServiceToken)
          .dutyRoleMembers(task.dutyRoleCode, tx);
        const candidates = [];
        const name = await names([...ids]);
        for (const id of ids) {
          const employee = await c
            .resolve(employeeServiceToken)
            .getByUserId(id, tx);
          const user = await c
            .resolve(userAdministrationServiceToken)
            .withConnection(tx)
            .get(id);
          if (
            id !== who &&
            employee?.active &&
            employee.status !== 'left' &&
            user &&
            !user.disabledAt &&
            user.kind !== 'service'
          )
            candidates.push(name(id)!);
        }
        return ctx.json({ data: candidates });
      },
    );
    r.post(
      '/onboardings/:id/tasks/:taskId/actions',
      doc('actOnboardingTask', S.Task),
      apiValidator('param', S.TaskParams),
      apiValidator('json', S.TaskAction),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          viewPolicy = await policy(ctx, 'view'),
          taskPolicy = await policy(ctx, input.action, 'onboardingTasks'),
          ordinaryTaskPolicy = await policy(ctx, 'view', 'onboardingTasks'),
          assetTask = input.assetUnits?.length
            ? await db
                .repository<OnboardingTask>('onboardingTasks')
                .withPolicy(taskPolicy)
                .findOne({
                  filter: {
                    id: ctx.req.valid('param').taskId,
                    onboardingId: ctx.req.valid('param').id,
                  },
                })
            : undefined,
          assetPolicy = input.assetUnits?.length
            ? await policy(
                ctx,
                assetTask?.kind?.startsWith('recovery:')
                  ? 'returnHeld'
                  : 'manage',
                'assets',
                'oa.assets',
              )
            : undefined,
          task = await db.transaction(async (tx) =>
            service.act(
              {
                ...ctx.req.valid('param'),
                expectedVersion: input.expectedVersion,
                action: input.action,
                ...(input.targetUserId
                  ? { targetUserId: input.targetUserId }
                  : {}),
                ...(input.attachmentIds
                  ? { attachmentIds: input.attachmentIds }
                  : {}),
                ...(input.facts ? { facts: input.facts } : {}),
                ...(input.assetUnits ? { assetUnits: input.assetUnits } : {}),
              },
              {
                actorId: actor(ctx),
                requestKey: input.requestId,
                reason: input.reason,
              },
              tx,
              viewPolicy,
              taskPolicy,
              assetPolicy,
              ordinaryTaskPolicy,
            ),
          );
        return ctx.json({ data: await taskDto(task) });
      },
    );
    r.post(
      '/onboardings/:id/cancel',
      doc('cancelOnboarding', S.Record),
      apiValidator('param', S.Params),
      apiValidator('json', S.Cancel),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          viewPolicy = await policy(ctx, 'view'),
          cancelPolicy = await policy(ctx, 'cancel'),
          record = await db.transaction(async (tx) =>
            service.cancel(
              ctx.req.valid('param').id,
              input.expectedVersion,
              {
                actorId: actor(ctx),
                requestKey: input.requestId,
                reason: input.reason,
              },
              tx,
              viewPolicy,
              cancelPolicy,
            ),
          );
        return ctx.json({ data: await recordDto(record) });
      },
    );
    const outer = new Hono();
    outer.route('/', r);
    return outer;
  }),
];

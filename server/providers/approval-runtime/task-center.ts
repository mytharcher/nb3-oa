import { writeTaskSummary } from '../task-center/summary.js';
import { measureApprovalPhase } from './timing.js';
import type { EnterStateHook } from '@nocobase/lifecycle';
import {
  defineApproval,
  type ApprovalTaskContributor,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import type {
  LifecycleRuntime,
  LifecycleTypes,
  Lifecycle,
  ServicesOf,
} from '@nocobase/lifecycle';
import type {
  UserTaskWriter,
  UserTaskService,
} from '@nocobase/app-plugin-task-center/server';

interface TaskCenterServices {
  reader: UserTaskService;
  contributor: ApprovalTaskContributor;
  applications: UserTaskWriter;
  workItems: UserTaskWriter;
  receipts: UserTaskWriter;
  dutyMembers(
    role: string,
    connection: DatabaseConnection,
  ): Promise<readonly string[]>;
}
const integrations = new WeakMap<DatabaseManager, TaskCenterServices>();
const runtimeDefinitions = new WeakMap<LifecycleRuntime, Lifecycle<never>>();
const runtimeDatabases = new WeakMap<LifecycleRuntime, DatabaseManager>();
const runtimeServices = new WeakMap<LifecycleRuntime, object>();
const integrationKey = Symbol('oa/task-center');

export function configureTaskCenter(
  db: DatabaseManager,
  services: TaskCenterServices,
): void {
  integrations.set(db, services);
}

/** Enrich only this application's runtime services; no plugin options are mutated. */
export function registerAppApproval<T extends LifecycleTypes>(
  db: DatabaseManager,
  runtime: LifecycleRuntime,
  definition: Lifecycle<T> & { readonly approval: unknown },
  source: T['services'] | ((handle: unknown) => T['services']),
): void {
  const proxies = new WeakMap<object, object>();
  const services = (handle: unknown) => {
    const original =
      typeof source === 'function'
        ? (source as (handle: unknown) => object)(handle)
        : source;
    let proxy = proxies.get(original as object);
    if (!proxy) {
      proxy = new Proxy(original as object, {
        get(target, key, receiver) {
          if (key === integrationKey) return integrations.get(db);
          const value: unknown = Reflect.get(target, key, receiver);
          return value;
        },
      });
      proxies.set(original as object, proxy);
    }
    return proxy as ServicesOf<T>;
  };
  runtimeServices.set(runtime, services);
  runtimeDatabases.set(runtime, db);
  runtimeDefinitions.set(runtime, definition as unknown as Lifecycle<never>);
  runtime.register(definition, { services });
}

export function taskCenterRuntimeServices(
  runtime: LifecycleRuntime,
): object | undefined {
  return runtimeServices.get(runtime);
}

export function taskCenterRuntimeDatabase(runtime: LifecycleRuntime) {
  const database = runtimeDatabases.get(runtime);
  if (!database)
    throw new Error('Approval task index database is unavailable.');
  return database;
}

/** Every OA approval shares the plugin's contributor and safe category-only titles. */
export function defineAppApproval<T extends LifecycleTypes>(
  options: Parameters<typeof defineApproval<T>>[0],
) {
  const integration = (services: unknown): TaskCenterServices | undefined =>
    services && typeof services === 'object'
      ? (Reflect.get(services, integrationKey) as
          TaskCenterServices | undefined)
      : undefined;
  const onEnterState: Partial<
    Record<T['state'], readonly EnterStateHook<T>[]>
  > = {};
  for (const state of options.states) {
    const name = typeof state === 'string' ? state : state.name;
    const original = options.onEnterState?.[name];
    const hooks: readonly EnterStateHook<T>[] =
      typeof original === 'function' ? [original] : (original ?? []);
    onEnterState[name] = [
      ...hooks,
      async (context) => {
        if (!integration(context.services)) return;
        await writeTaskSummary(
          context.tx.handle as DatabaseConnection,
          options.name,
          context.record,
          options.applicant(context.record),
          options.stateField,
        );
        if (context.record[options.stateField ?? 'status'] === 'draft')
          await integration(context.services)!.applications.put(
            {
              userId: options.applicant(context.record),
              sourceKey: `${options.name}:${context.record.id}`,
              subject: options.name,
              title: options.name,
              createdAt: context.now,
              status: 'pending',
            },
            context.tx.handle as DatabaseConnection,
          );
      },
    ];
  }
  return defineApproval<T>({
    ...options,
    userTasks:
      options.userTasks ??
      ((services) => {
        const center = integration(services);
        return center
          ? {
              contributor: center.contributor,
              describe: async (task, context) => {
                await (context.transaction.handle as DatabaseConnection)
                  .repository('oaTaskCenterTargets')
                  .upsertOne({
                    filter: {
                      sourceType:
                        task.kind === 'copy' ? 'approval.cc' : 'approval.task',
                      sourceKey: task.id,
                    },
                    create: {
                      sourceType:
                        task.kind === 'copy' ? 'approval.cc' : 'approval.task',
                      sourceKey: task.id,
                      subject: options.name,
                      recordId: task.recordId,
                    },
                    update: { subject: options.name, recordId: task.recordId },
                  });
                const connection = context.transaction
                  .handle as DatabaseConnection;
                const hasNumber = (
                  await connection.collections.get(options.collection)
                )?.fields?.some((field) => field.name === 'number');
                const record = await connection
                  .repository(options.collection)
                  .findOne({
                    filter: { id: task.recordId },
                    select: (s) =>
                      s.fields('id', ...(hasNumber ? ['number'] : [])),
                  });
                return {
                  subject: options.name,
                  title:
                    typeof record?.number === 'string' && record.number
                      ? record.number
                      : options.name,
                };
              },
            }
          : undefined;
      }),
    onEnterState,
    transitions: Object.fromEntries(
      Object.entries(options.transitions).map(([name, transition]) => [
        name,
        {
          ...transition,
          async onTransition(context) {
            await transition.onTransition?.(context);
            const center = integration(context.services);
            if (!center) return;
            const state = String(
              context.record[options.stateField ?? 'status'],
            );
            const terminal = options.states.some(
              (item) =>
                typeof item !== 'string' &&
                item.name === state &&
                'final' in item &&
                item.final,
            );
            if (state === 'draft') return;
            await center.applications.put(
              {
                userId: options.applicant(context.record),
                sourceKey: `${options.name}:${context.record.id}`,
                subject: options.name,
                title:
                  typeof context.record.number === 'string' &&
                  context.record.number
                    ? context.record.number
                    : options.name,
                createdAt: context.now,
                status: ['withdrawn', 'terminated', 'cancelled'].includes(state)
                  ? 'cancelled'
                  : terminal
                    ? 'completed'
                    : 'pending',
              },
              context.tx.handle as DatabaseConnection,
            );
          },
        },
      ]),
    ),
  });
}

export interface TaskDependencyScope {
  readonly assigneeIds: readonly string[];
}
const synchronizers = new WeakMap<
  DatabaseManager,
  Map<
    string,
    (
      connection: DatabaseConnection,
      scope?: TaskDependencyScope,
    ) => Promise<void>
  >
>();
export function registerTaskSynchronizer(
  db: DatabaseManager,
  source: string,
  sync: (
    connection: DatabaseConnection,
    scope?: TaskDependencyScope,
  ) => Promise<void>,
): void {
  const sources =
    synchronizers.get(db) ??
    new Map<
      string,
      (
        connection: DatabaseConnection,
        scope?: TaskDependencyScope,
      ) => Promise<void>
    >();
  sources.set(source, sync);
  synchronizers.set(db, sources);
}
export async function synchronizeTaskDependencies(
  db: DatabaseManager,
  source: string,
  connection: DatabaseConnection,
  scope?: TaskDependencyScope,
): Promise<void> {
  await measureApprovalPhase('taskDependencies', async () => {
    await synchronizers.get(db)?.get(source)?.(connection, scope);
  });
}

export function taskCenterDefinition(runtime: LifecycleRuntime) {
  return runtimeDefinitions.get(runtime);
}
export function taskCenterIntegration(db: DatabaseManager) {
  return integrations.get(db);
}

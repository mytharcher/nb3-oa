import { AsyncLocalStorage } from 'node:async_hooks';
import { ApprovalService } from '@nocobase/app-plugin-approval/server';
import {
  taskCenterIntegration,
  taskCenterRuntimeDatabase,
  taskCenterRuntimeServices,
} from './task-center.js';

type Input = ConstructorParameters<typeof ApprovalService>;
const inputs = new WeakMap<ApprovalService, Input>();
const serviceIdentity = Symbol('oa/approval-service-identity');
function canonicalService(service: ApprovalService): ApprovalService {
  return (
    (Reflect.get(service, serviceIdentity) as ApprovalService | undefined) ??
    service
  );
}

interface TaskTarget {
  sourceType: string;
  sourceKey: string;
  subject: string;
  recordId: string;
}
const reads = new AsyncLocalStorage<
  Map<ApprovalService, Map<string, Promise<readonly TaskTarget[]>>>
>();

/** Candidate caching is request-local. Every authorization still checks SDK facts. */
export function withApprovalQueryReads<T>(work: () => Promise<T>) {
  return reads.run(new Map(), work);
}

export function createAppApprovalService(...input: Input): ApprovalService {
  input[2] = taskCenterRuntimeServices(input[0]) ?? input[2];
  const service = new ApprovalService(...input);
  Object.defineProperty(service, serviceIdentity, { value: service });
  inputs.set(service, input);
  return service;
}

/** Public application bindings; no ApprovalQuery registration or observers. */
export function approvalTaskBindings(service: ApprovalService) {
  const input = inputs.get(canonicalService(service));
  if (!input)
    throw new Error('Approval owner did not use the application SDK factory.');
  return { runtime: input[0], approvals: input[1], services: input[2] };
}

export function approvalQuerySources(service: ApprovalService) {
  const binding = approvalTaskBindings(service);
  return binding.approvals.map((approval) => ({
    business: approval.name,
    kind: approval.kind,
    runtime: binding.runtime,
  }));
}

/** Read the owner's index only through its public API. Targets are application-owned.
 * Closed entries remain candidates so former assignees and actual task actors retain
 * historical access. A cancelled delegate entry alone never grants access. */
async function personalTargets(
  owner: ApprovalService,
  actorId: string,
): Promise<readonly TaskTarget[]> {
  const service = canonicalService(owner);
  const cache = reads.getStore();
  let people = cache?.get(service);
  if (cache && !people)
    cache.set(
      service,
      (people = new Map<string, Promise<readonly TaskTarget[]>>()),
    );
  const existing = people?.get(actorId);
  if (existing) return existing;
  const pending = (async () => {
    const binding = approvalTaskBindings(service);
    const db = taskCenterRuntimeDatabase(binding.runtime);
    const integration = taskCenterIntegration(db);
    if (!integration) throw new Error('Approval task index is not configured.');
    const targets: TaskTarget[] = [];
    for (const approval of binding.approvals) {
      for (const sourceType of ['approval.task', 'approval.cc']) {
        for (let page = 1; ; page++) {
          const result = await integration.reader.list(actorId, {
            subject: approval.name,
            sourceType,
            includeTotal: false,
            page,
            pageSize: 100,
          });
          if (result.data.length) {
            const rows = await db
              .repository<TaskTarget>('oaTaskCenterTargets')
              .findMany({
                filter: (f) =>
                  f.and([
                    f.string('sourceType').eq(sourceType),
                    f.string('subject').eq(approval.name),
                    f.or(
                      result.data.map((entry) =>
                        f.string('sourceKey').eq(entry.sourceKey),
                      ),
                    ),
                  ]),
              });
            targets.push(...rows);
          }
          if (result.data.length < 100) break;
        }
      }
    }
    return targets;
  })();
  people?.set(actorId, pending);
  void pending.catch(() => people?.delete(actorId));
  return pending;
}

/** Optional acceleration must never suppress an authoritative business action check. */
export async function hasApprovalAssignment(
  service: ApprovalService,
  lifecycle: string,
  recordId: string,
  actorId: string,
) {
  if (!reads.getStore()) return true;
  return (await personalTargets(service, actorId)).some(
    (target) => target.subject === lifecycle && target.recordId === recordId,
  );
}

export async function hasApprovalCandidate(
  service: ApprovalService,
  lifecycle: string,
  recordId: string | undefined,
  actorId: string,
) {
  if (!reads.getStore() || recordId === undefined) return true;
  const input = inputs.get(canonicalService(service));
  if (!input) return true;
  try {
    const services =
      typeof input[2] === 'function'
        ? (input[2] as (handle: unknown) => object)(undefined)
        : input[2];
    for (const approval of input[1])
      if (
        await approval.options
          .directory(services as never)
          .hasRole(actorId, 'approval.admin')
      )
        return true;
  } catch {
    // Transaction-only contexts keep the owning reader's authoritative checks.
    return true;
  }
  return (await service.involvementOf(lifecycle, recordId, actorId)).some(
    (relation) => relation === 'assignee' || relation === 'delegate',
  );
}

export async function hasApprovalTaskActor(
  service: ApprovalService,
  lifecycle: string,
  recordId: string,
  actorId: string,
) {
  return (await service.tasksFor(lifecycle, recordId)).some(
    (task) => task.actorId === actorId,
  );
}

/** Index entries locate candidates; precise current participation grants access.
 * Applicant and creator predicates remain in the owning business scope. */
export async function approvalReadableRecords(
  owner: ApprovalService,
  lifecycle: string,
  actorId: string,
  includeTaskActors: boolean,
): Promise<readonly string[]> {
  const service = canonicalService(owner);
  const candidates = new Set(
    (await personalTargets(service, actorId))
      .filter((target) => target.subject === lifecycle)
      .map((target) => target.recordId),
  );
  const ids: string[] = [];
  for (const recordId of candidates) {
    if (
      (await service.involvementOf(lifecycle, recordId, actorId)).length ||
      (includeTaskActors &&
        (await hasApprovalTaskActor(service, lifecycle, recordId, actorId)))
    ) {
      ids.push(recordId);
    }
  }
  return ids;
}

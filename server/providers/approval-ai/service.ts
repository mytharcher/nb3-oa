import { isUniqueViolation as unique } from './database-errors.js';
import type { AuditService } from '../audit/index.js';
import { randomUUID, createHash } from 'node:crypto';
import type {
  DatabaseManager,
  RepositoryRecord,
  RepositoryPolicy,
} from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { TaskRow } from '@nocobase/app-plugin-approval/server';
import type { ModelGateway } from '@nocobase/app-plugin-agents/server/tokens';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type { KnowledgeService } from '../knowledge/contract.js';
import { KnowledgeError } from '../knowledge/service.js';
import {
  type Material,
  type ReviewSettings,
  type ReviewView,
  type SettingsInput,
} from '../../../shared/approval-ai.js';
import type { AiActor, ReviewDefinition } from './contract.js';
import {
  InvalidOutputError,
  validateDefinition,
  render,
  parseOutput,
  modelError,
} from './prompt.js';
export class ApprovalAiError extends Error {
  constructor(public code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_SETTINGS') {
    super(code);
  }
}
type Row = RepositoryRecord & {
  id: string;
  taskId: string;
  userId: string;
  definitionId: string;
  recordId: string;
  lifecycle: string;
  via: 'assignee' | 'delegate';
  status: string;
  resultId: string | null;
  errorCode: string | null;
  requestKey: string | null;
  leaseToken: string | null;
  leaseExpiresAt: Date | null;
  feedback: string | null;
  feedbackNote: string | null;
};
type Result = RepositoryRecord & {
  id: string;
  fingerprint: string;
  definitionId: string;
  status: string;
  errorCode: string | null;
  attempts: number;
  nextAttemptAt: Date | null;
  leaseToken: string | null;
  leaseExpiresAt: Date | null;
  finishedAt: Date | null;
  modelService: string;
  model: string;
  materials: Material[];
  result: ReturnType<typeof parseOutput> | null;
};
const settingFields = [
  'definitionId',
  'enabled',
  'modelService',
  'model',
  'basis',
  'timeoutSeconds',
  'version',
] as const;
const TASKS = 'oaApprovalAiTaskReviews',
  RESULTS = 'oaApprovalAiResults',
  SETTINGS = 'oaApprovalAiSettings';
const open = (task: TaskRow) =>
  ['pending', 'claimed'].includes(task.status) && task.role !== 'info';
const retryable = (code: string | null) =>
  ['timeout', 'network', 'rate_limited'].includes(code ?? '');
const permanent = (code: string | null) =>
  ['disabled', 'task_closed', 'assignee_inactive'].includes(code ?? '');

export async function actorFor(
  authz: AppAuthorization,
  userId: string,
): Promise<AiActor> {
  const principal = { type: 'user', id: userId };
  return {
    userId,
    authz: authz.for({
      principal,
      subjects: [
        { type: 'authenticated', id: '*' },
        ...(await authz.subjects.resolveFor(principal)),
      ],
    }),
  };
}
export async function readPolicy(
  actor: AiActor,
  resource: string,
  collection: string,
) {
  const decision = await actor.authz.authorize({
    resource: { type: 'composite', id: resource },
    action: 'view',
  });
  if (decision.effect === 'deny') return undefined;
  return (
    (
      decision.conditions?.database as
        | Record<string, import('@nocobase/db').RepositoryPolicy | false>
        | undefined
    )?.[collection] || undefined
  );
}
export function createApprovalAiService(d: {
  db: DatabaseManager;
  audit: Pick<AuditService, 'record'>;
  authz: AppAuthorization;
  directory: ApprovalDirectoryService;
  knowledge: KnowledgeService;
  gateway: Pick<ModelGateway, 'catalog' | 'generate'>;
  dispatch: (id: string) => Promise<void>;
  warn: (message: string) => void;
  debug?: (details: Record<string, unknown>, message: string) => void;
  now?: () => Date;
}) {
  const definitions = new Map<string, ReviewDefinition>();
  const now = d.now ?? (() => new Date());
  const tasks = () => d.db.repository<Row>(TASKS);
  const results = () => d.db.repository<Result>(RESULTS);
  async function settings(id: string): Promise<ReviewSettings> {
    return (
      (await d.db
        .repository<ReviewSettings & RepositoryRecord>(SETTINGS)
        .findOne({ filter: { definitionId: id } })) ?? {
        definitionId: id,
        enabled: false,
        modelService: null,
        model: null,
        basis: {},
        timeoutSeconds: 120,
        version: 0,
      }
    );
  }
  async function handler(task: TaskRow, userId: string) {
    const directory = await d.directory.snapshot();
    if (!directory.isActive(userId)) return null;
    if (task.assigneeId === userId) return 'assignee' as const;
    if (task.kind !== 'decide') return null;
    const run = await definitionsFor(task)?.host.run(task);
    if (!run || run.applicantId === userId) return null;
    const delegate = directory.delegateOf?.(
      task.assigneeId,
      task.lifecycle,
      now().toISOString(),
      task.createdAt,
    );
    return delegate?.to === userId && delegate.mode !== 'forward'
      ? ('delegate' as const)
      : null;
  }
  function definitionsFor(task: TaskRow) {
    return [...definitions.values()].find(
      (def) =>
        def.approval.lifecycle.name === task.lifecycle &&
        def.stages.includes(task.stage),
    );
  }
  async function locate(taskId: string, userId: string) {
    const saved = await tasks().findOne({ filter: { taskId, userId } });
    for (const def of definitions.values()) {
      if (saved && saved.definitionId !== def.id) continue;
      const task = await def.host.task(taskId, saved?.recordId);
      if (!task || !def.stages.includes(task.stage) || task.role === 'info')
        continue;
      const via = await handler(task, userId);
      if (!via) throw new ApprovalAiError('NOT_FOUND');
      const actor = await actorFor(d.authz, userId);
      if (!(await def.host.canRead(actor, task.recordId)))
        throw new ApprovalAiError('NOT_FOUND');
      return { def, task, via, actor, saved };
    }
    throw new ApprovalAiError('NOT_FOUND');
  }
  async function dispatch(id: string) {
    try {
      await d.dispatch(id);
    } catch {
      d.warn('Approval AI dispatch failed; sweep will recover queued work.');
    }
  }
  async function enqueue(
    def: ReviewDefinition,
    task: TaskRow,
    userId: string,
    via: 'assignee' | 'delegate',
    triggerKind: string,
  ) {
    const id = createHash('sha256')
      .update(task.id + '\0' + userId)
      .digest('hex');
    try {
      await tasks().createOne({
        values: {
          id,
          taskId: task.id,
          userId,
          via,
          definitionId: def.id,
          lifecycle: task.lifecycle,
          recordId: task.recordId,
          stage: task.stage,
          runId: task.runId,
          assigneeId: task.assigneeId,
          status: 'queued',
          resultId: null,
          errorCode: null,
          requestKey: null,
          triggerKind,
          leaseToken: null,
          leaseExpiresAt: null,
          feedback: null,
          feedbackNote: null,
          feedbackAt: null,
          createdAt: now(),
          updatedAt: now(),
        },
      });
    } catch (e) {
      if (!unique(e)) throw e;
      return;
    }
    await dispatch(id);
  }
  async function assigned(task: TaskRow, triggerKind: string) {
    const def = definitionsFor(task);
    if (!def || !open(task) || !(await settings(def.id)).enabled) return;
    await enqueue(def, task, task.assigneeId, 'assignee', triggerKind);
    const directory = await d.directory.snapshot();
    const run = await def.host.run(task);
    const delegate =
      task.kind === 'decide'
        ? directory.delegateOf?.(
            task.assigneeId,
            task.lifecycle,
            now().toISOString(),
            task.createdAt,
          )
        : undefined;
    if (
      delegate &&
      delegate.mode !== 'forward' &&
      delegate.to !== task.assigneeId &&
      delegate.to !== run?.applicantId
    )
      await enqueue(def, task, delegate.to, 'delegate', triggerKind);
  }
  async function basis(
    actor: AiActor,
    def: ReviewDefinition,
    config: ReviewSettings,
  ) {
    const materials: Material[] = [];
    for (const slot of def.basis) {
      const id = config.basis[slot.key];
      const missing: Material = {
        kind: 'knowledge',
        ref: id ?? slot.key,
        label: slot.titleKey,
        status: 'missing',
        slot: slot.key,
      };
      if (!id) {
        materials.push(missing);
        continue;
      }
      const policy = await readPolicy(
          actor,
          'oa.knowledgeDocuments',
          'knowledgeDocuments',
        ),
        versionPolicy = await readPolicy(
          actor,
          'oa.knowledgeDocuments',
          'knowledgeVersions',
        );
      if (!policy || !versionPolicy) {
        materials.push(missing);
        continue;
      }
      try {
        const detail = await d.db.transaction((tx) =>
          d.knowledge.detail(id, actor.userId, tx, policy, versionPolicy),
        );
        const version = detail.versions.find(
          (v) => v.id === detail.document.latestVersionId,
        );
        if (!version) {
          materials.push(missing);
          continue;
        }
        if (version.kind !== 'markdown') {
          materials.push({
            ...missing,
            label: detail.document.title,
            status: 'not_supported',
            version: version.version,
          });
          continue;
        }
        // content() enforces the exact byte/field checks used by HTTP, beyond document visibility.
        materials.push({
          ...missing,
          label: detail.document.title,
          status: 'read',
          version: version.version,
          text: version.markdown ?? '',
        });
      } catch (e) {
        if (
          e instanceof KnowledgeError &&
          [
            'DOCUMENT_NOT_FOUND',
            'VERSION_NOT_FOUND',
            'ACCESS_DENIED',
            'NOT_FOUND',
          ].includes(e.code)
        )
          materials.push(missing);
        else throw e;
      }
    }
    return materials;
  }
  async function prepare(row: Row, token: string) {
    const def = definitions.get(row.definitionId);
    let code: string | null = null;
    const config = await settings(row.definitionId);
    const task = def ? await def.host.task(row.taskId, row.recordId) : null;
    if (!def || !config.enabled) code = 'disabled';
    else if (!task || !open(task)) code = 'task_closed';
    else if (!(await handler(task, row.userId))) code = 'assignee_inactive';
    else if (!config.modelService || !config.model) code = 'no_model';
    const actor = code ? null : await actorFor(d.authz, row.userId);
    if (actor && !(await def!.host.canRead(actor, row.recordId)))
      code = 'no_access';
    if (code) {
      await tasks().updateMany({
        filter: { id: row.id, status: 'preparing', leaseToken: token },
        values: {
          status: 'skipped',
          errorCode: code,
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now(),
        },
      });
      return null;
    }
    const run = await def!.host.run(task!);
    if (!run) throw new Error('Missing frozen approval run');
    const fields = Object.fromEntries(
      def!.fields
        .filter((f) => f in run.content)
        .map((f) => [f, run.content[f]]),
    );
    const content = await def!.host.content(actor!, task!, fields);
    const gathered = await def!.host.gather({
      actor: actor!,
      task: task!,
      content,
      tx: d.db.connection(),
    });
    const materials = [
      ...gathered,
      ...(await basis(actor!, def!, config)),
    ].sort((a, b) =>
      (a.kind + ':' + a.ref + ':' + (a.slot ?? '')).localeCompare(
        b.kind + ':' + b.ref + ':' + (b.slot ?? ''),
      ),
    );
    const model = { modelService: config.modelService!, model: config.model! };
    return {
      def: def!,
      config,
      content,
      materials,
      model,
      ...render(def!, content, materials, model),
    };
  }
  const service = {
    async register(def: ReviewDefinition) {
      validateDefinition(def);
      if (definitions.has(def.id))
        throw new Error('Duplicate AI definition: ' + def.id);
      if (
        [...definitions.values()].some(
          (x) =>
            x.approval.lifecycle.name === def.approval.lifecycle.name &&
            x.stages.some((s) => def.stages.includes(s)),
        )
      )
        throw new Error('Overlapping AI review stages');
      definitions.set(def.id, def);
    },
    async initialize() {
      for (const def of definitions.values()) {
        validateDefinition(def);
        if (
          await d.db
            .repository(SETTINGS)
            .findOne({ filter: { definitionId: def.id } })
        )
          continue;
        try {
          await d.db.repository(SETTINGS).createOne({
            values: {
              ...(await settings(def.id)),
              updatedAt: now(),
              updatedBy: null,
            },
          });
        } catch (e) {
          if (!unique(e)) throw e;
        }
      }
    },
    async taskAssigned(task: TaskRow) {
      try {
        await assigned(task, 'assigned');
      } catch {
        d.warn(
          'Approval AI enqueue failed; sweep will recover assigned tasks.',
        );
      }
    },
    async models() {
      const catalog = await d.gateway.catalog('chat');
      return catalog.services.flatMap((s) =>
        s.models
          .filter((m) => m.kind === 'chat')
          .map((m) => ({ modelService: s.name, model: m.value })),
      );
    },
    async definitions(t: (key: string) => string, policy?: RepositoryPolicy) {
      const visible = policy
        ? await d.db.repository(SETTINGS).withPolicy(policy).findMany()
        : null;
      return Promise.all(
        [...definitions.values()]
          .filter(
            (def) =>
              !visible ||
              visible.some(
                (row) =>
                  row.definitionId === def.id &&
                  settingFields.every((key) => key in row),
              ),
          )
          .map(async (def) => ({
            id: def.id,
            title: t(def.titleKey),
            stages: def.stages,
            checks: def.checks.map((c) => ({ id: c.id, title: t(c.titleKey) })),
            basis: def.basis.map((b) => ({
              key: b.key,
              title: t(b.titleKey),
              required: b.required,
            })),
            settings: visible
              ? (visible.find(
                  (row) => row.definitionId === def.id,
                ) as unknown as ReviewSettings)
              : await settings(def.id),
          })),
      );
    },
    async saveSettings(
      id: string,
      input: SettingsInput,
      userId: string,
      policy?: RepositoryPolicy,
    ) {
      const def = definitions.get(id);
      if (!def) throw new ApprovalAiError('NOT_FOUND');
      if (
        Object.keys(input.basis).some(
          (k) => !def.basis.some((b) => b.key === k),
        ) ||
        !!input.model !== !!input.modelService
      )
        throw new ApprovalAiError('INVALID_SETTINGS');
      if (
        input.model &&
        !(await service.models()).some(
          (m) =>
            m.model === input.model && m.modelService === input.modelService,
        )
      )
        throw new ApprovalAiError('INVALID_SETTINGS');
      const actor = await actorFor(d.authz, userId);
      for (const doc of Object.values(input.basis).filter(Boolean)) {
        const policy = await readPolicy(
            actor,
            'oa.knowledgeDocuments',
            'knowledgeDocuments',
          ),
          versionPolicy = await readPolicy(
            actor,
            'oa.knowledgeDocuments',
            'knowledgeVersions',
          );
        if (!policy || !versionPolicy)
          throw new ApprovalAiError('INVALID_SETTINGS');
        try {
          await d.db.transaction((tx) =>
            d.knowledge.detail(doc!, userId, tx, policy, versionPolicy),
          );
        } catch (e) {
          if (e instanceof KnowledgeError)
            throw new ApprovalAiError('INVALID_SETTINGS');
          throw e;
        }
      }
      if (policy) {
        const visible = await d.db
          .repository(SETTINGS)
          .withPolicy(policy)
          .findOne({ filter: { definitionId: id } });
        if (!visible || !settingFields.every((key) => key in visible))
          throw new ApprovalAiError('NOT_FOUND');
      }
      const { expectedVersion, ...values } = input;
      await d.db.transaction(async (tx) => {
        const before = await tx
          .repository(SETTINGS)
          .findOne({ filter: { definitionId: id } });
        const repository = policy
          ? tx.repository(SETTINGS).withPolicy(policy)
          : tx.repository(SETTINGS);
        const updated = await repository.updateMany({
          filter: { definitionId: id, version: expectedVersion },
          values: {
            ...values,
            version: expectedVersion + 1,
            updatedAt: now(),
            updatedBy: userId,
          },
        });
        if (!updated.updatedCount) throw new ApprovalAiError('CONFLICT');
        await d.audit.record(
          {
            actorId: userId,
            action: 'approvalAi.configure',
            targetType: SETTINGS,
            targetId: id,
            before,
            after: { ...values, version: expectedVersion + 1 },
          },
          tx,
        );
      });
      return settings(id);
    },
    async reviews(
      lifecycle: string,
      recordId: string,
      userId: string,
      t: (key: string) => string,
    ): Promise<ReviewView[]> {
      const actor = await actorFor(d.authz, userId);
      const views: ReviewView[] = [];
      // Batch own rows/results. Never read another handler's saved suggestion.
      const rows = await tasks().findMany({
        filter: { userId, lifecycle, recordId },
      });
      const resultIds = rows.flatMap((r) => (r.resultId ? [r.resultId] : []));
      const allResults = resultIds.length
        ? await results().findMany({
            filter: (f) => f.or(resultIds.map((id) => f.string('id').eq(id))),
          })
        : [];
      for (const def of definitions.values()) {
        if (
          def.approval.lifecycle.name !== lifecycle ||
          !(await def.host.canRead(actor, recordId))
        )
          continue;
        const config = await settings(def.id);
        const allTasks = await def.host.tasks(recordId);
        for (const task of allTasks) {
          if (!def.stages.includes(task.stage) || task.role === 'info')
            continue;
          const via = await handler(task, userId);
          if (!via) continue;
          const row = rows.find(
            (r) => r.taskId === task.id && r.definitionId === def.id,
          );
          if (!row && (!config.enabled || !open(task))) continue;
          const result =
            row?.status === 'linked' && row.resultId
              ? allResults.find((r) => r.id === row.resultId)
              : null;
          const status: ReviewView['status'] = !row
            ? 'none'
            : row.status === 'linked'
              ? ((result?.status as ReviewView['status']) ?? 'failed')
              : row.status === 'preparing'
                ? 'running'
                : (row.status as ReviewView['status']);
          const errorCode = result?.errorCode ?? row?.errorCode ?? null;
          views.push({
            taskId: task.id,
            via,
            definitionId: def.id,
            title: t(def.titleKey),
            stage: task.stage,
            taskOpen: open(task),
            status,
            errorCode,
            canGenerate:
              config.enabled &&
              open(task) &&
              !['queued', 'running'].includes(status) &&
              !permanent(errorCode),
            generatedAt: result?.finishedAt
              ? new Date(result.finishedAt).toISOString()
              : null,
            model: result
              ? { modelService: result.modelService, model: result.model }
              : null,
            findings:
              result?.result?.findings.map((f) => ({
                ...f,
                title: t(
                  def.checks.find((c) => c.id === f.checkId)?.titleKey ??
                    f.checkId,
                ),
                summary:
                  f.summary === 'approvalAi.requiredBasisMissing'
                    ? t(f.summary)
                    : f.summary,
              })) ?? null,
            coverage: (result?.materials ?? []).map((m) => ({
              ...m,
              label: m.status === 'missing' ? t(m.label) : m.label,
            })),
            basis: result?.result?.basis ?? null,
            feedback: row?.feedback
              ? { rating: row.feedback, note: row.feedbackNote }
              : null,
          });
        }
      }
      return views;
    },
    async generate(taskId: string, userId: string, requestKey: string) {
      const found = await locate(taskId, userId);
      const config = await settings(found.def.id);
      if (found.saved?.requestKey === requestKey) return { taskId };
      const views = await service.reviews(
        found.task.lifecycle,
        found.task.recordId,
        userId,
        (k) => k,
      );
      if (
        !config.enabled ||
        !views.find((v) => v.taskId === taskId)?.canGenerate
      )
        throw new ApprovalAiError('CONFLICT');
      if (!found.saved) {
        await enqueue(found.def, found.task, userId, found.via, 'manual');
        await tasks().updateMany({
          filter: { taskId, userId, requestKey: null },
          values: { requestKey },
        });
      } else {
        const updated = await tasks().updateMany({
          filter: {
            id: found.saved.id,
            status: found.saved.status,
            resultId: found.saved.resultId,
          },
          values: {
            status: 'queued',
            resultId: null,
            errorCode: null,
            triggerKind: 'manual',
            requestKey,
            feedback: null,
            feedbackNote: null,
            feedbackAt: null,
            updatedAt: now(),
          },
        });
        if (!updated.updatedCount) throw new ApprovalAiError('CONFLICT');
        await dispatch(found.saved.id);
      }
      return { taskId };
    },
    async feedback(
      taskId: string,
      userId: string,
      rating: string,
      note?: string,
    ) {
      const found = await locate(taskId, userId);
      if (!found.saved || !open(found.task) || found.saved.status !== 'linked')
        throw new ApprovalAiError('CONFLICT');
      const result = await results().findOne({
        filter: { id: found.saved.resultId!, status: 'succeeded' },
      });
      if (!result) throw new ApprovalAiError('CONFLICT');
      await tasks().updateMany({
        filter: { id: found.saved.id, resultId: result.id, status: 'linked' },
        values: {
          feedback: rating,
          feedbackNote: note ?? null,
          feedbackAt: now(),
          updatedAt: now(),
        },
      });
      return { taskId };
    },
    async process(id: string) {
      const token = randomUUID();
      const leaseExpiresAt = new Date(now().getTime() + 15 * 60_000);
      const claimed = await tasks().updateMany({
        filter: { id, status: 'queued' },
        values: {
          status: 'preparing',
          leaseToken: token,
          leaseExpiresAt,
          updatedAt: now(),
        },
      });
      if (!claimed.updatedCount) return;
      const claimedRow = await tasks().findOne({ filter: { id } });
      if (!claimedRow) return;
      const row: Row = claimedRow;
      let input: Awaited<ReturnType<typeof prepare>>;
      try {
        input = await prepare(row, token);
      } catch {
        await tasks().updateMany({
          filter: { id, status: 'preparing', leaseToken: token },
          values: {
            status: 'failed',
            errorCode: 'gather_failed',
            leaseToken: null,
            leaseExpiresAt: null,
            updatedAt: now(),
          },
        });
        return;
      }
      if (!input) return;
      const prepared = input;
      const resultToken = randomUUID();
      async function link() {
        return d.db.transaction(async (tx) => {
          const taskRepo = tx.repository<Row>(TASKS),
            resultRepo = tx.repository<Result>(RESULTS);
          // Conditional write locks this task and prevents a recovered preparation from linking late.
          const owns = await taskRepo.updateMany({
            filter: { id, status: 'preparing', leaseToken: token },
            values: { updatedAt: now() },
          });
          if (!owns.updatedCount) return null;
          let result = await resultRepo.findOne({
            filter: { fingerprint: prepared.fingerprint },
          });
          let execute = false;
          if (!result) {
            const created = await resultRepo.createOne({
              values: {
                id: randomUUID(),
                fingerprint: prepared.fingerprint,
                definitionId: prepared.def.id,
                definitionVersion: prepared.def.version,
                promptVersion: 1,
                ...prepared.model,
                status: 'running',
                errorCode: null,
                attempts: 1,
                nextAttemptAt: null,
                leaseToken: resultToken,
                leaseExpiresAt: new Date(
                  now().getTime() +
                    (prepared.config.timeoutSeconds + 30) * 1000,
                ),
                materials: prepared.materials.map(({ text: _text, ...m }) => m),
                result: null,
                createdAt: now(),
                updatedAt: now(),
                finishedAt: null,
              },
            });
            result = created.record;
            execute = true;
          } else if (
            result.status === 'failed' &&
            (row.triggerKind === 'manual' ||
              row.resultId === null ||
              !result.nextAttemptAt ||
              new Date(result.nextAttemptAt) <= now())
          ) {
            // New tasks and manual requests start a generation; sweeper retries keep the old resultId and a bounded budget.
            if (
              row.triggerKind === 'manual' ||
              row.resultId === null ||
              (retryable(result.errorCode) && result.attempts < 3)
            ) {
              const updated = await resultRepo.updateMany({
                filter: {
                  id: result.id,
                  status: 'failed',
                  attempts: result.attempts,
                },
                values: {
                  status: 'running',
                  attempts: result.attempts + 1,
                  errorCode: null,
                  nextAttemptAt: null,
                  leaseToken: resultToken,
                  leaseExpiresAt: new Date(
                    now().getTime() +
                      (prepared.config.timeoutSeconds + 30) * 1000,
                  ),
                  updatedAt: now(),
                  finishedAt: null,
                },
              });
              execute = !!updated.updatedCount;
            }
          }
          await taskRepo.updateMany({
            filter: { id, status: 'preparing', leaseToken: token },
            values: {
              status: 'linked',
              resultId: result.id,
              leaseToken: null,
              leaseExpiresAt: null,
              errorCode: null,
              updatedAt: now(),
            },
          });
          return execute ? result.id : null;
        });
      }
      let resultId: string | null;
      try {
        resultId = await link();
      } catch (e) {
        if (unique(e)) resultId = await link();
        else throw e;
      }
      if (!resultId) return;
      const startedAt = Date.now();
      const diagnosticContext = {
        reviewId: id,
        resultId,
        definitionId: prepared.def.id,
        ...prepared.model,
      };
      d.debug?.(
        {
          ...diagnosticContext,
          timeoutSeconds: prepared.config.timeoutSeconds,
          maxOutputTokens: prepared.def.maxOutputTokens ?? 4000,
          materials: prepared.materials.map(({ kind, status }) => ({
            kind,
            status,
          })),
        },
        'Approval AI generation started',
      );
      const signal = AbortSignal.timeout(prepared.config.timeoutSeconds * 1000);
      let result: ReturnType<typeof parseOutput> | null = null,
        errorCode: string | null = null;
      try {
        const response = await d.gateway.generate({
          model: prepared.model,
          system: prepared.system,
          prompt: prepared.prompt,
          maxOutputTokens: prepared.def.maxOutputTokens ?? 4000,
          source: 'oa.approval-ai/' + prepared.def.id,
          signal,
        });
        d.debug?.(
          {
            ...diagnosticContext,
            elapsedMs: Date.now() - startedAt,
            responseChars: response.text.length,
          },
          'Approval AI model response received',
        );
        try {
          result = parseOutput(
            response.text,
            prepared.def,
            prepared.content,
            prepared.materials,
          );
        } catch (error) {
          errorCode = 'invalid_output';
          d.debug?.(
            {
              ...diagnosticContext,
              ...(error instanceof InvalidOutputError
                ? error.diagnostics
                : { stage: 'unknown' }),
            },
            'Approval AI output validation failed',
          );
        }
      } catch (error) {
        errorCode = modelError(error, signal.aborted);
        d.debug?.(
          { ...diagnosticContext, errorCode, timedOut: signal.aborted },
          'Approval AI model call failed',
        );
      }
      d.debug?.(
        { ...diagnosticContext, errorCode, elapsedMs: Date.now() - startedAt },
        'Approval AI generation completed',
      );
      const current = await results().findOne({ filter: { id: resultId } });
      const nextAttemptAt =
        errorCode && retryable(errorCode) && (current?.attempts ?? 3) < 3
          ? new Date(
              now().getTime() +
                ((current?.attempts ?? 1) === 1 ? 60_000 : 300_000),
            )
          : null;
      await results().updateMany({
        filter: { id: resultId, status: 'running', leaseToken: resultToken },
        values: {
          status: errorCode ? 'failed' : 'succeeded',
          result,
          errorCode,
          nextAttemptAt,
          leaseToken: null,
          leaseExpiresAt: null,
          finishedAt: now(),
          updatedAt: now(),
        },
      });
    },
    async sweep() {
      for (const def of definitions.values())
        if ((await settings(def.id)).enabled)
          for (const task of await def.host.openTasks(200))
            await assigned(task, 'sweep');
      await tasks().updateMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('preparing'),
            f.date('leaseExpiresAt').before(now()),
          ]),
        values: {
          status: 'queued',
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now(),
        },
      });
      await results().updateMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('running'),
            f.date('leaseExpiresAt').before(now()),
          ]),
        values: {
          status: 'failed',
          errorCode: 'timeout',
          nextAttemptAt: now(),
          leaseToken: null,
          leaseExpiresAt: null,
          updatedAt: now(),
        },
      });
      const due = await results().findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('failed'),
            f.date('nextAttemptAt').notAfter(now()),
            f.number('attempts').lt(3),
          ]),
        limit: 200,
      });
      for (const result of due) {
        // One fresh handler reassembles input; closed/revoked handlers are skipped without spending a model call.
        const links = await tasks().findMany({
          filter: { resultId: result.id, status: 'linked' },
          limit: 200,
        });
        for (const link of links)
          await tasks().updateMany({
            filter: { id: link.id, status: 'linked', resultId: result.id },
            values: {
              status: 'queued',
              triggerKind: 'sweep',
              updatedAt: now(),
            },
          });
      }
      const queued = await tasks().findMany({
        filter: { status: 'queued' },
        limit: 200,
      });
      for (const row of queued) await dispatch(row.id);
    },
  };
  return service;
}
export type ApprovalAiService = ReturnType<typeof createApprovalAiService>;
import { createServiceToken } from '@nocobase/service-provider';
export const approvalAiServiceToken =
  createServiceToken<ApprovalAiService>('oa/approval-ai');

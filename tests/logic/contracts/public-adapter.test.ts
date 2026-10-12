// @vitest-environment node
import { randomUUID, createHash } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { expect, it } from 'vitest';
import { z } from 'zod';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest } from '../platform/helpers.js';
import {
  LifecycleRuntime,
  MemoryLifecycleStore,
  createRepositoryLifecycleStore,
  type LifecycleRecord,
  type LifecycleStore,
  type JsonObject,
} from '@nocobase/lifecycle';
import {
  ApprovalService,
  defineApproval,
  approvalState,
  stagesFor,
  approve,
  reject,
  claimAction,
  addSigner,
  allActivePeople,
  returnTo,
  defineApprovalAction,
  offered,
  unavailable,
  placeOfTask,
  outputsOf,
  type ActionContext,
  type DecisionInput,
  type Effect,
  type ApprovalDirectory,
  type Approval,
} from '@nocobase/app-plugin-approval/server';
interface ProofRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  text: string;
  amount: number;
  template: string;
  paymentTerms: string;
  policyVersion: number;
  nonStandard: boolean | null;
}
type State =
  | 'draft'
  | 'revision'
  | 'legalFinance'
  | 'standardFinance'
  | 'gm'
  | 'done'
  | 'rejected';
interface Types {
  record: ProofRecord;
  state: State;
  services: { directory: ApprovalDirectory };
}
const KIND = 'proof.contract';
const coverage = {
  legal: ['text'],
  finance: ['amount', 'paymentTerms'],
} as const;
function digest(
  record: Readonly<Record<string, unknown>> | LifecycleRecord,
  fields: readonly string[],
) {
  return createHash('sha256')
    .update(JSON.stringify(fields.map((key) => [key, record[key]])))
    .digest('hex');
}
function fixture(nativeReuse = false, existingStore?: LifecycleStore) {
  const store = existingStore ?? new MemoryLifecycleStore(),
    pools = { legal: ['legal1', 'legal2'], finance: ['finance1', 'finance2'] };
  const active = new Set([
    'applicant',
    'legalExtra',
    'gm',
    ...pools.legal,
    ...pools.finance,
  ]);
  const directory: ApprovalDirectory = {
    isActive: (id) => active.has(id),
    managerOf: () => undefined,
    searchPeople: ({ offset, limit }) =>
      [...active].slice(offset, offset + limit),
    hasRole: (id, role) =>
      role === 'admin'
        ? id === 'admin'
        : role in pools && pools[role as keyof typeof pools].includes(id),
  };
  const nativeApprove = approve();
  const guardedApprove = defineApprovalAction<DecisionInput, undefined>({
    ...nativeApprove,
    async available(context) {
      const result = await nativeApprove.available(context);
      if (!result.ok) return result;
      const place =
        context.task &&
        context.task.depth === 0 &&
        placeOfTask(context.places, context.task);
      const options = { ...result.options };
      if (place && place.pool === 'legal') {
        const output = options.outputs;
        if (
          output &&
          typeof output === 'object' &&
          !Array.isArray(output) &&
          Array.isArray(output.fields)
        )
          options.outputs = {
            ...output,
            fields: output.fields.map((field) =>
              field && typeof field === 'object' && !Array.isArray(field)
                ? { ...field, required: true }
                : field,
            ),
          };
      } else delete options.outputs;
      return offered(options);
    },
    async validate(input, context) {
      const problem = await nativeApprove.validate?.(input, context);
      if (problem) return problem;
      const task = context.task,
        place = task && placeOfTask(context.places, task);
      const owns = Object.hasOwn(input.data ?? {}, 'nonStandard');
      if (!task || task.depth !== 0 || !place?.pool)
        return owns
          ? 'Only an original pool place may supply legal facts.'
          : null;
      if (
        place.pool === 'legal' &&
        typeof input.data?.nonStandard !== 'boolean'
      )
        return 'A legal approval requires its nonStandard boolean.';
      if (place.pool !== 'legal' && owns)
        return 'Finance cannot supply legal nonStandard facts.';
      return null;
    },
  });
  async function reusable(context: ActionContext) {
    const history = await approvals.runViewsFor(
      KIND,
      String(context.record.id),
    );
    const facts: {
      currentTaskId: string;
      sourceTaskId: string;
      sourceRunId: string;
      reviewerId: string;
      pool: string;
      data: { nonStandard?: boolean };
      hash: string;
    }[] = [];
    for (const place of context.places) {
      if (place.pool !== 'legal' && place.pool !== 'finance') continue;
      if (
        context.stay.some(
          (t) =>
            t.order === place.order &&
            t.depth === 0 &&
            t.status === 'completed',
        )
      )
        continue;
      const fields = coverage[place.pool];
      for (const previous of [...history].reverse()) {
        if (
          previous.run.id === context.run.id ||
          previous.run.status !== 'returned' ||
          previous.run.version !== context.run.version ||
          previous.run.settings.approvalGraph !==
            context.run.settings.approvalGraph
        )
          continue;
        if (
          previous.run.plan[0]?.stage !== context.stage ||
          previous.run.content.template !== context.record.template ||
          previous.run.content.policyVersion !== context.record.policyVersion ||
          digest(previous.run.content, fields) !==
            digest(context.record, fields)
        )
          continue;
        const previousPool = previous.stages
          .find((s) => s.key === context.stage)
          ?.pools.findIndex((p) => p.key === place.pool);
        const source = previous.tasks.find(
          (t) =>
            t.stage === context.stage &&
            t.order === previousPool &&
            t.depth === 0 &&
            t.kind === 'decide' &&
            t.status === 'completed' &&
            t.answer === 'approve' &&
            t.actorId === t.assigneeId,
        );
        if (
          !source ||
          !context.directory.isActive(source.assigneeId) ||
          !context.directory.hasRole(source.assigneeId, place.pool)
        )
          continue;
        const current = context.stay.find(
          (t) =>
            t.order === place.order &&
            t.depth === 0 &&
            t.assigneeId === source.assigneeId &&
            t.status === 'candidate',
        );
        if (!current || !place.plannedFor.includes(source.assigneeId)) continue;
        if (
          place.pool === 'legal' &&
          typeof source.data?.nonStandard !== 'boolean'
        )
          continue;
        facts.push({
          currentTaskId: current.id,
          sourceTaskId: source.id,
          sourceRunId: previous.run.id,
          reviewerId: source.assigneeId,
          pool: place.pool,
          data:
            place.pool === 'legal'
              ? { nonStandard: source.data!.nonStandard as boolean }
              : {},
          hash: digest(context.record, fields),
        });
        break;
      }
    }
    return facts;
  }
  const reuse = defineApprovalAction<Record<string, never>, undefined>({
    name: 'reuseOpinions',
    scope: 'run',
    actors: ['applicant'],
    guards: ['runOpen', 'contentCurrent', 'activeActor'],
    available: async (context) =>
      (await reusable(context)).length
        ? offered()
        : unavailable('NOT_ALLOWED', 'No unchanged trusted prior opinions.'),
    validate: (input) =>
      Object.keys(input).length
        ? 'Reuse accepts no caller-supplied facts.'
        : null,
    async plan(_input, context): Promise<readonly Effect[]> {
      return (await reusable(context)).flatMap((fact): Effect[] => [
        { type: 'status', task: fact.currentTaskId, status: 'claimed' },
        {
          type: 'answer',
          task: fact.currentTaskId,
          answer: 'approve',
          data: fact.data,
          detail: {
            evidenceKind: 'reusedOpinion',
            sourceTaskId: fact.sourceTaskId,
            sourceRunId: fact.sourceRunId,
            reviewerId: fact.reviewerId,
            coverageHash: fact.hash,
          },
          comment:
            'Reused unchanged original opinion; this is not a new reviewer vote.',
        },
      ]);
    },
  });
  const stage = stagesFor<Types>();
  const shared = {
    actions: [
      claimAction,
      guardedApprove,
      reject(),
      returnTo({ targets: ['revision'] }),
      reuse,
      addSigner({ recipients: allActivePeople(), modes: ['alongside'] }),
    ],
    covers: ['text', 'amount', 'paymentTerms', 'template', 'policyVersion'],
    reuse: nativeReuse ? ('unchanged' as const) : undefined,
    onEmpty: 'hold' as const,
  };
  const graph = defineApproval<Types>({
    name: KIND,
    collection: 'contractProofRequests',
    initial: 'draft',
    version: 1,
    applicant: (r) => r.applicantId,
    directory: (s) => s.directory,
    freeze: ['text', 'amount', 'paymentTerms', 'template', 'policyVersion'],
    assignment: [
      {
        name: 'differentReviewers',
        apply(context) {
          if (
            context.stay.some(
              (t) =>
                t.id !== context.replacing?.id &&
                t.assigneeId === context.spec.assigneeId &&
                t.order !== context.spec.order &&
                !['voided', 'transferred'].includes(t.status),
            )
          )
            return {
              kind: 'refuse',
              code: 'NOT_ALLOWED',
              message: 'Different seats require different reviewers.',
            };
          return { kind: 'keep' };
        },
      },
    ],
    states: [
      'draft',
      'revision',
      approvalState(
        'legalFinance',
        stage.all({
          ...shared,
          pools: [
            { key: 'legal', claimable: true, candidates: () => pools.legal },
            {
              key: 'finance',
              claimable: true,
              candidates: () =>
                pools.finance.filter((id) => !pools.legal.includes(id)),
            },
          ],
          outputs: {
            fields: { nonStandard: z.boolean() },
            merge(tasks): JsonObject {
              const values = tasks.filter(
                (t) =>
                  t.answer === 'approve' &&
                  typeof t.data.nonStandard === 'boolean',
              );
              if (values.length > 1)
                throw new Error(
                  'Exactly one trusted original legal opinion is required.',
                );
              return values.length
                ? { nonStandard: values[0].data.nonStandard }
                : {};
            },
            writes: { nonStandard: 'nonStandard' },
          },
        }),
      ),
      approvalState(
        'standardFinance',
        stage.all({
          ...shared,
          pools: [
            {
              key: 'finance',
              claimable: true,
              candidates: () => pools.finance,
            },
          ],
        }),
      ),
      approvalState(
        'gm',
        stage.single({ assignee: () => 'gm', actions: shared.actions }),
      ),
      { name: 'done', final: true },
      { name: 'rejected', final: true },
    ],
    transitions: {
      submit: {
        from: ['draft', 'revision'],
        to: ['legalFinance', 'standardFinance'],
        route: ({ record }) =>
          record.template === 'standard' ? 'standardFinance' : 'legalFinance',
      },
      edit: {
        from: 'revision',
        to: 'revision',
        set: ({ input }) =>
          z
            .strictObject({
              text: z.string().optional(),
              amount: z.number().int().optional(),
              paymentTerms: z.string().optional(),
              template: z.string().optional(),
              policyVersion: z.number().int().optional(),
            })
            .parse(input),
      },
      approved: {
        from: 'legalFinance',
        to: ['gm', 'done'],
        route: (context) =>
          outputsOf(context).nonStandard === true ? 'gm' : 'done',
        approvalOutcome: 'approved',
        guard: (context) => typeof outputsOf(context).nonStandard === 'boolean',
      },
      gmApproved: { from: 'gm', to: 'done', approvalOutcome: 'approved' },
      gmReturned: { from: 'gm', to: 'revision', approvalOutcome: 'returned' },
      gmRejected: { from: 'gm', to: 'rejected', approvalOutcome: 'rejected' },
      standardApproved: {
        from: 'standardFinance',
        to: 'done',
        approvalOutcome: 'approved',
      },
      returned: {
        from: 'legalFinance',
        to: 'revision',
        approvalOutcome: 'returned',
      },
      standardReturned: {
        from: 'standardFinance',
        to: 'revision',
        approvalOutcome: 'returned',
      },
      rejected: {
        from: ['legalFinance', 'standardFinance'],
        to: 'rejected',
        approvalOutcome: 'rejected',
      },
    },
  });
  // Public store transaction adapter binds public SDK history reads to the
  // current caller transaction. No plugin collection is read or written here.
  const transactions = new AsyncLocalStorage<unknown>();
  function withinStore(target: LifecycleStore): LifecycleStore {
    return new Proxy(target, {
      get(base, key) {
        if (key === 'transaction')
          return async <T>(
            work: (s: LifecycleStore) => Promise<T>,
            options?: Parameters<LifecycleStore['transaction']>[1],
          ) =>
            base.transaction(
              (tx) =>
                transactions.run(tx.transactionHandle, () =>
                  work(withinStore(tx)),
                ),
              {
                ...options,
                within: options?.within ?? transactions.getStore(),
              },
            );
        const value: unknown = Reflect.get(base, key);
        return typeof value === 'function' ? value.bind(base) : value;
      },
    });
  }
  const runtime = new LifecycleRuntime({ store: withinStore(store) });
  const services = () => ({ directory });
  runtime.register(graph, { services });
  const approvals = new ApprovalService(
    runtime,
    [graph.approval as unknown as Approval<never>],
    services,
  );
  let id: string;
  async function create() {
    const result = await runtime.create(
      KIND,
      {
        id: randomUUID(),
        applicantId: 'applicant',
        text: 'Terms v1',
        amount: 100,
        template: 'custom',
        paymentTerms: '30 days',
        policyVersion: 1,
        nonStandard: null,
      },
      { actor: { id: 'applicant' } },
    );
    id = String(result.record.id);
    await runtime.fire(KIND, id, 'submit', { actor: { id: 'applicant' } });
  }
  async function view() {
    return (await approvals.runViewsFor(KIND, id)).at(-1)!;
  }
  async function action(
    person: string,
    name: string,
    data?: { nonStandard?: boolean | null },
  ) {
    const v = await view(),
      task = v.tasks.find(
        (t) =>
          t.assigneeId === person &&
          ['candidate', 'claimed', 'pending'].includes(t.status),
      )!;
    return approvals.perform({
      target: { taskId: task.id },
      actor: { id: person },
      action: name,
      contentHash: v.run.contentHash,
      comment: 'Actual reviewer decision',
      input: name === 'return' ? { to: 'revision' } : data ? { data } : {},
    });
  }
  async function offers(person: string) {
    return approvals.actionsFor(KIND, id, { id: person });
  }
  async function addLegalSigner() {
    const v = await view(),
      task = v.tasks.find(
        (t) => t.assigneeId === 'legal1' && t.status === 'claimed',
      )!;
    return approvals.addSigner({
      taskId: task.id,
      actor: { id: 'legal1' },
      person: 'legalExtra',
      mode: 'alongside',
    });
  }
  async function revise(changes: object) {
    await runtime.fire(KIND, id, 'edit', {
      actor: { id: 'applicant' },
      input: { ...changes },
    });
    await runtime.fire(KIND, id, 'submit', { actor: { id: 'applicant' } });
  }
  async function reuseNow(input = {}) {
    const v = await view();
    return approvals.perform({
      target: { runId: v.run.id },
      actor: { id: 'applicant' },
      action: 'reuseOpinions',
      contentHash: v.run.contentHash,
      input,
    });
  }
  return {
    store,
    pools,
    active,
    create,
    view,
    action,
    revise,
    reuseNow,
    addLegalSigner,
    offers,
    record: () => {
      if (!(store instanceof MemoryLifecycleStore))
        throw new Error('Use async public read on repository stores.');
      return store.record('contractProofRequests', id);
    },
    readRecord: () => runtime.transaction((tx) => tx.read(KIND, id)),
  };
}
it('keeps native two claimable pools and blocks omitted/null legal output and finance injection', async () => {
  const f = fixture();
  await f.create();
  await expect(
    f.action('legal1', 'approve', { nonStandard: true }),
  ).rejects.toThrow();
  await f.action('legal1', 'claim');
  await expect(f.action('legal1', 'approve')).rejects.toThrow('requires');
  await expect(
    f.action('legal1', 'approve', { nonStandard: null }),
  ).rejects.toThrow();
  await f.action('finance1', 'claim');
  const legalOffers = await f.offers('legal1'),
    financeOffers = await f.offers('finance1');
  expect(
    legalOffers
      .flatMap((entry) => entry.actions)
      .find((a) => a.name === 'approve')?.options?.outputs,
  ).toMatchObject({ fields: [{ name: 'nonStandard', required: true }] });
  expect(
    financeOffers
      .flatMap((entry) => entry.actions)
      .find((a) => a.name === 'approve')?.options?.outputs,
  ).toBeUndefined();
  await expect(
    f.action('finance1', 'approve', { nonStandard: false }),
  ).rejects.toThrow('Finance');
  await f.action('finance1', 'approve');
  expect(f.record()?.status).toBe('legalFinance');
  await f.action('legal1', 'approve', { nonStandard: true });
  expect(f.record()).toMatchObject({ status: 'gm', nonStandard: true });
  await f.action('gm', 'approve');
  expect(f.record()?.status).toBe('done');
});
it('native unchanged reuse cannot independently reuse legal approval after amount changes', async () => {
  const f = fixture(true);
  await f.create();
  await f.action('legal1', 'claim');
  await f.action('legal1', 'approve', { nonStandard: false });
  await f.action('finance1', 'claim');
  await f.action('finance1', 'return');
  await f.revise({ amount: 101 });
  expect(
    (await f.view()).tasks.filter((t) => t.answer === 'approve'),
  ).toHaveLength(0);
});
it('public trusted reuse action restores only unchanged legal opinion and retains original evidence identity', async () => {
  const f = fixture();
  await f.create();
  await f.action('legal1', 'claim');
  await f.action('legal1', 'approve', { nonStandard: true });
  const original = (await f.view()).tasks.find((t) => t.answer === 'approve')!;
  await f.action('finance1', 'claim');
  await f.action('finance1', 'return');
  await f.revise({ amount: 101 });
  await expect(f.reuseNow({ sourceTaskId: original.id })).rejects.toThrow(
    'caller',
  );
  await f.reuseNow();
  const v = await f.view();
  expect(v.tasks.filter((t) => t.answer === 'approve')).toMatchObject([
    { assigneeId: 'legal1', actorId: 'applicant', data: { nonStandard: true } },
  ]);
  expect(
    v.events.some(
      (e) =>
        e.kind === 'task.answered' &&
        e.data.sourceTaskId === original.id &&
        e.data.reviewerId === 'legal1',
    ),
  ).toBe(true);
  await f.action('finance2', 'claim');
  await f.action('finance2', 'approve');
  expect(f.record()?.status).toBe('gm');
  await f.action('gm', 'approve');
  expect(f.record()).toMatchObject({
    status: 'done',
    amount: 101,
    nonStandard: true,
  });
});
it('public trusted reuse restores finance only when text changes', async () => {
  const f = fixture();
  await f.create();
  await f.action('finance1', 'claim');
  await f.action('finance1', 'approve');
  await f.action('legal1', 'claim');
  await f.action('legal1', 'return');
  await f.revise({ text: 'Terms v2' });
  await f.reuseNow();
  expect(
    (await f.view()).tasks.filter((t) => t.answer === 'approve'),
  ).toMatchObject([{ assigneeId: 'finance1' }]);
  await f.action('legal2', 'claim');
  await f.action('legal2', 'approve', { nonStandard: false });
  expect(f.record()).toMatchObject({
    status: 'done',
    text: 'Terms v2',
    nonStandard: false,
  });
});
for (const condition of [
  'coverage',
  'identity',
  'inactive',
  'policy',
  'template',
] as const) {
  it(`refuses trusted reuse when ${condition} changes`, async () => {
    const f = fixture();
    await f.create();
    await f.action('legal1', 'claim');
    await f.action('legal1', 'approve', { nonStandard: false });
    await f.action('finance1', 'claim');
    await f.action('finance1', 'return');
    if (condition === 'identity') f.pools.legal.splice(0, 1);
    if (condition === 'inactive') f.active.delete('legal1');
    await f.revise(
      condition === 'coverage'
        ? { text: 'changed', amount: 101 }
        : condition === 'policy'
          ? { policyVersion: 2 }
          : condition === 'template'
            ? { template: 'standard' }
            : { amount: 101 },
    );
    await expect(f.reuseNow()).rejects.toThrow('No unchanged');
    expect(
      (await f.view()).tasks.filter((t) => t.answer === 'approve'),
    ).toHaveLength(0);
  });
}

it('an added signer may approve but cannot inject the original legal output', async () => {
  const f = fixture();
  await f.create();
  await f.action('legal1', 'claim');
  await f.addLegalSigner();
  await expect(
    f.action('legalExtra', 'approve', { nonStandard: true }),
  ).rejects.toThrow('original');
  await f.action('legalExtra', 'approve');
  await f.action('legal1', 'approve', { nonStandard: false });
  await f.action('finance1', 'claim');
  await f.action('finance1', 'approve');
  expect(f.record()).toMatchObject({ status: 'done', nonStandard: false });
});

const test = createPlatformAppTest();
test('real SQLite public store adapter joins trusted historical reads and current reuse effects in one transaction', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  await db
    .connection()
    .builder.createCollection('contractProofRequests', (c) => {
      c.string('id', { nullable: false });
      c.primary('id');
      c.string('applicantId', { nullable: false });
      c.text('text', { nullable: false });
      c.integer('amount', { nullable: false });
      c.string('template', { nullable: false });
      c.string('paymentTerms', { nullable: false });
      c.integer('policyVersion', { nullable: false });
      c.boolean('nonStandard', { nullable: true });
      c.string('status', { nullable: false });
      c.integer('lifecycleVersion', { nullable: false });
      c.datetime('statusChangedAt', { nullable: false });
    });
  const store = createRepositoryLifecycleStore(db, {
      collections: {
        transitions: 'oaLifecycleTransitions',
        effectRuns: 'oaLifecycleEffectRuns',
      },
    }),
    f = fixture(false, store);
  await f.create();
  await f.action('legal1', 'claim');
  await f.action('legal1', 'approve', { nonStandard: true });
  await f.action('finance1', 'claim');
  await f.action('finance1', 'return');
  await f.revise({ amount: 101 });
  await f.reuseNow();
  const view = await f.view();
  expect(view.tasks.filter((t) => t.answer === 'approve')).toMatchObject([
    { assigneeId: 'legal1', actorId: 'applicant' },
  ]);
  await f.action('finance1', 'claim');
  await f.action('finance1', 'approve');
  expect(await f.readRecord()).toMatchObject({
    status: 'gm',
    amount: 101,
    nonStandard: true,
  });
  await f.action('gm', 'approve');
  expect(await f.readRecord()).toMatchObject({ status: 'done' });
});

it('the applicant cannot self-certify legal facts through correction input', async () => {
  const f = fixture();
  await f.create();
  await f.action('legal1', 'claim');
  await f.action('legal1', 'approve', { nonStandard: false });
  await f.action('finance1', 'claim');
  await f.action('finance1', 'return');
  await expect(f.revise({ nonStandard: true })).rejects.toThrow();
  expect(f.record()?.status).toBe('revision');
  await f.revise({ amount: 101 });
  await f.reuseNow();
  await f.action('finance1', 'claim');
  await f.action('finance1', 'approve');
  expect(f.record()).toMatchObject({ status: 'done', nonStandard: false });
});

import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization/server';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  BatchApproveInput,
  BatchCandidate,
  BatchOptionsInput,
  BatchResult,
} from './schemas.js';

// Fixed application-owned public endpoints: they retain ordinary record/field policies
// and the actual SDK action checks. Never invoke a private SDK store or weaken an owner policy.
const owners: Partial<Record<z.infer<typeof BatchCandidate>['kind'], string>> =
  {
    'oa.probation': 'probationRequests',
    'oa.contract': 'contractRequests',
    'oa.assetRequest': 'assetRequests',
    'oa.vendorQualification': 'vendorQualifications',
    'oa.leave': 'leaveRequests',
    'oa.overtime': 'overtimeRequests',
    'oa.leaveCancellation': 'leaveCancellations',
    'oa.general': 'generalRequests',
    'oa.attendanceChange': 'attendanceChangeRequests',
    'oa.outing': 'outingRequests',
    'oa.supplies': 'supplyRequests',
    'oa.budgetAdjustment': 'budgetAdjustments',
    'oa.expensePlan': 'expensePlans',
    'oa.training': 'trainingRequests',
    'oa.travel': 'travelRequests',
    'oa.travelCancellation': 'travelCancellations',
    'oa.reimbursement': 'reimbursementRequests',
    'oa.purchase': 'purchaseRequests',
    'oa.loan': 'loanRequests',
    'oa.payment': 'paymentRequests',
  };
const DetailOffers = z.object({
  data: z.object({
    taskActions: z.array(
      z.object({
        task: z.object({
          id: z.string(),
          runId: z.string(),
          stage: z.string(),
          kind: z.string(),
          status: z.string(),
        }),
        actions: z.array(
          z.object({
            name: z.string(),
            batch: z.boolean(),
            options: z
              .object({ reasonRequired: z.boolean().optional() })
              .passthrough()
              .optional(),
          }),
        ),
      }),
    ),
    runs: z.array(
      z.object({
        run: z.object({ id: z.string(), contentHash: z.string() }),
        definitionMissing: z.boolean(),
        stages: z.array(
          z.object({
            key: z.string(),
            outputs: z
              .object({ fields: z.array(z.object({ required: z.boolean() })) })
              .nullable(),
          }),
        ),
      }),
    ),
  }),
});
export function batchRoutes(app: Application) {
  const routes = new Hono<AuthEnv & AuthorizationEnv>();
  async function ownerRequest(
    request: Request,
    owner: string,
    id: string,
    action?: unknown,
  ) {
    const url = new URL(request.url);
    url.pathname = `/api/${owner}/${encodeURIComponent(id)}${action ? '/action' : ''}`;
    url.search = '';
    url.hash = '';
    const headers = new Headers();
    for (const key of ['cookie', 'authorization', 'x-api-key', 'origin']) {
      const value = request.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (action) headers.set('content-type', 'application/json');
    return app.fetch(
      new Request(url, {
        method: action ? 'POST' : 'GET',
        headers,
        ...(action ? { body: JSON.stringify(action) } : {}),
      }),
    );
  }
  async function candidate(
    request: Request,
    item: { kind: z.infer<typeof BatchCandidate>['kind']; id: string },
  ) {
    const owner = owners[item.kind];
    if (!owner) return undefined;
    const response = await ownerRequest(request, owner, item.id);
    if (!response.ok) return undefined;
    const parsed = DetailOffers.safeParse(await response.json());
    if (!parsed.success) return undefined;
    const offers = parsed.data.data;
    const candidates: z.infer<typeof BatchCandidate>[] = [];
    for (const offer of offers.taskActions) {
      if (
        offer.task.kind !== 'decide' ||
        !['pending', 'claimed'].includes(offer.task.status)
      )
        continue;
      const action = offer.actions.find(
        (v) => v.name === 'approve' && v.batch && !v.options?.reasonRequired,
      );
      const run = offers.runs.find((v) => v.run.id === offer.task.runId);
      const stage = run?.stages.find((v) => v.key === offer.task.stage);
      if (
        !action ||
        !run ||
        run.definitionMissing ||
        !stage ||
        stage.outputs?.fields.some((v) => v.required)
      )
        continue;
      candidates.push({
        ...item,
        taskId: offer.task.id,
        contentHash: run.run.contentHash,
      });
    }
    // Ambiguous multiple seats require the ordinary detail UI; never choose a task silently.
    return candidates.length === 1 ? candidates[0] : undefined;
  }
  routes.post(
    '/approvalCenter/batchApproveOptions',
    describeRoute({
      tags: ['ApprovalCenter'],
      operationId: 'approvalCenterBatchApproveOptions',
      summary: 'Get current safe batch approval candidates',
      description:
        'Checks each fixed owner public detail endpoint with the current identity and complete ordinary view policy. Only one actual SDK decide task offering batch approve without required outputs or reason is eligible. Unknown owners fail closed. No source body or SDK snapshot is returned.',
      responses: {
        200: dataResponse(z.array(BatchCandidate)),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', BatchOptionsInput),
    async (c) => {
      const result: z.infer<typeof BatchCandidate>[] = [];
      for (const item of c.req.valid('json').items) {
        const value = await candidate(c.req.raw, item);
        if (value) result.push(value);
      }
      return c.json({ data: result });
    },
  );
  routes.post(
    '/approvalCenter/batchApprove',
    describeRoute({
      tags: ['ApprovalCenter'],
      operationId: 'approvalCenterBatchApprove',
      summary: 'Approve current eligible tasks independently',
      description:
        'At most 20 distinct records and distinct per-task requestIds. Rechecks the current owner policy, SDK offer and required outputs; the taskId and reviewed contentHash must still match. Each item invokes its normal owner public action and commits independently. Never atomic across records; safe per-item statuses expose no private owner errors. No automatic retry or substitution with fresh content.',
      responses: {
        200: dataResponse(z.array(BatchResult)),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', BatchApproveInput),
    async (c) => {
      const result: z.infer<typeof BatchResult>[] = [];
      for (const item of c.req.valid('json').items) {
        let status: z.infer<typeof BatchResult>['status'] = 'failed';
        try {
          const current = await candidate(c.req.raw, item);
          if (
            !current ||
            current.taskId !== item.taskId ||
            current.contentHash !== item.contentHash
          )
            status = 'unavailable';
          else {
            const response = await ownerRequest(
              c.req.raw,
              owners[item.kind]!,
              item.id,
              {
                target: { taskId: item.taskId },
                action: 'approve',
                contentHash: item.contentHash,
                requestId: item.requestId,
              },
            );
            status = response.ok ? 'approved' : 'failed';
          }
        } catch {
          /* The per-item boundary never echoes sensitive owner exceptions. */
        }
        result.push({ kind: item.kind, id: item.id, status });
      }
      return c.json({ data: result });
    },
  );
  return routes;
}

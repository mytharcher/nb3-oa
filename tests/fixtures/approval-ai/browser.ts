// Isolated real-role browser fixture. Uses a local synthetic model, never external credentials.
import { checkApprovalAiControls } from './controls-browser.js';
import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
  ALL,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { approvalAiServiceToken } from '../../../server/providers/approval-ai/service.js';
import { contractPdf } from './pdf.js';
const h = await startIsolatedBrowserApp({
  name: 'approval-ai',
  apiPort: 14178,
  vitePort: 15178,
});
let modelServer: Server | undefined;
try {
  const c = h.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    contracts = c.resolve(contractHttpServiceToken),
    ai = c.resolve(approvalAiServiceToken);
  const people: Record<string, Awaited<ReturnType<typeof createEmployee>>> = {};
  for (const role of ['applicant', 'head', 'legal', 'finance', 'gm'])
    people[role] = await createEmployee(h.testApp, 'Synthetic AI ' + role);
  for (const role of ['legal', 'finance', 'gm'])
    await org.addDutyRoleMember(role, people[role].userId, {
      actorId: people.applicant.userId,
    });
  const department = await org.createDepartment(
    { title: 'Synthetic AI contracts', managerId: people.head.userId },
    { actorId: people.applicant.userId },
  );
  await org.addMember(
    {
      departmentId: department.id,
      userId: people.applicant.userId,
      primary: true,
    },
    { actorId: people.applicant.userId },
  );
  const manager = people.legal;
  await grantToUser(
    h.testApp,
    'native-suggestions-browser',
    [
      composite('oa.contract', {
        view: {
          contractRequests: 'allRecords',
        },
      }),
      {
        resource: { type: 'page', id: 'oa-contract-requests' },
        actions: [{ action: 'access' }],
      },
      {
        resource: { type: 'page', id: 'oa.approvals' },
        actions: [{ action: 'access' }],
      },
    ],
    manager.userId,
  );
  const proposal = {
    contractType: 'purchase',
    counterparty: { kind: 'customer' as const, name: 'Synthetic customer' },
    amountCents: 100000,
    startsOn: '2026-10-01',
    endsOn: '2027-10-01',
    paymentTerms: 'Net 30 after acceptance',
    standardTemplate: false,
    textVersionId: null,
    attachments: [],
    reason: 'Synthetic AI acceptance',
  };
  const created = await contracts.create(
    { operation: 'new', contractId: null, baseVersion: 0, proposal },
    people.applicant.userId,
    randomUUID(),
  );
  if (!created.record) throw new Error('No draft');
  const id = String(created.record.id),
    fileId = randomUUID(),
    key = 'synthetic-ai/' + fileId + '.pdf',
    bytes = contractPdf([
      'Payment is due thirty days after acceptance. Liability is capped at the total contract price.',
    ]);
  await c.resolve(driveManagerToken).use('local').put(key, bytes);
  await db.repository('contractAttachmentFiles').createOne({
    values: {
      id: fileId,
      disk: 'local',
      key,
      filename: 'Synthetic contract.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: bytes.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      requestId: id,
      ownerId: people.applicant.userId,
      uploadVersion: Number(created.record.lifecycleVersion),
      purpose: 'text',
    },
  });
  const text = await contracts.appendText(
    id,
    people.applicant.userId,
    fileId,
    randomUUID(),
    ALL,
  );
  let detail = await contracts.detail(id, people.applicant.userId);
  await contracts.transition(
    id,
    people.applicant.userId,
    'edit',
    { ...proposal, textVersionId: String(text.textVersion.id) },
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  detail = await contracts.detail(id, people.applicant.userId);
  await contracts.transition(
    id,
    people.applicant.userId,
    'submit',
    {},
    randomUUID(),
    detail.record.lifecycleVersion,
  );
  async function act(role: string, action: string) {
    const info = await contracts.detail(id, people[role].userId),
      run = info.runs.find((v) => !v.run.endedAt);
    if (!run) throw new Error('No run');
    const task = run.tasks.find(
      (t) =>
        t.assigneeId === people[role].userId &&
        ['pending', 'candidate', 'claimed'].includes(t.status),
    );
    if (!task) throw new Error('No task');
    return contracts.action(id, people[role].userId, {
      target: { taskId: task.id },
      action,
      input: {},
      requestId: randomUUID(),
      contentHash: run.run.contentHash,
    });
  }
  await act('head', 'approve');
  await act('legal', 'claim');

  const before = await ai.reviews('oa.contract', id, manager.userId, String);
  expect(before[0]?.state).toBe('model_unconfigured');
  let calls = 0;
  modelServer = createServer(async (req, res) => {
    for await (const _chunk of req) {
      /* Drain request without logging private materials. */
    }
    calls++;
    const content = JSON.stringify({
      nextStep: 'Verify the supplied contract terms before approving.',
      findings: [
        {
          checkId: 'review',
          title: 'Contract review',
          verdict: 'needs_verification',
          summary: 'Confirm the relevant policy and payment conditions.',
          evidence: [],
        },
      ],
    });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'synthetic-completion',
        object: 'chat.completion',
        created: 1792972800,
        model: 'chat',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 40, completion_tokens: 40, total_tokens: 80 },
      }),
    );
  });
  await new Promise<void>((resolve) =>
    modelServer!.listen(16278, '127.0.0.1', resolve),
  );
  const models = c.resolve(agentsToken).models.services;
  const model = await models.create({
    title: 'synthetic',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:16278/v1',
    apiKey: 'synthetic-local-only',
    models: [{ value: 'chat', label: 'chat', kind: 'chat' }],
  });
  await models.setDefaultChat(
    { modelService: model.name, model: 'chat' },
    manager.userId,
  );
  const ready = (
    await ai.reviews('oa.contract', id, manager.userId, String)
  )[0];
  expect(ready?.state).toBe('ready');
  expect(calls).toBe(0);
  const page = await h.pageFor(await manager.session());
  page.on('pageerror', (error) =>
    console.error('Synthetic browser page error:', error.message),
  );
  await page.goto(h.origin + h.basePath + '/contractRequests/contract/' + id);
  await expect(
    page.getByRole('region', { name: 'AI approval assistance' }),
  ).toBeVisible({ timeout: 45000 });
  expect(calls).toBe(0);
  await ai.generate(
    { lifecycle: 'oa.contract', recordId: id },
    ready.taskId,
    manager.userId,
    { requestKey: randomUUID(), previousId: null },
    String,
  );
  await expect
    .poll(
      async () =>
        (await ai.reviews('oa.contract', id, manager.userId, String))[0]?.state,
      { timeout: 30000 },
    )
    .toBe('generated');
  expect(calls).toBe(1);
  // A committed native result invalidates the subscribed task without a page reload.
  await expect(
    page.getByText('Verify the supplied contract terms before approving.'),
  ).toBeVisible({ timeout: 15000 });
  await page.reload();
  await checkApprovalAiControls(page, h, id);
  await writeFile(
    path.join(h.screenshotsDir, 'run.json'),
    JSON.stringify(
      {
        checks: [
          'Real role and record/field-authorized status',
          'Model configured after activation does not backfill',
          'Opening status never generates',
          'Native Queue model generation and structured report',
          'Registry controls and responsive rendering',
        ],
        model: 'Local synthetic OpenAI-compatible endpoint; no external model',
        production: false,
      },
      null,
      2,
    ),
  );
} finally {
  await h.close();
  if (modelServer)
    await new Promise<void>((resolve) => modelServer!.close(() => resolve()));
}

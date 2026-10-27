import { createServer, type Server } from 'node:http';
import { actorFor } from '../../../server/providers/approval-ai/service.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
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
import { knowledgeServiceToken } from '../../../server/providers/knowledge/contract.js';
import { contractPdf } from './pdf.js';
const h = await startIsolatedBrowserApp({
  name: 'approval-ai',
  apiPort: 14178,
  vitePort: 15178,
});
const errors: string[] = [],
  checks: string[] = [];
let modelServer: Server | undefined;
let currentRecordId = '';
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
    'ai-browser-config',
    [
      composite('oa.approvalAi', { configure: { settings: 'allRecords' } }),
      {
        resource: { type: 'settings', id: 'agents.services' },
        actions: [{ action: 'read' }, { action: 'manage' }],
      },
      composite('oa.knowledgeDocuments', {
        view: {
          knowledgeDocuments: 'allRecords',
          knowledgeVersions: 'allRecords',
        },
        manage: {
          knowledgeDocuments: 'allRecords',
          knowledgeVersions: 'allRecords',
        },
      }),
      {
        resource: { type: 'page', id: 'oa.approvals' },
        actions: [{ action: 'access' }],
      },
      {
        resource: { type: 'page', id: 'oa-contract-requests' },
        actions: [{ action: 'access' }],
      },
    ],
    manager.userId,
  );
  const policyDoc = await db.transaction((tx) =>
    c.resolve(knowledgeServiceToken).save(
      {
        actorId: manager.userId,
        requestKey: randomUUID(),
        title: 'Synthetic contract review policy',
        folderId: null,
        departmentIds: [],
        dutyRoleCodes: [],
        kind: 'markdown',
        markdown:
          'Parties must match. Payment is due after acceptance. Liability must be capped. Review termination and renewal.',
      },
      tx,
      ALL,
      ALL,
      ALL,
    ),
  );
  let calls = 0;
  modelServer = createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const base = {
        id: 'synthetic-completion',
        created: 1792972800,
        model: 'chat',
      };
      if (body.stream) {
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
        });
        const send = (delta: unknown, finish_reason: string | null = null) =>
          res.write(
            'data: ' +
              JSON.stringify({
                ...base,
                object: 'chat.completion.chunk',
                choices: [{ index: 0, delta, finish_reason }],
              }) +
              '\n\n',
          );
        if (!body.messages.some((m: { role: string }) => m.role === 'tool')) {
          send({
            role: 'assistant',
            tool_calls: [
              {
                index: 0,
                id: 'synthetic-read',
                type: 'function',
                function: {
                  name: 'oa_contract_summary',
                  arguments: JSON.stringify({ recordId: currentRecordId }),
                },
              },
            ],
          });
          send({}, 'tool_calls');
        } else {
          send({
            role: 'assistant',
            content:
              'Synthetic opinion draft: verify liability and payment conditions before making your decision.',
          });
          send({}, 'stop');
        }
        res.end('data: [DONE]\n\n');
      } else {
        calls++;
        const prompt = JSON.parse(body.messages.at(-1).content);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            ...base,
            object: 'chat.completion',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    findings: prompt.checks.map((check: { id: string }) => ({
                      checkId: check.id,
                      verdict: 'needs_verification',
                      summary: 'Synthetic model: verify against the contract.',
                      evidence: [{ kind: 'field', ref: 'amountCents' }],
                    })),
                    basis: 'Synthetic contract review policy',
                  }),
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 50,
              completion_tokens: 100,
              total_tokens: 150,
            },
          }),
        );
      }
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  await new Promise<void>((resolve) =>
    modelServer!.listen(16278, '127.0.0.1', resolve),
  );
  await c.resolve(agentsToken).models.services.create({
    title: 'synthetic',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:16278/v1',
    apiKey: 'synthetic-local-only',
    models: [{ value: 'chat', label: 'chat', kind: 'chat' }],
  });
  const page = await h.pageFor(await manager.session());
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(h.origin + h.basePath + '/models');
  await expect(
    page.getByText('synthetic', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'System administration navigation' })
      .getByRole('link', { name: 'Model services', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'model-services-entry.png'),
    fullPage: true,
    animations: 'disabled',
  });
  checks.push(
    'Authorized model-services page is reachable from system operations',
  );
  await page.goto(h.origin + h.basePath + '/approvalAi');
  await expect(
    page.getByText('Contract legal and finance review', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', {
      name: 'Contract legal and finance review',
      exact: true,
    })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('switch', { name: 'Enabled', exact: true }).click();
  await page.locator('#ai-model').click();
  await page
    .getByRole('option', { name: 'synthetic / chat', exact: true })
    .click();
  await page.locator('#basis-contract-review-points').click();
  await page
    .getByRole('option', {
      name: 'Synthetic contract review policy',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#ai-timeout')).toHaveCount(0);
  checks.push('Real process-manager config persisted through the drawer');
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
  currentRecordId = id;
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
  await expect
    .poll(
      async () => {
        const rows = await ai.reviews(
          'oa.contract',
          id,
          manager.userId,
          (k) => k,
        );
        return rows[0]?.status;
      },
      { timeout: 20_000 },
    )
    .toBe('succeeded');
  expect(calls).toBe(1);
  const tool = c
    .resolve(agentsToken)
    .onlineAgent.configurator.toolDefinition('oa_contract_summary', c)!;
  const actor = await actorFor(c.resolve(authorizationToken), manager.userId);
  const options = {
    context: {
      user: { id: manager.userId },
      authorization: actor.authz,
      credentials: null,
      sessionId: 'synthetic-tool-check',
      signal: new AbortController().signal,
    },
    toolCallId: 'synthetic-read',
    messages: [],
  };
  const pendingTool = c
    .resolve(agentsToken)
    .onlineAgent.configurator.toolDefinition('oa_my_approval_tasks', c)!;
  const personalTasks = (await pendingTool.execute!({ page: 1 }, options)) as {
    total: number;
    tasks: { status: string }[];
  };
  expect(personalTasks.total).toBeGreaterThan(0);
  expect(personalTasks.tasks.every((task) => task.status === 'pending')).toBe(
    true,
  );
  checks.push(
    'Personal-task tool uses the current task-center list API with authenticated owner and pending filter',
  );
  const summary = await tool.execute!({ recordId: id }, options);
  expect(summary).toHaveProperty('id', id);
  expect(summary).not.toHaveProperty('attachments');
  const outsider = await createEmployee(h.testApp, 'Synthetic AI outsider');
  const outside = await actorFor(
    c.resolve(authorizationToken),
    outsider.userId,
  );
  let denied = false;
  try {
    await tool.execute!(
      { recordId: id },
      {
        ...options,
        context: {
          ...options.context,
          user: { id: outsider.userId },
          authorization: outside.authz,
        },
      },
    );
  } catch {
    denied = true;
  }
  expect(denied).toBe(true);
  checks.push(
    'Actual SDK tool allows the handler and denies an unrelated employee with current authorization',
  );
  const result = await ai.reviews('oa.contract', id, manager.userId, (k) => k);
  expect(
    result[0].coverage.some((m) => m.kind === 'text' && m.status === 'read'),
  ).toBe(true);
  expect(
    result[0].coverage.some(
      (m) => m.kind === 'knowledge' && m.status === 'read',
    ),
  ).toBe(true);
  checks.push(
    'Task claim triggered PDF + authorized Markdown review through real jobs',
  );
  await page.goto(h.origin + h.basePath + '/contractRequests/contract/' + id);
  await expect(
    page.getByRole('region', { name: 'AI approval assistance' }),
  ).toBeVisible();
  await expect(
    page
      .getByText('Synthetic model: verify against the contract.', {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Feedback', exact: true }).click();
  await page
    .getByLabel('Notes (optional, up to 1,000 characters)')
    .pressSequentially('Useful evidence');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Feedback · Useful', exact: true }),
  ).toBeVisible();
  checks.push('Handler viewed evidence and saved independent feedback');
  async function settle() {
    await page.evaluate(async () => {
      await Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => {})),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
  }
  async function setTheme(mode: string) {
    await page.evaluate(
      ({ mode, base }) => {
        const scope = base.replace(/^\/+|\/+$/g, '');
        const key = `nocobase:${scope ? encodeURIComponent(scope) : '%2F'}:theme:color-scheme`;
        localStorage.setItem(key, mode);
        window.dispatchEvent(
          new StorageEvent('storage', { key, newValue: mode }),
        );
      },
      { mode, base: h.basePath },
    );
    await expect(page.locator('html')).toHaveClass(new RegExp(mode));
    await settle();
  }
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'contract-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'AI approval assistance' }),
  ).toBeVisible();
  await page
    .getByRole('region', { name: 'AI approval assistance' })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'contract-375.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await setTheme('dark');
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'contract-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await setTheme('light');
  await page
    .getByRole('button', { name: 'Approval assistant', exact: true })
    .last()
    .click();
  await expect(
    page.getByRole('dialog').filter({
      has: page.getByRole('heading', {
        name: 'Approval assistant',
        exact: true,
      }),
    }),
  ).toBeVisible();
  await settle();
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'assistant-375.png'),
    fullPage: true,
    animations: 'disabled',
  });
  checks.push(
    '375px suggestion and read-only assistant entry render without horizontal overflow',
  );
  await expect(
    page.getByText('Contract: Contract draft', { exact: true }),
  ).toBeVisible();
  await page.locator('#assistant-model').click();
  await page
    .getByRole('option', { name: 'synthetic / chat', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Start conversation', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill('Read this contract and draft an opinion.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(
    page.getByText(
      'Synthetic opinion draft: verify liability and payment conditions before making your decision.',
      { exact: true },
    ),
  ).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'assistant-draft-375.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page
    .getByRole('button', { name: 'Save as opinion draft', exact: true })
    .click();
  await expect(
    page.getByText(
      'Draft kept in this browser session. Use “Insert AI draft” in the approval form, then review and submit.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();
  checks.push(
    'Native SDK called authorized read-only contract tool through a local provider and retained a browser-only opinion draft',
  );
  await page
    .locator('[href$="/action/approve/' + result[0].taskId + '"]')
    .click();
  await page
    .getByRole('button', { name: 'Insert AI draft', exact: true })
    .click();
  await expect(page.locator('#contract-action-comment')).toHaveValue(
    'Synthetic opinion draft: verify liability and payment conditions before making your decision.',
  );
  expect((await contracts.detail(id, manager.userId)).record.status).toBe(
    'legalFinance',
  );
  checks.push(
    'Draft inserted into ordinary approval form without submitting or deciding',
  );

  await setTheme('dark');
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'draft-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await ai.saveSettings(
    'contracts.legal-review',
    {
      enabled: false,
      modelService: 'synthetic',
      model: 'chat',
      basis: { 'contract-review-points': policyDoc.id },
      timeoutSeconds: 120,
      expectedVersion: 1,
    },
    manager.userId,
  );
  expect(
    (await ai.reviews('oa.contract', id, manager.userId, (k) => k))[0],
  ).toMatchObject({ status: 'succeeded', canGenerate: false });
  checks.push('Disabling preserves existing suggestions');
  await page.evaluate(
    (basePath) =>
      localStorage.setItem(
        'nocobase.locale:' + basePath.replace(/\/$/, '') + '/',
        'zh-CN',
      ),
    h.basePath,
  );
  await page.goto(h.origin + h.basePath + '/approvalAi');
  await page
    .getByRole('link', { name: '合同法务财务审查', exact: true })
    .click();
  const search = page.getByRole('textbox', { name: '搜索知识库文档' });
  await search.focus();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', {
    text: 'hetong',
    selectionStart: 6,
    selectionEnd: 6,
  });
  await cdp.send('Input.insertText', { text: '合同' });
  await expect(search).toHaveValue('合同');
  await search.press('Control+A');
  await search.pressSequentially('Synthetic');
  await expect(search).toBeFocused();
  await page.locator('#ai-timeout').fill('130');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '取消', exact: true })
    .click();
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('#ai-timeout')).toHaveCount(0);
  await page
    .getByRole('link', { name: '合同法务财务审查', exact: true })
    .click();
  await expect(page.locator('#ai-timeout')).toBeVisible();
  await settle();
  await page.screenshot({
    path: path.join(h.screenshotsDir, 'configuration-375-zh.png'),
    fullPage: true,
    animations: 'disabled',
  });
  checks.push(
    'Chinese locale, real IME composition, typed search and unsaved-change confirmation work at 375px',
  );
  await page.goto(
    h.origin + h.basePath + '/approvalAi/unknown-definition/edit',
  );
  await expect(
    page.getByText('配置不存在或不可访问。', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '保存', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/approvalAi$'));
  checks.push(
    'Unknown configuration URL shows a missing state and closes safely',
  );
  await writeFile(
    path.join(h.screenshotsDir, 'run.json'),
    JSON.stringify(
      {
        checks,
        errors,
        model: 'Synthetic gateway; no external model called',
        realRole: 'Synthetic legal handler and process manager',
      },
      null,
      2,
    ),
  );
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ checks, screenshots: h.screenshotsDir }));
} finally {
  await h.close();
  if (modelServer)
    await new Promise<void>((resolve) => modelServer!.close(() => resolve()));
}

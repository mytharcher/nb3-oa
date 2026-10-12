import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { DetailSchema } from '../../../server/routes/template-print/schemas.js';
// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import type { TestApp } from '@nocobase/app-testing/server';
import { strToU8, zipSync, unzipSync, strFromU8 } from 'fflate';
import { printApp } from './app-helpers.js';
import {
  createEmployee,
  createPerson,
  grantToUser,
  composite,
} from '../employees/helpers.js';
import { json } from '../org/helpers.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';
import { DOCX_MIME } from '../../../server/providers/template-print/renderer.js';
import { templatePrintServiceToken } from '../../../server/providers/template-print/contract.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { installTemplatePrintPermissions } from '../../../database/main/seeds/202610103811_template_print_permissions.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
let app: TestApp,
  admin: TestSession,
  owner: TestSession,
  stranger: TestSession,
  templateId: string,
  recordId: string,
  revisionId: string;
const templates = new Map<string, Uint8Array>();
function fixture(name = '打印 &amp; 特殊', field = 'reason') {
  const cacheKey = `${name}:${field}`;
  let bytes = templates.get(cacheKey);
  if (!bytes) {
    bytes = zipSync({
      '[Content_Types].xml': strToU8(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      ),
      '_rels/.rels': strToU8(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      ),
      'word/document.xml': strToU8(
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${name} {d.${field}} {d.applicant.name}</w:t></w:r></w:p></w:body></w:document>`,
      ),
    });
    templates.set(cacheKey, bytes);
  }
  return new File([new Uint8Array(bytes)], '中文模板.docx', {
    type: DOCX_MIME,
  });
}

async function upload(
  session: TestSession,
  version: number,
  key: string,
  file = fixture(),
) {
  const form = new FormData();
  form.set('file', file);
  form.set('version', String(version));
  form.set('requestKey', key);
  return session.fetch(`/printTemplates/${templateId}/revisions`, {
    method: 'POST',
    headers: { origin: OA_TEST_ORIGIN },
    body: form,
  });
}
beforeAll(async () => {
  app = await printApp();
  admin = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
  const employee = await createEmployee(app, 'Print Owner');
  owner = await employee.session();
  const other = await createPerson(app, 'Print Stranger');
  stranger = await other.session();
  const created = await owner.fetch(
    '/leaveRequests',
    json({
      leaveType: 'personal',
      startDate: '2026-10-12',
      endDate: '2026-10-12',
      startHalf: 'am',
      endHalf: 'pm',
      reason: '机密中文 & <正文>',
      attachments: [],
      handoverUserId: null,
      enableDelegation: false,
    }),
  );
  if (created.status !== 200) throw new Error(await created.text());
  recordId = (await created.json()).data.record.id;
  const response = await admin.fetch(
    '/printTemplates',
    json({
      name: '请假审批单',
      source: 'leave',
      requestKey: 'create-template',
    }),
  );
  if (response.status !== 201) throw new Error(await response.text());
  templateId = (await response.json()).data.record.id;
}, 60000);
afterAll(async () => {
  await app?.close();
});

it('uses seeded authenticated print and admin duty-role manage grants and preserves administrator customization on seed replay', async () => {
  const user = await createEmployee(app, 'Default Print Administrator');
  const organization = app.application.container.resolve(
    organizationServiceToken,
  );
  await organization.addDutyRoleMember('admin', user.userId, {
    actorId: admin.user.id,
    connection: app.database.connection(),
  });
  const session = await user.session();
  const response = await session.fetch(
    '/printTemplates',
    json({
      name: '默认行政模板',
      source: 'leave',
      requestKey: 'default-admin-template',
    }),
  );
  expect(response.status).toBe(201);
  expect((await owner.fetch('/printTemplates?mode=use')).status).toBe(200);
  expect((await owner.fetch('/printTemplates?mode=manage')).status).toBe(403);
  const permissionSets =
    app.application.container.resolve(authorizationToken).permissionSets;
  const original = (await permissionSets.get('oa-document-print'))!;
  await permissionSets.update(original.key, {
    ...original,
    grants: original.grants.map((grant) => ({
      ...grant,
      actions: grant.actions.filter((action) => action.action !== 'use'),
    })),
  });
  const before = await app.database
    .repository('authorizationPermissionSetAssignments')
    .findMany({ filter: { permissionSetKey: original.key } });
  try {
    await installTemplatePrintPermissions(app.database.connection().query);
    await installTemplatePrintPermissions(app.database.connection().query);
    const modified = (await permissionSets.get(original.key))!;
    expect(
      modified.grants
        .flatMap((grant) => grant.actions)
        .some((action) => action.action === 'use'),
    ).toBe(false);
    expect(
      await app.database
        .repository('authorizationPermissionSetAssignments')
        .findMany({ filter: { permissionSetKey: original.key } }),
    ).toEqual(before);
  } finally {
    await permissionSets.update(original.key, original);
  }
});

it('rolls back private upload metadata when its transactional audit fails', async () => {
  const files = await app.database.repository('printTemplateFiles').count();
  const revisions = await app.database
    .repository('printTemplateRevisions')
    .count();
  const audit = app.application.container.resolve(auditServiceToken);
  const original = audit.record;
  audit.record = async (entry, tx) => {
    if (entry.action === 'printTemplate.upload')
      throw new Error('upload audit failure');
    await original(entry, tx);
  };
  try {
    const detail = await admin.fetch(
      `/printTemplates/${templateId}?mode=manage`,
    );
    const row = (await detail.json()).data.record;
    expect(
      (
        await upload(
          admin,
          row.version,
          'upload-audit-rollback',
          fixture('UPLOAD-FAULT'),
        )
      ).status,
    ).toBe(500);
    expect(await app.database.repository('printTemplateFiles').count()).toBe(
      files,
    );
    expect(
      await app.database.repository('printTemplateRevisions').count(),
    ).toBe(revisions);
    const after = await admin.fetch(
      `/printTemplates/${templateId}?mode=manage`,
    );
    expect((await after.json()).data.record.currentRevisionId).toBe(
      row.currentRevisionId,
    );
  } finally {
    audit.record = original;
  }
});
it('rejects anonymous, ordinary upload, unsafe markers; stores and replays one immutable revision', async () => {
  expect((await app.request('/printTemplates')).status).toBe(401);
  expect((await upload(owner, 1, 'not-admin')).status).toBe(403);
  expect(
    (await upload(admin, 1, 'bad-template', fixture('bad', 'bankAccount')))
      .status,
  ).toBe(400);
  expect(await app.database.repository('printTemplateFiles').count()).toBe(0);
  const response = await upload(admin, 1, 'upload-one');
  expect(response.status).toBe(200);
  const result = (await response.json()).data;
  revisionId = result.revision.id;
  expect(result.record.version).toBe(2);
  expect(result.revision).not.toHaveProperty('fileId');
  const detailResponse = await admin.fetch(
    `/printTemplates/${templateId}?mode=manage`,
  );
  expect(detailResponse.status).toBe(200);
  const detail = DetailSchema.parse((await detailResponse.json()).data);
  expect(detail.revisions[0].createdBy).toEqual(result.revision.createdBy);
  expect(detail.revisions[0]).not.toHaveProperty('fileId');

  const replay = await upload(admin, 1, 'upload-one');
  expect(replay.status).toBe(200);
  expect((await replay.json()).data.revision.id).toBe(revisionId);
  expect(await app.database.repository('printTemplateFiles').count()).toBe(1);
  expect(
    (await upload(admin, 1, 'upload-one', fixture('different'))).status,
  ).toBe(409);
  expect((await upload(admin, 1, 'stale-new-command')).status).toBe(409);
  const download = await admin.fetch(
    `/printTemplates/${templateId}/revisions/${revisionId}/content`,
  );
  expect(download.status).toBe(200);
  expect(download.headers.get('cache-control')).toBe('private, no-store');
  expect(new Uint8Array(await download.arrayBuffer())).toEqual(
    new Uint8Array(await fixture().arrayBuffer()),
  );
  expect(
    (
      await owner.fetch(
        `/printTemplates/${templateId}/revisions/${revisionId}/content`,
      )
    ).status,
  ).toBe(403);
});
it('renders actual authorized DOCX and denies other records and missing independent grants', async () => {
  const response = await owner.fetch(
    `/printTemplates/${templateId}/render`,
    json({ recordId, locale: 'zh-CN' }),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe(DOCX_MIME);
  expect(response.headers.get('content-disposition')).toContain(
    "filename*=UTF-8''",
  );
  const xml = strFromU8(
    unzipSync(new Uint8Array(await response.arrayBuffer()))[
      'word/document.xml'
    ]!,
  );
  expect(xml).toContain('机密中文 &amp; &lt;正文&gt;');
  expect(xml).toContain('Print Owner');
  expect(xml).not.toContain('{d.');
  expect(xml).not.toContain('ruleSnapshot');
  expect(
    (
      await stranger.fetch(
        `/printTemplates/${templateId}/render`,
        json({ recordId, locale: 'zh-CN' }),
      )
    ).status,
  ).toBe(403);
  const noGrant = await createPerson(app, 'No Print Grant');
  const session = await noGrant.session();
  expect(
    (
      await session.fetch(
        `/printTemplates/${templateId}/render`,
        json({ recordId, locale: 'en-US' }),
      )
    ).status,
  ).toBe(403);
  const audit = await app.database
    .repository('auditLogs')
    .findMany({ filter: { action: 'printTemplate.render' } });
  expect(JSON.stringify(audit)).not.toContain('机密中文');
});
it('rolls back a replacement when audit fails and preserves the previous bytes', async () => {
  const audit = app.application.container.resolve(auditServiceToken),
    original = audit.record;
  audit.record = async (entry, tx) => {
    if (entry.action === 'printTemplate.revise')
      throw new Error('audit failure');
    await original(entry, tx);
  };
  try {
    expect(
      (
        await upload(
          admin,
          2,
          'replacement-audit-failure',
          fixture('new version'),
        )
      ).status,
    ).toBe(500);
  } finally {
    audit.record = original;
  }
  const detail = await admin.fetch(`/printTemplates/${templateId}?mode=manage`);
  const row = (await detail.json()).data.record;
  expect(row.currentRevisionId).toBe(revisionId);
  expect(row.version).toBe(2);
  expect(await app.database.repository('printTemplateFiles').count()).toBe(1);
  expect(await app.database.repository('printTemplateRevisions').count()).toBe(
    1,
  );
  const response = await upload(
    admin,
    2,
    'replacement-audit-failure',
    fixture('new version'),
  );
  expect(response.status).toBe(200);
  const next = (await response.json()).data;
  expect(next.revision.id).not.toBe(revisionId);
  const old = await admin.fetch(
    `/printTemplates/${templateId}/revisions/${revisionId}/content`,
  );
  expect(new Uint8Array(await old.arrayBuffer())).toEqual(
    new Uint8Array(await fixture().arrayBuffer()),
  );
  const current = await owner.fetch(
    `/printTemplates/${templateId}/render`,
    json({ recordId, locale: 'en-US' }),
  );
  expect(current.status).toBe(200);
  expect(
    strFromU8(
      unzipSync(new Uint8Array(await current.arrayBuffer()))[
        'word/document.xml'
      ]!,
    ),
  ).toContain('new version');
});
it('fails closed for a narrow business field grant and rejects unrelated seal source records', async () => {
  const service = app.application.container.resolve(templatePrintServiceToken);
  await expect(
    service.render(
      templateId,
      owner.user.id,
      { recordId, locale: 'en-US' },
      { read: true, create: false, update: false, delete: false },
      {
        read: { scope: true, fields: ['id', 'reason'] },
        create: false,
        update: false,
        delete: false,
      },
    ),
  ).rejects.toMatchObject({ code: 'PRINT_FIELDS_DENIED' });
  const response = await admin.fetch(
    '/printTemplates',
    json({
      name: '未就绪用印',
      source: 'sealRegistration',
      requestKey: 'seal-registration-unavailable',
    }),
  );
  expect(response.status).toBe(201);
  const id = (await response.json()).data.record.id;
  const deniedSeal = await admin.fetch(
    `/printTemplates/${id}/render`,
    json({ recordId, locale: 'zh-CN' }),
  );
  expect(deniedSeal.status).toBe(403);
  expect(await deniedSeal.text()).toContain('PRINT_RECORD_DENIED');
});
it('prints actual approval opinions and company-local times from a completed public leave run', async () => {
  const { leaveServiceToken } =
    await import('../../../server/providers/leave/index.js');
  const manager = await createEmployee(app, 'Print Manager');
  const ownerEmployee = await app.database
    .repository('employees')
    .findOne({ filter: { userId: owner.user.id } });
  await app.database.repository('employees').updateOne({
    filter: { id: ownerEmployee!.id },
    values: { managerId: manager.employeeId },
  });
  const leave = app.application.container.resolve(leaveServiceToken);
  const draft = await leave.detail(recordId, owner.user.id);
  await leave.transition(
    recordId,
    'submit',
    owner.user.id,
    Number(draft.record.lifecycleVersion),
    'print-actual-submit',
  );
  const detail = await leave.detail(recordId, manager.userId);
  const task = detail.runs
    .at(-1)!
    .tasks.find(
      (task) => task.assigneeId === manager.userId && task.status === 'pending',
    );
  expect(task).toBeDefined();
  await leave.action(
    recordId,
    {
      target: { taskId: task!.id },
      action: 'approve',
      comment: '真实同意 & 审批意见',
      contentHash: detail.runs.at(-1)!.run.contentHash,
      requestId: 'print-actual-review',
    },
    manager.userId,
  );
  const archive = unzipSync(new Uint8Array(await fixture().arrayBuffer()));
  archive['word/document.xml'] = strToU8(
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i].actor} {d.timeline[i].opinion} {d.timeline[i].at}</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>{d.timeline[i+1].actor} {d.timeline[i+1].opinion} {d.timeline[i+1].at}</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
  );
  const uploadResponse = await upload(
    admin,
    3,
    'actual-timeline',
    new File([zipSync(archive)], 'timeline.docx', { type: DOCX_MIME }),
  );
  expect(uploadResponse.status).toBe(200);
  const response = await owner.fetch(
    `/printTemplates/${templateId}/render`,
    json({ recordId, locale: 'zh-CN' }),
  );
  expect(response.status).toBe(200);
  const xml = strFromU8(
    unzipSync(new Uint8Array(await response.arrayBuffer()))[
      'word/document.xml'
    ]!,
  );
  expect(xml).toContain('Print Manager');
  expect(xml).toContain('真实同意 &amp; 审批意见');
  expect(xml).not.toContain('{d.');
  expect(xml).not.toContain('ruleSnapshot');
});
it('enforces template use and independent source print row scopes even when business view allows the record', async () => {
  // Isolate the explicit grant negative cases from the seeded authenticated print grant.
  const permissionSets =
    app.application.container.resolve(authorizationToken).permissionSets;
  const defaults = (await permissionSets.get('oa-document-print'))!;
  await permissionSets.update(defaults.key, { ...defaults, grants: [] });
  try {
    await grantToUser(
      app,
      'print-owner-explicit',
      [
        composite('oa.templatePrint', {
          use: { printTemplates: 'allRecords' },
          printLeave: {
            printTemplates: 'allRecords',
            leaveRequests: 'allRecords',
          },
        }),
      ],
      owner.user.id,
    );

    const sourceRestricted = await createPerson(app, 'Scoped Printer');
    await grantToUser(
      app,
      'print-source-restricted',
      [
        composite('oa.templatePrint', {
          use: { printTemplates: 'allRecords' },
          printLeave: {
            printTemplates: 'allRecords',
            leaveRequests: 'oa.leaveReadable',
          },
        }),
        composite('oa.leave', { view: { leaveRequests: 'allRecords' } }),
      ],
      sourceRestricted.userId,
    );
    const response = await (
      await sourceRestricted.session()
    ).fetch(
      `/printTemplates/${templateId}/render`,
      json({ recordId, locale: 'en-US' }),
    );
    expect(response.status).toBe(403);
    expect(await response.text()).toContain('PRINT_RECORD_DENIED');
    const onlyUse = await createPerson(app, 'Only Template Use');
    await grantToUser(
      app,
      'print-only-use',
      [
        composite('oa.templatePrint', {
          use: { printTemplates: 'allRecords' },
        }),
        composite('oa.leave', { view: { leaveRequests: 'allRecords' } }),
      ],
      onlyUse.userId,
    );
    expect(
      (
        await (
          await onlyUse.session()
        ).fetch(
          `/printTemplates/${templateId}/render`,
          json({ recordId, locale: 'en-US' }),
        )
      ).status,
    ).toBe(403);
    const onlyPrint = await createPerson(app, 'Only Source Print');
    await grantToUser(
      app,
      'print-only-source',
      [
        composite('oa.templatePrint', {
          printLeave: {
            printTemplates: 'allRecords',
            leaveRequests: 'allRecords',
          },
        }),
        composite('oa.leave', { view: { leaveRequests: 'allRecords' } }),
      ],
      onlyPrint.userId,
    );
    expect(
      (
        await (
          await onlyPrint.session()
        ).fetch(
          `/printTemplates/${templateId}/render`,
          json({ recordId, locale: 'en-US' }),
        )
      ).status,
    ).toBe(403);
  } finally {
    await permissionSets.update(defaults.key, defaults);
  }
});
it('keeps the chosen immutable revision during an actual concurrent replacement', async () => {
  const { leaveServiceToken } =
    await import('../../../server/providers/leave/index.js');
  const leave = app.application.container.resolve(leaveServiceToken),
    original = leave.detail;
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve)),
    started = new Promise<void>((resolve) => (entered = resolve));
  leave.detail = async (...args) => {
    if (args[0] === recordId) {
      entered();
      await gate;
    }
    return original(...args);
  };
  let pending: Promise<Response> | undefined;
  try {
    pending = owner.fetch(
      `/printTemplates/${templateId}/render`,
      json({ recordId, locale: 'en-US' }),
    );
    await started;
    const response = await upload(
      admin,
      4,
      'race-replacement',
      fixture('RACE-NEW'),
    );
    expect(response.status).toBe(200);
    release();
    const old = await pending;
    expect(old.status).toBe(200);
    const xml = strFromU8(
      unzipSync(new Uint8Array(await old.arrayBuffer()))['word/document.xml']!,
    );
    expect(xml).toContain('真实同意');
    expect(xml).not.toContain('RACE-NEW');
  } finally {
    release();
    leave.detail = original;
    if (pending) await pending;
  }
  const next = await owner.fetch(
    `/printTemplates/${templateId}/render`,
    json({ recordId, locale: 'en-US' }),
  );
  expect(next.status).toBe(200);
  expect(
    strFromU8(
      unzipSync(new Uint8Array(await next.arrayBuffer()))['word/document.xml']!,
    ),
  ).toContain('RACE-NEW');
});

it('renders real reimbursement and payment drafts through their public guarded detail services', async () => {
  for (const source of ['reimbursement', 'payment'] as const) {
    const reason = `真实${source} & <正文>`;
    const input =
      source === 'reimbursement'
        ? {
            reason,
            authorizationId: null,
            loanId: null,
            offsetCents: 0,
            overrunReason: '',
            lines: [],
          }
        : {
            reason,
            sourceMode: 'none',
            purchaseOrderId: null,
            contractId: null,
            noPriorApprovalReason: '无前置审批',
            vendorId: null,
            amountCents: 123,
            invoiceNumber: 'PRINT-REAL-INVOICE',
            attachments: [],
            paymentMethod: 'cash',
          };
    const created = await admin.fetch(
      `/${source === 'payment' ? 'payment' : 'reimbursement'}Requests`,
      json(input),
    );
    expect(created.status).toBe(201);
    const sourceId = (await created.json()).data.record.id;
    const template = await admin.fetch(
      '/printTemplates',
      json({
        name: `真实${source}模板`,
        source,
        requestKey: `create-${source}-real`,
      }),
    );
    expect(template.status).toBe(201);
    const id = (await template.json()).data.record.id;
    const form = new FormData();
    form.set('file', fixture(`实际${source}`));
    form.set('version', '1');
    form.set('requestKey', `upload-${source}-real`);
    const uploaded = await admin.fetch(`/printTemplates/${id}/revisions`, {
      method: 'POST',
      headers: { origin: OA_TEST_ORIGIN },
      body: form,
    });
    expect(uploaded.status).toBe(200);
    const output = await admin.fetch(
      `/printTemplates/${id}/render`,
      json({ recordId: sourceId, locale: 'zh-CN' }),
    );
    expect(output.status).toBe(200);
    const xml = strFromU8(
      unzipSync(new Uint8Array(await output.arrayBuffer()))[
        'word/document.xml'
      ]!,
    );
    expect(xml).toContain(`真实${source} &amp; &lt;正文&gt;`);
    expect(xml).not.toContain('{d.');
    expect(xml).not.toContain('bankAccount');
  }
});

it('returns the same durable metadata receipt for concurrent identical request keys', async () => {
  const input = {
    name: '并发请求模板',
    source: 'leave',
    requestKey: 'concurrent-metadata',
  };
  const responses = await Promise.all([
    admin.fetch('/printTemplates', json(input)),
    admin.fetch('/printTemplates', json(input)),
  ]);
  for (const response of responses) expect(response.status).toBe(201);
  const results = await Promise.all(
    responses.map((response) => response.json()),
  );
  expect(results[0].data.record.id).toBe(results[1].data.record.id);
  expect(
    await app.database
      .repository('printTemplates')
      .count({ filter: { name: input.name } }),
  ).toBe(1);
});

it('prints a real contract approval over HTTP only with independent template, source and business view grants', async () => {
  const organization = app.application.container.resolve(
    organizationServiceToken,
  );
  const department = await organization.createDepartment(
    { title: 'Print contracts', managerId: owner.user.id },
    { actorId: admin.user.id },
  );
  await organization.addMember(
    { departmentId: department.id, userId: owner.user.id, primary: true },
    { actorId: admin.user.id },
  );
  const draft = await app.application.container
    .resolve(contractHttpServiceToken)
    .create(
      {
        operation: 'new',
        contractId: null,
        baseVersion: 0,
        proposal: {
          contractType: 'purchase',
          counterparty: { kind: 'customer', name: 'HTTP Contract Customer' },
          amountCents: 12300,
          startsOn: '2026-10-01',
          endsOn: '2027-10-01',
          paymentTerms: 'Net 30',
          standardTemplate: true,
          textVersionId: null,
          attachments: [],
          reason: 'HTTP Contract Approval',
        },
      },
      owner.user.id,
      'contract-print-source',
    );
  const created = await admin.fetch(
    '/printTemplates',
    json({
      name: 'Contract approval form',
      source: 'contracts',
      requestKey: 'create-contract-print',
    }),
  );
  expect(created.status).toBe(201);
  const id = (await created.json()).data.record.id;
  const form = new FormData();
  form.set('file', fixture('Contract approval', 'counterparty.name'));
  form.set('version', '1');
  form.set('requestKey', 'upload-contract-print');
  expect(
    (
      await admin.fetch(`/printTemplates/${id}/revisions`, {
        method: 'POST',
        headers: { origin: OA_TEST_ORIGIN },
        body: form,
      })
    ).status,
  ).toBe(200);
  const input = { recordId: String(draft.record.id), locale: 'en-US' };
  const response = await owner.fetch(
    `/printTemplates/${id}/render`,
    json(input),
  );
  if (response.status !== 200) throw new Error(await response.text());
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe(DOCX_MIME);
  const xml = strFromU8(
    unzipSync(new Uint8Array(await response.arrayBuffer()))[
      'word/document.xml'
    ]!,
  );
  expect(xml).toContain('HTTP Contract Customer');
  expect(xml).toContain('Print Owner');
  expect(xml).not.toContain('{d.');
  expect(
    (await stranger.fetch(`/printTemplates/${id}/render`, json(input))).status,
  ).toBe(403);
  const sets =
    app.application.container.resolve(authorizationToken).permissionSets;
  const original = (await sets.get('oa-document-print'))!;
  await sets.update(original.key, {
    ...original,
    grants: original.grants.map((grant) => ({
      ...grant,
      actions: grant.actions.filter(
        (action) => action.action !== 'printContracts',
      ),
    })),
  });
  try {
    expect(
      (await owner.fetch(`/printTemplates/${id}/render`, json(input))).status,
    ).toBe(403);
  } finally {
    await sets.update(original.key, original);
  }
});

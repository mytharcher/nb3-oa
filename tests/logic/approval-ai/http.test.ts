// @vitest-environment node
import { expect } from 'vitest';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import {
  generateApiDocument,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import approvalAiRoutes from '../../../server/routes/approval-ai/index.js';
import {
  createPlatformAppTest,
  createUser,
  write,
} from '../platform/helpers.js';
const test = createPlatformAppTest();
test('registered routes authenticate independently and restrict configuration to process managers', async ({
  app,
  testApp,
  request,
}) => {
  expect((await request('/approvalAi/definitions')).status).toBe(401);
  const user = await createUser(testApp, 'AI outsider');
  expect((await user.fetch('/approvalAi/definitions')).status).toBe(403);
  expect((await user.fetch('/approvalAi/models')).status).toBe(403);
  expect(
    (
      await user.fetch(
        '/approvalAi/reviews?lifecycle=oa.contract&recordId=missing',
      )
    ).status,
  ).toBe(200);
  const missing = await user.fetch(
    '/approvalAi/reviews/missing/generate',
    write('POST', { requestKey: 'missing' }),
  );
  expect(missing.status).toBe(404);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const response = await admin.fetch('/approvalAi/definitions');
  expect(response.status).toBe(200);
  const data = (await response.json()).data;
  expect(data).toHaveLength(1);
  expect(data[0].settings.enabled).toBe(false);
  const chinese = await admin.fetch('/approvalAi/definitions?locale=zh-CN');
  expect((await chinese.json()).data[0].title).toBe('合同法务财务审查');
  const router = await approvalAiRoutes[0].createRouter(app);
  const document = await generateApiDocument(router, {
    info: { title: 'Approval AI', version: '1' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    document.paths?.['/api/approvalAi/reviews/{taskId}/generate']?.post
      ?.operationId,
  ).toBe('generateApprovalAiReview');
});

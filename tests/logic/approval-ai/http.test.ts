// @vitest-environment node
import { expect } from 'vitest';
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
test('native suggestion endpoints authenticate, reject forged identity and declare their transport', async ({
  app,
  testApp,
  request,
}) => {
  expect(
    (await request('/approvalAi/reviews?lifecycle=oa.leave&recordId=missing'))
      .status,
  ).toBe(401);
  for (const operation of ['generate', 'cancel']) {
    expect(
      (
        await request(
          '/approvalAi/reviews/missing/' + operation,
          write('POST', {}),
        )
      ).status,
    ).toBe(401);
  }
  const user = await createUser(testApp, 'Synthetic suggestion outsider');
  expect(
    (
      await user.fetch(
        '/approvalAi/reviews?lifecycle=oa.leave&recordId=missing',
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await user.fetch(
        '/approvalAi/reviews/missing/generate',
        write('POST', {
          lifecycle: 'oa.leave',
          recordId: 'missing',
          requestKey: 'operation',
        }),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await user.fetch(
        '/approvalAi/reviews/missing/cancel',
        write('POST', {
          lifecycle: 'oa.leave',
          recordId: 'missing',
          generationId: 'generation',
        }),
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await user.fetch(
        '/approvalAi/reviews/missing/generate',
        write('POST', {
          lifecycle: 'oa.leave',
          recordId: 'missing',
          requestKey: 'operation',
          userId: 'administrator',
        }),
      )
    ).status,
  ).toBe(400);
  // Retired OA worker/settings/conversation routes cannot mutate legacy state.
  for (const path of ['definitions', 'models', 'reviewConversations'])
    expect((await user.fetch('/approvalAi/' + path)).status).toBe(404);
  const router = await approvalAiRoutes[0].createRouter(app);
  const document = await generateApiDocument(router, {
    info: { title: 'Approval AI', version: '2' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    document.paths?.['/api/approvalAi/reviews/{taskId}/generate']?.post
      ?.operationId,
  ).toBe('generateApprovalAiReview');
});

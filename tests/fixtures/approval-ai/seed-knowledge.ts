/** Inspect: pnpm exec tsx tests/fixtures/approval-ai/seed-knowledge.ts
 * Import: pnpm exec tsx tests/fixtures/approval-ai/seed-knowledge.ts <datasetId>
 * Uses an existing ready Chinese demo dataset and its administrator's authenticated API.
 */
import { databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  demoDataServiceToken,
  type DemoDataSet,
} from '../../../server/providers/demo-data/contract.js';
import { demoContext } from '../../../server/providers/demo-data/context.js';
import {
  trialSession,
  dataOf,
} from '../../../cli/commands/lib/trial-data/http.js';
import { approvalKnowledge, knowledgeMarkdown } from './knowledge-data.js';

const expectedId = process.argv[2];
const server = await createStandaloneServer();
try {
  const app = server.application;
  await app.start();
  const service = app.container.resolve(demoDataServiceToken);
  await service.idle();
  const status = await service.status();
  if (!expectedId) {
    process.stdout.write(
      JSON.stringify({
        datasetId: status.datasetId,
        state: status.state,
        locale: status.locale,
      }) + '\n',
    );
  } else {
    if (status.datasetId !== expectedId || status.state !== 'ready')
      throw new Error('Expected managed dataset must be ready.');
    const db = app.container.resolve(databaseManagerToken);
    const dataset = await db
      .repository<DemoDataSet>('demoDataSets')
      .findOne({ filter: { id: expectedId } });
    if (!dataset || dataset.locale !== 'zh-CN')
      throw new Error('This fixture contains Chinese demonstration content.');
    const credentials = await service.credentials(expectedId, status.version);
    const admin = credentials.accounts.find((a) => a.role === 'admin');
    if (!admin) throw new Error('Managed administrator account missing.');
    await demoContext.run(
      {
        id: dataset.id,
        locale: dataset.locale,
        baseDate: dataset.baseDate,
        users: new Set(dataset.accounts.map((a) => a.id)),
        identities: Object.fromEntries(
          dataset.accounts.map((a) => [a.role, a.id]),
        ),
      },
      async () => {
        const session = await trialSession(app, 'admin', admin.password);
        const folder = dataOf(
          await session.request('/knowledge/folders', {
            requestKey: `${expectedId}-ai-basis-v1-folder`,
            title: 'AI 审批依据（演示）',
            parentId: null,
          }),
        );
        const documents = [];
        for (const item of approvalKnowledge) {
          const doc = dataOf(
            await session.request('/knowledge/documents', {
              requestKey: `${expectedId}-ai-basis-v1-${item.key}`,
              title: item.title,
              folderId: folder.id,
              departmentIds: [],
              dutyRoleCodes: [],
              kind: 'markdown',
              markdown: knowledgeMarkdown(item),
            }),
          );
          // Read through the same authenticated endpoint to verify publication.
          await session.request(`/knowledge/documents/${doc.id}`);
          documents.push({
            key: item.key,
            id: doc.id,
            title: doc.title,
            version: doc.version,
          });
        }
        process.stdout.write(
          JSON.stringify(
            { datasetId: expectedId, folderId: folder.id, documents },
            null,
            2,
          ) + '\n',
        );
      },
    );
  }
} finally {
  await server.close();
}

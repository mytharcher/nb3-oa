import type { Approval } from '@nocobase/app-plugin-approval/server';
import type { DatabaseManager, RepositoryRecord } from '@nocobase/db';
import type { NocoBaseDriveManager } from '@nocobase/drive';
import { extractText, getDocumentProxy } from 'unpdf';
import type { ContractService } from './service.js';
import type { ReviewDefinition, AiActor } from '../approval-ai/contract.js';
import { readPolicy } from '../approval-ai/service.js';
import type { Material } from '../../../shared/approval-ai.js';
import { ContractError } from './errors.js';
import { CONTRACT_KIND } from './types.js';
export async function extractContractPdf(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  try {
    const { text } = await extractText(pdf, { mergePages: false });
    // Do not infer compliance from empty/scanned pages; mixed PDFs are unsupported too.
    if (
      !text.length ||
      text.some((page) => page.replace(/\s/g, '').length < 20)
    )
      return null;
    return text.map((page, i) => '[Page ' + (i + 1) + ']\n' + page).join('\n');
  } finally {
    await pdf.loadingTask.destroy();
  }
}
export async function contractAiDefinition(
  service: ContractService,
  db: DatabaseManager,
  drive: NocoBaseDriveManager,
): Promise<ReviewDefinition> {
  const kit = await service.initialize();
  let cursor = '';
  async function recordTasks(recordId: string) {
    return kit.read(() => kit.approvals.tasksFor(CONTRACT_KIND, recordId));
  }
  async function policy(actor: AiActor) {
    return readPolicy(actor, 'oa.contract', 'contractRequests');
  }
  async function visible(actor: AiActor, id: string) {
    const p = await policy(actor);
    if (!p) return false;
    try {
      await service.searchVisible(id, actor.userId, p);
      return true;
    } catch (e) {
      if (e instanceof ContractError) return false;
      throw e;
    }
  }
  async function requestIds(after: string, limit: number) {
    return db.repository<{ id: string }>('contractRequests').findMany({
      filter: (f) =>
        f.and([
          f.string('status').eq('legalFinance'),
          ...(after
            ? [
                {
                  kind: 'condition' as const,
                  path: ['id'],
                  operator: '$gt' as const,
                  value: after,
                },
              ]
            : []),
        ]),
      sort: (s) => s.field('id').asc(),
      select: (s) => s.fields('id'),
      limit,
    });
  }
  return {
    id: 'contracts.legal-review',
    version: 1,
    titleKey: 'approvalAi.contractTitle',
    approval: kit.definition.approval as unknown as Approval<never>,
    stages: ['legalFinance'],
    fields: [
      'operation',
      'contractType',
      'counterparty',
      'amountCents',
      'startsOn',
      'endsOn',
      'paymentTerms',
      'standardTemplate',
      'textVersionId',
      'attachments',
    ],
    basis: [
      {
        key: 'contract-review-points',
        titleKey: 'approvalAi.contractBasis',
        required: true,
      },
    ],
    checks: [
      {
        id: 'parties',
        titleKey: 'approvalAi.checks.parties',
        instruction:
          'Verify parties and signing entities agree with the application and supplied contract text.',
        basis: ['contract-review-points'],
      },
      {
        id: 'payment',
        titleKey: 'approvalAi.checks.payment',
        instruction:
          'Check amount, currency, payment milestones and acceptance conditions against the supplied application and review basis.',
        basis: ['contract-review-points'],
      },
      {
        id: 'liability',
        titleKey: 'approvalAi.checks.liability',
        instruction:
          'Check liability limits, breach, termination and dispute resolution against the review basis. Unreadable clauses are not covered.',
        basis: ['contract-review-points'],
      },
      {
        id: 'term',
        titleKey: 'approvalAi.checks.term',
        instruction:
          'Check effective dates, term, renewal and consistency with the application. Do not assume absent text is compliant.',
        basis: ['contract-review-points'],
      },
    ],
    instructions:
      'Amounts ending in Cents are integer cents. All suggestions are advisory. Missing or unreadable contract text must be not_covered for text-dependent conclusions.',
    maxOutputTokens: 6000,
    host: {
      tasks: recordTasks,
      async task(taskId, recordId) {
        if (recordId)
          return (
            (await recordTasks(recordId)).find((t) => t.id === taskId) ?? null
          );
        // The public approval service has no global task-by-ID API. Discover only through application-owned active records.
        let after = '';
        for (;;) {
          const rows = await requestIds(after, 100);
          for (const row of rows) {
            const task = (await recordTasks(String(row.id))).find(
              (t) => t.id === taskId,
            );
            if (task) return task;
          }
          if (rows.length < 100) return null;
          after = String(rows.at(-1)!.id);
        }
      },
      async openTasks(limit) {
        let rows = await requestIds(cursor, 100);
        if (!rows.length) {
          cursor = '';
          rows = await requestIds('', 100);
        }
        const tasks = [];
        for (const row of rows) {
          tasks.push(
            ...(await recordTasks(String(row.id))).filter(
              (t) =>
                ['pending', 'claimed'].includes(t.status) &&
                t.stage === 'legalFinance',
            ),
          );
          cursor = String(row.id);
          if (tasks.length >= limit) break;
        }
        return tasks;
      },
      async run(task) {
        return (
          (
            await kit.read(() =>
              kit.approvals.runsFor(CONTRACT_KIND, task.recordId),
            )
          ).find((r) => r.id === task.runId) ?? null
        );
      },
      canRead: visible,
      async content(actor, task, content) {
        const p = await policy(actor);
        if (!p) return {};
        const row = await db
          .repository('contractRequests')
          .withPolicy(p)
          .findOne({ filter: { id: task.recordId } });
        return Object.fromEntries(
          Object.entries(content).filter(([key]) => row && key in row),
        );
      },
      async gather({ actor, task, content, tx }) {
        if (!(await visible(actor, task.recordId)))
          throw new Error('AI contract access changed');
        const materials: Material[] = [];
        const textId =
          typeof content.textVersionId === 'string'
            ? content.textVersionId
            : null;
        const text = textId
          ? await tx
              .repository('contractTextVersions')
              .findOne({ filter: { id: textId, requestId: task.recordId } })
          : null;
        const fileIds = [
          ...(typeof text?.fileId === 'string'
            ? [
                {
                  id: text.fileId,
                  ref: textId!,
                  kind: 'text' as const,
                  purpose: 'text',
                },
              ]
            : []),
          ...(Array.isArray(content.attachments)
            ? content.attachments
                .filter((id): id is string => typeof id === 'string')
                .map((id) => ({
                  id,
                  ref: id,
                  kind: 'attachment' as const,
                  purpose: 'evidence',
                }))
            : []),
        ];
        if (!text)
          materials.push({
            kind: 'text',
            ref: textId ?? 'contract-text',
            label: 'approvalAi.contractText',
            status: 'missing',
          });
        for (const item of fileIds) {
          const file = await tx
            .repository<
              RepositoryRecord & {
                disk: string;
                key: string;
                filename: string;
                mimeType: string;
                size: number;
              }
            >('contractAttachmentFiles')
            .findOne({
              filter: {
                id: item.id,
                requestId: task.recordId,
                purpose: item.purpose,
              },
            });
          const material: Material = {
            kind: item.kind,
            ref: item.ref,
            label: file?.filename ?? 'approvalAi.contractText',
            status: file ? 'not_supported' : 'missing',
            ...(item.kind === 'text' && text
              ? { version: Number(text.version) }
              : {}),
          };
          if (
            file?.mimeType === 'application/pdf' &&
            Number(file.size) <= 5 * 1024 * 1024
          ) {
            const stream = await drive.use(file.disk).getStream(file.key);
            const chunks: Buffer[] = [];
            let size = 0;
            try {
              for await (const chunk of stream) {
                const b = Buffer.from(chunk as Uint8Array);
                size += b.length;
                if (size > 5 * 1024 * 1024) throw new Error('PDF too large');
                chunks.push(b);
              }
            } finally {
              stream.destroy();
            }
            try {
              const extracted = await extractContractPdf(
                new Uint8Array(Buffer.concat(chunks)),
              );
              if (extracted) {
                material.status = 'read';
                material.text = extracted;
              }
            } catch {
              /* Corrupt/encrypted PDFs are explicitly uncovered. */
            }
          }
          materials.push(material);
        }
        return materials;
      },
    },
  };
}

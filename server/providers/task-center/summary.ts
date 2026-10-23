import type { DatabaseConnection } from '@nocobase/db';
import { applicationCategory } from './application-category.js';
import { taskReference } from './values.js';

/** Application-owned presentation only. Never copy reasons, money or attachments. */
export async function writeTaskSummary(
  connection: DatabaseConnection,
  subject: string,
  record: Readonly<Record<string, unknown>>,
  applicantId: string | null,
  stateField = 'status',
): Promise<void> {
  const key = { subject, recordId: taskReference(record.id) };
  const status = taskReference(record[stateField]);
  const values = {
    applicantId,
    status,
    category: applicationCategory(status),
    number:
      typeof record.number === 'string' ? record.number.slice(0, 240) : null,
    createdAt: record.createdAt ?? null,
    dueAt: record.dueAt ?? null,
  };
  await connection.repository('oaTaskCenterSummaries').upsertOne({
    filter: key,
    create: { ...key, ...values },
    update: values,
  });
}

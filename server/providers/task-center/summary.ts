import type { DatabaseConnection } from '@nocobase/db';
import { applicationCategory } from './application-category.js';
import { taskDate, taskReference } from './values.js';

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
    // Business datetime fields read as local wall-clock strings. Convert them to
    // instants before writing the summary's datetimeTz fields.
    createdAt: record.createdAt == null ? null : taskDate(record.createdAt),
    dueAt: record.dueAt == null ? null : taskDate(record.dueAt),
  };
  await connection.repository('oaTaskCenterSummaries').upsertOne({
    filter: key,
    create: { ...key, ...values },
    update: values,
  });
}

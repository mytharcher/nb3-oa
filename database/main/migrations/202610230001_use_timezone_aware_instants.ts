import { defineMigration, type FieldDefinition } from '@nocobase/db';
import type { Knex } from 'knex';

// Fixed application-owned instant fields. Plugin-owned fields and calendar dates are outside this migration.
const instantFields: Readonly<Record<string, readonly string[]>> = {
  announcementFiles: ['createdAt', 'updatedAt'],
  announcementReceipts: ['confirmedAt', 'statusChangedAt'],
  announcements: ['validFrom', 'validUntil', 'publishedAt', 'statusChangedAt'],
  approvalRules: ['effectiveFrom', 'createdAt'],
  attendanceChangeAttachmentFiles: ['createdAt', 'updatedAt'],
  attendanceEvaluationRevisions: ['createdAt'],
  attendanceScheduleRevisions: ['createdAt'],
  attendanceShiftRevisions: ['createdAt'],
  auditLogs: ['at'],
  calendarDays: ['updatedAt'],
  certificateFiles: ['createdAt', 'updatedAt'],
  certificateIssues: ['confirmedAt'],
  certificatePreparations: ['preparedAt'],
  certificateRequests: ['createdAt', 'statusChangedAt', 'submittedAt'],
  contractAttachmentFiles: ['createdAt', 'updatedAt'],
  contractSealLinks: ['sealedAt', 'confirmedAt'],
  demoDataControl: ['leaseUntil'],
  demoDataOperations: ['createdAt'],
  demoDataPreviews: ['expiresAt'],
  demoDataSets: ['createdAt', 'updatedAt'],
  demoSalaryGradeRevisions: ['createdAt'],
  dictionaries: ['createdAt', 'updatedAt'],
  employeeArchiveReferences: ['archivedAt'],
  generalAttachmentFiles: ['createdAt', 'updatedAt'],
  headcountAccounts: ['createdAt', 'updatedAt'],
  headcountCommands: ['createdAt'],
  headcountJournal: ['at'],
  headcountOccupancies: ['createdAt', 'releasedAt'],
  headcountReplacementNotices: ['statusChangedAt'],
  headcountSeats: ['createdAt'],
  headcountSources: ['createdAt'],
  importFiles: ['createdAt', 'updatedAt'],
  importRuns: ['createdAt', 'finishedAt'],
  knowledgeDocuments: ['updatedAt'],
  knowledgeFiles: ['createdAt', 'updatedAt'],
  knowledgeVersionNotices: ['statusChangedAt'],
  knowledgeVersions: ['createdAt'],
  leaveAttachmentFiles: ['createdAt', 'updatedAt'],
  meetingBookingHistory: ['at'],
  meetingBookings: [
    'startAt',
    'endAt',
    'statusChangedAt',
    'confirmedAt',
    'checkedInAt',
  ],
  oaTaskCenterTimers: ['dueAt'],
  onboardingFiles: ['createdAt', 'updatedAt'],
  paymentAttachmentFiles: ['createdAt', 'updatedAt'],
  personalSchedules: ['startAt', 'endAt'],
  printTemplateFiles: ['createdAt', 'updatedAt'],
  reimbursementAttachmentFiles: ['createdAt', 'updatedAt'],
  salaryGradeRevisions: ['createdAt'],
  sealFiles: ['createdAt', 'updatedAt'],
  sealLedger: ['borrowedAt', 'sealedAt', 'registeredAt'],
  sealReceipts: ['returnedAt', 'sealedAt'],
  sealReminderDeliveries: ['deliveredAt'],
  sealRequests: [
    'returnDueAt',
    'approvedAt',
    'sealedAt',
    'borrowedAt',
    'returnedAt',
    'submittedAt',
    'createdAt',
    'statusChangedAt',
  ],
  travelAttachmentFiles: ['createdAt', 'updatedAt'],
  vehicleCommands: ['createdAt'],
  vehicleUsageReceipts: ['createdAt'],
  vehicleUses: ['startAt', 'endAt', 'createdAt'],
  vendorCommitteeAssignments: ['updatedAt'],
  vendorCommitteeVersions: ['createdAt'],
  vendorQualificationAttachmentFiles: ['createdAt', 'updatedAt'],
  vendorQualificationBanks: ['updatedAt'],
  vendorQualificationCreationCommands: ['createdAt'],
  vendorQualifications: ['statusChangedAt', 'createdAt', 'updatedAt'],
  vendorRemovalConfiguration: ['updatedAt'],
  workItemFiles: ['createdAt', 'updatedAt'],
  workItems: ['dueAt', 'completedAt', 'statusChangedAt'],
};

export default defineMigration({
  name: '202610230001_use_timezone_aware_instants',
  transaction: true,
  irreversible: true,
  async up({ builder, query, connection, config }) {
    const pending: {
      collection: string;
      fields: { name: string; changes: Omit<FieldDefinition, 'name'> }[];
    }[] = [];
    let hasHistoricalValues = false;
    for (const [collection, names] of Object.entries(instantFields)) {
      const definition = await builder.getCollection(collection);
      if (!definition) continue;
      const fields = (definition.fields ?? []).flatMap((field) => {
        if (!names.includes(field.name) || field.type !== 'datetime') return [];
        const { name, ...previous } = field;
        // Builder alterations must retain nullability/defaults and other field attributes explicitly.
        return [
          { name, changes: { ...previous, type: 'datetimeTz' as const } },
        ];
      });
      if (!fields.length) continue;
      pending.push({ collection, fields });
      for (const { name: field } of fields) {
        if (
          await query
            .selectFrom(collection)
            .select(field)
            .where(field, 'is not', null)
            .limit(1)
            .executeTakeFirst()
        ) {
          hasHistoricalValues = true;
          break;
        }
      }
    }
    if (!pending.length) return;
    const configuredZone =
      config.get<string>('app.legacyTimestampTimeZone') ??
      process.env.OA_LEGACY_TIMESTAMP_TIME_ZONE;
    if (hasHistoricalValues && !configuredZone?.trim())
      throw new Error(
        'Set OA_LEGACY_TIMESTAMP_TIME_ZONE to the verified historical writer time zone before converting existing OA timestamps.',
      );
    const timeZone = configuredZone?.trim() || 'UTC';
    new Intl.DateTimeFormat('en', { timeZone }).format(new Date(0));
    if (hasHistoricalValues && connection.dialect !== 'postgres')
      throw new Error(
        'Existing OA timestamp conversion is supported on PostgreSQL only; prepare a dialect-specific data migration before upgrading this database.',
      );
    // QueryAdapter cannot express PostgreSQL transaction-local session settings. Builder still owns every schema/metadata change.
    const client =
      connection.dialect === 'postgres'
        ? await connection.client<Knex>()
        : undefined;
    let previous = 'UTC';
    if (client) {
      const result = await client.raw<{ rows: { zone: string }[] }>(
        "select current_setting('TimeZone') as zone",
      );
      previous = result.rows[0].zone;
    }
    if (client)
      await client.raw("select set_config('TimeZone', ?, true)", [timeZone]);
    for (const { collection, fields } of pending) {
      await builder.alterCollection(collection, {
        alterFields: fields,
      });
    }
    if (client)
      await client.raw("select set_config('TimeZone', ?, true)", [previous]);
  },
});

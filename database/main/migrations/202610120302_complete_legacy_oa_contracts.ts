import {
  defineMigration,
  RepositoryError,
  type MigrationContext,
} from '@nocobase/db';

// Forward correction for installations that executed earlier shapes of these
// registered contracts. Keep this snapshot self-contained; never replay old migrations.
export default defineMigration({
  name: '202610120302_complete_legacy_oa_contracts',
  irreversible: true,
  async up(context) {
    const { builder, query } = context;
    async function missing(
      collection: string,
      field: string,
    ): Promise<boolean> {
      try {
        // Repository validates logical field metadata before querying; a physical SQL
        // error would abort the PostgreSQL transaction. No records are loaded here.
        await context
          .repository(collection)
          .withPolicy({
            read: {
              fields: [field],
              scope: (f) =>
                f.and([f.string('id').eq(''), f.string('id').ne('')]),
            },
            create: false,
            update: false,
            delete: false,
          })
          .findMany({ limit: 1 });
        return false;
      } catch (error) {
        if (
          error instanceof RepositoryError &&
          error.code === 'FIELD_NOT_FOUND'
        )
          return true;
        throw error;
      }
    }
    async function add(
      collection: string,
      field: Parameters<MigrationContext['builder']['addField']>[1],
    ) {
      if (!(await missing(collection, field.name))) return false;
      if (
        field.nullable === false &&
        (await query
          .selectFrom(collection)
          .select('id')
          .limit(1)
          .executeTakeFirst())
      ) {
        throw new Error(
          `LEGACY_OA_BACKFILL_REQUIRED: ${collection}.${field.name} has historical rows; no historical business facts will be invented.`,
        );
      }
      await builder.addField(collection, field);
      return true;
    }
    if (!(await builder.hasCollection('budgetConsumptions'))) {
      await builder.createCollection('budgetConsumptions', (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('consumptionReference', { length: 255, nullable: false });
        c.unique('consumptionReference');
        c.string('budgetId', { length: 64, nullable: false });
        c.string('sourceReference', { length: 255, nullable: false });
        c.bigInt('cents', { nullable: false });
        c.string('requestKey', { length: 255, nullable: false });
      });
    }
    if (!(await builder.hasCollection('contractAttachmentFiles'))) {
      await builder.createCollection('contractAttachmentFiles', (c) => {
        c.uuid('id').primary().notNull();
        c.string('disk', { length: 255 }).notNull();
        c.text('key').notNull();
        c.text('filename').notNull();
        c.string('ext', { length: 32 }).notNull();
        c.string('mimeType', { length: 255 }).notNull();
        c.bigInt('size').notNull();
        c.datetime('createdAt').notNull();
        c.datetime('updatedAt').notNull();
        c.string('requestId', { length: 64 }).notNull();
        c.string('ownerId', { length: 64 }).notNull();
        c.integer('uploadVersion').notNull();
        c.string('purpose', { length: 32 }).notNull();
        c.index('requestId');
      });
    }
    if (!(await builder.hasCollection('departureExecutions'))) {
      await builder.createCollection('departureExecutions', (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        for (const field of ['departureId', 'employeeId', 'applicantId'])
          c.string(field, { length: 64, nullable: false });
        c.unique('departureId');
        c.string('managerId', { length: 64, nullable: true });
        c.string('lastWorkingDay', { length: 10, nullable: false });
        c.string('failureCode', { length: 64, nullable: true });
        c.string('status', { length: 32, nullable: false });
        c.datetimeTz('statusChangedAt', { nullable: false });
        c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
        c.datetimeTz('createdAt', { nullable: false });
        c.index(['status', 'lastWorkingDay']);
      });
    }
    if (!(await builder.hasCollection('loanCreationCommands'))) {
      await builder.createCollection('loanCreationCommands', (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('actorId', { length: 64, nullable: false });
        c.string('requestKey', { length: 128, nullable: false });
        c.text('fingerprint', { nullable: false });
        c.string('recordId', { length: 64, nullable: false });
        c.unique(['actorId', 'requestKey']);
      });
    }
    if (!(await builder.hasCollection('probationDraftCycles'))) {
      await builder.createCollection('probationDraftCycles', (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('employeeId', { length: 64, nullable: false });
        c.string('probationEndDate', { length: 10, nullable: false });
        c.string('recordId', { length: 64, nullable: false });
        c.unique(['employeeId', 'probationEndDate']);
        c.unique('recordId');
        c.datetimeTz('createdAt', { nullable: false });
      });
    }
    if (!(await builder.hasCollection('vendorQualificationAttachmentFiles'))) {
      await builder.createCollection(
        'vendorQualificationAttachmentFiles',
        (c) => {
          c.uuid('id').primary().notNull();
          c.string('disk', { length: 255 }).notNull();
          c.text('key').notNull();
          c.text('filename').notNull();
          c.string('ext', { length: 32 }).notNull();
          c.string('mimeType', { length: 255 }).notNull();
          c.bigInt('size').notNull();
          c.datetime('createdAt').notNull();
          c.datetime('updatedAt').notNull();
          c.string('qualificationId', { length: 64 }).notNull();
          c.string('ownerId', { length: 64 }).notNull();
          c.integer('uploadVersion').notNull();
          c.index('qualificationId');
        },
      );
    }
    if (!(await builder.hasCollection('vendorRemovalConfiguration'))) {
      await builder.createCollection('vendorRemovalConfiguration', (c) => {
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        c.string('personId', { length: 64, nullable: true });
        c.integer('version', { nullable: false });
        c.datetime('updatedAt', { nullable: false });
      });
    }
    await add('budgetAdjustments', {
      name: 'heldCents',
      type: 'bigInt',
      nullable: false,
      defaultValue: 0,
    });
    await add('expenseAuthorizations', {
      name: 'budgetMode',
      type: 'string',
      length: 16,
      nullable: false,
    });
    await add('expensePlans', {
      name: 'gmApproverId',
      type: 'string',
      length: 64,
      nullable: true,
    });
    await add('expensePlans', {
      name: 'gmMerged',
      type: 'json',
      nullable: true,
    });
    await add('knowledgeVersionNotices', {
      name: 'delivery',
      type: 'json',
      nullable: false,
    });
    await add('loanReminderEvents', {
      name: 'state',
      type: 'string',
      length: 16,
      nullable: false,
      defaultValue: 'pending',
    });
    await add('loanRequests', {
      name: 'quotaSnapshot',
      type: 'json',
      nullable: true,
    });
    await add('onboardings', {
      name: 'mentorName',
      type: 'string',
      nullable: true,
    });
    await add('paymentRequests', {
      name: 'gmMerged',
      type: 'json',
      nullable: true,
    });
    await add('paymentRequests', {
      name: 'contractVersion',
      type: 'integer',
      nullable: true,
    });
    await add('purchaseQuoteFiles', {
      name: 'quoteBasisHash',
      type: 'string',
      nullable: false,
    });
    await add('sealLedger', {
      name: 'contractTextVersionId',
      type: 'string',
      length: 64,
      nullable: true,
    });
    await add('sealReceipts', {
      name: 'contractConfirmation',
      type: 'string',
      length: 32,
      nullable: false,
    });
    await add('supplyIssueLedger', {
      name: 'number',
      type: 'string',
      length: 64,
      nullable: true,
    });
    await add('supplyIssueLedger', {
      name: 'itemLabel',
      type: 'json',
      nullable: false,
    });
    await add('supplyIssueLedger', {
      name: 'recipientName',
      type: 'string',
      length: 500,
      nullable: false,
    });
    await add('supplyIssueLedger', {
      name: 'issuerName',
      type: 'string',
      length: 500,
      nullable: false,
    });
    await add('vendorQualifications', {
      name: 'statusChangedAt',
      type: 'datetime',
      nullable: false,
    });
    if (
      await add('headcountOccupancies', {
        name: 'activeKey',
        type: 'string',
        length: 64,
        nullable: false,
      })
    ) {
      await builder.dropConstraint(
        'headcountOccupancies',
        'idx_headcount_occupancies_account_id_employee_id',
      );
      await builder.addIndex('headcountOccupancies', {
        fields: ['accountId', 'employeeId'],
      });
      await builder.addConstraint('headcountOccupancies', {
        type: 'unique',
        fields: ['activeKey'],
      });
    }
    await add('headcountOccupancies', {
      name: 'releaseKind',
      type: 'string',
      length: 32,
      nullable: true,
    });
    await add('headcountOccupancies', {
      name: 'generation',
      type: 'integer',
      nullable: false,
    });
  },
});

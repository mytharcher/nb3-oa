import { defineMigration } from '@nocobase/db';

// Early installations executed the travel migration before cancellation storage
// and approval-generation fields were added. Reconcile them without replaying
// that migration or dropping any business records. Fresh installs keep their schema.
export default defineMigration({
  name: '202610102402_complete_travel_cancellation_schema',
  irreversible: true,
  async up({ builder, connection }) {
    await builder.createCollection(
      'travelCancellations',
      (c) => {
        c.boolean('needsUnbooking', { nullable: false, defaultValue: false });
        c.text('unbookingInformation', { nullable: true });
        c.text('exceptionReason', { nullable: true });
        c.string('id', { length: 64, nullable: false });
        c.primary('id');
        for (const k of ['sourceId', 'applicantId', 'createdById'])
          c.string(k, { length: 64, nullable: false });
        c.string('number', { length: 64, nullable: true });
        c.unique('number');
        c.text('reason', { nullable: false });
        c.string('baseline', { length: 64, nullable: true });
        c.json('ruleSnapshot', { nullable: true });
        c.string('managerApproverId', { length: 64, nullable: true });
        c.string('status', { length: 32, nullable: false });
        c.datetimeTz('statusChangedAt', { nullable: false });
        c.integer('lifecycleVersion', { nullable: false, defaultValue: 0 });
        c.datetimeTz('createdAt', { nullable: false });
        c.index(['sourceId', 'status']);
      },
      { ifNotExists: true },
    );
    // MigrationContext exposes no logical field inspector. The application uses
    // these default physical names; read through the adapter before adding fields.
    const client = await connection.client<{
      schema: { hasColumn(table: string, column: string): Promise<boolean> };
    }>();
    if (
      !(await client.schema.hasColumn(
        'travel_requests',
        'authorization_source_id',
      ))
    ) {
      await builder.addField('travelRequests', {
        name: 'authorizationSourceId',
        type: 'string',
        length: 64,
        nullable: true,
      });
    }
    if (
      !(await client.schema.hasColumn('travel_requests', 'approval_generation'))
    ) {
      await builder.addField('travelRequests', {
        name: 'approvalGeneration',
        type: 'integer',
        nullable: false,
        defaultValue: 0,
      });
    }
  },
});

import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610110005_departure_cancellation_baseline',
  async up({ builder }) {
    for (const name of [
      'originalEmployeeStatus',
      'cancellationRequestedById',
      'cancellationFromStatus',
    ])
      await builder.addField('departureRequests', {
        name,
        type: 'string',
        nullable: true,
        length: 64,
      });
    await builder.addField('departureRequests', {
      name: 'cancellationReason',
      type: 'text',
      nullable: true,
    });
  },
  async down({ builder }) {
    await builder.dropField('departureRequests', 'cancellationReason');
    for (const name of [
      'cancellationFromStatus',
      'cancellationRequestedById',
      'originalEmployeeStatus',
    ])
      await builder.dropField('departureRequests', name);
  },
});

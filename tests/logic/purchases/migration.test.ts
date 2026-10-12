// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102501_create_purchases', {
  sources: [
    {
      packageName: 'purchase-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('purchaseOrders').toHaveField('actualCents', {
      nullable: false,
    });
    await expectCollection('purchasePaymentReferences').toHaveField(
      'requiresAdditionalApproval',
      { nullable: false },
    );
    await expectCollection('purchaseQuoteFiles').toHaveField('uploadVersion', {
      nullable: false,
    });
    await expectCollection('purchaseRequests').toHaveField('heldAccount', {
      nullable: true,
    });
    await expectCollection('purchaseRequests').toHaveField('heldCents', {
      nullable: false,
    });
    await expectCollection('purchaseRequests').toHaveField('estimatedCents', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    for (const table of [
      'purchaseRequests',
      'purchaseOrders',
      'purchasePaymentReferences',
      'purchaseQuoteFiles',
    ])
      await expectCollection(table).not.toExist();
  },
});

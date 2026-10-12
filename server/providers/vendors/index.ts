import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  defineDatabasePermission,
  condition,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { auditServiceToken } from '../audit/index.js';
import { vendorServiceToken, VENDOR_BASIC_FIELDS } from './contract.js';
import { createVendorService } from './service.js';
export * from './contract.js';
export { VendorError } from './service.js';
export const vendorResource = defineCompositeResource('oa.vendors', (r) =>
  r
    .title({ key: 'vendors.authz.resource', ns: 'nb3-oa' })
    .action('view', (a) =>
      a.title({ key: 'vendors.authz.view', ns: 'nb3-oa' }).grant(
        'vendors',
        defineDatabasePermission((p) =>
          p.collection('vendors').read([...VENDOR_BASIC_FIELDS]),
        ),
      ),
    )
    .action('bankRead', (a) =>
      a.title({ key: 'vendors.authz.bankRead', ns: 'nb3-oa' }).grant(
        'vendors',
        defineDatabasePermission((p) => p.collection('vendors').read('*')),
      ),
    )
    .action('manage', (a) =>
      a.title({ key: 'vendors.authz.manage', ns: 'nb3-oa' }).grant(
        'vendors',
        defineDatabasePermission((p) =>
          p.collection('vendors').read('*').create('*').update('*'),
        ),
      ),
    ),
);
export default class VendorsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/vendors-provider';
  public override register() {
    const c = this.app.container;
    c.singleton(vendorServiceToken, () =>
      createVendorService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'vendors',
      title: { key: 'vendors.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.vendorCreated', (scope) =>
        scope
          .title({ key: 'vendors.authz.createdScope', ns: 'nb3-oa' })
          .collections('vendors')
          .resolver(async ({ principal }) =>
            principal.type === 'user'
              ? condition('createdById', '$eq', principal.id)
              : false,
          ),
      ),
    );
    authz.compositeResources.define(vendorResource);
    authz.ui.sections.add({
      name: 'oa.vendors',
      parent: 'administration',
      title: { key: 'vendors.authz.resource', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.vendors' },
      { section: 'oa.vendors' },
    );
  }
}

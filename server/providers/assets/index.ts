import { createOnboardingAssetService } from './onboarding.js';
import { onboardingAssetServiceToken } from './contract.js';
import { assetStockSourceToken } from './stock-contract.js';
import { departureAssetClearanceToken } from '../departure/contract.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  defineDatabasePermission,
  condition,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { employeeServiceToken } from '../employees/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/index.js';
import { auditServiceToken } from '../audit/index.js';
import { dictionaryServiceToken } from '../platform/index.js';
import { assetServiceToken, assetClearanceServiceToken } from './contract.js';
import { createAssetService } from './service.js';
export * from './contract.js';
export { AssetError } from './service.js';
export const assetResource = defineCompositeResource('oa.assets', (r) =>
  r
    .title({ key: 'assets.authz.resource', ns: 'nb3-oa' })
    .action('view', (a) =>
      a.title({ key: 'assets.authz.view', ns: 'nb3-oa' }).grant(
        'assets',
        defineDatabasePermission((p) => p.collection('assets').read('*')),
      ),
    )
    .action('viewHeld', (a) =>
      a.title({ key: 'assets.authz.viewHeld', ns: 'nb3-oa' }).grant(
        'assets',
        defineDatabasePermission((p) =>
          p
            .collection('assets')
            .read((r) =>
              r
                .fields(
                  'id',
                  'code',
                  'category',
                  'name',
                  'serialNumber',
                  'status',
                  'holderEmployeeId',
                  'borrowDueDate',
                  'version',
                  'createdAt',
                  'updatedAt',
                )
                .recordAccess('oa.assets.heldByMe'),
            ),
        ),
      ),
    )
    .action('manage', (a) =>
      a.title({ key: 'assets.authz.manage', ns: 'nb3-oa' }).grant(
        'assets',
        defineDatabasePermission((p) =>
          p.collection('assets').read('*').create('*').update('*'),
        ),
      ),
    )
    .action('returnHeld', (a) =>
      a.title({ key: 'assets.authz.returnHeld', ns: 'nb3-oa' }).grant(
        'assets',
        defineDatabasePermission((p) =>
          p
            .collection('assets')
            .read('*')
            .update((u) =>
              u.fields(
                'status',
                'holderEmployeeId',
                'borrowDueDate',
                'version',
                'updatedAt',
              ),
            ),
        ),
      ),
    ),
);
export default class AssetsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/assets-provider';
  public override register() {
    const c = this.app.container;
    c.singleton(onboardingAssetServiceToken, () =>
      createOnboardingAssetService({
        audit: c.resolve(auditServiceToken),
        actor: async (actorId, role, tx) => {
          const directory = await c
            .resolve(approvalDirectoryServiceToken)
            .snapshot(tx);
          return (
            directory.isActive(actorId) && directory.hasRole(actorId, role)
          );
        },
      }),
    );
    c.singleton(assetServiceToken, () =>
      createAssetService({
        audit: c.resolve(auditServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        returnActor: async (actorId, tx) => {
          const directory = await c
            .resolve(approvalDirectoryServiceToken)
            .snapshot(tx);
          return (
            directory.isActive(actorId) && directory.hasRole(actorId, 'admin')
          );
        },
        source: {
          intent: (...args) => c.resolve(assetStockSourceToken).intent(...args),
        },
      }),
    );
    c.singleton(assetClearanceServiceToken, () => c.resolve(assetServiceToken));
    // Real legacy and workflow returns have same-transaction clearance proofs; no status correction substitutes for receipt.
    c.singleton(departureAssetClearanceToken, () =>
      c.resolve(assetClearanceServiceToken),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'assets',
      title: { key: 'assets.authz.resource', ns: 'nb3-oa' },
    });
    authz.recordAccess.define(
      defineRecordAccess('oa.assets.heldByMe', (scope) =>
        scope
          .title({ key: 'assets.authz.heldScope', ns: 'nb3-oa' })
          .collections('assets')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const employee = await this.app.container
              .resolve(employeeServiceToken)
              .getByUserId(principal.id);
            return employee
              ? condition('holderEmployeeId', '$eq', employee.id)
              : false;
          }),
      ),
    );
    authz.compositeResources.define(assetResource);
    authz.ui.sections.add({
      name: 'oa.assets',
      parent: 'administration',
      title: { key: 'assets.authz.resource', ns: 'nb3-oa' },
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.assets' },
      { section: 'oa.assets' },
    );
  }
}

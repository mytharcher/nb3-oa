import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import { processOwners, processResource } from './owners.js';

export const MANAGEMENT_ACTIONS = [
  'definitionRead',
  'historyRead',
  'appoint',
  'reassign',
  'terminate',
] as const;
export default class ProcessManagementProvider extends ServiceProvider<Application> {
  readonly name = 'oa/process-management';
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'oa.processManagement',
      parent: 'administration',
      title: { key: 'processManagement.title', ns: 'nb3-oa' },
    });
    for (const owner of processOwners) {
      const read = defineDatabasePermission((p) =>
        p.collection(owner.collection).read('*'),
      );
      authz.compositeResources.define(
        defineCompositeResource(processResource(owner.kind), (r) => {
          let resource = r.title({
            key: `processManagement.kinds.${owner.kind.slice(3)}`,
            ns: 'nb3-oa',
          });
          for (const action of MANAGEMENT_ACTIONS)
            resource = resource.action(action, (a) =>
              a
                .title({
                  key: `processManagement.authz.${action}`,
                  ns: 'nb3-oa',
                })
                .grant(
                  owner.collection,
                  ['definitionRead', 'historyRead'].includes(action)
                    ? read
                    : read.update('*'),
                ),
            );
          return resource;
        }),
      );
      authz.ui.place(
        { type: 'composite', id: processResource(owner.kind) },
        { section: 'oa.processManagement' },
      );
    }
    registerDepartmentScopes(
      authz,
      this.app.container.resolve(organizationServiceToken),
      {
        prefix: 'oa.processManagement',
        targets: processOwners.map((owner) => ({
          collection: owner.collection,
          ownerField: 'applicantId',
        })),
      },
    );
  }
}

export { retireOwnedProcesses } from './demo-retirement.js';

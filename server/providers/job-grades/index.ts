import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { orgServiceToken } from '../org/contract.js';
import { auditServiceToken } from '../audit/index.js';
import { salaryGradeServiceToken } from './contract.js';
import { createSalaryGradeService } from './service.js';
export * from './contract.js';
export { assertSalaryRange } from './ranges.js';
/** Only the caller-transaction facade is registered here; administrative HTTP authorization is separate. */
export default class SalaryGradesProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/salary-grades-provider';
  public override register() {
    const c = this.app.container;
    c.singleton(salaryGradeServiceToken, () =>
      createSalaryGradeService({
        org: c.resolve(orgServiceToken),
        audit: c.resolve(auditServiceToken),
      }),
    );
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    for (const name of ['salaryGradeCurrent', 'salaryGradeRevisions'])
      authz.database.collections.add({
        name,
        title: { key: 'jobGrades.authz.resource', ns: 'nb3-oa' },
      });
    authz.compositeResources.define(
      defineCompositeResource('oa.salaryGrades', (resource) =>
        resource
          .title({ key: 'jobGrades.authz.resource', ns: 'nb3-oa' })
          .action('view', (action) =>
            action.title({ key: 'jobGrades.authz.view', ns: 'nb3-oa' }).grant(
              'salaryGradeRevisions',
              defineDatabasePermission((p) =>
                p
                  .collection('salaryGradeRevisions')
                  .read((read) =>
                    read.fields('id', 'version', 'createdById', 'createdAt'),
                  ),
              ),
            ),
          )
          .action('viewSalary', (action) =>
            action
              .title({ key: 'jobGrades.authz.viewSalary', ns: 'nb3-oa' })
              .grant(
                'salaryGradeCurrent',
                defineDatabasePermission((p) =>
                  p.collection('salaryGradeCurrent').read('*'),
                ),
              )
              .grant(
                'salaryGradeRevisions',
                defineDatabasePermission((p) =>
                  p.collection('salaryGradeRevisions').read('*'),
                ),
              ),
          )
          .action('manage', (action) =>
            action
              .title({ key: 'jobGrades.authz.manage', ns: 'nb3-oa' })
              .grant(
                'salaryGradeCurrent',
                defineDatabasePermission((p) =>
                  p
                    .collection('salaryGradeCurrent')
                    .read('*')
                    .update((update) => update.fields('version', 'revisionId')),
                ),
              )
              .grant(
                'salaryGradeRevisions',
                defineDatabasePermission((p) =>
                  p.collection('salaryGradeRevisions').read('*').create('*'),
                ),
              ),
          ),
      ),
    );
  }
}

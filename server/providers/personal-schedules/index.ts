import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  condition,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { auditServiceToken } from '../audit/index.js';
import {
  PERSONAL_SCHEDULE_FIELDS,
  personalScheduleServiceToken,
} from './contract.js';
import { createPersonalScheduleService } from './service.js';
export * from './contract.js';
export * from './service.js';
const title = (key: string) => ({
  key: `personalSchedules.authz.${key}`,
  ns: 'nb3-oa',
});
export default class PersonalSchedulesProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/personal-schedules-provider';
  public override register() {
    this.app.container.singleton(personalScheduleServiceToken, () =>
      createPersonalScheduleService(
        this.app.container.resolve(auditServiceToken),
      ),
    );
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: 'oa.personalSchedules',
      parent: 'administration',
      title: title('title'),
    });
    authz.ui.place(
      { type: 'composite', id: 'oa.personalSchedules' },
      { section: 'oa.personalSchedules' },
    );
    authz.database.collections.add({
      name: 'personalSchedules',
      title: title('title'),
    });
    const own = authz.recordAccess.define(
      defineRecordAccess('oa.personalSchedulesOwned', (a) =>
        a
          .title(title('owned'))
          .collections('personalSchedules')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('ownerUserId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const read = defineDatabasePermission((p) =>
      p
        .collection('personalSchedules')
        .read((r) => r.fields(...PERSONAL_SCHEDULE_FIELDS)),
    );
    authz.compositeResources.define(
      defineCompositeResource('oa.personalSchedules', (r) =>
        r
          .title(title('title'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant('personalSchedules', read.options(own).default(own)),
          )
          .action('create', (a) =>
            a
              .title(title('create'))
              .grant(
                'personalSchedules',
                read.create('*').options(own).default(own),
              ),
          )
          .action('edit', (a) =>
            a
              .title(title('edit'))
              .grant(
                'personalSchedules',
                read
                  .update([
                    'title',
                    'description',
                    'startAt',
                    'endAt',
                    'version',
                  ])
                  .options(own)
                  .default(own),
              ),
          )
          .action('delete', (a) =>
            a
              .title(title('delete'))
              .grant(
                'personalSchedules',
                read.delete().options(own).default(own),
              ),
          ),
      ),
    );
  }
}

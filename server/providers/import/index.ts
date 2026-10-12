import { headcountServiceToken } from '../headcounts/contract.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { auditServiceToken } from '../audit/index.js';
import { employeeModuleService } from '../employees/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import { organizationServiceToken } from '../org/service.js';
import { IMPORT_AUTHZ_SECTION, IMPORT_SETTINGS, label } from './constants.js';
import { createImportService, importServiceToken } from './service.js';

export * from './constants.js';
export { KIND_SPECS, type ColumnSpec, type KindSpec } from './columns.js';
export * from './service.js';
export * from './types.js';

/** The file collection every uploaded workbook is kept in, with the plugin's fixed file columns. */
export const IMPORT_FILES_COLLECTION = 'importFiles';
/** Where the retained workbooks are served; the import routes guard it (signed in, `settings:oa.import` `read`). */
export const IMPORT_FILES_PATH = '/uploads/imports';
/** The drive disk the workbooks are stored on: the private local storage the application configures. */
export const IMPORT_FILES_DISK = 'local';

/**
 * Provider of the `import` OA module: the Excel import of departments, positions, grades, employee archives and
 * duty-role members (OA plan 01 §9). It writes through the organisation and employee services only, so it is
 * registered after both.
 */
export default class ImportProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/import-provider';

  public override register(): void {
    const container = this.app.container;
    container.singleton(importServiceToken, () => {
      const ids = container.resolve(idGeneratorToken);
      return createImportService({
        headcounts: () => container.resolve(headcountServiceToken),
        database: container.resolve(databaseManagerToken),
        organization: () => container.resolve(organizationServiceToken),
        employees: () =>
          employeeModuleService(container.resolve(employeeServiceToken)),
        users: () => container.resolve(userAdministrationServiceToken),
        audit: () => container.resolve(auditServiceToken),
        files: () =>
          container
            .resolve(serverFileRepositoryManagerToken)
            .repository(IMPORT_FILES_COLLECTION, {
              disk: IMPORT_FILES_DISK,
              accessPath: IMPORT_FILES_PATH,
              // The import is the only writer; nothing reaches this repository from a client.
              policy: {
                read: true,
                create: true,
                update: false,
                delete: false,
              },
            }),
        generateId: () => ids.generateString(),
        publicBasePath: () => this.app.publicBasePath,
      });
    });
  }

  public override async boot(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.settings.add({
      id: IMPORT_SETTINGS,
      title: label('authz.settings'),
      actions: [
        { name: 'read', title: label('authz.read') },
        { name: 'update', title: label('authz.update') },
      ],
    });
    authz.ui.place(
      { type: 'settings', id: IMPORT_SETTINGS },
      { section: IMPORT_AUTHZ_SECTION },
    );
  }
}

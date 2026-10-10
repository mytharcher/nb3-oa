import { OA_TEST_ORIGIN, OA_TEST_SERVER } from '../oa-test-origin.ts';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import ExcelJS from 'exceljs';

import {
  employeeModuleService,
  employeeServiceToken,
} from '../../../server/providers/employees/index.ts';
import type { EmployeeModuleService } from '../../../server/providers/employees/service.ts';
import {
  IMPORT_SETTINGS,
  importServiceToken,
  KIND_SPECS,
  type ImportKind,
  type ImportService,
} from '../../../server/providers/import/index.ts';
import {
  organizationServiceToken,
  type OrganizationService,
} from '../../../server/providers/org/index.ts';
import { createStandaloneServer } from '../../../server/standalone.ts';

export interface ImportTestApp {
  readonly testApp: TestApp;
  readonly imports: ImportService;
  readonly organization: OrganizationService;
  readonly employees: EmployeeModuleService;
  /** Creates an enabled account (with a username) and signs it in. */
  createUser(name: string, username?: string): Promise<TestSession>;
  admin(): Promise<TestSession>;
  grantImport(
    userId: string,
    actions: readonly ('read' | 'update')[],
  ): Promise<void>;
  disableUser(userId: string): Promise<void>;
  close(): Promise<void>;
}

let sequence = 0;

/** The whole application on test databases: every plugin, migration and seed, as `pnpm start` runs it. */
export async function startImportTestApp(): Promise<ImportTestApp> {
  const testApp = await createTestApp({
    createServer: createStandaloneServer,
    server: OA_TEST_SERVER,
    config: {
      secrets: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      app: { publicOrigin: OA_TEST_ORIGIN },
    },
  });
  const container = testApp.application.container;
  const authz = container.resolve(authorizationToken);
  const users = container.resolve(userAdministrationServiceToken);
  return {
    testApp,
    imports: container.resolve(importServiceToken),
    organization: container.resolve(organizationServiceToken),
    employees: employeeModuleService(container.resolve(employeeServiceToken)),
    async createUser(name, username) {
      sequence += 1;
      const email = `${name.toLowerCase()}-${sequence}@import.test`;
      const password = 'import-test-password-123';
      await users.create({
        name,
        email,
        password,
        ...(username ? { username } : {}),
      });
      return signIn(testApp, { email, password });
    },
    admin: () => signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    async grantImport(userId, actions) {
      sequence += 1;
      const set = definePermissionSet(`import-test-${sequence}`)
        .grant(authz.settings.grant(IMPORT_SETTINGS, actions))
        .build();
      await authz.permissionSets.create(set);
      await authz.permissionSets.assign({
        permissionSet: set.key,
        subject: { type: 'user', id: userId },
      });
    },
    async disableUser(userId) {
      await users.disable(userId);
    },
    close: () => testApp.close(),
  };
}

/** An `.xlsx` workbook whose first sheet has the given header row and rows. */
export async function workbookBytes(
  header: readonly string[],
  rows: readonly (readonly (string | number | Date | null)[])[],
): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('数据');
  sheet.addRow([...header]);
  for (const row of rows) sheet.addRow([...row]);
  return new Uint8Array(
    (await workbook.xlsx.writeBuffer()) as unknown as ArrayBuffer,
  );
}

/** A workbook with the template's headers of a kind, in its column order, filled from objects keyed by column key. */
export async function kindFile(
  kind: ImportKind,
  rows: readonly Record<string, string | number | Date | null>[],
  name = `${kind}.xlsx`,
): Promise<File> {
  const columns = KIND_SPECS[kind].columns;
  const bytes = await workbookBytes(
    columns.map((column) => column.header),
    rows.map((row) => columns.map((column) => row[column.key] ?? null)),
  );
  return new File([bytes], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** The origin a browser sends; the application refuses a cookie-authenticated write without a same-site origin. */
export const ORIGIN = OA_TEST_ORIGIN;

export function upload(kind: string, file: File | Blob | string): RequestInit {
  const body = new FormData();
  body.set('kind', kind);
  body.set('file', file);
  return { method: 'POST', headers: { origin: ORIGIN }, body };
}

import {
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';
import { FileSpreadsheet } from 'lucide-react';

/**
 * Routes of the `import` OA module: the Excel import page in 组织与人员 (`oa-organization`). The page and the detail
 * drawer need `settings:oa.import` `read`; the new-import dialog declares `update`, which every write endpoint checks.
 */
const importSettingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    parent: 'oa-organization',
    name: 'import-data',
    path: '/import',
    navigation: {
      title: 'import.navigation.title',
      icon: FileSpreadsheet,
      order: 60,
    },
    authz: {
      resource: { type: 'settings', id: 'oa.import' },
      action: 'read',
    },
    componentLoader: () => import('../pages/import/index.js'),
    children: [
      {
        // /settings/import/new: check a file, then import it (static segment before :runId)
        name: 'import-data-new',
        path: 'new',
        authz: {
          resource: { type: 'settings', id: 'oa.import' },
          action: 'update',
        },
        componentLoader: () => import('../pages/import/new.js'),
      },
      {
        // /settings/import/:runId: one attempt, with its problems when it failed
        name: 'import-data-run',
        path: ':runId',
        componentLoader: () => import('../pages/import/detail.js'),
      },
    ],
  },
]);

/** Routes of the `import` OA module, spread into `client/routes.ts`. */
const importRoutes: readonly AppClientRouteContribution[] = [
  importSettingsRoutes,
];

export default importRoutes;

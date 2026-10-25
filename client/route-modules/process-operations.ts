import { defineAppRoutes } from '@nocobase/app-client/plugins';
export default defineAppRoutes([
  {
    name: 'oa-report-process-operations',
    parent: 'oa-reports',
    path: '/reports/process-operations',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.processOperations' },
      action: 'read',
    },
    navigation: { title: 'processOperations.title', order: 65 },
    componentLoader: () => import('../pages/process-operations/index.js'),
  },
]);

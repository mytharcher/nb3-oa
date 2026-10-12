import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { FileSpreadsheet } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'attendance-import',
    parent: 'oa-configuration',
    path: '/attendance-import',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.attendanceImport' },
      action: 'ingest',
    },
    navigation: {
      title: 'attendanceImport.title',
      icon: FileSpreadsheet,
      order: 89,
    },
    breadcrumb: { title: 'attendanceImport.title' },
    componentLoader: () => import('../pages/attendance-import/index.js'),
  },
]);

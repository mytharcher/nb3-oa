import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { CloudDownload } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'wecom-attendance',
    parent: 'oa-hr',
    path: '/wecom-attendance',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.wecomAttendance' },
      action: 'view',
    },
    navigation: {
      title: 'wecomAttendance.title',
      icon: CloudDownload,
      order: 145,
    },
    componentLoader: () => import('../pages/wecom-attendance/index.js'),
  },
]);

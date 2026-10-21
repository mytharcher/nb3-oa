import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ChartNoAxesCombined } from 'lucide-react';

export default defineAppRoutes([
  {
    name: 'oa-reports',
    path: '/reports',
    auth: 'required',
    authz: 'skip',
    navigation: {
      title: 'reports.title',
      icon: ChartNoAxesCombined,
      order: 90,
    },
    componentLoader: () => import('../pages/reports/index.js'),
  },
]);

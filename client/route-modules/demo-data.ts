import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Database } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'demo-data',
    parent: 'oa-system',
    path: '/demo-data',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.demoData' },
      action: 'read',
    },
    navigation: { title: 'demoData.title', icon: Database, order: 100 },
    componentLoader: () => import('../pages/demo-data/index.js'),
  },
]);

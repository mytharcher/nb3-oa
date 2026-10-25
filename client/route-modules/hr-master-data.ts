import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { RefreshCw } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'hr-master-data',
    parent: 'oa-system-connections',
    path: '/hr-master-data',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'oa.hrMasterData' },
      action: 'read',
    },
    navigation: { title: 'hrMasterData.title', icon: RefreshCw, order: 35 },
    componentLoader: () => import('../pages/hr-master-data/index.js'),
  },
]);

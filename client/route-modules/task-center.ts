import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ListChecks } from 'lucide-react';

// Prototype of the layered task center; it shows sample data until Task Center data is wired in.
export default defineAppRoutes([
  {
    name: 'oa-task-center',
    path: '/taskCenter',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa.approvals' },
      action: 'access',
    },
    navigation: {
      title: 'taskCenter.navigation',
      icon: ListChecks,
      order: 15,
    },
    componentLoader: () => import('../pages/task-center/index.js'),
  },
]);

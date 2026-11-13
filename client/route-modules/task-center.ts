import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { viewChildren } from './approvals.js';
import { ListChecks } from 'lucide-react';

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
    children: [
      ...viewChildren('oa-task-center'),
      {
        name: 'task-center-it-repair',
        path: 'itRepair/:repairId',
        authz: {
          resource: { type: 'composite', id: 'oa.itRepairs' },
          action: 'view',
        },
        componentLoader: () => import('../pages/it-repairs/detail.js'),
      },
      {
        name: 'oa-task-center-target',
        path: 'task/:taskId',
        componentLoader: () => import('../pages/task-center/target.js'),
      },
    ],
  },
]);

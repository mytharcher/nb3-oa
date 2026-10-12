import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Megaphone } from 'lucide-react';
const policy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.announcements' },
  action,
});
export default defineAppRoutes([
  {
    name: 'announcements',
    parent: 'oa-office',
    path: '/announcements',
    auth: 'required',
    authz: policy('view'),
    navigation: { title: 'announcements.title', icon: Megaphone, order: 20 },
    breadcrumb: { title: 'announcements.title' },
    componentLoader: () => import('../pages/announcements/index.js'),
    children: [
      {
        name: 'announcements-new',
        path: 'new',
        authz: policy('create'),
        componentLoader: () => import('../pages/announcements/form.js'),
      },
      {
        name: 'announcements-detail',
        path: ':announcementId',
        componentLoader: () => import('../pages/announcements/detail.js'),
        children: [
          {
            name: 'announcements-edit',
            path: 'edit',
            authz: policy('edit'),
            componentLoader: () => import('../pages/announcements/form.js'),
          },
          ...(['publish', 'revoke', 'remind', 'confirm'] as const).map(
            (action) => ({
              name: `announcements-${action}`,
              path: `actions/${action}`,
              authz: policy(action),
              componentLoader: () => import('../pages/announcements/action.js'),
            }),
          ),
          {
            name: 'announcements-receipts',
            path: 'receipts',
            authz: policy('receipts'),
            componentLoader: () => import('../pages/announcements/receipts.js'),
          },
        ],
      },
    ],
  },
]);

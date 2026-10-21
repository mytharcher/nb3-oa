import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { recruitmentViewChildren } from './recruitment.js';
import { transferViewChildren } from './transfer.js';
import { Gauge } from 'lucide-react';
const policy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.headcounts' },
  action,
});
export default defineAppRoutes([
  {
    name: 'oa-headcounts',
    parent: 'oa-organization',
    path: '/headcounts',
    auth: 'required',
    authz: policy('view'),
    navigation: { title: 'headcounts.title', icon: Gauge, order: 62 },
    breadcrumb: { title: 'headcounts.title' },
    componentLoader: () => import('../pages/headcounts/index.js'),
    children: [
      {
        name: 'oa-headcounts-new',
        path: 'new',
        authz: policy('manage'),
        componentLoader: () => import('../pages/headcounts/form.js'),
      },
      {
        name: 'oa-headcounts-detail',
        path: ':accountId',
        componentLoader: () => import('../pages/headcounts/detail.js'),
        children: [
          ...recruitmentViewChildren('headcounts-source').filter(
            (r) => r.path === 'recruitment/:requestId',
          ),
          ...transferViewChildren('headcounts-source').filter(
            (r) => r.path === 'transfer/:requestId',
          ),
          {
            name: 'oa-headcounts-adjust',
            path: 'adjust',
            authz: policy('manage'),
            componentLoader: () => import('../pages/headcounts/form.js'),
          },
          {
            name: 'oa-headcounts-reconcile',
            path: 'reconcile',
            authz: policy('manage'),
            componentLoader: () => import('../pages/headcounts/form.js'),
          },
        ],
      },
    ],
  },
]);

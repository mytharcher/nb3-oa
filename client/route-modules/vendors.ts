import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Store } from 'lucide-react';
const manage = {
  resource: { type: 'composite' as const, id: 'oa.vendors' },
  action: 'manage',
};
export default defineAppRoutes([
  {
    name: 'oa-vendors',
    parent: 'oa-procurement',
    path: '/vendors',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.vendors' },
      action: 'view',
    },
    navigation: { title: 'vendors.title', icon: Store, order: 10 },
    componentLoader: () => import('../pages/vendors/index.js'),
    children: [
      {
        name: 'oa-vendor-new',
        path: 'new',
        authz: manage,
        componentLoader: () => import('../pages/vendors/form-dialog.js'),
      },
      {
        name: 'oa-vendor-edit',
        path: 'edit/:vendorId',
        authz: manage,
        componentLoader: () => import('../pages/vendors/form-dialog.js'),
      },
      {
        name: 'oa-vendor-detail',
        path: ':vendorId',
        componentLoader: () => import('../pages/vendors/detail.js'),
        children: [
          {
            name: 'oa-vendor-detail-edit',
            path: 'edit',
            authz: manage,
            componentLoader: () => import('../pages/vendors/form-dialog.js'),
          },
        ],
      },
    ],
  },
]);

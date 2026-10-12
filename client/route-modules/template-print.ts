import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { FileText } from 'lucide-react';
const manage = {
  resource: { type: 'composite' as const, id: 'oa.templatePrint' },
  action: 'manage',
};
export default defineAppRoutes([
  {
    name: 'oa-template-print',
    parent: 'oa-configuration',
    path: '/print-templates',
    auth: 'required',
    authz: manage,
    navigation: { title: 'templatePrintUI.title', icon: FileText, order: 110 },
    componentLoader: () => import('../pages/template-print/index.js'),
    children: [
      {
        name: 'oa-template-print-new',
        path: 'new',
        componentLoader: () => import('../pages/template-print/form-dialog.js'),
      },
      {
        name: 'oa-template-print-edit',
        path: 'edit/:templateId',
        componentLoader: () => import('../pages/template-print/form-dialog.js'),
      },
      {
        name: 'oa-template-print-upload',
        path: 'upload/:templateId',
        componentLoader: () =>
          import('../pages/template-print/upload-dialog.js'),
      },
      {
        name: 'oa-template-print-detail',
        path: ':templateId',
        componentLoader: () => import('../pages/template-print/detail.js'),
        children: [
          {
            name: 'oa-template-print-detail-edit',
            path: 'edit',
            componentLoader: () =>
              import('../pages/template-print/form-dialog.js'),
          },
          {
            name: 'oa-template-print-detail-upload',
            path: 'upload',
            componentLoader: () =>
              import('../pages/template-print/upload-dialog.js'),
          },
        ],
      },
    ],
  },
]);

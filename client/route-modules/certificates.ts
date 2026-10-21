import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { FileBadge } from 'lucide-react';
const permission = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.certificateRequests' },
  action,
});
const actions = {
  name: 'oa-certificates-action',
  path: 'actions/:action',
  authz: permission('operate'),
  componentLoader: () => import('../pages/certificates/action.js'),
};
function detailChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-edit`,
      path: 'edit',
      authz: permission('edit'),
      componentLoader: () => import('../pages/certificates/form.js'),
    },
    {
      name: `${owner}-action`,
      path: 'actions/:action',
      authz: permission('operate'),
      componentLoader: () => import('../pages/certificates/action.js'),
    },
    {
      name: `${owner}-issue`,
      path: 'issue',
      authz: permission('issue'),
      componentLoader: () => import('../pages/certificates/issue.js'),
    },
  ];
}
export function certificateViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-certificate-new`,
      path: 'newCertificate',
      auth: 'required',
      authz: permission('create'),
      componentLoader: () => import('../pages/certificates/form.js'),
    },
    {
      name: `${owner}-certificate-edit`,
      path: 'editCertificate/:certificateId',
      auth: 'required',
      authz: permission('edit'),
      componentLoader: () => import('../pages/certificates/form.js'),
    },
    {
      name: `${owner}-certificate-detail`,
      path: 'certificate/:certificateId',
      auth: 'required',
      authz: permission('view'),
      componentLoader: () => import('../pages/certificates/detail.js'),
      children: detailChildren(`${owner}-certificate-detail`),
    },
  ];
}
export default defineAppRoutes([
  {
    name: 'oa-certificates',
    parent: 'oa-hr',
    path: '/certificates',
    auth: 'required',
    authz: permission('view'),
    navigation: { title: 'certificates.title', icon: FileBadge, order: 130 },
    componentLoader: () => import('../pages/certificates/index.js'),
    children: [
      {
        name: 'oa-certificates-new',
        path: 'new',
        authz: permission('create'),
        componentLoader: () => import('../pages/certificates/form.js'),
      },
      {
        name: 'oa-certificates-detail',
        path: ':certificateId',
        authz: permission('view'),
        componentLoader: () => import('../pages/certificates/detail.js'),
        children: [
          {
            name: 'oa-certificates-edit',
            path: 'edit',
            authz: permission('edit'),
            componentLoader: () => import('../pages/certificates/form.js'),
          },
          actions,
          {
            name: 'oa-certificates-issue',
            path: 'issue',
            authz: permission('issue'),
            componentLoader: () => import('../pages/certificates/issue.js'),
          },
        ],
      },
    ],
  },
]);

import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { UsersRound, ClipboardList } from 'lucide-react';
const policy = (action: string, id = 'oa.recruitment') => ({
  resource: { type: 'composite' as const, id },
  action,
});
export default defineAppRoutes([
  {
    name: 'oa-recruitment-requests',
    parent: 'oa-hr',
    path: '/recruitment-requests',
    auth: 'required',
    authz: policy('view'),
    navigation: { title: 'recruitment.title', icon: UsersRound, order: 60 },
    componentLoader: () => import('../pages/recruitment/index.js'),
    children: [
      {
        name: 'oa-recruitment-new',
        path: 'new',
        authz: policy('submit'),
        componentLoader: () => import('../pages/recruitment/form.js'),
      },
      {
        name: 'oa-recruitment-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/recruitment/detail.js'),
        children: [
          {
            name: 'oa-recruitment-edit',
            path: 'edit',
            authz: policy('submit'),
            componentLoader: () => import('../pages/recruitment/form.js'),
          },
          {
            name: 'oa-recruitment-review-edit',
            path: 'review-edit',
            authz: policy('reviewEdit'),
            componentLoader: () => import('../pages/recruitment/form.js'),
          },
          {
            name: 'oa-recruitment-transition',
            path: 'action/:operation',
            authz: policy('submit'),
            componentLoader: () => import('../pages/recruitment/action.js'),
          },
          {
            name: 'oa-recruitment-action',
            path: 'action/:operation/:targetId',
            authz: policy('operate'),
            componentLoader: () => import('../pages/recruitment/action.js'),
          },
        ],
      },
    ],
  },
  {
    name: 'oa-requisitions',
    parent: 'oa-hr',
    path: '/requisitions',
    auth: 'required',
    authz: policy('view', 'oa.requisitions'),
    navigation: {
      title: 'recruitment.requisitions',
      icon: ClipboardList,
      order: 61,
    },
    componentLoader: () => import('../pages/recruitment/requisitions.js'),
    children: [
      {
        name: 'oa-requisition-detail',
        path: ':requisitionId',
        componentLoader: () =>
          import('../pages/recruitment/requisition-detail.js'),
        children: [
          {
            name: 'oa-requisition-close',
            path: 'close',
            authz: policy('close', 'oa.requisitions'),
            componentLoader: () =>
              import('../pages/recruitment/requisition-close.js'),
          },
        ],
      },
    ],
  },
]);

export function recruitmentViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-recruitment-new`,
      path: 'newRecruitment',
      authz: policy('submit'),
      componentLoader: () => import('../pages/recruitment/form.js'),
    },
    {
      name: `${owner}-recruitment-edit`,
      path: 'editRecruitment/:requestId',
      authz: policy('submit'),
      componentLoader: () => import('../pages/recruitment/form.js'),
    },
    {
      name: `${owner}-recruitment-detail`,
      path: 'recruitment/:requestId',
      authz: policy('view'),
      componentLoader: () => import('../pages/recruitment/detail.js'),
      children: [
        {
          name: `${owner}-recruitment-detail-edit`,
          path: 'edit',
          authz: policy('submit'),
          componentLoader: () => import('../pages/recruitment/form.js'),
        },
        {
          name: `${owner}-recruitment-detail-review-edit`,
          path: 'review-edit',
          authz: policy('reviewEdit'),
          componentLoader: () => import('../pages/recruitment/form.js'),
        },
        {
          name: `${owner}-recruitment-detail-transition`,
          path: 'action/:operation',
          authz: policy('submit'),
          componentLoader: () => import('../pages/recruitment/action.js'),
        },
        {
          name: `${owner}-recruitment-detail-action`,
          path: 'action/:operation/:targetId',
          authz: policy('operate'),
          componentLoader: () => import('../pages/recruitment/action.js'),
        },
      ],
    },
  ];
}

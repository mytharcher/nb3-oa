import type {
  AppClientRouteDefinition,
  AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ArrowRightLeft } from 'lucide-react';
const policy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.transfer' },
  action,
});
const transferRoutes: AppClientRouteDefinition[] = [
  {
    name: 'oa-transfer',
    parent: 'oa-organization',
    path: '/personnel-changes',
    auth: 'required',
    authz: policy('view'),
    navigation: { title: 'transfer.title', icon: ArrowRightLeft, order: 90 },
    componentLoader: () => import('../pages/transfer/index.js'),
    children: [
      {
        name: 'oa-transfer-new',
        path: 'new',
        authz: policy('submit'),
        componentLoader: () => import('../pages/transfer/form.js'),
      },
      {
        name: 'oa-transfer-edit',
        path: 'edit/:requestId',
        authz: policy('submit'),
        componentLoader: () => import('../pages/transfer/form.js'),
      },
      {
        name: 'oa-transfer-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/transfer/detail.js'),
        children: [
          {
            name: 'oa-transfer-detail-edit',
            path: 'edit',
            authz: policy('submit'),
            componentLoader: () => import('../pages/transfer/form.js'),
          },
          {
            name: 'oa-transfer-review-edit',
            path: 'reviewEdit',
            authz: policy('reviewEdit'),
            componentLoader: () => import('../pages/transfer/form.js'),
          },
          {
            name: 'oa-transfer-task-action',
            path: 'action/:operation/:taskId',
            componentLoader: () => import('../pages/transfer/action.js'),
          },
          {
            name: 'oa-transfer-action',
            path: 'action/:operation',
            componentLoader: () => import('../pages/transfer/action.js'),
          },
        ],
      },
    ],
  },
];

/** Each center child preserves the transfer owner policy independently of its host. */
export function transferViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  const standalone = transferRoutes[0].children!;
  return standalone
    .filter(
      (route): route is AppClientRoutePageDefinition => !!route.componentLoader,
    )
    .map((route, index) => ({
      ...route,
      name: `${owner}-${route.name}`,
      path: ['newTransfer', 'editTransfer/:requestId', 'transfer/:requestId'][
        index
      ],
      auth: 'required',
      authz: policy(index < 2 ? 'submit' : 'view'),
      children: route.children
        ?.filter(
          (child): child is AppClientRoutePageDefinition =>
            !!child.componentLoader,
        )
        .map((child) => ({
          ...child,
          name: `${owner}-${child.name}`,
          auth: 'required',
          authz: policy(
            child.path === 'edit'
              ? 'submit'
              : child.path === 'reviewEdit'
                ? 'reviewEdit'
                : 'operate',
          ),
        })),
    }));
}

export default defineAppRoutes(transferRoutes);

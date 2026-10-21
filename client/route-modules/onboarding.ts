import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { UserRoundPlus } from 'lucide-react';
const resource = { type: 'composite', id: 'oa.onboarding' } as const;
export default defineAppRoutes([
  {
    name: 'onboardings',
    parent: 'oa-hr',
    path: '/onboardings',
    auth: 'required',
    authz: { resource, action: 'view' },
    navigation: { title: 'onboarding.title', icon: UserRoundPlus, order: 70 },
    breadcrumb: { title: 'onboarding.title' },
    componentLoader: () => import('../pages/onboarding/index.js'),
    children: [
      {
        name: 'onboardings-new',
        path: 'new',
        authz: { resource, action: 'create' },
        componentLoader: () => import('../pages/onboarding/form.js'),
      },
      {
        name: 'onboardings-detail',
        path: ':onboardingId',
        componentLoader: () => import('../pages/onboarding/detail.js'),
        children: [
          {
            name: 'onboardings-cancel',
            path: 'cancel',
            authz: { resource, action: 'cancel' },
            componentLoader: () => import('../pages/onboarding/action.js'),
          },
          {
            name: 'onboardings-task',
            path: 'tasks/:taskId/:action',
            authz: { resource, action: 'view' },
            componentLoader: () => import('../pages/onboarding/action.js'),
          },
        ],
      },
    ],
  },
]);

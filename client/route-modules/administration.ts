import {
  defineAppRoutes,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
import { UsersRound, KeyRound, FileClock, CalendarClock } from 'lucide-react';

// The template stopped registering administration UI in plugins. These pages now belong to the OA application;
// Legacy deep links remain authorized; daily configuration lives in the OA access module.
// stored permission resource ids are retained, while their URLs live directly in the application route tree.
const routes: AppClientRouteDefinition[] = [
  {
    name: 'users',
    parent: 'oa-system',
    path: '/users',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'users' }, action: 'access' },
    navigation: {
      title: 'oa.navigation.users',
      icon: UsersRound,
      order: 10,
    },
    componentLoader: () =>
      import('../pages/administration/users/pages/users-page.js'),
  },
  {
    name: 'permission-sets',
    parent: 'oa-system',
    path: '/permission-sets',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'authorization.permission-sets' },
      action: 'read',
    },
    componentLoader: () =>
      import('../pages/administration/authorization/pages/permission-sets-page.js'),
    children: [
      {
        name: 'permission-set-new',
        path: 'new',
        componentLoader: () =>
          import('../pages/administration/authorization/pages/permission-set-new-page.js'),
      },
      {
        name: 'permission-set-edit',
        path: 'edit/:permissionSetKey',
        componentLoader: () =>
          import('../pages/administration/authorization/pages/permission-set-edit-page.js'),
        children: [
          {
            name: 'permission-set-assignments',
            path: 'assignments',
            componentLoader: () =>
              import('../pages/administration/authorization/pages/permission-set-assignments-page.js'),
          },
          {
            name: 'permission-set-details',
            path: 'details',
            componentLoader: () =>
              import('../pages/administration/authorization/pages/permission-set-details-page.js'),
          },
        ],
      },
    ],
  },
  {
    name: 'default-access',
    parent: 'oa-system',
    path: '/default-access',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'authorization.default-access' },
      action: 'read',
    },
    componentLoader: () =>
      import('../pages/administration/authz-default-access/pages/default-access-page.js'),
  },
  {
    name: 'sharing-rules',
    parent: 'oa-system',
    path: '/sharing-rules',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'authorization.sharing-rules' },
      action: 'read',
    },
    componentLoader: () =>
      import('../pages/administration/authz-sharing-rules/pages/sharing-rules-page.js'),
  },
  {
    name: 'restriction-rules',
    parent: 'oa-system',
    path: '/restriction-rules',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'authorization.restriction-rules' },
      action: 'read',
    },
    componentLoader: () =>
      import('../pages/administration/authz-restriction-rules/pages/restriction-rules-page.js'),
  },
  {
    name: 'inspector',
    parent: 'oa-system',
    path: '/inspector',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'authorization.inspector' },
      action: 'inspect',
    },
    componentLoader: () =>
      import('../pages/administration/authorization/pages/inspector-page.js'),
  },
  {
    name: 'api-keys',
    parent: 'oa-system',
    path: '/api-keys',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'api-keys' }, action: 'access' },
    navigation: {
      title: 'oa.navigation.apiKeys',
      icon: KeyRound,
      order: 90,
    },
    componentLoader: () =>
      import('../pages/administration/api-keys/pages/api-keys-page.js'),
  },
  {
    name: 'notification-logs',
    parent: 'oa-system',
    path: '/notification-logs',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'notification.logs' },
      action: 'access',
    },
    navigation: {
      title: 'oa.navigation.notificationLogs',
      icon: FileClock,
      order: 70,
    },
    componentLoader: () =>
      import('../pages/administration/notification/pages/notification-logs-page.js'),
  },
  {
    name: 'schedules',
    parent: 'oa-system',
    path: '/schedules',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'scheduler.schedules' },
      action: 'read',
    },
    navigation: {
      title: 'oa.navigation.schedules',
      icon: CalendarClock,
      order: 10,
    },
    componentLoader: () =>
      import('../pages/administration/scheduler/pages/schedules-page.js'),
    children: [
      {
        name: 'schedule-detail',
        path: ':scheduleId',
        auth: 'required',
        authz: {
          resource: { type: 'settings', id: 'scheduler.schedules' },
          action: 'read',
        },
        componentLoader: () =>
          import('../pages/administration/scheduler/pages/schedule-detail-page.js'),
      },
    ],
  },
];
export default defineAppRoutes(routes);

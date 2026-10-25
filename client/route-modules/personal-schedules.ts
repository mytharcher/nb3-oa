import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { CalendarDays } from 'lucide-react';
const policy = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.personalSchedules' },
  action,
});
export default defineAppRoutes([
  {
    name: 'team-calendar',
    parent: 'oa-personal',
    path: '/team-calendar',
    auth: 'required',
    authz: policy('view'),
    navigation: {
      title: 'personalSchedules.team.title',
      icon: CalendarDays,
      order: 41,
    },
    componentLoader: () => import('../pages/personal-schedules/team.js'),
  },
  {
    name: 'personal-schedules',
    parent: 'oa-personal',
    path: '/personal-schedules',
    auth: 'required',
    authz: policy('view'),
    navigation: {
      title: 'personalSchedules.title',
      icon: CalendarDays,
      order: 40,
    },
    componentLoader: () => import('../pages/personal-schedules/index.js'),
    children: [
      {
        name: 'personal-schedules-new',
        path: 'new',
        authz: policy('create'),
        componentLoader: () => import('../pages/personal-schedules/form.js'),
      },
      {
        name: 'personal-schedules-detail',
        path: ':scheduleId',
        componentLoader: () => import('../pages/personal-schedules/detail.js'),
        children: [
          {
            name: 'personal-schedules-edit',
            path: 'edit',
            authz: policy('edit'),
            componentLoader: () =>
              import('../pages/personal-schedules/form.js'),
          },
        ],
      },
    ],
  },
]);

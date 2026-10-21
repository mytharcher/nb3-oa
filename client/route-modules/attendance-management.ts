import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { CalendarClock } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'attendance-management',
    parent: 'oa-hr',
    path: '/attendance-management',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'attendance-management' },
      action: 'access',
    },
    navigation: {
      title: 'attendanceManagement.title',
      icon: CalendarClock,
      order: 140,
    },
    breadcrumb: { title: 'attendanceManagement.title' },
    componentLoader: () => import('../pages/attendance-management/index.js'),
    children: [
      {
        name: 'attendance-management-new',
        path: 'new',
        componentLoader: () =>
          import('../pages/attendance-management/shift-form.js'),
      },
      {
        name: 'attendance-management-edit',
        path: ':shiftId/edit',
        componentLoader: () =>
          import('../pages/attendance-management/shift-form.js'),
      },
      {
        name: 'attendance-management-shift-revision',
        path: ':shiftId/revisions/:revision',
        componentLoader: () =>
          import('../pages/attendance-management/history.js'),
      },
      {
        name: 'attendance-management-schedule-edit',
        path: 'schedule/edit',
        componentLoader: () =>
          import('../pages/attendance-management/schedule-form.js'),
      },
      {
        name: 'attendance-management-schedule-revision',
        path: 'schedule/revisions/:revision',
        componentLoader: () =>
          import('../pages/attendance-management/history.js'),
      },
    ],
  },
]);

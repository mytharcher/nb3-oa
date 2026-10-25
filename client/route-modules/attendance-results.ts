import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { CalendarCheck } from 'lucide-react';
import { attendanceChangeViewChildren } from './attendance-change.js';
export default defineAppRoutes([
  {
    name: 'attendance-results',
    parent: 'oa-personal',
    path: '/attendance-results',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.attendanceResults' },
      action: 'view',
    },
    navigation: {
      title: 'attendanceResults.title',
      icon: CalendarCheck,
      order: 35,
    },
    componentLoader: () => import('../pages/attendance-results/index.js'),
    children: attendanceChangeViewChildren('attendance-results'),
  },
]);

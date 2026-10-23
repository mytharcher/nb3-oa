import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { viewChildren } from './approvals.js';

/**
 * Prototype workbench organised by task source. Reached by URL only, beside the current `/`
 * workbench; it shares the task center's page grant because it reads the same personal index.
 */
export default defineAppRoutes([
  {
    name: 'oa-workbench-prototype',
    path: '/workbenchPrototype',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa.approvals' },
      action: 'access',
    },
    componentLoader: () => import('../pages/workbench-prototype/index.js'),
    children: [
      ...viewChildren('oa-workbench-prototype'),
      {
        name: 'oa-workbench-prototype-new-work-item',
        path: 'newWorkItem',
        authz: {
          resource: { type: 'composite', id: 'oa.workItems' },
          action: 'create',
        },
        componentLoader: () => import('../pages/work-items/form.js'),
      },
      {
        name: 'oa-workbench-prototype-meeting-booking',
        path: 'booking/:bookingId',
        authz: {
          resource: { type: 'composite', id: 'oa.meetingBookings' },
          action: 'view',
        },
        componentLoader: () =>
          import('../pages/meeting-rooms/booking-detail.js'),
        children: [
          {
            name: 'oa-workbench-prototype-meeting-booking-edit',
            path: 'edit',
            authz: {
              resource: { type: 'composite', id: 'oa.meetingBookings' },
              action: 'edit',
            },
            componentLoader: () =>
              import('../pages/meeting-rooms/booking-form.js'),
          },
          {
            name: 'oa-workbench-prototype-meeting-booking-action',
            path: 'action/:action',
            authz: {
              resource: { type: 'composite', id: 'oa.meetingBookings' },
              action: 'view',
            },
            componentLoader: () =>
              import('../pages/meeting-rooms/booking-action.js'),
          },
        ],
      },
    ],
  },
]);

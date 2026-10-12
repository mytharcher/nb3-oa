import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { DoorOpen } from 'lucide-react';
const booking = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.meetingBookings' },
  action,
});
const manage = {
  resource: { type: 'composite' as const, id: 'oa.meetingRooms' },
  action: 'manage',
};
export default defineAppRoutes([
  {
    name: 'oa-meeting-rooms',
    parent: 'oa-administration',
    path: '/meeting-rooms',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.meetingRooms' },
      action: 'view',
    },
    navigation: { title: 'meetingRooms.title', icon: DoorOpen, order: 30 },
    componentLoader: () => import('../pages/meeting-rooms/index.js'),
    children: [
      {
        name: 'oa-meeting-room-new',
        path: 'new-room',
        authz: manage,
        componentLoader: () => import('../pages/meeting-rooms/room-form.js'),
      },
      {
        name: 'oa-meeting-room-edit',
        path: 'edit-room/:roomId',
        authz: manage,
        componentLoader: () => import('../pages/meeting-rooms/room-form.js'),
      },
      {
        name: 'oa-meeting-room-detail',
        path: 'room/:roomId',
        componentLoader: () => import('../pages/meeting-rooms/room-detail.js'),
        children: [
          {
            name: 'oa-meeting-room-reserve',
            path: 'reserve',
            authz: booking('create'),
            componentLoader: () =>
              import('../pages/meeting-rooms/booking-form.js'),
          },
          {
            name: 'oa-meeting-room-detail-edit',
            path: 'edit',
            authz: manage,
            componentLoader: () =>
              import('../pages/meeting-rooms/room-form.js'),
          },
        ],
      },
      {
        name: 'oa-meeting-booking-new',
        path: 'reserve',
        authz: booking('create'),
        componentLoader: () => import('../pages/meeting-rooms/booking-form.js'),
      },
      {
        name: 'oa-meeting-booking-detail',
        path: 'booking/:bookingId',
        authz: booking('view'),
        componentLoader: () =>
          import('../pages/meeting-rooms/booking-detail.js'),
        children: [
          {
            name: 'oa-meeting-booking-edit',
            path: 'edit',
            authz: booking('edit'),
            componentLoader: () =>
              import('../pages/meeting-rooms/booking-form.js'),
          },
          {
            name: 'oa-meeting-booking-action',
            path: 'action/:action',
            authz: booking('view'),
            componentLoader: () =>
              import('../pages/meeting-rooms/booking-action.js'),
          },
        ],
      },
    ],
  },
]);

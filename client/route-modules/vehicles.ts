import {
  type AppClientRouteDefinition,
  defineAppRoutes,
} from '@nocobase/app-client/plugins';
import { CarFront, Truck } from 'lucide-react';
const request = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.vehicleRequests' },
  action,
});
const garage = (action: string) => ({
  resource: { type: 'composite' as const, id: 'oa.vehicleGarage' },
  action,
});
export default defineAppRoutes([
  {
    name: 'oa-vehicle-requests',
    parent: 'oa-administration',
    path: '/vehicle-requests',
    auth: 'required',
    authz: request('view'),
    navigation: { title: 'vehicles.title', icon: CarFront, order: 40 },
    componentLoader: () => import('../pages/vehicles/index.js'),
    children: [
      {
        name: 'oa-vehicle-request-new',
        path: 'new',
        authz: request('submit'),
        componentLoader: () => import('../pages/vehicles/form.js'),
      },
      {
        name: 'oa-vehicle-request-detail',
        path: ':requestId',
        componentLoader: () => import('../pages/vehicles/detail.js'),
        children: [
          {
            name: 'oa-vehicle-request-edit',
            path: 'edit',
            authz: request('submit'),
            componentLoader: () => import('../pages/vehicles/form.js'),
          },
          {
            name: 'oa-vehicle-request-action',
            path: 'action/:operation',
            componentLoader: () => import('../pages/vehicles/action.js'),
          },
          {
            name: 'oa-vehicle-request-task-action',
            path: 'action/:operation/:taskId',
            componentLoader: () => import('../pages/vehicles/action.js'),
          },
        ],
      },
    ],
  },
  {
    name: 'oa-vehicle-garage',
    parent: 'oa-administration',
    path: '/vehicle-garage',
    auth: 'required',
    authz: garage('view'),
    navigation: { title: 'vehicles.garage', icon: Truck, order: 41 },
    componentLoader: () => import('../pages/vehicles/garage.js'),
    children: [
      {
        name: 'oa-vehicle-new',
        path: 'new',
        authz: garage('manage'),
        componentLoader: () => import('../pages/vehicles/garage-form.js'),
      },
      {
        name: 'oa-vehicle-edit',
        path: ':vehicleId/edit',
        authz: garage('manage'),
        componentLoader: () => import('../pages/vehicles/garage-form.js'),
      },
      {
        name: 'oa-vehicle-driver-new',
        path: 'drivers/new',
        authz: garage('manage'),
        componentLoader: () => import('../pages/vehicles/driver-form.js'),
      },
      {
        name: 'oa-vehicle-driver-edit',
        path: 'drivers/:driverId/edit',
        authz: garage('manage'),
        componentLoader: () => import('../pages/vehicles/driver-form.js'),
      },
    ],
  },
]);

/** Share the authorized owner pages with the workbench and task center. */
export function vehicleViewChildren(owner: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-vehicle-new`,
      path: 'newVehicleRequest',
      authz: request('submit'),
      componentLoader: () => import('../pages/vehicles/form.js'),
    },
    {
      name: `${owner}-vehicle-edit`,
      path: 'editVehicleRequest/:requestId',
      authz: request('submit'),
      componentLoader: () => import('../pages/vehicles/form.js'),
    },
    {
      name: `${owner}-vehicle-detail`,
      path: 'vehicle/:requestId',
      authz: request('view'),
      componentLoader: () => import('../pages/vehicles/detail.js'),
      children: [
        {
          name: `${owner}-vehicle-detail-edit`,
          path: 'edit',
          authz: request('submit'),
          componentLoader: () => import('../pages/vehicles/form.js'),
        },
        {
          name: `${owner}-vehicle-transition`,
          path: 'action/:operation',
          componentLoader: () => import('../pages/vehicles/action.js'),
        },
        {
          name: `${owner}-vehicle-task-action`,
          path: 'action/:operation/:taskId',
          componentLoader: () => import('../pages/vehicles/action.js'),
        },
      ],
    },
  ];
}

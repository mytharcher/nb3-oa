import type { Application } from '@nocobase/app-server/application';
import {
  defineApiRoutes,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { createGradeRoutes, createPositionRoutes } from './catalog.js';
import { createDepartmentRoutes } from './departments.js';
import { createDutyRoleRoutes } from './duty-roles.js';

/**
 * The organisation API: `/api/departments`, `/api/positions`, `/api/grades` and `/api/dutyRoles`. Each resource is an
 * isolated sub-router that authenticates, initialises authorization and checks its own settings item on every route;
 * the `options` pickers are the exception, open to every signed-in user (see their descriptions).
 */
export const orgApiRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    router.route('/departments', createDepartmentRoutes(app));
    router.route('/positions', createPositionRoutes(app));
    router.route('/grades', createGradeRoutes(app));
    router.route('/dutyRoles', createDutyRoleRoutes(app));
    return router;
  });

/** HTTP routes of the `org` OA module, registered through `server/routes/index.ts`. */
const orgRoutes: readonly AppRouteContribution<Application>[] = [orgApiRoutes];

export default orgRoutes;

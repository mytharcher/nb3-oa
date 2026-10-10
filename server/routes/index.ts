import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import employeesRoutes from './employees/index.js';
import approvalDelegationsRoutes from './approval-delegations/index.js';
import leaveRoutes from './leave/index.js';
import importRoutes from './import/index.js';
import orgRoutes from './org/index.js';
import platformRoutes from './platform/index.js';

// Each OA module owns `server/routes/<module>/` and exports its contributions from its `index.ts`.
const routes: readonly AppRouteContribution<Application>[] = [
  ...platformRoutes,
  ...orgRoutes,
  ...employeesRoutes,
  ...approvalDelegationsRoutes,
  ...leaveRoutes,
  ...importRoutes,
];

export default routes;

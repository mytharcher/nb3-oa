import { Building2, Home, ScrollText, SlidersHorizontal } from 'lucide-react';
import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

import approvalsRoutes from './route-modules/approvals.js';
import employeesRoutes from './route-modules/employees.js';
import importRoutes from './route-modules/import.js';
import orgRoutes from './route-modules/org.js';
import platformRoutes from './route-modules/platform.js';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/home.js'),
    name: 'home',
    navigation: { title: 'navigation.home', icon: Home },
    path: '/',
  },
  {
    // The header's inbox button is where a user looks for messages, so this page is reached from there. Declaring no
    // navigation keeps a second menu entry from pointing at the one destination the button already owns. The plugin's
    // API answers each person's own messages only, so the page needs no authorization of its own.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/inbox.js'),
    name: 'inbox',
    path: '/inbox',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/login.js'),
    name: 'login',
    path: '/login',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/register.js'),
    name: 'register',
    path: '/register',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/forgot-password.js'),
    name: 'forgot-password',
    path: '/forgot-password',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/reset-password.js'),
    name: 'reset-password',
    path: '/reset-password',
  },
  {
    // Where a command line's sign-in sends the person to approve it (`pages/auth/device.tsx`). Optional rather than
    // required so it renders outside the shell, like the sign-in pages; the page sends a guest to sign in and back.
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/device.js'),
    name: 'device',
    path: '/device',
  },
]);

// The OA settings groups. Each module appends its pages from `client/route-modules/<module>.ts` with
// `parent: '<group name>'`, so modules developed side by side never edit the same list.
const settingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    name: 'oa-organization',
    navigation: { title: 'oa.navigation.organization', icon: Building2 },
    children: [],
  },
  {
    name: 'oa-configuration',
    navigation: {
      title: 'oa.navigation.configuration',
      icon: SlidersHorizontal,
    },
    children: [],
  },
  {
    name: 'oa-system',
    navigation: { title: 'oa.navigation.system', icon: ScrollText },
    children: [],
  },
]);

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  settingsRoutes,
  ...orgRoutes,
  ...employeesRoutes,
  ...platformRoutes,
  ...importRoutes,
  ...approvalsRoutes,
];

export default routes;

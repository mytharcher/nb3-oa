import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ListOrdered } from 'lucide-react';
export default defineAppRoutes([
  {
    name: 'oa-salary-grades',
    parent: 'oa-configuration',
    path: '/salaryGradeTables',
    auth: 'required',
    authz: {
      resource: { type: 'page', id: 'oa-salary-grades' },
      action: 'access',
    },
    navigation: { title: 'jobGrades.title', icon: ListOrdered, order: 85 },
    breadcrumb: { title: 'jobGrades.title' },
    componentLoader: () => import('../pages/job-grades/index.js'),
    children: [
      {
        name: 'oa-salary-grades-publish',
        path: 'publish',
        breadcrumb: { title: 'jobGrades.publish' },
        componentLoader: () => import('../pages/job-grades/publish.js'),
      },
      {
        name: 'oa-salary-grades-revision',
        path: ':revisionId',
        componentLoader: () => import('../pages/job-grades/detail.js'),
      },
    ],
  },
]);

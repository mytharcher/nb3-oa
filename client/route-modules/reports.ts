import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { ChartNoAxesCombined } from 'lucide-react';
import { createElement } from 'react';
import type { ReportDataset } from '../pages/reports/datasets.js';

const reports = [
  ['budget-balances', 'reports.datasets.budget-balances.title'],
  ['contract-ledger', 'reports.datasets.contract-ledger.title'],
  ['headcount-balances', 'reports.datasets.headcount-balances.title'],
  ['leave-monthly', 'reports.datasets.leave-monthly.title'],
  ['leave-approval-efficiency', 'reportsEfficiency.title'],
  ['expense-summary', 'reportsExpense.title'],
  ['supply-ledger', 'reports.datasets.supply-ledger.title'],
  ['seal-ledger', 'reports.datasets.seal-ledger.title'],
] as const satisfies readonly (readonly [ReportDataset, string])[];

export default defineAppRoutes([
  {
    name: 'oa-reports',
    navigation: {
      title: 'reports.title',
      icon: ChartNoAxesCombined,
      order: 90,
    },
    children: reports.map(([dataset, title], order) => ({
      name: `oa-report-${dataset}`,
      path: `/reports/${dataset}`,
      auth: 'required',
      // Dataset availability and source fields are checked by the page and API.
      authz: 'skip',
      navigation: { title, order },
      componentLoader: async () => {
        const { default: ReportsPage } =
          await import('../pages/reports/index.js');
        return { default: () => createElement(ReportsPage, { dataset }) };
      },
    })),
  },
  {
    name: 'oa-reports-index',
    path: '/reports',
    auth: 'required',
    authz: 'skip',
    componentLoader: () => import('../pages/reports/index.js'),
  },
]);

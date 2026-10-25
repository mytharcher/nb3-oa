import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US';
import { RecordDetailDrawer } from '../../../client/components/record-detail-drawer';
import { DepartureRecordTitle } from '../../../client/pages/departure-requests/record-title';
import { StatusBadge } from '../../../client/components/status-badge';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const params = new URLSearchParams(location.search);
const english = params.get('language') === 'en';
const plain = params.has('plain');
const person = english ? 'Alexandra Montgomery' : '测试员工';
const number = 'LZ-20261025-000001';
const router = createMemoryRouter([
  {
    path: '/',
    element: (
      <RecordDetailDrawer
        title={
          plain ? (
            `${person} · ${number}`
          ) : (
            <DepartureRecordTitle name={person} number={number} />
          )
        }
        headerStatus={
          <StatusBadge tone='neutral'>
            {english ? 'Pending approval' : '审批中'}
          </StatusBadge>
        }
        description={english ? 'Departure and handover' : '离职与交接'}
      >
        <p>Isolated title layout fixture</p>
      </RecordDetailDrawer>
    ),
  },
]);
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <RouterProvider router={router} />
  </TestI18nProvider>,
);

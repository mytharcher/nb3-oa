import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { RecordDetailDrawer } from '../../../../client/components/record-detail-drawer';
import { StatusBadge } from '../../../../client/components/status-badge';
import { ApprovalProgress } from '../../../../client/components/approval-progress';
import { ApprovalUiProvider } from '../../../../client/extensions/nocobase-approval-ui';
import enUS from '../../../../client/locales/en-US';
import zhCN from '../../../../client/locales/zh-CN';
import '../../../../client/styles.css';
const spec = new URLSearchParams(location.search);
document.documentElement.dataset.theme = spec.get('theme') || 'default';
document.documentElement.classList.toggle('dark', spec.get('mode') === 'dark');
const en = spec.get('locale') === 'en';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: en ? enUS : zhCN },
});
const router = createMemoryRouter([
  {
    path: '/',
    element: (
      <RecordDetailDrawer
        title='OVERTIME-202610-0001'
        description={en ? 'Application details' : '申请内容'}
        headerStatus={
          <StatusBadge tone='success'>{en ? 'Approved' : '已批准'}</StatusBadge>
        }
      >
        <dl className='grid gap-4 sm:grid-cols-[8rem_1fr]'>
          <dt className='text-muted-foreground'>
            {en ? 'Applicant' : '申请人'}
          </dt>
          <dd>{en ? 'Sample user' : '示例用户'}</dd>
        </dl>
        <h2 className='my-4 font-medium'>
          {en ? 'Approval progress' : '审批进度'}
        </h2>
        <ApprovalUiProvider personName={(id) => id}>
          <ApprovalProgress
            steps={(
              [
                'done',
                'current',
                'rejected',
                'returned',
                'ended',
                'upcoming',
                'skipped',
              ] as const
            ).map((state) => ({ key: state, title: state, state, tasks: [] }))}
          />
        </ApprovalUiProvider>
      </RecordDetailDrawer>
    ),
  },
]);
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <RouterProvider router={router} />
  </TestI18nProvider>,
);

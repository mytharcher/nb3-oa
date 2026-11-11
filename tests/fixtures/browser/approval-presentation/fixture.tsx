import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { RecordDetailDrawer } from '../../../../client/components/record-detail-drawer';
import { StatusBadge } from '../../../../client/components/status-badge';
import { ApprovalDetailSection } from '../../../../client/components/approval-detail-section';
import { ApprovalProgress } from '../../../../client/components/approval-progress';
import {
  ApprovalTimeline,
  ApprovalUiProvider,
} from '../../../../client/extensions/nocobase-approval-ui';
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
        <ApprovalUiProvider personName={(id) => id}>
          <div className='flex flex-col gap-4'>
            <ApprovalDetailSection
              title={en ? 'Approval progress' : '审批进度'}
            >
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
                ).map((state) => ({
                  key: state,
                  title: state,
                  state,
                  tasks: [],
                }))}
              />
            </ApprovalDetailSection>
            <ApprovalDetailSection title={en ? 'History' : '审批记录'}>
              <ApprovalTimeline
                lines={[
                  {
                    key: 'submitted',
                    kind: 'action',
                    actorId: en ? 'Applicant' : '申请人',
                    at: '2026-10-31T01:00:00Z',
                    title: en ? 'Submitted' : '已提交',
                  },
                  {
                    key: 'approved',
                    kind: 'action',
                    actorId: en ? 'Manager' : '主管',
                    at: '2026-10-31T02:00:00Z',
                    title: en ? 'Approved' : '已同意',
                    comment: en ? 'Agreed.' : '同意。',
                  },
                ]}
              />
            </ApprovalDetailSection>
          </div>
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

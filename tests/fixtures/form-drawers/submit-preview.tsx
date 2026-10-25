import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider, Link, Outlet } from 'react-router';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { RouteDrawer } from '../../../client/components/route-drawer';
import { RequestActionOverlay } from '../../../client/components/request-action-overlay';
import { useRouteOverlay } from '../../../client/components/use-route-overlay';
import { Button } from '../../../client/components/ui/button';
import { Textarea } from '../../../client/components/ui/textarea';
import { Input } from '../../../client/components/ui/input';
import { Alert, AlertDescription } from '../../../client/components/ui/alert';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';
const params = new URLSearchParams(location.search),
  zh = params.get('language') === 'zh-CN';
const copy = {
  draft: zh ? '离职草稿' : 'Departure draft',
  open: zh ? '提交' : 'Submit',
  title: zh ? '提交离职申请' : 'Submit departure request',
  note: zh ? '备注' : 'Note',
  cancel: zh ? '取消' : 'Cancel',
  confirm: zh ? '确认提交' : 'Confirm submission',
  description: zh
    ? '提交后将进入审批流程，请确认草稿信息。'
    : 'The draft will enter approval. Confirm its information before submitting.',
};
export function Draft() {
  const [value, setValue] = useState('Keep this draft');
  return (
    <RouteDrawer title={copy.draft} className='sm:max-w-2xl'>
      <p className='mb-4 text-sm'>DEPARTURE-2026-001 · Synthetic employee</p>
      <Input
        aria-label='Draft memo'
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button
        className='mt-4'
        nativeButton={false}
        render={<Link to='action/submit?keep=1#draft' />}
      >
        {copy.open}
      </Button>
      <Outlet />
    </RouteDrawer>
  );
}
export function Action() {
  const [note, setNote] = useState('');
  const [failed, setFailed] = useState(false);
  return (
    <RequestActionOverlay
      title={copy.title}
      description={copy.description}
      className='sm:max-w-2xl'
      footer={<Footer />}
    >
      {failed ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {zh
              ? '请填写期望最后工作日并选择交接人。'
              : 'Choose the expected last working day and handover recipient.'}
          </AlertDescription>
        </Alert>
      ) : null}
      <form
        id='submit-fixture'
        onSubmit={(event) => {
          event.preventDefault();
          setFailed(true);
        }}
        className='flex flex-col gap-4'
      >
        <label className='flex flex-col gap-2 text-sm'>
          {copy.note}
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {params.has('long')
          ? Array.from({ length: 25 }, (_, i) => (
              <p key={i}>Optional confirmation information {i + 1}</p>
            ))
          : null}
      </form>
    </RequestActionOverlay>
  );
}
export function Footer() {
  const { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' onClick={() => void close()}>
        {copy.cancel}
      </Button>
      <Button type='submit' form='submit-fixture'>
        {copy.confirm}
      </Button>
    </>
  );
}
const runtime = await createTestI18nRuntime({
  locale: zh ? 'zh-CN' : 'en-US',
  application: { namespace: 'nb3-oa', resources: zh ? zhCN : enUS },
});
const router = createMemoryRouter(
  [
    {
      path: '/',
      element: <Outlet />,
      children: [
        {
          path: 'draft',
          element: <Draft />,
          children: [{ path: 'action/:actionName', element: <Action /> }],
        },
      ],
    },
  ],
  {
    initialEntries: [
      `/draft/action/${params.has('other') ? 'approve' : 'submit'}?keep=1#draft`,
    ],
  },
);
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <RouterProvider router={router} />
  </TestI18nProvider>,
);

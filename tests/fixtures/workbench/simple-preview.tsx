import { createRoot } from 'react-dom/client';
import {
  createMemoryRouter,
  RouterProvider,
  useNavigate,
  useOutletContext,
} from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import HomePage from '../../../client/pages/home/index';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';

export function Detail() {
  const context = useOutletContext<{ onSaved: () => void }>();
  const navigate = useNavigate();
  return (
    <aside
      aria-label='Synthetic record detail'
      className='fixed inset-y-0 right-0 z-50 w-full border-l bg-background p-6 sm:max-w-xl'
    >
      <button
        onClick={() => {
          context.onSaved();
          void navigate({
            pathname: '/',
            search: window.__router.state.location.search,
          });
        }}
      >
        Save and close
      </button>
    </aside>
  );
}
declare global {
  interface Window {
    __router: ReturnType<typeof createMemoryRouter>;
  }
}
const query = new URLSearchParams(location.search);
const language = query.get('language') ?? 'en-US';
const runtime = await createTestI18nRuntime({
  locale: language,
  application: {
    namespace: 'nb3-oa',
    resources: language === 'zh-CN' ? zhCN : enUS,
  },
});
window.__router = createMemoryRouter(
  [
    {
      path: '/',
      element: <HomePage />,
      children: [{ path: ':kind/:id', element: <Detail /> }],
    },
  ],
  {
    initialEntries: [
      `/?search=kept${query.has('filter') ? '&workbenchRole=finance' : ''}#requests`,
    ],
  },
);
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <RouterProvider router={window.__router} />
  </TestI18nProvider>,
);

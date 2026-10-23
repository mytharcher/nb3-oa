import { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { useTranslation } from '@nocobase/i18n/client';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';
import reportRoutes from '../../../client/route-modules/reports';

const routes = resolveAppClientContributions([
  { packageName: 'preview', routes: [reportRoutes], source: 'application' },
]).routes;
const pages = routes.flatMap((route) => route.children ?? [route]);
export function Shell() {
  const { t } = useTranslation();
  return (
    <div className='flex min-h-screen flex-col md:flex-row'>
      <nav
        className='flex shrink-0 flex-col gap-2 border-r p-4 md:w-64'
        aria-label={t('reports.title')}
      >
        <strong>{t('reports.title')}</strong>
        {pages
          .filter((route) => route.navigation)
          .map((route) => (
            <Link key={route.name} to={route.path!} className='text-sm'>
              {t(route.navigation!.title)}
            </Link>
          ))}
      </nav>
      <main className='min-w-0 flex-1'>
        <Outlet />
      </main>
    </div>
  );
}
async function main() {
  const language =
    new URLSearchParams(location.search).get('language') ?? 'en-US';
  const runtime = await createTestI18nRuntime({
    locale: language,
    application: {
      namespace: 'nb3-oa',
      resources: language === 'zh-CN' ? zhCN : enUS,
    },
  });
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: pages.map((route) => {
          const Page = lazy(route.componentLoader!);
          return {
            path: route.path,
            element: (
              <Suspense fallback={<p>…</p>}>
                <Page />
              </Suspense>
            ),
          };
        }),
      },
    ],
    { initialEntries: ['/reports/budget-balances'] },
  );
  createRoot(document.getElementById('root')!).render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
void main();

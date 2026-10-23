import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';
import WorkbenchPrototypePage from '../../../client/pages/workbench-prototype/index';

// Synthetic API stand-ins are installed by prototype-preview.mjs; no session or business database is used.
const params = new URLSearchParams(location.search);
const language = params.get('language') ?? 'en-US';
async function main() {
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
        path: '/workbenchPrototype',
        element: <WorkbenchPrototypePage />,
        children: [{ path: '*', element: <p data-overlay>Overlay</p> }],
      },
      { path: '*', element: <p data-left>Left the workbench</p> },
    ],
    { initialEntries: ['/workbenchPrototype'] },
  );
  createRoot(document.getElementById('root')!).render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
void main();

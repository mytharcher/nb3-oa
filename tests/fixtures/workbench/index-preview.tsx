import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';
import HomePage from '../../../client/pages/home/index';

// Synthetic API stand-ins are installed by preview.mjs; no session or business database is used.
const language =
  new URLSearchParams(location.search).get('language') ?? 'en-US';
async function main() {
  const runtime = await createTestI18nRuntime({
    locale: language,
    application: {
      namespace: 'nb3-oa',
      resources: language === 'zh-CN' ? zhCN : enUS,
    },
  });
  const router = createMemoryRouter([{ path: '/', element: <HomePage /> }], {
    initialEntries: ['/'],
  });
  createRoot(document.getElementById('root')!).render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
void main();

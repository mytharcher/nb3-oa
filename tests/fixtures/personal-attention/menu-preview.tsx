import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { ListChecks, Bell, House } from 'lucide-react';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from '../../../client/layouts/components/app-sidebar';
import { HeaderActions } from '../../../client/layouts/components/header-actions';
import { NavigationMenu } from '../../../client/layouts/components/navigation-menu';
const query = new URLSearchParams(location.search);
const language = query.get('language') ?? 'en-US';
localStorage.setItem(
  'nocobase:sidebar:collapsed',
  String(query.has('collapsed')),
);
function route(
  name: string,
  path: string,
  title: string,
  icon: typeof Bell,
): AppClientRegisteredRoute {
  return {
    id: name,
    name,
    path,
    packageName: 'nb3-oa',
    source: 'application',
    auth: 'required',
    navigation: { title, icon },
    componentLoader: async () => ({ default: () => null }),
  };
}
const items = [
  route('home', '/', 'workbench.title', House),
  route('oa-task-center', '/taskCenter', 'taskCenter.navigation', ListChecks),
  route('inbox', '/inbox', 'oa.navigation.inbox', Bell),
].map((route) => ({ route, children: [] }));
const runtime = await createTestI18nRuntime({
  locale: language,
  application: {
    namespace: 'nb3-oa',
    resources: language === 'zh-CN' ? zhCN : enUS,
  },
});
const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <AppSidebarProvider>
          <AppSidebar label='Navigation'>
            <NavigationMenu
              items={items}
              label='Menu'
              selectedKey={undefined}
            />
          </AppSidebar>
          <main className='min-w-0 flex-1'>
            <header className='flex h-16 items-center justify-between border-b bg-background px-4'>
              <AppSidebarToggle />
              <HeaderActions />
            </header>
          </main>
        </AppSidebarProvider>
      </MemoryRouter>
    </TestI18nProvider>
  </QueryClientProvider>,
);

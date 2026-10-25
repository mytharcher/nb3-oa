import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Wrench, UsersRound } from 'lucide-react';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from '../../../client/layouts/components/app-sidebar';
import { NavigationMenu } from '../../../client/layouts/components/navigation-menu';
import {
  buildRouteNavigation,
  routeKey,
} from '../../../client/routing/route-navigation';
import enUS from '../../../client/locales/en-US';
import zhCN from '../../../client/locales/zh-CN';

const params = new URLSearchParams(location.search);
const language = params.get('language') ?? 'zh-CN';
localStorage.setItem(
  'nocobase:sidebar:collapsed',
  String(params.has('collapsed')),
);
function route(
  name: string,
  title: string,
  children?: AppClientRegisteredRoute[],
): AppClientRegisteredRoute {
  return {
    id: name,
    name,
    path: `/${name}`,
    packageName: 'nb3-oa',
    source: 'application',
    auth: 'required',
    navigation: { title, icon: children ? Wrench : UsersRound },
    ...(children
      ? { children }
      : { componentLoader: async () => ({ default: () => null }) }),
  };
}
const system = route('oa-system', 'oa.navigation.system', [
  route('oa-system-people', 'oa.navigation.systemPeople', [
    route('users', 'oa.navigation.users'),
    route('departments', 'org.navigation.departments'),
    route('positions', 'org.navigation.positions'),
    route('grades', 'org.navigation.grades'),
    route('dutyRoles', 'org.navigation.dutyRoles'),
    route('access', 'oa.navigation.access'),
  ]),
  route('oa-system-connections', 'oa.navigation.systemConnections', [
    route('apiKeys', 'oa.navigation.apiKeys'),
    route('notifications', 'oa.navigation.notificationLogs'),
    route('hrMasterData', 'hrMasterData.title'),
  ]),
  route('oa-system-operations', 'oa.navigation.systemOperations', [
    route('processManagement', 'processManagement.title'),
    route('schedules', 'oa.navigation.schedules'),
    route('audit', 'platform.navigation.auditLogs'),
  ]),
]);
const runtime = await createTestI18nRuntime({
  locale: language,
  application: {
    namespace: 'nb3-oa',
    resources: language === 'zh-CN' ? zhCN : enUS,
  },
});
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <MemoryRouter>
      <AppSidebarProvider>
        <AppSidebar label='Navigation'>
          <NavigationMenu
            items={buildRouteNavigation([system], new Set())}
            label='Menu'
            selectedKey={routeKey(system.children![0]!.children![0]!)}
          />
        </AppSidebar>
        <main className='min-w-0 flex-1 p-4'>
          <AppSidebarToggle />
        </main>
      </AppSidebarProvider>
    </MemoryRouter>
  </TestI18nProvider>,
);

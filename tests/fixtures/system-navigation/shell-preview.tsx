import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router';
import {
  ClientApplicationContext,
  createAppClientConfig,
  type ClientApplication,
} from '@nocobase/app-client';
import { AppLayout } from '../../../client/layouts/app-layout';
import SystemEntry from '../../../client/pages/system';
import { PageContainer } from '../../../client/components/page-container';
import { PageHeader } from '../../../client/components/page-header';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Wrench, UsersRound } from 'lucide-react';
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
    path: children ? '/' : `/${name}`,
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
const home = route('home', 'navigation.home');
const entry = {
  ...route('oa-system-entry', 'oa.navigation.system'),
  path: '/system',
  navigation: undefined,
};
const heightSample = route('height-parent', 'org.navigation.departments', [
  route('height-child', 'org.navigation.positions'),
]);
const allRoutes = [{ ...home, path: '/' }, heightSample, entry, system];
const app = {
  config: createAppClientConfig({ rawConfig: {} }),
} as ClientApplication;
const title = language === 'zh-CN' ? '用户账号' : 'User accounts';
createRoot(document.getElementById('root')!).render(
  <TestI18nProvider runtime={runtime}>
    <ClientApplicationContext.Provider value={app}>
      <MemoryRouter initialEntries={[params.get('page') ?? '/']}>
        <Routes>
          <Route element={<AppLayout routes={allRoutes} />}>
            <Route
              path='/'
              element={
                <PageContainer>
                  <PageHeader
                    title={language === 'zh-CN' ? '工作台' : 'Home'}
                  />
                </PageContainer>
              }
            />
            <Route path='/system' element={<SystemEntry />} />
            {system.children
              ?.flatMap((group) => group.children ?? [])
              .map((child) => (
                <Route
                  key={child.id}
                  path={child.path}
                  element={
                    <PageContainer>
                      <PageHeader title={title} />
                    </PageContainer>
                  }
                />
              ))}
          </Route>
        </Routes>
      </MemoryRouter>
    </ClientApplicationContext.Provider>
  </TestI18nProvider>,
);

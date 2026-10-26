import { useSyncServerLocale } from '@nocobase/app-plugin-i18n/client';
import { useEffect, useRef, type ReactElement } from 'react';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { Link, Outlet, useLocation } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '#components/ui/button';
import { SystemNavigationContext } from '#components/system-navigation-context';
import {
  applicationNavigationItems,
  hasSystemNavigationFailure,
  isSystemLocation,
  systemNavigationItems,
} from '../routing/system-navigation.js';

import { BrandWatermark } from '#components/brand-watermark';
import { Breadcrumbs } from '#components/breadcrumbs';

import { RouteTreeProvider } from '../routing/route-context.js';

import { PageBreadcrumbProvider } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { LayoutHeader } from './components/layout-header.js';
import {
  AppSidebar,
  AppSidebarProvider,
  AppSidebarToggle,
} from './components/app-sidebar.js';
import { NavigationMenu } from './components/navigation-menu.js';
import { AppBrand } from './components/app-brand.js';
import { HeaderActions } from './components/header-actions.js';
import { AppSidebarFooter } from './components/sidebar-footer.js';
import {
  useRouteNavigation,
  selectedNavigationId,
} from '../routing/route-navigation.js';

export interface AppLayoutProps {
  readonly routes: readonly AppClientRegisteredRoute[];
}

export function AppLayout({ routes }: AppLayoutProps): ReactElement {
  // The browser decides what it renders; this tells the server the same language so its messages match.
  useSyncServerLocale();

  const { t } = useTranslation();
  const navigation = useRouteNavigation(routes);
  const { items: menuItems, denied } = navigation;
  const { pathname } = useLocation();
  // OA switches the menu in the same shell: route declarations alone cannot express this navigation context.
  const system = isSystemLocation(routes, pathname);
  const systemItems = systemNavigationItems(menuItems);
  const entry = routes.find((route) => route.name === 'oa-system-entry');
  const items = system
    ? systemItems
    : applicationNavigationItems(menuItems, entry);
  const mainRef = useRef<HTMLElement>(null);
  const previousSystemRef = useRef(system);
  useEffect(() => {
    if (previousSystemRef.current !== system) mainRef.current?.focus();
    previousSystemRef.current = system;
  }, [system]);
  const selectedKey = selectedNavigationId(routes, pathname, denied);
  const navigationLabel = system
    ? t('oa.navigation.systemLabel')
    : t('navigation.label', { defaultValue: 'Application navigation' });

  return (
    // The shell owns the business route tree used by its pages and navigation.
    <RouteTreeProvider routes={routes}>
      <SystemNavigationContext.Provider
        value={{
          items: systemItems,
          loading: navigation.loading,
          failed: hasSystemNavigationFailure(
            routes,
            navigation.failed ?? new Set(),
          ),
          retry: navigation.retry,
        }}
      >
        <PageBreadcrumbProvider>
          <AppSidebarProvider>
            <AppSidebar
              label={navigationLabel}
              footer={<AppSidebarFooter />}
              navigationFocusTarget={mainRef}
            >
              <NavigationMenu
                items={items}
                label={navigationLabel}
                selectedKey={selectedKey}
              />
            </AppSidebar>
            <div className='flex min-w-0 flex-1 flex-col'>
              <LayoutHeader
                className={`sticky top-0 z-40 justify-between gap-2${system ? ' h-auto min-h-16 flex-wrap gap-y-0 sm:h-16 sm:flex-nowrap' : ''}`}
              >
                <div
                  className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3${system ? ' h-16 sm:h-auto' : ''}`}
                >
                  <AppSidebarToggle />
                  {system ? (
                    <Button
                      variant='ghost'
                      role='link'
                      nativeButton={false}
                      render={<Link to='/' />}
                    >
                      <ArrowLeft aria-hidden='true' />
                      {t('oa.navigation.backToApplication')}
                    </Button>
                  ) : (
                    <div className='shrink-0 md:hidden'>
                      <AppBrand />
                    </div>
                  )}
                  <div className='hidden h-5 w-px shrink-0 bg-border md:block' />
                  {/* The current page's trail: the route tree's, or the one the page declares (`usePageBreadcrumb`). */}
                  <Breadcrumbs
                    denied={denied}
                    className={system ? 'hidden sm:block' : undefined}
                  />
                </div>
                <HeaderActions />
                {system ? (
                  <div className='w-full pb-2 sm:hidden'>
                    <Breadcrumbs denied={denied} />
                  </div>
                ) : null}
              </LayoutHeader>
              <main
                ref={mainRef}
                tabIndex={-1}
                className='app-brand-surface relative isolate min-w-0 flex-1 overflow-hidden focus:outline-none'
              >
                <BrandWatermark className='-z-10' />
                {/* main only positions; the page scrolls in here, so a child page layer laid over main is neither
            moved by the page's scrolling nor stretched by its height. */}
                <div className='h-full overflow-y-auto'>
                  <Outlet />
                </div>
              </main>
            </div>
          </AppSidebarProvider>
        </PageBreadcrumbProvider>
      </SystemNavigationContext.Provider>
    </RouteTreeProvider>
  );
}

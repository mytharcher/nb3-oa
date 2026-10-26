import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  matchRouteTree,
  routeKey,
  type RouteNavigationItem,
} from './route-navigation.js';

export function isSystemRoute(route: AppClientRegisteredRoute): boolean {
  return route.source === 'application' && route.name === 'oa-system';
}

/** Use route ancestry, including hidden and denied pages, rather than the filtered menu. */
export function isSystemLocation(
  routes: readonly AppClientRegisteredRoute[],
  pathname: string,
): boolean {
  return Boolean(
    matchRouteTree(routes, pathname)?.some(
      ({ route }) => isSystemRoute(route) || route.name === 'oa-system-entry',
    ),
  );
}

export function systemNavigationItems(items: readonly RouteNavigationItem[]) {
  return items.find(({ route }) => isSystemRoute(route))?.children ?? [];
}

export function applicationNavigationItems(
  items: readonly RouteNavigationItem[],
  entry: AppClientRegisteredRoute | undefined,
): readonly RouteNavigationItem[] {
  return items.flatMap((item) => {
    if (!isSystemRoute(item.route)) return [item];
    // Project the authorized group as a link without changing the registered route tree or its grants.
    return entry && item.children.length
      ? [
          {
            route: { ...entry, navigation: item.route.navigation },
            children: [],
          },
        ]
      : [];
  });
}

export function firstNavigationPath(
  items: readonly RouteNavigationItem[],
): string | undefined {
  for (const item of items) {
    if (item.route.componentLoader) return item.route.path;
    const path = firstNavigationPath(item.children);
    if (path) return path;
  }
  return undefined;
}

export function hasSystemNavigationFailure(
  routes: readonly AppClientRegisteredRoute[],
  failed: ReadonlySet<string>,
  insideSystem = false,
): boolean {
  return routes.some((route) => {
    const system = insideSystem || isSystemRoute(route);
    return (
      (system && failed.has(routeKey(route))) ||
      hasSystemNavigationFailure(route.children ?? [], failed, system)
    );
  });
}

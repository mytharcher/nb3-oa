import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  requestSearchRegistryToken,
  type RequestSearchSource,
} from './contract.js';
export * from './contract.js';
export default class RequestSearchProvider extends ServiceProvider<Application> {
  readonly name = 'oa/request-search';
  override register() {
    this.app.container.singleton(requestSearchRegistryToken, () => {
      const sources = new Map<string, RequestSearchSource>();
      return {
        register(source: RequestSearchSource) {
          if (sources.has(source.kind))
            throw new Error(`Duplicate request search source: ${source.kind}`);
          sources.set(source.kind, source);
        },
        sources: () =>
          [...sources.values()].sort((a, b) => a.kind.localeCompare(b.kind)),
      };
    });
  }
}

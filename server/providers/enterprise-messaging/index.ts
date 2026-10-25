import { notificationExtensionRegistryToken } from '@nocobase/app-plugin-notification/server';
import type { Application } from '@nocobase/app-server/application';
import { ServiceProvider } from '@nocobase/service-provider';
import { WecomAppChannel } from './wecom.js';
export default class EnterpriseMessagingProvider extends ServiceProvider<Application> {
  readonly name = 'oa/enterprise-messaging';
  override async boot() {
    this.app.container
      .resolve(notificationExtensionRegistryToken)
      .registerChannelType(WecomAppChannel);
  }
}

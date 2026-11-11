import { type AppConfigFactory } from '@nocobase/app-server/config';
import { defineMailChannelsConfig } from '@nocobase/app-plugin-notification-providers/config';
import type { NotificationConfig } from '@nocobase/app-plugin-notification/server';

const notification: AppConfigFactory<NotificationConfig> =
  defineMailChannelsConfig({
    defaults: { channels: { 'demo-inbox': { provider: 'in-app' } } },
  });

export default notification;

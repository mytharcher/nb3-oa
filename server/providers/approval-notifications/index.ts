import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  approvalNotificationServiceToken,
  type ApprovalNotificationConfig,
} from './contract.js';
import { createApprovalNotificationService } from './service.js';

export * from './contract.js';

export default class ApprovalNotificationsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/approval-notifications-provider';

  public override register(): void {
    this.app.container.singleton(approvalNotificationServiceToken, () =>
      createApprovalNotificationService({
        notification: this.app.container.resolve(notificationServiceToken),
        users: this.app.container.resolve(userAdministrationServiceToken),
        i18n: this.app.container.resolve(i18nToken),
        channels:
          this.app.config.get<NotificationConfig>('notification')?.channels ??
          {},
        config: this.app.config.get<ApprovalNotificationConfig>(
          'oaApprovals',
        ) ?? { inbox: 'inbox', email: null, alarm: null, administrators: [] },
        publicOrigin: this.app.config.get<string>('app.publicOrigin'),
        basePath: this.app.config.get<string>('app.publicBasePath') ?? '/',
      }),
    );
  }
}

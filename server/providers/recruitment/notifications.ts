import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type {
  NotificationConfig,
  NotificationService,
} from '@nocobase/app-plugin-notification/server';
import type {
  ReplacementNoticeOwner,
  ReplacementNoticeDelivery,
} from '../headcounts/notifications.js';
import type { RecruitmentService } from './service.js';

/** The recruitment owner retains the ordinary resource/row/field boundary on every delivery attempt. */
export function createRecruitmentReplacementOwner(d: {
  service: () => RecruitmentService;
  db: DatabaseManager;
  authz: AppAuthorization;
  users: UserAdministrationService;
  notification: NotificationService;
  channels: NotificationConfig['channels'];
  delivery: () => Promise<ReplacementNoticeDelivery>;
  inbox: () => string | null;
}): ReplacementNoticeOwner {
  return {
    async prepare(source, tx) {
      return {
        recipients: await d
          .service()
          .replacementNoticeRecipients(source.sourceId, tx),
        delivery: await d.delivery(),
      };
    },
    async deliver(source, userId, key, delivery) {
      const user = await d.users.get(userId);
      if (!user || user.disabledAt) return;
      const principal = { type: 'user', id: userId };
      const subjects = [
        { type: 'authenticated', id: '*' },
        ...(await d.authz.subjects.resolveFor(principal)),
      ];
      const decision = await d.authz.for({ principal, subjects }).authorize({
        resource: { type: 'composite', id: 'oa.recruitment' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false> | undefined
            )?.recruitmentRequests;
      if (!policy) return;
      const eligible = await d.db.transaction((tx) =>
        d
          .service()
          .replacementNoticeEligible(source.sourceId, userId, tx, policy),
      );
      if (!eligible) return;
      const name = delivery.channel ?? d.inbox();
      const channel = name ? d.channels[name] : undefined;
      if (
        !name ||
        !channel ||
        channel.enabled === false ||
        channel.provider !== 'in-app'
      )
        throw new Error('Replacement inbox channel unavailable');
      await d.notification.send({
        idempotencyKey: key,
        source: {
          type: 'oa.recruitmentReplacement',
          referenceId: source.sourceId,
        },
        messages: {
          [name]: {
            to: userId,
            title: delivery.title,
            body: delivery.body,
            target: {
              type: 'route',
              path: `/recruitment-requests/${source.sourceId}`,
            },
          },
        },
      });
    },
  };
}

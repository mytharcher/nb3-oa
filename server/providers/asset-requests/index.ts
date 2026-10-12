import {
  assetSelectionServiceToken,
  createAssetSelectionService,
} from './selection.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  lockUserForAdministration,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  defineDatabasePermission,
  condition,
  anyScope,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { i18nToken } from '@nocobase/app-server/i18n';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import type { NotificationConfig } from '@nocobase/app-plugin-notification/server';
import type { ApprovalNotificationConfig } from '../approval-notifications/contract.js';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import { auditServiceToken } from '../audit/index.js';
import { orgServiceToken } from '../org/contract.js';
import { employeeServiceToken } from '../employees/contract.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { approvalNotificationServiceToken } from '../approval-notifications/contract.js';
import {
  calendarServiceToken,
  dictionaryServiceToken,
  ruleServiceToken,
  sequenceServiceToken,
} from '../platform/index.js';
import {
  assetServiceToken,
  assetStockSourceToken,
} from '../assets/contract.js';
import { AssetError } from '../assets/errors.js';
import {
  assetRequestServiceToken,
  type AssetRequestRecord,
} from './contract.js';
import {
  assertAssetPhotos,
  createAssetPhotoService,
  assetPhotoServiceToken,
} from './attachments.js';
import { createAssetRequestService } from './service.js';
export * from './contract.js';
export const assetRequestResource = defineCompositeResource(
  'oa.assetRequests',
  (r) => {
    const read = defineDatabasePermission((p) =>
      p
        .collection('assetRequests')
        .read((fields) =>
          fields.fields(
            'id',
            'applicantId',
            'createdById',
            'employeeId',
            'departmentId',
            'headApproverId',
            'issuedById',
            'number',
            'operation',
            'category',
            'assetIds',
            'quantity',
            'purpose',
            'borrowDueDate',
            'scrapReason',
            'photos',
            'allocation',
            'needsGm',
            'appraisalOpinion',
            'handlingUnits',
            'handlingReason',
            'exceptionReason',
            'status',
            'lifecycleVersion',
            'statusChangedAt',
            'createdAt',
            'updatedAt',
          ),
        ),
    );
    return r
      .title({ key: 'assetRequests.authz.resource', ns: 'nb3-oa' })
      .action('view', (a) =>
        a
          .title({ key: 'assetRequests.authz.view', ns: 'nb3-oa' })
          .grant('assetRequests', read),
      )
      .action('viewValue', (a) =>
        a.title({ key: 'assetRequests.authz.viewValue', ns: 'nb3-oa' }).grant(
          'assetRequests',
          defineDatabasePermission((p) =>
            p.collection('assetRequests').read('*'),
          ),
        ),
      )
      .action('create', (a) =>
        a
          .title({ key: 'assetRequests.authz.create', ns: 'nb3-oa' })
          .grant('assetRequests', read.create('*')),
      )
      .action('edit', (a) =>
        a
          .title({ key: 'assetRequests.authz.edit', ns: 'nb3-oa' })
          .grant('assetRequests', read.update('*')),
      )
      .action('operate', (a) =>
        a
          .title({ key: 'assetRequests.authz.operate', ns: 'nb3-oa' })
          .grant('assetRequests', read.update('*')),
      )
      .action('returnIssued', (a) =>
        a
          .title({ key: 'assetRequests.authz.returnIssued', ns: 'nb3-oa' })
          .grant('assetRequests', read),
      );
  },
);
export default class AssetRequestsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/asset-requests-provider';
  private service?: ReturnType<typeof createAssetRequestService>;
  private jobs?: LifecycleJobs;
  private unsubscribe?: () => void;
  public override register(): void {
    const c = this.app.container;
    c.singleton(assetRequestServiceToken, () => {
      const service = createAssetRequestService({
        users: c.resolve(userAdministrationServiceToken),
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        org: c.resolve(orgServiceToken),
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dictionaries: c.resolve(dictionaryServiceToken),
        rules: c.resolve(ruleServiceToken),
        sequences: c.resolve(sequenceServiceToken),
        notifications: c.resolve(approvalNotificationServiceToken),
        assets: c.resolve(assetServiceToken),
        validatePhotos: assertAssetPhotos,
        dispatcher: {
          dispatch: (id, options) => this.jobs!.dispatch(id, options),
        },
        remindersEnabled: () => {
          // A real per-user inbox channel is required; a webhook to administrators does not deliver to the borrower.
          const config =
            this.app.config.get<ApprovalNotificationConfig>('oaApprovals');
          const name = config ? config.inbox : 'inbox';
          const channel = name
            ? this.app.config.get<NotificationConfig>('notification')?.channels[
                name
              ]
            : undefined;
          return Boolean(
            channel &&
            channel.enabled !== false &&
            channel.provider === 'in-app',
          );
        },
      });
      this.service = service;
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-assets'),
        schedule: executors.getScheduleExecutor('oa-assets'),
        jobName: 'oa-asset-request-effect',
        sweepEveryMs: 10 * 60_000,
        async onSweep() {
          await service.maintenance();
          await service.runtime.prune({
            olderThan: new Date(Date.now() - 30 * 86400000),
          });
        },
      });
      return service;
    });
    c.singleton(assetStockSourceToken, () => {
      c.resolve(assetRequestServiceToken);
      return this.service!.stockSource;
    });
    c.singleton(assetSelectionServiceToken, () =>
      createAssetSelectionService({
        db: c.resolve(databaseManagerToken),
        assets: c.resolve(assetServiceToken),
        requests: c.resolve(assetRequestServiceToken),
        employees: c.resolve(employeeServiceToken),
        directory: c.resolve(approvalDirectoryServiceToken),
      }),
    );
    c.singleton(assetPhotoServiceToken, () =>
      createAssetPhotoService(c.resolve(assetRequestServiceToken)),
    );
  }
  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'assetRequests',
      title: { key: 'assetRequests.authz.resource', ns: 'nb3-oa' },
    });
    authz.compositeResources.define(assetRequestResource);
    authz.recordAccess.define(
      defineRecordAccess('oa.assetRequestsOwned', (scope) =>
        scope
          .title({ key: 'assetRequests.authz.ownedScope', ns: 'nb3-oa' })
          .collections('assetRequests')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? anyScope([
                  condition('applicantId', '$eq', principal.id),
                  condition('createdById', '$eq', principal.id),
                ])
              : false,
          ),
      ),
    );
    authz.recordAccess.define(
      defineRecordAccess('oa.assetRequestsReadable', (scope) =>
        scope
          .title({ key: 'approvals.authz.readableScope', ns: 'nb3-oa' })
          .collections('assetRequests')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const ids = await this.app.container
              .resolve(assetRequestServiceToken)
              .readableIds(principal.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    authz.ui.place(
      { type: 'composite', id: 'oa.assetRequests' },
      { section: 'oa.approvals' },
    );
    const scheduler = this.app.container.resolve(schedulerServiceToken),
      i18n = this.app.container.resolve(i18nToken),
      locale = i18n.getDefaultLocale();
    await i18n.ensureLocaleLoaded(locale);
    const t = i18n.getFixedT('nb3-oa', locale);
    scheduler.registerTarget({
      type: 'app.asset-borrow-reminders',
      title: t('assetRequests.schedule.title'),
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        !Array.isArray(config) &&
        Object.keys(config).length === 0
          ? { valid: true }
          : { valid: false, reason: 'asset-reminder-config-must-be-empty' },
      start: async () => {
        const result = await this.app.container
          .resolve(assetRequestServiceToken)
          .remindBorrowers(new Date());
        return result.pending
          ? {
              state: 'failed',
              reason: `asset-reminder-pending:${result.pending}`,
            }
          : { state: 'completed', outcome: 'succeeded', result };
      },
    });
    const calendar = this.app.container.resolve(calendarServiceToken);
    await calendar.reload();
    scheduler.defineSchedule({
      key: 'oa.assets.borrow-reminders',
      title: t('assetRequests.schedule.title'),
      description: t('assetRequests.schedule.description'),
      schedule: { cron: '0 9 * * *', timezone: calendar.timeZone() },
      target: { type: 'app.asset-borrow-reminders', config: {} },
    });
  }
  public override async start(): Promise<void> {
    const db = this.app.container.resolve(databaseManagerToken);
    if (!(await db.connection().collections.get('assetRequests'))) return;
    this.app.container.resolve(assetRequestServiceToken);
    this.unsubscribe = db.connection().onRepositoryMutation(
      { id: 'oa/asset-photo-upload', collections: ['assetRequestPhotos'] },
      {
        inTransaction: async (event, tx) => {
          if (event.granularity !== 'rows') return;
          for (const change of event.changes) {
            if (
              change.collection !== 'assetRequestPhotos' ||
              change.kind !== 'created'
            )
              continue;
            const file = await tx
              .repository<{
                id: string;
                requestId: string;
                ownerId: string;
                uploadVersion: number;
              }>('assetRequestPhotos')
              .findOne({ filter: { id: String(change.key.id) } });
            if (!file)
              throw new AssetError(
                'ASSET_PHOTO_DENIED',
                'The uploaded photo metadata is missing.',
                'permission',
              );
            const before = await tx
              .repository<AssetRequestRecord>('assetRequests')
              .findOne({ filter: { id: file.requestId } });
            if (!before)
              throw new AssetError(
                'ASSET_PHOTO_DENIED',
                'The owning draft no longer exists.',
                'permission',
              );
            await lockUserForAdministration(tx, before.applicantId);
            await tx.repository('assetRequests').updateMany({
              filter: { id: file.requestId },
              values: { lifecycleVersion: { increment: 0 } },
            });
            const row = await tx
              .repository<AssetRequestRecord>('assetRequests')
              .findOne({ filter: { id: file.requestId } });
            if (
              !row ||
              row.applicantId !== file.ownerId ||
              row.lifecycleVersion !== file.uploadVersion ||
              !['draft', 'revision', 'exception'].includes(row.status)
            )
              throw new AssetError(
                'ASSET_PHOTO_DENIED',
                'The draft changed during photo upload.',
                'permission',
              );
            await this.app.container.resolve(auditServiceToken).record(
              {
                actorId: file.ownerId,
                action: 'assetRequest.photoUpload',
                targetType: 'assetRequests',
                targetId: file.requestId,
                after: { fileId: file.id },
              },
              tx,
            );
          }
        },
      },
    );
    await this.service!.initialize();
    await this.jobs?.start(this.service!.runtime);
  }
  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    await this.jobs?.shutdown();
  }
}

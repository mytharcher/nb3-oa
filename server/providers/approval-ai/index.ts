import { auditServiceToken } from '../audit/index.js';
import { registerApprovalAssistant } from './agent.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  defineDatabasePermission,
} from '@nocobase/app-plugin-authorization/server';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { Job, type JobExecutor, type ScheduleExecutor } from '@nocobase/jobs';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';
import { knowledgeServiceToken } from '../knowledge/contract.js';
import { approvalAiRegistryToken } from './contract.js';
import { approvalAiServiceToken, createApprovalAiService } from './service.js';
export default class ApprovalAiProvider extends ServiceProvider<Application> {
  readonly name = 'oa/approval-ai';
  private jobs?: JobExecutor;
  private schedule?: ScheduleExecutor;
  override register() {
    const c = this.app.container;
    c.singleton(approvalAiServiceToken, () =>
      createApprovalAiService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        authz: c.resolve(authorizationToken),
        directory: c.resolve(approvalDirectoryServiceToken),
        knowledge: c.resolve(knowledgeServiceToken),
        gateway: c.resolve(agentsToken).models.gateway,
        dispatch: async (id) => {
          if (!this.jobs || !this.job) throw new Error('AI jobs not ready');
          await this.jobs.addJob(new this.job({ id }));
        },
        warn: (message) =>
          c.resolve(loggingToken).getLogger('approval-ai').warn(message),
      }),
    );
    c.singleton(approvalAiRegistryToken, () =>
      c.resolve(approvalAiServiceToken),
    );
  }
  private job?: ReturnType<typeof createReviewJob>;
  override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    authz.database.collections.add({
      name: 'oaApprovalAiSettings',
      title: { key: 'approvalAi.configure', ns: 'nb3-oa' },
    });
    authz.compositeResources.define(
      defineCompositeResource('oa.approvalAi', (r) =>
        r
          .title({ key: 'approvalAi.title', ns: 'nb3-oa' })
          .action('configure', (a) =>
            a.title({ key: 'approvalAi.configure', ns: 'nb3-oa' }).grant(
              'settings',
              defineDatabasePermission((p) =>
                p.collection('oaApprovalAiSettings').read('*').update('*'),
              ),
            ),
          ),
      ),
    );
    authz.ui.place(
      { type: 'composite', id: 'oa.approvalAi' },
      { section: 'oa.approvals' },
    );
    registerApprovalAssistant(this.app);
  }
  override async start() {
    const c = this.app.container,
      service = c.resolve(approvalAiServiceToken),
      executors = c.resolve(jobExecutorServiceToken);
    await service.initialize();
    this.jobs = executors.getJobExecutor('oa-approval-ai');
    this.job = createReviewJob(service);
    this.jobs.registerJob(this.job);
    await this.jobs.setup();
    this.schedule = executors.getScheduleExecutor('oa-approval-ai');
    await this.schedule.addJob({
      name: 'approval-ai-sweep',
      options: { every: 120_000 },
      payload: {},
      execute: async () => {
        await service.sweep();
      },
    });
    await this.schedule.setup();
    await service.sweep();
  }
  override async shutdown() {
    await this.schedule?.shutdown();
    await this.jobs?.shutdown();
  }
}
function createReviewJob(service: { process(id: string): Promise<void> }) {
  return class ReviewJob extends Job<{ id: string }> {
    static readonly jobName = 'oa.approval-ai.review';
    async execute() {
      await service.process(this.payload.id);
    }
  };
}

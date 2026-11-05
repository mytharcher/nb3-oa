import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  defineDatabasePermission,
  authorizationToken,
} from '@nocobase/app-plugin-authorization/server';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  approvalSuggestionsToken,
  approvalSuggestionMaterialsToken,
  subscribeApprovalSuggestionChanges,
} from '@nocobase/app-plugin-approval/server/assistant';
import { processOwners } from '../process-management/owners.js';
import { knowledgeServiceToken } from '../knowledge/contract.js';
import { createOaSuggestionMaterials } from './materials.js';
import { approvalAiServiceToken, createApprovalAiService } from './service.js';

/** Business authorization/material adapters only. Approval owns its Queue consumer and recovery. */
export default class ApprovalAiProvider extends ServiceProvider<Application> {
  readonly name = 'oa/approval-ai';
  private stop?: () => void;
  override register() {
    const c = this.app.container;
    c.singleton(approvalAiServiceToken, () =>
      createApprovalAiService({
        db: c.resolve(databaseManagerToken),
        authz: c.resolve(authorizationToken),
        owners: processOwners,
        sdk: (owner) => owner.sdk(this.app),
        suggestions: c.resolve(approvalSuggestionsToken),
      }),
    );
    c.singleton(approvalSuggestionMaterialsToken, () =>
      createOaSuggestionMaterials({
        db: c.resolve(databaseManagerToken),
        authz: c.resolve(authorizationToken),
        knowledge: c.resolve(knowledgeServiceToken),
        owners: processOwners,
      }),
    );
  }
  override async boot() {
    const c = this.app.container;
    // Preserve the immutable permission seeds and the existing read-only settings navigation.
    // There is no legacy settings mutation endpoint or worker behind this grant.
    const authz = c.resolve(authorizationToken);
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
    const service = c.resolve(approvalAiServiceToken);
    const topic = c
      .resolve(realtimeServiceToken)
      .defineTopicFamily<{ taskId: string }, Record<string, never>>(
        'oa:approval-suggestions:{taskId}',
        {
          audience: 'public',
          authenticated: true,
          delivery: 'latest',
          authorize: async ({ params, principal }) =>
            !!principal &&
            service.canSubscribe(params.taskId, principal.userId),
        },
      );
    const unsubscribe = subscribeApprovalSuggestionChanges(
      c.resolve(databaseManagerToken),
      async ({ taskId }) => {
        try {
          await topic.publish({ taskId }, {});
        } catch {
          c.resolve(loggingToken)
            .getLogger('approval-ai')
            .warn(
              {},
              'Suggestion invalidation delivery failed; clients reconcile on reconnect.',
            );
        }
      },
    );
    this.stop = () => {
      unsubscribe();
      topic.close();
    };
  }
  override async shutdown() {
    this.stop?.();
  }
}

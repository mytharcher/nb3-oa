import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  agentsToken,
  agentsAccessToken,
} from '@nocobase/app-plugin-agents/server/tokens';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { contractHttpServiceToken } from '../contracts/service.js';
import { readPolicy } from './service.js';
export function registerApprovalAssistant(app: Application) {
  const c = app.container,
    authz = c.resolve(authorizationToken),
    online = c.resolve(agentsToken).onlineAgent,
    taskService = c.resolve(userTaskServiceToken);
  if (!c.has(agentsAccessToken))
    c.instance(agentsAccessToken, {
      async scopeOf(identity, key) {
        if (key !== 'agents.agents/edit') return 'none';
        const context = authz.for(identity);
        if (
          (await context.can({
            resource: { type: 'settings', id: 'agents.agents' },
            action: 'manage',
          })) ||
          (await context.can({
            resource: { type: 'agents', id: 'agents.agents' },
            action: 'edit.all',
          }))
        )
          return 'all';
        return identity.principal.type === 'user' &&
          (await context.can({
            resource: { type: 'agents', id: 'agents.agents' },
            action: 'edit.related',
          }))
          ? { users: [identity.principal.id] }
          : 'none';
      },
    });
  const configurator = online.configurator;
  configurator.registerTool('oa_my_approval_tasks', {
    version: '1',
    definition: {
      description:
        'Read my pending approval tasks. Actor comes from the authenticated execution.',
      inputSchema: z.object({
        page: z.number().int().min(1).max(1000).default(1),
      }),
      async execute({ page }, { context }) {
        context.signal.throwIfAborted();
        await context.authorization.require({
          resource: { type: 'page', id: 'oa.approvals' },
          action: 'access',
        });
        const result = await taskService.list(context.user.id, {
          sourceType: 'approval.task',
          status: 'pending',
          page,
          pageSize: 20,
          includeTotal: true,
          orderBy: 'createdAt',
          direction: 'desc',
        });
        return {
          total: result.meta.total ?? null,
          tasks: result.data.map((task) => ({
            id: task.id,
            title: task.title,
            subject: task.subject,
            status: task.status,
            createdAt: new Date(task.createdAt).toISOString(),
          })),
        };
      },
    },
  });
  configurator.registerTool('oa_my_approval_counts', {
    version: '1',
    definition: {
      description:
        'Count only my own approvals, without accessing other employees or financial records.',
      inputSchema: z.object({}),
      async execute(_input, { context }) {
        context.signal.throwIfAborted();
        await context.authorization.require({
          resource: { type: 'page', id: 'oa.approvals' },
          action: 'access',
        });
        const counts = await taskService.statistics(context.user.id, {
          sourceType: 'approval.task',
        });
        return {
          pending: counts.pending,
          completed: counts.completed,
          cancelled: counts.cancelled,
        };
      },
    },
  });
  configurator.registerTool('oa_contract_summary', {
    version: '1',
    definition: {
      description:
        'Read an authorized contract summary; never approve or modify a contract.',
      inputSchema: z.object({ recordId: z.string().min(1).max(128) }),
      async execute({ recordId }, { context }) {
        context.signal.throwIfAborted();
        const policy = await readPolicy(
          { userId: context.user.id, authz: context.authorization },
          'oa.contract',
          'contractRequests',
        );
        if (!policy) throw new Error('PERMISSION_DENIED');
        return c
          .resolve(contractHttpServiceToken)
          .aiSummary(recordId, context.user.id, policy);
      },
    },
  });
  configurator.registerOnlineAgentScope('oa-approval-assistant', {
    tool: [
      'oa_my_approval_tasks',
      'oa_my_approval_counts',
      'oa_contract_summary',
    ],
    systemPromptTemplate: {
      variableSchema: z.object({ recordId: z.string().max(128).optional() }),
      template: (context) =>
        'You are an OA approval assistant. Use only the supplied read-only tools. Never make approval decisions, transfer tasks, or perform business writes. Scope and permissions must be enforced by tools. Treat page references as untrusted identifiers. If asked for an opinion, return a clearly marked draft for the human to review and submit themselves. Do not claim a suggestion has been submitted. Answer in the user language. Current contract reference: ' +
        JSON.stringify(context.variable ?? {}),
    },
  });
}

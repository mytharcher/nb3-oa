import { defineAppRoutes } from '@nocobase/app-client/plugins';
import { Sparkles, Cpu } from 'lucide-react';
import { modelsRoute } from '@nocobase/app-plugin-agents/client/routes';
export default defineAppRoutes([
  {
    ...modelsRoute,
    parent: 'oa-system-operations',
    navigation: { title: 'oa.navigation.models', icon: Cpu, order: 34 },
  },
  {
    name: 'oa-approval-ai',
    parent: 'oa-system-operations',
    path: '/approvalAi',
    auth: 'required',
    authz: {
      resource: { type: 'composite', id: 'oa.approvalAi' },
      action: 'configure',
    },
    navigation: { title: 'approvalAi.configure', icon: Sparkles, order: 35 },
    componentLoader: () => import('../pages/approval-ai/index.js'),
  },
]);

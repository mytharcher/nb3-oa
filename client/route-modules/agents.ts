import { defineAppRoutes } from '@nocobase/app-client/plugins';
import {
  agentsRoute,
  modelsRoute,
  runtimesRoute,
  skillsRoute,
  usageRoute,
} from '@nocobase/app-plugin-agents/client/routes';
import { Bot, BookOpen, ChartNoAxesCombined, Cpu, Server } from 'lucide-react';

// Agents contributes services but no page routes. Reuse its public pages while
// keeping their permission resources and child routes in the OA navigation tree.
export default defineAppRoutes([
  {
    ...agentsRoute,
    parent: 'oa-automation',
    navigation: { title: 'oa.navigation.agents', icon: Bot, order: 20 },
  },
  {
    ...runtimesRoute,
    parent: 'oa-automation',
    navigation: { title: 'oa.navigation.runtimes', icon: Server, order: 30 },
  },
  {
    ...skillsRoute,
    parent: 'oa-automation',
    navigation: { title: 'oa.navigation.skills', icon: BookOpen, order: 40 },
  },
  {
    ...modelsRoute,
    parent: 'oa-automation',
    navigation: { title: 'oa.navigation.models', icon: Cpu, order: 50 },
  },
  {
    ...usageRoute,
    parent: 'oa-automation',
    navigation: {
      title: 'oa.navigation.agentUsage',
      icon: ChartNoAxesCombined,
      order: 60,
    },
  },
]);

import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
import agents from '@nocobase/app-plugin-agents/cli';
import demoMode from '@nocobase/app-plugin-demo-mode/cli';

// Array order is command registration order. A plugin contributes its commands
// by appearing in this list; removing its entry and its import removes them.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  agents,
  demoMode,
]);

export default cliPlugins;

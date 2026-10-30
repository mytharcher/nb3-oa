import { defineAppConfig, envString } from '@nocobase/app-server/config';
/** Deployment safety switch; business targets remain versioned platform rules. */
export default defineAppConfig({
  env: {
    IT_REPAIR_MODE: envString('mode', {
      required: false,
      description:
        'active or readOnly; compatibility rollback must use readOnly',
    }),
  },
  defaults: () => ({ mode: 'active', scanEveryMs: 60000, batchSize: 100 }),
});

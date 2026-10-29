import { defineAppConfig } from '@nocobase/app-server/config';
/** Operational knobs; business targets and calendars remain versioned platform rules. */
export default defineAppConfig(() => ({ scanEveryMs: 60000, batchSize: 100 }));

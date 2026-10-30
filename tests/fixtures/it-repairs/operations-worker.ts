// A second native application process; only its parent's isolated config path is accepted.
import { createInterface } from 'node:readline';
import { createStandaloneServer } from '../../../server/standalone.js';
import { pathToFileURL } from 'node:url';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
const configPath = process.env.OA_OPS_CONFIG;
if (!configPath || !configPath.startsWith(process.env.TMPDIR!))
  throw Error('isolated config required');
const factory = process.env.OA_OPS_SERVER
  ? ((await import(pathToFileURL(process.env.OA_OPS_SERVER).href))
      .createStandaloneServer as typeof createStandaloneServer)
  : createStandaloneServer;
const app = await factory({
  configPath,
  env: { APP_STORAGE_DIR: process.env.OA_OPS_STORAGE },
  viteDevUrl: false,
});
const events: { name: string; jobId: string }[] = [];
app.application.container
  .resolve(jobExecutorServiceToken)
  .getScheduleExecutor('oa-it-repair-timers')
  .subscribe(async (event) => {
    if (event.name === 'ScheduleEnd')
      events.push({ name: event.name, jobId: event.jobId });
  });
process.stdout.write('CAPACITY_WORKER_READY\n');
const input = createInterface({ input: process.stdin });
for await (const line of input) {
  const { id, operation, recordId, cookie } = JSON.parse(line) as {
    id: string;
    operation: string;
    recordId?: string;
    cookie?: string;
  };
  if (operation === 'close') break;
  try {
    if (operation === 'events') {
      process.stdout.write(
        'CAPACITY_WORKER_RESULT ' +
          JSON.stringify({ id, result: events }) +
          '\n',
      );
      continue;
    }
    if (operation === 'read') {
      const response = await app.fetch(
        new Request(
          `http://127.0.0.1:13000${app.application.publicBasePath}/api/itRepairs/${recordId}`,
          { headers: { cookie: cookie! } },
        ),
      );
      process.stdout.write(
        'CAPACITY_WORKER_RESULT ' +
          JSON.stringify({
            id,
            result: { status: response.status, body: await response.json() },
          }) +
          '\n',
      );
      continue;
    }
    const result = await app.application.container
      .resolve(repairServiceToken)
      .tick(100);
    process.stdout.write(
      'CAPACITY_WORKER_RESULT ' + JSON.stringify({ id, result }) + '\n',
    );
  } catch (error) {
    process.stdout.write(
      'CAPACITY_WORKER_RESULT ' +
        JSON.stringify({ id, error: String(error) }) +
        '\n',
    );
  }
}
await app.close();

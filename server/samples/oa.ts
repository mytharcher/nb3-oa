import { randomUUID } from 'node:crypto';
import { chmod, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Application } from '@nocobase/app-server/application';
import type { SampleDataRegistration } from '@nocobase/app-server/sample-data';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  demoDataServiceToken,
  type DemoDataService,
  type DemoLocale,
} from '../providers/demo-data/contract.js';

/** Sample history owns execution policy; the existing dataset owns checkpoints. */
export async function ensureOaSample(
  service: DemoDataService,
  locale: DemoLocale,
): Promise<void> {
  await service.idle();
  let status = await service.status();
  if (status.state === 'ready') {
    await service.useSamplePasswords();
    return;
  }
  if (status.state !== 'absent' && status.state !== 'importFailed')
    throw new Error(
      `OA sample dataset is busy or needs cleanup: ${status.state}`,
    );
  await service.useSamplePasswords();
  status = await service.status();
  await service.import(
    {
      locale: status.locale ?? locale,
      expectedVersion: status.version,
      requestKey: randomUUID(),
    },
    // Installation operation, not an impersonated administrator or browser user.
    'sample:oa/demo-data',
  );
  await service.idle();
  status = await service.status();
  if (status.state !== 'ready')
    throw new Error(
      `OA sample generation incomplete (${status.state}): ${status.safeFailures.map((failure) => `${failure.key}:${failure.reason}`).join(', ')}`,
    );
}

/** Never print passwords. Replace a private file atomically, including on retries. */
export async function exportOaSampleAccess(app: Application): Promise<string> {
  const service = app.container.resolve(demoDataServiceToken);
  const status = await service.status();
  if (!status.datasetId || status.state !== 'ready')
    throw new Error('OA sample dataset is not ready.');
  const credentials = await service.credentials(
    status.datasetId,
    status.version,
  );
  const directory = app.paths.storage(`sample-data/${status.datasetId}`);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const destination = path.join(directory, 'access.json');
  const temporary = path.join(directory, `${randomUUID()}.tmp`);
  try {
    await writeFile(
      temporary,
      JSON.stringify({ datasetId: status.datasetId, ...credentials }, null, 2),
      { mode: 0o600, flag: 'wx' },
    );
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return destination;
}

export function oaSampleData(app: Application): SampleDataRegistration {
  return {
    name: 'oa/demo-data',
    packageName: 'nb3-oa',
    async run() {
      await ensureOaSample(
        app.container.resolve(demoDataServiceToken),
        resolveOaSampleLocale(app),
      );
      const accessFile = await exportOaSampleAccess(app);
      app.container
        .resolve(loggingToken)
        .getLogger('oa-sample-data')
        .info(
          { accessFile },
          'OA sample data ready; credentials saved to a private local file',
        );
    },
  };
}

/** Explicit content language is independent of the application's UI default. */
export function resolveOaSampleLocale(
  app: Pick<Application, 'config'>,
): DemoLocale {
  const explicit = app.config.get('app.sampleLocale');
  if (explicit !== undefined) {
    if (explicit === 'zh-CN' || explicit === 'en-US') return explicit;
    throw new Error('Invalid app.sampleLocale: use zh-CN or en-US.');
  }
  // Preserve the existing fallback for other application interface languages.
  return app.config.get('i18n.defaultLocale') === 'en-US' ? 'en-US' : 'zh-CN';
}

/** A separate history entry also enriches installations that already ran oa/demo-data. */
export function oaRoleCoverageSample(app: Application): SampleDataRegistration {
  return {
    name: 'oa/role-coverage-v1',
    packageName: 'nb3-oa',
    async run() {
      const service = app.container.resolve(demoDataServiceToken);
      await service.idle();
      const current = await service.status();
      if (current.state === 'absent')
        await ensureOaSample(service, resolveOaSampleLocale(app));
      else await service.useSamplePasswords();
      await service.enrichRoleCoverage();
      await exportOaSampleAccess(app);
    },
  };
}

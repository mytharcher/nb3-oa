import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { retireOwnedProcesses } from '../process-management/index.js';
import { hashKey } from './ownership.js';
import { createHash, randomUUID } from 'node:crypto';
import type { Application } from '@nocobase/app-server/application';
import {
  databaseManagerToken,
  type DatabaseConnection,
  type RepositoryRecord,
} from '@nocobase/db';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { loggingToken } from '@nocobase/app-server/logging';
import { calendarServiceToken } from '../platform/index.js';
import { auditServiceToken } from '../audit/index.js';
import { demoContext, registerDemoUser, type DemoContext } from './context.js';
import { generateDemo } from './generate.js';
import {
  cleanupBlocked,
  ownedRows,
  removeOwnedDemo,
  removeDemoFiles,
} from './cleanup.js';
import { demoError, sampleFailureReason } from './errors.js';
import type {
  DemoDataSet,
  DemoDataService,
  DemoStatus,
  DemoLocale,
} from './contract.js';
import { trialAccounts } from '../../../cli/commands/lib/trial-data/accounts.js';
import type { TrialPasswords } from '../../../cli/commands/lib/trial-data/passwords.js';

interface Control extends RepositoryRecord {
  id: string;
  datasetId: string | null;
  version: number;
  operationId: string | null;
  operation: 'import' | 'remove' | null;
  leaseUntil: Date | null;
  leaseToken: string | null;
}
const PURPOSE = 'nb3-oa/demo-data/credentials';
export function createDemoDataService(app: Application): DemoDataService {
  const db = app.container.resolve(databaseManagerToken),
    secrets = app.container.resolve(secretsServiceToken),
    calendar = app.container.resolve(calendarServiceToken);
  const logger = app.container.resolve(loggingToken).getLogger('oa-demo-data');
  const pending = new Map<string, Promise<void>>();
  const control = (tx: DatabaseConnection = db.connection()) =>
    tx
      .repository<Control>('demoDataControl')
      .findOne({ filter: { id: 'main' } })
      .then((c) => c!);
  const dataset = (id: string, tx: DatabaseConnection = db.connection()) =>
    tx
      .repository<DemoDataSet>('demoDataSets')
      .findOne({ filter: { id } })
      .then((d) => {
        if (!d) demoError('DEMO_NOT_FOUND', 'NOT_FOUND');
        return d;
      });
  async function status(): Promise<DemoStatus> {
    const c = await control();
    if (!c.datasetId)
      return {
        state: 'absent',
        version: c.version,
        timeZone: calendar.timeZone(),
        completedSteps: 0,
        totalSteps: 0,
        moduleCoverage: [],
        safeFailures: [],
        accounts: [],
      };
    const d = await dataset(c.datasetId);
    const counts = new Map<string, number>();
    for (const row of Object.values(d.scenarios))
      counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
    return {
      datasetId: d.id,
      locale: d.locale,
      baseDate: d.baseDate,
      timeZone: d.timeZone,
      state: d.state,
      version: c.version,
      completedSteps: Object.keys(d.scenarios).length,
      totalSteps: d.totalSteps,
      stage:
        d.state === 'ready'
          ? 'complete'
          : d.state === 'removing'
            ? 'removing'
            : d.state.endsWith('Failed')
              ? 'failed'
              : d.progress === 'initializing'
                ? 'preparing'
                : d.progress === 'complete'
                  ? 'validating'
                  : 'generating',
      importedAt: new Date(d.createdAt).toISOString(),
      moduleCoverage: [...counts].map(([key, count]) => ({ key, count })),
      safeFailures: d.failures,
      accounts: d.accounts.filter((a) => a.role !== 'system'),
    };
  }
  async function lock(tx: DatabaseConnection, expected: number) {
    const result = await tx.repository('demoDataControl').updateMany({
      filter: { id: 'main', version: expected },
      values: { version: { increment: 1 } },
    });
    if (result.updatedCount !== 1) demoError('DEMO_CHANGED');
    return control(tx);
  }
  function enqueue(id: string) {
    if (pending.has(id)) return;
    const work = execute(id)
      .catch((error) =>
        logger.error(
          {
            error: error instanceof Error ? error.name : 'Error',
            datasetId: id,
          },
          'Demo data job failed',
        ),
      )
      .finally(() => {
        pending.delete(id);
      });
    pending.set(id, work);
  }
  async function execute(id: string) {
    const acquired = await db.transaction(async (tx) => {
      const c = await control(tx);
      if (c.datasetId !== id || !c.operationId) return null;
      const now = new Date();
      const leaseToken = randomUUID();
      const r = await tx.repository('demoDataControl').updateMany({
        filter: (f) =>
          f.and([
            f.string('id').eq('main'),
            f.or([
              f.date('leaseUntil').empty(),
              f.date('leaseUntil').before(now),
            ]),
          ]),
        values: { leaseUntil: new Date(now.getTime() + 120000), leaseToken },
      });
      return r.updatedCount === 1 ? { ...c, leaseToken } : null;
    });
    if (!acquired) return;
    const d = await dataset(id);
    const identities = Object.fromEntries(
      d.accounts.map((a) => [a.role, a.id]),
    );
    const scope: DemoContext = {
      id,
      locale: d.locale,
      baseDate: d.baseDate,
      users: new Set(d.accounts.map((a) => a.id)),
      identities,
      operationToken: acquired.leaseToken,
    };
    const pulse = setInterval(() => {
      void db
        .repository('demoDataControl')
        .updateMany({
          filter: {
            id: 'main',
            datasetId: id,
            operationId: acquired.operationId,
            leaseToken: acquired.leaseToken,
          },
          values: { leaseUntil: new Date(Date.now() + 120000) },
        })
        .catch(() => {});
    }, 20000);
    pulse.unref();
    const stillOwner = () =>
      db.repository('demoDataControl').exists({
        filter: {
          id: 'main',
          datasetId: id,
          leaseToken: acquired.leaseToken,
        },
      });
    const gate = async (tx: DatabaseConnection) => {
      const locked = await tx.repository('demoDataControl').updateMany({
        filter: {
          id: 'main',
          datasetId: id,
          leaseToken: acquired.leaseToken,
        },
        values: { version: { increment: 0 } },
      });
      if (locked.updatedCount !== 1) throw new Error('DEMO_OPERATION_FENCED');
    };
    const save = async (patch: Partial<DemoDataSet>) =>
      db.transaction(async (tx) => {
        await gate(tx);
        await tx.repository('demoDataSets').updateOne({
          filter: { id },
          values: { ...patch, updatedAt: new Date() },
        });
      });
    try {
      await demoContext.run(scope, async () => {
        if (acquired.operation === 'import') {
          if (!d.credentials)
            demoError('DEMO_CREDENTIALS_UNAVAILABLE', 'UNAVAILABLE');
          const passwords = JSON.parse(
            secrets.open(d.credentials, { purpose: PURPOSE, aad: [id] }),
          ) as TrialPasswords;
          await generateDemo(app, d, passwords, save);
        } else {
          const rows = await ownedRows(db.connection(), id);
          await retireOwnedProcesses(
            app,
            rows
              .filter((r) => !r.shared && typeof r.key.id === 'string')
              .map((r) => ({ collection: r.collection, id: String(r.key.id) })),
            d.actorId,
            async (collection, recordId, connection) => {
              if (
                !(await (connection ?? db.connection())
                  .repository('demoDataRecords')
                  .exists({
                    filter: {
                      datasetId: id,
                      collection,
                      keyHash: hashKey({ id: recordId }),
                    },
                  }))
              )
                demoError('DEMO_OWNERSHIP_MISSING');
            },
          );
          scope.removing = true;
          await db.transaction(async (tx) => {
            await gate(tx);
            await removeOwnedDemo(app, id, d.actorId, tx);
            await tx.repository('demoDataSets').updateOne({
              filter: { id },
              values: {
                state: 'removing',
                credentials: null,
                accounts: [],
                progress: 'complete',
                updatedAt: new Date(),
              },
            });
            await app.container.resolve(auditServiceToken).record(
              {
                actorId: d.actorId,
                action: 'demoData.remove',
                targetType: 'demoDataSets',
                targetId: id,
                reason: 'Remove dataset-owned demonstration data',
              },
              tx,
            );
          });
          scope.retired = true;
          scope.removing = false;
          await removeDemoFiles(app, id);
          await db.transaction(async (tx) => {
            await gate(tx);
            await tx.repository('demoDataSets').updateOne({
              filter: { id },
              values: {
                state: 'absent',
                progress: 'complete',
                updatedAt: new Date(),
              },
            });
            await tx.repository('demoDataControl').updateOne({
              filter: { id: 'main' },
              values: {
                datasetId: null,
                operationId: null,
                operation: null,
                leaseUntil: null,
                leaseToken: null,
              },
            });
          });
        }
      });
      await db.repository('demoDataOperations').updateMany({
        filter: { id: acquired.operationId! },
        values: { state: 'complete' },
      });
    } catch (error) {
      if (!(await stillOwner())) return;
      const failed =
        acquired.operation === 'import' ? 'importFailed' : 'removeFailed';
      await save({
        state: failed,
        failures: [
          {
            key: 'operation',
            reason: sampleFailureReason(error, 'DEMO_OPERATION_FAILED'),
          },
        ],
        progress: 'failed',
      });
      await db.repository('demoDataOperations').updateMany({
        filter: { id: acquired.operationId! },
        values: { state: 'failed' },
      });
      logger.warn(
        {
          datasetId: id,
          error: error instanceof Error ? error.message : 'Error',
        },
        'Demo data operation needs attention',
      );
    } finally {
      delete scope.operationToken;
      clearInterval(pulse);
      await db.repository('demoDataControl').updateMany({
        filter: {
          id: 'main',
          datasetId: id,
          operationId: acquired.operationId,
          leaseToken: acquired.leaseToken,
        },
        values: {
          operationId: null,
          operation: null,
          leaseUntil: null,
          leaseToken: null,
        },
      });
    }
  }
  function opId(actor: string, key: string, kind: string) {
    return createHash('sha256')
      .update(JSON.stringify([actor, key, kind]))
      .digest('hex');
  }
  async function startImport(
    input: { locale: DemoLocale; expectedVersion: number; requestKey: string },
    actorId: string,
  ) {
    if (!secrets.ready) demoError('DEMO_SECRETS_UNAVAILABLE', 'UNAVAILABLE');
    const operationId = opId(actorId, input.requestKey, 'import');
    let target = '';
    await db.transaction(async (tx) => {
      const prior = await tx
        .repository('demoDataOperations')
        .findOne({ filter: { id: operationId } });
      if (prior) {
        if (typeof prior.datasetId !== 'string')
          demoError('DEMO_INVALID_OPERATION');
        if ((await dataset(prior.datasetId, tx)).locale !== input.locale)
          demoError('DEMO_IDEMPOTENCY_CONFLICT');
        target = prior.datasetId;
        return;
      }
      const c = await lock(tx, input.expectedVersion);
      if (c.operationId) demoError('DEMO_BUSY');
      if (c.datasetId) {
        const d = await dataset(c.datasetId, tx);
        if (d.state !== 'importFailed' || d.locale !== input.locale)
          demoError('DEMO_ALREADY_IMPORTED');
        target = d.id;
        await tx.repository('demoDataSets').updateOne({
          filter: { id: target },
          values: { state: 'importing', failures: [] },
        });
      } else {
        target = `demo-${randomUUID()}`;
        const passwords = Object.fromEntries(
          [...trialAccounts.map((a) => a.key), 'newhire'].map((key) => [
            key,
            '12345678',
          ]),
        ) as TrialPasswords;
        await tx.repository('demoDataSets').createOne({
          values: {
            id: target,
            locale: input.locale,
            baseDate: calendar.localDate(new Date()),
            timeZone: calendar.timeZone(),
            state: 'importing',
            version: c.version,
            actorId,
            accounts: [],
            totalSteps: 0,
            scenarios: {},
            failures: [],
            credentials: secrets.seal(JSON.stringify(passwords), {
              purpose: PURPOSE,
              aad: [target],
            }),
            progress: 'initializing',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
      await tx.repository('demoDataControl').updateOne({
        filter: { id: 'main' },
        values: {
          datasetId: target,
          operationId,
          operation: 'import',
          leaseUntil: null,
        },
      });
      await tx.repository('demoDataOperations').createOne({
        values: {
          id: operationId,
          datasetId: target,
          kind: 'import',
          state: 'running',
          createdAt: new Date(),
        },
      });
      await app.container.resolve(auditServiceToken).record(
        {
          actorId,
          action: 'demoData.import',
          targetType: 'demoDataSets',
          targetId: target,
          reason: 'Import fictional business scenarios',
        },
        tx,
      );
    });
    enqueue(target);
    return { ...(await status()), operationId };
  }
  return {
    status,
    async useSamplePasswords() {
      await db.transaction(async (tx) => {
        const c = await control(tx);
        if (!c.datasetId) return;
        if (c.operationId) demoError('DEMO_BUSY');
        await lock(tx, c.version);
        const d = await dataset(c.datasetId, tx);
        if (!d.credentials)
          demoError('DEMO_CREDENTIALS_UNAVAILABLE', 'UNAVAILABLE');
        const passwords = JSON.parse(
          secrets.open(d.credentials, { purpose: PURPOSE, aad: [d.id] }),
        ) as Record<string, string>;
        const users = app.container
          .resolve(userAdministrationServiceToken)
          .withConnection(tx);
        for (const account of d.accounts) {
          if (
            account.role === 'system' ||
            passwords[account.role] === '12345678'
          )
            continue;
          const owned = await tx.repository('demoDataRecords').exists({
            filter: {
              datasetId: d.id,
              collection: '@user',
              keyHash: hashKey({ id: account.id }),
            },
          });
          if (!owned) demoError('DEMO_OWNERSHIP_MISSING');
          await users.resetPassword(account.id, '12345678');
          await app.container.resolve(auditServiceToken).record(
            {
              actorId: null,
              action: 'sampleData.resetPassword',
              targetType: 'user',
              targetId: account.id,
              reason: 'Apply the requested sample account password',
            },
            tx,
          );
        }
        for (const role of Object.keys(passwords)) {
          if (role !== 'system') passwords[role] = '12345678';
        }
        await tx.repository('demoDataSets').updateOne({
          filter: { id: d.id },
          values: {
            credentials: secrets.seal(JSON.stringify(passwords), {
              purpose: PURPOSE,
              aad: [d.id],
            }),
            updatedAt: new Date(),
          },
        });
      });
    },
    async presence() {
      const s = await status();
      return {
        present: s.state !== 'absent',
        busy: ['importing', 'removing'].includes(s.state),
      };
    },
    import: startImport,
    async preview(input) {
      const c = await control();
      if (
        c.datasetId !== input.datasetId ||
        c.version !== input.expectedVersion
      )
        demoError('DEMO_CHANGED');
      if (c.operationId) demoError('DEMO_BUSY');
      const rows = await ownedRows(db.connection(), input.datasetId);
      const blocked = await cleanupBlocked(db.connection(), input.datasetId);
      const previewToken = randomUUID();
      await db.repository('demoDataPreviews').createOne({
        values: {
          id: previewToken,
          datasetId: input.datasetId,
          version: c.version,
          expiresAt: new Date(Date.now() + 300000),
        },
      });
      return {
        previewToken,
        records: rows.filter((r) => !r.shared && r.collection !== '@user')
          .length,
        accounts: rows.filter((r) => r.collection === '@user').length,
        blocked,
        version: c.version,
      };
    },
    async remove(input, actorId) {
      const operationId = opId(actorId, input.requestKey, 'remove');
      await db.transaction(async (tx) => {
        if (
          await tx
            .repository('demoDataOperations')
            .exists({ filter: { id: operationId } })
        )
          return;
        const c = await lock(tx, input.expectedVersion);
        if (c.datasetId !== input.datasetId) demoError('DEMO_CHANGED');
        if (c.operationId) demoError('DEMO_BUSY');
        const preview = await tx.repository('demoDataPreviews').findOne({
          filter: {
            id: input.previewToken,
            datasetId: input.datasetId,
            version: input.expectedVersion,
          },
        });
        if (
          !preview ||
          new Date(preview.expiresAt as string).getTime() < Date.now()
        )
          demoError('DEMO_PREVIEW_EXPIRED');
        if (await cleanupBlocked(tx, input.datasetId))
          demoError('DEMO_REFERENCE_CONFLICT');
        await tx.repository('demoDataSets').updateOne({
          filter: { id: input.datasetId },
          values: { state: 'removing', actorId, failures: [] },
        });
        await tx.repository('demoDataControl').updateOne({
          filter: { id: 'main' },
          values: { operationId, operation: 'remove', leaseUntil: null },
        });
        await tx.repository('demoDataOperations').createOne({
          values: {
            id: operationId,
            datasetId: input.datasetId,
            kind: 'remove',
            state: 'running',
            createdAt: new Date(),
          },
        });
      });
      enqueue(input.datasetId);
      return { ...(await status()), operationId };
    },
    async credentials(id, version) {
      const c = await control();
      if (c.datasetId !== id || c.version !== version)
        demoError('DEMO_CHANGED');
      const d = await dataset(id);
      if (!d.credentials)
        demoError('DEMO_CREDENTIALS_UNAVAILABLE', 'UNAVAILABLE');
      const passwords = JSON.parse(
        secrets.open(d.credentials, { purpose: PURPOSE, aad: [id] }),
      ) as Record<string, string>;
      return {
        accounts: d.accounts
          .filter((a) => a.role !== 'system')
          .map((a) => ({ ...a, password: passwords[a.role] })),
      };
    },
    async resume() {
      const c = await control();
      if (c.datasetId) {
        const d = await dataset(c.datasetId);
        const scope: DemoContext = {
          id: d.id,
          locale: d.locale,
          baseDate: d.baseDate,
          users: new Set(d.accounts.map((a) => a.id)),
          identities: Object.fromEntries(d.accounts.map((a) => [a.role, a.id])),
        };
        for (const a of d.accounts) registerDemoUser(a.id, scope);
        if (
          c.operationId &&
          (!c.leaseUntil || new Date(c.leaseUntil).getTime() < Date.now())
        )
          enqueue(d.id);
      }
    },
    async idle() {
      await Promise.all([...pending.values()]);
    },
  };
}

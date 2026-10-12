import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { PrintDataSource } from '../template-print/contract.js';
import { sourceFields } from '../template-print/sources.js';
import { TemplatePrintError } from '../template-print/validation.js';
import type { SealService, SealRegistrationAccess } from './contract.js';
import { SealError } from './errors.js';
export function createSealRegistrationPrintSource(d: {
  db: DatabaseManager;
  authz: AppAuthorization;
  service: () => SealService;
}): PrintDataSource {
  return {
    name: 'sealRegistration',
    schemaVersion: 1,
    collection: 'sealLedger',
    viewResource: 'oa.sealLedger',
    fields: sourceFields.sealRegistration,
    async load({ recordId, actorId, policy, paths }) {
      if (paths.some((p) => !(p in sourceFields.sealRegistration)))
        throw new TemplatePrintError('PRINT_FIELDS_DENIED');
      const principal = { type: 'user', id: actorId },
        subjects = [
          { type: 'authenticated', id: '*' },
          ...(await d.authz.subjects.resolveFor(principal)),
        ],
        current = d.authz.for({ principal, subjects });
      async function resolve(
        resource: string,
        action: string,
        collection: string,
      ) {
        const decision = await current.authorize({
            resource: { type: 'composite', id: resource },
            action,
          }),
          granted =
            decision.effect === 'deny'
              ? undefined
              : (
                  decision.conditions?.database as
                    | Record<string, RepositoryPolicy | false | undefined>
                    | undefined
                )?.[collection];
        if (!granted) throw new TemplatePrintError('PRINT_RECORD_DENIED');
        return granted;
      }
      // Resolve current authorization outside the owner transaction, including any SDK-readable scope resolver.
      const ordinary: SealRegistrationAccess = {
          ledger: await resolve('oa.sealLedger', 'view', 'sealLedger'),
          receipts: await resolve('oa.sealLedger', 'view', 'sealReceipts'),
          requests: await resolve('oa.sealRequests', 'view', 'sealRequests'),
        },
        printing: SealRegistrationAccess = {
          ledger: await resolve(
            'oa.templatePrint',
            'printSealRegistration',
            'sealLedger',
          ),
          receipts: await resolve(
            'oa.templatePrint',
            'printSealRegistration',
            'sealReceipts',
          ),
          requests: await resolve(
            'oa.templatePrint',
            'printSealRegistration',
            'sealRequests',
          ),
        };
      try {
        return await d.db.transaction(async (tx) => {
          const service = d.service();
          await service.printRegistration(recordId, actorId, tx, printing);
          await service.printRegistration(recordId, actorId, tx, ordinary);
          return {
            ...(await service.printRegistration(recordId, actorId, tx, {
              ...ordinary,
              ledger: policy,
            })),
          };
        });
      } catch (error) {
        if (error instanceof SealError)
          throw new TemplatePrintError(
            error.code === 'ACCESS_DENIED'
              ? 'PRINT_RECORD_DENIED'
              : 'PRINT_SOURCE_UNAVAILABLE',
          );
        throw error;
      }
    },
  };
}

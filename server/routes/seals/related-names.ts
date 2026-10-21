import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { ContractLedgerService } from '../../providers/contracts/contract.js';
import type {
  SealRequest,
  SealService,
  SealRegistrationAccess,
} from '../../providers/seals/contract.js';
import { SealError } from '../../providers/seals/errors.js';

/** Optional metadata keeps each source's own policy; it never controls request visibility. */
export async function readSealRelatedNames(
  record: Pick<SealRequest, 'id' | 'contractId' | 'sealId' | 'ledgerId'>,
  actorId: string,
  connection: DatabaseConnection,
  services: {
    contracts: Pick<ContractLedgerService, 'names'>;
    seals: Pick<SealService, 'instanceNames' | 'ledgerDetail'>;
  },
  policies: {
    contract?: RepositoryPolicy;
    seal?: RepositoryPolicy;
    ledger?: SealRegistrationAccess;
  },
) {
  const contractNames = await services.contracts.names(
    record.contractId ? [record.contractId] : [],
    policies.contract,
    connection,
  );
  let sealName: string | null = null;
  let registrationSourceNumber: string | null = null;
  if (record.sealId) {
    sealName =
      (
        await services.seals.instanceNames(
          [record.sealId],
          connection,
          policies.seal,
        )
      ).get(record.sealId) ?? null;
  }
  if (record.ledgerId && policies.ledger) {
    try {
      const detail = await services.seals.ledgerDetail(
        record.ledgerId,
        actorId,
        connection,
        policies.ledger,
      );
      if (
        detail.record.id === record.ledgerId &&
        detail.request.id === record.id
      )
        registrationSourceNumber = detail.request.number;
    } catch (error) {
      if (!(error instanceof SealError) || error.code !== 'ACCESS_DENIED')
        throw error;
    }
  }
  return {
    contractName: record.contractId
      ? (contractNames.get(record.contractId) ?? null)
      : null,
    sealName,
    registrationSourceNumber,
  };
}

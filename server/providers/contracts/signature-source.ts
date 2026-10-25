import type { NocoBaseDriveManager } from '@nocobase/drive';
import type { ContractLedgerService } from './contract.js';
import type { OrgService } from '../org/contract.js';
import type { SignatureSourceService } from '../electronic-signatures/contract.js';
import {
  readSignaturePdf,
  type SignatureStoredFile,
} from '../electronic-signatures/file.js';
import type { ContractRequest } from './types.js';
import { digest } from '../electronic-signatures/gateway.js';
export function createContractSignatureSource(
  ledger: ContractLedgerService,
  org: OrgService,
  drive: NocoBaseDriveManager,
): SignatureSourceService {
  return {
    async source(id, actorId, access, tx, send) {
      const visible = await tx
        .repository<ContractRequest>('contractRequests')
        .withPolicy(access.view)
        .findOne({ filter: { id } });
      const required = [
        'id',
        'contractId',
        'textVersionId',
        'status',
        'number',
        'operation',
        'baseVersion',
      ];
      if (!visible || required.some((key) => !(key in visible)))
        throw new Error('SIGNATURE_ACCESS_DENIED');
      const row = visible as ContractRequest;
      if (send && !(await org.hasDutyRole(actorId, 'legal', tx)))
        throw new Error('SIGNATURE_ACCESS_DENIED');
      await ledger.lockSources([row.contractId], tx);
      const current = await ledger.source(row.contractId, tx);
      const published = await tx
        .repository<{ version: number; contractId: string; requestId: string }>(
          'contractVersions',
        )
        .findOne({ filter: { contractId: row.contractId, requestId: id } });
      if (!published) throw new Error('SIGNATURE_NOT_ELIGIBLE');
      if (
        send === true &&
        (row.status !== 'approved' ||
          row.operation === 'terminate' ||
          !current ||
          current.requestId !== id ||
          !['activePendingSeal', 'active'].includes(current.status) ||
          current.facts.textVersionId !== row.textVersionId)
      )
        throw new Error('SIGNATURE_NOT_ELIGIBLE');
      const version = await tx
        .repository('contractTextVersions')
        .findOne({ filter: { id: row.textVersionId!, requestId: id } });
      if (!version || typeof version.fileId !== 'string')
        throw new Error('SIGNATURE_PDF_REQUIRED');
      const file = await tx
        .repository<SignatureStoredFile>('contractAttachmentFiles')
        .findOne({
          filter: { id: version.fileId, requestId: id, purpose: 'text' },
        });
      if (!file) throw new Error('SIGNATURE_PDF_REQUIRED');
      return {
        kind: 'contract',
        id,
        version: String(published.version),
        number: row.number,
        filename: file.filename,
        bytes: await readSignaturePdf(drive, file),
        contractId: row.contractId,
        contractVersion: Number(published.version),
        textVersionId: row.textVersionId,
      };
    },
    async finalize(source, proof, actorId, access, tx) {
      const current = await this.source(source.id, actorId, access, tx, true);
      if (
        current.version !== source.version ||
        digest(current.bytes) !== proof.documentHash
      )
        throw new Error('SIGNATURE_SOURCE_CHANGED');
      await ledger.confirmSealed(
        {
          contractId: current.contractId!,
          expectedVersion: current.contractVersion!,
          sealRecordId: proof.envelopeId,
          actorId,
          requestKey: `electronic-contract:${proof.envelopeId}`,
          reason: 'Verified electronic signature archived',
        },
        async () => ({
          contractId: current.contractId!,
          contractVersion: current.contractVersion!,
          sealRecordId: proof.envelopeId,
          sealedAt: new Date(proof.signedAt),
          status: 'completed',
        }),
        tx,
      );
    },
  };
}

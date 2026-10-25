import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export interface SignatureSource {
  kind: 'contract' | 'seal';
  id: string;
  version: string;
  number: string | null;
  filename: string;
  bytes: Buffer;
  contractId: string | null;
  contractVersion: number | null;
  textVersionId: string | null;
}
export interface VerifiedSignature {
  envelopeId: string;
  fileId: string;
  externalId: string;
  documentHash: string;
  signedHash: string;
  signedAt: string;
}
export interface SignatureSourceAccess {
  view: RepositoryPolicy;
  operate?: RepositoryPolicy;
  ledger?: RepositoryPolicy;
  contractView?: RepositoryPolicy;
}
export interface SignatureSourceService {
  source(
    id: string,
    actorId: string,
    access: SignatureSourceAccess,
    tx: DatabaseConnection,
    send: boolean | 'recover',
  ): Promise<SignatureSource>;
  finalize(
    source: SignatureSource,
    proof: VerifiedSignature,
    actorId: string,
    access: SignatureSourceAccess,
    tx: DatabaseConnection,
  ): Promise<void>;
}
export const contractSignatureSourceToken =
  createServiceToken<SignatureSourceService>('oa/contracts-signature-source');
export const sealSignatureSourceToken =
  createServiceToken<SignatureSourceService>('oa/seals-signature-source');

import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
export interface Invoice {
  id: string;
  number: string;
  state: 'available' | 'held' | 'used';
  documentId: string | null;
  lineId: string | null;
  applicantId: string | null;
  cents: number;
  attachmentIds: string[];
  version: number;
}
export interface InvoiceLine {
  lineId: string;
  invoiceNumber: string;
  cents: number;
  attachmentIds: string[];
}
export interface InvoiceCommand {
  documentId: string;
  actorId: string;
  reason: string;
  requestKey: string;
}
export interface InvoiceService {
  /** Submission/revision synchronizes the held set; returned flows retain it until this explicit revision. */
  reserveLines(
    input: InvoiceCommand & { applicantId: string; lines: InvoiceLine[] },
    connection: DatabaseConnection,
  ): Promise<Invoice[]>;
  /** Cash completion, atomic with payment and related budget/loan writes. */
  useDocument(
    input: InvoiceCommand,
    connection: DatabaseConnection,
  ): Promise<Invoice[]>;
  /** Terminal withdraw/reject/terminate; a released document cannot reserve again. */
  releaseDocument(
    input: InvoiceCommand,
    connection: DatabaseConnection,
  ): Promise<Invoice[]>;
  /** Only a trusted business service that already checked the source record/attachment field may expose these. */
  forDocument(
    documentId: string,
    connection?: DatabaseConnection,
  ): Promise<Invoice[]>;
}
export const invoiceServiceToken =
  createServiceToken<InvoiceService>('oa/invoice-service');

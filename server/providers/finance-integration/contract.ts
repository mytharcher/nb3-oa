/** Accounting facts contributed by each business owner after its record and field guards. */
export interface FinanceSourceFact {
  id: string;
  number: string;
  applicantId: string;
  departmentId: string | null;
  vendorId?: string | null;
  purchaseOrderId?: string | null;
  contractId?: string | null;
  amountCents: number;
  offsetCents: number;
  paidCents: number;
  forced: boolean;
  lines: {
    category: string;
    date: string;
    amountCents: number;
    invoiceNumber: string;
  }[];
}

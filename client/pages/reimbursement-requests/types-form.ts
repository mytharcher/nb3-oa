export interface FormOptions {
  actorId: string;
  applicantId: string;
  timeZone: string;
  paymentAccountComplete: boolean;
  categories: {
    code: string;
    label: Record<string, string>;
    active: boolean;
    extra: Record<string, unknown> | null;
  }[];
  authorizations: {
    id: string;
    sourceReference: string;
    sourceKind: string;
    availableCents: number;
  }[];
  loans: {
    id: string;
    sourceId: string;
    availableCents: number;
    outstandingCents: number;
  }[];
}

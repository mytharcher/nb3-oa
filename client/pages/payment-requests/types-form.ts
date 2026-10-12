export type { PaymentFormValues } from './form-model.js';
export interface PaymentAccount {
  requestId: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  version: number;
}

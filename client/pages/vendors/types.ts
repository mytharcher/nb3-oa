export const RESOURCE = 'oa.vendors';
export interface Vendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string;
  status: 'manual' | 'qualified' | 'disabled';
  active: boolean;
  version: number;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
export interface VendorPage {
  data: Vendor[];
  meta: { page: number; pageSize: number; total: number };
}
export interface VendorContext {
  onSaved: () => void;
}

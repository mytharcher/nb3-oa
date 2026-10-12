export const SETTINGS = 'oa.financeAssignments';
export interface Person {
  id: string;
  name: string;
}
export interface Assignment {
  id: string;
  departmentId: string;
  accountantId: string;
  active: boolean;
  version: number;
  updatedAt: string;
  department: { id: string; title: string };
  accountant: Person;
}
export interface Page {
  data: Assignment[];
  meta: { page: number; pageSize: number; total: number };
}
export interface Context {
  onSaved: () => void;
}

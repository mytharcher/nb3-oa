import { createContext, useContext } from 'react';
interface Context {
  recordId: string | null;
  recordLabel: string | null;
  setRecordLabel: (label: string | null) => void;
  setRecordId: (id: string | null) => void;
  drafts: Record<string, string>;
  setDraft: (id: string, value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
}
export const ApprovalAssistantContext = createContext<Context | null>(null);
export const useApprovalAssistant = () => useContext(ApprovalAssistantContext);

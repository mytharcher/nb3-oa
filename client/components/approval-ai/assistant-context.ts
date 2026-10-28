import type {
  ReviewReference,
  ReviewView,
} from '../../../shared/approval-ai.js';
import { createContext, useContext } from 'react';
export interface ReviewConversationTarget extends ReviewReference {
  title: string;
  recordLabel?: string | null;
  model: ReviewView['model'];
}
interface Context {
  review: ReviewConversationTarget | null;
  setReview: (review: ReviewConversationTarget) => void;
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

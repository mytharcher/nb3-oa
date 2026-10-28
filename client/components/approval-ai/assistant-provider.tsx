import { useState, type ReactNode } from 'react';
import { ChatProvider } from '@nocobase/app-plugin-agents/client/chat';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  ApprovalAssistantContext as Context,
  type ReviewConversationTarget,
} from './assistant-context.js';
export function ApprovalAssistantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { session } = useAuthentication();
  return (
    <AssistantState key={session?.user.id ?? 'anonymous'}>
      {children}
    </AssistantState>
  );
}
function AssistantState({ children }: { children: ReactNode }) {
  const [review, setReview] = useState<ReviewConversationTarget | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null),
    [recordLabel, setRecordLabel] = useState<string | null>(null),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [open, setOpen] = useState(false);
  return (
    <ChatProvider>
      <Context.Provider
        value={{
          review,
          setReview,
          recordId,
          recordLabel,
          setRecordLabel,
          setRecordId,
          drafts,
          setDraft: (id, value) =>
            setDrafts((old) => ({ ...old, [id]: value })),
          open,
          setOpen,
        }}
      >
        {children}
      </Context.Provider>
    </ChatProvider>
  );
}

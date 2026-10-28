# Approval assistant shell composition

The application mounts ApprovalAssistantProvider once around the business shell for user-isolated opinion drafts and the report follow-up drawer. There is no global HeaderActions launcher or generic contract launcher. Only successfully generated AI review cards offer “Ask about suggestion”. Do not restore the global entry until all approval businesses support one coherent conversation.

The drawer binds lifecycle, record, task and generation timestamp at opening, and resets its conversation when that identity changes. References are identifiers, never authorization: the dedicated tool reloads the current user's review through the existing handler/delegate and record guards, and rejects replaced results. It explains saved findings, quoted evidence and coverage, not full attachments or live policy documents. Keep navigation, theme, language and sign-out unchanged.

Opinion drafts live only in memory, are keyed by signed-in user and record, and require explicit insertion into the existing approval form. They never submit a decision. General-purpose tools remain registered for future integration; the old broad scope no longer selects them.

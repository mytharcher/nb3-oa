# Approval suggestions shell composition

All registered OA approval businesses mount the shared `ApprovalAiReviewPanel` in their authorized detail surface. It adapts the Approval plugin's native suggestion status to the OSS UI Library `ApprovalReviewCard`. The plugin owns generation, cancellation, storage and worker recovery; the application owns business and material access checks.

The shell mounts no legacy ApprovalAssistantProvider, follow-up drawer or opinion-draft store. The released Approval plugin no longer exports those conversation helpers. Preserve historical migrations, saved results, bindings and Agents conversations without presenting them as native suggestion versions. Other Agents entry points and the application's navigation, theme, language and sign-out remain application-owned.

Opening, refreshing, selecting versions and reconnecting only reread authorized state. Generation and retry require an explicit user operation, except for the plugin's committed task-activation automation. Failed status revalidation clears displayed reports and versions. A generation failure may retain an independently authorized previous successful report. AI never submits an approval decision or writes business content.

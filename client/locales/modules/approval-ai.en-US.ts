export default {
  approvalAi: {
    generationFailed:
      'Unable to generate a suggestion. You can retry; approval remains available.',
    nativeSettingsDescription:
      'AI suggestions are available across all approval processes and never block human decisions.',
    nativeModelHint:
      'Configure a default model in Model services. Suggestions use the assigned approver’s saved language.',
    nativeCoverageHint:
      'Automatic suggestions review submitted fields. Manual generation can include accessible knowledge documents. Existing tasks are not automatically backfilled after model configuration.',
    prerequisites: {
      model_unconfigured:
        'An administrator must configure a default model before suggestions can be generated. Refresh after setup.',
      services_unavailable:
        'AI suggestions are temporarily unavailable. Refresh to check again; approval can continue.',
    },

    generateSuggestion: 'Generate AI suggestion',
    notGeneratedHint:
      'No AI suggestion has been generated. Eligible current approvers can request one. You can continue the approval without it.',

    versionCount: '{{current}} / {{count}}',
    version: 'Version {{count}}',
    latestVersion: '(latest)',
    latestRunActions: 'Actions apply to the current generation.',
    cancelGeneration: 'Cancel generation',
    cancelling: 'Cancelling…',

    conversationHistory: 'Conversations',
    conversationScope:
      'Only your conversations for this record and approval step.',
    noConversations: 'No conversations yet',
    earlierConversation:
      'Earlier review, read only. Start a new conversation for the latest review.',
    moreConversations: 'Load more',

    expandReport: 'Expand details',
    collapseReport: 'Collapse details',
    findings: 'Review findings',
    generatedAt: 'Generated at',
    noFindings: 'No findings available',
    noMaterials:
      'No review materials recorded. Verify against the original materials.',
    coverageCounts:
      'Read {{read}} · Unsupported {{unsupported}} · Missing {{missing}}',
    reviewPrivacy:
      'AI generated, for reference only. Approval can continue independently. Materials are read with your permissions; this suggestion is visible only to you.',
    historyReadOnly: 'Suggestion from a completed task, for reference only.',
    materialKinds: {
      field: 'Application field',
      text: 'Text',
      attachment: 'Attachment',
      knowledge: 'Review basis',
      record: 'Business record',
      aggregate: 'Aggregate data',
    },
    stateHints: {
      cancelled: 'Generation was cancelled. You can generate again.',
      none: 'No suggestion yet. Generate one manually; approval can continue.',
      queued:
        'Waiting for processing. You can handle the approval without waiting.',
      running:
        'Generating a suggestion; updates every 5 seconds. You can continue with approval.',
      failed:
        'The suggestion could not be generated. Retry when available; approval can continue.',
      skipped:
        'Generation was skipped. Check the reason; approval can continue.',
    },
    loading: 'Loading',
    definitionMissing: 'Configuration does not exist or is inaccessible.',
    settingsSaved: 'Configuration saved',
    disable: 'Disable',

    contextContract: 'Contract: {{name}}',
    noContextContract:
      'No contract is selected. Open a contract and start a new conversation to include it.',
    contextChanged:
      'This conversation still refers to its original contract. Start a new conversation for the current page.',
    draftTruncated:
      'This draft is longer than 5,000 characters. Inserting it uses the first 5,000; review the complete reply before submitting.',
    discardTitle: 'Discard unsaved changes?',
    discardDescription:
      'Changes to this review configuration have not been saved.',
    discard: 'Discard',

    assistant: 'Approval assistant',
    assistantDescription:
      'Ask about this review’s findings, cited evidence and coverage limits. Review and submit any opinion draft yourself.',
    assistantModelMissing:
      'No model is configured. Ask an administrator to configure Model services in System management.',
    askReview: 'Ask about suggestion',
    currentRecord: 'Current record',
    reviewContext: '{{title}} · Record {{record}}',
    startConversation: 'Start conversation',
    newConversation: 'New conversation',
    close: 'Close',
    you: 'You',
    useDraft: 'Save as opinion draft',
    draftReady:
      'Draft kept in this browser session. Use “Insert AI draft” in the approval form, then review and submit.',
    insertDraft: 'Insert AI draft',
    composer: {
      label: 'Message',
      placeholder: 'Ask about an approval…',
      hint: 'Enter to send',
      runningHint: 'Generating a reply…',
      tooLong: 'Message exceeds {max} characters',
      send: 'Send',
      stop: 'Stop',
      stopping: 'Stopping…',
      contextLabel: 'Context',
      contextFilter: 'Filter: {filter}',
      contextSelection: 'Selection: {text}',
      contextRemove: 'Remove {label}',
      attach: 'Attach file',
      attachmentsLabel: 'Attachments',
      attachmentRemove: 'Remove {name}',
      attachmentUploading: 'Uploading…',
      attachmentTooLarge: 'File exceeds {max}',
      attachmentFailed: 'Upload failed',
      attachmentsTooMany: 'At most {max} files',
      attachmentsBlocked: 'Check attachments before sending',
      attachmentsWaiting: 'Waiting for attachments',
    },
    title: 'AI approval assistance',
    configure: 'AI review settings',
    definition: 'Review definition',
    enabled: 'Enabled',
    model: 'Model',
    noModel: 'No model selected',
    noBasis: 'No document selected',
    required: 'Required basis',
    timeout: 'Timeout (seconds)',
    refresh: 'Refresh',
    reload: 'Reload latest configuration',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    generate: 'Generate suggestion',
    regenerate: 'Generate again',
    submittingGeneration: 'Submitting generation request…',
    generationRequested: 'Generation requested.',
    retry: 'Retry',
    advisory: 'For reference only. The decision remains yours.',
    stage: 'Stage',
    assignee: 'Assigned handler',
    delegate: 'Delegate',
    history: 'Historical suggestion',
    evidence: 'Evidence',
    coverage: 'Material coverage',
    pollPaused:
      'Automatic refresh paused after five minutes. Refresh to check again.',
    unavailable: 'Unavailable or no longer accessible',
    requestFailed: 'Unable to load AI assistance. Please try again.',
    conflict:
      'The task or configuration changed. Your input is retained. Reload before trying again.',
    settingsDescription:
      'Choose a model and review basis for each review definition. Suggestions never block approval.',
    modelHint:
      'Models are maintained in Agents model services. No model means generation is skipped.',
    searchBasis: 'Search knowledge documents',
    basisHint:
      'Only documents visible to you can be selected. Each handler must independently be able to read the basis.',
    newOnly:
      'Changes affect future generation. Existing suggestions remain available.',
    on: 'Enabled',
    off: 'Disabled',
    noDefinitions: 'No review definitions registered.',
    disableTitle: 'Disable {{name}}?',
    disableDescription:
      'New suggestions will no longer be generated. Existing suggestions are retained.',
    contractTitle: 'Contract legal and finance review',
    contractBasis: 'Contract review guidelines',
    contractText: 'Contract text',
    requiredBasisMissing:
      'Required review basis is missing or inaccessible. This check is not covered.',
    checks: {
      parties: 'Parties and signing entities',
      payment: 'Amount and payment terms',
      liability: 'Liability and termination',
      term: 'Term and renewal',
    },
    statuses: {
      cancelled: 'Cancelled',
      none: 'Not generated',
      queued: 'Queued',
      running: 'Generating',
      succeeded: 'Ready',
      failed: 'Generation failed',
      skipped: 'Not generated',
    },
    verdicts: {
      conforms: 'Conforms',
      nonconforming: 'Nonconforming',
      needs_verification: 'Needs verification',
      not_covered: 'Not covered',
    },
    materialStatuses: {
      read: 'Read',
      not_supported: 'Unsupported',
      missing: 'Missing or inaccessible',
    },
    errors: {
      CONVERSATION_PENDING:
        'Conversation creation is not confirmed. Refresh to check before starting another conversation.',
      NOT_FOUND: 'Suggestion not found or inaccessible.',
      CONFLICT: 'The task or configuration changed. Reload and try again.',
      INVALID_SETTINGS: 'Check the model, basis documents and settings.',
      disabled: 'AI review is disabled.',
      task_closed: 'The task was processed before generation.',
      assignee_inactive:
        'The handler is inactive or no longer handles this task.',
      no_access: 'Unable to read the application.',
      no_model: 'An administrator has not configured a model.',
      gather_failed: 'Unable to read review materials.',
      timeout: 'Model response timed out.',
      rate_limited: 'Model service is busy.',
      network: 'Model service is unavailable.',
      model_config: 'Model configuration is invalid.',
      quota: 'Model quota is exhausted.',
      context_overflow: 'Materials exceed the model context limit.',
      filtered: 'The model filtered the content.',
      bad_request: 'The model service rejected the request.',
      invalid_output: 'The model returned an invalid result.',
      unknown: 'Unable to generate a suggestion.',
    },
  },
};

export default {
  electronicSignatures: {
    archivedHint:
      'The signing service confirmed completion. The verified signed PDF has been archived with this request.',
    reference: 'Signing reference: {{value}}',
    completedAction: 'Electronic signature archived',
    title: 'Electronic signing',
    readPermission: 'View signed documents',
    sendPermission: 'Send and recover signing',
    channel: 'Execution channel',
    physical: 'Physical seal',
    electronic: 'Electronic signature',
    channelHint:
      'Choose before approval. Electronic signing requires one approved PDF and has no paper-copy count.',
    hint: 'The approved PDF is sent to the configured signing service. Completion is confirmed only after its signed document is verified and archived.',
    notConfigured:
      'Electronic signing has not been connected. Contact your administrator.',
    notEligible:
      'Signing needs an approved, current document in PDF format. Electronic seal requests must contain exactly one PDF.',
    loadFailed: 'Signature status could not be loaded, or you cannot view it.',
    actionFailed:
      'The action could not be completed. Refresh the status before trying again.',
    retry: 'Retry',
    send: 'Send for signing',
    refresh: 'Check status / recover',
    open: 'Continue signing',
    download: 'Download signed PDF',
    recovery:
      'The remote result or archive needs confirmation. Check status to recover the same signing request.',
    signedAt: 'Signed {{at}}',
    confirmTitle: 'Send this approved PDF for signing?',
    confirmHint:
      'The configured signing service receives the approved document. Retrying uses the same signing request.',
    cancel: 'Cancel',
    states: {
      not_sent: 'Not sent',
      pending: 'Pending submission',
      sending: 'Sending',
      accepted: 'Accepted by signing service',
      signing: 'Awaiting signatures',
      unknown: 'Result awaiting confirmation',
      archivePending: 'Signed — archive needs recovery',
      archived: 'Signed document archived',
      rejected: 'Rejected by signing service',
      cancelled: 'Cancelled by signing service',
    },
  },
};

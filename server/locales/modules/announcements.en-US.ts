export default {
  announcements: {
    authz: {
      title: 'Announcements',
      owned: 'Published by me',
      readable: 'My publications and received notices',
      view: 'Read announcements',
      create: 'Create announcement drafts',
      edit: 'Edit own draft',
      publish: 'Publish own announcement',
      revoke: 'Withdraw own announcement',
      remind: 'Remind unconfirmed recipients',
      receipts: 'Read own recipient roster',
      confirm: 'Confirm own receipt',
    },
    notifications: {
      title: 'Company announcement',
      body: 'An announcement is available. Open the application to read it.',
    },
    errors: {
      ACCESS_DENIED: 'This announcement or operation is not accessible.',
      NOT_FOUND: 'Announcement not found.',
      INVALID_INPUT: 'Invalid announcement input or validity interval.',
      INVALID_AUDIENCE:
        'The audience contains an unavailable department or duty role.',
      EMPTY_AUDIENCE: 'The announcement has no active recipients.',
      INVALID_ATTACHMENT: 'Invalid or unavailable attachment.',
      INVALID_STATE: 'This operation is unavailable in the current state.',
      VERSION_CONFLICT: 'The announcement changed. Reload and retry.',
      COMMAND_CONFLICT:
        'This request identifier was already used with different input.',
      KNOWLEDGE_UNAVAILABLE:
        'The linked document is unavailable or not readable.',
    },
  },
};

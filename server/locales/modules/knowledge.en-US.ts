export default {
  knowledge: {
    notifications: {
      title: 'Policy document updated',
      body: 'A linked policy document has a new version. Open it to read the current version.',
    },
    authz: {
      knowledgeDocuments: 'Knowledge documents',
      knowledgeFolders: 'Knowledge folders',
      knowledgeVersions: 'Document versions',
      view: 'View',
      manage: 'Manage',
    },
    errors: {
      ACCESS_DENIED: 'You cannot access this document or operation.',
      DOCUMENT_NOT_FOUND: 'Document does not exist or is inaccessible.',
      FOLDER_NOT_FOUND: 'Folder does not exist or is inaccessible.',
      INVALID_INPUT: 'Invalid document input.',
      INVALID_CONTENT: 'Invalid document content.',
      INVALID_AUDIENCE:
        'The audience contains an unavailable department or role.',
      INVALID_FILE: 'The file is invalid or unavailable.',
      VERSION_CONFLICT: 'The document was updated. Refresh and try again.',
      COMMAND_CONFLICT:
        'The request key has already been used for different content.',
      FOLDER_CYCLE: 'A folder cannot be moved beneath itself.',
      TREE_UNINITIALIZED: 'The document directory has not been initialized.',
      BODY_TOO_LARGE: 'The uploaded file exceeds the allowed size.',
    },
  },
};

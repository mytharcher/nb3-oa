export default {
  knowledge: {
    notifications: {
      title: '規程文書を更新',
      body: '関連規程文書に新しいバージョンがあります。開いて最新を確認してください。',
    },
    authz: {
      knowledgeDocuments: 'ナレッジ文書',
      knowledgeFolders: 'ナレッジフォルダー',
      knowledgeVersions: '文書バージョン',
      view: '表示',
      manage: '管理',
    },
    errors: {
      ACCESS_DENIED: 'この文書または操作にアクセスできません。',
      DOCUMENT_NOT_FOUND: '文書が存在しないかアクセスできません。',
      FOLDER_NOT_FOUND: 'フォルダーが存在しないかアクセスできません。',
      INVALID_INPUT: '文書入力が不正です。',
      INVALID_CONTENT: '文書内容が不正です。',
      INVALID_AUDIENCE: '対象に利用不可の部署またはロールが含まれています。',
      INVALID_FILE: 'ファイルが不正または利用不可です。',
      VERSION_CONFLICT: '文書が更新されました。更新して再試行してください。',
      COMMAND_CONFLICT: 'リクエストキーは異なる内容で使用済みです。',
      FOLDER_CYCLE: 'フォルダーを自身の配下に移動できません。',
      TREE_UNINITIALIZED: '文書ディレクトリは未初期化です。',
      BODY_TOO_LARGE: 'アップロードファイルが許容サイズを超えています。',
    },
  },
};

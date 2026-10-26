export default {
  knowledge: {
    notifications: {
      title: '制度文件已更新',
      body: '關聯的制度文件有新版本，請開啟查看目前版本。',
    },
    authz: {
      knowledgeDocuments: '知識文件',
      knowledgeFolders: '知識目錄',
      knowledgeVersions: '文件版本',
      view: '查看',
      manage: '管理',
    },
    errors: {
      ACCESS_DENIED: '無權訪問文件、相關欄位或執行此操作。',
      DOCUMENT_NOT_FOUND: '文件不存在或不可訪問。',
      FOLDER_NOT_FOUND: '目錄不存在或不可訪問。',
      INVALID_INPUT: '文件輸入無效。',
      INVALID_CONTENT: '文件內容無效。',
      INVALID_AUDIENCE: '可見範圍包含無效部門或職責角色。',
      INVALID_FILE: '檔案無效或不可訪問。',
      VERSION_CONFLICT: '文件已更新，請重新整理後重試。',
      COMMAND_CONFLICT: '此請求標識已用於其他內容。',
      FOLDER_CYCLE: '不能將目錄移動到自身或子目錄中。',
      TREE_UNINITIALIZED: '文件目錄尚未初始化。',
      BODY_TOO_LARGE: '上傳檔案超出大小限制。',
    },
  },
};

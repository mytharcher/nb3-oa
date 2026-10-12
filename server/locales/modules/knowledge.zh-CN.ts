export default {
  knowledge: {
    notifications: {
      title: '制度文档已更新',
      body: '关联的制度文档有新版本，请打开查看当前版本。',
    },
    authz: {
      knowledgeDocuments: '知识文档',
      knowledgeFolders: '知识目录',
      knowledgeVersions: '文档版本',
      view: '查看',
      manage: '管理',
    },
    errors: {
      ACCESS_DENIED: '无权访问文档、相关字段或执行此操作。',
      DOCUMENT_NOT_FOUND: '文档不存在或不可访问。',
      FOLDER_NOT_FOUND: '目录不存在或不可访问。',
      INVALID_INPUT: '文档输入无效。',
      INVALID_CONTENT: '文档内容无效。',
      INVALID_AUDIENCE: '可见范围包含无效部门或职责角色。',
      INVALID_FILE: '文件无效或不可访问。',
      VERSION_CONFLICT: '文档已更新，请刷新后重试。',
      COMMAND_CONFLICT: '此请求标识已用于其他内容。',
      FOLDER_CYCLE: '不能将目录移动到自身或子目录中。',
      TREE_UNINITIALIZED: '文档目录尚未初始化。',
      BODY_TOO_LARGE: '上传文件超出大小限制。',
    },
  },
};

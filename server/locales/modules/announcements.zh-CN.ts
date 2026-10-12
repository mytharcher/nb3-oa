export default {
  announcements: {
    authz: {
      title: '公告与制度通知',
      owned: '本人发布',
      readable: '本人发布及接收的公告',
      view: '查看公告',
      create: '创建公告草稿',
      edit: '编辑本人草稿',
      publish: '发布本人公告',
      revoke: '撤回本人公告',
      remind: '催读未确认员工',
      receipts: '查看本人公告接收名单',
      confirm: '确认本人回执',
    },
    notifications: {
      title: '公司公告',
      body: '有公告待查看，请进入应用阅读。',
    },
    errors: {
      ACCESS_DENIED: '无权查看此公告或执行此操作。',
      NOT_FOUND: '公告不存在。',
      INVALID_INPUT: '公告内容或有效期不合法。',
      INVALID_AUDIENCE: '发布范围包含不可用的部门或职责角色。',
      EMPTY_AUDIENCE: '发布范围内没有有效员工。',
      INVALID_ATTACHMENT: '附件不合法或不可访问。',
      INVALID_STATE: '当前状态无法执行此操作。',
      VERSION_CONFLICT: '公告已变更，请刷新后重试。',
      COMMAND_CONFLICT: '此请求编号已用于不同操作内容。',
      KNOWLEDGE_UNAVAILABLE: '关联知识文档不可用或无权查看。',
    },
  },
};

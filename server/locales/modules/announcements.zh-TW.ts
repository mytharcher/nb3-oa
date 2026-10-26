export default {
  announcements: {
    authz: {
      title: '公告與制度通知',
      owned: '本人發佈',
      readable: '本人發佈及接收的公告',
      view: '查看公告',
      create: '建立公告草稿',
      edit: '編輯本人草稿',
      publish: '發佈本人公告',
      revoke: '撤回本人公告',
      remind: '催讀未確認員工',
      receipts: '查看本人公告接收名單',
      confirm: '確認本人回執',
    },
    notifications: {
      title: '公司公告',
      body: '有公告待查看，請進入應用程式閱讀。',
    },
    errors: {
      ACCESS_DENIED: '無權查看此公告或執行此操作。',
      NOT_FOUND: '公告不存在。',
      INVALID_INPUT: '公告內容或有效期不合法。',
      INVALID_AUDIENCE: '發佈範圍包含不可用的部門或職責角色。',
      EMPTY_AUDIENCE: '發佈範圍內沒有有效員工。',
      INVALID_ATTACHMENT: '附件不合法或不可訪問。',
      INVALID_STATE: '目前狀態無法執行此操作。',
      VERSION_CONFLICT: '公告已變更，請重新整理後重試。',
      COMMAND_CONFLICT: '此請求編號已用於不同操作內容。',
      KNOWLEDGE_UNAVAILABLE: '關聯知識文件不可用或無權查看。',
    },
  },
};

import type { AuthorizationServerResource } from './en-US.js';

const zhTW: AuthorizationServerResource = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: '頁面權限',
    page: '頁面',
    business: '業務權限',
    administration: '系統管理',
    other: '其他',
  },
  options: {
    defaultAndSharing: '沿用預設資料範圍',
    actions: {
      assign: '管理授權',
      configure: '設定',
      inspect: '檢查權限',

      read: '查看',
      create: '新增',
      update: '編輯',
      delete: '刪除',
      access: '訪問',
    },
    settingsModules: { authorization: '權限管理' },
    pages: {
      all: '所有頁面',
      allDescription: '允許訪問所有頁面，包括之後新增的頁面。',
    },
    settings: {
      inspector: '權限檢查器',
      'permission-sets': '權限集',
    },
    subjectTypes: {
      authenticated: '所有已登入使用者',
      authenticatedDescription: '適用於所有已登入使用者。',
      user: '使用者',
    },
    recordAccessPolicies: {
      allRecords: '全部記錄',
      recordsIOwn: '本人擁有的記錄',
      recordsICreated: '本人建立的記錄',
      customFilter: '自訂篩選',
      customFilterHint: '使用自訂篩選條件選擇記錄。',
    },
  },
};

export default zhTW;

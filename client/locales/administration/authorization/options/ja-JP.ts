import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'ページ権限',
    page: 'ページ',
    business: '業務権限',
    administration: '管理',
    other: 'その他',
  },
  options: {
    defaultAndSharing: 'デフォルトのデータ範囲を使用',
    actions: {
      assign: '割り当てを管理',
      configure: '設定',
      inspect: '権限を検査',

      read: '読み取り',
      create: '作成',
      update: '更新',
      delete: '削除',
      access: 'アクセス',
    },
    settingsModules: { authorization: '権限管理' },
    pages: {
      all: 'すべてのページ',
      allDescription:
        '今後追加されるページを含む、すべてのページへのアクセスを許可します。',
    },
    settings: {
      inspector: '権限検査',
      'permission-sets': '権限セット',
    },
    subjectTypes: {
      authenticated: 'ログイン済みのすべてのユーザー',
      authenticatedDescription:
        '有効なログインセッションを持つすべてのユーザーに適用します。',
      user: 'ユーザー',
    },
    recordAccessPolicies: {
      allRecords: 'すべてのレコード',
      recordsIOwn: '自分が所有するレコード',
      recordsICreated: '自分が作成したレコード',
      customFilter: 'カスタムフィルター',
      customFilterHint: 'カスタムフィルター条件でレコードを選択します。',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;

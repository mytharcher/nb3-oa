import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': '閉じる',
  nav: { apiKeys: 'APIキー' },
  page: {
    search: 'キー名で検索',
    retry: '再試行',
    clear: 'フィルターをクリア',
    noResults: '検索条件に一致するキーはありません。',
    loading: '読み込み中',
    title: 'APIキー',
    description:
      'スクリプトや連携システムがあなたの権限でこのアプリを呼び出すためのキーを作成します。',
    add: 'キーを作成',
    empty: 'APIキーはまだありません。',
    unnamed: '名前のないキー',
    never: 'なし',
    unused: '未使用',
    active: '有効',
    expired: '期限切れ',
    disabled: '無効',
    columns: {
      name: '名前',
      key: 'キー',
      status: '状態',
      lastUsed: '最終使用日時',
      expires: '有効期限',
      actions: '操作',
    },
    actions: { revoke: '失効', menu: '「{{name}}」の操作' },
  },
  form: {
    title: 'APIキーを作成',
    description:
      'このキーはあなたとして動作し、あなたのアカウントと同じ権限を持ちます。',
    name: '名前',
    namePlaceholder: '夜間エクスポートジョブ',
    expiry: '有効期限',
    expiryChoices: {
      never: 'なし',
      '7': '7日後',
      '30': '30日後',
      '90': '90日後',
      '365': '1年後',
    },
    cancel: 'キャンセル',
    create: '作成',
  },
  reveal: {
    title: '今すぐキーをコピー',
    description:
      '「{{name}}」を作成しました。キーが表示されるのはこの一度だけです。',
    usage: 'リクエストヘッダーのx-api-keyに指定してください。',
    copy: 'キーをコピー',
    done: '完了',
  },
  revoke: {
    success: 'キー「{{name}}」を失効しました',
    title: 'キー「{{name}}」を失効しますか？',
    description:
      '「{{name}}」を使用するリクエストは直ちに失敗するようになります。この操作は取り消せません。',
    cancel: 'キャンセル',
    confirm: '失効',
  },
  errors: {
    forbidden: 'キーを表示する権限がありません。管理者にお問い合わせください。',
    notFound: 'APIキー管理を利用できません。ワークベンチに戻ってください。',
    nameRequired: 'キー名を入力してください。',
    copyFailed:
      'キーをコピーできませんでした。選択して手動でコピーしてください。',
    loadFailed: 'APIキーを読み込めませんでした。',
    createFailed: 'APIキーを作成できませんでした。',
    revokeFailed: 'APIキーを失効できませんでした。',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;

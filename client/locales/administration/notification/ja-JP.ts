import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: '通知',
    logs: '通知ログ',
  },
  logs: {
    retry: '再試行',
    limitNotice:
      '最新の{{count}}件の通知のみを表示しています。合計はこれらのレコードが対象です。',
    deliveryOperations: '配信処理',
    recipeDescription:
      '各チャネルへの引き渡しとプロバイダーの各試行を追跡します。',
    redacted: 'メッセージ本文、受信者、リーストークンは非表示です。',
    providerAttempts: 'プロバイダーの試行',

    eyebrow: '通知',
    title: '通知ログ',
    description:
      '通知配信とプロバイダーの各試行を追跡します。メッセージ本文、受信者、リーストークンは非表示です。',
    refreshing: '更新中…',
    refresh: '更新',
    deliveriesShown: '表示中の配信',
    needAttention: '要対応',
    unavailable: 'ログを利用できません',
    recent: '最近の通知',
    loading: '配信履歴を読み込み中…',
    emptyTitle: '配信はまだありません',
    emptyDescription: '通知の送信後、配信レコードがここに表示されます。',
    expand: '通知を展開',
    collapse: '通知を折りたたむ',
    noDeliveries: '配信記録がありません。',
    noAttempts: '試行記録がありません。',
    columns: {
      source: 'ソース',
      notificationId: '通知ID',
      status: '状態',
      deliveries: '配信',
      created: '作成日時',
      channel: 'チャネル',
      provider: 'プロバイダー',
      attempts: '試行回数',
      updated: '更新日時',
    },
  },
  status: {
    pending: '待機中',
    processing: '処理中',
    completed: '完了',
    partial: '一部完了',
    failed: '失敗',
    unknown: '不明',
    preparing: '準備中',
    submitting: '送信中',
    retrying: '再試行中',
    accepted: '受付済み',
  },
  errors: {
    forbidden: 'アクセス権が削除されました。管理者にお問い合わせください。',
    notFound:
      'これらのレコードを利用できません。ワークベンチに戻ってください。',
    providerFailed:
      '配信に失敗しました。チャネル設定を確認するか管理者にお問い合わせください。',
    requestFailed: '通知リクエストに失敗しました。',
    inAppRecipientNotFound: 'アプリ内通知の受信者が存在しません。',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;

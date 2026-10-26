const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: '{{name}}のため',
      showEvents: '変更内容（{{count}}件）',
      system: '{{count}}件のシステム更新',
      empty: 'まだ何も起きていません。',
    },
    progress: {
      empty: '承認はまだ開始していません。',
      copies: '共有先',
      read: '既読',
      unread: '未読',
      step: {
        current: '進行中',
        rejected: '却下済み',
        returned: '差し戻し済み',
        ended: '終了',
        skipped: 'スキップ',
      },
      tally: {
        answered: '{{total}}件中{{count}}件回答済み',
        needed: '可決に{{count}}件必要',
      },
    },
    branches: {
      done: '{{total}}件中{{count}}件完了',
      blocked: '申請の進行を保留中',
    },
    receipts: {
      read: '既読',
      confirmed: '確認済み',
      empty: 'まだ誰にも届いていません。',
    },
    preview: {
      title: '判断する担当者',
      loading: '経路を計算中…',
      submit: '提出',
      finished: '判断済み',
      automatic: '判断なしで承認',
      parallel: '並行',
      optional: '任意',
      nobody: '適格者はまだいません',
      none: 'この申請は承認なしで判断されます。',
      skipped: '不要：{{stages}}',
    },
    actions: {
      more: 'その他',
      all: '操作',
      admin: '管理',
      confirm: '{{action}}しますか？',
      loading: '読み込み中…',
      loadFailed: '読み込めませんでした。閉じて再試行してください。',
      cancel: 'キャンセル',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of approval-ui has. */
export type ApprovalUiLocale = Widen<typeof enUS>;

const locale: ApprovalUiLocale = enUS;

export default locale;

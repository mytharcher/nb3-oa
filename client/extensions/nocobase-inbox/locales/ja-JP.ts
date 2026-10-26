/** Every key the inbox looks up, so each locale is checked against the same list. */
export interface InboxLocale {
  readonly 'inbox.title': string;
  readonly 'inbox.description': string;
  readonly 'inbox.views.all': string;
  readonly 'inbox.views.todo': string;
  readonly 'inbox.kinds.label': string;
  readonly 'inbox.kinds.all': string;
  readonly 'inbox.kinds.decision': string;
  readonly 'inbox.kinds.info': string;
  readonly 'inbox.tabs.decision': string;
  readonly 'inbox.tabs.info': string;
  readonly 'inbox.clearFilter': string;
  readonly 'inbox.noMatchDescription': string;
  readonly 'inbox.readAll': string;
  readonly 'inbox.allRead': string;
  readonly 'inbox.loading': string;
  readonly 'inbox.loadFailed': string;
  readonly 'inbox.loadFailedDescription': string;
  readonly 'inbox.retry': string;
  readonly 'inbox.loadMore': string;
  readonly 'inbox.emptyAll': string;
  readonly 'inbox.empty.todo': string;
  readonly 'inbox.empty.decision': string;
  readonly 'inbox.empty.info': string;
  readonly 'inbox.emptyDescription': string;
  readonly 'inbox.unread': string;
  readonly 'inbox.unreadCount': string;
  readonly 'inbox.pendingDecisions': string;
  readonly 'inbox.resolved': string;
  readonly 'inbox.outcomes.approved': string;
  readonly 'inbox.outcomes.rejected': string;
  readonly 'inbox.outcomes.withdrawn': string;
  readonly 'inbox.count': string;
  readonly 'inbox.actionsFor': string;
  readonly 'inbox.actions.read': string;
  readonly 'inbox.actions.unread': string;
  readonly 'inbox.actions.delete': string;
  readonly 'inbox.deleted': string;
  readonly 'inbox.requestFailed': string;
  readonly 'inbox.forbidden': string;
  readonly 'inbox.nothingSelected': string;
  readonly 'inbox.back': string;
  readonly 'inbox.open': string;
  readonly 'inbox.keyMove': string;
  readonly 'inbox.keyOpen': string;
  readonly 'inbox.cancel': string;
  readonly 'inbox.request.approve': string;
  readonly 'inbox.request.reject': string;
  readonly 'inbox.request.commentPlaceholder': string;
  readonly 'inbox.request.commentFor': string;
  readonly 'inbox.request.quickSend': string;
  readonly 'inbox.request.newLine': string;
}

const enUS: InboxLocale = {
  'inbox.title': '受信箱',
  'inbox.description': 'あなたに届いた通知とリクエスト。',
  'inbox.views.all': 'すべて',
  'inbox.views.todo': '未処理',
  'inbox.kinds.label': '種類',
  'inbox.kinds.all': 'すべての種類',
  'inbox.kinds.decision': '判断',
  'inbox.kinds.info': '通知',
  'inbox.tabs.decision': '自分の判断が必要',
  'inbox.tabs.info': '通知',
  'inbox.clearFilter': 'フィルターをクリア',
  'inbox.noMatchDescription':
    'フィルターを解除してすべての種類を表示してください。',
  'inbox.readAll': 'すべて既読にする',
  'inbox.allRead': 'すべて既読にしました。',
  'inbox.loading': '読み込み中',
  'inbox.loadFailed': '受信箱を読み込めません',
  'inbox.loadFailedDescription': '接続を確認して再試行してください。',
  'inbox.retry': '再試行',
  'inbox.loadMore': 'さらに読み込む',
  'inbox.emptyAll': '項目なし',
  'inbox.empty.todo': '対応待ちなし',
  'inbox.empty.decision': '判断待ちなし',
  'inbox.empty.info': '通知なし',
  'inbox.emptyDescription':
    'あなたに届いた通知とリクエストがここに表示されます。',
  'inbox.unread': '未読',
  'inbox.unreadCount': '未読{{count}}件',
  'inbox.pendingDecisions': '待機{{count}}件',
  'inbox.resolved': '処理済み',
  'inbox.outcomes.approved': '承認済み',
  'inbox.outcomes.rejected': '却下済み',
  'inbox.outcomes.withdrawn': '取り下げ済み',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': '{{title}}の操作',
  'inbox.actions.read': '既読にする',
  'inbox.actions.unread': '未読にする',
  'inbox.actions.delete': '削除',
  'inbox.deleted': '削除しました。',
  'inbox.requestFailed': 'リクエストに失敗しました。再試行してください。',
  'inbox.forbidden': 'この操作は許可されていません。',
  'inbox.nothingSelected': '表示する項目を選択',
  'inbox.back': '一覧に戻る',
  'inbox.open': '開く',
  'inbox.keyMove': '移動',
  'inbox.keyOpen': '開く',
  'inbox.cancel': 'キャンセル',
  'inbox.request.approve': '承認',
  'inbox.request.reject': '却下',
  'inbox.request.commentPlaceholder': '入力してください…',
  'inbox.request.commentFor': '{{action}}：{{title}}',
  'inbox.request.quickSend': 'で送信',
  'inbox.request.newLine': 'で改行',
};

export default enUS;

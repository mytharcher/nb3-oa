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
  'inbox.title': '수신함',
  'inbox.description': '나에게 보낸 알림 및 요청입니다.',
  'inbox.views.all': '전체',
  'inbox.views.todo': '할 일',
  'inbox.kinds.label': '유형',
  'inbox.kinds.all': '모든 유형',
  'inbox.kinds.decision': '결정',
  'inbox.kinds.info': '알림',
  'inbox.tabs.decision': '내 결정 필요',
  'inbox.tabs.info': '알림',
  'inbox.clearFilter': '필터 지우기',
  'inbox.noMatchDescription': '모든 유형을 보려면 필터를 지우세요.',
  'inbox.readAll': '모두 읽음으로 표시',
  'inbox.allRead': '모두 읽음으로 표시했습니다.',
  'inbox.loading': '로딩 중',
  'inbox.loadFailed': '수신함을 불러올 수 없음',
  'inbox.loadFailedDescription': '연결을 확인하고 재시도하세요.',
  'inbox.retry': '다시 시도',
  'inbox.loadMore': '더 불러오기',
  'inbox.emptyAll': '항목 없음',
  'inbox.empty.todo': '내 대기 항목 없음',
  'inbox.empty.decision': '내 결정을 기다리는 항목 없음',
  'inbox.empty.info': '알림 없음',
  'inbox.emptyDescription': '나에게 보낸 알림 및 요청이 여기에 표시됩니다.',
  'inbox.unread': '읽지 않음',
  'inbox.unreadCount': '읽지 않은 항목 {{count}}개',
  'inbox.pendingDecisions': '대기 {{count}}개',
  'inbox.resolved': '처리됨',
  'inbox.outcomes.approved': '승인됨',
  'inbox.outcomes.rejected': '거절됨',
  'inbox.outcomes.withdrawn': '철회됨',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': '{{title}} 작업',
  'inbox.actions.read': '읽음으로 표시',
  'inbox.actions.unread': '읽지 않음으로 표시',
  'inbox.actions.delete': '삭제',
  'inbox.deleted': '삭제했습니다.',
  'inbox.requestFailed': '요청에 실패했습니다. 다시 시도하세요.',
  'inbox.forbidden': '이 작업은 허용되지 않습니다.',
  'inbox.nothingSelected': '볼 항목 선택',
  'inbox.back': '목록으로 돌아가기',
  'inbox.open': '열기',
  'inbox.keyMove': '이동',
  'inbox.keyOpen': '열기',
  'inbox.cancel': '취소',
  'inbox.request.approve': '승인',
  'inbox.request.reject': '거절',
  'inbox.request.commentPlaceholder': '내용 입력…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': '전송',
  'inbox.request.newLine': '줄 바꿈',
};

export default enUS;

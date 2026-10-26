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
  'inbox.title': 'Hộp thư đến',
  'inbox.description': 'Thông báo và yêu cầu gửi cho bạn.',
  'inbox.views.all': 'Tất cả',
  'inbox.views.todo': 'Cần làm',
  'inbox.kinds.label': 'Loại',
  'inbox.kinds.all': 'Tất cả loại',
  'inbox.kinds.decision': 'Quyết định',
  'inbox.kinds.info': 'Thông báo',
  'inbox.tabs.decision': 'Cần tôi quyết định',
  'inbox.tabs.info': 'Thông báo',
  'inbox.clearFilter': 'Xóa bộ lọc',
  'inbox.noMatchDescription': 'Xóa bộ lọc để xem mọi loại.',
  'inbox.readAll': 'Đánh dấu tất cả đã đọc',
  'inbox.allRead': 'Đã đánh dấu tất cả đã đọc.',
  'inbox.loading': 'Đang tải',
  'inbox.loadFailed': 'Không thể tải hộp thư đến',
  'inbox.loadFailedDescription': 'Kiểm tra kết nối và thử lại.',
  'inbox.retry': 'Thử lại',
  'inbox.loadMore': 'Tải thêm',
  'inbox.emptyAll': 'Không có gì ở đây',
  'inbox.empty.todo': 'Không có gì chờ bạn',
  'inbox.empty.decision': 'Không có quyết định chờ bạn',
  'inbox.empty.info': 'Không có thông báo',
  'inbox.emptyDescription':
    'Thông báo và yêu cầu gửi cho bạn hiển thị tại đây.',
  'inbox.unread': 'Chưa đọc',
  'inbox.unreadCount': '{{count}} chưa đọc',
  'inbox.pendingDecisions': '{{count}} đang chờ',
  'inbox.resolved': 'Đã xử lý',
  'inbox.outcomes.approved': 'Đã phê duyệt',
  'inbox.outcomes.rejected': 'Đã từ chối',
  'inbox.outcomes.withdrawn': 'Đã rút lại',
  'inbox.count': '×{{count}}',
  'inbox.actionsFor': 'Thao tác cho {{title}}',
  'inbox.actions.read': 'Đánh dấu đã đọc',
  'inbox.actions.unread': 'Đánh dấu chưa đọc',
  'inbox.actions.delete': 'Xóa',
  'inbox.deleted': 'Đã xóa.',
  'inbox.requestFailed': 'Yêu cầu thất bại. Thử lại.',
  'inbox.forbidden': 'Bạn không được phép thực hiện.',
  'inbox.nothingSelected': 'Chọn mục để xem',
  'inbox.back': 'Quay lại danh sách',
  'inbox.open': 'Mở',
  'inbox.keyMove': 'Di chuyển',
  'inbox.keyOpen': 'Mở',
  'inbox.cancel': 'Hủy',
  'inbox.request.approve': 'Phê duyệt',
  'inbox.request.reject': 'Từ chối',
  'inbox.request.commentPlaceholder': 'Viết gì đó…',
  'inbox.request.commentFor': '{{action}}: {{title}}',
  'inbox.request.quickSend': 'để gửi',
  'inbox.request.newLine': 'để xuống dòng',
};

export default enUS;

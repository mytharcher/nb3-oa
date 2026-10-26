const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: 'cho {{name}}',
      showEvents: 'Nội dung thay đổi ({{count}})',
      system: '{{count}} cập nhật hệ thống',
      empty: 'Chưa có hoạt động.',
    },
    progress: {
      empty: 'Chưa bắt đầu phê duyệt.',
      copies: 'Bản sao gửi đến',
      read: 'đã đọc',
      unread: 'chưa đọc',
      step: {
        current: 'đang tiến hành',
        rejected: 'bị từ chối',
        returned: 'đã trả lại',
        ended: 'đã kết thúc',
        skipped: 'đã bỏ qua',
      },
      tally: {
        answered: 'Đã trả lời {{count}} trên {{total}}',
        needed: 'Cần {{count}} để thông qua',
      },
    },
    branches: {
      done: 'Đã hoàn thành {{count}} trên {{total}}',
      blocked: 'Đang giữ yêu cầu lại',
    },
    receipts: {
      read: 'Đọc',
      confirmed: 'Đã xác nhận',
      empty: 'Chưa có người nhận.',
    },
    preview: {
      title: 'Ai sẽ quyết định',
      loading: 'Đang xác định luồng…',
      submit: 'Gửi',
      finished: 'Đã quyết định',
      automatic: 'Đã duyệt không qua quyết định',
      parallel: 'Song song',
      optional: 'Tùy chọn',
      nobody: 'Chưa có ai đủ điều kiện',
      none: 'Yêu cầu này được quyết định không qua phê duyệt.',
      skipped: 'Không cần: {{stages}}',
    },
    actions: {
      more: 'Thêm',
      all: 'Thao tác',
      admin: 'Quản trị',
      confirm: '{{action}}?',
      loading: 'Đang tải…',
      loadFailed: 'Không thể tải mục này. Đóng và thử lại.',
      cancel: 'Hủy',
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

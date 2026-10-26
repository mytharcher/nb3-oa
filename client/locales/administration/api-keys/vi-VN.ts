import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': 'Đóng',
  nav: { apiKeys: 'Khóa API' },
  page: {
    search: 'Tìm theo tên khóa',
    retry: 'Thử lại',
    clear: 'Xóa bộ lọc',
    noResults: 'Không có khóa nào khớp với tìm kiếm.',
    loading: 'Đang tải',
    title: 'Khóa API',
    description:
      'Tạo khóa để tập lệnh và tích hợp gọi ứng dụng này với danh nghĩa của bạn.',
    add: 'Tạo khóa',
    empty: 'Bạn chưa có khóa API nào.',
    unnamed: 'Khóa chưa đặt tên',
    never: 'Không bao giờ',
    unused: 'Chưa từng sử dụng',
    active: 'Đang hoạt động',
    expired: 'Đã hết hạn',
    disabled: 'Đã vô hiệu hóa',
    columns: {
      name: 'Tên',
      key: 'Khóa',
      status: 'Trạng thái',
      lastUsed: 'Lần sử dụng cuối',
      expires: 'Hết hạn',
      actions: 'Thao tác',
    },
    actions: { revoke: 'Thu hồi', menu: 'Thao tác cho "{{name}}"' },
  },
  form: {
    title: 'Tạo khóa API',
    description:
      'Khóa hoạt động với danh nghĩa của bạn và có đúng các quyền của tài khoản bạn.',
    name: 'Tên',
    namePlaceholder: 'Tác vụ xuất hằng đêm',
    expiry: 'Hết hạn',
    expiryChoices: {
      never: 'Không bao giờ',
      '7': 'Sau 7 ngày',
      '30': 'Sau 30 ngày',
      '90': 'Sau 90 ngày',
      '365': 'Sau 1 năm',
    },
    cancel: 'Hủy',
    create: 'Tạo',
  },
  reveal: {
    title: 'Sao chép khóa ngay',
    description: 'Đã tạo “{{name}}”. Đây là lần duy nhất khóa được hiển thị.',
    usage: 'Gửi khóa qua tiêu đề yêu cầu x-api-key.',
    copy: 'Sao chép khóa',
    done: 'Hoàn tất',
  },
  revoke: {
    success: 'Đã thu hồi khóa "{{name}}"',
    title: 'Thu hồi khóa "{{name}}"?',
    description:
      'Yêu cầu sử dụng “{{name}}” sẽ thất bại ngay lập tức. Không thể hoàn tác.',
    cancel: 'Hủy',
    confirm: 'Thu hồi',
  },
  errors: {
    forbidden: 'Bạn không còn quyền xem khóa. Hãy liên hệ quản trị viên.',
    notFound: 'Không thể quản lý khóa API. Hãy quay lại bàn làm việc.',
    nameRequired: 'Nhập tên khóa.',
    copyFailed: 'Không thể sao chép khóa. Hãy chọn và sao chép thủ công.',
    loadFailed: 'Không thể tải khóa API của bạn.',
    createFailed: 'Không thể tạo khóa API.',
    revokeFailed: 'Không thể thu hồi khóa API.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;

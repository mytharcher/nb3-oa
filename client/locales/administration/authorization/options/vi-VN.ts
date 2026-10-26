import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: 'Quyền trang',
    page: 'Trang',
    business: 'Quyền nghiệp vụ',
    administration: 'Quản trị',
    other: 'Khác',
  },
  options: {
    defaultAndSharing: 'Dùng phạm vi dữ liệu mặc định',
    actions: {
      assign: 'Quản lý lượt gán',
      configure: 'Cấu hình',
      inspect: 'Kiểm tra quyền',

      read: 'Đọc',
      create: 'Tạo',
      update: 'Cập nhật',
      delete: 'Xóa',
      access: 'Truy cập',
    },
    settingsModules: { authorization: 'Phân quyền' },
    pages: {
      all: 'Tất cả trang',
      allDescription:
        'Cho phép truy cập mọi trang, kể cả trang được thêm sau này.',
    },
    settings: {
      inspector: 'Kiểm tra quyền',
      'permission-sets': 'Bộ quyền',
    },
    subjectTypes: {
      authenticated: 'Tất cả người dùng đã đăng nhập',
      authenticatedDescription:
        'Áp dụng cho mọi người dùng có phiên đăng nhập hợp lệ.',
      user: 'Người dùng',
    },
    recordAccessPolicies: {
      allRecords: 'Tất cả bản ghi',
      recordsIOwn: 'Bản ghi tôi sở hữu',
      recordsICreated: 'Bản ghi tôi tạo',
      customFilter: 'Bộ lọc tùy chỉnh',
      customFilterHint: 'Chọn bản ghi bằng điều kiện lọc tùy chỉnh.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;

/**
 * English wording of the `import` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `import.zh-CN.ts` is checked against this shape.
 */
const importEnUS = {
  import: {
    navigation: { title: 'Nhập dữ liệu' },
    // Titles the server registers in the permission workspace (`server/providers/import/index.ts`).
    authz: {
      settings: 'Nhập dữ liệu',
      read: 'Xem lịch sử và mẫu',
      update: 'Nhập',
    },
    title: 'Nhập dữ liệu',
    description:
      'Nhập phòng ban, vị trí, cấp bậc, hồ sơ nhân viên và thành viên vai trò trách nhiệm từ mẫu Excel.',
    kinds: {
      departments: 'Phòng ban',
      positions: 'Vị trí',
      grades: 'Cấp bậc',
      employees: 'Hồ sơ nhân viên',
      dutyRoleMembers: 'Thành viên vai trò trách nhiệm',
    },
    kindHints: {
      departments:
        'Khớp theo mã phòng ban. Phòng ban cha có thể được khai báo ở dòng dưới.',
      positions: 'Khớp theo mã vị trí.',
      grades: 'Khớp theo mã cấp bậc.',
      employees:
        'Khớp theo mã nhân viên. Nhập phòng ban, vị trí và cấp bậc trước; quản lý có thể được khai báo cùng trang tính.',
      dutyRoleMembers:
        'Khớp theo mã vai trò và tài khoản. "Không" trong cột hoạt động sẽ gỡ thành viên.',
    },
    actions: {
      new: 'Lần nhập mới',
      templates: 'Tải mẫu',
      templateFor: 'Tải mẫu {{kind}}',
      check: 'Kiểm tra',
      checking: 'Đang kiểm tra…',
      confirm: 'Nhập',
      importing: 'Đang nhập…',
      chooseAgain: 'Chọn tệp khác',
      back: 'Quay lại',
      chooseFile: 'Chọn tệp',
      downloadFile: 'Tải tệp gốc',
      refresh: 'Làm mới',
      clearFilters: 'Xóa bộ lọc',
    },
    fields: {
      kind: 'Loại',
      file: 'Tệp',
      createdAt: 'Đã bắt đầu',
      finishedAt: 'Đã kết thúc',
      status: 'Kết quả',
      summary: 'Tóm tắt',
      actor: 'Bởi',
      rowCount: 'Dòng đã đọc',
      createdCount: 'Đã tạo',
      updatedCount: 'Đã cập nhật',
      unchangedCount: 'Không đổi',
      errorCount: 'Vấn đề',
      row: 'Dòng',
      column: 'Cột',
      problem: 'Vấn đề',
    },
    filters: { allKinds: 'Tất cả loại' },
    status: { succeeded: 'Thành công', failed: 'Thất bại' },
    summary: {
      succeeded:
        'Đã tạo {{created}} · cập nhật {{updated}} · không đổi {{unchanged}}',
      failed: 'Vấn đề: {{count}}',
    },
    noFile: 'Chưa chọn tệp',
    templateFile: 'Mẫu nhập {{kind}}.xlsx',
    fileHint: 'Sổ làm việc .xlsx tối đa 5 MB, bố trí theo mẫu.',
    notice: {
      title: 'Trước khi nhập',
      accounts:
        'Nhập không bao giờ tạo tài khoản: mọi tài khoản trong tệp (tên đăng nhập hoặc email) phải tồn tại và đang bật, nếu không dòng đó được báo lỗi.',
      atomic:
        'Toàn bộ tệp được kiểm tra trước và ghi cùng lúc: nếu bất kỳ dòng nào có vấn đề, không ghi gì.',
    },
    validation: {
      kindRequired: 'Chọn nội dung của tệp.',
      fileRequired: 'Chọn tệp .xlsx.',
      fileType: 'Chỉ có thể nhập sổ làm việc .xlsx.',
      fileSize: 'Tệp lớn hơn 5 MB. Chia thành nhiều tệp.',
    },
    report: {
      invalidTitle: 'Phát hiện {{count}} vấn đề. Không có dữ liệu được nhập.',
      invalidDescription: 'Sửa các dòng bên dưới trong tệp rồi kiểm tra lại.',
      truncated: 'Chỉ liệt kê {{shown}} vấn đề đầu tiên trên {{count}}.',
      okTitle: 'Tệp đã vượt qua kiểm tra',
      okDescription:
        'Đã đọc {{rows}} dòng: sẽ tạo {{created}}, cập nhật {{updated}} và giữ nguyên {{unchanged}}.',
      wholeFile: 'Tệp',
    },
    toast: {
      imported: 'Đã nhập "{{name}}"',
      templateFailed: 'Không thể tải mẫu. Thử lại.',
    },
    failure: {
      forbidden: 'Bạn không có quyền nhập.',
      tooLarge: 'Tệp lớn hơn 5 MB. Chia thành nhiều tệp.',
      invalidFile: 'Không thể gửi tệp. Chọn sổ làm việc .xlsx.',
      generic: 'Yêu cầu thất bại. Kiểm tra kết nối và thử lại.',
    },
    empty: {
      title: 'Chưa có lần nhập',
      description:
        'Tải mẫu, điền và nhập để đưa phòng ban, nhân sự và vai trò vào.',
      readOnly: 'Chưa có lần nhập. Nhờ quản trị viên nhập dữ liệu tổ chức.',
    },
    noResults: 'Không có lần nhập khớp bộ lọc.',
    loadFailedTitle: 'Không thể tải lịch sử nhập',
    detail: {
      title: 'Chi tiết nhập · {{name}}',
      titleLoading: 'Chi tiết nhập',
      notFound: 'Lần nhập không tồn tại hoặc đã bị xóa.',
      problems: 'Vấn đề',
    },
    common: {
      forbidden: 'Bạn không có quyền xem mục này.',
      notFound: 'Bản ghi không tồn tại hoặc đã bị xóa.',
      loadFailed: 'Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.',
    },
    // One sentence per problem code the server reports; {{value}} is the cell, {{header}} its column.
    errors: {
      FILE_UNREADABLE:
        'Tệp không phải sổ làm việc .xlsx có thể đọc. Lưu thành sổ làm việc Excel và thử lại.',
      SHEET_EMPTY:
        'Trang tính đầu không có dòng dữ liệu. Điền các dòng dưới tiêu đề.',
      TOO_MANY_ROWS: 'Tệp có hơn {{max}} dòng. Chia thành nhiều tệp.',
      HEADER_MISSING: 'Thiếu cột bắt buộc "{{header}}" trong dòng tiêu đề.',
      HEADER_DUPLICATE: 'Cột "{{header}}" xuất hiện nhiều lần.',
      REQUIRED: 'Bắt buộc.',
      INVALID_CODE:
        '"{{value}}" không phải mã hợp lệ: dùng chữ cái, chữ số, ".", "_" và "-", tối đa 64 ký tự.',
      TOO_LONG: 'Dài hơn {{max}} ký tự.',
      INVALID_INTEGER: '"{{value}}" không phải số nguyên.',
      INVALID_BOOLEAN: '"{{value}}" không phải 是 / 否 (có / không).',
      CAREER_START_FUTURE:
        'Ngày bắt đầu đi làm lần đầu không được sau hôm nay theo múi giờ lịch làm việc.',
      CAREER_START_AFTER_HIRE:
        'Ngày bắt đầu đi làm lần đầu không được sau ngày tuyển dụng.',
      INVALID_DATE:
        '"{{value}}" không phải ngày hợp lệ. Dùng ô ngày hoặc YYYY-MM-DD.',
      INVALID_STATUS:
        '"{{value}}" không phải trạng thái: dùng 试用, 正式, 离职中 hoặc 已离职.',
      INVALID_EMAIL: '"{{value}}" không phải địa chỉ email.',
      DUPLICATE_IN_FILE: '"{{value}}" đã xuất hiện ở dòng {{firstRow}}.',
      USER_NOT_FOUND:
        'Không có tài khoản "{{value}}". Nhập không tạo tài khoản: tạo ở trang Người dùng trước.',
      USER_DISABLED:
        'Tài khoản "{{value}}" bị tắt. Bật ở trang Người dùng trước.',
      USER_TAKEN: 'Tài khoản "{{value}}" đã thuộc nhân viên {{code}}.',
      USER_MISMATCH:
        'Mã nhân viên này liên kết tài khoản khác; hồ sơ giữ tài khoản của mình.',
      PARENT_NOT_FOUND:
        'Không có phòng ban mã "{{value}}" trong tệp hoặc hệ thống.',
      EXECUTIVE_TOP_LEVEL_ONLY:
        'Chỉ phòng ban cấp cao nhất được chỉ định điều hành; phòng ban con kế thừa.',
      PARENT_CYCLE: 'Phòng ban cha tạo thành vòng lặp.',
      DEPARTMENT_NOT_FOUND:
        'Không có phòng ban mã "{{value}}". Nhập phòng ban trước.',
      DEPARTMENT_INACTIVE: 'Phòng ban "{{value}}" bị tắt.',
      POSITION_NOT_FOUND: 'Không có vị trí mã "{{value}}".',
      POSITION_INACTIVE: 'Vị trí "{{value}}" bị tắt.',
      GRADE_NOT_FOUND: 'Không có cấp bậc mã "{{value}}".',
      GRADE_INACTIVE: 'Cấp bậc "{{value}}" bị tắt.',
      MANAGER_NOT_FOUND:
        'Không có mã nhân viên "{{value}}" trong tệp hoặc hệ thống.',
      MANAGER_SELF: 'Nhân viên không thể là quản lý của chính mình.',
      MANAGER_INACTIVE: 'Quản lý "{{value}}" đã nghỉ việc.',
      MANAGER_CYCLE: 'Các quản lý tạo thành vòng lặp.',
      DUTY_ROLE_INACTIVE:
        'Vai trò không hoạt động; không thể thêm thành viên mới.',
      DUTY_ROLE_NOT_FOUND: 'Không có vai trò trách nhiệm mã "{{value}}".',
      WRITE_FAILED:
        'Không thể ghi dòng này ({{reason}}), nên không nhập gì. Kiểm tra dòng và thử lại.',
      unknown: 'Không thể nhập dòng này.',
    },
  },
};

export type ImportLocale = typeof importEnUS;

export default importEnUS;

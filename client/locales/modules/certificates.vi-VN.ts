export default {
  certificates: {
    authz: {
      readable: 'Yêu cầu của mình và có tham gia',
      requests: 'Đề nghị giấy chứng nhận',
      view: 'Xem',
      create: 'Tạo',
      edit: 'Chỉnh sửa',
      operate: 'Thực hiện',
      issue: 'Cấp',
      income: 'Thu nhập',
      owned: 'Thuộc sở hữu',
    },
    savedRecord: 'Đã lưu yêu cầu giấy chứng nhận cho "{{name}}"',
    issuedRecord: 'Đã cấp giấy chứng nhận cho "{{name}}"',
    submittedRecord: 'Đã gửi yêu cầu giấy chứng nhận cho "{{name}}"',

    businessErrors: {
      CERTIFICATE_ACCESS_DENIED:
        'Thao tác giấy chứng nhận bị từ chối: không có quyền truy cập',
      CERTIFICATE_APPROVAL_REFUSED:
        'Thao tác giấy chứng nhận bị từ chối: phê duyệt bị từ chối',
      CERTIFICATE_ARTIFACT_MISSING:
        'Thao tác giấy chứng nhận bị từ chối: thiếu tài liệu',
      CERTIFICATE_CLAIM_REQUIRED:
        'Thao tác giấy chứng nhận bị từ chối: cần nhận xử lý',
      CERTIFICATE_COMMAND_CONFLICT:
        'Thao tác giấy chứng nhận bị từ chối: xung đột lệnh',
      CERTIFICATE_COMMAND_INVALID:
        'Thao tác giấy chứng nhận bị từ chối: lệnh không hợp lệ',
      CERTIFICATE_DEPARTMENT_REQUIRED:
        'Thao tác giấy chứng nhận bị từ chối: cần phòng ban',
      CERTIFICATE_EMPLOYEE_REQUIRED:
        'Thao tác giấy chứng nhận bị từ chối: cần nhân viên',
      CERTIFICATE_HEAD_REQUIRED:
        'Thao tác giấy chứng nhận bị từ chối: cần trưởng phòng',
      CERTIFICATE_HR_REQUIRED:
        'Thao tác giấy chứng nhận bị từ chối: cần nhân sự',
      CERTIFICATE_INCOME_DENIED:
        'Thao tác giấy chứng nhận bị từ chối: không có quyền thu nhập',
      CERTIFICATE_INCOME_INVALID:
        'Thao tác giấy chứng nhận bị từ chối: thu nhập không hợp lệ',
      CERTIFICATE_INVALID: 'Thao tác giấy chứng nhận bị từ chối: không hợp lệ',
      CERTIFICATE_PREPARATION_INVALID:
        'Thao tác giấy chứng nhận bị từ chối: chuẩn bị không hợp lệ',
      CERTIFICATE_PREPARATION_MISSING:
        'Thao tác giấy chứng nhận bị từ chối: thiếu chuẩn bị',
      CERTIFICATE_PREPARATION_STALE:
        'Thao tác giấy chứng nhận bị từ chối: chuẩn bị đã cũ',
      CERTIFICATE_SOURCE_STALE:
        'Thao tác giấy chứng nhận bị từ chối: nguồn đã cũ',
      CERTIFICATE_TARGET_MISMATCH:
        'Thao tác giấy chứng nhận bị từ chối: đích không khớp',
      CERTIFICATE_TEMPLATE_DENIED:
        'Thao tác giấy chứng nhận bị từ chối: không có quyền mẫu',
    },

    title: 'Giấy chứng nhận',
    description: 'Yêu cầu và cấp giấy chứng nhận nhân viên',
    new: 'Yêu cầu giấy chứng nhận mới',
    edit: 'Chỉnh sửa yêu cầu giấy chứng nhận',
    detail: 'Chi tiết giấy chứng nhận',
    issue: 'Cấp giấy chứng nhận',
    refresh: 'Làm mới',
    clear: 'Xóa bộ lọc',
    search: 'Tìm mục đích',
    all: 'Tất cả trạng thái',
    name: 'Giấy chứng nhận',
    recordName: 'Giấy chứng nhận · {{name}}',
    type: 'Loại',
    purpose: 'Mục đích',
    copies: 'Số bản',
    delivery: 'Phương thức nhận',
    applicant: 'Người yêu cầu',
    createdAt: 'Thời điểm yêu cầu',
    status: 'Trạng thái',
    number: 'Số giấy chứng nhận',
    issueDate: 'Ngày cấp',
    oldest: 'Cũ nhất trước',
    newest: 'Mới nhất trước',
    empty: 'Không có yêu cầu giấy chứng nhận',
    noMatch: 'Không có yêu cầu phù hợp',
    failed: 'Không thể hoàn thành thao tác này',
    unavailable: 'Bản ghi hoặc thao tác này không còn khả dụng',
    retry: 'Thử lại',
    cancel: 'Hủy',
    save: 'Lưu bản nháp',
    saved: 'Đã lưu',
    loading: 'Đang tải chi tiết giấy chứng nhận',
    moreActions: 'Thao tác khác',
    backToList: 'Quay lại danh sách giấy chứng nhận',
    consequences: {
      withdraw:
        'Rút yêu cầu này; yêu cầu sẽ rời hàng đợi xem xét đang hoạt động.',
      terminate: 'Chấm dứt yêu cầu này; xử lý thông thường sẽ dừng.',
      forceComplete:
        'Kết thúc yêu cầu này theo ngoại lệ; không cấp giấy chứng nhận.',
      reject: 'Từ chối yêu cầu này; yêu cầu sẽ không được chuyển sang cấp.',
      return: 'Trả yêu cầu này cho người yêu cầu chỉnh sửa.',
      unable:
        'Ghi nhận nhân sự không thể cấp giấy chứng nhận; yêu cầu cần giải quyết.',
    },
    invalidInput: 'Kiểm tra các trường được chỉ ra và nhập giá trị hợp lệ.',
    invalidCopies: 'Nhập số nguyên từ 1 đến 100.',
    invalidPurpose: 'Mục đích tối đa 2.000 ký tự.',
    required: 'Bắt buộc',
    confirm: 'Xác nhận',
    discard: 'Bỏ thay đổi',
    discardDescription: 'Thay đổi chưa lưu của bạn sẽ bị mất.',
    confirmDescription:
      'Áp dụng thao tác này cho giấy chứng nhận do {{name}} yêu cầu? Thao tác thay đổi yêu cầu hiện tại.',
    history: 'Lịch sử phê duyệt',
    mode: 'Vị trí người xem xét',
    modes: {
      before: 'Trước quyết định của tôi',
      alongside: 'Song song với quyết định của tôi',
    },
    recipient: 'Người nhận',
    reason: 'Lý do hoặc bình luận',
    download: 'Tải DOCX',
    income: 'Thu nhập tháng (CNY)',
    template: 'Mẫu',
    selectTemplate: 'Chọn mẫu',
    revision: 'Phiên bản cố định',
    previous: 'Trước',
    next: 'Tiếp',
    prepare: 'Chuẩn bị cấp',
    generate: 'Tạo tài liệu',
    confirmIssue: 'Xác nhận cấp',
    issued: 'Đã cấp giấy chứng nhận',
    issueDescription:
      'Chuẩn bị phiên bản mẫu cố định, tạo tài liệu thực tế rồi xác nhận cấp và lưu hồ sơ.',
    invalidIssue:
      'Chọn ngày cấp và nhập thu nhập hợp lệ tối đa hai chữ số thập phân.',
    generateDescription:
      'Tạo có thể mất một lúc. Nếu thất bại, thử lại bước chuẩn bị này; chưa có giấy chứng nhận được cấp.',
    confirmIssueDescription:
      'Tài liệu được tạo sẽ được cấp và lưu vĩnh viễn trong hồ sơ nhân viên.',
    types: { employment: 'Việc làm', income: 'Thu nhập', other: 'Khác' },
    deliveries: {
      pickup: 'Nhận trực tiếp',
      mail: 'Bưu điện',
      digital: 'Điện tử',
    },
    states: {
      draft: 'Bản nháp',
      revision: 'Cần chỉnh sửa',
      head: 'Quản lý xem xét',
      issuing: 'Nhân sự xử lý',
      issued: 'Đã cấp phát',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
      issueException: 'Ngoại lệ cấp',
      administrativelyClosed: 'Đã đóng theo quản trị',
    },
    actions: {
      edit: 'Chỉnh sửa',
      submit: 'Gửi',
      withdraw: 'Rút lại',
      terminate: 'Chấm dứt',
      forceComplete: 'Đóng theo quản trị',
      retry: 'Thử xử lý lại',
      approve: 'Phê duyệt',
      reject: 'Từ chối',
      return: 'Trả lại để chỉnh sửa',
      claim: 'Nhận xử lý',
      release: 'Giải phóng',
      assign: 'Phân công',
      transfer: 'Chuyển giao',
      appoint: 'Chỉ định',
      reassign: 'Phân công lại',
      comment: 'Bình luận',
      read: 'Đánh dấu đã đọc',
      cc: 'Sao chép',
      addSigner: 'Thêm người xem xét',
      addSign: 'Thêm người xem xét',
      urge: 'Nhắc nhở',
      complete: 'Xác nhận cấp',
      unable: 'Không thể cấp',
      delegate: 'Người được ủy quyền',
      recall: 'Thu hồi',
    },
  },
};

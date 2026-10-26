export default {
  businessErrors: {
    DEPARTURE_CHECKLIST_REQUIRED:
      'Hoàn thành danh sách nghỉ việc trước khi tiếp tục.',
    DEPARTURE_LAST_WORKING_DAY_REQUIRED:
      'Xác nhận ngày làm việc cuối của nhân viên.',
    DEPARTURE_DATE_PAST:
      'Ngày làm việc cuối không được trước hôm nay theo múi giờ công ty.',
    DEPARTURE_HANDOVER_INVALID:
      'Chọn người nhận bàn giao đủ điều kiện khác nhân viên nghỉ việc.',
    DEPARTURE_HANDOVER_INCOMPLETE:
      'Hoàn thành các mục bàn giao trước khi tiếp tục.',
    DEPARTURE_ORDINARY_WORK_INCOMPLETE:
      'Hoàn thành bàn giao thông thường trước khi quyết toán nghỉ việc.',
    DEPARTURE_LOAN_UNCLEARED:
      'Thanh toán khoản tạm ứng còn nợ của nhân viên trước khi quyết toán nghỉ việc.',
    DEPARTURE_RECEIPT_REQUIRED:
      'Nhập chứng minh tiếp nhận hoặc thanh lý cho mục bàn giao này.',
    DEPARTURE_SETTLEMENT_NOTE_REQUIRED: 'Nhập ghi chú quyết toán nghỉ việc.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Hoàn thành phân công lại tác vụ còn tồn trước khi tiếp tục.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Chọn ngày làm việc cuối dự kiến và người nhận bàn giao.',
    DEPARTURE_TYPE_INVALID: 'Chọn loại nghỉ việc đang bật.',
    DEPARTURE_ALREADY_ACTIVE:
      'Nhân viên đã có yêu cầu nghỉ việc đang hoạt động. Mở yêu cầu hiện có.',
    DEPARTURE_CANCELLATION_PENDING:
      'Hủy nghỉ việc đang chờ. Giải quyết trước khi tiếp tục.',
    DEPARTURE_EXECUTION_BASELINE_CHANGED:
      'Nhân viên hoặc dữ kiện nghỉ việc đã thay đổi. Làm mới và xác minh trước khi thực hiện.',
  },

  authz: {
    cancel: 'Hủy nghỉ việc',
    resource: 'Nghỉ việc và bàn giao',
    view: 'Xem yêu cầu nghỉ việc',
    submit: 'Gửi yêu cầu nghỉ việc',
    delegate: 'Tạo yêu cầu nghỉ việc thay nhân viên',
    work: 'Xử lý bàn giao nghỉ việc',
    settle: 'Xác nhận quyết toán nghỉ việc',
  },
  schedule: {
    title: 'Thực hiện nghỉ việc',
    description:
      'Thực hiện nghỉ việc đến hạn và thử lại thay đổi tài khoản, thành viên chưa hoàn tất.',
  },

  title: 'Nghỉ việc và bàn giao',
  description: 'Kiểm tra nghỉ việc, bàn giao và thực thi ngày có hiệu lực.',
  new: 'Yêu cầu nghỉ việc mới',
  edit: 'Chỉnh sửa',
  number: 'Số yêu cầu',
  refresh: 'Làm mới',
  search: 'Tìm theo số yêu cầu, nhân viên hoặc lý do',
  view: 'Xem',
  allTypes: 'Tất cả loại nghỉ việc',
  allStatuses: 'Tất cả trạng thái',
  clearFilters: 'Xóa bộ lọc',
  emptyTitle: 'Không có yêu cầu nghỉ việc',
  emptyDescription: 'Đơn nghỉ việc và tiến độ bàn giao sẽ hiển thị tại đây.',
  noResults: 'Không có yêu cầu nghỉ việc phù hợp',
  departureType: 'Loại nghỉ việc',
  reason: 'Lý do',
  expectedLastWorkingDay: 'Ngày làm việc cuối dự kiến',
  lastWorkingDay: 'Ngày làm việc cuối đã xác nhận',
  handoverUser: 'Người nhận bàn giao',
  createdBy: 'Người tạo',
  application: 'Đơn',
  settlement: 'Quyết toán nhân sự',
  settlementDate: 'Ngày quyết toán',
  settlementNote: 'Ghi chú quyết toán',
  execution: 'Thực hiện nghỉ việc',
  notSettled: 'Quyết toán chưa hoàn tất.',
  notExecuted:
    'Thực hiện nghỉ việc chưa hoàn tất. Tài khoản chưa bị vô hiệu hóa.',
  executionComplete: 'Tài khoản và thành viên tổ chức đã bị vô hiệu hóa.',
  cancellationReason: 'Lý do hủy',
  cancellationGuidance:
    'Sau phỏng vấn, nhân sự có thể đề nghị hủy trước khi nghỉ thực tế. Người xem xét nhân sự khác phải xác nhận trước khi khôi phục việc làm.',
  handover: 'Công việc bàn giao',
  claimant: 'Người nhận xử lý',
  receiver: 'Người nhận',
  manager: 'Quản lý phụ trách',
  forcedBy: 'Người miễn trừ',
  forceReason: 'Lý do miễn trừ',
  checklistConfirmed: 'Đã xác nhận danh sách',
  receiverAcknowledged: 'Đã xác nhận tiếp nhận',
  yes: 'Có',
  no: 'Không',
  notReady: 'Yêu cầu gửi chưa đầy đủ.',
  views: {
    mine: 'Của tôi',
    pending: 'Đang chờ',
    done: 'Hoàn tất',
    copied: 'Đã sao chép',
  },
  statuses: {
    cancellationReview: 'Xác nhận hủy',
    cancelled: 'Đã hủy',
    draft: 'Bản nháp',
    revision: 'Trả lại để chỉnh sửa',
    manager: 'Quản lý xem xét',
    head: 'Trưởng phòng xem xét',
    hr: 'Phỏng vấn nhân sự',
    gm: 'Tổng giám đốc xem xét',
    handover: 'Bàn giao',
    completed: 'Đã hoàn tất quyết toán',
    withdrawn: 'Đã rút lại',
    rejected: 'Đã từ chối',
    terminated: 'Đã chấm dứt',
  },
  workKinds: {
    work: 'Bàn giao công việc',
    it: 'CNTT và tài khoản',
    admin: 'Tài sản và hành chính',
    finance: 'Tạm ứng và hoàn chi phí',
  },
  workStates: {
    cancelled: 'Đã hủy',
    open: 'Có thể nhận xử lý',
    claimed: 'Đang tiến hành',
    completed: 'Đã hoàn thành',
  },
  executionStates: {
    cancelled: 'Đã hủy',
    ready: 'Chờ ngày có hiệu lực',
    transferring: 'Đang chuyển giao phê duyệt đang chờ',
    blocked: 'Thực thi bị chặn',
    executed: 'Tài khoản đã vô hiệu hóa',
  },
  errors: {
    missingUnnamed:
      'Yêu cầu nghỉ việc không còn tồn tại. Đã quay lại danh sách nguồn.',
    missingReturned:
      '"{{name}}" không còn khả dụng. Đã quay lại danh sách nguồn.',
    forbidden: 'Bạn không còn quyền truy cập bản ghi này.',
    notFound: 'Bản ghi không tồn tại. Quay lại danh sách.',
    conflict:
      'Bản ghi đã thay đổi. Tải bản ghi mới nhất trước khi xác nhận lại.',
    invalid: 'Chưa đáp ứng yêu cầu thao tác. Kiểm tra bản ghi hiện tại.',
    failed: 'Yêu cầu thất bại. Thử tải lại.',
  },
  form: {
    create: 'Yêu cầu nghỉ việc mới',
    confirmSubmission: 'Xác nhận gửi nghỉ việc',
    submissionHelp:
      'Xác nhận ngày làm việc cuối dự kiến và người nhận bàn giao trước khi gửi phê duyệt.',
    edit: 'Chỉnh sửa yêu cầu nghỉ việc',
    save: 'Lưu bản nháp',
    saved: 'Đã lưu "{{name}}"',
    mode: 'Tạo cho',
    self: 'Đơn thôi việc của tôi',
    manual: 'Yêu cầu do nhân sự gửi thay',
    employee: 'Nhân viên',
    employeeSearch: 'Tìm nhân viên',
    chooseEmployee: 'Chọn nhân viên đang hoạt động',
    employeesDenied: 'Cần quyền truy cập hồ sơ nhân viên để chọn đối tượng.',
    previous: 'Ứng viên trước',
    next: 'Ứng viên tiếp theo',
    chooseType: 'Chọn loại nghỉ việc',
    chooseHandover: 'Chọn người nhận bàn giao',
    searchHandover: 'Tìm người nhận đủ điều kiện',
    handoverSearchMinimum:
      'Nhập ít nhất hai ký tự để tìm theo tên hoặc mã nhân viên.',
    noHandoverCandidates:
      'Không tìm thấy người nhận đủ điều kiện. Thử tên hoặc mã khác, hoặc nhờ nhân sự kiểm tra trạng thái nhân viên và tài khoản.',
    requiredOnSubmit: 'Bắt buộc khi gửi; tùy chọn khi lưu bản nháp.',
    handoverHelp:
      'Bắt buộc khi gửi; tùy chọn với bản nháp. Chọn nhân viên thử việc hoặc chính thức khác có tài khoản đang bật. Tìm theo tên hoặc mã nhân viên.',
    refineHandoverSearch:
      'Có nhiều người nhận phù hợp. Nhập tên cụ thể hơn để thu hẹp tìm kiếm.',
    required: 'Hoàn thành trường này.',
    dateInvalid: 'Chọn ngày lịch hợp lệ.',
    invalid: 'Kiểm tra trường này và thử lại.',
    dateHelp:
      'Ngày được xác nhận trong phỏng vấn nhân sự là ngày làm việc cuối chính thức.',
    manualHelp:
      'Nhân sự có thể tạo yêu cầu sa thải hoặc hết hạn hợp đồng cho nhân viên.',
    unavailable:
      'Bạn không thể tạo yêu cầu này. Kiểm tra trạng thái nhân viên và quyền của bạn.',
    unknown:
      'Chưa xác nhận kết quả lưu. Kiểm tra bản nháp hiện có trước khi tạo yêu cầu khác.',
    checkDrafts: 'Kiểm tra bản nháp hiện có',
    noProof:
      'Không tìm thấy bản nháp phù hợp. Điều này không chứng minh lưu thất bại. Giữ yêu cầu khóa và liên hệ nhân sự.',
    openDraft: 'Mở bản nháp này để xác minh',
    confirmDraft: 'Đây là yêu cầu đã lưu',
    storageUnavailable:
      'Bộ nhớ trình duyệt không khả dụng. Lưu bị tắt để ngăn yêu cầu trùng sau lần lưu gián đoạn.',
    unknownPersisted:
      'Yêu cầu tạo trước đó chưa được xác nhận. Khóa này giữ nguyên sau làm mới.',
  },
  actionForm: {
    approveConsequence:
      'Phê duyệt được cung cấp đã được ghi nhận. Phê duyệt cuối áp dụng kết quả việc làm đã duyệt.',

    uncertain:
      'Chưa xác nhận kết quả. Giữ nội dung này và thử lại đúng thao tác; không gửi yêu cầu đã thay đổi.',
    replay: 'Thử lại đúng thao tác',
    unsupported: 'Thao tác này cần hợp đồng đầu vào mà trang này không hỗ trợ.',
    person: 'Người nhận',
    mode: 'Vị trí người ký',
    place: 'Vị trí phê duyệt',
    releaseConsequence:
      'Thao tác giải phóng tác vụ phê duyệt đang chờ và không thể hoàn tác tại đây.',
    returnConsequence:
      'Yêu cầu được trả lại sửa và công việc đang chờ hiện tại được đóng.',
    submitConsequence:
      'Yêu cầu bắt đầu phê duyệt với dữ kiện đã gửi được cố định.',
    genericConsequence:
      'Máy chủ áp dụng thao tác được cung cấp cho đích phê duyệt đã chọn.',
    latest: 'Đọc phiên bản mới nhất',
    conflict:
      'Yêu cầu nghỉ việc đã thay đổi. Nội dung nhập được giữ. Đọc phiên bản mới nhất, kiểm tra rồi xác nhận lại.',
    completed: 'Đã hoàn tất {{action}} cho "{{name}}"',
    committed:
      'Thao tác đã hoàn tất. Làm mới yêu cầu nghỉ việc trước khi thực hiện thao tác khác.',
    before: 'Trước',
    after: 'Sau',
    alongside: 'Song song',
    revision: 'Người yêu cầu sửa',
    required: 'Hoàn thành trường này.',
    limit: 'Giá trị này quá dài.',
    title: '{{action}} nghỉ việc "{{name}}"',
    comment: 'Bình luận / lý do',
    confirm: 'Xác nhận',
    saved: 'Đã cập nhật "{{name}}"',
    unavailable: 'Thao tác không còn khả dụng. Tải bản ghi mới nhất.',
    unknown: 'Chưa xác nhận kết quả. Tải bản ghi mới nhất trước khi tiếp tục.',
    to: 'Người nhận',
    returnTarget: 'Trả về',
    confirmTitle: '{{action}} "{{name}}"?',
    confirmDescription:
      'Thao tác cập nhật quyết định nghỉ việc. Xác nhận nhân viên và bản ghi hiện tại.',
    lastWorkingDay: 'Ngày làm việc cuối đã xác nhận',
    settlementDate: 'Ngày quyết toán',
    settlementNote: 'Ghi chú quyết toán',
    labels: {
      requestCancellation: 'Yêu cầu hủy nghỉ việc',
      submit: 'Gửi',
      withdraw: 'Rút lại',
      terminate: 'Chấm dứt',
      settle: 'Xác nhận quyết toán',
      approve: 'Phê duyệt',
      reject: 'Từ chối',
      return: 'Trả lại',
      returnTo: 'Trả lại',
      comment: 'Bình luận',
      read: 'Đánh dấu đã đọc',
      urge: 'Đôn đốc',
      transfer: 'Chuyển giao',
      addSigner: 'Thêm người ký',
      cc: 'Sao chép',
      claim: 'Nhận xử lý',
      release: 'Giải phóng',
      appoint: 'Chỉ định',
      reassign: 'Phân công lại',
    },
  },
  work: {
    labels: {
      requestCancellation: 'Yêu cầu hủy nghỉ việc',
      claim: 'Nhận xử lý',
      confirmChecklist: 'Xác nhận danh sách',
      acknowledgeReceipt: 'Xác nhận tiếp nhận',
      complete: 'Hoàn thành',
      forceComplete: 'Buộc hoàn thành',
    },
    title: '{{action}} {{kind}} cho "{{name}}"',
    reason: 'Lý do miễn trừ',
    confirmChecklist: 'Tôi đã hoàn thành danh sách.',
    acknowledgeReceipt: 'Tôi đã nhận bàn giao.',
    blocked:
      'Thanh lý chưa hoàn tất. Giải quyết các mục tồn đọng được liệt kê.',
    forceWarning:
      'Buộc hoàn thành bàn giao không thay đổi dữ kiện tài sản hoặc sổ tài chính.',
    forceConfirm: 'Miễn trừ {{kind}} cho "{{name}}"?',
    forceDescription:
      'Chứng minh thanh lý thông thường sẽ bị bỏ qua. Lý do và người thao tác thực tế được kiểm toán.',
  },
  blockers: {
    generic:
      'Chưa đáp ứng điều kiện. Làm mới và nhờ người phụ trách giải quyết.',
    DEPARTURE_ASSET_SERVICE_UNAVAILABLE:
      'Thanh lý tài sản thông thường chưa khả dụng.',
    DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE:
      'Thanh lý hoàn chi phí không khả dụng.',
    DEPARTURE_LOANS_NOT_CLEARED:
      'Khoản tạm ứng hoặc khoản hoàn trả đã giữ chưa được thanh lý.',
    REIMBURSEMENT_DEPARTURE_NOT_CLEARED: 'Yêu cầu hoàn chi phí vẫn đang mở.',
    DEPARTURE_APPLICATION_INCOMPLETE:
      'Chọn ngày dự kiến và người nhận bàn giao.',
    DEPARTURE_DATE_PAST: 'Ngày làm việc cuối dự kiến ở quá khứ.',
    DEPARTURE_REASSIGNMENT_UNAVAILABLE:
      'Chuyển giao phê duyệt không khả dụng. Tài khoản vẫn được bật.',
    DEPARTURE_REASSIGNMENT_INCOMPLETE:
      'Phê duyệt đang chờ vẫn được gán cho nhân viên này.',
    DEPARTURE_EXECUTION_FAILED:
      'Thực hiện nghỉ việc thất bại và sẽ được tác vụ hằng ngày thử lại.',
  },
};

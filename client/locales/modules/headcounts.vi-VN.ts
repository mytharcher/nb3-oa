export default {
  headcounts: {
    technicalDetails: 'Chi tiết kỹ thuật',
    copyId: 'Sao chép ID nội bộ',
    copyFailed: 'Không thể sao chép ID nội bộ.',

    name: '{{department}} / {{position}} / {{year}}',
    createSubmit: 'Tạo',
    idCopied: 'Đã sao chép ID tài khoản',
    title: 'Sổ định biên',
    description:
      'Năng lực hằng năm và nhân viên thực tế chiếm chỗ. Khởi tạo tài khoản trước khi tuyển dụng.',
    account: 'Định biên năm',
    state: 'Trạng thái khởi tạo',
    create: 'Định biên năm mới',
    adjust: 'Điều chỉnh giới hạn',
    alreadyInitialized:
      'Tài khoản đã được khởi tạo. Không thể đếm lại số chỗ thực tế tại đây.',
    reconcile: 'Xác minh và khởi tạo',
    confirmInitialize: 'Xác nhận khởi tạo',
    initialized: 'Đã khởi tạo',
    uninitialized: 'Chưa khởi tạo',
    view: 'Xem định biên',
    refresh: 'Làm mới',
    cancel: 'Hủy',
    save: 'Lưu',
    clearFilters: 'Xóa bộ lọc',
    allPositions: 'Tất cả vị trí',
    rowActions: 'Thao tác cho “{{name}}”',
    empty: 'Không có định biên năm',
    noResults: 'Không có định biên năm phù hợp',
    filterHelp: 'Thay đổi bộ lọc.',
    emptyManage: 'Tạo tài khoản và xác minh danh sách nhân sự.',
    emptyRead: 'Nhờ nhân sự nhập định biên năm.',
    journal: 'Nhật ký nguồn',
    noJournal: 'Chưa có sự kiện nguồn',
    noJournalPermission: 'Bạn không có quyền đọc nhật ký nguồn.',
    uninitializedHelp:
      'Tài khoản chưa khởi tạo và không thể dùng tuyển dụng. Xác minh danh sách nhân sự đầy đủ.',
    rosterHelp:
      'Xác minh danh sách đầy đủ gồm nhân viên thử việc, chính thức và đang nghỉ việc.',
    rosterEmpty:
      'Hiện không có nhân viên phù hợp chiếm chỗ tài khoản này. Xác nhận danh sách thực tế trống.',
    rosterCount: '{{count}} nhân viên',
    confirmRoster: 'Tôi đã xác minh danh sách nhân viên đầy đủ',
    created: 'Đã tạo "{{name}}". Tiếp theo hãy xác minh và khởi tạo.',
    adjusted: 'Đã cập nhật giới hạn cho "{{name}}".',
    reconciled: 'Đã khởi tạo "{{name}}" để tuyển dụng.',
    invalidYear: 'Nhập năm nguyên từ 1900 đến 9999.',
    invalidLimit: 'Nhập số nguyên từ 0 đến 1.000.000.',
    reasonRequired: 'Nhập lý do từ 1 đến 5.000 ký tự.',
    selectRequired: 'Chọn phòng ban và vị trí hiện được cấp quyền.',
    rosterConfirmationRequired: 'Xác nhận bạn đã xác minh danh sách đầy đủ.',
    noAccess: 'Bạn không có quyền đọc định biên này.',
    missing: 'Tài khoản định biên không tồn tại hoặc không thể truy cập.',
    failed: 'Không thể hoàn thành yêu cầu. Thử lại.',
    loadLatest: 'Tải dữ liệu mới nhất',
    unknownOutcome: 'Kết quả chưa được xác nhận. Giữ lệnh này và thử lại.',
    retryCommand: 'Thử lại thao tác này',
    reduceTitle: 'Giảm giới hạn định biên cho “{{account}}”?',
    reduceDescription:
      'Giới hạn thay đổi từ {{previous}} thành {{next}}. Phải bảo đảm đủ cho chỗ đã chiếm và đã giữ hiện có.',
    reduceConfirm: 'Xác nhận giảm',
    minimumLimit:
      'Tổng chỗ đã chiếm và đã giữ hiện tại là {{count}}. Giới hạn mới không được thấp hơn.',
    discard: 'Bỏ thay đổi chưa lưu?',
    discardDescription: 'Đóng sẽ bỏ những thay đổi chưa lưu này.',
    discardConfirm: 'Bỏ thay đổi',
    noTargets:
      'Không có phòng ban và vị trí đích được cấp quyền. Nhờ quản trị viên kiểm tra quyền quản lý định biên.',
    recruitmentSource: 'Xem yêu cầu tuyển dụng',
    transferSource: 'Xem yêu cầu điều chuyển',
    fields: {
      department: 'Phòng ban',
      position: 'Vị trí',
      year: 'Năm định biên',
      limit: 'Giới hạn được duyệt',
      used: 'Chỗ nhân viên chiếm',
      pending: 'Khoản giữ đang chờ',
      allocated: 'Đã duyệt, chưa tiếp nhận',
      available: 'Sức chứa khả dụng',
      id: 'ID nội bộ',
      version: 'Phiên bản',
      updatedAt: 'Thời điểm cập nhật',
      reason: 'Lý do',
      replacementPending: 'Thay thế tương lai đang chờ',
      replacementAllocated: 'Thay thế tương lai đã duyệt',
      replacementBlocked: 'Chỗ thay thế bị chặn',
    },
    journalActions: {
      create: 'Tạo tài khoản',
      reconcile: 'Xác minh và khởi tạo',
      adjustLimit: 'Điều chỉnh giới hạn',
      hold: 'Giữ sức chứa',
      reviseHold: 'Sửa khoản giữ',
      allocate: 'Phân bổ sức chứa đã duyệt',
      close: 'Đóng nguồn',
      consume: 'Sử dụng cho tiếp nhận nhân viên',
      releaseEmployee: 'Giải phóng chỗ nhân viên chiếm',
      invalidateReplacement: 'Vô hiệu thay thế',
      rebindOut: 'Chuyển liên kết ra',
      rebindIn: 'Chuyển liên kết vào',
      transferOut: 'Điều chuyển ra',
      transferIn: 'Điều chuyển vào',
      claimReplacement: 'Nhận chỗ thay thế',
      cancelReplacement: 'Hủy chỗ thay thế',
      fulfillReplacement: 'Hoàn tất thay thế',
      other: 'Thay đổi định biên',
    },
    journalColumns: {
      time: 'Thời gian',
      actor: 'Người thao tác',
      action: 'Thao tác',
      source: 'Nguồn nghiệp vụ',
    },
    employeeStatus: {
      probation: 'Thử việc',
      regular: 'Chính thức',
      leaving: 'Đang nghỉ việc',
    },
    authz: {
      title: 'Sức chứa định biên',
      view: 'Xem sức chứa',
      manage: 'Quản lý sức chứa năm',
      viewJournal: 'Xem nhật ký nguồn',
    },
    errors: {
      HEADCOUNT_ROSTER_ACCESS_DENIED:
        'Không thể đọc danh sách nhân viên đầy đủ. Nhờ quản trị viên kiểm tra quyền đọc nhân viên.',
      HEADCOUNT_ACCESS_DENIED:
        'Bạn không có quyền thực hiện thao tác định biên này.',
      HEADCOUNT_FIELD_ACCESS_DENIED:
        'Trường tổng hợp sức chứa ngoài phạm vi quyền của bạn.',
      HEADCOUNT_NOT_FOUND: 'Tài khoản định biên không khả dụng.',
      HEADCOUNT_ALREADY_EXISTS: 'Phòng ban, vị trí và năm này đã có tài khoản.',
      HEADCOUNT_NOT_INITIALIZED:
        'Đối soát danh sách nhân viên đầy đủ trước khi giữ sức chứa.',
      HEADCOUNT_INCOMPLETE_ROSTER:
        'Chọn danh sách thực tế đầy đủ gồm thử việc, chính thức và đang nghỉ.',
      HEADCOUNT_ROSTER_DRIFT:
        'Danh sách nhân viên thực tế đã thay đổi. Đối soát dữ kiện nguồn trước khi tiếp tục.',
      HEADCOUNT_VERSION_CONFLICT:
        'Tài khoản đã thay đổi. Làm mới trước khi lưu.',
      HEADCOUNT_IDEMPOTENCY_CONFLICT: 'Mã yêu cầu này đã thuộc thao tác khác.',
      HEADCOUNT_INSUFFICIENT:
        'Giới hạn năm không đủ cho định biên thực tế đã chiếm và đã giữ.',
      HEADCOUNT_INVALID_NUMBER: 'Nhập số người nguyên có giới hạn.',
      HEADCOUNT_INVALID_ACCOUNT: 'Chọn phòng ban, vị trí và năm thực.',
      HEADCOUNT_INVALID_IDENTITY:
        'Chọn phòng ban và vị trí tổ chức đang hoạt động.',
      HEADCOUNT_INVALID_COMMAND: 'Cần người thao tác, mã yêu cầu và lý do.',
      HEADCOUNT_INVALID_SOURCE: 'Cần loại nguồn và mã định danh thực.',
      HEADCOUNT_INVALID_REPLACEMENTS:
        'Mỗi chỗ thay thế cần nhân viên nghỉ việc riêng biệt.',
      HEADCOUNT_INVALID_REPLACEMENT:
        'Nguồn thay thế phải khớp chỗ thực của nhân viên đang hoặc đã nghỉ.',
      HEADCOUNT_REPLACEMENT_UNAVAILABLE:
        'Chỗ thay thế này thiếu hoặc đã được nhận.',
      HEADCOUNT_REPLACEMENT_BLOCKED:
        'Nhân viên nguồn được khôi phục chặn chỗ thay thế này.',
      HEADCOUNT_EMPLOYEE_NOT_FOUND: 'Hồ sơ nhân viên không khả dụng.',
      HEADCOUNT_EMPLOYEE_MISMATCH:
        'Nhân viên thực tế không khớp phòng ban và vị trí đã phân bổ.',
      HEADCOUNT_ALREADY_OCCUPIED:
        'Nhân viên đã chiếm chỗ trong tài khoản năm này.',
      HEADCOUNT_YEAR_REBIND_REQUIRED:
        'Chủ động chuyển liên kết sang năm công ty hiện tại trước khi sử dụng.',
      HEADCOUNT_SOURCE_NOT_FOUND: 'Nguồn sức chứa không khả dụng.',
      HEADCOUNT_SOURCE_EXISTS: 'Nguồn này đã có khoản giữ.',
      HEADCOUNT_SOURCE_STATE: 'Trạng thái nguồn không cho phép thao tác này.',
      HEADCOUNT_SOURCE_CLOSED: 'Nguồn sức chứa đã đóng.',
      HEADCOUNT_SEAT_STATE: 'Chỗ giữ không ở trạng thái đang chờ.',
      HEADCOUNT_STATE_CONFLICT: 'Chỗ giữ đã thay đổi.',
      HEADCOUNT_NO_ALLOCATION: 'Không còn chỗ đã duyệt khả dụng.',
      HEADCOUNT_NOT_LEFT:
        'Cần nghỉ việc thực tế trước khi giải phóng sức chứa đã chiếm.',
      HEADCOUNT_OCCUPANCY_NOT_FOUND:
        'Cần chỗ nhân viên thực tế chưa giải phóng.',
      HEADCOUNT_NOT_RESTORED:
        'Cần khôi phục thực tế trước khi chặn thay thế tương lai.',
      HEADCOUNT_INVALID_REBIND:
        'Chuyển liên kết năm phải giữ phòng ban, vị trí và chuyển về tương lai.',
      HEADCOUNT_REPLACEMENT_REBIND_REQUIRED:
        'Quyền thay thế cần nguồn năm đích rõ ràng.',
      HEADCOUNT_INVALID_TRANSFER: 'Cần khoản giữ đích đã duyệt riêng biệt.',
      HEADCOUNT_INVALID_PAGE: 'Chọn kích thước trang từ 1 đến 100.',
      HEADCOUNT_GUARD_UNAVAILABLE: 'Bảo vệ giao dịch sức chứa không khả dụng.',
    },
  },
};

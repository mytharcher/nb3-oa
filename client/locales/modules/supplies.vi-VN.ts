export default {
  supplies: {
    namedRowActions: 'Thao tác cho {{name}}',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS: 'Thêm ít nhất một mục và nhập mục đích.',
      SUPPLY_ITEM_UNAVAILABLE:
        'Mục đã chọn không khả dụng. Chọn lại mục đang bật.',
      SUPPLY_CONTENT_CHANGED:
        'Mục đã duyệt đã thay đổi. Làm mới yêu cầu trước khi ghi cấp phát.',
    },

    rowActions: 'Thao tác bản ghi',
    number: 'Số đề nghị',
    unknownEdit:
      'Kết quả lưu chưa chắc chắn. Tải yêu cầu mới nhất trước khi chỉnh sửa lại.',
    emptyCatalog:
      'Chưa cấu hình vật tư văn phòng đang hoạt động. Liên hệ hành chính.',
    ledgerDetail: 'Bản ghi cấp phát',
    ledgerDescription:
      'Số lượng ghi nhận và đóng quản trị. Số lượng chưa xác nhận không chứng minh giao hàng.',
    entryMissing: 'Bản ghi cấp phát không khả dụng.',
    authz: {
      resource: 'Đề nghị vật tư',
      ledger: 'Đọc sổ cấp phát vật tư',
    },
    navigation: 'Sổ vật tư',
    new: 'Đề nghị vật tư mới',
    edit: 'Chỉnh sửa đề nghị vật tư',
    formDescription:
      'Chọn mặt hàng và số lượng. Quản lý duyệt trước khi hành chính cấp phát.',
    purpose: 'Mục đích',
    item: 'Mặt hàng',
    items: 'Mặt hàng yêu cầu',
    quantity: 'Số lượng',
    quantityValue: 'Số lượng: {{quantity}}',
    chooseItem: 'Chọn mặt hàng',
    line: 'Mục {{number}}',
    remove: 'Gỡ mặt hàng {{number}}',
    addItem: 'Thêm mục',
    quantityInvalid: 'Nhập số lượng nguyên từ 1 đến 100.000.',
    duplicate: 'Chỉ chọn mỗi mặt hàng một lần.',
    emailInvalid: 'Nhập địa chỉ email hợp lệ.',
    printRequired: 'Hoàn thành thông tin in danh thiếp bắt buộc.',
    print: {
      name: 'Tên',
      title: 'Chức danh',
      phone: 'Điện thoại',
      email: 'Email',
      address: 'Địa chỉ',
      department: 'Phòng ban (tùy chọn)',
    },
    approvedAt: 'Thời điểm quản lý phê duyệt',
    issuingStage: 'Cấp phát hành chính',
    resubmitHint:
      'Gửi lại mục và mục đích không đổi sẽ trở về hành chính. Thay đổi cần quản lý duyệt lại. Phê duyệt trước giữ trong lịch sử.',
    forcedHint:
      'Quản trị viên phê duyệt đóng yêu cầu mà không xác nhận cấp phát vật lý. Số lượng thực tế chưa xác nhận.',
    uncertainCreate:
      'Kết quả lưu chưa chắc chắn. Đóng và kiểm tra Yêu cầu của tôi trước khi tạo bản nháp khác.',
    invalid: 'Kiểm tra mục đích, lựa chọn mặt hàng và số lượng nguyên.',
    itemUnavailable:
      'Mặt hàng bị tắt hoặc thiếu. Làm mới trước khi gửi nội dung thay đổi.',
    inactive: 'Cần hồ sơ nhân viên đang hoạt động.',
    configuration:
      'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    contentChanged:
      'Nội dung không còn khớp yêu cầu đã duyệt. Tải phiên bản mới nhất.',
    reasonRequired: 'Cung cấp lý do.',
    actions: {
      claim: 'Nhận cấp phát',
      release: 'Nhả nhận xử lý',
      assign: 'Phân công người xử lý',
      complete: 'Xác nhận cấp',
      unable: 'Không thể cấp',
      forceComplete: 'Buộc đóng',
    },
    actionHints: {
      complete:
        'Xác nhận mọi mặt hàng đã cấp vật lý đủ số lượng yêu cầu. Thao tác ghi sổ cấp phát.',
      unable:
        'Giải thích thiếu hàng hoặc lý do không thể hoàn tất cấp phát khác. Giữ phê duyệt quản lý.',
      release: 'Nhả nhận xử lý để người hành chính khác tiếp nhận.',
      forceComplete:
        'Đóng theo quyết định quản trị mà không xác nhận giao hàng. Số lượng thực tế ghi là chưa xác nhận. Cần lý do.',
    },
    states: {
      issuing: 'Chờ cấp phát',
      exception: 'Ngoại lệ cấp',
      issued: 'Đã cấp phát',
      forcedClosed: 'Đã đóng theo quản trị',
    },
    ledgerTitle: 'Sổ cấp phát vật tư',
    requestedQuantity: 'Số lượng yêu cầu',
    actualQuantity: 'Số lượng thực tế',
    outcome: 'Kết quả',
    recipient: 'Người nhận',
    issuer: 'Người xử lý',
    unconfirmed: 'Chưa xác nhận',
    reason: 'Lý do',
    emptyLedger: 'Không có bản ghi cấp phát',
    viewRequest: 'Xem đề nghị',
  },
};

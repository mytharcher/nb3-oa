export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        'Mỗi mục mua cần tên, đơn vị và số lượng dương. Kiểm tra mục trùng.',
      PURCHASE_INVALID_DATE: 'Chọn ngày nhận dự kiến hợp lệ.',
      PURCHASE_INVALID_PRICE:
        'Nhập giá thực tế dương, chọn nhà cung cấp và đính kèm chứng minh báo giá.',
      PURCHASE_INVALID_QUOTES:
        'Không dùng lại một tệp báo giá cho các nhà cung cấp khác nhau. Chọn chứng minh riêng.',
      PURCHASE_QUOTES_REQUIRED:
        'Mức tiền này cần báo giá từ ba nhà cung cấp khác nhau, mỗi báo giá có tệp đính kèm.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        'Sửa dự toán thành giá báo đã xác nhận trước khi gửi lại.',
      PURCHASE_INVALID_INPUT:
        'Thêm mục mua và mục đích, nhập số tiền dự kiến dương.',
      PURCHASE_DEPARTMENT_REQUIRED:
        'Người yêu cầu cần phòng ban chính đang hoạt động. Nhờ nhân sự cập nhật hồ sơ nhân viên.',
      INVALID_RECEIPT:
        'Chọn ngày nhận thực tế và nhập lý do xác nhận nhận hàng.',
    },

    discardThenNavigate:
      'Bỏ thay đổi chưa lưu này? Sau khi xác nhận, chọn lại đích.',
    localInputsRetained:
      'Đã tải phiên bản mới nhất. Nội dung nhập được giữ; kiểm tra trước khi lưu lại.',
    chooseForceMode: 'Chọn phương thức xử lý',
    confirmForceClose: 'Đóng mua sắm {{name}}?',
    confirmPricing: 'Xác nhận báo giá cho {{name}}?',
    confirmCancelOrder: 'Hủy đơn hàng {{name}}?',
    priceWillReturn:
      'Giá vượt dự toán hơn 20%. Yêu cầu được trả cho người yêu cầu xác nhận trước khi tài chính xem xét.',
    pricingSubmitConsequence:
      'Gửi cố định báo giá cho giai đoạn phê duyệt tiếp theo và điều chỉnh khoản giữ ngân sách.',

    new: 'Mua sắm mới',
    edit: 'Chỉnh sửa mua sắm',
    saved: 'Đã lưu mua sắm',
    formDescription:
      'Mô tả mục mua, mục đích và dự toán. Gửi giữ ngân sách phòng ban chính cho năm hiện tại theo lịch công ty.',
    primaryDepartment: 'Phòng ban chính: {{department}}',
    yearHint: 'Năm gửi theo lịch công ty ({{timeZone}}).',
    departmentMissing: 'Không có phòng ban chính',
    department: 'Phòng ban',
    departmentPending: 'Xác định khi gửi',
    departmentUnavailable: 'Phòng ban không khả dụng',
    budgetYear: 'Năm ngân sách',
    purpose: 'Mục đích',
    subject: 'Khoản mục ngân sách',
    selectSubject: 'Chọn khoản mục ngân sách',
    estimated: 'Số tiền dự kiến',
    actual: 'Giá thực tế',
    actualAmount: 'Giá thực tế (nhân dân tệ)',
    yuan: 'nhân dân tệ',
    expectedDate: 'Ngày giao hàng dự kiến',
    suggestedVendor: 'Nhà cung cấp đề xuất',
    selectedVendor: 'Nhà cung cấp đã chọn',
    vendor: 'Nhà cung cấp',
    vendorUnavailable: 'Nhà cung cấp không khả dụng',
    noSuggestedVendor: 'Không có nhà cung cấp đề xuất',
    vendorInactive: 'Chọn nhà cung cấp đang hoạt động',
    subjectInactive: 'Chọn khoản mục ngân sách đang hoạt động',
    disabled: 'Đã vô hiệu hóa',
    inactive: 'Không hoạt động',
    fieldInvalid: 'Kiểm tra trường này',
    amountInvalid: 'Nhập số tiền dương tối đa hai chữ số thập phân',
    amountHint: 'Dùng tối đa hai chữ số thập phân.',
    dateInvalid: 'Chọn ngày hợp lệ',
    items: 'Mục mua sắm',
    itemName: 'Tên mặt hàng',
    itemNumber: 'Mục {{number}}',
    specification: 'Quy cách',
    quantity: 'Số lượng',
    unit: 'Đơn vị',
    quantityInvalid: 'Nhập số lượng dương; hỗ trợ thập phân',
    quantityHint: 'Hỗ trợ số lượng thập phân, ví dụ 1,5 kg.',
    addItem: 'Thêm mục',
    removeItem: 'Gỡ mục',
    reserveHint: 'Bản nháp không giữ ngân sách. Gửi mới tạo khoản giữ.',
    loadLatest: 'Tải yêu cầu mới nhất',
    unknownCreate:
      'Chưa chắc chắn kết quả lưu. Chặn tạo khác. Kiểm tra bản nháp trong trung tâm tác vụ.',
    unknownEdit:
      'Chưa chắc chắn kết quả lưu. Tải yêu cầu mới nhất trước khi tiếp tục.',
    unknownPricing:
      'Kết quả chưa chắc chắn và biểu mẫu bị khóa. Thử lại gửi đúng cùng dữ liệu và ID yêu cầu.',
    quotes: 'Chứng minh báo giá',
    quoteEvidence: 'Chứng minh báo giá nhà cung cấp',
    quoteEvidenceDescription:
      'Tải chứng minh cho mỗi nhà cung cấp. Có thể dùng lại khi yêu cầu không đổi. Trên ngưỡng báo giá cố định cần chứng minh từ ba nhà cung cấp riêng biệt.',
    addQuote: 'Thêm báo giá nhà cung cấp',
    removeQuote: 'Bỏ chọn báo giá',
    threeQuotesRequired:
      'Trên ngưỡng báo giá, cung cấp tệp báo giá từ ba nhà cung cấp riêng biệt.',
    selectExistingQuote: 'Chọn báo giá hiện có: {{filename}}',
    refreshQuotes: 'Làm mới báo giá hiện có',
    completePricing: 'Hoàn tất định giá',
    forcePricing: 'Thao tác mua sắm của quản trị viên',
    forceMode: 'Chế độ thao tác',
    forcePriced: 'Gửi kết quả đầy đủ để tài chính phê duyệt',
    forceClose: 'Buộc đóng không tạo đơn hàng',
    forceCloseDescription:
      'Buộc đóng giải phóng khoản giữ ngân sách và ghi lý do quản trị viên. Không tuyên bố mua sắm hay nhận hàng hoàn tất và không tạo đơn hàng.',
    priceConfirmationDescription:
      'Giá trên 120% dự toán trả cho người yêu cầu xác nhận. Kết quả khác vào phê duyệt tài chính.',
    confirmPriceHint: 'Giá vượt 120% dự toán. Kiểm tra và gửi lại để xác nhận.',
    handler: 'Người xử lý mua sắm',
    forcedClosedHint:
      'Quản trị viên buộc đóng yêu cầu. Khoản giữ được giải phóng, không tạo đơn hàng hoặc biên nhận.',
    actualHold: 'Khoản giữ ngân sách hiện tại',
    holdHint:
      'Phê duyệt giữ khoản ngân sách. Ngân sách quyết toán khi người yêu cầu xác nhận nhận hàng.',
    order: 'Đơn đặt hàng',
    orderHint:
      'Đơn hàng cố định giá đã duyệt, nhà cung cấp và mục mua. Theo dõi nhận hàng và thanh toán riêng.',
    openOrder: 'Mở đơn hàng',
    mergedTitle: 'Đã gộp phê duyệt liền kề',
    merged:
      '{{name}} đã tự hoàn thành giai đoạn liền kề; phê duyệt cùng người được gộp.',
    authz: {
      orderScope: 'Đơn hàng từ yêu cầu mua sắm người dùng được đọc',
      resource: 'Mua sắm',
      submit: 'Gửi mua sắm',
      view: 'Xem mua sắm',
      orders: 'Xem đơn đặt hàng',
      accept: 'Xác nhận đã nhận',
    },
    errors: {
      insufficient: 'Ngân sách khả dụng không đủ. Liên hệ chủ ngân sách.',
      inactive: 'Người yêu cầu không hoạt động.',
      configuration:
        'Cấu hình phê duyệt không được hỗ trợ. Liên hệ quản trị viên.',
      invalid: 'Kiểm tra trường được đánh dấu.',
    },
    states: {
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      head: 'Phê duyệt phòng ban',
      purchasing: 'Xử lý mua sắm',
      exception: 'Ngoại lệ mua sắm',
      finance: 'Phê duyệt tài chính',
      executive: 'Phê duyệt điều hành',
      gm: 'Phê duyệt tổng giám đốc',
      approved: 'Đã phê duyệt',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
      forcedClosed: 'Đã buộc đóng',
    },
    stages: {
      draft: 'Bản nháp',
      revision: 'Phiên bản',
      head: 'Phê duyệt phòng ban',
      purchasing: 'Xử lý mua sắm',
      exception: 'Ngoại lệ mua sắm',
      finance: 'Phê duyệt tài chính',
      executive: 'Phê duyệt điều hành',
      gm: 'Phê duyệt tổng giám đốc',
      approved: 'Đã phê duyệt',
      rejected: 'Đã từ chối',
      withdrawn: 'Đã rút lại',
      terminated: 'Đã chấm dứt',
      forcedClosed: 'Đã buộc đóng',
    },
    actions: {
      claim: 'Nhận xử lý',
      release: 'Nhả nhận xử lý',
      complete: 'Hoàn tất định giá',
      unable: 'Không thể mua sắm',
      forceComplete: 'Thao tác quản trị viên',
      cc: 'Sao chép',
    },
    ledgerTitle: 'Sổ đơn đặt hàng',
    ledgerDescription:
      'Kiểm tra đơn đặt hàng đã duyệt, trạng thái nhận và bản ghi thanh toán. Nhận hàng quyết toán ngân sách; thanh toán ghi riêng.',
    orderNumber: 'Số đơn hàng',
    emptyOrders: 'Không có đơn đặt hàng trong phạm vi của bạn',
    pendingPayments: 'Thanh toán đang chờ (nhân dân tệ)',
    paidPayments: 'Số tiền đã trả (nhân dân tệ)',
    receiptDate: 'Ngày nhận',
    acceptedBy: 'Người xác nhận nhận hàng',
    receiptReason: 'Ghi chú nhận hàng',
    confirmReceipt: 'Xác nhận đã nhận',
    cancelOrder: 'Hủy đơn hàng',
    orderSaved: 'Đã cập nhật đơn hàng',
    unknownOrderAction:
      'Kết quả chưa chắc chắn. Biểu mẫu bị khóa; thử lại gửi đúng cùng dữ liệu và ID yêu cầu.',
    receiptSettlementHint:
      'Xác nhận quyết toán khoản giữ ngân sách đơn hàng. Không có nghĩa nhà cung cấp đã nhận tiền. Biên nhận đã xác nhận là bất biến.',
    cancelOrderHint:
      'Chỉ quản trị viên phê duyệt được hủy đơn chưa nhận không có khoản đang chờ hoặc đã trả. Hủy giải phóng khoản giữ và ghi lý do.',
    orderStates: {
      awaitingReceipt: 'Chờ nhận hàng',
      accepted: 'Đã nhận',
      cancelled: 'Đã hủy',
    },
    actionTitle: '{{action}} mua sắm “{{name}}”',
    completed: 'Đã hoàn tất {{action}} cho mua sắm “{{name}}”',
    quoteBasisChanged:
      'Yêu cầu mua sắm đã thay đổi. Nội dung bản nháp được giữ nhưng chứng minh báo giá phải khớp yêu cầu mới nhất.',
    frozenRules: 'Quy tắc áp dụng lúc gửi',
    frozenRulesHint:
      'Chỉ số tiền vượt hẳn các ngưỡng này mới cần chứng minh báo giá hoặc giai đoạn phê duyệt tương ứng. Thay đổi quy tắc sau không đổi lần gửi này.',
    ruleLabels: {
      purchase_quotes: 'Ngưỡng báo giá ba nhà cung cấp',
      spend_vp: 'Ngưỡng phê duyệt điều hành',
      spend_gm: 'Ngưỡng phê duyệt tổng giám đốc',
    },
    staleQuoteUpload:
      'Phiên bản xử lý đã thay đổi. Làm mới yêu cầu trước khi tải chứng minh báo giá lên.',
    ordersTitle: 'Đơn đặt hàng',
  },
};

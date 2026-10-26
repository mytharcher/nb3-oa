export default {
  actionForm: {
    uncertain:
      'Chưa xác nhận kết quả. Giữ nội dung này và thử lại đúng thao tác; không gửi yêu cầu đã thay đổi.',
    replay: 'Thử lại đúng thao tác',
    title: '{{action}} yêu cầu thanh toán “{{name}}”',
    unavailable:
      'Thao tác không còn khả dụng. Đọc yêu cầu thanh toán mới nhất.',
    unsupported: 'Thao tác này cần hợp đồng đầu vào mà trang này không hỗ trợ.',
    comment: 'Ý kiến hoặc lý do',
    person: 'Người nhận',
    mode: 'Vị trí người ký',
    place: 'Vị trí phê duyệt',
    returnTarget: 'Đích trả lại',
    voucher: 'Số chứng từ thanh toán',
    voucherHint: 'Chỉ để trống khi ghi quyết toán quản trị không có chứng từ.',
    amount: 'Số tiền thanh toán',
    amountConfirm: 'Xác nhận số tiền thanh toán chính xác',
    voucherAttachments: 'Tệp chứng từ thanh toán',
    exactAmount: 'Nhập đúng số tiền hiển thị bên trên.',
    confirm: 'Xác nhận {{action}}',
    confirmDescription:
      'Xác nhận thao tác này trên “{{name}}”. Thanh toán {{amount}}. {{consequence}}',
    releaseConsequence:
      'Thao tác giải phóng khoản giữ chưa quyết toán và không thể hoàn tác tại đây.',
    returnConsequence:
      'Yêu cầu được trả lại sửa và công việc đang chờ hiện tại được đóng.',
    paymentConsequence:
      'Ghi khoản thanh toán thực tế đã hoàn tất bằng chứng từ.',
    forcedConsequence:
      'Ghi quyết toán quản trị; thao tác không khởi tạo chuyển khoản ngân hàng.',
    unableConsequence: 'Yêu cầu chuyển sang ngoại lệ xử lý.',
    submitConsequence:
      'Yêu cầu bắt đầu phê duyệt với dữ kiện đã gửi được cố định.',
    genericConsequence:
      'Máy chủ áp dụng thao tác được cung cấp cho đích phê duyệt đã chọn.',
    latest: 'Đọc phiên bản mới nhất',
    conflict:
      'Yêu cầu thanh toán đã thay đổi. Nội dung nhập được giữ. Đọc phiên bản mới nhất, kiểm tra rồi xác nhận lại.',
    completed: 'Đã hoàn tất {{action}} cho “{{name}}”',
    committed:
      'Thao tác đã hoàn tất. Làm mới yêu cầu thanh toán trước khi thực hiện thao tác khác.',
    before: 'Trước',
    after: 'Sau',
    alongside: 'Song song',
    revision: 'Người yêu cầu sửa',
    required: 'Hoàn thành trường này.',
    labels: {
      approve: 'Phê duyệt',
      reject: 'Từ chối',
      return: 'Trả lại để sửa',
      returnTo: 'Trả lại để sửa',
      submit: 'Gửi phê duyệt',
      withdraw: 'Rút lại',
      terminate: 'Chấm dứt',
      retryCash: 'Thủ quỹ thử lại',
      retryCashAsAdmin: 'Thủ quỹ thử lại theo quản trị',
      forcePayException: 'Ghi quyết toán ngoại lệ',
      forceComplete: 'Quyết toán quản trị',
      reviseBusiness: 'Sửa để phê duyệt',
      claim: 'Nhận xử lý',
      release: 'Giải phóng',
      assign: 'Phân công',
      complete: 'Xác nhận thanh toán',
      unable: 'Không thể thanh toán',
      transfer: 'Chuyển giao',
      addSigner: 'Thêm người ký',
      cc: 'Sao chép',
      appoint: 'Chỉ định',
      reassign: 'Phân công lại',
      comment: 'Bình luận',
      read: 'Đánh dấu đã đọc',
      urge: 'Nhắc nhở',
    },
  },
};

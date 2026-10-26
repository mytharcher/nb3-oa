export default {
  actionForm: {
    uncertain:
      'Chưa xác nhận kết quả. Giữ nội dung này và thử lại đúng thao tác; không gửi yêu cầu đã thay đổi.',
    replay: 'Thử lại đúng thao tác',
    ownedScope: 'Hoàn chi phí tôi sở hữu hoặc tạo',
    title: '{{action}} hoàn chi phí “{{name}}”',
    unavailable: 'Thao tác không còn khả dụng. Đọc hoàn chi phí mới nhất.',
    unsupported: 'Thao tác này cần hợp đồng đầu vào mà trang này không hỗ trợ.',
    submitRequirements:
      'Phê duyệt dùng lý do và dòng chi phí đã lưu trong bản nháp. Chỉnh sửa hoàn chi phí để nhập lý do, danh mục, ngày, số tiền và số hóa đơn; chọn tệp chứng minh cho mọi dòng.',
    reasonRequired: 'Bản nháp chưa có lý do hoàn chi phí. Chỉnh sửa trước.',
    linesRequired:
      'Bản nháp chưa có dòng chi phí. Chỉnh sửa và tải tệp chứng minh lên trước.',
    lineIncomplete:
      'Dòng chi phí {{number}} chưa đầy đủ. Thêm danh mục, ngày, số tiền dương, số hóa đơn và tệp chứng minh.',
    duplicateLines:
      'Dòng chi phí bị trùng. Chỉnh sửa hoàn chi phí và kiểm tra các dòng.',
    editDraft: 'Chỉnh sửa hoàn chi phí',
    comment: 'Ý kiến hoặc lý do',
    person: 'Người nhận',
    mode: 'Vị trí người ký',
    place: 'Vị trí phê duyệt',
    returnTarget: 'Đích trả lại',
    voucher: 'Số chứng từ thanh toán',
    voucherHint: 'Chỉ để trống khi ghi quyết toán quản trị không có chứng từ.',
    grossConfirm: 'Xác nhận tổng hoàn chi phí',
    offsetConfirm: 'Xác nhận bù trừ tạm ứng',
    netConfirm: 'Xác nhận tiền mặt ròng',
    exactAmount: 'Nhập đúng số tiền hiển thị bên trên.',
    confirm: 'Xác nhận {{action}}',
    confirmDescription:
      'Xác nhận thao tác này trên “{{name}}”. Tổng {{gross}}, bù trừ tạm ứng {{offset}}, tiền mặt ròng {{net}}. {{consequence}}',
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
    line: 'Dòng chi phí đã chọn',
    noLine: 'Dòng phê duyệt đã chọn không khả dụng.',
    latest: 'Đọc phiên bản mới nhất',
    conflict:
      'Hoàn chi phí đã thay đổi. Nội dung nhập được giữ. Đọc phiên bản mới nhất, kiểm tra rồi xác nhận lại.',
    completed: 'Đã hoàn tất {{action}} cho “{{name}}”',
    committed:
      'Thao tác hoàn tất. Làm mới hoàn chi phí trước khi thao tác khác.',
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
      returnItem: 'Trả lại dòng chi phí',
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

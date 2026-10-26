export default {
  financeIntegration: {
    title: 'Hệ thống tài chính',
    readPermission: 'Xem đồng bộ tài chính',
    sendPermission: 'Gửi và đối soát bút toán tài chính',
    send: 'Gửi đến hệ thống tài chính',
    resend: 'Thử gửi lại',
    lookup: 'Kiểm tra kết quả bên ngoài',
    reload: 'Làm mới trạng thái đã lưu',
    retry: 'Thử lại',
    cancel: 'Hủy',
    confirmSend: 'Gửi',
    confirmTitle: 'Gửi yêu cầu đã thanh toán này đến hệ thống tài chính?',
    confirmDescription:
      'Dữ kiện kế toán đã duyệt sẽ được gửi đến hệ thống tài chính kết nối. Thao tác không tạo thanh toán khác. Thử lại dùng cùng tham chiếu nghiệp vụ.',
    notConfigured:
      'Chưa kết nối cổng tài chính. Nhờ quản trị viên hoàn tất kết nối.',
    loadFailed:
      'Không thể tải trạng thái tài chính. Kiểm tra quyền hoặc thử lại.',
    actionFailed:
      'Không thể xác nhận thao tác. Làm mới trạng thái trước khi thử lại.',
    conflict:
      'Dữ kiện kế toán hoặc đích thay đổi sau lần gửi đầu. Đối soát bút toán hiện có với tài chính trước khi tiếp tục.',
    confirmBeforeRetry:
      'Biên nhận không chứng minh đã ghi sổ. Kiểm tra kết quả bên ngoài; nếu cần, thử lại cùng yêu cầu.',
    voucher: 'Chứng từ ngoài: {{number}}',
    states: {
      not_sent: 'Chưa gửi',
      sending: 'Đang gửi hoặc kiểm tra kết quả',
      accepted: 'Hệ thống tài chính đã nhận; chưa xác nhận ghi sổ',
      posted: 'Đã tạo chứng từ',
      rejected: 'Hệ thống tài chính từ chối',
      unknown: 'Kết quả cần xác nhận',
    },
    results: {
      transport: 'Kết nối kết thúc trước khi xác nhận kết quả.',
      unconfirmed: 'Hệ thống tài chính không trả về kết quả đã xác nhận.',
      invalid_receipt: 'Không thể khớp biên nhận với yêu cầu này.',
      not_found:
        'Không tìm thấy bản ghi ngoài trong lần kiểm tra này. Biên nhận trước vẫn hợp lệ.',
      invalid_mapping:
        'Cần kiểm tra ánh xạ tài khoản tài chính hoặc nhà cung cấp.',
      invalid_document: 'Hệ thống tài chính từ chối dữ kiện chứng từ.',
      duplicate_source: 'Bút toán bên ngoài đã dùng tham chiếu nghiệp vụ này.',
      accounting_period_closed: 'Kỳ kế toán đã đóng.',
      other: 'Nhờ tài chính kiểm tra kết quả bên ngoài.',
    },
  },
};

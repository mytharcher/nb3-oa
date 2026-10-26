export default {
  invoiceRecognition: {
    currentValues: 'Giá trị chưa lưu hiện tại',
    reload: 'Làm mới kết quả đã lưu',
    receivedAt: 'Đã nhận kết quả: {{time}}',
    notConfigured:
      'Chưa kết nối cổng hóa đơn. Bạn có thể tiếp tục nhập chi tiết hóa đơn thủ công.',
    title: 'Nhận dạng và xác minh hóa đơn',
    readPermission: 'Đọc kết quả hóa đơn',
    recognizePermission: 'Nhận dạng tệp hóa đơn có thể chỉnh sửa',
    verifyPermission: 'Xác minh dòng hóa đơn được cấp quyền',
    recognizeAttachment: 'Nhận dạng tệp đính kèm {{index}}',
    verifyAttachment: 'Xác minh hóa đơn · tệp đính kèm {{index}}',
    processing: 'Đang xử lý hóa đơn…',
    failed:
      'Không thể hoàn thành thao tác. Kiểm tra quyền và cấu hình cổng rồi thử lại. Giá trị đã nhập giữ nguyên.',
    changed:
      'Dòng này đã thay đổi. Chạy lại thao tác trước khi áp dụng hoặc dựa vào kết quả.',
    unconfirmed: 'Kết quả chưa được xác nhận.',
    recover: 'Kiểm tra kết quả bên ngoài',
    reference: 'Tham chiếu xác minh: {{reference}}',
    confirmTitle: 'Kiểm tra hóa đơn nhận dạng',
    confirmDescription:
      'So sánh gợi ý với tệp gốc. Áp dụng chỉ thay đổi dòng chưa lưu này; không lưu, gửi hay xác minh hóa đơn.',
    number: 'Số hóa đơn',
    date: 'Ngày hóa đơn',
    amount: 'Tổng gồm thuế',
    cancel: 'Hủy',
    apply: 'Áp dụng cho dòng này',
    states: {
      not_checked: 'Chưa kiểm tra',
      pending: 'Chờ xử lý',
      running: 'Đang xử lý',
      recognized: 'Đã nhận dạng; kiểm tra trước khi áp dụng',
      multiple: 'Tìm thấy nhiều hóa đơn. Tách tệp hoặc nhập dòng này thủ công.',
      unreadable: 'Không thể nhận dạng hóa đơn. Nhập chi tiết thủ công.',
      rejected: 'Dịch vụ ngoài không thể xử lý hóa đơn này.',
      valid: 'Xác minh bên ngoài khớp dữ kiện hóa đơn hiện tại.',
      mismatch: 'Dữ kiện hóa đơn không khớp xác minh bên ngoài.',
      not_found: 'Không tìm thấy hóa đơn phù hợp. Nhờ tài chính kiểm tra.',
      unknown:
        'Chưa xác nhận kết quả. Tra cứu kết quả ngoài trước khi thử lại.',
    },
  },
};

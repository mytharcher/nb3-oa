export default {
  electronicSignatures: {
    archivedHint:
      'Dịch vụ ký đã xác nhận hoàn tất. PDF đã ký được xác minh và lưu hồ sơ cùng yêu cầu này.',
    reference: 'Tham chiếu ký: {{value}}',
    completedAction: 'Đã lưu hồ sơ chữ ký điện tử',
    title: 'Ký điện tử',
    readPermission: 'Xem tài liệu đã ký',
    sendPermission: 'Gửi và khôi phục ký',
    channel: 'Kênh thực hiện',
    physical: 'Con dấu vật lý',
    electronic: 'Chữ ký điện tử',
    channelHint:
      'Chọn trước phê duyệt. Ký điện tử cần một PDF đã duyệt và không có số bản giấy.',
    hint: 'PDF đã duyệt được gửi đến dịch vụ ký đã cấu hình. Chỉ xác nhận hoàn tất sau khi tài liệu đã ký được xác minh và lưu hồ sơ.',
    notConfigured: 'Chưa kết nối ký điện tử. Liên hệ quản trị viên.',
    notEligible:
      'Ký cần tài liệu PDF hiện hành đã duyệt. Yêu cầu con dấu điện tử phải chứa đúng một PDF.',
    loadFailed: 'Không thể tải trạng thái chữ ký hoặc bạn không có quyền xem.',
    actionFailed:
      'Không thể hoàn tất thao tác. Làm mới trạng thái trước khi thử lại.',
    retry: 'Thử lại',
    send: 'Gửi ký',
    refresh: 'Kiểm tra trạng thái / khôi phục',
    open: 'Tiếp tục ký',
    download: 'Tải PDF đã ký',
    recovery:
      'Kết quả từ xa hoặc hồ sơ lưu cần xác nhận. Kiểm tra trạng thái để khôi phục cùng yêu cầu ký.',
    signedAt: 'Đã ký {{at}}',
    confirmTitle: 'Gửi PDF đã duyệt này để ký?',
    confirmHint:
      'Dịch vụ ký đã cấu hình nhận tài liệu đã duyệt. Thử lại dùng cùng yêu cầu ký.',
    cancel: 'Hủy',
    states: {
      not_sent: 'Chưa gửi',
      pending: 'Chờ gửi',
      sending: 'Đang gửi',
      accepted: 'Dịch vụ ký đã tiếp nhận',
      signing: 'Đang chờ chữ ký',
      unknown: 'Kết quả chờ xác nhận',
      archivePending: 'Đã ký — cần khôi phục hồ sơ lưu',
      archived: 'Đã lưu hồ sơ tài liệu đã ký',
      rejected: 'Dịch vụ ký đã từ chối',
      cancelled: 'Dịch vụ ký đã hủy',
    },
  },
};

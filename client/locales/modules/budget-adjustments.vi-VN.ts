export default {
  budgetAdjustments: {
    businessErrors: {
      BUDGET_ADJUSTMENT_INVALID_ACCOUNT:
        'Chọn phòng ban đang hoạt động và năm ngân sách hợp lệ.',
      BUDGET_ADJUSTMENT_INVALID_AMOUNT:
        'Nhập số tiền điều chỉnh dương và lý do.',
      BUDGET_ADJUSTMENT_INVALID_SUBJECT: 'Chọn khoản mục ngân sách đang bật.',
      BUDGET_ADJUSTMENT_INVALID_TRANSFER:
        'Với chuyển khoản, dùng khoản mục nguồn và đích khác nhau. Với tăng thêm, xóa khoản mục nguồn.',
      BUDGET_ADJUSTMENT_INACTIVE_HEAD:
        'Trưởng phòng không khả dụng. Nhờ quản trị viên cập nhật phân công phòng ban.',
    },

    authz: {
      resource: 'Điều chỉnh ngân sách',
      submit: 'Gửi điều chỉnh ngân sách',
      delegate: 'Gửi điều chỉnh ngân sách thay nhân viên',
      view: 'Đọc điều chỉnh ngân sách',
    },
    new: 'Điều chỉnh ngân sách mới',
    edit: 'Chỉnh sửa điều chỉnh ngân sách',
    formDescription: 'Đề xuất chuyển giữa khoản mục hoặc bổ sung ngân sách.',
    department: 'Phòng ban ngân sách',
    yearInvalid: 'Nhập năm nguyên từ 1900 đến 9999.',
    year: 'Năm ngân sách',
    type: 'Loại điều chỉnh',
    transfer: 'Chuyển giữa khoản mục',
    increase: 'Ngân sách bổ sung',
    targetSubject: 'Khoản mục đích',
    sourceSubject: 'Khoản mục nguồn',
    amount: 'Số tiền (nhân dân tệ)',
    yuan: 'nhân dân tệ',
    reason: 'Lý do',
    amountInvalid:
      'Nhập số tiền thập phân dương tối đa hai chữ số thập phân trong giới hạn an toàn.',
    sourceInvalid: 'Chọn khoản mục nguồn và đích khác nhau.',
    amountHint:
      'Dùng nhân dân tệ dạng thập phân. Số tiền được lưu bằng số xu nguyên chính xác.',
    reserveHint:
      'Gửi sẽ giữ tiền nguồn cho chuyển khoản. Ngân sách chỉ có hiệu lực sau phê duyệt cuối.',
    revisionHold:
      'Khoản giữ gốc được giữ khi trả lại. Thay đổi đề xuất chỉ giải phóng và thay thế khi gửi lại.',
    retainedHold:
      'Khoản giữ gốc hiện tại: {{subject}} · {{amount}} nhân dân tệ. Khoản này tách biệt với đề xuất sửa đổi.',
    actualHold: 'Khoản giữ nguồn hiện tại',
    frozenThreshold:
      'Ngưỡng tổng giám đốc lúc gửi cho tăng thêm: {{amount}} nhân dân tệ (chỉ khi vượt hẳn).',
    applied: 'Phê duyệt cuối đã áp dụng điều chỉnh ngân sách này.',
    reserved: 'Tiền nguồn đã được giữ; điều chỉnh chưa có hiệu lực.',
    awaitingEffect:
      'Đề xuất chưa có hiệu lực. Ngân sách bổ sung chỉ áp dụng sau phê duyệt cuối.',
    insufficient:
      'Ngân sách nguồn không đủ tiền khả dụng. Kiểm tra số tiền và nguồn; nội dung nhập được giữ.',
    subjectInactive:
      'Khoản mục này bị tắt. Chọn khoản mục đang hoạt động trước khi gửi.',
    disabled: 'Đã vô hiệu hóa',
    inactive: 'Người yêu cầu phải là nhân viên đang hoạt động.',
    configuration:
      'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
    invalid: 'Kiểm tra tài khoản, loại điều chỉnh, số tiền và lý do.',
    uncertainCreate:
      'Kết quả lưu chưa chắc chắn. Đóng và kiểm tra Yêu cầu của tôi trước khi tạo bản nháp khác.',
    stages: {
      head: 'Trưởng phòng',
      finance: 'Trưởng bộ phận tài chính',
      cfo: 'Giám đốc tài chính',
      gm: 'Tổng giám đốc',
    },
  },
};

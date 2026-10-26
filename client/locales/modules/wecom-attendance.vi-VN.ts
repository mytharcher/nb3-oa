export default {
  wecomAttendance: {
    title: 'Nguồn chấm công WeCom',
    description:
      'Nhập chấm công nhân viên được ánh xạ và kiểm tra 30 lượt đồng bộ mới nhất.',
    sync: 'Đồng bộ',
    refresh: 'Làm mới',
    runs: 'Lượt đồng bộ',
    retry: 'Thử lại',
    counts: 'Bản ghi đã ghi: {{records}} · Lô: {{batches}}',
    runFailed:
      'Không thể nhập một số bản ghi. Kiểm tra ánh xạ nhân viên, phân ca và quyền nguồn trước khi thử lại. Lô hoàn tất được giữ.',
    denied: 'Bạn không có quyền truy cập đồng bộ chấm công.',
    disabled:
      'Nguồn bị tắt. Nhờ quản trị viên cấu hình ứng dụng chấm công chuyên biệt.',
    unconfigured:
      'Nguồn cần thông tin xác thực và ánh xạ nhân viên rõ ràng trước khi đồng bộ.',
    ready_one: 'Sẵn sàng đồng bộ {{count}} nhân viên được ánh xạ.',
    ready_other: 'Sẵn sàng đồng bộ {{count}} nhân viên được ánh xạ.',
    startedAt: 'Đã bắt đầu {{time}}',
    empty: 'Chưa có lượt đồng bộ.',
    rangeHint:
      'Chọn tối đa bảy ngày lịch đã kết thúc theo giờ công ty. Bản ghi nguồn lặp không bị nhân đôi.',
    start: 'Ngày bắt đầu',
    end: 'Ngày kết thúc',
    reason: 'Lý do',
    cancel: 'Hủy',
    syncing: 'Đang đồng bộ…',
    states: {
      running: 'Đang tiến hành',
      completed: 'Đã hoàn thành',
      failed: 'Cần chú ý',
    },
  },
};

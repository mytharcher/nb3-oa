export default {
  exported: 'Đã bắt đầu tải Excel.',
  title: 'Thời gian tác vụ quyết định nghỉ phép',
  description:
    'Tác vụ quyết định nghỉ phép đã hoàn tất: từ tạo đến đóng bằng mili giây tự nhiên, gồm chờ và các lần gửi lại lịch sử; nhóm theo tháng bắt đầu yêu cầu gốc, không phải giờ làm việc, SLA, tỷ lệ trả lại hoặc thời lượng toàn quy trình.',
  year: 'Năm bắt đầu',
  month: 'Tháng bắt đầu (tùy chọn)',
  clear: 'Xóa bộ lọc',
  export: 'Xuất Excel',
  exporting: 'Đang xuất…',
  refresh: 'Làm mới',
  selectYear: 'Chọn năm bắt đầu yêu cầu gốc để tải báo cáo.',
  invalid: 'Nhập năm từ 1900 đến 9998 và tháng tùy chọn từ 1 đến 12.',
  forbidden:
    'Quyền bản ghi nghỉ phép hoặc trường hiện tại không cho phép báo cáo này. Liên hệ quản trị viên.',
  precondition:
    'Kiểm tra giới hạn nguồn hoặc dấu thời gian tác vụ thất bại. Thu hẹp khoảng năm/tháng hoặc nhờ quản trị viên kiểm tra dấu thời gian nguồn.',
  failed: 'Không thể tải báo cáo. Thử lại.',
  retry: 'Thử lại',
  exportFailed: 'Xuất Excel thất bại. Thử lại.',
  empty: 'Không có tác vụ quyết định hoàn tất',
  noResults: 'Không có tác vụ khớp tháng này',
  emptyHint:
    'Chỉ tính tác vụ quyết định hoàn tất từ yêu cầu nghỉ phép hiện đọc được. Chọn năm hoặc tháng bắt đầu khác.',
  total: '{{count}} nhóm giai đoạn',
  generatedAt: 'Đã tạo {{value}}',
  previous: 'Trước',
  next: 'Tiếp',
  fields: {
    stage: 'Giai đoạn',
    completedTaskCount: 'Tác vụ quyết định hoàn tất',
    totalElapsedMs: 'Tổng thời gian tự nhiên (ms)',
    averageElapsedMs: 'Thời gian tự nhiên trung bình (ms)',
  },
  stages: { manager: 'Quản lý', head: 'Trưởng phòng', hr: 'Nhân sự' },
};

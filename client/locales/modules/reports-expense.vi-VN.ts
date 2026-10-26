export default {
  reportsExpense: {
    firstPage: 'Đến trang đầu',

    pageEmpty: 'Không có nhóm chi phí trên trang này',
    pageEmptyHint:
      'Nguồn hiện tại có ít nhóm hơn. Đến trang đầu hoặc dùng Trước để về trang khả dụng.',

    exportStarted: 'Đã bắt đầu tải Excel',
    reloading:
      'Đang làm mới… Kết quả trước vẫn hiển thị đến khi bộ lọc hiện tại tải xong.',
    exportLock: 'Đang xuất… Bộ lọc và điều hướng bị khóa đến khi tải xong.',

    title: 'Chi phí quyết toán theo tháng',
    description:
      'Tổng chi phí đã quyết toán theo ngày chi phí gốc và danh mục; không phải tiền mặt ròng đã trả.',
    month: 'Tháng chi phí (1–12, tùy chọn)',
    effectiveYear: 'Năm theo lịch công ty: {{year}}',
    sourceNotice:
      'Có thể kiểm tra tối đa 10.000 yêu cầu quyết toán được cấp quyền. Đổi năm hoặc tháng không giảm lượt quét nguồn này.',
    precondition:
      'Không thể xác minh chứng minh quyết toán hoặc vượt giới hạn báo cáo. Nhờ quản trị viên kiểm tra chứng minh nguồn và kích thước báo cáo.',
    forbidden:
      'Bạn không có quyền truy cập nguồn hoàn chi phí hiện tại. Liên hệ quản trị viên để kiểm tra quyền nguồn.',
    empty: 'Chưa có chi phí quyết toán trong năm này',
    emptyHint:
      'Chỉ gồm yêu cầu được cấp quyền có chứng minh quyết toán xác minh. Kiểm tra năm, tháng hoặc nhờ quản trị viên kiểm tra quyền nguồn.',
    fields: {
      year: 'Năm',
      month: 'Tháng chi phí',
      category: 'Mã danh mục',
      settledRequestCount: 'Yêu cầu đã quyết toán',
      settledExpenseCents:
        'Tổng chi phí đã quyết toán (CNY, không phải tiền mặt)',
    },
  },
};

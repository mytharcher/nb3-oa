export default {
  hrMasterData: {
    mappingSearch:
      'Tìm bản ghi ánh xạ theo ID ngoài chính xác (hiển thị 100 mới nhất khi không lọc)',
    title: 'Đồng bộ nhân sự',
    description:
      'Nhận dữ liệu gốc tổ chức và nhân viên từ cổng tích hợp đã duyệt. Cần liên kết tài khoản hiện có; đồng bộ không bật đăng nhập.',
    read: 'Xem đồng bộ',
    sync: 'Đồng bộ và chạy lại',
    manage: 'Quản lý nguồn và quyền sở hữu',
    addSource: 'Thêm nguồn',
    editSource: 'Chỉnh sửa nguồn',
    sourceCode: 'Mã nguồn (chữ thường, số và dấu gạch nối)',
    sourceName: 'Tên nguồn',
    principal: 'Tài khoản tích hợp được cấp quyền',
    enabled: 'Đang bật',
    disabled: 'Đã vô hiệu hóa',
    noSources: 'Chưa cấu hình nguồn nhân sự cho tài khoản của bạn.',
    recent: 'Đồng bộ gần đây',
    latest: 'Hiển thị 50 lô mới nhất cho nguồn này.',
    items_one: '{{count}} bản ghi',
    items_other: '{{count}} bản ghi',
    actions: 'Thao tác',
    replay: 'Thử lại lô gốc',
    refresh: 'Làm mới',
    noRuns: 'Chưa nhận lô nào.',
    mappings: 'Bản ghi ánh xạ',
    revision: 'Phiên bản {{revision}}',
    reclaim: 'Khôi phục quyền sở hữu bên ngoài',
    reclaimHelp:
      'Chỉnh sửa cục bộ được bảo vệ. Khôi phục quyền sở hữu cho phép nguồn ngoài thay thế các trường ở lần cập nhật hợp lệ tiếp theo. Kiểm tra bản ghi cục bộ và giải thích quyết định trước.',
    confirmReclaim: 'Xác nhận quyền sở hữu bên ngoài',
    reason: 'Lý do',
    cancel: 'Hủy',
    save: 'Lưu',
    failed: 'Thao tác thất bại. Kiểm tra quyền và thiết lập nguồn rồi thử lại.',
    localConflict:
      'Bản ghi đã bị sửa cục bộ. Nhân sự phải kiểm tra và chủ động khôi phục quyền sở hữu ngoài trước khi thử lại.',
    businessConflict:
      'Không thể áp dụng bản ghi. Sửa dữ liệu nguồn hoặc giải quyết hạn chế nghiệp vụ rồi thử lại lô gốc.',
    states: {
      pending: 'Đang chờ',
      completed: 'Đã hoàn thành',
      failed: 'Thất bại',
    },
    entities: {
      department: 'Phòng ban',
      grade: 'Cấp bậc',
      employee: 'Nhân viên',
    },
  },
};

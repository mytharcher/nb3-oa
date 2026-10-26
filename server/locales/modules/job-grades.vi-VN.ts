export default {
  jobGrades: {
    errors: {
      VERSION_CONFLICT:
        'Bảng lương hiện tại đã thay đổi. Tải lại trước khi công bố.',
      IDEMPOTENCY_CONFLICT: 'Mã công bố đã dùng với nội dung khác.',
      TABLE_UNAVAILABLE: 'Bảng lương chưa được khởi tạo.',
      GRADE_UNAVAILABLE:
        'Cấp bậc bắt buộc không khả dụng hoặc không hoạt động.',
      INVALID_PUBLICATION: 'Đầu vào công bố không hợp lệ.',
      STORED_DATA_INVALID: 'Dữ liệu bảng lương lưu trữ không hợp lệ.',
      INVALID_RANGE: 'Khoảng lương phải chứa số tiền nguyên hợp lệ.',
      DUPLICATE_GRADE: 'Mỗi cấp bậc phải xuất hiện một lần.',
      OUTSIDE_RANGE: 'Lương đề nghị ngoài khoảng đã công bố.',

      ACCESS_DENIED: 'Thao tác ngạch lương ngoài phạm vi quyền của bạn.',
      NOT_FOUND: 'Phiên bản ngạch lương không khả dụng.',
    },
    authz: {
      resource: 'Bảng ngạch lương',
      view: 'Xem lịch sử công bố',
      viewSalary: 'Đọc khoảng lương',
      manage: 'Công bố bảng ngạch lương',
    },
  },
};

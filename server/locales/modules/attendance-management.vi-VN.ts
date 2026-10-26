export default {
  attendanceManagement: {
    errors: {
      ATTENDANCE_INVALID_INPUT: 'Dữ liệu chấm công gốc không hợp lệ.',
      ATTENDANCE_INVALID_TIME:
        'Lượt chấm công phải thuộc ngày chấm công công ty.',
      ATTENDANCE_INVALID_BATCH:
        'Cung cấp 1–1000 dòng trong giới hạn kích thước dữ liệu.',
      ATTENDANCE_SOURCE_CONFLICT: 'Mã nguồn xác định dữ liệu bất biến khác.',
      ATTENDANCE_IDENTITY_UNAVAILABLE:
        'Mỗi dòng cần người thực có hồ sơ nhân viên.',

      NOT_FOUND: 'Ca này không còn tồn tại.',
      ACCESS_DENIED: 'Bạn không có quyền truy cập cấu hình chấm công này.',
      ATTENDANCE_ACCESS_DENIED:
        'Quyền bản ghi hoặc trường hiện tại không cho phép thay đổi này.',
      ATTENDANCE_VERSION_CONFLICT:
        'Cấu hình đã thay đổi. Tải lại trước khi lưu.',
      ATTENDANCE_SHIFT_INVALID: 'Nhập định nghĩa ca rõ ràng hợp lệ.',
      ATTENDANCE_SHIFT_NOT_FOUND: 'Ca không tồn tại hoặc bị tắt.',
      ATTENDANCE_SHIFT_CODE_IMMUTABLE: 'Không thể thay đổi mã ca.',
      ATTENDANCE_SHIFT_CODE_CONFLICT: 'Mã ca này đã tồn tại.',
      ATTENDANCE_SHIFT_TIME_ZONE_CHANGED:
        'Dùng phiên bản theo múi giờ công ty hiện tại.',
      ATTENDANCE_SCHEDULE_INVALID:
        'Chọn ngày thực và ca rõ ràng hoặc ngày nghỉ.',
      ATTENDANCE_DEPARTMENT_UNAVAILABLE: 'Phòng ban này không khả dụng.',
      ATTENDANCE_SCHEDULE_NOT_READABLE:
        'Không thể đọc phiên bản lịch hiện tại.',
      ATTENDANCE_LIST_INVALID: 'Tham số trang không hợp lệ.',
      ATTENDANCE_LOCAL_TIME_INVALID:
        'Giờ địa phương bị bỏ qua hoặc lặp do giờ mùa hè. Chọn mốc thời gian không mơ hồ.',
    },
    authz: {
      importResource: 'Nhập chấm công gốc',
      ingest: 'Nhập dữ liệu bất biến',
      attendanceRecords: 'Bản ghi chấm công gốc',

      resource: 'Cấu hình chấm công',
      view: 'Xem cấu hình chấm công',
      manage: 'Quản lý cấu hình chấm công',
      attendanceShifts: 'Ca chấm công',
      attendanceShiftRevisions: 'Phiên bản ca',
      attendanceSchedules: 'Lịch phòng ban',
      attendanceScheduleRevisions: 'Phiên bản lịch',
    },
  },
};

export default {
  attendanceChange: {
    authz: { resource: 'Bổ sung chấm công' },
    navigation: 'Bổ sung chấm công',
    new: 'Đơn bổ sung chấm công mới',
    edit: 'Chỉnh sửa bổ sung chấm công',
    emptyMissing:
      'Không có lượt thiếu chấm công đủ điều kiện. Liên hệ nhân sự nếu dữ liệu chấm công nhập vào không đúng.',
    uploadAfterDraft: 'Lưu bản nháp rồi mở Chỉnh sửa để tải chứng minh lên.',
    formDescription: 'Kiểm tra chứng minh và gửi xem xét hoặc lưu bản nháp.',
    description:
      'Cung cấp giờ thiếu chấm công và chứng minh để quản lý xem xét.',
    date: 'Ngày thiếu chấm công',
    original: 'Lượt thiếu chấm công gốc',
    correctionAt: 'Giờ chấm công bổ sung',
    proof: 'Giải trình chứng minh',
    attachments: 'Tệp chứng minh',
    punchKinds: { in: 'Chấm công vào', out: 'Chấm công ra' },
    missing: 'Chọn lượt thiếu chấm công',
    policyHint:
      'Lượt thiếu chấm công phải trong bảy ngày theo lịch. Yêu cầu đang chờ và đã duyệt được tính vào giới hạn tháng.',
    errors: {
      ATTENDANCE_CHANGE_BASELINE_CHANGED:
        'Bản ghi thiếu chấm công đã thay đổi. Làm mới và chọn lại.',
      ATTENDANCE_CHANGE_TOO_OLD:
        'Chỉ được gửi lượt thiếu chấm công trong bảy ngày theo lịch. Liên hệ nhân sự với bản ghi cũ hơn.',
      ATTENDANCE_CHANGE_INVALID_TIME:
        'Giờ bổ sung phải thuộc ngày thiếu chấm công và không được trong tương lai.',
      ATTENDANCE_CHANGE_MONTHLY_LIMIT:
        'Bổ sung đang chờ và đã duyệt đã đạt giới hạn tháng.',
      ATTENDANCE_CHANGE_DUPLICATE:
        'Đã có yêu cầu bổ sung đang chờ hoặc đã duyệt cho lượt thiếu này.',
      ATTENDANCE_CHANGE_PROOF_REQUIRED:
        'Cung cấp giải trình hoặc tải chứng minh lên.',
      ATTENDANCE_CHANGE_EMPLOYEE_INACTIVE:
        'Người yêu cầu phải là nhân viên đang hoạt động. Liên hệ nhân sự để kiểm tra hồ sơ.',
      ATTENDANCE_CHANGE_REASON_REQUIRED: 'Cung cấp lý do bổ sung.',
      ATTENDANCE_CHANGE_SLA_CONFIGURATION_UNSUPPORTED:
        'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
      ATTENDANCE_CHANGE_FILE_SIZE:
        'Tệp đính kèm không được rỗng và tối đa 5 MB.',
      ATTENDANCE_CHANGE_FILE_TYPE:
        'Dùng tệp PDF, JPEG, PNG hoặc WebP có nội dung khớp định dạng.',
      ATTENDANCE_CHANGE_ATTACHMENT_DENIED:
        'Bạn không có quyền xem hoặc tải chứng minh này lên.',
      ATTENDANCE_CHANGE_ATTACHMENT_INVALID:
        'Liên kết tệp đính kèm không hợp lệ. Chọn chứng minh đã tải lên bản nháp này.',
      ATTENDANCE_BASELINE_CHANGED:
        'Dữ liệu chấm công gốc đã thay đổi. Phê duyệt đã được hoàn tác; làm mới để kiểm tra.',
    },
  },
};

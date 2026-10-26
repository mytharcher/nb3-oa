export default {
  onboarding: {
    notifications: {
      overdueTitle: 'Tác vụ tiếp nhận quá hạn',
      overdueBody:
        'Tác vụ tiếp nhận quá hạn. Kiểm tra công việc hiện được giao.',
    },
    authz: {
      resource: 'Tiếp nhận nhân viên',
      readable: 'Người tham gia tiếp nhận',
      view: 'Xem tiếp nhận nhân viên',
      create: 'Tạo tiếp nhận nhân viên',
      cancel: 'Hủy tiếp nhận nhân viên',
      claim: 'Nhận tác vụ',
      reassignMentor: 'Phân công lại trưởng phòng',
      transfer: 'Chuyển giao',
      release: 'Nhả tác vụ',
      complete: 'Hoàn thành tác vụ',
      forceComplete: 'Buộc hoàn thành',
      viewSalary: 'Xem lương tiếp nhận',
      viewBank: 'Xem thông tin ngân hàng tiếp nhận',
    },
    errors: {
      employeeSourceConflict:
        'Nguồn tiếp nhận đã liên kết với chi tiết nhân viên khác.',
      employeeAccountEnabled:
        'Tài khoản tiếp nhận phải giữ trạng thái tắt trong khi tạo hồ sơ nhân viên.',
      forbidden: 'Bạn không có quyền thực hiện thao tác tiếp nhận này.',
      sourceInvalid:
        'Phân bổ tuyển dụng hoặc dữ kiện nghiệp vụ tiếp nhận không còn hợp lệ.',
      idempotencyConflict: 'Mã lệnh đã được dùng với chi tiết khác.',
    },
  },
};

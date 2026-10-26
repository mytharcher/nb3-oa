export default {
  meetingRooms: {
    authz: {
      title: 'Phòng họp',
      bookings: 'Đặt lịch họp',
      view: 'Xem',
      manage: 'Quản lý phòng họp',
      create: 'Đặt phòng',
      edit: 'Chỉnh sửa lịch đặt',
      cancel: 'Hủy lịch đặt',
      confirm: 'Xác nhận yêu cầu hành chính',
      reject: 'Từ chối yêu cầu hành chính',
      checkIn: 'Điểm danh',
      owned: 'Do tôi tổ chức',
      participating: 'Cuộc họp tôi tham dự',
      readable: 'Cuộc họp tôi tổ chức hoặc tham dự',
    },
    notifications: {
      title: 'Cập nhật đặt phòng họp',
      body: 'Lịch đặt họp liên quan bạn đã thay đổi. Mở lịch đặt họp để xem chi tiết bạn được truy cập.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Quá nhiều bản ghi phù hợp. Thu hẹp tìm kiếm trước khi sắp xếp theo tên.',
      ACCESS_DENIED: 'Thao tác hoặc trường ngoài quyền của bạn.',
      ACTIVE_EMPLOYEE_REQUIRED: 'Cần hồ sơ nhân viên đang hoạt động.',
      BOOKING_NOT_FOUND: 'Lịch đặt không khả dụng.',
      CAPACITY_EXCEEDED: 'Người tổ chức và tham dự vượt sức chứa phòng.',
      COMMAND_CONFLICT: 'Mã yêu cầu thuộc thao tác hoặc người khác.',
      INVALID_BOOKING:
        'Nhập tiêu đề và người tham dự đang hoạt động khác nhau.',
      INVALID_INTERVAL: 'Chọn khoảng tương lai với kết thúc sau bắt đầu.',
      INVALID_PARTICIPANT:
        'Mọi người tham dự phải là nhân viên đang hoạt động.',
      INVALID_RECURRENCE:
        'Chọn chuỗi hằng ngày hoặc hằng tuần từ 1 đến 52 lần.',
      INVALID_REQUEST_ID: 'Cần mã yêu cầu.',
      INVALID_ROOM: 'Nhập tên phòng, sức chứa và lý do thay đổi.',
      INVALID_SERIES: 'Chọn chuỗi hiện có.',
      INVALID_STATE:
        'Lịch đặt không thể thực hiện thao tác ở trạng thái hoặc khoảng thời gian hiện tại.',
      REASON_REQUIRED: 'Nhập lý do cho quyết định quản trị này.',
      ROOM_INACTIVE: 'Phòng không hoạt động.',
      ROOM_NOT_FOUND: 'Phòng không khả dụng.',
      TIME_CONFLICT: 'Một hoặc nhiều khoảng yêu cầu trùng khoảng đã có lịch.',
      VERSION_CONFLICT:
        'Lịch đặt hoặc phòng thay đổi. Làm mới trước khi thử lại.',
      INVALID_LOCAL_TIME: 'Nhập ngày giờ địa phương công ty hợp lệ.',
      NONEXISTENT_LOCAL_TIME:
        'Giờ địa phương không tồn tại do đổi múi giờ. Chọn giờ khác.',
      AMBIGUOUS_LOCAL_TIME:
        'Giờ địa phương xuất hiện hai lần do đổi múi giờ. Chọn giờ không mơ hồ.',
    },
  },
};

export default {
  vehicles: {
    authz: {
      requests: 'Yêu cầu xe',
      garage: 'Nhà xe',
      manage: 'Quản lý danh sách xe',
      viewCost: 'Xem chi phí nhiên liệu riêng tư',
    },
    errors: {
      VEHICLE_SORT_LIMIT:
        'Thu hẹp tìm kiếm trước khi sắp xếp nhiều bản ghi như vậy.',
      VEHICLE_ACCESS_DENIED: 'Cập nhật tài xế ngoài chính sách được cấp.',
      VEHICLE_ALREADY_DISPATCHED: 'Nguồn đã có dữ kiện điều xe bất biến.',
      VEHICLE_APPROVAL_REFUSED:
        'Thao tác xe không khả dụng; làm mới yêu cầu và kiểm tra quyền.',
      VEHICLE_CONTENT_CHANGED:
        'Điều xe cần nội dung đã duyệt không đổi và dữ liệu thao tác riêng.',
      VEHICLE_COST_NOT_FOUND: 'Không thể đọc chi phí sử dụng.',
      VEHICLE_DISPATCH_NOT_OFFERED: 'Cần tác vụ điều xe thực tế được cho phép.',
      VEHICLE_DRIVER_INACTIVE: 'Tài xế hiện không đủ điều kiện.',
      VEHICLE_DRIVER_REQUIRED: 'Lựa chọn tài xế phải khớp yêu cầu đã duyệt.',
      VEHICLE_EMPLOYEE_INACTIVE: 'Cần hồ sơ nhân viên đang hoạt động.',
      VEHICLE_FIELDS_RESTRICTED:
        'Giao diện phê duyệt cần đầy đủ trường yêu cầu phi tài chính.',
      VEHICLE_GARAGE_DENIED:
        'Cần thành viên trách nhiệm hành chính đang hoạt động.',
      VEHICLE_INTERVAL_CONFLICT:
        'Xe hoặc tài xế đã được điều trong khoảng này.',
      VEHICLE_INVALID_COMMAND: 'Cần nguồn và mã yêu cầu cố định.',
      VEHICLE_INVALID_INPUT:
        'Cung cấp định danh xe, sức chứa dương và trạng thái hợp lệ.',
      VEHICLE_INVALID_INTERVAL:
        'Cung cấp khoảng thời gian đúng thứ tự và số hành khách dương.',
      VEHICLE_INVALID_USAGE:
        'Quãng đường và nhiên liệu phải là số nguyên không âm chính xác.',
      VEHICLE_INVALID_VERSION: 'Phiên bản lưu trữ không thể tăng.',
      VEHICLE_NOT_DISPATCHED: 'Không có điều xe thực tế cho đơn này.',
      VEHICLE_NOT_FOUND: 'Không tìm thấy xe hoặc tài xế.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'Không có xe hiện tại đủ sức chứa trong khoảng này. Gửi không giữ xe.',
      VEHICLE_OUTSTANDING_USE:
        'Hoàn thành sử dụng thực tế trước khi tắt tài xế này.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Dữ liệu thực thi nghiệp vụ phải dùng giao diện riêng.',
      VEHICLE_REQUEST_KEY_REQUIRED: 'Cần mã yêu cầu cố định.',
      VEHICLE_REQUEST_REUSED: 'Mã yêu cầu gắn với người hoặc dữ liệu khác.',
      VEHICLE_SLA_UNSUPPORTED:
        'Bản phát hành cần đồng hồ phê duyệt giờ làm việc mặc định.',
      VEHICLE_SOURCE_DENIED:
        'Cần thao tác phê duyệt thực tế được cho phép trong giao dịch của nó.',
      VEHICLE_SOURCE_MISMATCH: 'Lệnh không khớp nguồn phê duyệt.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'Bộ chuyển đổi nguồn phê duyệt thực không khả dụng.',
      VEHICLE_TARGET_MISMATCH: 'Đích thao tác thuộc yêu cầu khác.',
      VEHICLE_TYPE_INACTIVE: 'Chọn loại xe đang hoạt động.',
      VEHICLE_UNAVAILABLE: 'Chọn xe đang hoạt động đủ sức chứa.',
      VEHICLE_USAGE_OWNER: 'Chỉ người yêu cầu thực tế được đăng ký sử dụng.',
      VEHICLE_VERSION_CONFLICT: 'Tải phiên bản xe hiện tại.',
    },
  },
};

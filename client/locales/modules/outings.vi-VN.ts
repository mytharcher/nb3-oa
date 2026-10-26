export default {
  outings: {
    authz: { resource: 'Yêu cầu ra ngoài' },
    navigation: 'Yêu cầu ra ngoài',
    new: 'Yêu cầu ra ngoài mới',
    edit: 'Chỉnh sửa yêu cầu ra ngoài',
    formDescription: 'Kiểm tra thời gian và gửi xem xét hoặc lưu bản nháp.',
    description:
      'Ghi thời gian, địa điểm và mục đích ra ngoài để quản lý xem xét.',
    startAt: 'Giờ bắt đầu',
    endAt: 'Giờ kết thúc',
    location: 'Vị trí',
    reason: 'Mục đích',
    timeZone: 'Thời gian ghi theo {{zone}}',
    policyHint:
      'Sau khi bắt đầu ra ngoài, chỉ quản lý của bạn có thể chấm dứt kèm lý do.',
    nonexistentTime:
      'Giờ địa phương không tồn tại do thay đổi đồng hồ. Chọn giờ khác.',
    daylightSavingPolicy:
      'Nếu thay đổi đồng hồ lặp giờ này, dùng lần xuất hiện sớm hơn.',
    errors: {
      OUTING_EMPLOYEE_INACTIVE:
        'Người yêu cầu phải là nhân viên đang hoạt động. Liên hệ nhân sự để kiểm tra hồ sơ.',
      OUTING_INVALID_PERIOD:
        'Kết thúc phải sau bắt đầu. Kiểm tra thời gian ra ngoài.',
      OUTING_REQUIRED_FIELDS: 'Cung cấp địa điểm và mục đích.',
      OUTING_SLA_CONFIGURATION_UNSUPPORTED:
        'Không thể gửi phê duyệt. Liên hệ quản trị viên để kiểm tra thời hạn phê duyệt.',
      ATTENDANCE_ACTIVITY_CHANGED:
        'Dữ kiện chấm công đã thay đổi. Làm mới để kiểm tra.',
    },
  },
};

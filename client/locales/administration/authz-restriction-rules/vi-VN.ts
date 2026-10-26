export default {
  resourceTitle: 'Quy tắc hạn chế',
  navigation: { title: 'Quy tắc hạn chế' },
  restrictionRules: {
    noResources:
      'Chưa định nghĩa tài nguyên nghiệp vụ hỗ trợ phạm vi bản ghi. Hãy yêu cầu AI định nghĩa quyền nghiệp vụ và phạm vi bản ghi trước khi cấu hình quy tắc tại đây.',
    page: {
      title: 'Quy tắc hạn chế',
      description:
        'Quy tắc hạn chế thu hẹp quyền truy cập, giới hạn bản ghi mà người dùng đã chọn có thể truy cập và không tự cấp quyền.',
    },
    notice:
      'Quy tắc hạn chế chỉ thu hẹp quyền truy cập hiện có và không bao giờ tự cấp quyền.',
    search: 'Tìm theo tên, mã quy tắc hoặc tài nguyên',
    create: 'Quy tắc hạn chế mới',
    ruleHeader: 'Quy tắc',
    appliesToHeader: 'Áp dụng cho',
    restrictedActionsHeader: 'Thao tác bị hạn chế',
    allowedScopeHeader: 'Phạm vi được phép',
    emptyNone:
      'Chưa có quy tắc hạn chế. Hãy tạo để thu hẹp phạm vi người dùng đã chọn có thể truy cập.',
    emptySearch: 'Không có quy tắc hạn chế khớp với tìm kiếm.',
    pagerLabel: 'Quy tắc hạn chế',
    editTitle: 'Chỉnh sửa quy tắc hạn chế',
    newTitle: 'Quy tắc hạn chế mới',
    editorDescription:
      'Giới hạn phạm vi bản ghi có hiệu lực cho một nhóm đối tượng.',
    ruleHeading: 'Thông tin cơ bản',
    ruleDescription: 'Đặt tên quy tắc và chọn tài nguyên cần hạn chế.',
    ruleName: 'Tên quy tắc',
    assignmentsHeading: 'Áp dụng cho',
    assignmentsDescription: 'Chọn đối tượng chịu hạn chế này.',
    reason: 'Mô tả',
    accessHeading: 'Thao tác và phạm vi bản ghi',
    accessDescription: 'Đặt phạm vi bản ghi tối đa riêng cho từng thao tác.',
    deleteRule: 'Xóa quy tắc',
    save: 'Lưu quy tắc hạn chế',
    confirmDeleteTitle: 'Xóa quy tắc "{{title}}"?',
    confirmDeleteBody:
      'Xóa quy tắc hạn chế “{{title}}”. Bộ quyền và quy tắc còn lại quyết định quyền truy cập.',
  },
};

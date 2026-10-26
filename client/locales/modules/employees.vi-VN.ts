/**
 * English wording of the `employees` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `employees.zh-CN.ts` is checked against this shape.
 */
const employeesEnUS = {
  employees: {
    refresh: 'Làm mới',
    personal: {
      title: 'Hồ sơ cá nhân',
      description:
        'Xem thông tin nhân viên của bạn; liên hệ nhân sự để sửa lỗi.',
      identity: '{{name}} · {{code}}',
      basic: 'Thông tin cơ bản',
      profile: 'Thông tin cá nhân',
      bank: 'Tài khoản thanh toán',
      emptyTitle: 'Chưa có hồ sơ nhân viên',
      emptyDescription:
        'Liên hệ nhân sự để tạo hồ sơ nhân viên cho tài khoản của bạn.',
      profileMissing:
        'Không tìm thấy thông tin cá nhân; liên hệ nhân sự kiểm tra hồ sơ.',
      forbidden:
        'Không thể truy cập hồ sơ; liên hệ quản trị viên kiểm tra quyền.',
      refresh: 'Làm mới',
    },
    authz: {
      section: 'Nhân viên',
      settings: 'Trang hồ sơ nhân viên',
      settingsRead: 'Mở',
      collections: {
        employees: 'Hồ sơ nhân viên',
        employeeProfiles: 'Thông tin nhân viên được kiểm soát',
        employeeCompensation: 'Thu nhập nhân viên',
      },
      archive: {
        title: 'Hồ sơ nhân viên',
        view: 'Xem',
        manage: 'Tạo và chỉnh sửa',
        correctStatus: 'Sửa trạng thái',
      },
      profile: {
        title: 'Thông tin nhân viên được kiểm soát',
        view: 'Xem tất cả',
        viewBank: 'Xem tài khoản ngân hàng',
        update: 'Chỉnh sửa',
      },
      compensation: {
        title: 'Thu nhập nhân viên',
        view: 'Xem',
      },
      directory: {
        title: 'Danh bạ',
        view: 'Xem nhân sự',
        viewContact: 'Xem điện thoại và email',
      },
      scopes: {
        reports: 'Cấp dưới của tôi (mọi cấp)',
        selfAndReports: 'Tôi và cấp dưới',
        reportsHint:
          'Người dưới người xem trong tuyến báo cáo ở mọi cấp; quản lý không hoạt động ở giữa không làm gián đoạn.',
      },
      subjects: {
        position: 'Vị trí',
        reportingManager: 'Quản lý trực tiếp',
      },
    },
    permissionSets: {
      hr: 'Nhân sự: hồ sơ nhân viên',
      compensation: 'Thu nhập nhân viên (tổng giám đốc, giám đốc tài chính)',
      bank: 'Tài khoản ngân hàng nhân viên (tài chính)',
      manager: 'Quản lý trực tiếp: hồ sơ cấp dưới',
      head: 'Trưởng phòng: hồ sơ phòng ban',
      admin: 'Sửa dữ liệu hồ sơ nhân viên',
      directory: 'Danh bạ',
    },
    navigation: {
      archive: 'Nhân viên',
      directory: 'Danh bạ',
    },
    title: 'Nhân viên',
    description:
      'Quản lý tài khoản, tuyến báo cáo, vị trí và thông tin được kiểm soát của từng nhân viên.',
    fields: {
      name: 'Tên',
      code: 'Mã nhân viên',
      user: 'Tài khoản',
      primaryDepartment: 'Phòng ban chính',
      position: 'Vị trí',
      grade: 'Cấp bậc',
      manager: 'Quản lý trực tiếp',
      status: 'Trạng thái',
      careerStartDate: 'Ngày bắt đầu đi làm lần đầu',
      hireDate: 'Ngày tuyển dụng',
      probationEndDate: 'Ngày kết thúc thử việc',
      lastWorkingDay: 'Ngày làm việc cuối',
      phone: 'Điện thoại',
      email: 'Email',
      workLocation: 'Địa điểm làm việc',
      emergencyContact: 'Liên hệ khẩn cấp',
      active: 'Đang hoạt động',
      updatedAt: 'Đã cập nhật',
      idType: 'Loại giấy tờ',
      idNumber: 'Số giấy tờ',
      birthDate: 'Ngày sinh',
      address: 'Địa chỉ',
      education: 'Trình độ học vấn',
      school: 'Trường học',
      major: 'Chuyên ngành',
      bankName: 'Ngân hàng',
      bankAccount: 'Tài khoản ngân hàng',
      bankAccountName: 'Chủ tài khoản',
      effectiveFrom: 'Có hiệu lực từ',
      baseSalary: 'Lương cơ bản',
      sourceApplication: 'Đơn nguồn',
      note: 'Ghi chú',
      kind: 'Thay đổi',
      effectiveAt: 'Ngày có hiệu lực',
      changes: 'Thay đổi',
    },
    status: {
      probation: 'Đang thử việc',
      regular: 'Chính thức',
      leaving: 'Đang nghỉ việc',
      left: 'Đã nghỉ việc',
    },
    historyKind: {
      hire: 'Tuyển dụng',
      regularization: 'Chuyển chính thức',
      transfer: 'Chuyển giao',
      salaryChange: 'Thay đổi lương',
      departure: 'Nghỉ việc',
      correction: 'Sửa dữ liệu',
    },
    boolean: {
      yes: 'Có',
      no: 'Không',
    },
    search: {
      placeholder: 'Tìm theo tên hoặc mã nhân viên',
      label: 'Tìm nhân viên',
    },
    filters: {
      department: 'Phòng ban',
      allDepartments: 'Tất cả phòng ban',
      status: 'Trạng thái',
      allStatuses: 'Tất cả trạng thái',
      clear: 'Xóa bộ lọc',
    },
    empty: {
      title: 'Chưa có hồ sơ nhân viên',
      description: 'Tạo hồ sơ để liên kết tài khoản, tuyến báo cáo và vị trí.',
      descriptionReadOnly:
        'Chưa có hồ sơ hiển thị cho bạn. Hỏi nhân sự nếu bạn cho rằng cần có hồ sơ ở đây.',
      noResults: 'Không có nhân viên khớp bộ lọc.',
    },
    error: {
      title: 'Không thể tải nhân viên',
      requestFailed: 'Yêu cầu thất bại. Kiểm tra kết nối và thử lại.',
      forbidden: 'Bạn không có quyền xem mục này.',
      notFound: 'Hồ sơ nhân viên không tồn tại hoặc đã bị xóa.',
      tabForbidden: 'Bạn không có quyền xem phần này.',
    },
    actions: {
      label: 'Thao tác',
      more: 'Thao tác cho {{name}}',
      edit: 'Chỉnh sửa',
      correctStatus: 'Sửa trạng thái',
      editProfile: 'Chỉnh sửa',
      moreActions: 'Thao tác khác',
    },
    create: {
      action: 'Nhân viên mới',
      title: 'Nhân viên mới',
      description: 'Liên kết tài khoản và điền hồ sơ.',
      submit: 'Tạo',
      success: 'Đã tạo nhân viên “{{name}}”',
    },
    edit: {
      title: 'Chỉnh sửa nhân viên',
      success: 'Đã lưu nhân viên “{{name}}”',
    },
    form: {
      basicSection: 'Thông tin cơ bản',
      contactSection: 'Liên hệ',
      nameRequired: 'Nhập tên.',
      codeRequired: 'Nhập mã nhân viên.',
      userRequired: 'Chọn tài khoản cần liên kết.',
      careerStartInvalid: 'Chọn ngày bắt đầu đi làm lần đầu hợp lệ.',
      careerStartFuture:
        'Ngày bắt đầu đi làm lần đầu không được trong tương lai.',
      careerStartAfterHire:
        'Ngày bắt đầu đi làm lần đầu không được sau ngày tuyển dụng.',
      hireDateRequired: 'Chọn ngày tuyển dụng.',
      tooLong: 'Dùng tối đa {{max}} ký tự.',
      emailInvalid: 'Định dạng email không hợp lệ.',
      userTaken: 'Tài khoản này đã có hồ sơ.',
      codeTaken: 'Mã nhân viên này đã được sử dụng.',
      userInvalid: 'Tài khoản không tồn tại hoặc bị tắt.',
      managerInvalid:
        'Chọn nhân viên đang hoạt động không ở cấp dưới người này.',
      positionInvalid: 'Vị trí không tồn tại hoặc bị tắt.',
      gradeInvalid: 'Cấp bậc không tồn tại hoặc bị tắt.',
      initialStatus: 'Trạng thái ban đầu',
      managerPlaceholder: 'Tìm theo tên hoặc mã nhân viên',
      managerEmpty: 'Không có nhân viên phù hợp',
      none: 'Không có',
      positionPlaceholder: 'Chọn vị trí',
      gradePlaceholder: 'Chọn cấp bậc',
      optionsFailed: 'Không thể tải tùy chọn.',
      userPlaceholder: 'Tìm tài khoản theo tên hoặc email',
    },
    page: {
      title: 'Nhân viên',
      tabsLabel: 'Các phần nhân viên',
    },
    tabs: {
      basic: 'Thông tin cơ bản',
      profile: 'Thông tin được kiểm soát',
      compensation: 'Thu nhập',
      history: 'Lịch sử thay đổi',
    },
    profile: {
      title: 'Thông tin được kiểm soát',
      description:
        'Giấy tờ, địa chỉ, học vấn và tài khoản ngân hàng; chỉ vai trò được cấp quyền mới xem được.',
      bankOnly: 'Bạn chỉ có thể xem tài khoản ngân hàng.',
      editTitle: 'Chỉnh sửa thông tin được kiểm soát',
      success: 'Đã lưu thông tin được kiểm soát của “{{name}}”',
      identitySection: 'Giấy tờ định danh',
      educationSection: 'Trình độ học vấn',
      bankSection: 'Tài khoản ngân hàng',
    },
    compensation: {
      title: 'Thu nhập',
      description:
        'Mỗi lần chuyển chính thức và thay đổi lương thêm một dòng; không chỉnh sửa dòng cũ.',
      empty: 'Chưa có bản ghi thu nhập.',
    },
    history: {
      referenceNotice:
        'Tên tham chiếu dùng danh bạ hiện tại; tên tại thời điểm thay đổi không được lưu.',
      sources: {
        onboarding: 'Tiếp nhận nhân viên',
        departure: 'Nghỉ việc',
        transfer: 'Thay đổi nhân sự',
        probation: 'Chuyển chính thức',
        other: 'Thao tác nghiệp vụ khác',
      },
      referenceUnavailable: 'Tham chiếu lịch sử không khả dụng',
      personUnavailable: 'Nhân sự lịch sử không khả dụng',
      otherField: 'Thay đổi khác',
      title: 'Lịch sử thay đổi',
      description:
        'Tuyển dụng, chuyển chính thức, điều chuyển, nghỉ việc và sửa dữ liệu.',
      empty: 'Chưa ghi nhận thay đổi.',
    },
    correction: {
      title: 'Sửa trạng thái',
      description:
        'Sửa dữ liệu ngoài luồng phê duyệt. Lý do của bạn được kiểm toán.',
      reason: 'Lý do',
      reasonPlaceholder: 'Vì sao trạng thái ghi nhận không đúng',
      reasonRequired: 'Nhập lý do sửa.',
      submit: 'Sửa',
      unchanged: 'Việc sửa không làm thay đổi gì.',
      success: 'Đã sửa trạng thái của “{{name}}”',
    },
    directory: {
      title: 'Danh bạ',
      description:
        'Tìm đồng nghiệp theo phòng ban hoặc tên cùng thông tin liên hệ.',
      searchPlaceholder: 'Tìm theo tên hoặc mã nhân viên',
      searchLabel: 'Tìm danh bạ',
      contactHidden: 'Không hiển thị',
      emptyTitle: 'Danh bạ trống',
      emptyDescription: 'Nhân sự hiển thị tại đây khi phòng nhân sự tạo hồ sơ.',
      noResults: 'Không có đồng nghiệp khớp bộ lọc.',
      errorTitle: 'Không thể tải danh bạ',
    },
  },
};

export type EmployeesLocale = typeof employeesEnUS;

export default employeesEnUS;

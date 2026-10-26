/**
 * English wording of the `org` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `org.zh-CN.ts` is checked against this shape.
 *
 * `authz`, `subjects`, `scopes` and `dutyRoleTitles` are rendered from `{ key, ns }` descriptors the server stores or
 * registers (settings items, subject types, record accesses, seeded duty-role titles), in the application namespace.
 */
const orgEnUS = {
  org: {
    navigation: {
      departments: 'Phòng ban',
      positions: 'Vị trí',
      grades: 'Cấp bậc',
      dutyRoles: 'Vai trò trách nhiệm',
    },
    authz: {
      section: 'Tổ chức và nhân sự',
      departments: 'Phòng ban',
      positions: 'Vị trí',
      grades: 'Cấp bậc',
      dutyRoles: 'Vai trò trách nhiệm',
      read: 'Xem',
      update: 'Quản lý',
    },
    subjects: {
      departments: 'Phòng ban',
      heads: 'Trưởng phòng',
      dutyRoles: 'Vai trò trách nhiệm',
      disabled: 'Đã vô hiệu hóa',
    },
    scopes: {
      mine: 'Phòng ban của tôi',
      mineHint:
        'Bản ghi thuộc thành viên các phòng ban tôi thuộc hoặc phụ trách.',
      mineAndBelow: 'Phòng ban của tôi và cấp dưới',
      mineAndBelowHint:
        'Bản ghi thuộc thành viên phòng ban của tôi và mọi phòng ban bên dưới.',
      headed: 'Phòng ban tôi phụ trách và cấp dưới',
      headedHint:
        'Bản ghi thuộc thành viên phòng ban tôi phụ trách và mọi phòng ban bên dưới.',
    },
    dutyRoleTitles: {
      gm: 'Tổng giám đốc',
      cfo: 'Giám đốc tài chính',
      hr: 'Chuyên viên nhân sự',
      hrbp: 'Đối tác nhân sự',
      hrDirector: 'Giám đốc nhân sự',
      admin: 'Quản trị',
      sealKeeper: 'Người giữ con dấu',
      finance: 'Kế toán',
      financeManager: 'Trưởng bộ phận tài chính',
      cashier: 'Thủ quỹ',
      legal: 'Pháp chế',
      purchasing: 'Mua hàng',
      it: 'CNTT',
      committeeTech: 'Hội đồng xem xét (vị trí kỹ thuật)',
    },
    common: {
      active: 'Đang bật',
      inactive: 'Đã vô hiệu hóa',
      allStatuses: 'Tất cả trạng thái',
      noResults: 'Không có mục khớp bộ lọc.',
      clearFilters: 'Xóa bộ lọc',
      clearSearch: 'Xóa tìm kiếm',
      searchByTitleOrCode: 'Tìm theo tên hoặc mã',
      askAdministrator: 'Nhờ quản trị viên thiết lập mục này.',
      fields: {
        title: 'Tên',
        code: 'Mã',
        status: 'Trạng thái',
        name: 'Tên',
        email: 'Email',
        user: 'Cá nhân',
      },
      actions: {
        label: 'Thao tác',
        more: 'Thao tác cho {{name}}',
        edit: 'Chỉnh sửa',
        enable: 'Bật',
        disable: 'Tắt',
      },
      form: {
        titleRequired: 'Nhập tên.',
        titleTooLong: 'Dùng tối đa {{max}} ký tự.',
        codeRequired: 'Nhập mã.',
        codeFormat:
          'Dùng chữ cái, chữ số, ".", "_" và "-", bắt đầu bằng chữ cái hoặc số, tối đa 64 ký tự.',
        codeHint: 'Mã định danh cố định dùng cho nhập và hệ thống khác.',
        integer: 'Nhập số nguyên.',
        userRequired: 'Chọn người.',
      },
    },
    errors: {
      executiveTopLevelOnly:
        'Chỉ phòng ban cấp cao nhất được chỉ định điều hành; phòng ban con kế thừa.',
      codeTaken: 'Mã đã được sử dụng. Chọn mã khác.',
      parentCycle:
        'Không thể di chuyển phòng ban xuống dưới chính nó hoặc phòng ban con.',
      parentNotFound: 'Phòng ban cha không còn tồn tại. Chọn phòng ban khác.',
      userNotFound: 'Người này không tồn tại hoặc bị tắt.',
      notFound: 'Bản ghi không tồn tại hoặc đã bị xóa.',
      forbidden: 'Bạn không có quyền thực hiện.',
      requestFailed: 'Yêu cầu thất bại. Vui lòng thử lại.',
    },
    departmentPicker: {
      placeholder: 'Tìm phòng ban',
      empty: 'Không có phòng ban phù hợp',
      loadFailed: 'Không thể tải phòng ban.',
      inactivePath: '{{path}} (đã tắt)',
    },
    departments: {
      title: 'Phòng ban',
      description:
        'Quản lý cây phòng ban, trưởng phòng và thành viên. Tắt phòng ban sẽ tắt mọi cấp bên dưới.',
      create: 'Phòng ban mới',
      createChild: 'Phòng ban con mới',
      editTitle: 'Chỉnh sửa phòng ban',
      formDescription:
        'Thay phòng ban cha sẽ di chuyển phòng ban cùng mọi cấp bên dưới.',
      created: 'Đã tạo phòng ban "{{name}}"',
      saved: 'Đã lưu phòng ban "{{name}}"',
      enabled: 'Đã bật phòng ban "{{name}}"',
      disabled: 'Đã tắt phòng ban "{{name}}"',
      disableTitle: 'Tắt phòng ban "{{name}}"?',
      disableDescription:
        'Phòng ban con cũng ngừng được tính, thành viên không còn kế thừa quyền. Không xóa dữ liệu; có thể bật lại bất cứ lúc nào.',
      loadFailed: 'Không thể tải phòng ban',
      emptyTitle: 'Chưa có phòng ban',
      emptyDescription:
        'Tạo cấp cao nhất của tổ chức rồi thêm phòng ban bên dưới.',
      noResults: 'Không có phòng ban khớp tìm kiếm.',
      searchPlaceholder: 'Tìm theo tên hoặc mã phòng ban',
      treeLabel: 'Cây phòng ban',
      choose: 'Chọn phòng ban bên trái để xem chi tiết.',
      notFound: 'Phòng ban không tồn tại hoặc đã bị xóa.',
      backToTree: 'Quay lại cây',
      topLevel: 'Phòng ban cấp cao nhất',
      inheritedFrom: '(kế thừa từ "{{name}}")',
      inactiveByAncestor: 'Bị tắt cùng "{{name}}"',
      fields: {
        parent: 'Phòng ban cha',
        manager: 'Trưởng phòng',
        executive: 'Điều hành phụ trách',
        sortOrder: 'Thứ tự sắp xếp',
      },
      form: {
        codeHint: 'Tùy chọn. Nhập cập nhật phòng ban theo mã.',
        parentPlaceholder: 'Cấp cao nhất (không có cha)',
        parentHint: 'Để trống cho phòng ban cấp cao nhất.',
        managerHint:
          'Phê duyệt đến người này; không cần là thành viên. Để trống: trưởng phòng ban cha.',
        executiveHint:
          'Chỉ đặt ở phòng ban cấp cao nhất. Chọn cha sẽ xóa trường này; phòng ban con kế thừa.',
        sortOrderHint: 'Số nhỏ hơn đứng trước trong cùng cấp.',
      },
      members: {
        title: 'Thành viên ({{count}})',
        description:
          'Thành viên trực tiếp. Mỗi người có một phòng ban chính dùng cho phê duyệt và ngân sách.',
        add: 'Thêm thành viên',
        addTitle: 'Thêm thành viên vào "{{name}}"',
        added: 'Đã thêm "{{name}}" vào "{{department}}"',
        primary: 'Loại phòng ban',
        primaryBadge: 'Chính',
        secondaryBadge: 'Phụ',
        makePrimary: 'Đặt làm phòng ban chính',
        primarySet: '"{{name}}" hiện có phòng ban này là phòng ban chính',
        makePrimaryField: 'Đặt làm phòng ban chính của họ',
        makePrimaryHint:
          'Thay phòng ban chính hiện tại. Nếu không chọn, chỉ trở thành chính khi họ chưa có.',
        remove: 'Gỡ khỏi phòng ban',
        removeTitle: 'Gỡ "{{name}}" khỏi "{{department}}"?',
        removeDescription:
          'Họ ngừng kế thừa quyền phòng ban này. Nếu đây là phòng ban chính, họ sẽ không có cho đến khi bạn đặt phòng ban khác.',
        removed: 'Đã gỡ "{{name}}" khỏi "{{department}}"',
        loadFailed: 'Không thể tải thành viên',
        emptyTitle: 'Chưa có thành viên',
        emptyDescription: 'Thêm người làm việc trong phòng ban này.',
      },
    },
    positions: {
      title: 'Vị trí',
      description:
        'Vị trí công việc được hồ sơ nhân viên tham chiếu. Tắt vị trí thay vì xóa.',
      create: 'Vị trí mới',
      editTitle: 'Chỉnh sửa vị trí',
      formDescription: 'Mã giữ cố định khi tên thay đổi.',
      created: 'Đã tạo vị trí "{{name}}"',
      saved: 'Đã lưu vị trí "{{name}}"',
      enabled: 'Đã bật vị trí "{{name}}"',
      disabled: 'Đã tắt vị trí "{{name}}"',
      disableTitle: 'Tắt vị trí "{{name}}"?',
      disableDescription:
        'Không còn cho lựa chọn phân công mới. Nhân viên đang giữ vẫn giữ vị trí.',
      loadFailed: 'Không thể tải vị trí',
      notFound: 'Vị trí không tồn tại hoặc đã bị xóa.',
      emptyTitle: 'Chưa có vị trí',
      emptyDescription:
        'Thêm vị trí để tuyển nhân viên, ví dụ "Nhân viên mua hàng".',
      fields: { number: 'Thứ tự sắp xếp' },
      form: {
        numberRequired: 'Nhập thứ tự sắp xếp.',
        numberHint: 'Tùy chọn. Số nhỏ hơn đứng trước.',
      },
    },
    grades: {
      title: 'Cấp bậc',
      description:
        'Cấp bậc công việc như P5 hoặc M2. Thứ hạng quyết định cấp thâm niên trong tiêu chuẩn công tác và tầng phê duyệt.',
      create: 'Cấp bậc mới',
      editTitle: 'Chỉnh sửa cấp bậc',
      formDescription: 'Mã giữ cố định khi tên thay đổi.',
      created: 'Đã tạo cấp bậc "{{name}}"',
      saved: 'Đã lưu cấp bậc "{{name}}"',
      enabled: 'Đã bật cấp bậc "{{name}}"',
      disabled: 'Đã tắt cấp bậc "{{name}}"',
      disableTitle: 'Tắt cấp bậc "{{name}}"?',
      disableDescription:
        'Không còn cho lựa chọn phân công mới. Nhân viên đang giữ vẫn giữ vị trí.',
      loadFailed: 'Không thể tải cấp bậc',
      notFound: 'Cấp bậc không tồn tại hoặc đã bị xóa.',
      emptyTitle: 'Chưa có cấp bậc',
      emptyDescription:
        'Thêm cấp bậc kèm thứ hạng; thứ hạng càng cao càng thâm niên.',
      fields: { number: 'Thứ hạng' },
      form: {
        numberRequired: 'Nhập thứ hạng.',
        numberHint: 'Số nguyên; càng cao càng thâm niên.',
      },
    },
    dutyRoles: {
      title: 'Vai trò trách nhiệm',
      description:
        'Phê duyệt và bước xử lý tìm người qua các vai trò này. Gán thao tác mỗi vai trò được làm trong thiết lập phân quyền.',
      viewMembers: 'Xem thành viên',
      drawerDescription:
        'Người giữ trách nhiệm này. Bước phê duyệt gán cho vai trò sẽ đến họ.',
      enabled: 'Đã bật vai trò trách nhiệm "{{name}}"',
      disabled: 'Đã tắt vai trò trách nhiệm "{{name}}"',
      disableTitle: 'Tắt vai trò trách nhiệm "{{name}}"?',
      disableDescription:
        'Thành viên ngừng giữ vai trò: bước phê duyệt không tìm thấy người và quyền gán cho vai trò ngừng áp dụng. Thành viên được giữ.',
      loadFailed: 'Không thể tải vai trò trách nhiệm',
      detailFailed: 'Không thể tải vai trò trách nhiệm',
      notFound:
        'Vai trò trách nhiệm không tồn tại. Đóng bảng này để quay lại danh sách.',
      emptyTitle: 'Không có vai trò trách nhiệm',
      emptyDescription:
        'Vai trò trách nhiệm được cài cùng ứng dụng. Nhờ quản trị viên kiểm tra cài đặt.',
      fields: {
        code: 'Mã',
        memberCount: 'Thành viên',
        description: 'Mô tả',
      },
      members: {
        title: 'Thành viên ({{count}})',
        add: 'Thêm thành viên',
        addTitle: 'Thêm thành viên vào "{{role}}"',
        added: 'Đã thêm "{{name}}" vào "{{role}}"',
        remove: 'Gỡ bỏ',
        removeTitle: 'Gỡ "{{name}}" khỏi "{{role}}"?',
        removeDescription:
          'Họ không còn nhận phê duyệt cho vai trò này hoặc quyền được gán cho vai trò.',
        removed: 'Đã gỡ "{{name}}" khỏi "{{role}}"',
        alreadyRemoved: 'Người này đã bị gỡ trước đó.',
        emptyTitle: 'Chưa có thành viên',
        emptyDescription:
          'Thêm người giữ trách nhiệm này. Bước phê duyệt chờ đến khi có người được thêm.',
      },
    },
  },
};

export type OrgLocale = typeof orgEnUS;

export default orgEnUS;

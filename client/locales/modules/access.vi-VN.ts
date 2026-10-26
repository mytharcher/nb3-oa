export default {
  access: {
    guide: {
      title: 'Cách hoạt động của vai trò và quyền',
      roles:
        'Cấu hình thao tác theo phòng ban, vị trí hoặc trách nhiệm tại đây. Thành viên nhận các quyền này cùng quyền được gán trực tiếp.',
      setsTitle: 'Bộ quyền',
      sets: 'Quyền cấp lưu trữ phía sau vai trò, có thể kiểm tra và tái sử dụng. Dùng trang vai trò cho thay đổi hằng ngày.',
      defaultTitle: 'Quyền truy cập bản ghi mặc định',
      default:
        'Cung cấp phạm vi cơ sở khi thao tác chưa có phạm vi cụ thể. Không tự cấp quyền thao tác.',
      sharingTitle: 'Quy tắc chia sẻ',
      sharing: 'Mở rộng bản ghi khả dụng cho người đã có quyền thao tác.',
      restrictionTitle: 'Quy tắc hạn chế',
      restriction: 'Giới hạn thêm bản ghi đã được cấp quyền có thể truy cập.',
      inspectTitle: 'Kiểm tra quyền',
      inspect:
        'Kiểm tra quyền có hiệu lực và nguồn quyền khi không truy cập được trang hoặc bản ghi.',
    },
    permissionColumn: 'Quyền',
    personalGranted: 'Cấp trực tiếp',
    personalTarget: 'Chọn nơi cấp quyền trực tiếp',
    rowSaving: 'Đang lưu…',
    rowSaved: 'Đã lưu',
    rowFailed:
      'Thay đổi chưa được lưu. Cấu hình hiện tại đã được khôi phục; hãy kiểm tra rồi thử lại.',
    rowUncertain:
      'Không thể xác nhận kết quả lưu. Hãy làm mới trước khi thay đổi thêm.',
    inlinePermissionsHelp:
      'Thay đổi được lưu ngay. Quyền cấp trực tiếp bổ sung quyền kế thừa; tắt quyền trực tiếp không gỡ quyền kế thừa.',
    configuredOnly: 'Chỉ quyền đã cấu hình',

    personalGrantEnabled: 'Cấp trực tiếp thao tác này',
    systemScope: 'Dùng quy tắc hệ thống',
    systemScopeHelp:
      'Phạm vi không chỉ định tuân theo quyền truy cập mặc định và quy tắc chia sẻ. Không có nghĩa là tất cả bản ghi.',
    grantSources: 'Được cấp bởi',
    scopeForAction: '{{action}}: phạm vi {{scope}}',
    personalGrantAction: 'Cấp trực tiếp “{{action}}”',
    personalGrantScope:
      'Cấp trực tiếp “{{action}}”. Phạm vi dữ liệu: {{scope}}',
    personalGrantOff: 'Không cấp trực tiếp; quyền kế thừa vẫn được giữ.',
    personalGrantPending: 'Thay đổi chưa lưu. Có hiệu lực sau khi lưu.',
    editPersonalCard: 'Chỉnh sửa quyền cá nhân cho {{name}}',
    userPermissions: 'Quyền',
    inheritedPermissions: 'Quyền kế thừa',
    inheritedUnavailable: 'Bạn không có quyền xem quyền kế thừa.',
    personalOnly: 'Chỉ ngoại lệ cá nhân',
    notGranted: 'Chưa cấp',
    notSet: 'Chưa đặt',
    adjustPersonalPermissions: 'Điều chỉnh quyền cá nhân',
    unifiedPermissionsHelp:
      'Quyền đã cấu hình theo nguồn. Thay đổi cá nhân không gỡ quyền kế thừa; truy cập thực tế vẫn tuân theo hạn chế áp dụng.',
    sourceGroups: {
      baseline: 'Quyền cơ sở cho mọi người',
      duties: 'Vai trò chức năng',
      organization: 'Quan hệ tổ chức',
      direct: 'Quyền cấp cá nhân',
      system: 'Quản trị viên hệ thống',
    },
    noPersonalExceptions: 'Không có ngoại lệ cá nhân',
    membershipChanged:
      'Thành viên đã thay đổi trong thao tác khác. Trạng thái hiện tại đã được tải lại; hãy xác nhận thay đổi còn lại.',
    username: 'Tên đăng nhập',
    personalExceptions: 'Ngoại lệ cá nhân',
    adjustExceptions: 'Điều chỉnh ngoại lệ cá nhân',
    exceptionsHelp:
      'Chỉ thay đổi quyền được cấp trực tiếp cho người này. Quyền từ vai trò hoặc tổ chức vẫn có thể áp dụng sau khi gỡ.',
    editDenied:
      'Bạn không thể chỉnh sửa cấu hình này. Đang hiển thị chế độ chỉ đọc.',
    permissionSources: 'Nguồn quyền',
    frozenConfiguration:
      'Tài khoản này bị đóng băng. Cấu hình phân quyền được giữ lại và áp dụng theo quy tắc có hiệu lực khi kích hoạt.',
    frozenRoles:
      'Tài khoản này bị đóng băng. Hãy kích hoạt trước khi thêm vai trò chức năng; vẫn có thể gỡ vai trò hiện có.',
    roleInactive: 'Không hoạt động',
    roleAdditionBlocked:
      'Tài khoản bị đóng băng hoặc vai trò đã chọn không hoạt động hay không khả dụng. Hãy hủy việc thêm hoặc tải lại trạng thái trước khi xác nhận.',
    membershipUnverified:
      'Chưa xác minh kết quả. Hãy tải lại thành viên trước khi tiếp tục; không gửi lại.',
    dutyRolesHelp:
      'Vai trò chức năng được gán trực tiếp cho người này hiển thị tại đây.',
    noPrimaryDepartment: 'Không có phòng ban chính hiện tại',
    primaryDepartment: 'Phòng ban chính',
    departmentPath: 'Đường dẫn phòng ban',
    organizationHelp: 'Thành viên tổ chức do quản trị viên tổ chức quản lý.',
    roleFilterInvalid:
      'Vai trò chức năng này không khả dụng. Bộ lọc vai trò đã được xóa.',
    roleFilterTooLarge:
      'Vai trò này có hơn 500 thành viên. Không hỗ trợ lọc theo vai trò này; hãy xóa bộ lọc vai trò.',
    organizationState: {
      'inactive-chain':
        'Phòng ban chính hoặc phòng ban cấp trên không hoạt động. Quan hệ tổ chức này hiện không áp dụng.',
      'invalid-chain':
        'Quan hệ tổ chức này không hợp lệ. Hãy liên hệ quản trị viên tổ chức.',
    },

    scopeNumber: 'Phạm vi bản ghi {{number}}',
    scopeLabels: {
      paymentRequests: 'Đề nghị thanh toán',
      reimbursementRequests: 'Đề nghị hoàn chi phí',
      leaveRequests: 'Đơn nghỉ phép',
      contractRequests: 'Đề nghị phê duyệt hợp đồng',
      certificateRequests: 'Đề nghị giấy chứng nhận',
      sealRequests: 'Đề nghị sử dụng con dấu',
      printTemplates: 'Mẫu',
      printTemplateRevisions: 'Phiên bản mẫu',
      knowledgeDocuments: 'Tài liệu',
      knowledgeVersions: 'Phiên bản tài liệu',
      knowledgeFolders: 'Thư mục',
      sealLedger: 'Đăng ký con dấu',
      sealReceipts: 'Biên nhận con dấu',
      contracts: 'Hợp đồng',
      contractVersions: 'Phiên bản hợp đồng',
      contractChanges: 'Thay đổi hợp đồng',
      contractPayments: 'Thanh toán hợp đồng',
    },
    sourceNumber: 'Nguồn {{number}}',
    more: 'Thêm',
    userRoles: 'Vai trò',
    permissionOverview: 'Tổng quan quyền',
    noRoles: 'Không có',
    organization: 'Tổ chức',
    moreFor: 'Thêm · {{name}}',
    addModules: 'Thêm phân hệ',
    userDetails: 'Chi tiết người dùng',
    information: 'Thông tin',
    email: 'Email',
    accountStatus: 'Trạng thái tài khoản',
    enabled: 'Đang hoạt động',
    disabled: 'Đã đóng băng',
    organizationReadOnly:
      'Phòng ban, vị trí và quan hệ báo cáo được quản lý trong Tổ chức.',
    advancedExceptions: 'Nâng cao: quyền ngoại lệ',
    partialSave:
      'Đã lưu {{count}} thay đổi. Thay đổi còn lại được giữ; hãy thử lại để tiếp tục.',
    addedRoles: 'Thêm: {{names}}',
    removedRoles: 'Gỡ: {{names}}',
    compareRole: 'So sánh vai trò',
    copyRole: 'Sao chép từ đối chiếu',
    copyHelp:
      'Sao chép quyền thông thường vào bản nháp này. Chính sách đặc biệt giữ nguyên. Kiểm tra mọi thay đổi trước khi lưu.',
    advanced: 'Nâng cao',
    addRoles: 'Thêm vai trò để so sánh',

    directAudience: 'Lượt gán cá nhân',
    dutyAudience: 'Thành viên vai trò trách nhiệm',

    targetSet: 'Bộ quyền đích',
    chooseTarget: 'Chọn bộ quyền cho thao tác này',
    targetRequired: 'Chọn đích cho thao tác mới này trước khi lưu.',
    roleGrantTitle: '{{module}} ({{role}} · quyền độc lập {{number}})',

    assignmentSearch: 'Tìm quyền, thao tác hoặc phạm vi bản ghi',
    assignmentOnlySelected: 'Chỉ mục đã chọn',
    assignmentCount:
      'Hiển thị {{visible}} trên {{total}} · đã chọn {{selected}} trong tất cả phân hệ',
    assignmentChoicesHelp:
      'Lọc theo phân hệ rồi so sánh thao tác và phạm vi bản ghi. Bộ cùng tên vẫn độc lập. Bộ lọc giữ lựa chọn ở phân hệ khác.',
    assignmentBusiness: 'Thao tác nghiệp vụ',
    assignmentOther: 'Quản trị / khác',
    pageAccess: 'Quyền truy cập trang',
    configuredGrant: 'Đã cấp',
    dutyMembershipTitle:
      '{{action}} vai trò trách nhiệm "{{role}}" cho "{{name}}"?',
    exceptionSummary: 'Quyền ngoại lệ: {{names}}',
    noExceptions: 'Không có',
    baseOnlyDepartment:
      'Quyền phòng ban áp dụng đến thành viên cấp dưới. Ưu tiên vai trò trách nhiệm cho thao tác chuyên môn.',

    adminMembersHelp:
      'Quản lý quản trị viên trong tài khoản người dùng. Giữ ít nhất một quản trị viên hoạt động.',
    openUsers: 'Xem tài khoản người dùng',
    ruleLinks: 'Quy tắc truy cập',
    rulesHelp:
      'Quyền truy cập mặc định, quy tắc chia sẻ và hạn chế vẫn ảnh hưởng đến quyền truy cập có hiệu lực.',
    defaultRules: 'Quyền truy cập mặc định',
    sharingRules: 'Quy tắc chia sẻ',
    restrictionRules: 'Quy tắc hạn chế',

    modules: 'Duyệt theo phân hệ',
    onlyConfigured: 'Chỉ mục đã cấu hình',
    baselineValue: 'Mọi người có quyền cơ sở: {{value}}',
    advancedEdit: 'Trình chỉnh sửa nâng cao',
    changedCount: '{{count}} thay đổi',
    roleImpact: 'Thành viên bị ảnh hưởng của "{{name}}": {{count}}',
    sharedObjects: 'Bộ quyền cũng được gán cho: {{names}}',
    changeShared: 'Thay đổi tất cả chủ thể này',
    splitDefault:
      'Theo mặc định, tách bộ dùng chung thành bản sao độc lập cho vai trò này.',
    userPermissionsTitle: 'Quyền của {{name}}',
    unionHelp:
      'Phạm vi bản ghi từ nhiều nguồn được kết hợp; quy tắc truy cập vẫn áp dụng.',
    assignedRoles: 'Vai trò đã gán',
    preferRoles:
      'Ưu tiên vai trò trách nhiệm; quyền cấp trực tiếp dùng cho ngoại lệ.',
    exceptionGrant: 'Quản lý quyền ngoại lệ',
    configurationDenied:
      'Cần quyền đọc bộ quyền để xem chi tiết cấu hình. Hãy liên hệ quản trị viên.',
    checkOperation: 'Kiểm tra thao tác',
    notConfigured: 'Chưa cấu hình',
    applicable: 'Áp dụng cho',
    modulesCount: 'Phân hệ đã cấu hình',
    personalAudience: 'Gán trực tiếp · {{count}} người',
    maintainedAudience: 'Thành viên được quản lý · {{count}} người',
    automaticAudience: 'Tính từ quan hệ tổ chức',
    departmentAudience: 'Thành viên phòng ban và cấp dưới',
    positionAudience: 'Người giữ vị trí này',
    allAuthenticated: 'Tất cả người đã đăng nhập',
    organizationMembersHelp:
      'Thành viên được quản lý trong tổ chức và tính từ quan hệ đang hoạt động.',
    openOrganization: 'Xem tổ chức',
    adjustDutyRoles: 'Điều chỉnh vai trò trách nhiệm',
    membersUnknown: 'Không có số lượng thành viên',

    labelValue: '{{label}}: {{value}}',
    clearModuleFilters: 'Xóa bộ lọc',
    noModuleMatches: 'Không có quyền phù hợp trong phân hệ này',

    businessModules: 'Phân hệ nghiệp vụ',
    allModules: 'Tất cả',
    otherModules: 'Khác',
    noModulePermissions: 'Chưa cấu hình quyền trong phân hệ này',
    moduleCount:
      '{{module}}: đã cấu hình {{configured}} / {{total}} tài nguyên',

    actionsFor: 'Thao tác cho "{{name}}"',
    configuredScopes: 'Phạm vi đã cấu hình',

    lastAdmin:
      'Phải giữ ít nhất một quản trị viên hệ thống đang hoạt động. Hãy chỉ định người thay thế trước.',
    subjectNotAllowed:
      'Không thể gán quyền truy cập này cho loại chủ thể này. Hãy chọn quyền nghiệp vụ khác.',

    title: 'Quản lý truy cập',
    description: 'Cấu hình thao tác nghiệp vụ và phạm vi bản ghi theo vai trò.',
    roles: 'Quyền truy cập vai trò',
    baseline: 'Quyền cơ sở khi đăng nhập',
    baselineHelp:
      'Quyền cơ sở áp dụng cho tài khoản đã đăng nhập. Thành viên trách nhiệm cũng ảnh hưởng đến ứng viên phê duyệt.',
    name: 'Tên',
    type: 'Loại',
    all: 'Tất cả loại',
    dutyRoles: 'Vai trò chức năng',
    positions: 'Vị trí',
    departments: 'Phòng ban',
    automatic: 'Quyền truy cập tự động',
    members: 'Thành viên',
    permissions: 'Quyền nghiệp vụ',
    missingMembers: 'Chưa gán thành viên',
    memberDenied: 'Không thể truy cập thành viên',
    membersFailed: 'Không thể tải thành viên',
    byMembership: 'Áp dụng theo thành viên',
    none: 'Chưa gán quyền nghiệp vụ',
    noneHelp:
      'Gán quyền nghiệp vụ hiện có sau khi xác nhận trách nhiệm. Quyền kế thừa vẫn có hiệu lực.',
    searchRoles: 'Tìm vai trò, vị trí hoặc phòng ban…',
    clear: 'Xóa bộ lọc',
    noResults: 'Không có kết quả phù hợp',
    clearHelp: 'Thay đổi tìm kiếm hoặc xóa bộ lọc.',
    loading: 'Đang tải',
    refresh: 'Làm mới',
    denied:
      'Bạn không có quyền thực hiện thao tác này. Hãy liên hệ quản trị viên quyền truy cập.',
    missing: 'Mục này không còn tồn tại. Hãy quay lại danh sách.',
    conflict:
      'Cấu hình truy cập đã thay đổi. Tải lại và kiểm tra trước khi lưu.',
    failed:
      'Không thể hoàn thành thao tác. Thử lại hoặc liên hệ quản trị viên.',
    reload: 'Tải lại',
    retry: 'Thử lại',
    roleHelp:
      'Kiểm tra thành viên, thao tác nghiệp vụ và phạm vi bản ghi của trách nhiệm này.',
    rules:
      'Có thể áp dụng quy tắc truy cập bổ sung. Kiểm tra quyền của cá nhân và thao tác nghiệp vụ thực tế.',
    actions: 'Thao tác',
    addMember: 'Thêm thành viên',
    remove: 'Gỡ bỏ',
    memberImpact:
      'Thành viên trách nhiệm ảnh hưởng đến quyền kế thừa và ứng viên phê duyệt. Nguồn quyền khác vẫn giữ sau khi gỡ.',
    assign: 'Gán quyền nghiệp vụ',
    usedBy:
      'Quyền này được gán cho {{count}} chủ thể. Chỉnh sửa ảnh hưởng đến tất cả.',
    edit: 'Chỉnh sửa',
    special: 'Cấu hình tùy chỉnh hiện có',
    specialReadOnly: 'Cấu hình tùy chỉnh chỉ đọc và sẽ được giữ khi lưu.',
    noScope: 'Chưa cấu hình phạm vi bản ghi',
    systemAdmin: 'Quản trị viên hệ thống',
    unrestricted: 'Quản trị viên hệ thống: truy cập không giới hạn',
    removeTitle: 'Gỡ thành viên "{{name}}"?',
    cancel: 'Hủy',
    removed: 'Đã gỡ "{{name}}"',
    added: 'Đã thêm "{{name}}"',
    addMemberTitle: 'Thêm thành viên {{name}}',
    add: 'Thêm',
    person: 'Cá nhân',
    selectPerson: 'Chọn người đảm nhận trách nhiệm này.',
    userDenied:
      'Bạn không thể xem danh bạ người dùng. Hãy liên hệ quản trị viên.',
    direct: 'Được gán trực tiếp',
    inherited: 'Quyền truy cập kế thừa',
    personUnknown: 'Cá nhân (không có tên)',
    back: 'Quay lại danh sách',
    pageActionHelp:
      'Quyền trang kiểm soát trình đơn và lối vào. Cấp riêng từng thao tác nghiệp vụ và phạm vi bản ghi; chỉ mở trang không cấp quyền thao tác.',
    emptyDirectory: 'Không có chủ thể khả dụng',
    emptyHelp: 'Hiện không có bản ghi khả dụng trong danh bạ này.',
    deniedAction: 'Chưa được cấp quyền',
    sensitive: 'Quyền truy cập nhạy cảm',
    impactUnavailable:
      'Không thể xác minh toàn bộ ảnh hưởng. Kiểm tra chủ thể bị ảnh hưởng và khả năng hiển thị trước khi thay đổi quyền dùng chung này.',
    conditional: 'Quyền truy cập có điều kiện',
    permitted: 'Quyền truy cập vô điều kiện',
    assignTitle: 'Thay đổi quyền truy cập cho "{{name}}"',
    assignHelp:
      'Chọn quyền nghiệp vụ trực tiếp cho chủ thể này. Nguồn khác được giữ lại.',
    noAssignable: 'Không có quyền nghiệp vụ có thể gán',
    preserveInherited:
      'Chỉ lượt gán trực tiếp thay đổi tại đây. Quyền kế thừa từ phòng ban, vị trí, trách nhiệm và quyền cơ sở được giữ lại.',
    save: 'Lưu',
    saved: 'Đã lưu quyền truy cập cho "{{name}}"',
    confirmTitle: 'Lưu thay đổi quyền truy cập cho "{{name}}"?',
    assignmentImpact:
      'Kiểm tra quyền được thêm và gỡ. Nguồn khác được giữ; phải còn quản trị viên hệ thống hoạt động.',
    discardTitle: 'Bỏ thay đổi chưa lưu?',
    discard: 'Bỏ',
    discardHelp: 'Thay đổi của bạn chưa được lưu. Bỏ sẽ xóa chúng.',
    editTitle: 'Chỉnh sửa quyền nghiệp vụ cho "{{name}}"',
    editorHelp:
      'Chọn riêng thao tác và phạm vi. Thao tác nhạy cảm được tách riêng; kiểm tra ảnh hưởng trước khi lưu.',
    impact: 'Chủ thể bị ảnh hưởng',
    searchActions: 'Tìm tính năng hoặc thao tác nghiệp vụ…',
    multipleScopes: 'Cấu hình từng phạm vi bên dưới cho thao tác này.',
    levelFor: 'Phạm vi bản ghi của "{{name}}"',
    protected: 'Quyền truy cập này được bảo vệ',
    protectedHelp:
      'Bảo vệ hệ thống vẫn được giữ. Quản lý thành viên quản trị viên qua tài khoản người dùng.',
    sharedHelp:
      'Thay đổi này ảnh hưởng mọi chủ thể liệt kê bên trên. Kiểm tra thao tác và phạm vi.',
    system: 'Trách nhiệm hệ thống',
  },
};

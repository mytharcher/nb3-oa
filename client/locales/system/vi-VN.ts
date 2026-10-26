import type { LocaleResource } from '@nocobase/i18n';
import deviceApprovalEnUS from '#extensions/nocobase-device-approval/locales/vi-VN';
import inboxEnUS from '#extensions/nocobase-inbox/locales/vi-VN';

/**
 * The copy of what the template ships: the shell, the sign-in pages, shared components and the homepage. A template
 * upgrade replaces this file, so put the application's own copy in `../en-US.ts` rather than here.
 */
const systemEnUS = {
  // The UI Library block of the `/device` page; the keys below may reword it.
  ...deviceApprovalEnUS,
  // The UI Library block of the `/inbox` page; the keys below may reword it.
  ...inboxEnUS,
  'inbox.title': 'Tin nhắn',
  'inbox.loadFailed': 'Không thể tải tin nhắn',
  // The UI Library component of the header's inbox button.
  'inboxButton.title': 'Tin nhắn',
  'inboxButton.pending': 'Tin nhắn, {{count}} đang chờ',
  'inboxButton.unread': 'Tin nhắn, {{count}} chưa đọc',
  'inboxButton.pendingHint':
    '{{count}} mục đang chờ bạn; số giảm khi được xử lý.',
  'inboxButton.unreadHint': '{{count}} mục chưa đọc; số giảm khi bạn đọc.',
  'auth.welcome': 'Chào mừng trở lại',
  'auth.loginDescription':
    'Đăng nhập bằng tên đăng nhập hoặc email và mật khẩu.',
  'auth.registerTitle': 'Tạo tài khoản',
  'auth.registerDescription': 'Tạo tài khoản để bắt đầu.',
  'auth.forgotTitle': 'Quên mật khẩu',
  'auth.forgotDescription':
    'Nhập email, chúng tôi sẽ gửi liên kết đặt lại nếu tài khoản tồn tại.',
  'auth.resetDescription': 'Chọn mật khẩu mới cho tài khoản.',
  'auth.resetTitle': 'Đặt lại mật khẩu',
  'auth.identifier': 'Tên đăng nhập hoặc email',
  'auth.password': 'Mật khẩu',
  'auth.signIn': 'Đăng nhập',
  'auth.signingIn': 'Đang đăng nhập…',
  'auth.hidePassword': 'Ẩn mật khẩu',
  'auth.showPassword': 'Hiện mật khẩu',
  'auth.forgotLink': 'Quên mật khẩu?',
  'auth.noAccount': 'Chưa có tài khoản?',
  'auth.signUp': 'Đăng ký',
  'auth.createAccount': 'Tạo tài khoản',
  'auth.creatingAccount': 'Đang tạo tài khoản…',
  'auth.name': 'Tên',
  'auth.username': 'Tên đăng nhập',
  'auth.email': 'Email',
  'auth.confirmPassword': 'Xác nhận mật khẩu',
  'auth.existingAccount': 'Đã có tài khoản?',
  'auth.passwordMismatch': 'Mật khẩu không khớp.',
  'auth.resetting': 'Đang đặt lại…',
  'auth.newPassword': 'Mật khẩu mới',
  'auth.confirmNewPassword': 'Xác nhận mật khẩu mới',
  'auth.invalidResetLink':
    'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  'auth.backToSignIn': 'Quay lại đăng nhập',
  'auth.sendResetLink': 'Gửi liên kết đặt lại',
  'auth.sending': 'Đang gửi…',
  'auth.resetSent': 'Nếu tài khoản tồn tại, liên kết đặt lại đã được gửi.',
  'auth.rememberPassword': 'Bạn nhớ mật khẩu?',
  'auth.methods': 'Phương thức đăng nhập',
  'auth.or': 'Hoặc tiếp tục với',
  'auth.continueWith': 'Tiếp tục với {provider}',
  'auth.about': 'Giới thiệu ứng dụng',
  'auth.platform': 'Nền tảng ứng dụng AI nguyên bản',
  'auth.marketingTitleFirst': 'Để AI tự do xây dựng.',
  'auth.marketingTitleSecond': 'NocoBase giữ cho ứng dụng',
  'auth.marketingTitleThird': 'đáng tin cậy.',
  'auth.marketingDescription':
    'Cung cấp khung giao diện linh hoạt để AI tạo từng trải nghiệm, trong khi NocoBase bảo vệ dữ liệu, quyền và quản trị bên dưới.',
  'auth.frontend': 'Giao diện AI nguyên bản',
  'auth.frontendDescription': 'Tự do kết hợp giao diện trên khung linh hoạt.',
  'auth.foundation': 'Nền tảng NocoBase',
  'auth.foundationDescription':
    'Dữ liệu, kiểm soát truy cập và quản trị đáng tin cậy.',
  'auth.marketingFooter': 'Tự do bên trên. Vững tin bên dưới.',
  'status.loading': 'Đang tải',
  'status.loadingPage': 'Đang tải trang',
  'status.denied': 'Truy cập bị từ chối',
  'status.pageFailed': 'Không thể tải trang',
  'status.retry': 'Thử lại',
  'navigation.brandHome': 'Trang chủ NocoBase',
  'navigation.brandApps': 'Ứng dụng NocoBase',
  'routeOverlay.close': 'Đóng',
  'status.backHome': 'Quay lại bàn làm việc',
  'status.deniedDescription': 'Bạn không có quyền truy cập trang này.',
  'status.routeFailedDescription': 'Không thể tải trang này. Vui lòng thử lại.',
  shell: {
    buildFreely: 'AI tự do xây dựng.',
    reliability: '<brand>NocoBase</brand> giữ ứng dụng đáng tin cậy.',
  },
  home: {
    platform: 'NocoBase · Nền tảng ứng dụng AI nguyên bản',
    title: 'Mô tả ý tưởng, tác nhân sẽ xây dựng',
    description:
      'Ứng dụng được phát triển qua trao đổi với tác nhân lập trình. Nói nhu cầu nghiệp vụ bằng ngôn ngữ thông thường, tác nhân viết trang, mô hình dữ liệu, API và quy trình trong dự án này.',
    steps: {
      describe: {
        title: 'Mô tả nhu cầu',
        description: 'Nêu ai sử dụng, dữ liệu cần lưu và việc cần xảy ra.',
      },
      build: {
        title: 'Để tác nhân xây dựng',
        description: 'Tác nhân đọc dự án cùng khả năng có sẵn rồi viết mã.',
      },
      review: {
        title: 'Kiểm tra và tinh chỉnh',
        description:
          'Làm mới trang để thử rồi yêu cầu thay đổi theo cùng cách.',
      },
    },
    example: {
      title: 'Thử yêu cầu như sau',
      text: 'Xây dựng ứng dụng đơn đặt hàng.\n\nĐơn có số, mặt hàng, người yêu cầu, số tiền và trạng thái phê duyệt. Người yêu cầu tạo đơn và chỉ xem đơn của mình; người xem xét thấy mọi đơn đang chờ và duyệt hoặc từ chối.\nSau quyết định, thông báo người yêu cầu trong hộp thư kèm liên kết đơn.',
      hint: 'Dán vào Claude Code, Codex, Cursor hoặc tác nhân lập trình bất kỳ đang mở dự án.',
    },
    capabilitiesTitle: 'Khả năng có sẵn',
    capabilitiesDescription:
      'Tác nhân dùng trực tiếp thay vì xây từ đầu. Mở mục để lấy lời nhắc có thể chỉnh sửa và sao chép.',
    viewPrompts: 'Xem lời nhắc ({{count}})',
    prompt: {
      label: 'Lời nhắc',
      hint: 'Sửa lời nhắc phù hợp nghiệp vụ trước khi sao chép. Thay đổi không lưu sau khi đóng hộp thoại.',
      copy: 'Sao chép',
      copiedShort: 'Đã sao chép',
      copied: 'Đã sao chép lời nhắc',
      copyFailed: 'Không thể sao chép. Chọn văn bản và sao chép thủ công.',
      reset: 'Khôi phục mặc định',
    },
    capabilities: {
      auth: {
        title: 'Xác thực',
        description:
          'Đăng nhập, đăng ký, đặt lại mật khẩu và đăng nhập một lần doanh nghiệp.',
        prompts: {
          disableSignUp: {
            label: 'Đóng đăng ký',
            text: 'Ứng dụng này chỉ dành cho nhân viên công ty. Quản trị viên tạo mọi tài khoản.\nTắt tự đăng ký và gỡ liên kết đăng ký khỏi trang đăng nhập.\nNhân viên hiện có vẫn đăng nhập được bằng tài khoản và mật khẩu.\nGiữ liên kết quên mật khẩu.',
          },
          passwordRules: {
            label: 'Quy tắc mật khẩu',
            text: 'Yêu cầu ít nhất 12 ký tự khi đăng ký hoặc đặt lại mật khẩu.\nHiển thị yêu cầu trong cả hai biểu mẫu và dùng thông báo xác thực thống nhất.\nGiữ khả năng đăng nhập tài khoản hiện có mà không buộc đổi mật khẩu ngay.',
          },
          companySso: {
            label: 'SSO công ty',
            text: 'Cho phép nhân viên đăng nhập qua nền tảng định danh công ty bằng OIDC.\n\nGiữ đăng nhập tài khoản-mật khẩu và thêm nút Tài khoản công ty.\nNút mở nền tảng định danh công ty. Đăng nhập thành công quay lại trang chủ ứng dụng.\n\nCho phép lần đăng nhập đầu tạo tài khoản ứng dụng, xác định bằng mã người dùng cố định của nền tảng.\nKhông tự liên kết tài khoản theo tên hoặc email khớp. Tài khoản mới dùng quyền mặc định của ứng dụng.\n\nLiệt kê thông tin quản trị viên nền tảng định danh cần cung cấp và URL gọi lại cần đăng ký.',
          },
        },
      },
      authorization: {
        title: 'Quyền',
        description:
          'Kiểm soát ai có thể mở trang, chạy thao tác và xem bản ghi nào.',
        prompts: {
          jobs: {
            label: 'Vị trí công việc',
            text: 'Tạo công việc Người yêu cầu mua và Người xem xét đơn cho ứng dụng.\nNgười yêu cầu mua vào trang đơn và xem đơn mình yêu cầu.\nNgười xem xét vào trang đơn, xem và duyệt hoặc từ chối đơn đang chờ.\nChỉ quản trị viên ứng dụng thay đổi quyền và lượt gán.\nDùng khả năng phân quyền hiện có để quản trị viên điều chỉnh quyền và gán người về sau.',
          },
          dataScopes: {
            label: 'Phạm vi dữ liệu',
            text: 'Cho người yêu cầu mua chỉ xem đơn của mình, dùng trường người yêu cầu xác định sở hữu.\nNgười xem xét được xem tất cả đơn và xử lý phê duyệt đang chờ.\nQuản trị viên điều chỉnh phạm vi xem đơn của từng công việc trong bộ quyền.',
          },
          sharing: {
            label: 'Chia sẻ',
            text: 'Chia sẻ đơn PO-2026-004 của Bob cho Alice để cô ấy xem.\nAlice đã có quyền xem đơn; thêm quyền xem đơn này.\nGiữ trách nhiệm hiện có. Người xem xét vẫn xử lý phê duyệt.\nCho quản trị viên quản lý quy tắc chia sẻ này.',
          },
        },
      },
      scheduler: {
        title: 'Tác vụ theo lịch',
        description:
          'Chạy công việc nghiệp vụ theo giờ đặt sẵn và xem lần chạy tiếp theo cùng kết quả.',
        prompts: {
          reminder: {
            label: 'Nhắc hằng ngày',
            text: 'Thêm Nhắc đơn đang chờ vào ứng dụng đơn hiện có.\n\nLúc 09:00 giờ Bắc Kinh mỗi ngày trong tuần, tìm đơn chờ phê duyệt, nhóm theo người xem xét và gửi mỗi người một thông báo trong ứng dụng.\nGồm số đơn chờ và liên kết danh sách. Không gửi khi không có đơn chờ.\nQuản trị viên xem lịch, bản ghi thực thi và tạm dừng hoặc tiếp tục nhắc.',
          },
          weeklyReport: {
            label: 'Báo cáo tuần',
            text: 'Lúc 08:00 giờ Bắc Kinh mỗi thứ Hai, tạo tổng hợp bán hàng tuần trước và thông báo trưởng phòng kinh doanh.\nGồm doanh thu, số đơn và tổng theo vùng. Quản trị viên xem tác vụ và bản ghi thực thi.',
          },
        },
      },
      notification: {
        title: 'Thông báo',
        description:
          'Gửi tin trong ứng dụng, email hoặc tin bot nhóm khi có sự kiện.',
        prompts: {
          inApp: {
            label: 'Tin trong ứng dụng',
            text: 'Thêm phê duyệt đơn vào ứng dụng hiện tại và thông báo kết quả cho người yêu cầu qua tin trong ứng dụng.\n\nĐơn gồm số, tên, người yêu cầu, số tiền và trạng thái phê duyệt.\nNgười yêu cầu xem đơn của mình. Người xem xét thấy đơn chờ và duyệt hoặc từ chối. Tái sử dụng tính năng đơn và phê duyệt hiện có nếu có.\n\nSau duyệt hoặc từ chối, chỉ gửi một tin cho người yêu cầu đơn.\nTiêu đề cho biết đơn đã duyệt hay bị từ chối. Nội dung gồm số, tên và kết quả phê duyệt.\nNhấn tin mở chi tiết đơn tương ứng.\nKhông gửi khi đang chờ phê duyệt. Chỉ thông báo một lần cho cùng kết quả.\nLỗi thông báo không ảnh hưởng kết quả phê duyệt đã lưu.',
          },
          email: {
            label: 'Email',
            text: 'Thêm email vào thông báo phê duyệt đơn hiện có, dùng kênh email đã cấu hình.\n\nSau duyệt hoặc từ chối, gửi kết quả đến email tài khoản người yêu cầu.\nTiêu đề gồm số đơn; nội dung gồm tên và kết quả.\nGiữ tin trong ứng dụng hiện có. Nếu người yêu cầu không có email, chỉ gửi tin trong ứng dụng.\nLỗi email không được ảnh hưởng kết quả phê duyệt hoặc tin trong ứng dụng.',
          },
        },
      },
      mail: {
        title: 'Bưu điện',
        description:
          'Kết nối hộp thư cá nhân rồi đọc, trả lời và gửi email nghiệp vụ.',
        prompts: {
          mailCenter: {
            label: 'Trung tâm thư',
            text: 'Thêm trung tâm thư và lối quản lý tài khoản hộp thư vào ứng dụng. Người dùng kết nối hộp thư của mình, chọn hộp thư, đồng bộ thư đến, đọc thư và tệp đính kèm, rồi trả lời.\n\nKhi nhân viên kinh doanh nhận yêu cầu báo giá, họ có thể trả lời từ trung tâm thư. Giữ tiêu đề và ngữ cảnh hội thoại gốc, gửi trả lời đến người gửi gốc. Mỗi người dùng làm việc với hộp thư họ kết nối.',
          },
          correspondence: {
            label: 'Email khách hàng',
            text: 'Thêm phần trao đổi thư vào chi tiết khách hàng. Hiển thị thư có người gửi hoặc nhận khớp email liên hệ khách hàng hiện tại. Nhân viên kinh doanh đọc thư, xem tệp và trả lời bằng hộp thư mình kết nối.',
          },
        },
      },
      file: {
        title: 'Tệp',
        description:
          'Tải tệp lên, đính kèm vào bản ghi, xem trước hoặc tải xuống.',
        prompts: {
          attachments: {
            label: 'Tệp đính kèm',
            text: 'Thêm tệp mua sắm vào ứng dụng quản lý đơn hiện có của tôi.\n\nThêm vùng đính kèm trong chi tiết đơn. Mỗi đơn có nhiều tệp, gồm PDF, ảnh và DOCX.\nHiển thị tên, kích thước tệp và thao tác xem trước, tải xuống, gỡ.\nSau tải lên, cho người dùng lưu tệp vào đơn hiện tại. Giữ khả dụng khi mở lại đơn.\nAi có quyền truy cập đơn đều xem và tải tệp được. Người yêu cầu và xem xét có thể thêm hoặc gỡ tệp.\nGỡ chỉ bỏ liên kết khỏi đơn hiện tại; giữ tệp.',
          },
          avatar: {
            label: 'Ảnh đại diện',
            text: 'Thêm ảnh đại diện cho mỗi nhân viên, một ảnh mỗi người.\nHỗ trợ tải và thay ảnh, hiển thị trong danh sách và chi tiết nhân viên.\nDùng ảnh mới sau thay thế và giữ hiển thị sau làm mới trang.',
          },
        },
      },
      templatePrint: {
        title: 'In mẫu',
        description:
          'Điền dữ liệu nghiệp vụ vào mẫu Word hoặc Excel và tạo tệp.',
        prompts: {
          approvalForm: {
            label: 'Phiếu phê duyệt',
            text: 'Thêm thao tác “Tạo phiếu phê duyệt” vào chi tiết đơn.\n\nDùng mẫu Word tôi cung cấp để điền số đơn hiện tại, đề nghị mua, người yêu cầu, số tiền, kết quả phê duyệt và thời điểm xử lý.\nGiữ tiêu đề, bố cục bảng và vùng ký của mẫu. Đặt tên đầu ra “Phê-duyệt-mua-số-đơn” và cho tải Word.\nAi có quyền truy cập đơn đều tạo được phiếu. Dùng dữ liệu đơn hiện tại khi tạo tệp.',
          },
          pdf: {
            label: 'Đầu ra PDF',
            text: 'Thêm tải PDF cho phiếu phê duyệt mua, giữ phông chữ, bảng và vùng ký của mẫu Word.',
          },
        },
      },
      i18n: {
        title: 'Ngôn ngữ',
        description:
          'Chuyển ngôn ngữ giao diện, thêm ngôn ngữ và đặt mặc định.',
        prompts: {
          addLanguage: {
            label: 'Thêm ngôn ngữ',
            text: 'Thêm tiếng Tây Ban Nha vào ứng dụng của tôi. Dịch giao diện và thông báo máy chủ, thêm tiếng Tây Ban Nha vào trình đơn ngôn ngữ.',
          },
          defaultLanguage: {
            label: 'Ngôn ngữ mặc định',
            text: 'Đặt tiếng Trung giản thể làm mặc định cho người chưa chọn ngôn ngữ. Giữ tiếng Anh trong trình đơn.',
          },
        },
      },
      theme: {
        title: 'Giao diện',
        description: 'Điều chỉnh màu, phông chữ, mật độ và chuyển sáng tối.',
        prompts: {
          changeTheme: {
            label: 'Thay giao diện',
            text: 'Cập nhật giao diện Gọn: dùng xanh dương làm màu chính và tăng nhẹ bo góc. Giữ phông, cỡ chữ và khoảng cách gọn hiện tại.',
          },
          newTheme: {
            label: 'Giao diện mới',
            text: 'Tạo giao diện Rừng với xanh lá làm màu chính, nền dịu, góc bo vừa và bóng nhẹ.',
          },
        },
      },
    },
  },

  appearance: {
    title: 'Diện mạo',
    mode: 'Chế độ màu',
    preset: 'Giao diện',
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
    themes: { default: 'Rộng rãi', compact: 'Gọn' },
  },
  app: {
    title: 'NocoBase',
  },
  actions: {
    close: 'Đóng',
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    language: 'Ngôn ngữ',
  },
  notices: {
    serverLocaleFallback:
      'Máy chủ không hỗ trợ ngôn ngữ này nên thông báo máy chủ sẽ dùng tiếng Anh.',
    languageChangeFailed: 'Không thể hoàn tất đổi ngôn ngữ. Vui lòng thử lại.',
  },
  account: {
    signOutFailed: 'Không thể đăng xuất. Vui lòng thử lại.',
    openMenu: 'Mở trình đơn tài khoản',
    fallback: 'Tài khoản',
    signOut: 'Đăng xuất',
    signingOut: 'Đang đăng xuất…',
  },
  navigation: {
    home: 'Trang chủ',
    open: 'Mở điều hướng',
    close: 'Đóng điều hướng',
    expand: 'Mở rộng điều hướng',
    collapse: 'Thu gọn điều hướng',
    toggle: 'Mở rộng hoặc thu gọn điều hướng',
    label: 'Điều hướng ứng dụng',
    description: 'Đến một trang của ứng dụng này.',
    breadcrumb: 'Đường dẫn điều hướng',
    breadcrumbMore: 'Hiện các cấp ở giữa',
    back: 'Quay lại',
  },
  dataTable: {
    emptyDescription:
      'Không có bản ghi trong phạm vi hiện tại. Thử phạm vi khác hoặc kiểm tra lại sau.',
    noResults: 'Không có kết quả.',
    sortAscending: 'Tăng dần',
    sortDescending: 'Giảm dần',
    hideColumn: 'Ẩn',
    view: 'Xem',
    toggleColumns: 'Ẩn/hiện cột',
    selectedCount: 'Đã chọn {{selected}} trên {{total}} dòng.',
    rowsPerPage: 'Số dòng mỗi trang',
    pageOf: 'Trang {{page}} trên {{pageCount}}',
    firstPage: 'Đến trang đầu',
    previousPage: 'Đến trang trước',
    nextPage: 'Đến trang tiếp theo',
    lastPage: 'Đến trang cuối',
  },
  datePicker: {
    placeholder: 'Chọn ngày',
    rangePlaceholder: 'Chọn khoảng ngày',
  },
};

/** The shape every locale's system copy follows, derived from the English wording above. */
export type SystemResource = LocaleResource<typeof systemEnUS>;

export default systemEnUS;

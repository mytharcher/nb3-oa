/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: 'Lịch làm việc',
      dictionaries: 'Danh mục',
      rules: 'Tổng quan và lịch sử quy tắc',
      sequences: 'Số chứng từ',
      auditLogs: 'Nhật ký kiểm toán',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'Nền tảng OA',
      calendar: 'Lịch làm việc',
      dictionaries: 'Danh mục',
      rules: 'Tổng quan và lịch sử quy tắc',
      sequences: 'Số chứng từ',
      auditLogs: 'Nhật ký kiểm toán',
      actions: { read: 'Xem', update: 'Chỉnh sửa' },
    },
    common: {
      actions: 'Thao tác',
      actionsFor: 'Thao tác cho {{name}}',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      refresh: 'Làm mới',
      clearFilters: 'Xóa bộ lọc',
      noResults: 'Không có mục khớp bộ lọc.',
      forbidden: 'Bạn không có quyền xem mục này.',
      notFound: 'Bản ghi không tồn tại hoặc đã bị xóa.',
      loadFailed: 'Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.',
      writeForbidden: 'Bạn không có quyền thay đổi.',
      saveFailed: 'Không thể lưu thay đổi. Thử lại.',
    },
    calendar: {
      title: 'Lịch làm việc',
      description: 'Đặt giờ làm việc và quản lý ngày lễ, ngày làm bù từng năm.',
      loadFailedTitle: 'Không thể tải thiết lập lịch',
      kinds: {
        holiday: 'Ngày lễ',
        adjustedWorkday: 'Ngày làm bù',
        workday: 'Ngày làm việc',
        weekend: 'Ngày nghỉ',
      },
      workHours: {
        title: 'Giờ làm việc',
        description:
          'Nhắc và nâng cấp phê duyệt chỉ tính các giờ này vào ngày làm việc.',
        start: 'Bắt đầu lúc',
        end: 'Kết thúc lúc',
        range: '{{start}}–{{end}}',
        invalidTime: 'Nhập giờ như 09:00.',
        endBeforeStart: 'Kết thúc phải sau bắt đầu.',
        scheduled: 'Từ {{date}}: {{start}}–{{end}}',
        saved: 'Đã lưu giờ làm việc',
      },
      timeZone: {
        title: 'Múi giờ',
        description:
          'Múi giờ dùng cho lịch và số chứng từ. Thay đổi áp dụng ngay.',
        label: 'Múi giờ',
        hint: 'Tên múi giờ IANA, ví dụ Asia/Shanghai.',
        required: 'Nhập múi giờ.',
        invalid:
          'Máy chủ không nhận biết múi giờ này. Dùng tên như Asia/Shanghai.',
        saved: 'Đã lưu múi giờ',
      },
      days: {
        remove: 'Gỡ bỏ',
        title: 'Ngày đặc biệt',
        description:
          'Ngày không liệt kê theo lịch tuần: thứ Hai đến thứ Sáu là ngày làm việc.',
        previousYear: 'Năm trước',
        nextYear: 'Năm tiếp theo',
        add: 'Thêm ngày',
        addTitle: 'Thêm ngày',
        addDescription: 'Ngày đã liệt kê sẽ được thay thế.',
        addSubmit: 'Thêm',
        editTitle: 'Chỉnh sửa {{date}}',
        import: 'Nhập',
        date: 'Ngày',
        weekday: 'Ngày trong tuần',
        kind: 'Loại',
        note: 'Ghi chú',
        dateRequired: 'Chọn ngày.',
        noteTooLong: 'Dùng tối đa {{max}} ký tự.',
        emptyTitle: 'Chưa có ngày đặc biệt trong {{year}}',
        emptyDescription:
          'Nhập ngày lễ và ngày làm bù của năm hoặc thêm từng ngày.',
        emptyReadOnly:
          'Mọi ngày theo lịch tuần. Nhờ quản trị viên nhập ngày lễ.',
        saved: 'Đã lưu "{{date}}"',
        removed: 'Đã gỡ "{{date}}"',
        removeTitle: 'Gỡ "{{date}}"?',
        removeDescription: 'Ngày sẽ trở lại theo lịch tuần.',
        notFound: 'Ngày không còn được liệt kê. Có thể đã bị gỡ.',
      },
      import: {
        title: 'Nhập ngày đặc biệt của {{year}}',
        description: 'Dán mỗi dòng một ngày: ngày, loại và ghi chú tùy chọn.',
        lines: 'Số ngày',
        placeholder:
          '{{year}}-10-01,holiday,Quốc khánh\n{{year}}-10-10,adjustedWorkday',
        hint: 'Ngăn cách bằng dấu phẩy hoặc tab. Loại: holiday, adjustedWorkday, workday, weekend (hoặc 休 / 班).',
        replace: 'Thay thế năm',
        replacePreview:
          'Theo lịch hiện tại, {{count}} ngày đặc biệt hiện có trong {{year}} không có trong lần nhập này và sẽ bị gỡ. Người khác có thể thay đổi lịch trước khi bạn lưu.',
        previewFailed:
          'Không thể tải toàn bộ năm lịch. Thử lại trước khi thay thế.',
        confirmReplaceTitle: 'Thay ngày đặc biệt của {{year}}?',
        replaceHint:
          'Gỡ ngày đặc biệt trong {{year}} không có trong danh sách.',
        submit: 'Nhập',
        emptyText: 'Dán ít nhất một ngày.',
        success:
          'Đã nhập: thêm {{created}}, thay đổi {{updated}}, gỡ {{removed}}',
        problems: {
          format: 'Dòng {{line}} cần ngày và loại.',
          date: 'Dòng {{line}} có ngày không hợp lệ.',
          kind: 'Dòng {{line}} có loại không xác định.',
          year: 'Dòng {{line}} không thuộc {{year}}.',
          duplicate: 'Dòng {{line}} lặp ngày.',
        },
      },
    },
    dictionaries: {
      title: 'Danh mục',
      description:
        'Quản lý tùy chọn biểu mẫu yêu cầu. Mục được tắt, không bao giờ xóa.',
      loadFailedTitle: 'Không thể tải danh mục',
      searchPlaceholder: 'Tìm theo tên hoặc mã',
      searchLabel: 'Tìm mục',
      notFound: 'Mục không tồn tại hoặc đã bị gỡ.',
      enable: 'Bật',
      enabled: 'Đã bật "{{name}}"',
      disable: 'Tắt',
      disabled: 'Đã tắt "{{name}}"',
      disableTitle: 'Tắt "{{name}}"?',
      disableDescription:
        'Yêu cầu hiện có vẫn hiển thị mục này, nhưng yêu cầu mới không còn chọn được. Bạn có thể bật lại.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: không giới hạn',
      fields: {
        type: 'Loại danh mục',
        label: 'Tên',
        labelZh: 'Tên (tiếng Trung)',
        labelEn: 'Tên (tiếng Anh)',
        code: 'Mã',
        extra: 'Thuộc tính',
        sortOrder: 'Thứ tự',
        status: 'Trạng thái',
      },
      status: {
        all: 'Tất cả trạng thái',
        active: 'Đang bật',
        inactive: 'Đã vô hiệu hóa',
      },
      empty: {
        title: 'Chưa có mục thuộc loại này',
        description: 'Thêm mục đầu tiên để biểu mẫu có thể cung cấp.',
        readOnly: 'Nhờ quản trị viên thêm mục.',
      },
      create: {
        action: 'Mục mới',
        title: 'Mục mới: {{type}}',
        success: 'Đã tạo mục "{{name}}"',
      },
      edit: { title: 'Chỉnh sửa mục', success: 'Đã lưu mục "{{name}}"' },
      form: {
        description: 'Mục của {{type}}. Đặt tên bằng ít nhất một ngôn ngữ.',
        codeHint:
          'Chữ cái, chữ số, _ và -, bắt đầu bằng chữ cái. Không thể thay đổi về sau.',
        codeFixed: 'Bản ghi lưu mã nên không thể thay đổi.',
        codeInvalid:
          'Dùng chữ cái, chữ số, _ và -, bắt đầu bằng chữ cái (tối đa 64).',
        codeTaken: 'Loại này đã có mục với mã này.',
        labelRequired: 'Nhập tên bằng ít nhất một ngôn ngữ.',
        labelTooLong: 'Dùng tối đa {{max}} ký tự.',
        sortOrderHint: 'Số nhỏ hơn đứng trước trong biểu mẫu.',
        sortOrderInvalid: 'Nhập số nguyên từ 0 đến 1.000.000.',
        numberRequired: 'Nhập số.',
        numberMin: 'Nhập số ít nhất {{min}}.',
        integerMin: 'Nhập số nguyên ít nhất {{min}}.',
        blankUnlimited: 'Để trống nếu không giới hạn.',
        extraInvalid: 'Giá trị không được chấp nhận.',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: 'Công việc đề nghị chi phí',
        officeItem: 'Vật tư văn phòng',
        leaveType: 'Loại nghỉ phép',
        annualLeaveTier: 'Nghỉ phép năm theo thâm niên',
        paymentMethod: 'Phương thức thanh toán',
        expenseCategory: 'Danh mục chi phí',
        budgetSubject: 'Khoản mục ngân sách',
        sealType: 'Loại con dấu',
        contractType: 'Loại hợp đồng',
        assetCategory: 'Danh mục tài sản',
        supplierCategory: 'Danh mục nhà cung cấp',
        vehicleType: 'Loại xe',
        departureType: 'Loại nghỉ việc',
        resignationReason: 'Lý do thôi việc',
        recruitmentReason: 'Lý do tuyển dụng',
        certificateType: 'Loại giấy chứng nhận',
        travelStandard: 'Tiêu chuẩn công tác',
      },
      travelStandardKindHelp:
        'Dùng danh mục tương ứng cho lưu trú và phụ cấp. Danh mục công tác tổng hợp không đại diện cho hai loại này và không có tiêu chuẩn ngày.',
      invalidStandardKind: 'Chọn phân loại tiêu chuẩn công tác hợp lệ.',
      extraOptions: {
        travelStandardKind: {
          none: 'Không áp dụng',
          lodging: 'Lưu trú mỗi đêm',
          allowance: 'Phụ cấp mỗi ngày',
        },
      },
      extra: {
        travelStandardKind: 'Phân loại tiêu chuẩn công tác',
        requiresPrintInfo: 'Cần chi tiết in',
        deductsBalance: 'Khấu trừ số dư',
        requiresAttachment: 'Cần tệp đính kèm',
        attachmentAboveDays: 'Đính kèm khi trên (ngày)',
        maxDays: 'Số ngày tối đa',
        requiresHr: 'Phê duyệt nhân sự',
        minYears: 'Từ số năm thâm niên',
        days: 'Số ngày',
        voluntary: 'Tự nguyện',
        replacement: 'Thay người nghỉ việc',
        involvesSalary: 'Hiển thị lương',
        minRank: 'Từ thứ hạng cấp bậc',
        lodgingPerNight: 'Lưu trú mỗi đêm (nhân dân tệ)',
        allowancePerDay: 'Phụ cấp mỗi ngày (nhân dân tệ)',
      },
    },
    rules: {
      relatedFlows: 'Quy trình liên quan (sửa tại nút)',
      editAtNode: 'Sửa tại nút quy trình',
      title: 'Tổng quan và lịch sử quy tắc',
      description:
        'Xem quy tắc hiện tại, thay đổi đã lên lịch và lịch sử. Mở nút quy trình liên quan để sửa; quy tắc dùng chung ảnh hưởng nhiều quy trình.',
      loadFailedTitle: 'Không thể tải quy tắc phê duyệt',
      notFound: 'Quy tắc không tồn tại.',
      change: 'Thay đổi',
      history: 'Lịch sử',
      changeTitle: 'Thay đổi "{{name}}"',
      changeDescription:
        'Giá trị mới áp dụng cho yêu cầu gửi từ thời điểm có hiệu lực.',
      changed: 'Đã thay đổi "{{name}}"',
      historyTitle: 'Lịch sử của "{{name}}"',
      currentValue: 'Hiện tại: {{value}}',
      scheduledValue: 'Từ {{date}}: {{value}}',
      defaultVersion: 'Mặc định',
      withdraw: 'Rút lại',
      withdrawn: 'Đã rút thay đổi theo lịch của "{{name}}"',
      withdrawTitle: 'Rút thay đổi của "{{name}}" từ {{date}}?',
      withdrawDescription: 'Giá trị theo lịch {{value}} sẽ không có hiệu lực.',
      versionStatus: { current: 'Có hiệu lực', scheduled: 'Đã lên lịch' },
      fields: {
        rule: 'Quy tắc',
        current: 'Giá trị hiện tại',
        scheduled: 'Đã lên lịch',
        newValue: 'Giá trị mới',
        value: 'Giá trị',
        note: 'Ghi chú',
        effectiveFrom: 'Có hiệu lực',
        changedBy: 'Người thay đổi',
      },
      effective: {
        label: 'Có hiệu lực',
        now: 'Ngay lập tức',
        fromDate: 'Từ một ngày',
        dateLabel: 'Ngày có hiệu lực',
        hint: 'Từ 00:00 ngày đó.',
        dateRequired: 'Chọn ngày có hiệu lực.',
        pastError: 'Chọn ngày từ ngày mai trở đi.',
      },
      errors: {
        valueRequired: 'Nhập giá trị.',
        notANumber: 'Nhập số.',
        minimum: 'Nhập ít nhất {{min}}.',
        percentRange: 'Nhập phần trăm từ {{min}} đến {{max}}.',
        integer: 'Nhập số nguyên.',
        halfDays: 'Nhập số ngày theo bước 0,5.',
        noteTooLong: 'Dùng tối đa {{max}} ký tự.',
        invalidValue: 'Giá trị không được chấp nhận.',
        orderViolated:
          'Giá trị không đúng thứ tự với quy tắc liên quan (ví dụ ngưỡng phó tổng giám đốc trên tổng giám đốc). Thay quy tắc liên quan trước.',
        versionExists:
          'Đã có thay đổi có hiệu lực tại thời điểm này. Chọn ngày khác.',
        inEffect: 'Thay đổi đã có hiệu lực và trở thành lịch sử.',
      },
      domains: {
        spend: {
          title: 'Chi tiêu',
          description:
            'Ngưỡng số tiền theo bậc chi tiêu và phê duyệt tiền khác.',
        },
        leave: {
          title: 'Nghỉ phép',
          description: 'Độ dài nghỉ phép cần trưởng phòng hoặc nhân sự.',
        },
        attendance: {
          title: 'Chấm công',
          description: 'Giới hạn làm thêm và bổ sung chấm công.',
        },
        hr: {
          title: 'Nhân sự',
          description: 'Tầng cấp bậc và ngưỡng tăng lương.',
        },
        sla: {
          title: 'Thời gian phê duyệt',
          description: 'Nhắc nhở và nâng cấp tính theo giờ làm việc.',
        },
        committee: {
          title: 'Hội đồng xem xét',
          description: 'Mặc định biểu quyết hội đồng.',
        },
        calendar: {
          title: 'Lịch làm việc',
          description: 'Giờ làm việc và múi giờ.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}} lần',
        integer: '{{value}}',
        days: '{{value}} ngày',
        hours: '{{value}} giờ',
        workingHours: '{{value}} giờ làm việc',
        rank: 'Thứ hạng {{value}}',
      },
      unitSuffix: {
        money: 'nhân dân tệ',
        count: 'lần',
        integer: '',
        days: 'ngày',
        hours: 'giờ',
        workingHours: 'giờ làm việc',
        ratio: '%',
        rank: 'thứ hạng',
      },
      keys: {
        itRepair_morning: {
          label: 'IT repair morning hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_afternoon: {
          label: 'IT repair afternoon hours',
          description:
            'Applies to newly submitted repairs. Windows must be ordered and non-overlapping.',
        },
        itRepair_P1_response: {
          label: 'P1 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P1_resolution: {
          label: 'P1 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_response: {
          label: 'P2 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P2_resolution: {
          label: 'P2 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_response: {
          label: 'P3 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P3_resolution: {
          label: 'P3 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_response: {
          label: 'P4 IT repair response hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        itRepair_P4_resolution: {
          label: 'P4 IT repair resolution hours',
          description:
            'New submissions only, measured using the frozen working calendar.',
        },
        leave_annualAccrualEnabled: {
          label: 'Tự động tích lũy nghỉ phép năm',
          description:
            '0 tắt cấp tự động; 1 bật tích lũy hằng ngày. Điền ngày bắt đầu sự nghiệp của nhân viên trước khi bật.',
        },
        leave_annualCarryExpiryMonth: {
          label: 'Tháng hết hạn phép năm chuyển tiếp',
          description: 'Tháng năm sau mà phép năm chưa dùng hết hạn (1–12).',
        },
        leave_annualCarryExpiryDay: {
          label: 'Ngày hết hạn phép năm chuyển tiếp',
          description:
            'Ngày hợp lệ cuối trong tháng hết hạn (1–31); tháng ngắn hơn dùng ngày cuối tháng.',
        },
        spend_vp: {
          label: 'Ngưỡng phó tổng giám đốc',
          description: 'Số tiền vượt mức này cần phó tổng giám đốc phụ trách.',
        },
        spend_gm: {
          label: 'Ngưỡng tổng giám đốc',
          description: 'Số tiền vượt mức này cần tổng giám đốc.',
        },
        expense_head: {
          label: 'Hoàn chi phí bỏ qua trưởng phòng',
          description:
            'Yêu cầu có tổng không vượt mức này được quản lý trực tiếp duyệt thay.',
        },
        loan_head: {
          label: 'Ngưỡng trưởng phòng cho tạm ứng',
          description: 'Tạm ứng vượt mức này cần trưởng phòng.',
        },
        loan_personalMax: {
          label: 'Hạn mức tạm ứng cá nhân',
          description: 'Số nợ tối đa của một người tại một thời điểm.',
        },
        purchase_quotes: {
          label: 'Cần ba báo giá khi vượt',
          description: 'Mua sắm vượt mức này cần ba báo giá cạnh tranh.',
        },
        contract_gm: {
          label: 'Ngưỡng tổng giám đốc cho hợp đồng',
          description: 'Hợp đồng vượt mức này cần tổng giám đốc.',
        },
        asset_scrapGm: {
          label: 'Ngưỡng loại bỏ tài sản',
          description:
            'Loại bỏ tài sản có nguyên giá vượt mức này cần tổng giám đốc.',
        },
        budget_increaseGm: {
          label: 'Ngưỡng tăng ngân sách',
          description: 'Tăng ngân sách vượt mức này cần tổng giám đốc.',
        },
        leave_head: {
          label: 'Nghỉ phép cần trưởng phòng',
          description: 'Nghỉ ít nhất số ngày này cần trưởng phòng.',
        },
        leave_hr: {
          label: 'Nghỉ phép cần nhân sự',
          description: 'Nghỉ ít nhất số ngày này cần nhân sự.',
        },
        overtime_monthlyHead: {
          label: 'Làm thêm tháng cần trưởng phòng',
          description: 'Làm thêm vượt số giờ này mỗi tháng cần trưởng phòng.',
        },
        attendance_fixPerMonth: {
          label: 'Bổ sung chấm công mỗi tháng',
          description: 'Số lần một người có thể yêu cầu bổ sung mỗi tháng.',
        },
        grade_managerRank: {
          label: 'Thứ hạng cấp quản lý',
          description: 'Cấp bậc từ thứ hạng này được tính là cấp quản lý.',
        },
        grade_directorRank: {
          label: 'Thứ hạng cấp giám đốc',
          description: 'Cấp bậc từ thứ hạng này được tính là cấp giám đốc.',
        },
        raise_vp: {
          label: 'Tăng lương cần phó tổng giám đốc',
          description: 'Mức tăng vượt tỷ lệ này cần phó tổng giám đốc.',
        },
        raise_gm: {
          label: 'Tăng lương cần tổng giám đốc',
          description: 'Mức tăng vượt tỷ lệ này cần tổng giám đốc.',
        },
        sla_remindHours: {
          label: 'Nhắc sau',
          description: 'Nhắc người phê duyệt sau số giờ làm việc này.',
        },
        sla_escalateHours: {
          label: 'Nâng cấp sau',
          description:
            'Nâng cấp đến quản lý của người phê duyệt sau số giờ làm việc này.',
        },
        sla_urgeCooldownHours: {
          label: 'Thời gian chờ đôn đốc',
          description: 'Thời gian người yêu cầu chờ giữa các lần đôn đốc.',
        },
        committee_min: {
          label: 'Phiếu thông qua hội đồng',
          description: 'Số phiếu đồng ý mặc định hội đồng cần.',
        },
        calendar_workHours: {
          label: 'Giờ làm việc',
          description: 'Khung giờ làm việc hằng ngày.',
        },
        calendar_timeZone: {
          label: 'Múi giờ',
          description: 'Múi giờ của lịch.',
        },
      },
    },
    sequences: {
      title: 'Số chứng từ',
      description:
        'Số mỗi tiền tố chứng từ đã cấp theo tháng. Số được cấp khi gửi.',
      loadFailedTitle: 'Không thể tải số chứng từ',
      searchPlaceholder: 'Lọc theo tiền tố, như LV',
      searchLabel: 'Lọc theo tiền tố',
      fields: {
        prefix: 'Tiền tố',
        period: 'Tháng',
        issued: 'Đã cấp phát',
        next: 'Số tiếp theo',
      },
      empty: {
        title: 'Chưa cấp số',
        description: 'Số hiển thị tại đây khi gửi yêu cầu.',
      },
    },
    auditLogs: {
      title: 'Nhật ký kiểm toán',
      description:
        'Bản ghi chỉ đọc về thay đổi nhạy cảm của tổ chức, nhân sự, quy tắc và cấu hình.',
      loadFailedTitle: 'Không thể tải nhật ký kiểm toán',
      system: 'Hệ thống',
      notFound: 'Mục không tồn tại.',
      detailTitle: 'Mục kiểm toán: {{action}}',
      detailTitleLoading: 'Mục kiểm toán',
      changes: 'Nội dung thay đổi',
      noChanges: 'Chưa ghi nhận giá trị.',
      changed: 'Đã thay đổi',
      wholeValue: 'Giá trị',
      fields: {
        at: 'Thời gian',
        actor: 'Bởi',
        action: 'Thao tác',
        targetType: 'Loại đối tượng',
        targetId: 'Đối tượng',
        reason: 'Lý do',
        field: 'Trường',
        before: 'Trước',
        after: 'Sau',
      },
      filters: {
        allTargetTypes: 'Tất cả loại đối tượng',
        allActions: 'Tất cả thao tác',
        actor: 'Bất kỳ ai',
        dateRange: 'Bất kỳ ngày nào',
        presets: 'Khoảng nhanh',
      },
      presets: {
        last7: '7 ngày qua',
        last30: '30 ngày qua',
        thisMonth: 'Tháng này',
        lastMonth: 'Tháng trước',
        last90: '90 ngày qua',
      },
      empty: {
        title: 'Chưa có mục kiểm toán',
        description: 'Thay đổi nhạy cảm được ghi tại đây khi thực hiện.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;

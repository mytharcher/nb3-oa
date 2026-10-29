/**
 * English wording of the `platform` OA module, nested under its own top-level key so modules never collide.
 * `client/locales/en-US.ts` spreads it in; `platform.zh-CN.ts` is checked against this shape.
 */
const platformEnUS = {
  platform: {
    navigation: {
      calendar: '근무 달력',
      dictionaries: '사전',
      rules: '규칙 개요 및 이력',
      sequences: '문서 번호',
      auditLogs: '감사 로그',
    },
    // Titles the server registers in the permission workspace (`server/providers/platform/index.ts`).
    authz: {
      section: 'OA 플랫폼',
      calendar: '근무 달력',
      dictionaries: '사전',
      rules: '규칙 개요 및 이력',
      sequences: '문서 번호',
      auditLogs: '감사 로그',
      actions: { read: '보기', update: '편집' },
    },
    common: {
      actions: '작업',
      actionsFor: '{{name}} 작업',
      edit: '편집',
      delete: '삭제',
      refresh: '새로고침',
      clearFilters: '필터 초기화',
      noResults: '필터와 일치하는 항목이 없습니다.',
      forbidden: '볼 권한이 없습니다.',
      notFound: '레코드가 없거나 삭제되었습니다.',
      loadFailed:
        '데이터를 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.',
      writeForbidden: '변경할 권한이 없습니다.',
      saveFailed: '변경 사항을 저장하지 못했습니다. 다시 시도하세요.',
    },
    calendar: {
      title: '근무 달력',
      description:
        '근무 시간을 설정하고 연도별 공휴일 및 대체 근무일을 관리합니다.',
      loadFailedTitle: '달력 설정을 불러오지 못함',
      kinds: {
        holiday: '공휴일',
        adjustedWorkday: '대체 근무일',
        workday: '근무일',
        weekend: '휴일',
      },
      workHours: {
        title: '근무 시간',
        description: '결재 알림 및 상신은 근무일의 이 시간만 계산합니다.',
        start: '시작 시간',
        end: '종료 시간',
        range: '{{start}}–{{end}}',
        invalidTime: '09:00 같은 시간을 입력하세요.',
        endBeforeStart: '종료는 시작 이후여야 합니다.',
        scheduled: '{{date}}부터: {{start}}–{{end}}',
        saved: '근무 시간을 저장했습니다',
      },
      timeZone: {
        title: '시간대',
        description:
          '달력과 문서 번호에서 사용하는 시간대입니다. 변경은 즉시 적용됩니다.',
        label: '시간대',
        hint: 'Asia/Shanghai 같은 IANA 시간대 이름.',
        required: '시간대를 입력하세요.',
        invalid:
          '서버가 인식하지 못하는 시간대입니다. Asia/Shanghai 같은 이름을 사용하세요.',
        saved: '시간대를 저장했습니다',
      },
      days: {
        remove: '제거',
        title: '특별일',
        description:
          '목록에 없는 날은 월요일~금요일을 근무일로 하는 주간 규칙을 따릅니다.',
        previousYear: '이전 연도',
        nextYear: '다음 연도',
        add: '날짜 추가',
        addTitle: '날짜 추가',
        addDescription: '이미 목록에 있는 날짜는 대체됩니다.',
        addSubmit: '추가',
        editTitle: '{{date}} 편집',
        import: '가져오기',
        date: '날짜',
        weekday: '요일',
        kind: '유형',
        note: '메모',
        dateRequired: '날짜를 선택하세요.',
        noteTooLong: '{{max}}자 이내로 입력하세요.',
        emptyTitle: '{{year}}년 특별일 없음',
        emptyDescription:
          '연간 공휴일과 대체 근무일을 가져오거나 하나씩 추가하세요.',
        emptyReadOnly:
          '모든 날짜는 주간 규칙을 따릅니다. 관리자에게 공휴일 가져오기를 요청하세요.',
        saved: '"{{date}}"을 저장했습니다',
        removed: '"{{date}}"을 제거했습니다',
        removeTitle: '"{{date}}"을 제거하시겠습니까?',
        removeDescription: '날짜가 다시 주간 규칙을 따릅니다.',
        notFound: '목록에 없는 날짜입니다. 제거되었을 수 있습니다.',
      },
      import: {
        title: '{{year}}년 특별일 가져오기',
        description: '줄마다 날짜, 유형 및 선택 메모를 붙여 넣으세요.',
        lines: '일수',
        placeholder:
          '{{year}}-10-01,holiday,국경일\n{{year}}-10-10,adjustedWorkday',
        hint: '쉼표 또는 탭으로 구분하세요. 유형: holiday, adjustedWorkday, workday, weekend(또는 休 / 班).',
        replace: '연도 대체',
        replacePreview:
          '현재 달력 기준 {{year}}년 특별일 {{count}}개가 이번 가져오기에 없어 제거됩니다. 저장 전 다른 사용자가 달력을 변경할 수 있습니다.',
        previewFailed:
          '전체 연간 달력을 불러오지 못했습니다. 대체 전에 재시도하세요.',
        confirmReplaceTitle: '{{year}}년 특별일을 대체하시겠습니까?',
        replaceHint: '목록에 없는 {{year}}년 특별일을 제거합니다.',
        submit: '가져오기',
        emptyText: '날짜를 하나 이상 붙여 넣으세요.',
        success:
          '가져옴: {{created}}개 추가, {{updated}}개 변경, {{removed}}개 제거',
        problems: {
          format: '{{line}}행에 날짜와 유형이 필요합니다.',
          date: '{{line}}행의 날짜가 유효하지 않습니다.',
          kind: '{{line}}행의 유형을 알 수 없습니다.',
          year: '{{line}}행이 {{year}}년에 속하지 않습니다.',
          duplicate: '{{line}}행이 중복 날짜입니다.',
        },
      },
    },
    dictionaries: {
      title: '사전',
      description:
        '신청 양식의 옵션을 관리합니다. 항목은 삭제하지 않고 비활성화합니다.',
      loadFailedTitle: '사전을 불러오지 못함',
      searchPlaceholder: '이름 또는 코드 검색',
      searchLabel: '항목 검색',
      notFound: '항목이 없거나 제거되었습니다.',
      enable: '활성화',
      enabled: '"{{name}}"을 활성화했습니다',
      disable: '비활성화',
      disabled: '"{{name}}"을 비활성화했습니다',
      disableTitle: '"{{name}}"을 비활성화하시겠습니까?',
      disableDescription:
        '기존 신청에는 계속 표시되지만 새 신청에서는 선택할 수 없습니다. 다시 활성화할 수 있습니다.',
      extraValue: '{{name}}: {{value}}',
      extraUnlimited: '{{name}}: 제한 없음',
      fields: {
        type: '사전 유형',
        label: '이름',
        labelZh: '이름(중국어)',
        labelEn: '이름(영어)',
        code: '코드',
        extra: '속성',
        sortOrder: '순서',
        status: '상태',
      },
      status: { all: '모든 상태', active: '활성화됨', inactive: '비활성' },
      empty: {
        title: '이 유형의 항목 없음',
        description: '양식에서 사용할 첫 항목을 추가하세요.',
        readOnly: '관리자에게 항목 추가를 요청하세요.',
      },
      create: {
        action: '새 항목',
        title: '새 항목: {{type}}',
        success: '"{{name}}" 항목을 생성했습니다',
      },
      edit: { title: '항목 편집', success: '"{{name}}" 항목을 저장했습니다' },
      form: {
        description:
          '{{type}} 항목입니다. 하나 이상의 언어로 이름을 지정하세요.',
        codeHint:
          '영문으로 시작하여 영문, 숫자, _ 및 -를 사용하세요. 나중에 변경할 수 없습니다.',
        codeFixed: '레코드에 코드가 저장되므로 변경할 수 없습니다.',
        codeInvalid:
          '영문으로 시작하여 영문, 숫자, _ 및 -를 최대 64자 사용하세요.',
        codeTaken: '이 유형에 동일 코드의 항목이 있습니다.',
        labelRequired: '하나 이상의 언어로 이름을 입력하세요.',
        labelTooLong: '{{max}}자 이내로 입력하세요.',
        sortOrderHint: '양식에서 작은 숫자가 먼저 옵니다.',
        sortOrderInvalid: '0~1,000,000의 정수를 입력하세요.',
        numberRequired: '숫자를 입력하세요.',
        numberMin: '{{min}} 이상의 숫자를 입력하세요.',
        integerMin: '{{min}} 이상의 정수를 입력하세요.',
        blankUnlimited: '제한이 없으면 비워 두세요.',
        extraInvalid: '허용되지 않는 값입니다.',
      },
      types: {
        itRepairCategory: 'IT repair categories',
        expensePlanType: '경비 신청 업무',
        officeItem: '사무용품',
        leaveType: '휴가 유형',
        annualLeaveTier: '근속별 연차',
        paymentMethod: '지급 방식',
        expenseCategory: '경비 분류',
        budgetSubject: '예산 항목',
        sealType: '인감 유형',
        contractType: '계약 유형',
        assetCategory: '자산 분류',
        supplierCategory: '공급업체 분류',
        vehicleType: '차량 유형',
        departureType: '퇴직 유형',
        resignationReason: '사직 사유',
        recruitmentReason: '채용 사유',
        certificateType: '증명서 유형',
        travelStandard: '출장 기준',
      },
      travelStandardKindHelp:
        '숙박과 수당은 해당 분류를 사용하세요. 통합 출장 분류는 둘 중 어느 것도 나타내지 않으며 일별 기준이 없습니다.',
      invalidStandardKind: '올바른 출장 기준 분류를 선택하세요.',
      extraOptions: {
        travelStandardKind: {
          none: '해당 없음',
          lodging: '1박당 숙박',
          allowance: '1일당 수당',
        },
      },
      extra: {
        travelStandardKind: '출장 기준 분류',
        requiresPrintInfo: '인쇄 정보 필요',
        deductsBalance: '잔여일 차감',
        requiresAttachment: '첨부 필요',
        attachmentAboveDays: '첨부 필요 기준 초과(일)',
        maxDays: '최대 일수',
        requiresHr: '인사 결재',
        minYears: '최소 근속 연수',
        days: '일수',
        voluntary: '자발적',
        replacement: '퇴직자 대체',
        involvesSalary: '급여 표시',
        minRank: '최소 직급 순위',
        lodgingPerNight: '1박당 숙박(위안)',
        allowancePerDay: '1일당 수당(위안)',
      },
    },
    rules: {
      relatedFlows: '관련 절차(노드에서 편집)',
      editAtNode: '절차 노드에서 편집',
      title: '규칙 개요 및 이력',
      description:
        '현재 규칙, 예정 변경 및 이력을 확인합니다. 관련 절차 노드를 열어 편집하세요. 공유 규칙은 여러 절차에 영향을 줍니다.',
      loadFailedTitle: '결재 규칙을 불러오지 못함',
      notFound: '규칙이 없습니다.',
      change: '변경',
      history: '이력',
      changeTitle: '"{{name}}" 변경',
      changeDescription: '새 값은 효력 발생 이후 제출한 신청에 적용됩니다.',
      changed: '"{{name}}"을 변경했습니다',
      historyTitle: '"{{name}}"의 이력',
      currentValue: '현재: {{value}}',
      scheduledValue: '{{date}}부터: {{value}}',
      defaultVersion: '기본값',
      withdraw: '철회',
      withdrawn: '"{{name}}"의 예정 변경을 철회했습니다',
      withdrawTitle: '{{date}}부터의 "{{name}}" 변경을 철회하시겠습니까?',
      withdrawDescription: '예정 값 {{value}}은 적용되지 않습니다.',
      versionStatus: { current: '적용 중', scheduled: '예약됨' },
      fields: {
        rule: '규칙',
        current: '현재 값',
        scheduled: '예약됨',
        newValue: '새 값',
        value: '값',
        note: '메모',
        effectiveFrom: '효력 발생',
        changedBy: '변경자',
      },
      effective: {
        label: '효력 발생',
        now: '즉시',
        fromDate: '지정일부터',
        dateLabel: '효력 발생일',
        hint: '해당 날짜 00:00부터.',
        dateRequired: '효력 발생일을 선택하세요.',
        pastError: '내일 이후 날짜를 선택하세요.',
      },
      errors: {
        valueRequired: '값을 입력하세요.',
        notANumber: '숫자를 입력하세요.',
        minimum: '{{min}} 이상을 입력하세요.',
        percentRange: '{{min}}~{{max}}의 비율을 입력하세요.',
        integer: '정수를 입력하세요.',
        halfDays: '0.5일 단위로 입력하세요.',
        noteTooLong: '{{max}}자 이내로 입력하세요.',
        invalidValue: '허용되지 않는 값입니다.',
        orderViolated:
          '관련 규칙과 순서가 맞지 않습니다(예: 부사장 기준이 총괄 책임자 기준보다 큼). 관련 규칙을 먼저 변경하세요.',
        versionExists:
          '해당 시점에 이미 다른 변경이 적용됩니다. 다른 날짜를 선택하세요.',
        inEffect: '이미 적용되어 과거 이력이 된 변경입니다.',
      },
      domains: {
        spend: {
          title: '지출',
          description: '지출 단계 및 기타 금액 결재의 기준입니다.',
        },
        leave: {
          title: '휴가',
          description: '부서장 또는 인사팀이 필요한 휴가 길이입니다.',
        },
        attendance: {
          title: '근태',
          description: '초과 근무 및 근태 정정 한도입니다.',
        },
        hr: {
          title: '인사팀',
          description: '직급 단계 및 급여 인상 기준입니다.',
        },
        sla: {
          title: '결재 시간',
          description: '근무 시간으로 계산하는 알림 및 상신입니다.',
        },
        committee: {
          title: '심사 위원회',
          description: '위원회 투표 기본값입니다.',
        },
        calendar: {
          title: '근무 달력',
          description: '근무 시간 및 시간대입니다.',
        },
      },
      units: {
        money: '¥{{value}}',
        count: '{{value}}회',
        integer: '{{value}}',
        days: '{{value}}일',
        hours: '{{value}}시간',
        workingHours: '{{value}}근무 시간',
        rank: '순위 {{value}}',
      },
      unitSuffix: {
        money: '위안',
        count: '회',
        integer: '',
        days: '일',
        hours: '시간',
        workingHours: '근무 시간',
        ratio: '%',
        rank: '순위',
      },
      keys: {
        itRepair_acceptanceDays: {
          label: 'Acceptance reminder (working days)',
          description:
            'Frozen on submission; never closes a repair automatically.',
        },
        itRepair_followUpDays: {
          label: 'Follow-up interval (working days)',
          description: 'Frozen interval after a waiting reminder.',
        },
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
          label: '연차 자동 적립',
          description:
            '0은 자동 부여 중지, 1은 일별 적립 활성화입니다. 활성화 전에 직원 경력 시작일을 입력하세요.',
        },
        leave_annualCarryExpiryMonth: {
          label: '이월 연차 만료 월',
          description: '미사용 연차가 만료되는 다음 연도의 월(1~12).',
        },
        leave_annualCarryExpiryDay: {
          label: '이월 연차 만료 일',
          description:
            '만료 월의 마지막 유효일(1~31). 짧은 월은 말일을 사용합니다.',
        },
        spend_vp: {
          label: '부사장 기준',
          description: '초과 금액은 담당 부사장이 필요합니다.',
        },
        spend_gm: {
          label: '총괄 책임자 기준',
          description: '초과 금액은 총괄 책임자가 필요합니다.',
        },
        expense_head: {
          label: '부서장 생략 경비 청구',
          description: '이 금액 이하의 청구는 직속 관리자가 대신 승인합니다.',
        },
        loan_head: {
          label: '대출 부서장 기준',
          description: '초과 대출은 부서장이 필요합니다.',
        },
        loan_personalMax: {
          label: '개인 대출 한도',
          description: '한 사람이 한 번에 부담할 수 있는 최대 채무입니다.',
        },
        purchase_quotes: {
          label: '3개 견적 필요 기준',
          description: '초과 구매는 경쟁 견적 3개가 필요합니다.',
        },
        contract_gm: {
          label: '계약 총괄 책임자 기준',
          description: '초과 계약은 총괄 책임자가 필요합니다.',
        },
        asset_scrapGm: {
          label: '자산 폐기 기준',
          description:
            '원가가 이 기준을 초과하는 자산 폐기는 총괄 책임자가 필요합니다.',
        },
        budget_increaseGm: {
          label: '예산 증액 기준',
          description: '초과 예산 증액은 총괄 책임자가 필요합니다.',
        },
        leave_head: {
          label: '부서장이 필요한 휴가',
          description: '이 일수 이상의 휴가는 부서장이 필요합니다.',
        },
        leave_hr: {
          label: '인사팀이 필요한 휴가',
          description: '이 일수 이상의 휴가는 인사팀이 필요합니다.',
        },
        overtime_monthlyHead: {
          label: '부서장이 필요한 월 초과 근무',
          description: '월 초과 근무가 이 시간을 초과하면 부서장이 필요합니다.',
        },
        attendance_fixPerMonth: {
          label: '월 근태 정정 횟수',
          description: '한 사람이 한 달에 신청할 수 있는 정정 횟수입니다.',
        },
        grade_managerRank: {
          label: '관리자 직급 순위',
          description: '이 순위 이상의 직급은 관리자 수준입니다.',
        },
        grade_directorRank: {
          label: '책임자 직급 순위',
          description: '이 순위 이상의 직급은 책임자 수준입니다.',
        },
        raise_vp: {
          label: '부사장이 필요한 급여 인상',
          description: '이 비율 초과 인상은 부사장이 필요합니다.',
        },
        raise_gm: {
          label: '총괄 책임자가 필요한 급여 인상',
          description: '이 비율 초과 인상은 총괄 책임자가 필요합니다.',
        },
        sla_remindHours: {
          label: '알림까지',
          description: '이 근무 시간 후 결재자에게 알립니다.',
        },
        sla_escalateHours: {
          label: '상신까지',
          description: '이 근무 시간 후 결재자의 관리자에게 상신합니다.',
        },
        sla_urgeCooldownHours: {
          label: '독촉 대기 시간',
          description: '신청자가 독촉 사이에 기다려야 하는 시간입니다.',
        },
        committee_min: {
          label: '위원회 통과 표수',
          description: '위원회에 필요한 기본 찬성표 수입니다.',
        },
        calendar_workHours: {
          label: '근무 시간',
          description: '일별 근무 시간대입니다.',
        },
        calendar_timeZone: {
          label: '시간대',
          description: '달력 시간대입니다.',
        },
      },
    },
    sequences: {
      title: '문서 번호',
      description:
        '각 문서 접두사가 월별로 발급한 번호입니다. 번호는 제출 시 발급됩니다.',
      loadFailedTitle: '문서 번호를 불러오지 못함',
      searchPlaceholder: 'LV 같은 접두사로 필터',
      searchLabel: '접두사별 필터',
      fields: {
        prefix: '접두사',
        period: '월',
        issued: '지급됨',
        next: '다음 번호',
      },
      empty: {
        title: '발급된 번호 없음',
        description: '신청이 제출되면 번호가 표시됩니다.',
      },
    },
    auditLogs: {
      title: '감사 로그',
      description:
        '조직, 직원, 규칙 및 설정의 민감한 변경에 대한 읽기 전용 기록입니다.',
      loadFailedTitle: '감사 로그를 불러오지 못함',
      system: '시스템',
      notFound: '항목이 없습니다.',
      detailTitle: '감사 항목: {{action}}',
      detailTitleLoading: '감사 항목',
      changes: '변경 내용',
      noChanges: '기록된 값이 없습니다.',
      changed: '변경됨',
      wholeValue: '값',
      fields: {
        at: '시간',
        actor: '작업자',
        action: '작업',
        targetType: '객체 유형',
        targetId: '객체',
        reason: '사유',
        field: '필드',
        before: '이전',
        after: '이후',
      },
      filters: {
        allTargetTypes: '모든 객체 유형',
        allActions: '모든 작업',
        actor: '누구나',
        dateRange: '모든 날짜',
        presets: '빠른 기간',
      },
      presets: {
        last7: '최근 7일',
        last30: '최근 30일',
        thisMonth: '이번 달',
        lastMonth: '지난달',
        last90: '최근 90일',
      },
      empty: {
        title: '감사 항목 없음',
        description: '민감한 변경이 수행되면 여기에 기록됩니다.',
      },
    },
  },
};

export type PlatformLocale = typeof platformEnUS;

export default platformEnUS;

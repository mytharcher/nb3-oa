export default {
  flowDiagram: {
    escapeHint: 'Esc를 눌러 종료',
    controls: '다이어그램 제어',
    zoomIn: '확대',
    zoomOut: '축소',
    fitView: '화면에 맞춤',
    fullscreen: '전체 화면',
    exitFullscreen: '전체 화면 종료',
    minimap: '미니맵',

    empty: '표시할 상태가 없습니다.',
    loading: '다이어그램 배치 중…',
    failed:
      '다이어그램을 배치할 수 없습니다. 절차 매개변수와 최근 실행을 확인하세요.',
    nodeHelp: '절차 상태입니다. 이동하고 확대하여 탐색하세요.',
    edgeHelp: '절차 전이',
  },
  processManagement: {
    managementReason: '사유',
    normalDescription: '주요 업무 경로를 표시하며 조건에 따라 분기합니다.',
    revealHint:
      '단계 위에 마우스를 올리면 반려 및 다른 종료가 표시됩니다. 종료 위에 올리면 세부 정보가 표시됩니다.',
    graphLegend: '다이어그램 범례',
    otherExits: '기타 종료',
    exitNext: '이후 가능한 작업:',
    exitEnds: '절차가 여기서 종료됩니다.',
    nodeTypes: {
      start: '시작',
      approval: '결재',
      work: '업무 단계',
      success: '완료됨',
      negative: '종료됨',
      exception: '반려 또는 예외',
    },
    rulesCount_one: '규칙 {{count}}개',
    rulesCount_other: '규칙 {{count}}개',
    notReached: '아직 도달하지 않음',
    parameters: {
      title: '워크플로 매개변수',
      description:
        '각 단계에서 읽는 기준입니다. 값은 한 번 설정되며 나열된 모든 단계에 적용됩니다.',
      none: '조정 가능한 매개변수가 없는 절차입니다.',
      onNodes:
        '단계에서 설정하는 절차입니다. 다이어그램 단계의 설정 버튼을 사용하세요.',
      forbidden: '이 절차의 매개변수를 볼 권한이 없습니다.',
      readOnly: '매개변수를 볼 수 있으나 변경할 수 없습니다.',
      changed: '변경됨',
      scheduled: '{{date}}에 {{value}}로 변경됩니다.',
      orderViolated:
        '관련 매개변수의 순서가 맞지 않습니다. 낮은 기준은 높은 기준을 초과할 수 없습니다. 여기서 둘 다 조정하여 함께 저장하세요.',
      discard: '변경 사항 버리기',
      save_zero: '저장',
      save_one: '변경 1개 저장',
      save_other: '변경 {{count}}개 저장',
      saved_one: '매개변수 1개 저장됨',
      saved_other: '매개변수 {{count}}개 저장됨',
    },
    nodeSettings: {
      edit: '매개변수 편집',
      editNamed: '{{name}}의 매개변수 편집',
      title: '{{name}}의 매개변수 편집',
      parameter: '매개변수',
      effect:
        '변경해도 저장된 신청 스냅샷 또는 기존 할 일을 다시 쓰지 않습니다. 새 제출은 유효 설정을 사용하며 재제출은 소유 절차 규칙을 따릅니다.',
      shared: '공유 설정입니다. 추가 영향: {{flows}}.',
      unavailable:
        '이 노드에 편집 가능한 매개변수가 없습니다. 대화 상자를 닫고 설정된 노드를 선택하세요.',
      forbidden: '노드 설정을 편집할 권한이 없습니다.',
      newCommittee: '새 위원회 구조 게시',
      seat: '버전 {{version}} · {{name}} 자리 담당자',
      committeeContext:
        '선택 노드: 버전 {{selected}}. 활성: {{active}}. 최근 저장: {{latest}}.',
    },
    conditionMissing:
      '명시적인 조건 설명이 필요한 분기입니다. 소유 업무 규칙을 확인하세요',
    snapshotConditions:
      '금액, 일수 및 직급 기준은 제출 시 고정된 규칙을 사용합니다. 이 정의는 과거 신청의 스냅샷이 아닌 결정 기준을 설명합니다.',
    branchConditions: {
      travelCancellation_unbooking:
        '원래 출장이 예약을 요청하므로 취소하려면 예약 취소가 필요함',
      travelCancellation_approved:
        '원래 출장이 예약을 요청하지 않아 예약 취소 불필요',
      reimbursement_managerApproved_head:
        '총 정산액 > 고정 부서장 한도이며 관리자/부서장 할 일 병합 검증 미통과',
      reimbursement_managerApproved_finance:
        '총 정산액이 부서장 한도 이하이거나 관리자/부서장 결재 할 일이 유효하게 병합됨',

      training_managerApproved_head:
        '교육 금액 > 0이며 관리자/부서장 결재 할 일이 유효하게 병합되지 않음',
      training_managerApproved_finance:
        '교육 금액 > 0, 관리자와 부서장이 동일인이며 이번 결재 할 일 병합 검증 통과',
      training_managerApproved_approved: '교육 금액이 0',

      travel_managerApproved_head: '관리자/부서장 병합 조건 미충족',
      travel_managerApproved_finance:
        '관리자와 부서장이 동일인이며 이번 결재 할 일 병합 검증 통과',
      probation_managerApproved_head: '관리자/부서장 병합 조건 미충족',
      probation_managerApproved_hr:
        '관리자와 부서장이 동일인이며 이번 결재 할 일 병합 검증 통과',
      departure_managerApproved_head: '관리자/부서장 병합 조건 미충족',
      departure_managerApproved_hr:
        '관리자와 부서장이 동일인이며 이번 결재 할 일 병합 검증 통과',
      expensePlan_financeApproved_executive:
        '담당 임원 승인 필요: 금액 > 제출 시 고정 담당 임원 한도',
      expensePlan_financeApproved_gm:
        '담당 임원 승인 불필요. 금액 > 제출 시 고정 총괄 책임자 한도',
      expensePlan_financeApproved_approved:
        '담당 임원 및 총괄 책임자 추가 승인 조건 모두 해당 없음',
      expensePlan_executiveApproved_gm:
        '총괄 책임자 승인 필요 및 담당 임원/총괄 책임자 할 일 병합 검증 미통과',
      expensePlan_executiveApproved_approved:
        '총괄 책임자 승인 불필요 또는 담당 임원/총괄 책임자 결재 할 일이 유효하게 병합됨',
      loan_financeApproved_executive:
        '담당 임원 승인 필요: 금액 > 제출 시 고정 담당 임원 한도',
      loan_financeApproved_gm:
        '담당 임원 승인 불필요. 금액 > 제출 시 고정 총괄 책임자 한도',
      loan_financeApproved_cashier:
        '담당 임원 및 총괄 책임자 추가 승인 조건 모두 해당 없음',
      loan_executiveApproved_gm:
        '총괄 책임자 승인 필요 및 담당 임원/총괄 책임자 할 일 병합 검증 미통과',
      loan_executiveApproved_cashier:
        '총괄 책임자 승인 불필요 또는 담당 임원/총괄 책임자 결재 할 일이 유효하게 병합됨',
      purchase_financeApproved_executive:
        '담당 임원 승인 필요: 금액 > 제출 시 고정 담당 임원 한도',
      purchase_financeApproved_gm:
        '담당 임원 승인 불필요. 금액 > 제출 시 고정 총괄 책임자 한도',
      purchase_financeApproved_approved:
        '담당 임원 및 총괄 책임자 추가 승인 조건 모두 해당 없음',
      purchase_executiveApproved_gm:
        '총괄 책임자 승인 필요 및 담당 임원/총괄 책임자 할 일 병합 검증 미통과',
      purchase_executiveApproved_approved:
        '총괄 책임자 승인 불필요 또는 담당 임원/총괄 책임자 결재 할 일이 유효하게 병합됨',
      payment_financeApproved_executive:
        '담당 임원 승인 필요: 전체 결재 단계이며 금액 > 제출 시 고정 담당 임원 한도',
      payment_financeApproved_gm:
        '담당 임원 승인 불필요. 금액 > 제출 시 고정 총괄 책임자 한도이며 전체 결재 필요',
      payment_financeApproved_cashier:
        '담당 임원 및 총괄 책임자 추가 승인 조건 모두 해당 없음',
      payment_executiveApproved_gm:
        '총괄 책임자 승인 필요 및 담당 임원/총괄 책임자 할 일 병합 검증 미통과',
      payment_executiveApproved_cashier:
        '총괄 책임자 승인 불필요 또는 담당 임원/총괄 책임자 결재 할 일이 유효하게 병합됨',
      travel_financeApproved_executive:
        '담당 임원 승인 필요: 해외 출장 또는 금액 > 제출 시 고정 담당 임원 한도',
      travel_financeApproved_gm:
        '담당 임원 승인 불필요. 금액 > 제출 시 고정 총괄 책임자 한도',
      travel_financeApproved_booking:
        '추가 담당 임원/총괄 책임자 승인 불필요 및 예약 요청됨',
      travel_financeApproved_completed:
        '추가 담당 임원/총괄 책임자 승인 불필요 및 예약 미요청',
      travel_executiveApproved_gm:
        '총괄 책임자 승인 필요 및 담당 임원/총괄 책임자 할 일 병합 검증 미통과',
      travel_executiveApproved_booking:
        '총괄 책임자 승인 불필요 또는 유효하게 병합됨. 예약 요청됨',
      travel_executiveApproved_completed:
        '총괄 책임자 승인 불필요 또는 유효하게 병합됨. 예약 미요청',
      travel_gmApproved_booking: '예약 요청됨',
      travel_gmApproved_completed: '예약 미요청',
      payment_submit_head:
        '자금 원본 검사에서 추가 결재가 필요한 초과 지급을 포함한 전체 결재 단계 필요',
      payment_submit_finance: '자금 원본 검사에서 전체 결재 단계 불필요',
      budgetAdjustment_cfoApproved_gm:
        '예산 증액 금액이 제출 시 고정 총괄 책임자 한도 초과',
      budgetAdjustment_cfoApproved_approved:
        '예산 증액이 아니거나 고정 총괄 책임자 한도 이하',
      leave_managerApproved_head:
        '일수 ≥ 고정 부서장 한도이며 부서장이 없거나 관리자와 다름',
      leave_managerApproved_hr:
        '부서장 검토 불필요. 휴가 유형에 인사팀이 필요하거나 일수 ≥ 고정 인사팀 한도',
      leave_managerApproved_approved:
        '부서장 검토 불필요, 인사팀 필수 휴가 유형 아님, 일수 < 고정 인사팀 한도',
      leave_headApproved_hr:
        '휴가 유형에 인사팀이 필요하거나 일수 ≥ 고정 인사팀 한도',
      leave_headApproved_approved:
        '인사팀 불필요 휴가 유형이며 일수 < 고정 인사팀 한도',
      overtime_managerApproved_head:
        '월 초과 근무가 고정 부서장 검토 한도를 초과하며 부서장이 없거나 관리자와 다름',
      overtime_managerApproved_hr:
        '부서장 검토 불필요. 초과 근무일 이후 3근무일 초과 제출',
      overtime_managerApproved_approved:
        '부서장 검토 불필요. 3근무일 보고 기간 이내 제출',
      overtime_headApproved_hr: '초과 근무일 이후 3근무일 초과 제출',
      overtime_headApproved_approved: '초과 근무일 이후 3근무일 이내 제출',
      supplies_submit_issuing: '승인 내용을 유지하여 이행 예외에서 재제출',
      supplies_submit_manager:
        '새 신청, 승인 대상 내용 변경 또는 재개 조건 미충족',
      vehicleRequest_submit_dispatch:
        '승인 내용을 유지하여 이행 예외에서 재제출',
      vehicleRequest_submit_head:
        '새 신청, 승인 대상 내용 변경 또는 재개 조건 미충족',
      purchase_submit_purchasing: '승인 내용을 유지하여 이행 예외에서 재제출',
      purchase_submit_head:
        '새 신청, 승인 대상 내용 변경 또는 재개 조건 미충족',
      assetRequest_submit_issuing:
        '승인 내용 유지, 재개 자격 통과 및 폐기 신청 아님으로 이행 예외에서 재제출',
      assetRequest_submit_head:
        '새 신청, 승인 대상 내용 변경 또는 재개 조건 미충족',
      sealRequest_submit_stamping:
        '승인 내용 유지 및 재개 자격 통과로 이행 예외에서 재제출',
      sealRequest_submit_head:
        '새 신청, 승인 대상 내용 변경 또는 재개 조건 미충족',
      purchase_priced_revision:
        '실제 가격 > 원래 견적의 120%. 신청자 확인 및 재제출 필요',
      purchase_priced_finance: '실제 가격 ≤ 원래 견적의 120%',
      purchase_forcedPriced_revision:
        '실제 가격 > 원래 견적의 120%. 신청자 확인 및 재제출 필요',
      purchase_forcedPriced_finance: '실제 가격 ≤ 원래 견적의 120%',
      probation_hrApproved_gm:
        '수습 전환 거절 또는 인사 확정 직급이 고정 관리자 순위 기준 도달',
      probation_hrApproved_approved:
        '수습 전환 거절 아님 및 인사 확정 직급이 관리자 기준 미만',
      departure_hrApproved_gm: '직원 직급 ≥ 제출 시 고정 관리자 순위 기준',
      departure_hrApproved_handover: '직원 직급이 고정 관리자 순위 기준 미만',
      departure_cancellationRejected_gm:
        '취소 거절. 저장된 취소 전 총괄 책임자 상태 재개',
      departure_cancellationRejected_handover:
        '취소 거절. 저장된 취소 전 인수인계 상태 재개',
      departure_cancellationRejected_completed:
        '취소 거절. 저장된 취소 전 완료 상태 재개',
      recruitment_submit_head: '신청자가 부서장이 아니거나 부서장 없음',
      recruitment_submit_hrbp: '신청자가 부서장임. 자기 승인 생략',
      recruitment_reviewEdit_head: '신청자가 부서장이 아니거나 부서장 없음',
      recruitment_reviewEdit_hrbp: '신청자가 부서장임. 자기 승인 생략',
      recruitment_hrDirectorApproved_executive: '추가 정원을 사용하는 신청',
      recruitment_hrDirectorApproved_gm:
        '추가 정원 아님. 대상 직급이 고정 책임자 순위 기준 도달',
      recruitment_hrDirectorApproved_approved:
        '추가 정원 아님. 대상 직급이 책임자 순위 기준 미만',
      recruitment_executiveApproved_gm:
        '추가 정원 또는 대상 직급이 책임자 기준 도달',
      recruitment_executiveApproved_approved:
        '추가 정원 아님 및 대상 직급이 책임자 기준 미만',
      transfer_submit_manager:
        '제출자가 직원 관리자가 아님. 관리자가 없어도 관리자 검토로 진입',
      transfer_submit_sourceHead: '제출자가 직원 관리자임',
      transfer_reviewEdit_manager:
        '제출자가 직원 관리자가 아님. 관리자가 없어도 관리자 검토로 진입',
      transfer_reviewEdit_sourceHead: '제출자가 직원 관리자임',
      transfer_sourceHeadApproved_targetHead: '부서 전보를 포함한 변경',
      transfer_sourceHeadApproved_hr: '부서 전보를 포함하지 않은 변경',
      transfer_hrApproved_executive:
        '급여 인상이 고정 담당 임원 기준 초과 또는 대상 직급이 관리자 순위 도달',
      transfer_hrApproved_gm:
        '담당 임원 검토 없음. 인상이 고정 총괄 책임자 기준 초과 또는 대상 직급이 책임자 순위 도달',
      transfer_hrApproved_pendingEffective:
        '추가 담당 임원/총괄 책임자 검토의 급여 또는 직급 조건에 해당 없음',
      transfer_executiveApproved_gm:
        '인상이 고정 총괄 책임자 기준 초과 또는 대상 직급이 책임자 순위 도달',
      transfer_executiveApproved_pendingEffective:
        '추가 총괄 책임자 검토의 급여 및 직급 조건에 해당 없음',
      assetRequest_headApproved_appraisal: '자산 폐기 신청',
      assetRequest_headApproved_issuing: '자산 폐기 신청 아님',
      assetRequest_financeApproved_gm:
        '폐기 신청. 자산 원가 합계가 고정 폐기 총괄 책임자 한도 초과',
      assetRequest_financeApproved_scrapped: '폐기 원가 총괄 책임자 기준 이하',
      assetRequest_issueCompleted_returning:
        '대여 신청: 지급 후 반납 처리 진입',
      assetRequest_issueCompleted_issued: '대여 신청 아님',
      sealRequest_stamped_returning: '외부 인감 대여로 반납 처리 필요',
      sealRequest_stamped_completed: '외부 인감 사용 아님',
      vendorQualification_submit_removalReview:
        '공급업체를 디렉터리에서 제거하는 작업',
      vendorQualification_submit_purchasing: '공급업체 제거 작업 아님',
      contract_headApproved_legalFinance: '계약 해지 또는 비표준 템플릿',
      contract_headApproved_standardFinance: '해지 아님 및 표준 템플릿 사용',
      contract_legalFinanceApproved_executive:
        '계약 금액이 고정 담당 임원 한도 초과. 해지 아님',
      contract_legalFinanceApproved_gm:
        '담당 임원 검토 없음. 금액이 고정 계약 총괄 책임자 한도 초과 또는 법무/재무가 비표준으로 표시. 해지 아님',
      contract_legalFinanceApproved_approved: '해지 또는 추가 승인 조건 없음',
      contract_standardFinanceApproved_executive:
        '계약 금액이 고정 담당 임원 한도 초과',
      contract_standardFinanceApproved_gm:
        '담당 임원 검토 없음. 금액이 고정 계약 총괄 책임자 한도 초과',
      contract_standardFinanceApproved_approved:
        '담당 임원 및 계약 총괄 책임자 한도 모두 이하',
      contract_executiveApproved_gm:
        '금액이 고정 계약 총괄 책임자 한도 초과 또는 비표준 계약',
      contract_executiveApproved_approved:
        '금액이 계약 총괄 책임자 한도 이하 및 표준 계약',
      committeeVersion: '제출 시 고정 버전과 일치하는 위원회 그룹 사용',
      returnApplicant: '반려 결정으로 신청자 수정 및 재제출 선택',
      returnEarlier: '반려 결정으로 이전에 진입한 앞 결재 단계 선택',
      seal_legal: '부서장 검토 후: 계약 인감 또는 연결 계약',
      seal_financeManager:
        '부서장/법무 검토에서: 계약 경로 우선순위 다음 재무 인감',
      seal_gm:
        '법무/재무 분기 없음. 대표자 인감 또는 외부 사용이며 현재 검토자가 총괄 책임자 아님',
      seal_stamping:
        '법무/재무 분기 및 추가 총괄 책임자 검토 없음 또는 현재 검토자가 총괄 책임자',
    },

    conditional: '업무 조건 적용',
    transitionUnknown: '작업: {{name}}',
    transitionNames: {
      edit: '내용 편집',
      submit: '제출',
      approved: '결재 통과',
      rejected: '거절',
      returned: '수정 반려',
      withdraw: '철회',
      terminate: '종료',
      booked: '예약 완료',
      bookingFailed: '예약 실패',
      bookingForced: '완료 확인',
      retryBooking: '예약 재시도',
      reviseTrip: '출장 수정',
      cancelApproved: '취소 승인됨',
      issued: '지급 완료',
      unavailable: '사용 불가 / 이행 실패',
      forceClosed: '강제 종료',
    },

    place: '빈 자리',
    placeNumber: '빈 자리 {{number}}',
    placeRequired: '빈 자리를 선택하세요.',
    title: '절차 관리',
    description: '권한이 있는 절차 정의, 실행 및 결재 이력 보기',
    definitions: '정의',
    executions: '실행',
    refresh: '새로고침',
    search: '번호, 절차 또는 신청자 검색',
    definitionSearch: '절차 이름 검색',
    clear: '필터 초기화',
    all: '전체',
    name: '이름',
    domain: '업무 영역',
    category: '분류',
    capabilities: '관리 기능',
    approval: '결재 절차',
    connected: '연결됨',
    readOnly: '읽기 전용',
    notConnected: '관리 작업이 아직 연결되지 않음',
    reference: '번호 / 제목',
    applicant: '신청자',
    status: '상태',
    stage: '현재 단계',
    createdAt: '시작됨',
    endedAt: '종료됨',
    empty: '실행 없음',
    emptyDescription: '연결된 절차가 시작되면 실행이 표시됩니다',
    noDefinitions: '읽을 수 있는 정의 없음',
    noDefinitionsDescription: '관리자에게 정의 접근 설정을 요청하세요',
    noResults: '일치하는 레코드 없음',
    noResultsDescription: '필터를 조정하거나 지워 레코드를 찾으세요',
    definitionGraph: '현재 정의',
    graphDescription:
      '현재 등록된 상태 및 전이입니다. 업무 규칙이 동적 분기를 결정합니다',
    currentNode: '현재 상태',
    visitedNode: '방문함',
    unvisitedNode: '방문하지 않음',
    executionHistory: '실행 이력',
    terminationOutcome: '종료 결과',
    actualPath: '실제 실행 경로',
    actualDescription:
      '방문한 노드, 전이 및 현재 상태를 강조한 전체 결재 및 이행 흐름입니다. 실제 반려 및 과거 경로도 표시됩니다.',
    tasks: '할 일 및 결재 이력',
    timeline: '결재 및 관리 이력',
    run: '결재 실행',
    historical: '실행 이력',
    definitionMissing: '과거 정의 확인 불가',
    commentsRestricted:
      '의견에 비공개 내용이 있을 수 있어 별도 업무 접근이 필요합니다',
    comment: '의견 / 사유',
    actor: '작업자',
    assignee: '담당자',
    answer: '판정',
    previousTask: '이전 할 일',
    from: '출발',
    to: '대상',
    initial: '초기',
    final: '최종',
    transitions: '상태 전이',
    definitionDetails: '단계 및 전이',
    viewExecutions: '모든 레코드 보기',
    back: '뒤로',
    manage: '관리 작업',
    appoint: '할당',
    reassign: '재할당',
    terminate: '종료',
    unavailable: '현재 할 일 또는 업무 상태가 이 작업을 허용하지 않습니다',
    person: '수신자',
    reason: '사유',
    personRequired: '수신자 선택',
    reasonRequired: '사유 입력',
    cancel: '취소',
    retry: '다시 시도',
    loadFailed: '불러오기 실패. 다시 시도하세요',
    submitFailed: '작업 실패. 검토 후 다시 시도하세요',
    unknown: '결과 불명. 새로고침하여 확인하세요',
    stale: '할 일이 변경되었습니다. 새로고침 후 검토하세요',
    gone: '레코드가 없거나 현재 범위 밖입니다',
    forbidden: '섹션을 읽을 수 없습니다. 관리자에게 문의하세요',
    loading: '로딩 중',
    noPeople: '현재 할 일의 적격 수신자 없음',
    peopleSearch: '권한이 있는 수신자 검색',
    loadMore: '더 불러오기',
    reassignTitle: '"{{recordLabel}}"의 할 일 재할당',
    appointTitle: '"{{recordLabel}}"의 할 일 할당',
    terminateTitle: '"{{recordLabel}}" 신청 종료',
    reassigned: '"{{recordLabel}}"의 할 일을 재할당했습니다',
    appointed: '"{{recordLabel}}"의 할 일을 할당했습니다',
    terminated: '"{{recordLabel}}" 신청을 종료했습니다',
    recentDescription:
      '권한이 있는 최근 실행 5개입니다. 전체 이력은 실행 목록을 여세요.',
    vehicleTerminationGuard:
      '배차된 신청은 직접 종료할 수 없습니다. 실제 신청자가 사용을 등록하고 차량 업무 절차를 따라야 합니다.',
    terminationConsequences: {
      vehicle: '배차 전 신청을 종료합니다. 배차된 신청은 종료할 수 없습니다.',
      leave:
        '현재 결재를 종료합니다. 휴가 서비스가 미결 한도 예약을 처리합니다.',
      funding:
        '현재 결재를 종료합니다. 업무 서비스가 미결 예산, 자금 또는 신청 예약을 처리합니다. 정산 지급은 유지됩니다.',
      stock:
        '현재 결재를 종료합니다. 비품 서비스가 미결 재고 예약을 처리합니다. 실물 반납은 업무 절차가 필요합니다.',
      ordinary:
        '현재 결재를 종료하고 업무 종료 보호 검사 및 종료 처리를 수행합니다.',
    },
    terminationDescription:
      '종료 시 현재 할 일을 닫고 업무 규칙에 따라 예약을 해제하며 모든 이력을 유지합니다. 실행된 업무 사실은 별도 취소 또는 보관 정리가 필요합니다.',
    graphView: '다이어그램',
    dateRange: '시작일',
    last7: '최근 7일',
    last30: '최근 30일',
    last90: '최근 90일',
    thisMonth: '이번 달',
    lastMonth: '지난달',
    safeHistory: '권한이 있는 안전한 절차 정보만 포함하는 화면입니다',
    business: '업무 내용',
    businessRestricted:
      '업무 내용, 첨부 및 비공개 필드는 별도 접근이 필요합니다',
    guardedBranch: '원본 업무 조건에 따라 선택된 분기',
    frozen: '고정 필드',
    covered: '대상 필드',
    management: '관리자 개입',
    kinds: {
      leave: '휴가',
      overtime: '초과 근무',
      leaveCancellation: '휴가 취소',
      general: '일반 신청',
      attendanceChange: '근태 정정',
      outing: '외출',
      supplies: '비품 신청',
      budgetAdjustment: '예산 조정',
      expensePlan: '경비 승인',
      training: '교육',
      travel: '출장',
      travelCancellation: '출장 취소',
      reimbursement: '경비 정산',
      purchase: '구매',
      loan: '대출 신청',
      payment: '지급 신청',
      probation: '수습 심사',
      vehicleRequest: '차량 신청',
      contract: '계약',
      assetRequest: '자산 신청',
      vendorQualification: '공급업체 자격',
      recruitment: '채용',
      sealRequest: '인감 신청',
      transfer: '인사 변경',
      departure: '퇴직',
      certificateRequest: '증명서 신청',
    },
    domains: {
      office: '일상 업무',
      organization: '조직 및 인사',
      finance: '재무 및 경비',
      procurement: '구매 및 계약',
      administration: '행정 및 자산',
    },
    states: {
      issued: '지급됨',
      forcedClosed: '강제 종료됨',
      draft: '초안',
      revision: '개정본',
      manager: '관리자',
      head: '부서장',
      hr: '인사팀',
      extra: '추가 검토',
      finance: '재무팀',
      cashier: '출납 담당자',
      executive: '담당 임원',
      gm: '총괄 책임자',
      cfo: '재무 책임자',
      legal: '법무',
      financeManager: '재무 관리자',
      hrbp: '인사 비즈니스 파트너',
      hrDirector: '인사 책임자',
      approved: '승인됨',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
      completed: '완료됨',
      exception: '처리 예외',
      dispatch: '배차',
      usage: '차량 사용',
      issuing: '지급 중',
      returning: '반납 중',
      returnException: '반납 예외',
      stamping: '날인 중',
      booking: '예약 중',
      unbooking: '예약 취소',
      paid: '지급됨',
      paymentException: '지급 예외',
      pendingEffective: '효력 발생일 대기',
      cancellationReview: '취소 검토',
      sourceHead: '원래 부서장',
      targetHead: '대상 부서장',
      committee: '위원회',
      purchasing: '구매',
      inquiry: '문의',
      quoting: '견적',
      pending: '대기 중',
      claimed: '맡겨짐',
      waiting: '대기 중',
      blocked: '차단됨',
      candidate: '후보',
      suspended: '중단됨',
      transferred: '이관됨',
      voided: '종료됨',
      open: '열기',
      cancelled: '취소됨',
      returned: '반납됨',
      concluded: '종결됨',
      decide: '판정',
      copy: '참조',
      approve: '승인',
      reject: '거절',
      return: '반려',
      unknown: '기타 상태',
    },
    authz: {
      definitionRead: '정의',
      historyRead: '실행 이력',
      appoint: '할당',
      reassign: '재할당',
      terminate: '종료',
    },
    otherStage: '기타 단계({{name}})',
    otherEvent: '절차 이벤트({{name}})',
    events: {
      approve: '승인됨',
      reject: '거절됨',
      return: '반납됨',
      reassign: '관리자 재할당',
      appoint: '관리자 할당',
      comment: '의견',
      transfer: '이관됨',
      addSign: '결재자 추가됨',
      claim: '맡겨짐',
      release: '할 일 해제됨',
      'stage.unassigned': '미할당 단계',
      'run.started': '결재 시작됨',
      'run.ended': '결재 종료됨',
      'stage.entered': '단계 진입함',
      remind: '알림',
      escalate: '상신됨',
      read: '읽기',
    },
  },
};

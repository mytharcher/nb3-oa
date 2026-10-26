export default {
  supplies: {
    namedRowActions: '{{name}} 작업',

    businessErrors: {
      SUPPLY_REQUIRED_FIELDS: '물품을 하나 이상 추가하고 목적을 입력하세요.',
      SUPPLY_ITEM_UNAVAILABLE:
        '선택 물품을 사용할 수 없습니다. 활성 물품을 다시 선택하세요.',
      SUPPLY_CONTENT_CHANGED:
        '승인 물품이 변경되었습니다. 지급 기록 전에 신청을 새로고침하세요.',
    },

    rowActions: '작업 기록',
    number: '청구 번호',
    unknownEdit:
      '저장 결과가 불확실합니다. 다시 편집하기 전에 최신 신청을 불러오세요.',
    emptyCatalog: '설정된 활성 사무 물품이 없습니다. 행정팀에 문의하세요.',
    ledgerDetail: '지급 기록',
    ledgerDescription:
      '기록된 수량 및 관리자 종료입니다. 미확인 수량은 전달을 증명하지 않습니다.',
    entryMissing: '지급 기록을 사용할 수 없습니다.',
    authz: {
      resource: '비품 청구',
      ledger: '비품 지급 원장 읽기',
    },
    navigation: '비품 원장',
    new: '새 비품 청구',
    edit: '비품 청구 편집',
    formDescription:
      '물품과 수량을 선택하세요. 관리자가 승인한 후 행정팀이 지급합니다.',
    purpose: '목적',
    item: '물품',
    items: '신청 물품',
    quantity: '수량',
    quantityValue: '수량: {{quantity}}',
    chooseItem: '물품 선택',
    line: '항목 {{number}}',
    remove: '물품 {{number}} 제거',
    addItem: '항목 추가',
    quantityInvalid: '1~100,000의 정수 수량을 입력하세요.',
    duplicate: '각 물품은 한 번만 선택하세요.',
    emailInvalid: '올바른 이메일 주소를 입력하세요.',
    printRequired: '필수 명함 인쇄 정보를 완성하세요.',
    print: {
      name: '이름',
      title: '직책',
      phone: '전화',
      email: '이메일',
      address: '주소',
      department: '부서(선택)',
    },
    approvedAt: '관리자 승인 시간',
    issuingStage: '행정 지급',
    resubmitHint:
      '물품과 목적을 유지하여 재제출하면 행정팀으로 돌아갑니다. 변경하면 관리자 재승인이 필요합니다. 이전 승인은 이력에 유지됩니다.',
    forcedHint:
      '결재 관리자가 실물 지급을 확인하지 않고 신청을 종료했습니다. 실제 수량은 미확인입니다.',
    uncertainCreate:
      '저장 결과가 불확실합니다. 새 초안 생성 전에 닫고 내 신청을 확인하세요.',
    invalid: '목적, 물품 선택 및 정수 수량을 확인하세요.',
    itemUnavailable:
      '물품이 비활성이거나 없습니다. 변경 내용을 제출하기 전에 새로고침하세요.',
    inactive: '활성 직원 인사 기록이 필요합니다.',
    configuration:
      '결재를 제출할 수 없습니다. 관리자에게 결재 기한 확인을 요청하세요.',
    contentChanged: '승인 신청과 내용이 다릅니다. 최신 버전을 불러오세요.',
    reasonRequired: '사유를 입력하세요.',
    actions: {
      claim: '지급 맡기',
      release: '맡기 해제',
      assign: '처리자 할당',
      complete: '발급 확인',
      unable: '발급 불가',
      forceComplete: '강제 종료',
    },
    actionHints: {
      complete:
        '신청한 모든 물품을 전체 수량으로 실제 지급했음을 확인하세요. 지급 원장에 기록됩니다.',
      unable:
        '재고 부족 또는 지급 불가 사유를 설명하세요. 관리자 승인은 유지됩니다.',
      release: '다른 행정 처리자가 맡을 수 있도록 해제합니다.',
      forceComplete:
        '전달 확인 없이 관리자 결정으로 종료합니다. 실제 수량은 미확인으로 기록되며 사유가 필요합니다.',
    },
    states: {
      issuing: '지급 대기',
      exception: '발급 예외',
      issued: '지급됨',
      forcedClosed: '관리자가 종료함',
    },
    ledgerTitle: '비품 지급 원장',
    requestedQuantity: '신청 수량',
    actualQuantity: '실제 수량',
    outcome: '결과',
    recipient: '수신자',
    issuer: '처리자',
    unconfirmed: '확인되지 않음',
    reason: '사유',
    emptyLedger: '지급 기록 없음',
    viewRequest: '청구 보기',
  },
};

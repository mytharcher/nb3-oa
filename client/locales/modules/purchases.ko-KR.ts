export default {
  purchases: {
    businessErrors: {
      PURCHASE_INVALID_ITEMS:
        '각 구매 항목에 이름, 단위 및 양수 수량이 필요합니다. 중복 항목을 확인하세요.',
      PURCHASE_INVALID_DATE: '올바른 예상 수령일을 선택하세요.',
      PURCHASE_INVALID_PRICE:
        '양수 실제 가격, 공급업체 및 해당 견적 증빙을 입력하세요.',
      PURCHASE_INVALID_QUOTES:
        '동일한 견적 파일을 다른 공급업체에 재사용할 수 없습니다. 별도 증빙을 선택하세요.',
      PURCHASE_QUOTES_REQUIRED:
        '이 금액은 서로 다른 공급업체 3개의 첨부 견적이 필요합니다.',
      PURCHASE_PRICE_CONFIRMATION_REQUIRED:
        '재제출 전에 예상 예산을 확정 견적 가격으로 수정하세요.',
      PURCHASE_INVALID_INPUT: '구매 항목, 목적 및 양수 예상 금액을 입력하세요.',
      PURCHASE_DEPARTMENT_REQUIRED:
        '신청자에게 활성 기본 부서가 필요합니다. 인사팀에 직원 레코드 업데이트를 요청하세요.',
      INVALID_RECEIPT: '실제 수령일과 수령 확인 사유를 입력하세요.',
    },

    discardThenNavigate:
      '저장하지 않은 변경 사항을 버리시겠습니까? 확인 후 이동할 대상을 다시 선택하세요.',
    localInputsRetained:
      '최신 버전을 불러왔습니다. 입력은 유지됩니다. 다시 저장하기 전에 검토하세요.',
    chooseForceMode: '처리 방식 선택',
    confirmForceClose: '{{name}} 구매를 종료하시겠습니까?',
    confirmPricing: '{{name}} 견적을 확인하시겠습니까?',
    confirmCancelOrder: '{{name}} 주문을 취소하시겠습니까?',
    priceWillReturn:
      '가격이 예상보다 20% 초과합니다. 재무 검토 전에 신청자에게 확인 반려합니다.',
    pricingSubmitConsequence:
      '제출하면 다음 결재 단계의 견적이 고정되며 예산 보류가 조정됩니다.',

    new: '새 구매',
    edit: '구매 편집',
    saved: '구매 저장됨',
    formDescription:
      '물품, 목적 및 예상액을 입력하세요. 제출 시 회사 달력의 현재 연도에 기본 부서 예산을 예약합니다.',
    primaryDepartment: '기본 부서: {{department}}',
    yearHint: '제출 연도는 회사 달력({{timeZone}})을 따릅니다.',
    departmentMissing: '기본 부서 없음',
    department: '부서',
    departmentPending: '제출 시 결정',
    departmentUnavailable: '부서 사용 불가',
    budgetYear: '예산 연도',
    purpose: '목적',
    subject: '예산 항목',
    selectSubject: '예산 항목 선택',
    estimated: '예상 금액',
    actual: '실제 가격',
    actualAmount: '실제 가격(위안)',
    yuan: '위안',
    expectedDate: '예상 납품일',
    suggestedVendor: '추천 공급업체',
    selectedVendor: '선택한 공급업체',
    vendor: '공급업체',
    vendorUnavailable: '공급업체 사용 불가',
    noSuggestedVendor: '추천 공급업체 없음',
    vendorInactive: '활성 공급업체 선택',
    subjectInactive: '활성 예산 항목 선택',
    disabled: '비활성',
    inactive: '비활성',
    fieldInvalid: '이 필드를 확인하세요',
    amountInvalid: '소수 둘째 자리까지의 양수 금액 입력',
    amountHint: '소수 둘째 자리까지 사용하세요.',
    dateInvalid: '올바른 날짜 선택',
    items: '구매 항목',
    itemName: '품명',
    itemNumber: '항목 {{number}}',
    specification: '규격',
    quantity: '수량',
    unit: '단위',
    quantityInvalid: '양수 수량 입력. 소수 지원',
    quantityHint: '1.5kg 등 소수 수량을 지원합니다.',
    addItem: '항목 추가',
    removeItem: '항목 제거',
    reserveHint: '초안은 예산을 예약하지 않습니다. 제출하면 보류가 생성됩니다.',
    loadLatest: '최신 신청 불러오기',
    unknownCreate:
      '저장 결과가 불확실하여 추가 생성이 차단됩니다. 할 일 센터에서 초안을 확인하세요.',
    unknownEdit:
      '저장 결과가 불확실합니다. 계속하기 전에 최신 신청을 불러오세요.',
    unknownPricing:
      '결과가 불확실하여 양식이 잠겼습니다. 재시도 시 동일한 페이로드와 요청 ID를 보냅니다.',
    quotes: '견적 증빙',
    quoteEvidence: '공급업체 견적 증빙',
    quoteEvidenceDescription:
      '공급업체별 증빙을 업로드하세요. 요건이 같으면 기존 증빙을 재사용할 수 있습니다. 고정 견적 기준을 초과하면 서로 다른 공급업체 3개의 증빙이 필요합니다.',
    addQuote: '공급업체 견적 추가',
    removeQuote: '견적 선택 제거',
    threeQuotesRequired:
      '견적 기준 초과 시 서로 다른 공급업체 3개의 견적 첨부를 제공하세요.',
    selectExistingQuote: '기존 견적 선택: {{filename}}',
    refreshQuotes: '기존 견적 새로고침',
    completePricing: '가격 책정 완료',
    forcePricing: '관리자 구매 작업',
    forceMode: '작업 방식',
    forcePriced: '전체 결과를 재무 결재에 제출',
    forceClose: '주문 없이 강제 종료',
    forceCloseDescription:
      '강제 종료하면 예산 보류를 해제하고 관리자 사유를 기록합니다. 구매 또는 수령 완료를 선언하지 않으며 주문도 생성하지 않습니다.',
    priceConfirmationDescription:
      '예상의 120% 초과 가격은 신청자 확인을 위해 반려합니다. 나머지 결과는 재무 결재로 진입합니다.',
    confirmPriceHint:
      '가격이 예상의 120%를 초과합니다. 검토하고 재제출하여 확인하세요.',
    handler: '구매 처리자',
    forcedClosedHint:
      '관리자가 강제 종료한 신청입니다. 보류는 해제되었으며 주문 또는 수령이 생성되지 않았습니다.',
    actualHold: '현재 예산 보류',
    holdHint:
      '승인 후에도 예산 보류를 유지합니다. 신청자가 수령을 확인하면 예산을 정산합니다.',
    order: '구매 주문',
    orderHint:
      '주문은 승인 가격, 공급업체 및 항목을 고정합니다. 수령과 지급은 별도로 추적합니다.',
    openOrder: '주문 열기',
    mergedTitle: '인접 결재 병합됨',
    merged: '{{name}}이 직접 인접 단계를 완료하여 동일인 결재를 병합했습니다.',
    authz: {
      orderScope: '이 사용자가 읽을 수 있는 구매의 주문',
      resource: '구매',
      submit: '구매 제출',
      view: '구매 보기',
      orders: '구매 주문 보기',
      accept: '수신 확인',
    },
    errors: {
      insufficient: '가용 예산이 부족합니다. 예산 담당자에게 문의하세요.',
      inactive: '비활성 신청자입니다.',
      configuration: '지원하지 않는 결재 설정입니다. 관리자에게 문의하세요.',
      invalid: '강조된 필드를 확인하세요.',
    },
    states: {
      draft: '초안',
      revision: '개정본',
      head: '부서 결재',
      purchasing: '구매 처리',
      exception: '구매 예외',
      finance: '재무 결재',
      executive: '담당 임원 결재',
      gm: '총괄 책임자 결재',
      approved: '승인됨',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
      forcedClosed: '강제 종료됨',
    },
    stages: {
      draft: '초안',
      revision: '개정본',
      head: '부서 결재',
      purchasing: '구매 처리',
      exception: '구매 예외',
      finance: '재무 결재',
      executive: '담당 임원 결재',
      gm: '총괄 책임자 결재',
      approved: '승인됨',
      rejected: '거절됨',
      withdrawn: '철회됨',
      terminated: '종료됨',
      forcedClosed: '강제 종료됨',
    },
    actions: {
      claim: '맡기',
      release: '맡기 해제',
      complete: '가격 책정 완료',
      unable: '구매 불가',
      forceComplete: '관리자 작업',
      cc: '참조',
    },
    ledgerTitle: '구매 주문 원장',
    ledgerDescription:
      '승인된 구매 주문, 수령 상태 및 지급 레코드를 확인합니다. 수령은 예산을 정산하며 지급은 별도로 기록합니다.',
    orderNumber: '주문 번호',
    emptyOrders: '내 범위에 구매 주문 없음',
    pendingPayments: '대기 지급액(위안)',
    paidPayments: '지급액(위안)',
    receiptDate: '수령일',
    acceptedBy: '수령 확인자',
    receiptReason: '수령 메모',
    confirmReceipt: '수신 확인',
    cancelOrder: '주문 취소',
    orderSaved: '주문 업데이트됨',
    unknownOrderAction:
      '결과가 불확실합니다. 양식은 잠기며 재시도 시 동일한 페이로드와 요청 ID를 보냅니다.',
    receiptSettlementHint:
      '확인하면 주문 예산 보류를 정산합니다. 공급업체 지급을 뜻하지 않습니다. 확정 수령은 변경할 수 없습니다.',
    cancelOrderHint:
      '결재 관리자만 미수령이며 대기 또는 지급 금액이 없는 주문을 취소할 수 있습니다. 취소 시 예산 보류를 해제하고 사유를 기록합니다.',
    orderStates: {
      awaitingReceipt: '수령 대기',
      accepted: '받음',
      cancelled: '취소됨',
    },
    actionTitle: '“{{name}}” 구매 {{action}}',
    completed: '“{{name}}” 구매의 {{action}}을 완료했습니다',
    quoteBasisChanged:
      '구매 요건이 변경되었습니다. 초안 입력은 유지되지만 견적 증빙은 최신 요건과 일치해야 합니다.',
    frozenRules: '제출 시 적용 규칙',
    frozenRulesHint:
      '기준을 엄격히 초과하는 금액에만 해당 견적 증빙 또는 결재 단계가 필요합니다. 이후 규칙 변경은 이 제출에 영향을 주지 않습니다.',
    ruleLabels: {
      purchase_quotes: '공급업체 3개 견적 기준',
      spend_vp: '담당 임원 결재 기준',
      spend_gm: '총괄 책임자 결재 기준',
    },
    staleQuoteUpload:
      '처리 버전이 변경되었습니다. 견적 증빙 업로드 전에 신청을 새로고침하세요.',
    ordersTitle: '구매 주문',
  },
};

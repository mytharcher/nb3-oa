export default {
  paymentRequestsForm: {
    new: '새 지급 신청',
    edit: '지급 신청 편집',
    description:
      '완성된 신청을 제출하거나 초안으로 저장하세요. 제출 시 필수 업무 사실을 다시 확인합니다.',
    save: '초안 저장',
    saved: '지급 초안 저장됨',
    draft: '초안',
    maxFiles: '증빙 파일을 최대 10개 선택하세요.',
    limit: '텍스트가 길이 제한을 초과합니다.',
    required: '필수 입력 항목입니다.',
    amountInvalid:
      '지원되는 정확한 센트 범위 내에서 소수 둘째 자리까지의 음수가 아닌 금액을 입력하세요.',
    invalid: '필드를 확인하세요.',
    notEditable: '더 이상 편집할 수 없는 레코드입니다.',
    inactive: '사용 불가 — 적격 옵션을 선택하세요',
    select: '옵션 선택',
    unknown:
      '결과가 확인되지 않았습니다. 입력을 유지하고 정확히 같은 요청을 재시도하세요.',
    replay: '원래 요청 대사',
    latest:
      '최신 버전을 불러왔습니다. 입력은 유지됩니다. 다시 저장하기 전에 최신 원본 옵션과 비교하세요.',
    leaveReady:
      '나가려면 원래 대상을 다시 클릭하세요. 추가 편집 시 이 확인이 취소됩니다.',
    applicantId: '신청자',
    reason: '지급 사유',
    sourceMode: '사전 승인 원본',
    contract: '계약',
    contractVersion: '계약 버전',
    contractId: '계약',
    counterparty: '계약 상대방',
    customerAccountHint:
      '고객 계약에는 공급업체 은행 계좌가 없습니다. 필요한 경우 출납 담당자의 예외 보고 후 보호 계좌를 정정할 수 있습니다.',
    purchase: '승인된 구매 주문',
    none: '사전 승인 없음',
    purchaseOrderId: '구매 주문',
    noPriorApprovalReason: '사전 승인 없는 지급 설명',
    vendorId: '수취인',
    amount: '금액(위안)',
    invoiceNumber: '청구서 번호',
    paymentMethod: '지급 방식',
    orderStatus: '주문 상태',
    approved: '승인 금액',
    paid: '기지급액',
    pending: '대기 지급액',
    available: '가용 금액',
    cents: '센트',
    overApproval:
      '대기 지급을 포함한 누적 승인 한도를 초과하면 전체 결재가 필요합니다. 초과 지급 신청도 가능합니다.',
    frozenHint: '원본, 수취인, 금액 및 청구서는 제출 시 고정됩니다.',
    voucherAttachments: '지급 증빙',
    attachments: '청구서 증빙',
    uploadHint:
      'PDF, JPEG, PNG, WebP, 최대 5MB. 선택을 제거해도 저장된 증빙은 유지됩니다.',
    fileSize: '비어 있지 않은 최대 5MB 파일을 선택하세요.',
    fileType: '확장자가 일치하는 PDF, JPEG, PNG, WebP 파일을 선택하세요.',
    selectEvidence: '저장된 증빙 선택 / 업로드 대사',
    uploading: '증빙 업로드 또는 읽는 중…',
    uploadUnknown:
      '업로드 결과가 확인되지 않았습니다. 다시 업로드하기 전에 저장된 증빙을 읽고 확인하세요. 자동 재시도는 하지 않습니다.',
    emptyEvidence: '저장된 증빙 없음.',
    evidenceMissing:
      '일부 증빙에 더 이상 접근할 수 없습니다. 새로고침하거나 권한을 확인하세요.',
    removeEvidence: '선택에서 {{name}} 제거',
    bank: {
      title: '비공개 수취 계좌',
      denied: '이 지급 계좌에 접근할 수 없습니다.',
      missing: '지급 계좌가 기록되지 않았습니다.',
      correct: '지급 계좌 정정',
      unavailable: '계좌 정정은 처리 예외 중 신청자 또는 생성자만 가능합니다.',
      bankName: '은행',
      bankAccount: '계좌 번호',
      bankAccountName: '예금주',
      reason: '정정 사유',
      saved: '지급 계좌 정정됨',
      unknown:
        '쓰기 결과가 확인되지 않았습니다. 최신 계좌를 읽고 비교한 후 명시적으로 다시 제출하세요.',
      conflict:
        '계좌 또는 지급 버전이 변경되었습니다. 최신 사실을 불러오세요. 편집 내용은 유지됩니다.',
      reconciled:
        '최신 사실을 불러왔습니다. 유지한 입력과 비교하고 새 쓰기를 명시적으로 확인하세요.',
    },
  },
};

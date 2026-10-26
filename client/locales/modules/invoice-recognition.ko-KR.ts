export default {
  invoiceRecognition: {
    currentValues: '현재 미저장 값',
    reload: '저장 결과 새로고침',
    receivedAt: '결과 수신: {{time}}',
    notConfigured:
      '청구서 게이트웨이가 연결되지 않았습니다. 청구서 내용을 직접 입력할 수 있습니다.',
    title: '청구서 인식 및 검증',
    readPermission: '청구서 결과 읽기',
    recognizePermission: '편집 가능한 청구서 첨부 인식',
    verifyPermission: '권한이 있는 청구서 행 검증',
    recognizeAttachment: '첨부 {{index}} 인식',
    verifyAttachment: '청구서 검증 · 첨부 {{index}}',
    processing: '청구서 처리 중…',
    failed:
      '작업을 완료할 수 없습니다. 접근 권한과 게이트웨이 설정을 확인하고 재시도하세요. 입력 값은 유지됩니다.',
    changed:
      '행이 변경되었습니다. 결과를 적용하거나 신뢰하기 전에 작업을 다시 실행하세요.',
    unconfirmed: '결과가 확인되지 않았습니다.',
    recover: '외부 결과 확인',
    reference: '검증 참조: {{reference}}',
    confirmTitle: '인식된 청구서 검토',
    confirmDescription:
      '제안을 원본 첨부와 비교하세요. 적용은 저장되지 않은 이 행만 변경하며 청구서 저장, 제출 또는 검증을 수행하지 않습니다.',
    number: '청구서 번호',
    date: '청구서 날짜',
    amount: '세금 포함 총액',
    cancel: '취소',
    apply: '이 행에 적용',
    states: {
      not_checked: '확인하지 않음',
      pending: '처리 대기',
      running: '처리 중',
      recognized: '인식됨. 적용 전에 검토하세요',
      multiple: '청구서가 여러 개입니다. 첨부를 나누거나 행을 직접 입력하세요.',
      unreadable: '청구서를 인식하지 못했습니다. 직접 입력하세요.',
      rejected: '외부 서비스가 청구서를 처리하지 못했습니다.',
      valid: '외부 검증이 현재 청구서 사실과 일치합니다.',
      mismatch: '청구서 사실이 외부 검증과 일치하지 않습니다.',
      not_found:
        '일치하는 청구서를 찾지 못했습니다. 재무팀에 검토를 요청하세요.',
      unknown:
        '결과가 확인되지 않았습니다. 재시도 전에 외부 결과를 조회하세요.',
    },
  },
};

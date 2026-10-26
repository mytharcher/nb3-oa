export default {
  financeIntegration: {
    title: '재무 시스템',
    readPermission: '재무 동기화 보기',
    sendPermission: '재무 항목 전송 및 대사',
    send: '재무 시스템으로 전송',
    resend: '전송 재시도',
    lookup: '외부 결과 확인',
    reload: '저장 상태 새로고침',
    retry: '다시 시도',
    cancel: '취소',
    confirmSend: '전송',
    confirmTitle: '지급한 신청을 재무 시스템으로 보내시겠습니까?',
    confirmDescription:
      '승인된 회계 사실을 연결된 재무 시스템으로 보냅니다. 추가 지급은 하지 않습니다. 재시도 시 동일한 업무 참조를 사용합니다.',
    notConfigured:
      '재무 게이트웨이가 연결되지 않았습니다. 관리자에게 연결 완료를 요청하세요.',
    loadFailed:
      '재무 상태를 불러올 수 없습니다. 접근 권한을 확인하거나 재시도하세요.',
    actionFailed:
      '작업을 확인하지 못했습니다. 재시도 전에 상태를 새로고침하세요.',
    conflict:
      '첫 전송 후 회계 사실 또는 대상이 변경되었습니다. 진행 전에 재무팀과 기존 항목을 대사하세요.',
    confirmBeforeRetry:
      '수신 확인은 전기 증명이 아닙니다. 외부 결과를 확인하고 필요하면 동일한 요청을 재시도하세요.',
    voucher: '외부 전표: {{number}}',
    states: {
      not_sent: '전송되지 않음',
      sending: '전송 또는 결과 확인 중',
      accepted: '재무 시스템 수신됨. 전기 미확인',
      posted: '전표 생성됨',
      rejected: '재무 시스템이 거부함',
      unknown: '결과 확인 필요',
    },
    results: {
      transport: '결과 확인 전에 연결이 종료되었습니다.',
      unconfirmed: '재무 시스템이 확인된 결과를 반환하지 않았습니다.',
      invalid_receipt: '수신 내역을 요청과 연결하지 못했습니다.',
      not_found:
        '이번 확인에서 외부 레코드를 찾지 못했습니다. 이전 수신 내역은 유효합니다.',
      invalid_mapping: '재무 계정 또는 공급업체 매핑을 확인해야 합니다.',
      invalid_document: '재무 시스템이 문서 사실을 거부했습니다.',
      duplicate_source: '외부 항목에서 이 업무 참조를 이미 사용합니다.',
      accounting_period_closed: '회계 기간이 마감되었습니다.',
      other: '재무팀에 외부 결과 검토를 요청하세요.',
    },
  },
};

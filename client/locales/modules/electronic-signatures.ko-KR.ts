export default {
  electronicSignatures: {
    archivedHint:
      '서명 서비스가 완료를 확인했습니다. 검증된 서명 PDF를 이 신청과 함께 보관했습니다.',
    reference: '서명 참조: {{value}}',
    completedAction: '전자서명 보관됨',
    title: '전자서명',
    readPermission: '서명 문서 보기',
    sendPermission: '서명 전송 및 복구',
    channel: '실행 채널',
    physical: '실물 인감',
    electronic: '전자서명',
    channelHint:
      '결재 전에 선택하세요. 전자서명에는 승인된 PDF 하나가 필요하며 종이 부수가 없습니다.',
    hint: '승인된 PDF를 설정된 서명 서비스로 보냅니다. 서명 문서를 검증하고 보관한 후에만 완료를 확인합니다.',
    notConfigured: '전자서명이 연결되지 않았습니다. 관리자에게 문의하세요.',
    notEligible:
      '서명에는 승인된 최신 PDF 문서가 필요합니다. 전자 인감 신청에는 PDF가 정확히 하나 있어야 합니다.',
    loadFailed: '서명 상태를 불러오지 못했거나 볼 권한이 없습니다.',
    actionFailed:
      '작업을 완료하지 못했습니다. 재시도 전에 상태를 새로고침하세요.',
    retry: '다시 시도',
    send: '서명 요청 전송',
    refresh: '상태 확인 / 복구',
    open: '서명 계속',
    download: '서명 PDF 다운로드',
    recovery:
      '원격 결과 또는 보관 확인이 필요합니다. 상태를 확인하여 동일한 서명 요청을 복구하세요.',
    signedAt: '서명 시간 {{at}}',
    confirmTitle: '승인된 PDF를 서명 요청으로 보내시겠습니까?',
    confirmHint:
      '설정된 서명 서비스가 승인 문서를 받습니다. 재시도 시 동일한 서명 요청을 사용합니다.',
    cancel: '취소',
    states: {
      not_sent: '전송되지 않음',
      pending: '제출 대기',
      sending: '전송 중',
      accepted: '서명 서비스 접수됨',
      signing: '서명 대기',
      unknown: '결과 확인 대기',
      archivePending: '서명됨 — 보관 복구 필요',
      archived: '서명 문서 보관됨',
      rejected: '서명 서비스가 거부함',
      cancelled: '서명 서비스가 취소함',
    },
  },
};

export default {
  workItems: {
    authz: {
      confirmationOwned: '내가 확인하는 할 일',
      handoverConfirmation: '확인 책임 이전',

      title: '일반 업무 항목',
      owned: '내가 생성함',
      readable: '내가 생성, 소유 또는 자격이 있는 할 일',
      view: '보기',
      create: '생성',
      edit: '편집',
      dispatch: '배정',
      claim: '맡기',
      release: '해제',
      complete: '완료',
      confirm: '확인',
      return: '반려',
      block: '차단',
      resume: '재개',
      reassign: '재할당',
      cancel: '취소',
      forceComplete: '강제 완료',
    },
    notifications: {
      title: '업무 항목 업데이트',
      body: '일반 할 일이 변경되었습니다. 애플리케이션을 열어 확인하세요.',
    },
    errors: {
      ACCESS_DENIED: '할 일 또는 작업에 접근할 수 없습니다.',
      NOT_FOUND: '할 일을 찾지 못했습니다.',
      REASON_REQUIRED: '사유가 필요합니다.',
      RESULT_REQUIRED: '완료 결과가 필요합니다.',
      INVALID_INPUT:
        '입력 또는 상태가 유효하지 않습니다. 새로고침 후 재시도하세요.',
      INVALID_TARGET:
        '입력 또는 상태가 유효하지 않습니다. 새로고침 후 재시도하세요.',
      INVALID_ATTACHMENT:
        '입력 또는 상태가 유효하지 않습니다. 새로고침 후 재시도하세요.',
      VERSION_CONFLICT:
        '입력 또는 상태가 유효하지 않습니다. 새로고침 후 재시도하세요.',
      COMMAND_CONFLICT:
        '입력 또는 상태가 유효하지 않습니다. 새로고침 후 재시도하세요.',
    },
  },
};

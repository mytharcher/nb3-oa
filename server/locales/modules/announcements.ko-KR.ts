export default {
  announcements: {
    authz: {
      title: '공지',
      owned: '내가 게시함',
      readable: '내 게시물 및 받은 공지',
      view: '공지 읽기',
      create: '공지 초안 생성',
      edit: '내 초안 편집',
      publish: '내 공지 게시',
      revoke: '내 공지 철회',
      remind: '미확인 수신자에게 알림',
      receipts: '내 수신자 명단 읽기',
      confirm: '내 수신 확인',
    },
    notifications: {
      title: '회사 공지',
      body: '새 공지가 있습니다. 애플리케이션을 열어 읽으세요.',
    },
    errors: {
      ACCESS_DENIED: '공지 또는 작업에 접근할 수 없습니다.',
      NOT_FOUND: '공지를 찾지 못했습니다.',
      INVALID_INPUT: '공지 입력 또는 유효 기간이 유효하지 않습니다.',
      INVALID_AUDIENCE: '대상에 사용할 수 없는 부서 또는 업무 역할이 있습니다.',
      EMPTY_AUDIENCE: '공지에 활성 수신자가 없습니다.',
      INVALID_ATTACHMENT: '첨부가 유효하지 않거나 사용할 수 없습니다.',
      INVALID_STATE: '현재 상태에서 사용할 수 없는 작업입니다.',
      VERSION_CONFLICT: '공지가 변경되었습니다. 다시 불러와 재시도하세요.',
      COMMAND_CONFLICT: '다른 입력으로 이미 사용한 요청 식별자입니다.',
      KNOWLEDGE_UNAVAILABLE: '연결 문서를 사용할 수 없거나 읽을 수 없습니다.',
    },
  },
};

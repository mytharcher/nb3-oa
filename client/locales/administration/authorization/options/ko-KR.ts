import type { LocaleResource } from '@nocobase/i18n';

/**
 * Display vocabulary shared by the client and server locale catalogues.
 */
const enUS = {
  // Workspace sections this plugin registers through `authz.ui`.
  sections: {
    pages: '페이지 권한',
    page: '페이지',
    business: '업무 권한',
    administration: '관리',
    other: '기타',
  },
  options: {
    defaultAndSharing: '기본 데이터 범위 사용',
    actions: {
      assign: '할당 관리',
      configure: '설정',
      inspect: '권한 검사',

      read: '읽기',
      create: '생성',
      update: '업데이트',
      delete: '삭제',
      access: '접근',
    },
    settingsModules: { authorization: '권한 관리' },
    pages: {
      all: '모든 페이지',
      allDescription:
        '나중에 추가되는 페이지를 포함하여 모든 페이지에 접근을 허용합니다.',
    },
    settings: {
      inspector: '권한 검사',
      'permission-sets': '권한 집합',
    },
    subjectTypes: {
      authenticated: '로그인한 모든 사용자',
      authenticatedDescription:
        '유효한 로그인 세션이 있는 모든 사용자에게 적용됩니다.',
      user: '사용자',
    },
    recordAccessPolicies: {
      allRecords: '모든 레코드',
      recordsIOwn: '내가 소유한 레코드',
      recordsICreated: '내가 생성한 레코드',
      customFilter: '사용자 지정 필터',
      customFilterHint: '사용자 지정 필터 조건으로 레코드를 선택합니다.',
    },
  },
};

/** English is the source of truth for this catalogue's shape. */
export type AuthorizationServerResource = LocaleResource<typeof enUS>;

export default enUS;

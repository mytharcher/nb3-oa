import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  'common.close': '닫기',
  nav: { apiKeys: 'API 키' },
  page: {
    search: '키 이름 검색',
    retry: '다시 시도',
    clear: '필터 초기화',
    noResults: '검색과 일치하는 키가 없습니다.',
    loading: '로딩 중',
    title: 'API 키',
    description:
      '스크립트와 연동 서비스가 내 권한으로 이 애플리케이션을 호출하도록 키를 만듭니다.',
    add: '키 생성',
    empty: '아직 API 키가 없습니다.',
    unnamed: '이름 없는 키',
    never: '없음',
    unused: '사용한 적 없음',
    active: '활성',
    expired: '만료됨',
    disabled: '비활성',
    columns: {
      name: '이름',
      key: '키',
      status: '상태',
      lastUsed: '최근 사용',
      expires: '만료',
      actions: '작업',
    },
    actions: { revoke: '철회', menu: '"{{name}}" 작업' },
  },
  form: {
    title: 'API 키 생성',
    description: '이 키는 내 계정과 동일한 권한으로 작동합니다.',
    name: '이름',
    namePlaceholder: '야간 내보내기 작업',
    expiry: '만료',
    expiryChoices: {
      never: '없음',
      '7': '7일 후',
      '30': '30일 후',
      '90': '90일 후',
      '365': '1년 후',
    },
    cancel: '취소',
    create: '생성',
  },
  reveal: {
    title: '지금 키를 복사하세요',
    description: '“{{name}}”을 생성했습니다. 키는 지금 한 번만 표시됩니다.',
    usage: 'x-api-key 요청 헤더에 넣어 전송하세요.',
    copy: '키 복사',
    done: '완료',
  },
  revoke: {
    success: '"{{name}}" 키를 철회했습니다',
    title: '"{{name}}" 키를 철회하시겠습니까?',
    description:
      '“{{name}}”을 사용하는 요청은 즉시 실패합니다. 되돌릴 수 없습니다.',
    cancel: '취소',
    confirm: '철회',
  },
  errors: {
    forbidden: '키를 볼 수 없습니다. 관리자에게 문의하세요.',
    notFound: 'API 키 관리를 사용할 수 없습니다. 워크벤치로 돌아가세요.',
    nameRequired: '키 이름을 입력하세요.',
    copyFailed: '키를 복사하지 못했습니다. 직접 선택하여 복사하세요.',
    loadFailed: 'API 키를 불러오지 못했습니다.',
    createFailed: 'API 키를 생성하지 못했습니다.',
    revokeFailed: 'API 키를 철회하지 못했습니다.',
  },
};

/**
 * English is the source of truth for this plugin's locale shape.
 */
export type ApiKeysResource = LocaleResource<typeof enUS>;

export default enUS;

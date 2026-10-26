const enUS = {
  approvalUi: {
    timeline: {
      onBehalf: '{{name}}의',
      showEvents: '변경 내용({{count}})',
      system: '시스템 업데이트 {{count}}개',
      empty: '아직 발생한 일이 없습니다.',
    },
    progress: {
      empty: '결재가 아직 시작되지 않았습니다.',
      copies: '참조 대상',
      read: '읽음',
      unread: '읽지 않음',
      step: {
        current: '진행 중',
        rejected: '거절됨',
        returned: '반려됨',
        ended: '종료됨',
        skipped: '건너뜀',
      },
      tally: {
        answered: '{{total}}개 중 {{count}}개 응답',
        needed: '통과에 {{count}}개 필요',
      },
    },
    branches: {
      done: '{{total}}개 중 {{count}}개 완료',
      blocked: '신청 진행 지연',
    },
    receipts: {
      read: '읽기',
      confirmed: '확인됨',
      empty: '아직 아무도 받지 않았습니다.',
    },
    preview: {
      title: '결정 담당자',
      loading: '경로 계산 중…',
      submit: '제출',
      finished: '결정됨',
      automatic: '결정 없이 승인됨',
      parallel: '병렬로',
      optional: '선택 사항',
      nobody: '아직 적격자 없음',
      none: '결재 없이 결정되는 신청입니다.',
      skipped: '불필요: {{stages}}',
    },
    actions: {
      more: '더 보기',
      all: '작업',
      admin: '관리',
      confirm: '{{action}}하시겠습니까?',
      loading: '로딩 중…',
      loadFailed: '불러오지 못했습니다. 닫고 다시 시도하세요.',
      cancel: '취소',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of approval-ui has. */
export type ApprovalUiLocale = Widen<typeof enUS>;

const locale: ApprovalUiLocale = enUS;

export default locale;
